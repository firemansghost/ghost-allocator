/**
 * GhostFlow v1.7c — Treasury long-end income lens artifact (design only).
 * Pure validation and compute helpers. No production load, buildSnapshot, or score wiring.
 */

import type {
  TreasuryLongEndIncomeLensArtifactV1,
  TreasuryLongEndIncomeLensValidation,
} from './types';

export const TREASURY_LONG_END_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.example.json';

export const TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID =
  'treasury-long-end-income-lens' as const;

export const TREASURY_LONG_END_OBSERVATION_TYPE =
  'treasury_long_end_income_snapshot' as const;

export const TREASURY_LONG_END_SERIES_DEFINITION =
  'fred_treasury_long_end_income_lens_v1' as const;

export const TREASURY_LONG_END_DISPLAY_SIGNAL_NAME = 'Long-End Income Lens' as const;

export const TREASURY_LONG_END_DISPLAY_CARD_CAVEAT =
  'Display-only FRED long-end Treasury income lens; not investment advice, not a bond-buy or duration signal; not in the Research Composite.';

/** Relative tolerance for curve spread reconciliation (percentage points). */
export const PCT_RECONCILIATION_TOLERANCE = 0.05;

const FORBIDDEN_SCORE_KEYS = [
  'mappedPressureScore',
  'candidatePressureScore',
  'pressureScore',
  'displayScore',
  'neglectScore',
  'incomeScore',
] as const;

const FORBIDDEN_ADVICE_KEYS = [
  'buySignal',
  'sellSignal',
  'durationSignal',
  'allocationRecommendation',
  'recommendation',
  'targetAllocation',
  'bondBuy',
  'bondSell',
] as const;

const FORBIDDEN_ADVICE_KEY_PATTERN =
  /buy|sell|allocation|durationSignal|neglectScore|incomeScore/i;

const VALID_SOURCE_ROLES = ['primary', 'context'] as const;

export type TreasuryLongEndValidationMode = 'example' | 'production';

export interface TreasuryLongEndValidateOptions {
  mode?: TreasuryLongEndValidationMode;
}

function normalizeValidateOptions(
  options?: TreasuryLongEndValidateOptions
): { mode: TreasuryLongEndValidationMode } {
  return { mode: options?.mode ?? 'example' };
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

function hasPopulatedForbiddenValue(v: unknown): boolean {
  return v !== null && v !== undefined;
}

/**
 * Long minus short yield spread in percentage points (not basis points).
 */
export function computeCurveSpread(longYieldPct: number, shortYieldPct: number): number {
  return longYieldPct - shortYieldPct;
}

export function reconcileCurveSpread(
  observed: number,
  computed: number,
  tolerance = PCT_RECONCILIATION_TOLERANCE
): boolean {
  return Math.abs(observed - computed) <= tolerance;
}

export function validatePercentRate(value: unknown, fieldName: string): string | null {
  if (!isFiniteNumber(value)) {
    return `${fieldName} must be a finite number.`;
  }
  if (Math.abs(value) > 100) {
    return `${fieldName} must be within absolute value 100 (%).`;
  }
  return null;
}

export function formatYieldPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

function scanForForbiddenKeys(obj: unknown, label: string, errors: string[]): void {
  if (!isPlainObject(obj)) return;

  for (const key of Object.keys(obj)) {
    if ((FORBIDDEN_SCORE_KEYS as readonly string[]).includes(key)) {
      if (hasPopulatedForbiddenValue(obj[key])) {
        errors.push(`${label} must not include populated ${key}.`);
      }
    }
    if ((FORBIDDEN_ADVICE_KEYS as readonly string[]).includes(key)) {
      if (hasPopulatedForbiddenValue(obj[key])) {
        errors.push(`${label} must not include populated ${key} (advice/allocation reserved).`);
      }
    }
    if (
      FORBIDDEN_ADVICE_KEY_PATTERN.test(key) &&
      hasPopulatedForbiddenValue(obj[key]) &&
      !(FORBIDDEN_ADVICE_KEYS as readonly string[]).includes(key) &&
      !(FORBIDDEN_SCORE_KEYS as readonly string[]).includes(key)
    ) {
      errors.push(
        `${label} must not include populated key "${key}" implying advice, allocation, or neglect scoring.`
      );
    }

    const val = obj[key];
    if (isPlainObject(val)) scanForForbiddenKeys(val, `${label}.${key}`, errors);
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        scanForForbiddenKeys(val[i], `${label}[${i}]`, errors);
      }
    }
  }
}

function requireRateField(
  obs: Record<string, unknown>,
  field: string,
  errors: string[],
  required: boolean
): number | undefined {
  const v = obs[field];
  if (v === undefined || v === null) {
    if (required) errors.push(`observations.${field} is required.`);
    return undefined;
  }
  const err = validatePercentRate(v, `observations.${field}`);
  if (err) errors.push(err);
  return isFiniteNumber(v) ? v : undefined;
}

function reconcileCurveField(
  obs: Record<string, unknown>,
  curveField: string,
  shortField: string,
  thirtyYear: number | undefined,
  errors: string[]
): void {
  const curve = obs[curveField];
  const short = obs[shortField];
  if (curve === undefined || curve === null) return;
  if (short === undefined || short === null) return;
  if (thirtyYear === undefined) return;
  if (!isFiniteNumber(curve) || !isFiniteNumber(short)) return;

  const expected = computeCurveSpread(thirtyYear, short);
  if (!reconcileCurveSpread(curve, expected)) {
    errors.push(`observations.${curveField} does not reconcile with thirtyYearNominalYieldPct - ${shortField}.`);
  }
}

function parseOptionalNullOrRate(
  obj: Record<string, unknown> | undefined,
  field: string,
  label: string,
  errors: string[]
): void {
  if (!obj) return;
  const v = obj[field];
  if (v === undefined || v === null) return;
  const err = validatePercentRate(v, `${label}.${field}`);
  if (err) errors.push(err);
}

function parsePercentileField(
  obs: Record<string, unknown>,
  field: string,
  errors: string[]
): void {
  const v = obs[field];
  if (v === undefined) return;
  if (v === null) return;
  if (!isFiniteNumber(v) || v < 0 || v > 100) {
    errors.push(`observations.${field} must be null or a number from 0 to 100.`);
  }
}

export function validateTreasuryLongEndIncomeLensArtifact(
  raw: unknown,
  options?: TreasuryLongEndValidateOptions
): TreasuryLongEndIncomeLensValidation {
  const { mode } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a plain object.'] };
  }

  scanForForbiddenKeys(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID) {
    errors.push(`signalId must be "${TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'daily') {
    errors.push('updateFrequency must be "daily".');
  }
  if (raw.observationType !== TREASURY_LONG_END_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${TREASURY_LONG_END_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== TREASURY_LONG_END_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${TREASURY_LONG_END_SERIES_DEFINITION}".`);
  }
  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }
  if (raw.mappingStatus !== 'not_final') {
    errors.push('mappingStatus must be "not_final".');
  }

  const asOf = raw.asOf;
  const publishedAt = raw.publishedAt;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be ISO YYYY-MM-DD.');
  }
  if (typeof publishedAt !== 'string' || !parseIsoDate(publishedAt)) {
    errors.push('publishedAt must be ISO YYYY-MM-DD.');
  } else if (typeof asOf === 'string' && parseIsoDate(asOf) && compareIso(publishedAt, asOf) < 0) {
    errors.push('publishedAt cannot be before asOf.');
  }

  if (!isPlainObject(raw.source)) {
    errors.push('source must be an object.');
  } else {
    if (typeof raw.source.name !== 'string' || !raw.source.name.trim()) {
      errors.push('source.name is required.');
    }
    if (typeof raw.source.url !== 'string' || !raw.source.url.trim()) {
      errors.push('source.url is required.');
    } else if (!/^https?:\/\//i.test(raw.source.url)) {
      errors.push('source.url must be an http(s) URL.');
    }
    if (typeof raw.source.note !== 'string' || !raw.source.note.trim()) {
      errors.push('source.note is required.');
    }
    if (!Array.isArray(raw.source.series) || raw.source.series.length === 0) {
      errors.push('source.series must be a non-empty array.');
    } else {
      for (let i = 0; i < raw.source.series.length; i++) {
        const entry = raw.source.series[i];
        const prefix = `source.series[${i}]`;
        if (!isPlainObject(entry)) {
          errors.push(`${prefix} must be an object.`);
          continue;
        }
        if (typeof entry.id !== 'string' || !entry.id.trim()) {
          errors.push(`${prefix}.id is required.`);
        }
        if (typeof entry.label !== 'string' || !entry.label.trim()) {
          errors.push(`${prefix}.label is required.`);
        }
        if (typeof entry.url !== 'string' || !entry.url.trim()) {
          errors.push(`${prefix}.url is required.`);
        } else if (!/^https?:\/\//i.test(entry.url)) {
          errors.push(`${prefix}.url must be an http(s) URL.`);
        }
        if (
          typeof entry.role !== 'string' ||
          !(VALID_SOURCE_ROLES as readonly string[]).includes(entry.role)
        ) {
          errors.push(`${prefix}.role must be primary or context.`);
        }
      }
    }
  }

  if (!Array.isArray(raw.caveats) || raw.caveats.length === 0) {
    errors.push('caveats must be a non-empty array.');
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations must be an object.');
    return { ok: false, errors };
  }

  const obs = raw.observations;
  if (obs.mappingStatus !== 'not_final') {
    errors.push('observations.mappingStatus must be "not_final".');
  }

  const thirtyYear = requireRateField(obs, 'thirtyYearNominalYieldPct', errors, true);
  requireRateField(obs, 'thirtyYearTipsRealYieldPct', errors, true);

  requireRateField(obs, 'tenYearBreakevenInflationPct', errors, false);
  requireRateField(obs, 'twoYearYieldPct', errors, false);
  requireRateField(obs, 'fiveYearYieldPct', errors, false);
  requireRateField(obs, 'tenYearYieldPct', errors, false);
  requireRateField(obs, 'curve2s30sPct', errors, false);
  requireRateField(obs, 'curve5s30sPct', errors, false);
  requireRateField(obs, 'curve10s30sPct', errors, false);

  parsePercentileField(obs, 'nominalYieldPercentile', errors);
  parsePercentileField(obs, 'realYieldPercentile', errors);

  reconcileCurveField(obs, 'curve2s30sPct', 'twoYearYieldPct', thirtyYear, errors);
  reconcileCurveField(obs, 'curve5s30sPct', 'fiveYearYieldPct', thirtyYear, errors);
  reconcileCurveField(obs, 'curve10s30sPct', 'tenYearYieldPct', thirtyYear, errors);

  if (raw.optionalObservations !== undefined) {
    if (!isPlainObject(raw.optionalObservations)) {
      errors.push('optionalObservations must be an object when present.');
    } else {
      const opt = raw.optionalObservations;
      for (const key of ['longDurationTreasuryEtfFlowMillionsUsd', 'longDurationTreasuryEtfAumMillionsUsd']) {
        const v = opt[key];
        if (v !== undefined && v !== null) {
          if (!isFiniteNumber(v)) {
            errors.push(`optionalObservations.${key} must be null or a finite number.`);
          }
        }
      }
      parseOptionalNullOrRate(opt, 'termPremiumPct', 'optionalObservations', errors);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as TreasuryLongEndIncomeLensArtifactV1,
  };
}
