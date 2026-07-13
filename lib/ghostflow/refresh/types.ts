/**
 * GhostFlow refresh contracts — typed inventory and adapter stage boundaries.
 * Architecture only: no live fetch, candidate generation, or production writers.
 */

import type { GhostFlowRawSnapshot } from '../types';

export type GhostFlowRefreshLane =
  | 'score_fed_equity'
  | 'display_only_equity'
  | 'treasury_display';

export type GhostFlowAutomationReadiness = 'green' | 'yellow' | 'red';

export type GhostFlowSourceFormat =
  | 'csv'
  | 'json_api'
  | 'html'
  | 'pdf'
  | 'spreadsheet'
  | 'operator_packet'
  | 'derived_study';

export type GhostFlowCadence =
  | 'daily_trading'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'event'
  | 'study';

export type GhostFlowReferenceDateRole =
  | 'gate_c_required'
  | 'lagging_allowed'
  | 'none';

export type GhostFlowApprovalPolicy = 'human_required';

export type GhostFlowAuthenticationRequirement =
  | { kind: 'none' }
  | { kind: 'optional_env'; envName: string }
  | { kind: 'required_env'; envName: string }
  | { kind: 'manual_operator' };

export type GhostFlowAdapterImplementationStatus =
  | 'planned'
  | 'spike_available'
  | 'implemented';

/**
 * Identifiers for existing freshness evaluator semantics.
 * Numeric thresholds remain owned by artifactFreshness.ts / per-artifact evaluators.
 */
export type GhostFlowFreshnessPolicyId =
  | 'daily_trading_v1'
  | 'weekly_calendar_v1'
  | 'monthly_calendar_v1'
  | 'cftc_weekly_release_v1'
  | 'levered_etf_release_v1'
  | 'retirement_quarterly_release_v1';

export type GhostFlowAcceptanceUnit = 'artifact' | 'candidate_group';

export type GhostFlowFailureSeverity =
  | 'blocking_score_fed'
  | 'nonfatal_display'
  | 'nonfatal_treasury';

/**
 * Intended retention for accepted normalized observations.
 * Raw downloads remain temporary; this policy does not authorize committing raw source material.
 */
export type GhostFlowHistoryPolicy = 'accepted_normalized_observation';

export type GhostFlowRefreshIssueStage =
  | 'fetch'
  | 'parse'
  | 'normalize'
  | 'validate'
  | 'reconcile'
  | 'anomaly';

export type GhostFlowRefreshIssueSeverity = 'info' | 'review' | 'block';

export type PassiveScoreInputKey = keyof GhostFlowRawSnapshot['passivePressure'];
export type StructuralScoreInputKey = keyof GhostFlowRawSnapshot['structuralFragility'];

export type GhostFlowScoreInputReference =
  | {
      axis: 'passive';
      key: PassiveScoreInputKey;
      relationship: 'direct' | 'derived';
    }
  | {
      axis: 'structural';
      key: StructuralScoreInputKey;
      relationship: 'direct' | 'derived';
    };

export interface GhostFlowCanonicalSource {
  sourceFamilyId: string;
  sourceName: string;
  /** Canonical locator (URL, endpoint, or operator-intake label). */
  sourceLocator: string;
}

export type GhostFlowAdapterDescriptor =
  | {
      adapterId: string;
      implementationStatus: 'planned' | 'spike_available';
      /** Present only when a spike or related parse helper already exists in-repo. */
      spikeScriptPath?: string;
    }
  | {
      adapterId: string;
      implementationStatus: 'implemented';
      parserVersion: string;
    };

export interface GhostFlowRefreshIssue {
  stage: GhostFlowRefreshIssueStage;
  code: string;
  severity: GhostFlowRefreshIssueSeverity;
  message: string;
}

export type GhostFlowStageResult<T> =
  | {
      ok: true;
      value: T;
      issues: GhostFlowRefreshIssue[];
    }
  | {
      ok: false;
      issues: GhostFlowRefreshIssue[];
    };

/**
 * Durable provenance recorded with a candidate — never local workspace paths,
 * raw bodies, or secrets.
 */
export interface GhostFlowDurableProvenance {
  sourceId: string;
  sourceLocator: string;
  retrievedAt: string;
  sourcePublishedAt?: string;
  observationAsOf?: string;
  contentSha256: string;
  adapterId: string;
  parserVersion: string;
}

/** Runtime field names for durable provenance (for contract tests). */
export const GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS = [
  'sourceId',
  'sourceLocator',
  'retrievedAt',
  'sourcePublishedAt',
  'observationAsOf',
  'contentSha256',
  'adapterId',
  'parserVersion',
] as const satisfies ReadonlyArray<keyof GhostFlowDurableProvenance>;

/**
 * Shared source metadata that survives fetch → parse → normalize.
 * Constructed at fetch; copied through envelopes; used to build durable provenance.
 */
export interface GhostFlowSourceMetadata {
  sourceId: string;
  sourceLocator: string;
  retrievedAt: string;
  contentType?: string;
  contentSha256: string;
}

/** Ephemeral fetch envelope — raw payload is not durable provenance. */
export interface GhostFlowFetchedSource<TRaw> {
  raw: TRaw;
  sourceMetadata: GhostFlowSourceMetadata;
}

/** Parsed envelope — preserves fetch metadata without embedding it in TParsed. */
export interface GhostFlowParsedSource<TParsed> {
  parsed: TParsed;
  sourceMetadata: GhostFlowSourceMetadata;
}

export interface GhostFlowNormalizedObservation<TFields> {
  artifactId: string;
  observationAsOf: string;
  fields: TFields;
  provenance: GhostFlowDurableProvenance;
}

export interface GhostFlowFetchContext {
  referenceAsOf?: string;
  nowIso: string;
}

export interface GhostFlowParseContext {
  nowIso: string;
}

export interface GhostFlowNormalizeContext {
  nowIso: string;
  referenceAsOf?: string;
}

/**
 * Deterministic source adapter stages.
 * Adapters must not score, map pressure, write production JSON, or open PRs.
 * `parserVersion` is required on every implemented adapter instance.
 */
export interface GhostFlowSourceAdapter<TRaw, TParsed, TFields> {
  id: string;
  parserVersion: string;
  fetch(
    context: GhostFlowFetchContext
  ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<TRaw>>>;
  parse(
    source: GhostFlowFetchedSource<TRaw>,
    context: GhostFlowParseContext
  ): GhostFlowStageResult<GhostFlowParsedSource<TParsed>>;
  normalize(
    source: GhostFlowParsedSource<TParsed>,
    context: GhostFlowNormalizeContext
  ): GhostFlowStageResult<GhostFlowNormalizedObservation<TFields>>;
}

interface GhostFlowRefreshRegistryEntryBase {
  artifactId: string;
  artifactPath: string;
  cadence: GhostFlowCadence;
  candidateGroupId: string;
  acceptanceUnit: GhostFlowAcceptanceUnit;
  canonicalSource: GhostFlowCanonicalSource;
  sourceFormat: GhostFlowSourceFormat;
  adapter: GhostFlowAdapterDescriptor;
  freshnessPolicyId: GhostFlowFreshnessPolicyId;
  referenceDateRole: GhostFlowReferenceDateRole;
  automationReadiness: GhostFlowAutomationReadiness;
  approvalPolicy: GhostFlowApprovalPolicy;
  authentication: GhostFlowAuthenticationRequirement;
  failureSeverity: GhostFlowFailureSeverity;
  historyPolicy: GhostFlowHistoryPolicy;
}

export interface GhostFlowScoreFedRegistryEntry extends GhostFlowRefreshRegistryEntryBase {
  lane: 'score_fed_equity';
  failureSeverity: 'blocking_score_fed';
  scoreInputs: readonly GhostFlowScoreInputReference[];
}

export interface GhostFlowDisplayOnlyRegistryEntry extends GhostFlowRefreshRegistryEntryBase {
  lane: 'display_only_equity';
  failureSeverity: 'nonfatal_display';
  referenceDateRole: 'lagging_allowed' | 'none';
}

export interface GhostFlowTreasuryRegistryEntry extends GhostFlowRefreshRegistryEntryBase {
  lane: 'treasury_display';
  failureSeverity: 'nonfatal_treasury';
  referenceDateRole: 'lagging_allowed' | 'none';
}

export type GhostFlowRefreshRegistryEntry =
  | GhostFlowScoreFedRegistryEntry
  | GhostFlowDisplayOnlyRegistryEntry
  | GhostFlowTreasuryRegistryEntry;

export const GATE_C_CANDIDATE_GROUP_ID = 'gate_c_daily_session' as const;

export const GATE_C_ARTIFACT_IDS = ['volatilityRegime', 'marketBreadth'] as const;
