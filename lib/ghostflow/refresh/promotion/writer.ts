/**
 * GhostFlow promotion C2 writer — sole write-capable promotion module.
 *
 * TOCTOU limitation: there is a small interval between the final current-production
 * re-lock read and filesystem rename. Node does not provide compare-and-swap rename
 * by content hash. This is a best-effort optimistic lock for a local single-operator
 * workflow — not transactional database semantics. No lockfile system in C2.
 */

import { randomUUID } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { validateCurrentProductionArtifact, validateProposedProductionArtifact } from '../candidates/artifactValidation';
import { GHOSTFLOW_CANDIDATE_ARTIFACT_IDS } from '../candidates/types';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../registry';
import type { GhostFlowRefreshIssue } from '../types';
import { dryRunGhostFlowCandidatePromotion } from './plan';
import { resolvePromotionRegistryDestination } from './pathSafety';
import type {
  GhostFlowPromotionApplyFailure,
  GhostFlowPromotionApplyResult,
  GhostFlowPromotionPlan,
  GhostFlowPromotionStatus,
  GhostFlowPromotionSummary,
} from './types';

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

const WRITABLE_ARTIFACT_IDS = new Set<string>(GHOSTFLOW_CANDIDATE_ARTIFACT_IDS);

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function applyFailure(
  status: Exclude<GhostFlowPromotionStatus, 'promotion_dry_run_ok' | 'promotion_applied'>,
  exitCode: number,
  issues: GhostFlowRefreshIssue[],
  partial?: Partial<GhostFlowPromotionSummary>,
  plan?: GhostFlowPromotionPlan
): GhostFlowPromotionApplyFailure {
  return {
    ok: false,
    status,
    exitCode,
    issues,
    plan,
    summary: {
      status,
      apply: true,
      exitCode,
      issueCodes: issues.map((issue) => issue.code),
      ...partial,
    },
  };
}

async function bestEffortUnlink(
  unlinkFn: typeof unlink,
  path: string,
  issues: GhostFlowRefreshIssue[]
): Promise<void> {
  try {
    await unlinkFn(path);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return;
    }
    issues.push(
      blockIssue(
        'promotion_temp_cleanup_failed',
        err.message ?? `Failed to clean temporary promotion file: ${path}`
      )
    );
  }
}

export type GhostFlowPromotionWriterDeps = {
  /** Test seam only — defaults to node:fs/promises.rename */
  rename?: typeof rename;
  /** Test seam only — defaults to node:fs/promises.readFile */
  readFile?: typeof readFile;
  /** Test seam only — defaults to node:fs/promises.writeFile */
  writeFile?: typeof writeFile;
  /** Test seam only — defaults to node:fs/promises.unlink */
  unlink?: typeof unlink;
  /**
   * Test seam only — when provided, used for post-rename destination readback
   * instead of the normal readFile path (rename may already have succeeded).
   */
  readDestinationAfterRename?: (destinationPath: string) => Promise<string>;
};

/**
 * Low-level writer for a validated PromotionPlan.
 * Exported for C2 commit-point / failure-injection tests.
 * Production CLI must use applyGhostFlowCandidatePromotion only.
 */
export async function writeValidatedPromotionPlan(
  input: { repoRoot: string; plan: GhostFlowPromotionPlan },
  deps?: GhostFlowPromotionWriterDeps
): Promise<GhostFlowPromotionApplyResult> {
  const renameFn = deps?.rename ?? rename;
  const readFileFn = deps?.readFile ?? readFile;
  const writeFileFn = deps?.writeFile ?? writeFile;
  const unlinkFn = deps?.unlink ?? unlink;
  const plan = input.plan;
  const cleanupIssues: GhostFlowRefreshIssue[] = [];

  if (!WRITABLE_ARTIFACT_IDS.has(plan.artifactId)) {
    return applyFailure(
      'promotion_write_failed',
      1,
      [blockIssue('promotion_artifact_not_writable', `Artifact is not promotion-writable: ${plan.artifactId}`)],
      { artifactId: plan.artifactId },
      plan
    );
  }

  const registryEntry = REGISTRY_BY_ID.get(plan.artifactId);
  if (!registryEntry) {
    return applyFailure(
      'promotion_write_failed',
      1,
      [blockIssue('promotion_registry_missing', `Registry entry missing for ${plan.artifactId}`)],
      { artifactId: plan.artifactId },
      plan
    );
  }

  if (plan.destinationRelativePath !== registryEntry.artifactPath) {
    return applyFailure(
      'promotion_stale_current_production',
      3,
      [
        blockIssue(
          'promotion_stale_current_production',
          'Plan destinationRelativePath does not match current registry artifactPath'
        ),
      ],
      { artifactId: plan.artifactId },
      plan
    );
  }

  const destination = resolvePromotionRegistryDestination({
    repoRoot: input.repoRoot,
    artifactPath: registryEntry.artifactPath,
  });
  if (!destination.ok) {
    return applyFailure(
      'promotion_write_failed',
      1,
      destination.issues,
      { artifactId: plan.artifactId, destinationPath: registryEntry.artifactPath },
      plan
    );
  }

  const resolvedDestination = destination.value.absolutePath;
  if (plan.destinationAbsolutePath !== resolvedDestination) {
    return applyFailure(
      'promotion_write_failed',
      1,
      [
        blockIssue(
          'promotion_destination_mismatch',
          'Plan destinationAbsolutePath does not resolve to registry destination under repoRoot'
        ),
      ],
      { artifactId: plan.artifactId, destinationPath: registryEntry.artifactPath },
      plan
    );
  }

  const proposedValidated = validateProposedProductionArtifact(
    plan.artifactId,
    plan.validatedProposedArtifact
  );
  if (!proposedValidated.ok) {
    return applyFailure('promotion_validation_failed', 5, proposedValidated.issues, {
      artifactId: plan.artifactId,
      destinationPath: plan.destinationRelativePath,
    }, plan);
  }

  if (
    proposedValidated.value.promotionPayloadSha256 !== plan.proposedPromotionPayloadSha256 ||
    proposedValidated.value.observationAsOf !== plan.candidateObservationAsOf ||
    !(proposedValidated.value.observationAsOf > plan.currentObservationAsOf)
  ) {
    return applyFailure(
      'promotion_validation_failed',
      5,
      [
        blockIssue(
          'promotion_proposed_artifact_mismatch',
          'Plan validatedProposedArtifact no longer matches planned promotion payload/date gates'
        ),
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  const bytes = `${JSON.stringify(proposedValidated.value.artifact, null, 2)}\n`;
  const destinationDir = dirname(resolvedDestination);
  const destinationBase = basename(resolvedDestination);
  const tempPath = join(
    destinationDir,
    `${destinationBase}.promotion-${process.pid}-${randomUUID()}.tmp`
  );

  try {
    await writeFileFn(tempPath, bytes, { flag: 'wx' });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return applyFailure(
      'promotion_write_failed',
      1,
      [
        blockIssue(
          'promotion_temp_write_failed',
          err.message ?? 'Failed to create temporary promotion sibling'
        ),
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  let tempText: string;
  try {
    tempText = await readFileFn(tempPath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_validation_failed',
      5,
      [
        blockIssue(
          'promotion_temp_unreadable',
          err.message ?? 'Failed to read temporary promotion sibling'
        ),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  let tempParsed: unknown;
  try {
    tempParsed = JSON.parse(tempText) as unknown;
  } catch {
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_validation_failed',
      5,
      [
        blockIssue('promotion_temp_invalid_json', 'Temporary promotion sibling is not valid JSON'),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  const tempValidated = validateProposedProductionArtifact(plan.artifactId, tempParsed);
  if (
    !tempValidated.ok ||
    tempValidated.value.promotionPayloadSha256 !== plan.proposedPromotionPayloadSha256 ||
    tempValidated.value.observationAsOf !== plan.candidateObservationAsOf
  ) {
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_validation_failed',
      5,
      [
        ...(tempValidated.ok
          ? [
              blockIssue(
                'promotion_temp_hash_mismatch',
                'Temporary promotion sibling does not match planned promotion payload'
              ),
            ]
          : tempValidated.issues),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  // Commit-point optimistic re-lock (immediately before rename).
  let currentRawText: string;
  try {
    currentRawText = await readFileFn(resolvedDestination, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      err.code === 'ENOENT' ? 'promotion_validation_failed' : 'promotion_write_failed',
      err.code === 'ENOENT' ? 5 : 1,
      [
        blockIssue(
          'promotion_current_production_unreadable',
          err.message ?? 'Failed to re-read current production before rename'
        ),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  let currentParsed: unknown;
  try {
    currentParsed = JSON.parse(currentRawText) as unknown;
  } catch {
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_validation_failed',
      5,
      [
        blockIssue(
          'promotion_current_production_invalid',
          'Current production is not valid JSON at commit-point re-lock'
        ),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  const currentValidated = validateCurrentProductionArtifact(
    plan.artifactId,
    currentParsed,
    registryEntry.artifactPath
  );
  if (!currentValidated.ok) {
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure('promotion_validation_failed', 5, [
      ...currentValidated.issues,
      ...cleanupIssues,
    ], { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath }, plan);
  }

  const current = currentValidated.value;
  if (
    current.artifactId !== plan.artifactId ||
    registryEntry.artifactPath !== plan.destinationRelativePath ||
    current.observationAsOf !== plan.currentObservationAsOf ||
    current.promotionPayloadSha256 !== plan.currentPromotionPayloadSha256 ||
    (plan.currentSourcePublishedAt !== undefined &&
      current.sourcePublishedAt !== plan.currentSourcePublishedAt)
  ) {
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_stale_current_production',
      3,
      [
        blockIssue(
          'promotion_stale_current_production',
          'Current production changed after plan construction (commit-point re-lock failed)'
        ),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  try {
    await renameFn(tempPath, resolvedDestination);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    await bestEffortUnlink(unlinkFn, tempPath, cleanupIssues);
    return applyFailure(
      'promotion_write_failed',
      1,
      [
        blockIssue(
          'promotion_rename_failed',
          err.message ?? 'Failed to rename temporary promotion sibling over production destination'
        ),
        ...cleanupIssues,
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  let postText: string;
  try {
    postText = deps?.readDestinationAfterRename
      ? await deps.readDestinationAfterRename(resolvedDestination)
      : await readFileFn(resolvedDestination, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return applyFailure(
      'promotion_post_write_verification_failed',
      6,
      [
        blockIssue(
          'promotion_post_write_unreadable',
          err.message ?? 'Failed to read production destination after rename'
        ),
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  let postParsed: unknown;
  try {
    postParsed = JSON.parse(postText) as unknown;
  } catch {
    return applyFailure(
      'promotion_post_write_verification_failed',
      6,
      [blockIssue('promotion_post_write_invalid_json', 'Production destination is not valid JSON after rename')],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  const postValidated = validateProposedProductionArtifact(plan.artifactId, postParsed);
  if (
    !postValidated.ok ||
    postValidated.value.promotionPayloadSha256 !== plan.proposedPromotionPayloadSha256 ||
    postValidated.value.observationAsOf !== plan.candidateObservationAsOf
  ) {
    return applyFailure(
      'promotion_post_write_verification_failed',
      6,
      [
        ...(postValidated.ok
          ? [
              blockIssue(
                'promotion_post_write_hash_mismatch',
                'Production destination after rename does not match planned promotion payload'
              ),
            ]
          : postValidated.issues),
      ],
      { artifactId: plan.artifactId, destinationPath: plan.destinationRelativePath },
      plan
    );
  }

  return {
    ok: true,
    status: 'promotion_applied',
    exitCode: 0,
    plan,
    issues: [],
    summary: {
      artifactId: plan.artifactId,
      status: 'promotion_applied',
      candidateIdentitySha256: plan.candidateIdentitySha256,
      currentObservationAsOf: plan.currentObservationAsOf,
      candidateObservationAsOf: plan.candidateObservationAsOf,
      destinationPath: plan.destinationRelativePath,
      apply: true,
      exitCode: 0,
    },
  };
}

/**
 * Public production apply entrypoint.
 * Starts only from repoRoot + explicit envelopePath.
 * Accepts no caller-supplied plan, mapper, or currentProductionRaw.
 */
export async function applyGhostFlowCandidatePromotion(input: {
  repoRoot: string;
  envelopePath: string;
}): Promise<GhostFlowPromotionApplyResult> {
  const dryRun = await dryRunGhostFlowCandidatePromotion({
    repoRoot: input.repoRoot,
    envelopePath: input.envelopePath,
  });

  if (!dryRun.ok) {
    return {
      ok: false,
      status: dryRun.status,
      exitCode: dryRun.exitCode,
      issues: dryRun.issues,
      summary: {
        ...dryRun.summary,
        apply: true,
      },
    };
  }

  return writeValidatedPromotionPlan({
    repoRoot: input.repoRoot,
    plan: dryRun.plan,
  });
}
