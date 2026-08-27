import { basename } from 'node:path';
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
import { resolvePromotionReceiptDestination } from './receiptPathSafety';
import type {
  GhostFlowPromotionReceiptPlan,
  GhostFlowPromotionReceiptPlanResult,
  GhostFlowPromotionReceiptPlanStatus,
  GhostFlowPromotionReceiptV1,
} from './receiptTypes';
import { serializeGhostFlowPromotionReceipt } from './receiptTypes';

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
  status: Exclude<GhostFlowPromotionReceiptPlanStatus, 'promotion_receipt_plan_ok'>,
  exitCode: number,
  issues: GhostFlowRefreshIssue[]
): GhostFlowPromotionReceiptPlanResult {
  return { ok: false, status, exitCode, issues };
}

export type GhostFlowPromotionReceiptPlanInput = {
  repoRoot: string;
  envelope: GhostFlowCandidateEnvelope | unknown;
  /** Required — R1 does not read production from disk. */
  currentProductionRaw: unknown;
  /** Test injection only — production path uses registry mapper. */
  mapper?: GhostFlowCandidateMapper<unknown, unknown>;
  /** Optional informational basename/path — never authority. */
  reviewedEnvelopePath?: string;
};

/**
 * Build a validated Phase 1 promotion-receipt plan for POST-APPLY state.
 *
 * Expects current production to already equal the reviewed candidate payload
 * (hash + asOf). Does NOT enforce the normal promotion newer-date gate.
 * Does not write any files.
 */
export function buildGhostFlowPromotionReceiptPlan(
  input: GhostFlowPromotionReceiptPlanInput
): GhostFlowPromotionReceiptPlanResult {
  const envelopeResult = validateCandidateEnvelopeForPromotion(input.envelope);
  if (!envelopeResult.ok) {
    const ineligible = envelopeResult.issues.some(
      (issue) => issue.code === 'promotion_candidate_status_ineligible'
    );
    return failure(
      ineligible ? 'promotion_receipt_ineligible' : 'promotion_receipt_envelope_invalid',
      2,
      envelopeResult.issues.map((issue) =>
        issue.code.startsWith('promotion_receipt_')
          ? issue
          : blockIssue(
              issue.code === 'promotion_candidate_status_ineligible'
                ? 'promotion_receipt_ineligible'
                : 'promotion_receipt_envelope_invalid',
              issue.message
            )
      )
    );
  }

  const envelope = envelopeResult.value;
  const artifactId = envelope.artifactId;

  const registryEntry = REGISTRY_BY_ID.get(artifactId);
  if (!registryEntry) {
    return failure('promotion_receipt_validation_failed', 5, [
      blockIssue('promotion_receipt_registry_missing', `Registry entry missing for ${artifactId}`),
    ]);
  }

  if (envelope.currentProduction.artifactPath !== registryEntry.artifactPath) {
    return failure('promotion_receipt_validation_failed', 5, [
      blockIssue(
        'promotion_receipt_prior_path_mismatch',
        'Envelope currentProduction.artifactPath does not match registry destination'
      ),
    ]);
  }

  const mapper =
    input.mapper ??
    (MAPPER_BY_ID.get(artifactId) as GhostFlowCandidateMapper<unknown, unknown> | undefined);
  if (!mapper) {
    return failure('promotion_receipt_mapper_replay_mismatch', 4, [
      blockIssue('promotion_receipt_mapper_missing', `No mapper registered for ${artifactId}`),
    ]);
  }

  const mapperResult = mapper.map({
    normalized: envelope.normalizedObservation as GhostFlowNormalizedObservation<unknown>,
    registryEntry: registryEntry as GhostFlowRefreshRegistryEntry,
  });
  if (!mapperResult.ok) {
    return failure('promotion_receipt_mapper_replay_mismatch', 4, [
      blockIssue(
        'promotion_receipt_mapper_replay_mismatch',
        mapperResult.issues.map((issue) => issue.message).join('; ') || 'Mapper replay failed'
      ),
      ...mapperResult.issues,
    ]);
  }

  const replayValidated = validateProposedProductionArtifact(artifactId, mapperResult.value);
  if (!replayValidated.ok) {
    return failure('promotion_receipt_validation_failed', 5, replayValidated.issues);
  }

  const envelopeProposedValidated = validateProposedProductionArtifact(
    artifactId,
    envelope.proposedArtifact
  );
  if (!envelopeProposedValidated.ok) {
    return failure('promotion_receipt_validation_failed', 5, envelopeProposedValidated.issues);
  }

  const candidatePayloadSha = envelope.candidateIdentity.promotionPayloadSha256;
  if (
    replayValidated.value.promotionPayloadSha256 !== candidatePayloadSha ||
    envelopeProposedValidated.value.promotionPayloadSha256 !== candidatePayloadSha
  ) {
    return failure('promotion_receipt_mapper_replay_mismatch', 4, [
      blockIssue(
        'promotion_receipt_mapper_replay_mismatch',
        'Current mapper/validator output does not match reviewed promotion payload hash'
      ),
    ]);
  }

  const currentValidated = validateCurrentProductionArtifact(
    artifactId,
    input.currentProductionRaw,
    registryEntry.artifactPath
  );
  if (!currentValidated.ok) {
    return failure('promotion_receipt_validation_failed', 5, currentValidated.issues);
  }

  const current = currentValidated.value;
  const prior = envelope.currentProduction;
  const candidateAsOf = envelope.candidateIdentity.observationAsOf;

  // Prior fingerprint must still be internally consistent with reviewed envelope contract.
  if (
    prior.artifactId !== artifactId ||
    prior.artifactPath !== registryEntry.artifactPath ||
    !prior.observationAsOf ||
    !prior.promotionPayloadSha256
  ) {
    return failure('promotion_receipt_envelope_invalid', 2, [
      blockIssue(
        'promotion_receipt_prior_fingerprint_invalid',
        'Envelope currentProduction prior fingerprint is incomplete or inconsistent'
      ),
    ]);
  }

  // Not-yet-applied: current production still matches the pre-apply prior fingerprint.
  if (
    current.observationAsOf === prior.observationAsOf &&
    current.promotionPayloadSha256 === prior.promotionPayloadSha256
  ) {
    return failure('promotion_receipt_not_applied', 3, [
      blockIssue(
        'promotion_receipt_not_applied',
        'Current production still matches envelope prior fingerprint — receipt requires post-apply state'
      ),
    ]);
  }

  // Post-apply equality: current must equal the reviewed candidate payload + asOf.
  if (current.promotionPayloadSha256 !== candidatePayloadSha) {
    return failure('promotion_receipt_current_mismatch', 3, [
      blockIssue(
        'promotion_receipt_current_payload_mismatch',
        'Current production promotion payload hash does not match reviewed candidate payload'
      ),
    ]);
  }

  if (current.observationAsOf !== candidateAsOf) {
    return failure('promotion_receipt_current_mismatch', 3, [
      blockIssue(
        'promotion_receipt_current_asof_mismatch',
        `Current production observationAsOf ${current.observationAsOf} must equal candidate ${candidateAsOf}`
      ),
    ]);
  }

  if (prior.sourcePublishedAt !== undefined) {
    // Prior fingerprint carried a publishedAt — record as-is; do not require current match
    // beyond promoted production's own optional publishedAt handling below.
  }

  const provenance = envelope.normalizedObservation.provenance;
  const receipt: GhostFlowPromotionReceiptV1 = {
    receiptVersion: '1',
    artifactId,
    candidateIdentitySha256: envelope.candidateIdentity.identitySha256,
    candidateIdentityPrefix: envelope.candidateIdentity.identityPrefix,
    candidateObservationAsOf: candidateAsOf,
    candidatePromotionPayloadSha256: candidatePayloadSha,
    sourceProvenance: {
      sourceId: provenance.sourceId,
      sourceLocator: provenance.sourceLocator,
      contentSha256: provenance.contentSha256,
      adapterId: provenance.adapterId,
      parserVersion: provenance.parserVersion,
    },
    priorProduction: {
      artifactPath: prior.artifactPath,
      observationAsOf: prior.observationAsOf,
      promotionPayloadSha256: prior.promotionPayloadSha256,
      ...(prior.sourcePublishedAt !== undefined
        ? { sourcePublishedAt: prior.sourcePublishedAt }
        : {}),
    },
    promotedProduction: {
      artifactPath: registryEntry.artifactPath,
      observationAsOf: current.observationAsOf,
      promotionPayloadSha256: current.promotionPayloadSha256,
      ...(current.sourcePublishedAt !== undefined
        ? { sourcePublishedAt: current.sourcePublishedAt }
        : {}),
    },
    validatorId: current.validatorId,
  };

  if (input.reviewedEnvelopePath !== undefined) {
    const name = basename(input.reviewedEnvelopePath);
    if (name.length > 0 && name !== '.' && name !== '..') {
      receipt.reviewedEnvelopeBasename = name;
    }
  }

  const destination = resolvePromotionReceiptDestination({
    repoRoot: input.repoRoot,
    artifactId,
    observationAsOf: candidateAsOf,
    identityPrefix: envelope.candidateIdentity.identityPrefix,
  });
  if (!destination.ok) {
    return failure('promotion_receipt_destination_unsafe', 2, destination.issues);
  }

  const plan: GhostFlowPromotionReceiptPlan = {
    receipt,
    receiptRelativePath: destination.value.relativePath,
    receiptAbsolutePath: destination.value.absolutePath,
  };

  // Touch serializer to keep deterministic representation available to callers/tests.
  void serializeGhostFlowPromotionReceipt(receipt);

  return {
    ok: true,
    status: 'promotion_receipt_plan_ok',
    exitCode: 0,
    plan,
    issues: [],
  };
}
