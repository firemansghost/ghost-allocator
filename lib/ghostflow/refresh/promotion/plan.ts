import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY } from '../candidateMappers';
import {
  validateCurrentProductionArtifact,
  validateProposedProductionArtifact,
} from '../candidates/artifactValidation';
import type { GhostFlowCandidateEnvelope } from '../candidates/types';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../registry';
import type {
  GhostFlowCandidateMapper,
  GhostFlowNormalizedObservation,
  GhostFlowRefreshIssue,
  GhostFlowRefreshRegistryEntry,
} from '../types';
import { validateCandidateEnvelopeForPromotion } from './envelopeValidation';
import { resolvePromotionEnvelopePath } from './cliArgs';
import type {
  GhostFlowPromotionDryRunResult,
  GhostFlowPromotionPlan,
  GhostFlowPromotionStatus,
  GhostFlowPromotionSummary,
} from './types';

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

const MAPPER_BY_ID = new Map(
  GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY.map((mapper) => [mapper.artifactId, mapper] as const)
);

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function failure(
  status: Exclude<GhostFlowPromotionStatus, 'promotion_dry_run_ok'>,
  exitCode: number,
  issues: GhostFlowRefreshIssue[],
  partial?: Partial<GhostFlowPromotionSummary>
): GhostFlowPromotionDryRunResult {
  return {
    ok: false,
    status,
    exitCode,
    issues,
    summary: {
      status,
      apply: false,
      exitCode,
      issueCodes: issues.map((issue) => issue.code),
      ...partial,
    },
  };
}

export type GhostFlowPromotionPlanInput = {
  repoRoot: string;
  envelope: GhostFlowCandidateEnvelope;
  /** Test injection only — production path uses registry mapper. */
  mapper?: GhostFlowCandidateMapper<unknown, unknown>;
  /** Test injection — skip filesystem read when provided. */
  currentProductionRaw?: unknown;
};

export type GhostFlowPromotionPlanResult =
  | { ok: true; plan: GhostFlowPromotionPlan; issues: GhostFlowRefreshIssue[] }
  | {
      ok: false;
      status: Exclude<GhostFlowPromotionStatus, 'promotion_dry_run_ok'>;
      exitCode: number;
      issues: GhostFlowRefreshIssue[];
    };

/**
 * Build a validated promotion plan from an already promotion-validated envelope.
 * Performs mapper replay, current-production optimistic lock, and newer-date gate.
 * Does not write any files.
 */
export async function buildGhostFlowPromotionPlan(
  input: GhostFlowPromotionPlanInput
): Promise<GhostFlowPromotionPlanResult> {
  const { repoRoot, envelope } = input;
  const artifactId = envelope.artifactId;

  const registryEntry = REGISTRY_BY_ID.get(artifactId);
  if (!registryEntry) {
    return {
      ok: false,
      status: 'promotion_validation_failed',
      exitCode: 5,
      issues: [blockIssue('promotion_registry_missing', `Registry entry missing for ${artifactId}`)],
    };
  }

  if (envelope.currentProduction.artifactPath !== registryEntry.artifactPath) {
    return {
      ok: false,
      status: 'promotion_stale_current_production',
      exitCode: 3,
      issues: [
        blockIssue(
          'promotion_stale_current_production',
          'Envelope currentProduction.artifactPath does not match registry destination'
        ),
      ],
    };
  }

  const mapper =
    input.mapper ??
    (MAPPER_BY_ID.get(artifactId) as GhostFlowCandidateMapper<unknown, unknown> | undefined);
  if (!mapper) {
    return {
      ok: false,
      status: 'promotion_mapper_replay_mismatch',
      exitCode: 4,
      issues: [blockIssue('promotion_mapper_missing', `No mapper registered for ${artifactId}`)],
    };
  }

  const mapperResult = mapper.map({
    normalized: envelope.normalizedObservation as GhostFlowNormalizedObservation<unknown>,
    registryEntry: registryEntry as GhostFlowRefreshRegistryEntry,
  });
  if (!mapperResult.ok) {
    return {
      ok: false,
      status: 'promotion_mapper_replay_mismatch',
      exitCode: 4,
      issues: [
        blockIssue(
          'promotion_mapper_replay_mismatch',
          mapperResult.issues.map((issue) => issue.message).join('; ') || 'Mapper replay failed'
        ),
        ...mapperResult.issues,
      ],
    };
  }

  const replayValidated = validateProposedProductionArtifact(artifactId, mapperResult.value);
  if (!replayValidated.ok) {
    return {
      ok: false,
      status: 'promotion_validation_failed',
      exitCode: 5,
      issues: replayValidated.issues,
    };
  }

  const envelopeProposedValidated = validateProposedProductionArtifact(
    artifactId,
    envelope.proposedArtifact
  );
  if (!envelopeProposedValidated.ok) {
    return {
      ok: false,
      status: 'promotion_validation_failed',
      exitCode: 5,
      issues: envelopeProposedValidated.issues,
    };
  }

  if (
    replayValidated.value.promotionPayloadSha256 !==
      envelope.candidateIdentity.promotionPayloadSha256 ||
    replayValidated.value.promotionPayloadSha256 !==
      envelopeProposedValidated.value.promotionPayloadSha256
  ) {
    return {
      ok: false,
      status: 'promotion_mapper_replay_mismatch',
      exitCode: 4,
      issues: [
        blockIssue(
          'promotion_mapper_replay_mismatch',
          'Current mapper/validator output does not match reviewed promotion payload hash'
        ),
      ],
    };
  }

  let currentRaw = input.currentProductionRaw;
  if (currentRaw === undefined) {
    const absolutePath = resolve(repoRoot, registryEntry.artifactPath);
    try {
      const text = await readFile(absolutePath, 'utf8');
      currentRaw = JSON.parse(text) as unknown;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return {
          ok: false,
          status: 'promotion_validation_failed',
          exitCode: 5,
          issues: [
            blockIssue(
              'promotion_current_production_missing',
              `Current production file missing: ${registryEntry.artifactPath}`
            ),
          ],
        };
      }
      return {
        ok: false,
        status: 'promotion_validation_failed',
        exitCode: 1,
        issues: [
          blockIssue(
            'promotion_current_production_unreadable',
            err.message ?? 'Failed to read or parse current production artifact'
          ),
        ],
      };
    }
  }

  const currentValidated = validateCurrentProductionArtifact(
    artifactId,
    currentRaw,
    registryEntry.artifactPath
  );
  if (!currentValidated.ok) {
    return {
      ok: false,
      status: 'promotion_validation_failed',
      exitCode: 5,
      issues: currentValidated.issues,
    };
  }

  const current = currentValidated.value;
  const fingerprint = envelope.currentProduction;

  if (
    current.artifactId !== fingerprint.artifactId ||
    registryEntry.artifactPath !== fingerprint.artifactPath ||
    current.observationAsOf !== fingerprint.observationAsOf ||
    current.promotionPayloadSha256 !== fingerprint.promotionPayloadSha256
  ) {
    return {
      ok: false,
      status: 'promotion_stale_current_production',
      exitCode: 3,
      issues: [
        blockIssue(
          'promotion_stale_current_production',
          'Current production no longer matches envelope.currentProduction reviewed baseline'
        ),
      ],
    };
  }

  if (fingerprint.sourcePublishedAt !== undefined) {
    if (current.sourcePublishedAt !== fingerprint.sourcePublishedAt) {
      return {
        ok: false,
        status: 'promotion_stale_current_production',
        exitCode: 3,
        issues: [
          blockIssue(
            'promotion_stale_current_production',
            'Current production sourcePublishedAt no longer matches envelope reviewed baseline'
          ),
        ],
      };
    }
  }

  const candidateAsOf = replayValidated.value.observationAsOf;
  const currentAsOf = current.observationAsOf;
  if (!(candidateAsOf > currentAsOf)) {
    return {
      ok: false,
      status: 'promotion_ineligible',
      exitCode: 2,
      issues: [
        blockIssue(
          'promotion_date_not_newer',
          `Candidate observationAsOf ${candidateAsOf} must be strictly newer than current ${currentAsOf}`
        ),
      ],
    };
  }

  const plan: GhostFlowPromotionPlan = {
    artifactId,
    candidateIdentitySha256: envelope.candidateIdentity.identitySha256,
    candidateIdentityPrefix: envelope.candidateIdentity.identityPrefix,
    currentObservationAsOf: currentAsOf,
    candidateObservationAsOf: candidateAsOf,
    currentPromotionPayloadSha256: current.promotionPayloadSha256,
    proposedPromotionPayloadSha256: replayValidated.value.promotionPayloadSha256,
    destinationRelativePath: registryEntry.artifactPath,
    destinationAbsolutePath: resolve(repoRoot, registryEntry.artifactPath),
    validatedProposedArtifact: replayValidated.value.artifact,
    ...(current.sourcePublishedAt ? { currentSourcePublishedAt: current.sourcePublishedAt } : {}),
    ...(replayValidated.value.sourcePublishedAt
      ? { candidateSourcePublishedAt: replayValidated.value.sourcePublishedAt }
      : {}),
    validatorId: replayValidated.value.validatorId,
  };

  return { ok: true, plan, issues: [] };
}

export async function dryRunGhostFlowCandidatePromotion(input: {
  repoRoot: string;
  envelopePath: string;
  mapper?: GhostFlowCandidateMapper<unknown, unknown>;
  currentProductionRaw?: unknown;
}): Promise<GhostFlowPromotionDryRunResult> {
  const pathResult = resolvePromotionEnvelopePath(input.repoRoot, input.envelopePath);
  if (!pathResult.ok) {
    return failure('promotion_envelope_invalid', 2, [
      blockIssue(pathResult.code, pathResult.error),
    ]);
  }

  let rawText: string;
  try {
    rawText = await readFile(pathResult.absolutePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return failure('promotion_envelope_invalid', err.code === 'ENOENT' ? 2 : 1, [
      blockIssue(
        'promotion_envelope_unreadable',
        err.message ?? 'Failed to read candidate envelope'
      ),
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return failure('promotion_envelope_invalid', 2, [
      blockIssue('promotion_envelope_invalid', 'Envelope is not valid JSON'),
    ]);
  }

  const validated = validateCandidateEnvelopeForPromotion(parsed);
  if (!validated.ok) {
    const first = validated.issues[0];
    const status: Exclude<GhostFlowPromotionStatus, 'promotion_dry_run_ok'> =
      first?.code === 'promotion_candidate_status_ineligible'
        ? 'promotion_ineligible'
        : 'promotion_envelope_invalid';
    return failure(status, 2, validated.issues, {
      artifactId:
        typeof (parsed as { artifactId?: unknown })?.artifactId === 'string' &&
        ['systematicFlowProxy', 'treasuryFuturesPositioningProxy', 'treasuryLongEndIncomeLens'].includes(
          (parsed as { artifactId: string }).artifactId
        )
          ? ((parsed as { artifactId: GhostFlowPromotionPlan['artifactId'] }).artifactId)
          : undefined,
    });
  }

  const planResult = await buildGhostFlowPromotionPlan({
    repoRoot: input.repoRoot,
    envelope: validated.value,
    mapper: input.mapper,
    currentProductionRaw: input.currentProductionRaw,
  });

  if (!planResult.ok) {
    return failure(planResult.status, planResult.exitCode, planResult.issues, {
      artifactId: validated.value.artifactId,
    });
  }

  const { plan } = planResult;
  return {
    ok: true,
    status: 'promotion_dry_run_ok',
    exitCode: 0,
    plan,
    issues: [],
    summary: {
      artifactId: plan.artifactId,
      status: 'promotion_dry_run_ok',
      candidateIdentitySha256: plan.candidateIdentitySha256,
      currentObservationAsOf: plan.currentObservationAsOf,
      candidateObservationAsOf: plan.candidateObservationAsOf,
      destinationPath: plan.destinationRelativePath,
      apply: false,
      exitCode: 0,
    },
  };
}

/** Convenience for tests constructing relative registry paths under a temp root. */
export function promotionRegistryArtifactJoin(
  repoRoot: string,
  relativePath: string
): string {
  return join(repoRoot, relativePath);
}
