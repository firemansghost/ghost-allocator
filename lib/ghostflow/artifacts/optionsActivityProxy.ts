/**
 * GhostFlow v1.4c/d — Index options activity proxy artifact.
 * Pure validation, display helpers, production loader, and buildSnapshot display merge (no score wiring).
 */

import optionsActivityProxyArtifactJson from '@/data/ghostflow/artifacts/optionsActivityProxy.v1.json';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type {
  ArtifactFreshnessResult,
  OptionsActivityProxyArtifactV1,
  OptionsActivityProxyObservationsV1,
  OptionsActivityProxyValidation,
} from './types';

export const OPTIONS_ACTIVITY_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/optionsActivityProxy.v1.example.json';

export const OPTIONS_ACTIVITY_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/optionsActivityProxy.v1.json';

export const OPTIONS_ACTIVITY_PROXY_SIGNAL_ID = 'options-activity-proxy' as const;

export const OPTIONS_ACTIVITY_OBSERVATION_TYPE = 'occ_daily_volume_snapshot' as const;

export const OPTIONS_ACTIVITY_SERIES_DEFINITION = 'occ_daily_options_volume_v1' as const;

export const OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME =
  'Index Options Intensity Proxy' as const;

export const OPTIONS_ACTIVITY_DISPLAY_SIGNAL_ALT_NAME =
  'Options Activity Pressure Proxy' as const;

export const OPTIONS_ACTIVITY_DISPLAY_SIGNAL_ID = OPTIONS_ACTIVITY_PROXY_SIGNAL_ID;

export const OPTIONS_ACTIVITY_DISPLAY_CARD_CAVEAT =
  'Display-only OCC index-options activity proxy; not 0DTE, not gamma/GEX, and not included in the Research Composite.';

/** Relative tolerance for % reconciliation (percentage points). */
export const PCT_RECONCILIATION_TOLERANCE = 0.05;

const FORBIDDEN_ODTE_GEX_KEYS = [
  'zeroDteSharePct',
  'gammaExposureProxy',
  'sameDayExpiryVolume',
] as const;

const FORBIDDEN_ODTE_GEX_KEY_PATTERN =
  /zeroDte|gammaExposure|sameDayExpiry|gex|dealerGamma/i;

export type OptionsActivityValidationMode = 'example' | 'production';

export interface OptionsActivityValidateOptions {
  mode?: OptionsActivityValidationMode;
  referenceAsOf?: string;
}

function normalizeValidateOptions(
  options?: OptionsActivityValidateOptions
): { mode: OptionsActivityValidationMode; referenceAsOf?: string } {
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

function hasPopulatedForbiddenValue(v: unknown): boolean {
  return v !== null && v !== undefined;
}

function rejectForbiddenOdteGexFields(
  obj: Record<string, unknown>,
  label: string,
  errors: string[]
): void {
  for (const key of FORBIDDEN_ODTE_GEX_KEYS) {
    if (key in obj && hasPopulatedForbiddenValue(obj[key])) {
      errors.push(`${label} must not include populated ${key} (0DTE/GEX reserved).`);
    }
  }
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_ODTE_GEX_KEY_PATTERN.test(key) && hasPopulatedForbiddenValue(obj[key])) {
      if (!(FORBIDDEN_ODTE_GEX_KEYS as readonly string[]).includes(key)) {
        errors.push(
          `${label} must not include populated key "${key}" implying 0DTE/GEX (reserved).`
        );
      }
    }
  }
}

function scanObjectForForbiddenKeys(obj: Record<string, unknown>, label: string, errors: string[]): void {
  rejectForbiddenScoreFields(obj, label, errors);
  rejectForbiddenOdteGexFields(obj, label, errors);
}

/**
 * Index options contracts as share of total cleared options volume (%).
 */
export function computeIndexShareOfTotalPct(
  indexOptionsContracts: number,
  totalOptionsContracts: number
): number {
  if (totalOptionsContracts <= 0) return 0;
  return (indexOptionsContracts / totalOptionsContracts) * 100;
}

/**
 * Session-over-session percent change in index options contracts.
 */
export function computeDailyChangePct(current: number, prior: number): number {
  if (prior <= 0) return 0;
  return ((current - prior) / prior) * 100;
}

export function reconcileIndexSharePct(
  statedPct: number,
  indexOptionsContracts: number,
  totalOptionsContracts: number
): boolean {
  const expected = computeIndexShareOfTotalPct(indexOptionsContracts, totalOptionsContracts);
  return Math.abs(statedPct - expected) <= PCT_RECONCILIATION_TOLERANCE;
}

export function reconcileDailyChangePct(
  statedPct: number,
  currentIndexContracts: number,
  priorSessionIndexContracts: number
): boolean {
  const expected = computeDailyChangePct(currentIndexContracts, priorSessionIndexContracts);
  return Math.abs(statedPct - expected) <= PCT_RECONCILIATION_TOLERANCE;
}

function validateContractCount(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v) || v < 0 || !Number.isInteger(v)) {
    errors.push(`${name} must be a finite non-negative integer.`);
    return false;
  }
  return true;
}

function validateOptionalContractCount(name: string, v: unknown, errors: string[]): boolean {
  if (v === undefined) return true;
  return validateContractCount(name, v, errors);
}

function validateOptionalPositiveNumber(name: string, v: unknown, errors: string[]): boolean {
  if (v === undefined) return true;
  if (!isFiniteNumber(v) || v <= 0) {
    errors.push(`${name} must be a finite number > 0 when present.`);
    return false;
  }
  return true;
}

/** Compact dashboard card value (Index/Others intensity). */
export function formatOptionsActivityCardValue(
  observations: OptionsActivityProxyObservationsV1
): string {
  const indexM = observations.indexOptionsContracts / 1_000_000;
  const share = observations.indexShareOfTotalPct;
  const pcr =
    observations.putCallRatio !== undefined
      ? ` · PCR ${observations.putCallRatio.toFixed(2)}`
      : '';
  return `Index ${indexM.toFixed(1)}M contracts · ${share.toFixed(1)}% of total${pcr}`;
}

export function formatOptionsActivityDisplayValue(
  observations: OptionsActivityProxyObservationsV1
): string {
  const card = formatOptionsActivityCardValue(observations);
  const daily =
    observations.indexOptionsDailyChangePct !== undefined
      ? ` · ${observations.indexOptionsDailyChangePct >= 0 ? '+' : ''}${observations.indexOptionsDailyChangePct.toFixed(1)}% vs prior session (Index/Others)`
      : '';
  return `${card}${daily}`;
}

export function buildOptionsActivityDisplayExplanation(
  artifact: OptionsActivityProxyArtifactV1
): string {
  const { observations: o } = artifact;
  const indexM = (o.indexOptionsContracts / 1_000_000).toFixed(1);
  const totalM = (o.totalOptionsContracts / 1_000_000).toFixed(1);
  const pcr =
    o.putCallRatio !== undefined ? ` Put/call ratio ${o.putCallRatio.toFixed(2)}.` : '';
  const daily =
    o.indexOptionsDailyChangePct !== undefined
      ? ` Session change in Index/Others volume: ${o.indexOptionsDailyChangePct >= 0 ? '+' : ''}${o.indexOptionsDailyChangePct.toFixed(1)}%.`
      : '';
  return (
    `OCC Daily Volume Statistics: ${indexM}M Index/Others contracts of ${totalM}M OCC total cleared options (${o.indexShareOfTotalPct.toFixed(1)}% share).${pcr}${daily} ` +
    `Not 0DTE, not dealer gamma/GEX, not intraday hedging pressure. mappingStatus: ${o.mappingStatus}; not included in the Research Composite.`
  );
}

export function loadOptionsActivityProxyArtifact(): OptionsActivityProxyValidation {
  return validateOptionsActivityProxyArtifact(optionsActivityProxyArtifactJson, {
    mode: 'production',
    referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF,
  });
}

export function optionsActivityFreshnessAnchor(artifact: OptionsActivityProxyArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

export function evaluateOptionsActivityArtifactFreshness(
  artifact: OptionsActivityProxyArtifactV1,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): ArtifactFreshnessResult {
  return evaluateDailyArtifactFreshness(
    optionsActivityFreshnessAnchor(artifact),
    referenceAsOf,
    OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME
  );
}

export function validateOptionsActivityProxyArtifact(
  raw: unknown,
  options?: OptionsActivityValidateOptions
): OptionsActivityProxyValidation {
  const { mode, referenceAsOf } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  scanObjectForForbiddenKeys(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== OPTIONS_ACTIVITY_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${OPTIONS_ACTIVITY_PROXY_SIGNAL_ID}".`);
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
  if (raw.observationType !== OPTIONS_ACTIVITY_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${OPTIONS_ACTIVITY_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== OPTIONS_ACTIVITY_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${OPTIONS_ACTIVITY_SERIES_DEFINITION}".`);
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

  const optionalObservations = raw.optionalObservations;
  if (optionalObservations !== undefined) {
    if (!isPlainObject(optionalObservations)) {
      errors.push('optionalObservations must be an object when present.');
    } else {
      scanObjectForForbiddenKeys(optionalObservations, 'optionalObservations', errors);
    }
  }

  const observations = raw.observations;
  if (!isPlainObject(observations)) {
    errors.push('observations must be an object.');
  } else {
    scanObjectForForbiddenKeys(observations, 'observations', errors);

    const mappingStatus = observations.mappingStatus;
    if (mappingStatus !== 'not_final') {
      errors.push('observations.mappingStatus must be "not_final".');
    }

    const total = observations.totalOptionsContracts;
    const index = observations.indexOptionsContracts;
    const hasTotal = validateContractCount('observations.totalOptionsContracts', total, errors);
    const hasIndex = validateContractCount('observations.indexOptionsContracts', index, errors);

    validateOptionalContractCount('observations.equityOptionsContracts', observations.equityOptionsContracts, errors);
    validateOptionalContractCount('observations.etfOptionsContracts', observations.etfOptionsContracts, errors);
    validateOptionalPositiveNumber('observations.putCallRatio', observations.putCallRatio, errors);

    if (hasTotal && hasIndex && index > total) {
      errors.push('observations.indexOptionsContracts cannot exceed totalOptionsContracts.');
    }

    const share = observations.indexShareOfTotalPct;
    if (!isFiniteNumber(share)) {
      errors.push('observations.indexShareOfTotalPct must be a finite number.');
    } else if (hasTotal && hasIndex && !reconcileIndexSharePct(share, index, total)) {
      errors.push(
        'observations.indexShareOfTotalPct does not reconcile with indexOptionsContracts / totalOptionsContracts.'
      );
    }

    const prior = observations.priorSessionIndexOptionsContracts;
    const dailyChange = observations.indexOptionsDailyChangePct;
    if (prior !== undefined) {
      validateContractCount('observations.priorSessionIndexOptionsContracts', prior, errors);
    }
    if (dailyChange !== undefined) {
      if (!isFiniteNumber(dailyChange)) {
        errors.push('observations.indexOptionsDailyChangePct must be finite when present.');
      } else if (
        hasIndex &&
        prior !== undefined &&
        isFiniteNumber(prior) &&
        Number.isInteger(prior) &&
        !reconcileDailyChangePct(dailyChange, index, prior)
      ) {
        errors.push(
          'observations.indexOptionsDailyChangePct does not reconcile with index session change.'
        );
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as OptionsActivityProxyArtifactV1,
  };
}
