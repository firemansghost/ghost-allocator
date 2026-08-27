import type { GhostFlowCandidateArtifactId } from '../candidates/types';
import type { GhostFlowRefreshIssue } from '../types';

export type GhostFlowPromotionStatus =
  | 'promotion_dry_run_ok'
  | 'promotion_applied'
  | 'promotion_envelope_invalid'
  | 'promotion_ineligible'
  | 'promotion_stale_current_production'
  | 'promotion_mapper_replay_mismatch'
  | 'promotion_validation_failed'
  | 'promotion_write_failed'
  | 'promotion_post_write_verification_failed';

export type GhostFlowPromotionPlan = {
  artifactId: GhostFlowCandidateArtifactId;
  candidateIdentitySha256: string;
  candidateIdentityPrefix: string;
  currentObservationAsOf: string;
  candidateObservationAsOf: string;
  currentPromotionPayloadSha256: string;
  proposedPromotionPayloadSha256: string;
  destinationRelativePath: string;
  destinationAbsolutePath: string;
  validatedProposedArtifact: unknown;
  currentSourcePublishedAt?: string;
  candidateSourcePublishedAt?: string;
  validatorId: string;
};

export type GhostFlowPromotionSummary = {
  artifactId?: GhostFlowCandidateArtifactId;
  status: GhostFlowPromotionStatus;
  candidateIdentitySha256?: string;
  currentObservationAsOf?: string;
  candidateObservationAsOf?: string;
  destinationPath?: string;
  apply: boolean;
  exitCode: number;
  issueCodes?: string[];
};

export type GhostFlowPromotionDryRunSuccess = {
  ok: true;
  status: 'promotion_dry_run_ok';
  exitCode: 0;
  plan: GhostFlowPromotionPlan;
  summary: GhostFlowPromotionSummary;
  issues: GhostFlowRefreshIssue[];
};

export type GhostFlowPromotionDryRunFailure = {
  ok: false;
  status: Exclude<
    GhostFlowPromotionStatus,
    'promotion_dry_run_ok' | 'promotion_applied'
  >;
  exitCode: number;
  summary: GhostFlowPromotionSummary;
  issues: GhostFlowRefreshIssue[];
};

export type GhostFlowPromotionDryRunResult =
  | GhostFlowPromotionDryRunSuccess
  | GhostFlowPromotionDryRunFailure;

export type GhostFlowPromotionApplySuccess = {
  ok: true;
  status: 'promotion_applied';
  exitCode: 0;
  plan: GhostFlowPromotionPlan;
  summary: GhostFlowPromotionSummary;
  issues: GhostFlowRefreshIssue[];
};

export type GhostFlowPromotionApplyFailure = {
  ok: false;
  status: Exclude<GhostFlowPromotionStatus, 'promotion_dry_run_ok' | 'promotion_applied'>;
  exitCode: number;
  summary: GhostFlowPromotionSummary;
  issues: GhostFlowRefreshIssue[];
  plan?: GhostFlowPromotionPlan;
};

export type GhostFlowPromotionApplyResult =
  | GhostFlowPromotionApplySuccess
  | GhostFlowPromotionApplyFailure;
