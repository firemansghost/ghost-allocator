/**
 * Public GhostFlow promotion-receipt operation (R2).
 *
 * Loads an explicit envelope + registry-owned current production, builds an R1
 * receipt plan, then dry-runs or writes. Never mutates production.
 */

import { readFile } from 'node:fs/promises';
import {
  GHOSTFLOW_CANDIDATE_ARTIFACT_IDS,
  type GhostFlowCandidateArtifactId,
} from '../candidates/types';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../registry';
import type { GhostFlowCandidateMapper, GhostFlowRefreshIssue } from '../types';
import { resolvePromotionEnvelopePath } from './cliArgs';
import { resolvePromotionRegistryDestination } from './pathSafety';
import { buildGhostFlowPromotionReceiptPlan } from './receiptPlan';
import type {
  GhostFlowPromotionReceiptOperationFailure,
  GhostFlowPromotionReceiptOperationResult,
  GhostFlowPromotionReceiptPlan,
  GhostFlowPromotionReceiptPlanStatus,
  GhostFlowPromotionReceiptStatus,
  GhostFlowPromotionReceiptSummary,
} from './receiptTypes';
import { writeValidatedPromotionReceiptPlan } from './receiptWriter';

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

const CANDIDATE_ARTIFACT_ID_SET = new Set<string>(GHOSTFLOW_CANDIDATE_ARTIFACT_IDS);

function isCandidateArtifactId(value: string): value is GhostFlowCandidateArtifactId {
  return CANDIDATE_ARTIFACT_ID_SET.has(value);
}

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function operationFailure(
  status: GhostFlowPromotionReceiptOperationFailure['status'],
  exitCode: number,
  issues: GhostFlowRefreshIssue[],
  write: boolean,
  partial?: Partial<GhostFlowPromotionReceiptSummary>,
  plan?: GhostFlowPromotionReceiptPlan
): GhostFlowPromotionReceiptOperationFailure {
  return {
    ok: false,
    status,
    exitCode,
    issues,
    plan,
    summary: {
      status,
      write,
      exitCode,
      issueCodes: issues.map((issue) => issue.code),
      ...partial,
    },
  };
}

function mapPlanFailureStatus(
  status: Exclude<GhostFlowPromotionReceiptPlanStatus, 'promotion_receipt_plan_ok'>
): GhostFlowPromotionReceiptOperationFailure['status'] {
  return status;
}

/**
 * Record a Phase 1 promotion receipt for an explicitly selected envelope.
 *
 * Production path is always resolved from the current registry — callers cannot
 * supply an arbitrary production or receipt destination.
 *
 * R2 intentionally omits reviewedEnvelopeBasename so persisted bytes are
 * independent of envelope path presentation.
 */
export async function recordGhostFlowPromotionReceipt(input: {
  repoRoot: string;
  envelopePath: string;
  write: boolean;
  /** Test injection only — production path uses registry mapper. */
  mapper?: GhostFlowCandidateMapper<unknown, unknown>;
}): Promise<GhostFlowPromotionReceiptOperationResult> {
  const write = input.write;

  const pathResult = resolvePromotionEnvelopePath(input.repoRoot, input.envelopePath);
  if (!pathResult.ok) {
    return operationFailure(
      'promotion_receipt_envelope_invalid',
      2,
      [blockIssue(pathResult.code, pathResult.error)],
      write
    );
  }

  let rawText: string;
  try {
    rawText = await readFile(pathResult.absolutePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return operationFailure(
      'promotion_receipt_envelope_invalid',
      err.code === 'ENOENT' ? 2 : 1,
      [
        blockIssue(
          'promotion_receipt_envelope_unreadable',
          err.message ?? 'Failed to read candidate envelope'
        ),
      ],
      write
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return operationFailure(
      'promotion_receipt_envelope_invalid',
      2,
      [blockIssue('promotion_receipt_envelope_invalid', 'Envelope is not valid JSON')],
      write
    );
  }

  const artifactIdRaw =
    typeof parsed === 'object' &&
    parsed !== null &&
    typeof (parsed as { artifactId?: unknown }).artifactId === 'string'
      ? (parsed as { artifactId: string }).artifactId
      : undefined;

  if (!artifactIdRaw || !isCandidateArtifactId(artifactIdRaw)) {
    return operationFailure(
      'promotion_receipt_envelope_invalid',
      2,
      [
        blockIssue(
          'promotion_receipt_artifact_id_invalid',
          `Envelope artifactId is missing or not candidate-enabled: ${String(artifactIdRaw)}`
        ),
      ],
      write
    );
  }

  const artifactId: GhostFlowCandidateArtifactId = artifactIdRaw;

  const registryEntry = REGISTRY_BY_ID.get(artifactId);
  if (!registryEntry) {
    return operationFailure(
      'promotion_receipt_validation_failed',
      5,
      [blockIssue('promotion_receipt_registry_missing', `Registry entry missing for ${artifactId}`)],
      write,
      { artifactId }
    );
  }

  const productionDestination = resolvePromotionRegistryDestination({
    repoRoot: input.repoRoot,
    artifactPath: registryEntry.artifactPath,
  });
  if (!productionDestination.ok) {
    return operationFailure(
      'promotion_receipt_validation_failed',
      5,
      productionDestination.issues,
      write,
      { artifactId }
    );
  }

  let currentProductionRaw: unknown;
  try {
    const productionText = await readFile(productionDestination.value.absolutePath, 'utf8');
    currentProductionRaw = JSON.parse(productionText) as unknown;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return operationFailure(
      'promotion_receipt_validation_failed',
      err.code === 'ENOENT' ? 5 : 1,
      [
        blockIssue(
          err.code === 'ENOENT'
            ? 'promotion_receipt_current_production_missing'
            : 'promotion_receipt_current_production_unreadable',
          err.message ??
            `Failed to read or parse current production at ${registryEntry.artifactPath}`
        ),
      ],
      write,
      { artifactId }
    );
  }

  // Do NOT pass reviewedEnvelopePath — R2 persisted receipts omit basename.
  const planResult = buildGhostFlowPromotionReceiptPlan({
    repoRoot: input.repoRoot,
    envelope: parsed,
    currentProductionRaw,
    mapper: input.mapper,
  });

  if (!planResult.ok) {
    return operationFailure(
      mapPlanFailureStatus(planResult.status),
      planResult.exitCode,
      planResult.issues,
      write,
      { artifactId }
    );
  }

  const { plan } = planResult;

  if ('reviewedEnvelopeBasename' in plan.receipt && plan.receipt.reviewedEnvelopeBasename !== undefined) {
    return operationFailure(
      'promotion_receipt_validation_failed',
      5,
      [
        blockIssue(
          'promotion_receipt_basename_forbidden',
          'R2 receipt plan must omit reviewedEnvelopeBasename'
        ),
      ],
      write,
      {
        artifactId: plan.receipt.artifactId,
        candidateIdentitySha256: plan.receipt.candidateIdentitySha256,
        candidateObservationAsOf: plan.receipt.candidateObservationAsOf,
        receiptPath: plan.receiptRelativePath,
      },
      plan
    );
  }

  if (!write) {
    return {
      ok: true,
      status: 'promotion_receipt_dry_run_ok',
      exitCode: 0,
      plan,
      issues: [],
      summary: {
        status: 'promotion_receipt_dry_run_ok',
        artifactId: plan.receipt.artifactId,
        candidateIdentitySha256: plan.receipt.candidateIdentitySha256,
        candidateObservationAsOf: plan.receipt.candidateObservationAsOf,
        receiptPath: plan.receiptRelativePath,
        write: false,
        exitCode: 0,
      },
    };
  }

  return writeValidatedPromotionReceiptPlan({
    repoRoot: input.repoRoot,
    plan,
  });
}

/** Re-export status type for callers/tests. */
export type { GhostFlowPromotionReceiptStatus };
