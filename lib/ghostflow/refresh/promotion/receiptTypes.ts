import type { GhostFlowCandidateArtifactId } from '../candidates/types';
import type { GhostFlowRefreshIssue } from '../types';

/** Phase 1 verified promotion receipt — no wall-clock or approval fields. */
export type GhostFlowPromotionReceiptV1 = {
  receiptVersion: '1';
  artifactId: GhostFlowCandidateArtifactId;
  candidateIdentitySha256: string;
  candidateIdentityPrefix: string;
  candidateObservationAsOf: string;
  candidatePromotionPayloadSha256: string;
  sourceProvenance: {
    sourceId: string;
    sourceLocator: string;
    contentSha256: string;
    adapterId: string;
    parserVersion: string;
  };
  priorProduction: {
    artifactPath: string;
    observationAsOf: string;
    promotionPayloadSha256: string;
    sourcePublishedAt?: string;
  };
  promotedProduction: {
    artifactPath: string;
    observationAsOf: string;
    promotionPayloadSha256: string;
    sourcePublishedAt?: string;
  };
  validatorId: string;
  /** Informational only — never used for eligibility or destination. */
  reviewedEnvelopeBasename?: string;
};

export type GhostFlowPromotionReceiptPlan = {
  receipt: GhostFlowPromotionReceiptV1;
  receiptRelativePath: string;
  receiptAbsolutePath: string;
};

export type GhostFlowPromotionReceiptStatus =
  | 'promotion_receipt_plan_ok'
  | 'promotion_receipt_envelope_invalid'
  | 'promotion_receipt_ineligible'
  | 'promotion_receipt_not_applied'
  | 'promotion_receipt_current_mismatch'
  | 'promotion_receipt_mapper_replay_mismatch'
  | 'promotion_receipt_validation_failed'
  | 'promotion_receipt_destination_unsafe';

export type GhostFlowPromotionReceiptPlanSuccess = {
  ok: true;
  status: 'promotion_receipt_plan_ok';
  exitCode: 0;
  plan: GhostFlowPromotionReceiptPlan;
  issues: GhostFlowRefreshIssue[];
};

export type GhostFlowPromotionReceiptPlanFailure = {
  ok: false;
  status: Exclude<GhostFlowPromotionReceiptStatus, 'promotion_receipt_plan_ok'>;
  exitCode: number;
  issues: GhostFlowRefreshIssue[];
};

export type GhostFlowPromotionReceiptPlanResult =
  | GhostFlowPromotionReceiptPlanSuccess
  | GhostFlowPromotionReceiptPlanFailure;

/** Pretty JSON used for deterministic idempotent byte comparison in R2. */
export function serializeGhostFlowPromotionReceipt(
  receipt: GhostFlowPromotionReceiptV1
): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}
