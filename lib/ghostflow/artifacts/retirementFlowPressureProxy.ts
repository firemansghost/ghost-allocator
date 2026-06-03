/**
 * GhostFlow v1.2b/c — Retirement flow pressure proxy artifact.
 * Pure validation, display helpers, and freshness. Display-only buildSnapshot merge; no score wiring.
 */

import retirementFlowPressureProxyArtifactJson from '@/data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json';
import { calendarDaysAfter } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type {
  ArtifactFreshnessResult,
  GhostFlowArtifactFreshnessStatus,
  RetirementFlowPressureArtifactV1,
  RetirementFlowPressureObservationsV1,
  RetirementFlowPressureProxyValidation,
} from './types';

export const RETIREMENT_FLOW_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json';

export const RETIREMENT_FLOW_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json';

export const RETIREMENT_FLOW_SIGNAL_ID = 'retirement-flow-pressure-proxy' as const;

export const RETIREMENT_FLOW_OBSERVATION_TYPE =
  'quarterly_retirement_market_snapshot' as const;

export const RETIREMENT_FLOW_SERIES_DEFINITION =
  'ici_retirement_market_quarterly_assets_v1' as const;

export const RETIREMENT_FLOW_DISPLAY_SIGNAL_ID = 'retirement-asset-growth' as const;

export const RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME =
  'Retirement Asset Growth Proxy' as const;

export const RETIREMENT_FLOW_DISPLAY_CARD_CAVEAT =
  'Display-only quarterly retirement asset-growth proxy; not live flow pressure and not included in the Research Composite.';

/** Quarterly artifact freshness (calendar days after publishedAt). */
const FRESHNESS_FRESH_DAYS = 45;
const FRESHNESS_CAUTION_DAYS = 90;

export type RetirementFlowValidationMode = 'example' | 'production';

export interface RetirementFlowValidateOptions {
  mode?: RetirementFlowValidationMode;
  referenceAsOf?: string;
}

/** Relative tolerance for growth % reconciliation (percentage points). */
export const GROWTH_RECONCILIATION_TOLERANCE_PCT = 0.15;

function normalizeValidateOptions(
  options?: string | RetirementFlowValidateOptions
): { mode: RetirementFlowValidationMode; referenceAsOf?: string } {
  if (typeof options === 'string') {
    return { mode: 'example', referenceAsOf: options };
  }
  return {
    mode: options?.mode ?? 'example',
    referenceAsOf: options?.referenceAsOf,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseIsoDate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));
}

function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function requireNonEmptyString(name: string, v: unknown, errors: string[]): v is string {
  if (typeof v !== 'string' || !v.trim()) {
    errors.push(`${name} must be a non-empty string.`);
    return false;
  }
  return true;
}

function rejectForbiddenScoreFields(
  obj: Record<string, unknown>,
  label: string,
  errors: string[]
): void {
  if ('mappedPressureScore' in obj) {
    errors.push(`${label} must not include mappedPressureScore.`);
  }
  if ('candidatePressureScore' in obj) {
    errors.push(`${label} must not include candidatePressureScore.`);
  }
}

/**
 * Quarter-over-quarter asset growth (%), given current and prior-quarter totals (same units).
 */
export function computeQuarterOverQuarterAssetGrowthPct(
  currentTotal: number,
  priorQuarterTotal: number
): number {
  if (priorQuarterTotal <= 0) return 0;
  return ((currentTotal - priorQuarterTotal) / priorQuarterTotal) * 100;
}

/**
 * Year-over-year asset growth (%), given current and prior-year totals (same units).
 */
export function computeYearOverYearAssetGrowthPct(
  currentTotal: number,
  priorYearTotal: number
): number {
  if (priorYearTotal <= 0) return 0;
  return ((currentTotal - priorYearTotal) / priorYearTotal) * 100;
}

function growthReconciles(
  statedPct: number,
  currentTotal: number,
  priorTotal: number
): boolean {
  const expected = computeQuarterOverQuarterAssetGrowthPct(currentTotal, priorTotal);
  return Math.abs(statedPct - expected) <= GROWTH_RECONCILIATION_TOLERANCE_PCT;
}

function validateAssetField(
  name: string,
  v: unknown,
  errors: string[]
): v is number {
  if (!isFiniteNumber(v) || v < 0) {
    errors.push(`${name} must be a finite non-negative number.`);
    return false;
  }
  return true;
}

function validateOptionalAssetField(
  name: string,
  v: unknown,
  errors: string[]
): boolean {
  if (v === undefined) return true;
  return validateAssetField(name, v, errors);
}

function validateOptionalGrowthField(name: string, v: unknown, errors: string[]): boolean {
  if (v === undefined) return true;
  if (!isFiniteNumber(v)) {
    errors.push(`${name} must be finite when present.`);
    return false;
  }
  return true;
}

export function validateRetirementFlowPressureProxyArtifact(
  raw: unknown,
  options?: string | RetirementFlowValidateOptions
): RetirementFlowPressureProxyValidation {
  const { mode, referenceAsOf } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  rejectForbiddenScoreFields(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== RETIREMENT_FLOW_SIGNAL_ID) {
    errors.push(`signalId must be "${RETIREMENT_FLOW_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'quarterly') {
    errors.push('updateFrequency must be "quarterly".');
  }
  if (raw.observationType !== RETIREMENT_FLOW_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${RETIREMENT_FLOW_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== RETIREMENT_FLOW_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${RETIREMENT_FLOW_SERIES_DEFINITION}".`);
  }

  const asOf = raw.asOf;
  const publishedAt = raw.publishedAt;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD).');
  }
  if (typeof publishedAt !== 'string' || !parseIsoDate(publishedAt)) {
    errors.push('publishedAt must be a valid ISO date (YYYY-MM-DD).');
  }
  if (
    typeof asOf === 'string' &&
    typeof publishedAt === 'string' &&
    parseIsoDate(asOf) &&
    parseIsoDate(publishedAt) &&
    compareIso(publishedAt, asOf) < 0
  ) {
    errors.push('publishedAt cannot be before asOf.');
  }
  if (
    referenceAsOf &&
    typeof asOf === 'string' &&
    parseIsoDate(asOf) &&
    compareIso(asOf, referenceAsOf) > 0
  ) {
    errors.push(`asOf (${asOf}) cannot be after referenceAsOf (${referenceAsOf}).`);
  }

  const source = raw.source;
  if (!isPlainObject(source)) {
    errors.push('source must be an object with name and url.');
  } else {
    requireNonEmptyString('source.name', source.name, errors);
    requireNonEmptyString('source.url', source.url, errors);
  }

  const caveats = raw.caveats;
  if (!Array.isArray(caveats) || caveats.length === 0) {
    errors.push('caveats must be a non-empty string array.');
  } else {
    for (let i = 0; i < caveats.length; i++) {
      if (typeof caveats[i] !== 'string' || !String(caveats[i]).trim()) {
        errors.push(`caveats[${i}] must be a non-empty string.`);
      }
    }
  }

  const dataQuality = raw.dataQuality;
  if (dataQuality !== 'verified_manual' && dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  const observations = raw.observations;
  if (!isPlainObject(observations)) {
    errors.push('observations must be an object.');
  } else {
    rejectForbiddenScoreFields(observations, 'observations', errors);

    const mappingStatus = observations.mappingStatus;
    if (mappingStatus !== 'not_final') {
      errors.push('observations.mappingStatus must be "not_final".');
    }

    const total = observations.totalRetirementMarketAssetsTrillionsUsd;
    const dc = observations.definedContributionAssetsTrillionsUsd;
    const ira = observations.iraAssetsTrillionsUsd;

    validateAssetField(
      'observations.totalRetirementMarketAssetsTrillionsUsd',
      total,
      errors
    );
    validateAssetField(
      'observations.definedContributionAssetsTrillionsUsd',
      dc,
      errors
    );
    validateAssetField('observations.iraAssetsTrillionsUsd', ira, errors);

    validateOptionalAssetField(
      'observations.targetDateFundAssetsBillionsUsd',
      observations.targetDateFundAssetsBillionsUsd,
      errors
    );
    validateOptionalAssetField(
      'observations.priorQuarterTotalAssetsTrillionsUsd',
      observations.priorQuarterTotalAssetsTrillionsUsd,
      errors
    );
    validateOptionalAssetField(
      'observations.priorYearTotalAssetsTrillionsUsd',
      observations.priorYearTotalAssetsTrillionsUsd,
      errors
    );

    validateOptionalGrowthField(
      'observations.quarterOverQuarterAssetGrowthPct',
      observations.quarterOverQuarterAssetGrowthPct,
      errors
    );
    validateOptionalGrowthField(
      'observations.yearOverYearAssetGrowthPct',
      observations.yearOverYearAssetGrowthPct,
      errors
    );

    const eqAlloc = observations.equityAllocationProxyPct;
    if (eqAlloc !== undefined) {
      if (!isFiniteNumber(eqAlloc) || eqAlloc < 0 || eqAlloc > 100) {
        errors.push(
          'observations.equityAllocationProxyPct must be finite and between 0 and 100 when present.'
        );
      }
    }

    const seasonFlag = observations.contributionSeasonFlag;
    if (
      seasonFlag !== undefined &&
      seasonFlag !== 'payroll_peak' &&
      seasonFlag !== 'ira_contribution_season' &&
      seasonFlag !== 'neutral'
    ) {
      errors.push(
        'observations.contributionSeasonFlag must be payroll_peak, ira_contribution_season, or neutral when present.'
      );
    }

    if (
      isFiniteNumber(total) &&
      isFiniteNumber(observations.priorQuarterTotalAssetsTrillionsUsd) &&
      isFiniteNumber(observations.quarterOverQuarterAssetGrowthPct)
    ) {
      const priorQ = observations.priorQuarterTotalAssetsTrillionsUsd as number;
      const statedQoQ = observations.quarterOverQuarterAssetGrowthPct as number;
      if (!growthReconciles(statedQoQ, total, priorQ)) {
        const expected = computeQuarterOverQuarterAssetGrowthPct(total, priorQ);
        errors.push(
          `observations.quarterOverQuarterAssetGrowthPct (${statedQoQ}) does not reconcile with prior quarter total (expected ~${expected.toFixed(2)}).`
        );
      }
    }

    if (
      isFiniteNumber(total) &&
      isFiniteNumber(observations.priorYearTotalAssetsTrillionsUsd) &&
      isFiniteNumber(observations.yearOverYearAssetGrowthPct)
    ) {
      const priorY = observations.priorYearTotalAssetsTrillionsUsd as number;
      const statedYoY = observations.yearOverYearAssetGrowthPct as number;
      const expectedYoY = computeYearOverYearAssetGrowthPct(total, priorY);
      if (Math.abs(statedYoY - expectedYoY) > GROWTH_RECONCILIATION_TOLERANCE_PCT) {
        errors.push(
          `observations.yearOverYearAssetGrowthPct (${statedYoY}) does not reconcile with prior year total (expected ~${expectedYoY.toFixed(2)}).`
        );
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as RetirementFlowPressureArtifactV1,
  };
}

export function loadRetirementFlowPressureProxyArtifact(): RetirementFlowPressureProxyValidation {
  return validateRetirementFlowPressureProxyArtifact(retirementFlowPressureProxyArtifactJson, {
    mode: 'production',
    referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF,
  });
}

export function formatRetirementFlowDisplayValue(
  observations: RetirementFlowPressureObservationsV1
): string {
  const total = observations.totalRetirementMarketAssetsTrillionsUsd;
  const qoq = observations.quarterOverQuarterAssetGrowthPct ?? 0;
  const yoy = observations.yearOverYearAssetGrowthPct ?? 0;
  return `$${total.toFixed(1)}T retirement assets · QoQ +${qoq.toFixed(1)}% · YoY +${yoy.toFixed(1)}%`;
}

export function buildRetirementFlowDisplayExplanation(
  artifact: RetirementFlowPressureArtifactV1
): string {
  const { observations: o } = artifact;
  return (
    `ICI Retirement Market Table 1 quarterly structural asset levels: $${o.totalRetirementMarketAssetsTrillionsUsd.toFixed(1)}T total ` +
    `(IRA $${o.iraAssetsTrillionsUsd.toFixed(1)}T, DC $${o.definedContributionAssetsTrillionsUsd.toFixed(1)}T), ` +
    `QoQ +${(o.quarterOverQuarterAssetGrowthPct ?? 0).toFixed(1)}%, YoY +${(o.yearOverYearAssetGrowthPct ?? 0).toFixed(1)}%. ` +
    `Levels reflect market returns and revaluations, not isolated payroll contribution flow. ` +
    `mappingStatus: ${o.mappingStatus}; not included in the Research Composite.`
  );
}

export function retirementFlowFreshnessAnchor(
  artifact: RetirementFlowPressureArtifactV1
): string {
  return artifact.publishedAt ?? artifact.asOf;
}

function statusFromRetirementFreshnessDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= FRESHNESS_FRESH_DAYS) return 'fresh';
  if (days <= FRESHNESS_CAUTION_DAYS) return 'caution';
  return 'stale';
}

export function evaluateRetirementFlowPressureArtifactFreshness(
  artifact: RetirementFlowPressureArtifactV1,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): ArtifactFreshnessResult {
  const anchor = retirementFlowFreshnessAnchor(artifact);
  const ageDays = calendarDaysAfter(anchor, referenceAsOf);
  const status = statusFromRetirementFreshnessDays(ageDays);
  const warnings: string[] = [];
  const label = 'Retirement Asset Growth Proxy';

  if (status === 'caution') {
    warnings.push(
      `${label} artifact is ${ageDays} calendar days since release (caution: ${FRESHNESS_FRESH_DAYS + 1}–${FRESHNESS_CAUTION_DAYS} days). ` +
        `Normal quarterly ICI cadence — not a failed feed or score problem.`
    );
  } else if (status === 'stale') {
    warnings.push(
      `${label} artifact is ${ageDays} calendar days since release (stale: >${FRESHNESS_CAUTION_DAYS} days). Refresh recommended.`
    );
  }

  return { status, ageDays, warnings };
}
