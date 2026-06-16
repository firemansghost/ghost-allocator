/**
 * GhostFlow v1.9b.3 — Cap-weight premium proxy artifact (design scaffolding only).
 * Pure validation helpers. No production loader, freshness, or buildSnapshot merge.
 */

import type {
  CapWeightPremiumObservationsV1,
  CapWeightPremiumPriceColumnUsed,
  CapWeightPremiumProxyArtifactV1,
  CapWeightPremiumProxyValidation,
} from './types';

export const CAP_WEIGHT_PREMIUM_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json';

export const CAP_WEIGHT_PREMIUM_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/capWeightPremiumProxy.v1.json';

export const CAP_WEIGHT_PREMIUM_PROXY_SIGNAL_ID = 'cap-weight-premium-proxy' as const;

export const CAP_WEIGHT_PREMIUM_OBSERVATION_TYPE =
  'spy_rsp_cap_weight_premium_snapshot' as const;

export const CAP_WEIGHT_PREMIUM_SERIES_DEFINITION =
  'spy_rsp_adj_close_cap_weight_premium_v1' as const;

export const CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_ID = 'cap-weight-premium' as const;

export const CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME =
  'Cap-Weight Premium Proxy' as const;

export const CAP_WEIGHT_PREMIUM_DISPLAY_CARD_CAVEAT =
  'Display-only SPY/RSP cap-weight premium proxy; not causal proof, not a trading signal, and not included in the Research Composite.';

/** Relative tolerance for SPY/RSP ratio reconciliation. */
export const RATIO_RECONCILIATION_TOLERANCE = 0.0001;

const PERCENTILE_FIELDS = [
  'ratioPercentile',
  'spread1MPercentile',
  'spread3MPercentile',
  'spread6MPercentile',
  'spread1YPercentile',
  'spread3YPercentile',
  'spread5YPercentile',
] as const;

export type CapWeightPremiumValidationMode = 'example' | 'production';

export interface CapWeightPremiumValidateOptions {
  mode?: CapWeightPremiumValidationMode;
  referenceAsOf?: string;
}

function normalizeValidateOptions(
  options?: CapWeightPremiumValidateOptions
): { mode: CapWeightPremiumValidationMode; referenceAsOf?: string } {
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
  if ('basketScore' in obj) {
    errors.push(`${label} must not include basketScore.`);
  }
  if ('publicPassiveInputKey' in obj) {
    errors.push(`${label} must not include publicPassiveInputKey.`);
  }
  if ('numericValue' in obj && obj.numericValue !== undefined && obj.numericValue !== null) {
    errors.push(`${label} must not include numericValue (score-like field reserved).`);
  }
}

function validatePositivePrice(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v) || v <= 0) {
    errors.push(`${name} must be a finite number > 0.`);
    return false;
  }
  return true;
}

function validatePercentile(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v) || v < 0 || v > 100) {
    errors.push(`${name} must be a finite number between 0 and 100.`);
    return false;
  }
  return true;
}

function validateFiniteSpread(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v)) {
    errors.push(`${name} must be a finite number.`);
    return false;
  }
  return true;
}

function reconcileSpyRspRatio(
  statedRatio: number,
  spyAdjustedClose: number,
  rspAdjustedClose: number
): boolean {
  const expected = spyAdjustedClose / rspAdjustedClose;
  const tolerance = Math.max(RATIO_RECONCILIATION_TOLERANCE, expected * RATIO_RECONCILIATION_TOLERANCE);
  return Math.abs(statedRatio - expected) <= tolerance;
}

function validatePriceColumnUsed(
  priceColumnUsed: unknown,
  mode: CapWeightPremiumValidationMode,
  errors: string[]
): priceColumnUsed is { spy: CapWeightPremiumPriceColumnUsed; rsp: CapWeightPremiumPriceColumnUsed } {
  if (!isPlainObject(priceColumnUsed)) {
    errors.push('observations.priceColumnUsed must be an object with spy and rsp.');
    return false;
  }
  const spy = priceColumnUsed.spy;
  const rsp = priceColumnUsed.rsp;
  if (spy !== 'adjusted' && spy !== 'close') {
    errors.push('observations.priceColumnUsed.spy must be "adjusted" or "close".');
  }
  if (rsp !== 'adjusted' && rsp !== 'close') {
    errors.push('observations.priceColumnUsed.rsp must be "adjusted" or "close".');
  }
  if (mode === 'example') {
    if (spy !== 'adjusted') {
      errors.push('observations.priceColumnUsed.spy must be "adjusted" in example mode.');
    }
    if (rsp !== 'adjusted') {
      errors.push('observations.priceColumnUsed.rsp must be "adjusted" in example mode.');
    }
  }
  return spy === 'adjusted' || spy === 'close' ? (rsp === 'adjusted' || rsp === 'close') : false;
}

export function validateCapWeightPremiumProxyArtifact(
  raw: unknown,
  options?: CapWeightPremiumValidateOptions
): CapWeightPremiumProxyValidation {
  const { mode, referenceAsOf } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  rejectForbiddenScoreFields(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== CAP_WEIGHT_PREMIUM_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${CAP_WEIGHT_PREMIUM_PROXY_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'weekly') {
    errors.push('updateFrequency must be "weekly".');
  }
  if (raw.observationType !== CAP_WEIGHT_PREMIUM_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${CAP_WEIGHT_PREMIUM_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== CAP_WEIGHT_PREMIUM_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${CAP_WEIGHT_PREMIUM_SERIES_DEFINITION}".`);
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
    errors.push('source must be an object with name and url or operatorSource.');
  } else {
    requireNonEmptyString('source.name', source.name, errors);
    const hasUrl = typeof source.url === 'string' && source.url.trim().length > 0;
    const hasOperatorSource =
      typeof source.operatorSource === 'string' && source.operatorSource.trim().length > 0;
    if (!hasUrl && !hasOperatorSource) {
      errors.push('source must include a non-empty url or operatorSource.');
    }
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

  const methodology = raw.methodology;
  if (methodology !== undefined && !isPlainObject(methodology)) {
    errors.push('methodology must be an object when present.');
  }

  const observations = raw.observations;
  if (!isPlainObject(observations)) {
    errors.push('observations must be an object.');
  } else {
    rejectForbiddenScoreFields(observations, 'observations', errors);

    if (observations.mappingStatus !== 'not_final') {
      errors.push('observations.mappingStatus must be "not_final".');
    }

    const latestDate = observations.latestDate;
    if (typeof latestDate !== 'string' || !parseIsoDate(latestDate)) {
      errors.push('observations.latestDate must be a valid ISO date (YYYY-MM-DD).');
    } else if (
      typeof asOf === 'string' &&
      parseIsoDate(asOf) &&
      compareIso(latestDate, asOf) > 0
    ) {
      errors.push('observations.latestDate cannot be after asOf.');
    }

    const spy = observations.spyAdjustedClose;
    const rsp = observations.rspAdjustedClose;
    const spyOk = validatePositivePrice('observations.spyAdjustedClose', spy, errors);
    const rspOk = validatePositivePrice('observations.rspAdjustedClose', rsp, errors);

    const ratio = observations.spyRspRatio;
    if (!validatePositivePrice('observations.spyRspRatio', ratio, errors)) {
      // ratio validated above
    } else if (spyOk && rspOk && !reconcileSpyRspRatio(ratio, spy, rsp)) {
      errors.push(
        `observations.spyRspRatio (${ratio}) must reconcile with spyAdjustedClose / rspAdjustedClose within tolerance.`
      );
    }

    for (const field of PERCENTILE_FIELDS) {
      validatePercentile(`observations.${field}`, observations[field], errors);
    }

    const spreadFields = [
      'spread1M',
      'spread3M',
      'spread6M',
      'spread1Y',
      'spread1YAnnualized',
      'spread3Y',
      'spread3YAnnualized',
      'spread5Y',
      'spread5YAnnualized',
      'spyCurrentDrawdown',
      'rspCurrentDrawdown',
      'drawdownDivergence',
    ] as const;
    for (const field of spreadFields) {
      validateFiniteSpread(`observations.${field}`, observations[field], errors);
    }

    const alignedCount = observations.alignedObservationCount;
    if (
      !isFiniteNumber(alignedCount) ||
      alignedCount <= 0 ||
      !Number.isInteger(alignedCount)
    ) {
      errors.push('observations.alignedObservationCount must be a positive integer.');
    }

    const overlapStart = observations.overlapStart;
    const overlapEnd = observations.overlapEnd;
    if (typeof overlapStart !== 'string' || !parseIsoDate(overlapStart)) {
      errors.push('observations.overlapStart must be a valid ISO date (YYYY-MM-DD).');
    }
    if (typeof overlapEnd !== 'string' || !parseIsoDate(overlapEnd)) {
      errors.push('observations.overlapEnd must be a valid ISO date (YYYY-MM-DD).');
    }
    if (
      typeof overlapStart === 'string' &&
      typeof overlapEnd === 'string' &&
      parseIsoDate(overlapStart) &&
      parseIsoDate(overlapEnd) &&
      compareIso(overlapStart, overlapEnd) > 0
    ) {
      errors.push('observations.overlapStart cannot be after overlapEnd.');
    }

    validatePriceColumnUsed(observations.priceColumnUsed, mode, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as CapWeightPremiumProxyArtifactV1,
  };
}
