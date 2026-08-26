import { GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY } from '../candidateMappers';
import {
  DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP,
  type GhostFlowOperatorAdapter,
  type GhostFlowOperatorReportArtifactId,
} from '../operatorRunner';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../registry';
import type {
  GhostFlowCandidateMapper,
  GhostFlowNormalizedObservation,
  GhostFlowRefreshIssue,
  GhostFlowRefreshRegistryEntry,
  GhostFlowStageResult,
} from '../types';
import { validateCurrentProductionArtifact, validateProposedProductionArtifact } from './artifactValidation';
import { buildCandidateDiff } from './diff';
import { buildCandidateIdentity } from './identity';
import type {
  GhostFlowCandidateArtifactId,
  GhostFlowCandidateEnvelope,
  GhostFlowCandidateGenerationSummary,
  GhostFlowCandidateGeneratorResult,
  GhostFlowCandidateStatus,
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
  status: GhostFlowCandidateStatus,
  exitCode: number,
  artifactId: GhostFlowCandidateArtifactId,
  issues: GhostFlowRefreshIssue[]
): GhostFlowCandidateGeneratorResult {
  return {
    ok: false,
    status,
    exitCode,
    issues,
    summary: {
      artifactId,
      status,
      exitCode,
      issueCodes: issues.map((issue) => issue.code),
    },
  };
}

function success(
  status: GhostFlowCandidateStatus,
  exitCode: number,
  artifactId: GhostFlowCandidateArtifactId,
  issues: GhostFlowRefreshIssue[],
  envelope?: GhostFlowCandidateEnvelope
): GhostFlowCandidateGeneratorResult {
  return {
    ok: true,
    status,
    exitCode,
    issues,
    envelope,
    summary: {
      artifactId,
      status,
      exitCode,
      candidateObservationAsOf: envelope?.normalizedObservation.observationAsOf,
      candidateIdentitySha256: envelope?.candidateIdentity.identitySha256,
      issueCodes: issues.length > 0 ? issues.map((issue) => issue.code) : undefined,
    },
  };
}

export type GhostFlowCandidateGeneratorInput = {
  artifactId: GhostFlowCandidateArtifactId;
  nowIso: string;
  referenceAsOf?: string;
  currentProductionRaw: unknown;
  adapter?: GhostFlowOperatorAdapter;
  injectNormalized?: GhostFlowNormalizedObservation<unknown>;
  mapper?: GhostFlowCandidateMapper<unknown, unknown>;
};

export async function generateGhostFlowCandidate(
  input: GhostFlowCandidateGeneratorInput
): Promise<GhostFlowCandidateGeneratorResult> {
  const { artifactId, nowIso, referenceAsOf, currentProductionRaw } = input;
  const registryEntry = REGISTRY_BY_ID.get(artifactId);
  if (!registryEntry) {
    return failure('current_production_invalid', 5, artifactId, [
      blockIssue('candidate_registry_missing', `Registry entry missing for ${artifactId}`),
    ]);
  }

  const currentValidated = validateCurrentProductionArtifact(
    artifactId,
    currentProductionRaw,
    registryEntry.artifactPath
  );
  if (!currentValidated.ok) {
    return failure('current_production_invalid', 5, artifactId, currentValidated.issues);
  }

  const currentProduction = currentValidated.value;
  let normalized: GhostFlowNormalizedObservation<unknown>;
  let carriedIssues: GhostFlowRefreshIssue[] = [];

  if (input.injectNormalized) {
    normalized = input.injectNormalized;
  } else {
    const adapter = input.adapter ?? DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP[artifactId];
    const fetchContext = { nowIso, referenceAsOf };
    const parseContext = { nowIso };
    const normalizeContext = { nowIso, referenceAsOf };

    const fetchResult = await adapter.fetch(fetchContext);
    if (!fetchResult.ok) {
      return failure('source_failed', 4, artifactId, fetchResult.issues);
    }
    carriedIssues = [...fetchResult.issues];

    const parseResult = adapter.parse(fetchResult.value, parseContext);
    if (!parseResult.ok) {
      return failure('source_failed', 4, artifactId, [...carriedIssues, ...parseResult.issues]);
    }
    carriedIssues.push(...parseResult.issues);

    const normalizeResult = adapter.normalize(parseResult.value, normalizeContext);
    if (!normalizeResult.ok) {
      return failure('source_failed', 4, artifactId, [...carriedIssues, ...normalizeResult.issues]);
    }
    carriedIssues.push(...normalizeResult.issues);
    normalized = normalizeResult.value as GhostFlowNormalizedObservation<unknown>;
  }

  const mapper =
    input.mapper ?? (MAPPER_BY_ID.get(artifactId) as GhostFlowCandidateMapper<unknown, unknown> | undefined);
  if (!mapper) {
    return failure('mapper_failed', 5, artifactId, [
      blockIssue('candidate_mapper_missing', `No mapper registered for ${artifactId}`),
    ]);
  }

  const mapperResult = mapper.map({
    normalized,
    registryEntry: registryEntry as GhostFlowRefreshRegistryEntry,
  });
  if (!mapperResult.ok) {
    return failure('mapper_failed', 5, artifactId, [...carriedIssues, ...mapperResult.issues]);
  }
  carriedIssues.push(...mapperResult.issues);

  const proposedValidated = validateProposedProductionArtifact(artifactId, mapperResult.value);
  if (!proposedValidated.ok) {
    return failure('validation_failed', 5, artifactId, [
      ...carriedIssues,
      ...proposedValidated.issues,
    ]);
  }

  const candidateAsOf = proposedValidated.value.observationAsOf;
  const currentAsOf = currentProduction.observationAsOf;

  if (candidateAsOf < currentAsOf) {
    return success('no_newer_observation', 2, artifactId, carriedIssues);
  }

  const samePayload =
    proposedValidated.value.promotionPayloadSha256 ===
    currentProduction.promotionPayloadSha256;

  if (candidateAsOf === currentAsOf && samePayload) {
    return success('no_change', 2, artifactId, carriedIssues);
  }

  const identityResult = buildCandidateIdentity({
    artifactId,
    normalized,
    promotionPayloadSha256: proposedValidated.value.promotionPayloadSha256,
  });
  if (!identityResult.ok) {
    return failure('validation_failed', 5, artifactId, [
      blockIssue('candidate_identity_invalid', identityResult.message),
    ]);
  }

  const diff = buildCandidateDiff({
    currentArtifact: currentProduction.artifact,
    candidateArtifact: proposedValidated.value.artifact,
    currentObservationAsOf: currentAsOf,
    candidateObservationAsOf: candidateAsOf,
    candidateSourceProvenance: normalized.provenance,
    currentPromotionPayloadSha256: currentProduction.promotionPayloadSha256,
    candidatePromotionPayloadSha256: proposedValidated.value.promotionPayloadSha256,
  });

  const envelopeStatus =
    candidateAsOf === currentAsOf ? 'revision_review_required' : 'ready_for_review';
  const exitCode = envelopeStatus === 'revision_review_required' ? 3 : 0;

  const envelope: GhostFlowCandidateEnvelope = {
    candidateVersion: '1',
    artifactId,
    artifactSchemaVersion: '1',
    status: envelopeStatus,
    generatedAt: nowIso,
    generationMode: 'operator_fetch',
    humanReviewRequired: true,
    currentProduction: {
      artifactId,
      artifactPath: currentProduction.artifactPath,
      observationAsOf: currentAsOf,
      ...(currentProduction.sourcePublishedAt
        ? { sourcePublishedAt: currentProduction.sourcePublishedAt }
        : {}),
      promotionPayloadSha256: currentProduction.promotionPayloadSha256,
    },
    candidateIdentity: identityResult.identity,
    normalizedObservation: {
      artifactId: normalized.artifactId,
      observationAsOf: normalized.observationAsOf,
      fields: normalized.fields,
      provenance: { ...normalized.provenance },
    },
    proposedArtifact: proposedValidated.value.artifact,
    validation: {
      ok: true,
      validatorId: proposedValidated.value.validatorId,
      errors: [],
    },
    diff,
    issues: carriedIssues,
  };

  return success(envelopeStatus, exitCode, artifactId, carriedIssues, envelope);
}

export function resolveCandidateRegistryEntry(
  artifactId: GhostFlowOperatorReportArtifactId
): GhostFlowStageResult<GhostFlowRefreshRegistryEntry> {
  const entry = REGISTRY_BY_ID.get(artifactId);
  if (!entry) {
    return {
      ok: false,
      issues: [blockIssue('candidate_registry_missing', `Registry entry missing for ${artifactId}`)],
    };
  }
  return { ok: true, value: entry, issues: [] };
}
