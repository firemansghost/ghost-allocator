import type { GhostFlowDurableProvenance, GhostFlowRefreshIssue } from '../types';
import type { GhostFlowOperatorReportArtifactId } from '../operatorRunner';

export const GHOSTFLOW_CANDIDATE_ENVELOPE_VERSION = '1' as const;

export const GHOSTFLOW_CANDIDATE_ARTIFACT_IDS = [
  'systematicFlowProxy',
  'treasuryFuturesPositioningProxy',
  'treasuryLongEndIncomeLens',
] as const satisfies readonly GhostFlowOperatorReportArtifactId[];

export type GhostFlowCandidateArtifactId = (typeof GHOSTFLOW_CANDIDATE_ARTIFACT_IDS)[number];

export type GhostFlowCandidateStatus =
  | 'ready_for_review'
  | 'revision_review_required'
  | 'no_change'
  | 'no_newer_observation'
  | 'source_failed'
  | 'current_production_invalid'
  | 'mapper_failed'
  | 'validation_failed'
  | 'candidate_already_exists'
  | 'candidate_identity_collision';

export type GhostFlowCandidateGenerationMode = 'operator_fetch';

export type GhostFlowCandidateObservationDateRelation = 'newer' | 'same' | 'older';

export interface GhostFlowCandidateIdentity {
  artifactId: GhostFlowCandidateArtifactId;
  observationAsOf: string;
  contentSha256: string;
  adapterId: string;
  parserVersion: string;
  promotionPayloadSha256: string;
  identitySha256: string;
  identityPrefix: string;
}

export interface GhostFlowCandidateProductionFingerprint {
  artifactId: GhostFlowCandidateArtifactId;
  artifactPath: string;
  observationAsOf: string;
  sourcePublishedAt?: string;
  promotionPayloadSha256: string;
}

export interface GhostFlowCandidateFieldChange {
  path: string;
  currentValue: unknown;
  candidateValue: unknown;
}

export interface GhostFlowCandidateDiff {
  currentObservationAsOf: string;
  candidateObservationAsOf: string;
  observationDateRelation: GhostFlowCandidateObservationDateRelation;
  fieldAdditions: string[];
  fieldRemovals: string[];
  fieldChanges: GhostFlowCandidateFieldChange[];
  candidateSourceProvenance: GhostFlowDurableProvenance;
  promotionPayloadChanged: boolean;
}

export interface GhostFlowCandidateValidationResult {
  ok: boolean;
  validatorId: string;
  errors: string[];
}

export interface GhostFlowCandidateEnvelope {
  candidateVersion: typeof GHOSTFLOW_CANDIDATE_ENVELOPE_VERSION;
  artifactId: GhostFlowCandidateArtifactId;
  artifactSchemaVersion: '1';
  status: Extract<
    GhostFlowCandidateStatus,
    'ready_for_review' | 'revision_review_required' | 'candidate_already_exists'
  >;
  generatedAt: string;
  generationMode: GhostFlowCandidateGenerationMode;
  humanReviewRequired: true;
  currentProduction: GhostFlowCandidateProductionFingerprint;
  candidateIdentity: GhostFlowCandidateIdentity;
  normalizedObservation: {
    artifactId: string;
    observationAsOf: string;
    fields: unknown;
    provenance: GhostFlowDurableProvenance;
  };
  proposedArtifact: unknown;
  validation: GhostFlowCandidateValidationResult;
  diff: GhostFlowCandidateDiff;
  issues: GhostFlowRefreshIssue[];
}

export interface GhostFlowCandidateGenerationSummary {
  artifactId: GhostFlowCandidateArtifactId;
  status: GhostFlowCandidateStatus;
  candidateObservationAsOf?: string;
  candidateIdentitySha256?: string;
  outputPath?: string;
  exitCode: number;
  issueCodes?: string[];
}

export interface GhostFlowCandidateGeneratorSuccess {
  ok: true;
  status: GhostFlowCandidateStatus;
  exitCode: number;
  envelope?: GhostFlowCandidateEnvelope;
  summary: GhostFlowCandidateGenerationSummary;
  issues: GhostFlowRefreshIssue[];
}

export interface GhostFlowCandidateGeneratorFailure {
  ok: false;
  status: GhostFlowCandidateStatus;
  exitCode: number;
  summary: GhostFlowCandidateGenerationSummary;
  issues: GhostFlowRefreshIssue[];
}

export type GhostFlowCandidateGeneratorResult =
  | GhostFlowCandidateGeneratorSuccess
  | GhostFlowCandidateGeneratorFailure;
