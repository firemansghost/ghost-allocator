/**
 * GhostFlow v1.7c/d.1 — Treasury long-end income lens artifact.
 * Pure validation and compute helpers; production loader for v1.7d.1 candidate JSON.
 * No buildSnapshot merge or score wiring.
 */

import treasuryLongEndIncomeLensArtifactJson from '@/data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json';
import type {
  TreasuryLongEndIncomeLensArtifactV1,
  TreasuryLongEndIncomeLensSeriesDefinition,
  TreasuryLongEndIncomeLensValidation,
  TreasuryLongEndSourceSeriesRole,
} from './types';

export const TREASURY_LONG_END_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.example.json';

export const TREASURY_LONG_END_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json';

export const TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID =
  'treasury-long-end-income-lens' as const;

export const TREASURY_LONG_END_OBSERVATION_TYPE =
  'treasury_long_end_income_snapshot' as const;

export const TREASURY_LONG_END_SERIES_DEFINITION =
  'fred_treasury_long_end_income_lens_v1' as const;

export const TREASURY_LONG_END_BOARD_SERIES_DEFINITION =
  'frb_h15_treasury_long_end_income_lens_v1' as const;

export const TREASURY_LONG_END_BOARD_RELEASE_URL =
  'https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip' as const;

export const TREASURY_LONG_END_BOARD_SOURCE_NAME =
  'Board of Governors of the Federal Reserve System — H.15 Selected Interest Rates' as const;

export interface TreasuryLongEndBoardSourceSeriesSpec {
  id: string;
  label: string;
  role: TreasuryLongEndSourceSeriesRole;
}

export const TREASURY_LONG_END_BOARD_PRIMARY_SERIES: readonly TreasuryLongEndBoardSourceSeriesSpec[] =
  [
    {
      id: 'RIFLGFCY30_N.B',
      label: '30-Year Treasury Constant Maturity Rate (nominal)',
      role: 'primary',
    },
    {
      id: 'RIFLGFCY30_XII_N.B',
      label: '30-Year Treasury Inflation-Indexed Constant Maturity Rate (real)',
      role: 'primary',
    },
  ] as const;

export const TREASURY_LONG_END_BOARD_CONTEXT_SERIES: readonly TreasuryLongEndBoardSourceSeriesSpec[] =
  [
    { id: 'RIFLGFCY02_N.B', label: '2-Year Treasury Constant Maturity Rate', role: 'context' },
    { id: 'RIFLGFCY05_N.B', label: '5-Year Treasury Constant Maturity Rate', role: 'context' },
    { id: 'RIFLGFCY10_N.B', label: '10-Year Treasury Constant Maturity Rate', role: 'context' },
  ] as const;

export const TREASURY_LONG_END_BOARD_SOURCE_SERIES: readonly TreasuryLongEndBoardSourceSeriesSpec[] =
  [...TREASURY_LONG_END_BOARD_PRIMARY_SERIES, ...TREASURY_LONG_END_BOARD_CONTEXT_SERIES];

export const TREASURY_LONG_END_BOARD_SOURCE_NOTE =
  'Automated candidate from Board H.15 release-level constant-maturity yields (nominal + inflation-indexed). Display-only Treasury Plumbing card; not scored; mappingStatus not_final.' as const;

export const TREASURY_LONG_END_BOARD_CAVEATS = [
  'Not investment advice and not a recommendation to buy or sell Treasury securities or bond funds.',
  'Not a duration allocation signal — yield levels alone do not prove income neglect or investor behavior.',
  'Nominal and real yields can move for different macro reasons; duration risk remains.',
  'Display-only Treasury Plumbing card (separate lane, v1.7e); outside equity publicSignalCount; not merged into buildSnapshot or Research Composite.',
  'Board H.15 snapshot; mappingStatus not_final; no scored pressure mapping.',
] as const;

export const TREASURY_LONG_END_DISPLAY_SIGNAL_NAME = 'Long-End Income Lens' as const;

export const TREASURY_LONG_END_DISPLAY_CARD_CAVEAT =
  'Display-only FRED long-end Treasury income lens; not investment advice, not a bond-buy or duration signal; not in the Research Composite.';

export const TREASURY_LONG_END_DISPLAY_CARD_CAVEAT_BOARD =
  'Display-only Board H.15 long-end Treasury income lens; not investment advice, not a bond-buy or duration signal; not in the Research Composite.';

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

type TreasuryLongEndDataQuality = TreasuryLongEndIncomeLensArtifactV1['dataQuality'];

function parseLongEndDataQuality(
  raw: unknown,
  allowed: readonly TreasuryLongEndDataQuality[],
  errors: string[]
): TreasuryLongEndDataQuality | null {
  if (raw === undefined || raw === null) {
    errors.push('dataQuality is required.');
    return null;
  }
  if (!(allowed as readonly string[]).includes(raw as string)) {
    errors.push(`dataQuality must be ${allowed.join(' or ')}.`);
    return null;
  }
  return raw as TreasuryLongEndDataQuality;
}

function parseLongEndPublishedAt(
  rawPublishedAt: unknown,
  asOf: string | undefined,
  required: boolean,
  errors: string[]
): string | undefined {
  if (rawPublishedAt === undefined || rawPublishedAt === null) {
    if (required) {
      errors.push('publishedAt must be ISO YYYY-MM-DD.');
    }
    return undefined;
  }
  if (typeof rawPublishedAt !== 'string' || !parseIsoDate(rawPublishedAt)) {
    errors.push('publishedAt must be ISO YYYY-MM-DD.');
    return undefined;
  }
  if (typeof asOf === 'string' && parseIsoDate(asOf) && compareIso(rawPublishedAt, asOf) < 0) {
    errors.push('publishedAt cannot be before asOf.');
  }
  return rawPublishedAt;
}

function validateLongEndSourceStructure(raw: Record<string, unknown>, errors: string[]): void {
  if (!isPlainObject(raw.source)) {
    errors.push('source must be an object.');
    return;
  }
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
    return;
  }
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

function validateLongEndObservationsCommon(
  obs: Record<string, unknown>,
  errors: string[],
  options: { allowBreakeven: boolean }
): number | undefined {
  if (obs.mappingStatus !== 'not_final') {
    errors.push('observations.mappingStatus must be "not_final".');
  }

  const thirtyYear = requireRateField(obs, 'thirtyYearNominalYieldPct', errors, true);
  requireRateField(obs, 'thirtyYearTipsRealYieldPct', errors, true);

  if (options.allowBreakeven) {
    requireRateField(obs, 'tenYearBreakevenInflationPct', errors, false);
  } else if (
    obs.tenYearBreakevenInflationPct !== undefined &&
    obs.tenYearBreakevenInflationPct !== null
  ) {
    errors.push('observations.tenYearBreakevenInflationPct is forbidden for Board-native artifacts.');
  }

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

  return thirtyYear;
}

function isForbiddenBoardSeriesId(id: string): boolean {
  if (id === 'T10YIE') return true;
  if (id.startsWith('DGS')) return true;
  if (id.startsWith('DFII')) return true;
  if (id.startsWith('H15/')) return true;
  return false;
}

function validateLegacyFredLongEndBranch(
  raw: Record<string, unknown>,
  mode: TreasuryLongEndValidationMode,
  errors: string[]
): void {
  if (raw.dataQuality === 'verified_automated') {
    errors.push('dataQuality verified_automated is not allowed for legacy FRED seriesDefinition.');
  }
  parseLongEndDataQuality(raw.dataQuality, ['verified_manual', 'manual_unverified'], errors);

  const asOfStr = typeof raw.asOf === 'string' ? raw.asOf : undefined;
  parseLongEndPublishedAt(raw.publishedAt, asOfStr, true, errors);

  validateLongEndSourceStructure(raw, errors);

  if (isPlainObject(raw.source) && Array.isArray(raw.source.series)) {
    for (let i = 0; i < raw.source.series.length; i++) {
      const entry = raw.source.series[i];
      if (!isPlainObject(entry) || typeof entry.id !== 'string') continue;
      if (entry.id.startsWith('RIFLGFCY') || entry.id.startsWith('H15/')) {
        errors.push(
          `source.series[${i}].id ${entry.id} is not valid for legacy FRED seriesDefinition.`
        );
      }
    }
    if (
      typeof raw.source.url === 'string' &&
      raw.source.url === TREASURY_LONG_END_BOARD_RELEASE_URL
    ) {
      errors.push('source.url must not use Board H.15 release URL on legacy FRED seriesDefinition.');
    }
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations must be an object.');
    return;
  }

  validateLongEndObservationsCommon(raw.observations, errors, { allowBreakeven: true });
}

function validateBoardNativeLongEndBranch(
  raw: Record<string, unknown>,
  mode: TreasuryLongEndValidationMode,
  errors: string[]
): void {
  if (mode !== 'production') {
    errors.push('Board-native seriesDefinition requires mode: production.');
  }
  if (raw.dataQuality !== 'verified_automated') {
    errors.push('dataQuality must be verified_automated for Board-native artifacts.');
  }

  const asOfStr = typeof raw.asOf === 'string' ? raw.asOf : undefined;
  parseLongEndPublishedAt(raw.publishedAt, asOfStr, false, errors);

  if (!isPlainObject(raw.source)) {
    errors.push('source must be an object.');
  } else {
    const name = raw.source.name;
    if (typeof name !== 'string' || !name.trim()) {
      errors.push('source.name is required.');
    } else if (/FRED/i.test(name)) {
      errors.push('source.name must not attribute FRED for Board-native artifacts.');
    }
    const url = raw.source.url;
    if (typeof url !== 'string' || !url.trim()) {
      errors.push('source.url is required.');
    } else if (url !== TREASURY_LONG_END_BOARD_RELEASE_URL) {
      errors.push(`source.url must be "${TREASURY_LONG_END_BOARD_RELEASE_URL}".`);
    }
    if (typeof raw.source.note !== 'string' || !raw.source.note.trim()) {
      errors.push('source.note is required.');
    }

    if (!Array.isArray(raw.source.series)) {
      errors.push('source.series must be an array.');
    } else {
      if (raw.source.series.length !== TREASURY_LONG_END_BOARD_SOURCE_SERIES.length) {
        errors.push(
          `source.series must contain exactly ${TREASURY_LONG_END_BOARD_SOURCE_SERIES.length} Board H.15 series.`
        );
      }
      const seenIds = new Set<string>();
      for (let i = 0; i < raw.source.series.length; i++) {
        const entry = raw.source.series[i];
        const prefix = `source.series[${i}]`;
        if (!isPlainObject(entry)) {
          errors.push(`${prefix} must be an object.`);
          continue;
        }
        const id = entry.id;
        if (typeof id !== 'string' || !id.trim()) {
          errors.push(`${prefix}.id is required.`);
          continue;
        }
        if (seenIds.has(id)) {
          errors.push(`Duplicate source.series id ${id}.`);
        }
        seenIds.add(id);
        if (isForbiddenBoardSeriesId(id)) {
          errors.push(`${prefix}.id ${id} is forbidden for Board-native artifacts.`);
        }
        const expected = TREASURY_LONG_END_BOARD_SOURCE_SERIES.find((s) => s.id === id);
        if (!expected) {
          errors.push(`${prefix}.id ${id} is not an approved Board H.15 series.`);
        } else if (entry.role !== expected.role) {
          errors.push(`${prefix}.role must be "${expected.role}" for ${id}.`);
        }
        if (typeof entry.label !== 'string' || !entry.label.trim()) {
          errors.push(`${prefix}.label is required.`);
        }
        if (typeof entry.url !== 'string' || !entry.url.trim()) {
          errors.push(`${prefix}.url is required.`);
        }
      }
      for (const required of TREASURY_LONG_END_BOARD_SOURCE_SERIES) {
        if (!seenIds.has(required.id)) {
          errors.push(`source.series must include required Board series ${required.id}.`);
        }
      }
    }
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations must be an object.');
    return;
  }

  validateLongEndObservationsCommon(raw.observations, errors, { allowBreakeven: false });
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

  const seriesDefinition = raw.seriesDefinition;
  const allowedDefinitions: TreasuryLongEndIncomeLensSeriesDefinition[] = [
    TREASURY_LONG_END_SERIES_DEFINITION,
    TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
  ];
  if (
    typeof seriesDefinition !== 'string' ||
    !(allowedDefinitions as readonly string[]).includes(seriesDefinition)
  ) {
    errors.push(
      `seriesDefinition must be "${TREASURY_LONG_END_SERIES_DEFINITION}" or "${TREASURY_LONG_END_BOARD_SERIES_DEFINITION}".`
    );
  }

  if (raw.mappingStatus !== 'not_final') {
    errors.push('mappingStatus must be "not_final".');
  }

  if (typeof raw.asOf !== 'string' || !parseIsoDate(raw.asOf)) {
    errors.push('asOf must be ISO YYYY-MM-DD.');
  }

  if (!Array.isArray(raw.caveats) || raw.caveats.length === 0) {
    errors.push('caveats must be a non-empty array.');
  }

  if (errors.length === 0 && typeof seriesDefinition === 'string') {
    if (seriesDefinition === TREASURY_LONG_END_SERIES_DEFINITION) {
      validateLegacyFredLongEndBranch(raw, mode, errors);
    } else if (seriesDefinition === TREASURY_LONG_END_BOARD_SERIES_DEFINITION) {
      validateBoardNativeLongEndBranch(raw, mode, errors);
    }
  }

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

export function loadTreasuryLongEndIncomeLensArtifact(): TreasuryLongEndIncomeLensValidation {
  return validateTreasuryLongEndIncomeLensArtifact(treasuryLongEndIncomeLensArtifactJson, {
    mode: 'production',
  });
}
