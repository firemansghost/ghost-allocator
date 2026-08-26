/**
 * GhostFlow manual report-only operator runner.
 * Orchestrates existing adapters and the offline refresh planner without writes.
 */

import { CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER } from './adapters/cftcTffSystematicSocrata';
import { CFTC_TFF_TREASURY_SOCRATA_ADAPTER } from './adapters/cftcTffTreasurySocrata';
import { FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER } from './adapters/frbH15TreasuryYieldsSdmx';
import { isValidCalendarDate, isValidIsoTimestamp } from './dateValidation';
import { summarizeCurrentGhostFlowArtifact } from './currentArtifactSummary';
import { buildGhostFlowRefreshReport } from './planner';
import { GHOSTFLOW_REFRESH_REGISTRY } from './registry';
import type {
  GhostFlowArtifactRefreshAttempt,
  GhostFlowCandidateObservationSummary,
  GhostFlowCurrentArtifactSummary,
  GhostFlowRefreshReport,
} from './report';
import type {
  GhostFlowNormalizedObservation,
  GhostFlowRefreshIssue,
  GhostFlowSourceAdapter,
  GhostFlowStageResult,
} from './types';

/** Explicit operator allowlist — new artifacts require a reviewed code change. */
export const GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS = [
  'systematicFlowProxy',
  'treasuryFuturesPositioningProxy',
  'treasuryLongEndIncomeLens',
] as const;

export type GhostFlowOperatorReportArtifactId =
  (typeof GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS)[number];

const OPERATOR_ALLOWLIST_SET = new Set<string>(GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS);

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

export type GhostFlowOperatorAdapter = GhostFlowSourceAdapter<unknown, unknown, unknown>;

export type GhostFlowOperatorAdapterMap = Record<
  GhostFlowOperatorReportArtifactId,
  GhostFlowOperatorAdapter
>;

export const DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP: GhostFlowOperatorAdapterMap = {
  systematicFlowProxy: CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER,
  treasuryFuturesPositioningProxy: CFTC_TFF_TREASURY_SOCRATA_ADAPTER,
  treasuryLongEndIncomeLens: FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER,
};

export type GhostFlowOperatorReportInput = {
  nowIso: string;
  /** When omitted, all allowlisted artifacts run in fixed allowlist order. */
  requestedArtifactIds?: readonly GhostFlowOperatorReportArtifactId[];
  currentArtifactsById: Partial<
    Record<GhostFlowOperatorReportArtifactId, unknown>
  >;
  /** Optional pre-validated summaries (tests); skips re-validation when provided. */
  currentSummariesById?: Partial<
    Record<GhostFlowOperatorReportArtifactId, GhostFlowCurrentArtifactSummary>
  >;
  /** Read/report ceiling only — does not mutate GHOSTFLOW_REFERENCE_AS_OF. */
  referenceAsOf?: string;
  adapters?: GhostFlowOperatorAdapterMap;
};

export type GhostFlowOperatorReportResult =
  | { ok: true; report: GhostFlowRefreshReport; attempts: GhostFlowArtifactRefreshAttempt[] }
  | { ok: false; issues: GhostFlowRefreshIssue[] };

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function infoIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'reconcile', code, severity: 'info', message };
}

function registryArtifactPath(artifactId: GhostFlowOperatorReportArtifactId): string {
  const entry = REGISTRY_BY_ID.get(artifactId);
  if (!entry) {
    throw new Error(`Registry entry missing for operator artifact: ${artifactId}`);
  }
  return entry.artifactPath;
}

/**
 * Resolve requested artifact IDs to a deduplicated list in fixed allowlist order.
 * Duplicate CLI selections are deduplicated (first occurrence wins).
 * Unknown or non-allowlisted IDs fail closed.
 */
export function resolveOperatorRequestedArtifactIds(
  requested?: readonly string[]
): GhostFlowStageResult<readonly GhostFlowOperatorReportArtifactId[]> {
  if (requested === undefined || requested.length === 0) {
    return {
      ok: true,
      value: GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS,
      issues: [],
    };
  }

  const issues: GhostFlowRefreshIssue[] = [];
  const seen = new Set<string>();
  const deduped: GhostFlowOperatorReportArtifactId[] = [];

  for (const id of requested) {
    if (!OPERATOR_ALLOWLIST_SET.has(id)) {
      issues.push(
        blockIssue(
          'operator_artifact_not_allowlisted',
          `Artifact "${id}" is not enabled for the operator runner`
        )
      );
      continue;
    }
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    deduped.push(id as GhostFlowOperatorReportArtifactId);
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const ordered = GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS.filter((id) => seen.has(id));
  return { ok: true, value: ordered, issues: [] };
}

function validateOperatorInput(
  input: GhostFlowOperatorReportInput,
  requested: readonly GhostFlowOperatorReportArtifactId[]
): GhostFlowRefreshIssue[] {
  const issues: GhostFlowRefreshIssue[] = [];

  if (!isValidIsoTimestamp(input.nowIso)) {
    issues.push(
      blockIssue('operator_invalid_now_iso', `nowIso must be a valid ISO timestamp: ${input.nowIso}`)
    );
  }

  if (
    input.referenceAsOf !== undefined &&
    !isValidCalendarDate(input.referenceAsOf)
  ) {
    issues.push(
      blockIssue(
        'operator_invalid_reference_as_of',
        `referenceAsOf must be a valid calendar date: ${input.referenceAsOf}`
      )
    );
  }

  for (const artifactId of requested) {
    const hasSummary = input.currentSummariesById?.[artifactId] !== undefined;
    const hasRaw = input.currentArtifactsById[artifactId] !== undefined;
    if (!hasSummary && !hasRaw) {
      issues.push(
        blockIssue(
          'operator_missing_current_artifact',
          `Current artifact payload missing for ${artifactId}`
        )
      );
    }
  }

  return issues;
}

function resolveCurrentSummary(
  input: GhostFlowOperatorReportInput,
  artifactId: GhostFlowOperatorReportArtifactId
): GhostFlowStageResult<GhostFlowCurrentArtifactSummary> {
  const preset = input.currentSummariesById?.[artifactId];
  if (preset) {
    return { ok: true, value: preset, issues: [] };
  }

  const raw = input.currentArtifactsById[artifactId];
  return summarizeCurrentGhostFlowArtifact(
    artifactId,
    raw,
    registryArtifactPath(artifactId)
  );
}

function manualInputAttempt(
  current: GhostFlowCurrentArtifactSummary,
  issues: GhostFlowRefreshIssue[]
): GhostFlowArtifactRefreshAttempt {
  return {
    artifactId: current.artifactId,
    status: 'manual_input_required',
    current,
    issues,
  };
}

function sourceFailedAttempt(
  current: GhostFlowCurrentArtifactSummary,
  issues: GhostFlowRefreshIssue[]
): GhostFlowArtifactRefreshAttempt {
  return {
    artifactId: current.artifactId,
    status: 'source_failed',
    current,
    issues,
  };
}

function noNewerAttempt(
  current: GhostFlowCurrentArtifactSummary,
  issues: GhostFlowRefreshIssue[]
): GhostFlowArtifactRefreshAttempt {
  return {
    artifactId: current.artifactId,
    status: 'no_newer_observation',
    current,
    issues,
  };
}

function candidateAttempt(
  current: GhostFlowCurrentArtifactSummary,
  candidate: GhostFlowCandidateObservationSummary,
  issues: GhostFlowRefreshIssue[]
): GhostFlowArtifactRefreshAttempt {
  return {
    artifactId: current.artifactId,
    status: 'candidate_observation_available',
    current,
    candidate,
    issues,
  };
}

function candidateFromNormalized(
  normalized: GhostFlowNormalizedObservation<unknown>
): GhostFlowCandidateObservationSummary {
  const { provenance, observationAsOf } = normalized;
  const candidate: GhostFlowCandidateObservationSummary = {
    observationAsOf,
    retrievedAt: provenance.retrievedAt,
    contentSha256: provenance.contentSha256,
    adapterId: provenance.adapterId,
    parserVersion: provenance.parserVersion,
  };
  if (provenance.sourcePublishedAt !== undefined) {
    candidate.sourcePublishedAt = provenance.sourcePublishedAt;
  }
  return candidate;
}

async function executeOperatorArtifact(
  artifactId: GhostFlowOperatorReportArtifactId,
  input: GhostFlowOperatorReportInput,
  adapter: GhostFlowOperatorAdapter
): Promise<GhostFlowArtifactRefreshAttempt> {
  const currentResult = resolveCurrentSummary(input, artifactId);
  if (!currentResult.ok) {
    const artifactPath = registryArtifactPath(artifactId);
    return manualInputAttempt(
      { artifactId, artifactPath },
      currentResult.issues
    );
  }

  const current = currentResult.value;
  const fetchContext = {
    nowIso: input.nowIso,
    referenceAsOf: input.referenceAsOf,
  };
  const parseContext = { nowIso: input.nowIso };
  const normalizeContext = {
    nowIso: input.nowIso,
    referenceAsOf: input.referenceAsOf,
  };

  const fetchResult = await adapter.fetch(fetchContext);
  if (!fetchResult.ok) {
    return sourceFailedAttempt(current, fetchResult.issues);
  }

  const carriedIssues = [...fetchResult.issues];
  const parseResult = adapter.parse(fetchResult.value, parseContext);
  if (!parseResult.ok) {
    return sourceFailedAttempt(current, [...carriedIssues, ...parseResult.issues]);
  }

  carriedIssues.push(...parseResult.issues);
  const normalizeResult = adapter.normalize(parseResult.value, normalizeContext);
  if (!normalizeResult.ok) {
    return sourceFailedAttempt(current, [...carriedIssues, ...normalizeResult.issues]);
  }

  carriedIssues.push(...normalizeResult.issues);
  const normalized = normalizeResult.value;
  const candidateDate = normalized.observationAsOf;
  const currentDate = current.observationAsOf;

  if (currentDate === undefined) {
    return manualInputAttempt(current, [
      ...carriedIssues,
      blockIssue(
        'operator_current_observation_date_missing',
        'Current artifact summary is missing observationAsOf after validation'
      ),
    ]);
  }

  if (candidateDate > currentDate) {
    return candidateAttempt(
      current,
      candidateFromNormalized(normalized),
      carriedIssues
    );
  }

  const issues = [...carriedIssues];
  if (candidateDate < currentDate) {
    issues.push(
      infoIssue(
        'operator_source_observation_older_than_current',
        `Source observation ${candidateDate} is older than current production ${currentDate}`
      )
    );
  }

  return noNewerAttempt(current, issues);
}

/**
 * Run the report-only operator refresh path for explicitly allowlisted artifacts.
 * Sequential, deterministic execution; no production or candidate writes.
 */
export async function runGhostFlowOperatorReport(
  input: GhostFlowOperatorReportInput
): Promise<GhostFlowOperatorReportResult> {
  const resolved = resolveOperatorRequestedArtifactIds(
    input.requestedArtifactIds as string[] | undefined
  );
  if (!resolved.ok) {
    return { ok: false, issues: resolved.issues };
  }

  const requested = resolved.value;
  const configIssues = validateOperatorInput(input, requested);
  if (configIssues.length > 0) {
    return { ok: false, issues: configIssues };
  }

  const adapters = input.adapters ?? DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP;
  const attempts: GhostFlowArtifactRefreshAttempt[] = [];

  for (const artifactId of requested) {
    const attempt = await executeOperatorArtifact(artifactId, input, adapters[artifactId]);
    attempts.push(attempt);
  }

  const plannerResult = buildGhostFlowRefreshReport({
    generatedAt: input.nowIso,
    requestedArtifactIds: requested,
    attempts,
  });

  if (!plannerResult.ok) {
    return { ok: false, issues: plannerResult.issues };
  }

  return {
    ok: true,
    report: plannerResult.value,
    attempts,
  };
}
