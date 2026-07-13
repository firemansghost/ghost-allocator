/**
 * GhostFlow refresh report contracts — structured review data only.
 * No rendering, production writes, or score calculation.
 */

import type { GhostFlowRegisteredArtifactId } from './registry';
import type {
  GhostFlowAcceptanceUnit,
  GhostFlowFailureSeverity,
  GhostFlowRefreshIssue,
  GhostFlowRefreshLane,
} from './types';

export type GhostFlowArtifactAttemptStatus =
  | 'candidate_observation_available'
  | 'no_newer_observation'
  | 'source_failed'
  | 'manual_input_required'
  | 'not_attempted';

export interface GhostFlowCurrentArtifactSummary {
  artifactId: GhostFlowRegisteredArtifactId;
  artifactPath: string;
  observationAsOf?: string;
  sourcePublishedAt?: string;
}

/**
 * Candidate observation summary for human review.
 * Excludes raw payloads, paths, secrets, score fields, and production JSON.
 */
export interface GhostFlowCandidateObservationSummary {
  observationAsOf: string;
  sourcePublishedAt?: string;
  retrievedAt: string;
  contentSha256: string;
  adapterId: string;
  parserVersion: string;
}

interface GhostFlowArtifactRefreshAttemptBase {
  artifactId: GhostFlowRegisteredArtifactId;
  current: GhostFlowCurrentArtifactSummary;
  issues: readonly GhostFlowRefreshIssue[];
}

export interface GhostFlowCandidateAvailableAttempt
  extends GhostFlowArtifactRefreshAttemptBase {
  status: 'candidate_observation_available';
  candidate: GhostFlowCandidateObservationSummary;
}

export interface GhostFlowNoNewerAttempt extends GhostFlowArtifactRefreshAttemptBase {
  status: 'no_newer_observation';
  candidate?: undefined;
}

export interface GhostFlowSourceFailedAttempt extends GhostFlowArtifactRefreshAttemptBase {
  status: 'source_failed';
  candidate?: undefined;
}

export interface GhostFlowManualInputAttempt extends GhostFlowArtifactRefreshAttemptBase {
  status: 'manual_input_required';
  candidate?: undefined;
}

export interface GhostFlowNotAttemptedAttempt extends GhostFlowArtifactRefreshAttemptBase {
  status: 'not_attempted';
  candidate?: undefined;
}

export type GhostFlowArtifactRefreshAttempt =
  | GhostFlowCandidateAvailableAttempt
  | GhostFlowNoNewerAttempt
  | GhostFlowSourceFailedAttempt
  | GhostFlowManualInputAttempt
  | GhostFlowNotAttemptedAttempt;

export type GhostFlowCandidateGroupStatus =
  | 'ready_for_review'
  | 'no_change'
  | 'blocked'
  | 'manual_input_required';

export interface GhostFlowCandidateGroupReport {
  candidateGroupId: string;
  acceptanceUnit: GhostFlowAcceptanceUnit;
  artifactIds: readonly GhostFlowRegisteredArtifactId[];
  /** Distinct lanes present in the group (normally one). */
  lanes: readonly GhostFlowRefreshLane[];
  /** Primary lane for the group (first registry member's lane). */
  primaryLane: GhostFlowRefreshLane;
  status: GhostFlowCandidateGroupStatus;
  failureSeverities: readonly GhostFlowFailureSeverity[];
  observationAsOfValues: readonly string[];
  issues: readonly GhostFlowRefreshIssue[];
}

export type GhostFlowRefreshReportStatus =
  | 'ready_for_review'
  | 'no_changes'
  | 'partial_with_blocks'
  | 'blocked';

export type GhostFlowRefreshSuggestedAction =
  | 'review_candidates'
  | 'review_candidates_and_investigate_blocks'
  | 'investigate_blocks'
  | 'no_action';

export interface GhostFlowRefreshReportSummaryCounts {
  selectedArtifactCount: number;
  selectedGroupCount: number;
  readyGroupCount: number;
  noChangeGroupCount: number;
  blockedGroupCount: number;
  manualInputGroupCount: number;
  scoreFedReadyGroupCount: number;
  scoreFedBlockedGroupCount: number;
  displayOnlyReadyGroupCount: number;
  displayOnlyBlockedGroupCount: number;
  treasuryReadyGroupCount: number;
  treasuryBlockedGroupCount: number;
}

export const GHOSTFLOW_REFRESH_REPORT_VERSION = '1' as const;
export const GHOSTFLOW_REFRESH_REPORT_MODE = 'report_only' as const;

export interface GhostFlowRefreshReport {
  reportVersion: typeof GHOSTFLOW_REFRESH_REPORT_VERSION;
  mode: typeof GHOSTFLOW_REFRESH_REPORT_MODE;
  generatedAt: string;
  requestedArtifactIds: readonly GhostFlowRegisteredArtifactId[];
  artifactAttempts: readonly GhostFlowArtifactRefreshAttempt[];
  candidateGroups: readonly GhostFlowCandidateGroupReport[];
  summary: GhostFlowRefreshReportSummaryCounts;
  overallStatus: GhostFlowRefreshReportStatus;
  suggestedAction: GhostFlowRefreshSuggestedAction;
  /**
   * Human review is always required before any production acceptance.
   * This report never claims production write or merge readiness.
   */
  requiresHumanReview: true;
  issues: readonly GhostFlowRefreshIssue[];
}

export interface GhostFlowRefreshPlannerInput {
  generatedAt: string;
  requestedArtifactIds: readonly GhostFlowRegisteredArtifactId[];
  attempts: readonly GhostFlowArtifactRefreshAttempt[];
}
