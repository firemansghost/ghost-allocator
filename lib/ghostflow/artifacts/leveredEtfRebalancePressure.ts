/**
 * GhostFlow v1.1b — Levered ETF rebalance pressure artifact (design only).
 * Pure validation and estimate helpers. No production load or buildSnapshot merge.
 */

import type {
  LeveredEtfDominantDirection,
  LeveredEtfRebalanceDirection,
  LeveredEtfRebalanceObservationsV1,
  LeveredEtfRebalancePressureArtifactV1,
  LeveredEtfRebalancePressureValidation,
  LeveredEtfRebalanceRowV1,
} from './types';

export const LEVERED_ETF_REBALANCE_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json';

export const LEVERED_ETF_REBALANCE_SIGNAL_ID = 'levered-etf-rebalance-pressure' as const;

export const LEVERED_ETF_REBALANCE_OBSERVATION_TYPE =
  'latest_session_snapshot_refreshed_manually' as const;

export const LEVERED_ETF_REBALANCE_UNIVERSE_DEFINITION =
  'tier1_six_ticker_3x_index_etf_v1' as const;

export const TIER1_LEVERED_ETF_TICKERS = [
  'TQQQ',
  'SQQQ',
  'UPRO',
  'SPXU',
  'TNA',
  'TZA',
] as const;

export const DEFERRED_LEVERED_ETF_TICKERS = [
  'SPXL',
  'SPXS',
  'SSO',
  'SDS',
  'QLD',
  'QID',
] as const;

export const REBALANCE_NOTIONAL_TOLERANCE_MILLIONS = 0.05;
export const AGGREGATE_TOLERANCE_MILLIONS = 0.1;
export const AGGREGATE_PCT_TOLERANCE = 0.05;
export const REBALANCE_FLAT_EPSILON_MILLIONS = 0.01;
export const DOMINANT_DIRECTION_MIXED_RATIO = 0.25;

export const LEVERED_ETF_REBALANCE_CARD_CAVEAT =
  'Estimated levered/inverse ETF rebalance notional from AUM and single-session index move — not issuer-reported flow, exact trades, or options/gamma exposure.';

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

/**
 * Simplified daily-reset rebalance notional estimate (millions USD).
 * Positive = estimated buy pressure; negative = estimated sell pressure.
 */
export function computeEstimatedRebalanceNotional(
  aumMillionsUsd: number,
  signedLeverage: number,
  underlyingReturnPct: number
): number {
  const underlyingReturnDecimal = underlyingReturnPct / 100;
  return aumMillionsUsd * signedLeverage * (signedLeverage - 1) * underlyingReturnDecimal;
}

export function computeEstimatedRebalanceDirection(
  estimatedRebalanceNotionalMillionsUsd: number
): LeveredEtfRebalanceDirection {
  if (Math.abs(estimatedRebalanceNotionalMillionsUsd) < REBALANCE_FLAT_EPSILON_MILLIONS) {
    return 'flat';
  }
  return estimatedRebalanceNotionalMillionsUsd > 0 ? 'buy_underlying' : 'sell_underlying';
}

export function resolveDominantDirection(
  rows: Pick<LeveredEtfRebalanceRowV1, 'estimatedRebalanceNotionalMillionsUsd'>[]
): LeveredEtfDominantDirection {
  const net = rows.reduce((s, r) => s + r.estimatedRebalanceNotionalMillionsUsd, 0);
  if (Math.abs(net) < REBALANCE_FLAT_EPSILON_MILLIONS) return 'flat';

  const absSum = rows.reduce(
    (s, r) => s + Math.abs(r.estimatedRebalanceNotionalMillionsUsd),
    0
  );
  if (absSum <= 0) return 'flat';

  let buyAbs = 0;
  let sellAbs = 0;
  for (const r of rows) {
    if (r.estimatedRebalanceNotionalMillionsUsd > REBALANCE_FLAT_EPSILON_MILLIONS) {
      buyAbs += r.estimatedRebalanceNotionalMillionsUsd;
    } else if (r.estimatedRebalanceNotionalMillionsUsd < -REBALANCE_FLAT_EPSILON_MILLIONS) {
      sellAbs += Math.abs(r.estimatedRebalanceNotionalMillionsUsd);
    }
  }

  const minority = Math.min(buyAbs, sellAbs);
  if (minority > 0 && minority / absSum >= DOMINANT_DIRECTION_MIXED_RATIO) {
    return 'mixed';
  }

  return net > 0 ? 'buy_underlying' : 'sell_underlying';
}

export function computeAggregateLeveredEtfRebalanceMetrics(
  rows: LeveredEtfRebalanceRowV1[]
): LeveredEtfRebalanceObservationsV1 {
  const aggregateAumMillionsUsd = rows.reduce((s, r) => s + r.aumMillionsUsd, 0);
  const aggregateEstimatedRebalanceNotionalMillionsUsd = rows.reduce(
    (s, r) => s + r.estimatedRebalanceNotionalMillionsUsd,
    0
  );
  const aggregateAbsRebalanceNotionalMillionsUsd = rows.reduce(
    (s, r) => s + Math.abs(r.estimatedRebalanceNotionalMillionsUsd),
    0
  );
  const aggregateRebalancePctOfUniverseAum =
    aggregateAumMillionsUsd > 0
      ? Math.round(
          (100 * 100 * aggregateAbsRebalanceNotionalMillionsUsd) / aggregateAumMillionsUsd
        ) / 100
      : 0;

  return {
    aggregateAumMillionsUsd,
    aggregateEstimatedRebalanceNotionalMillionsUsd,
    aggregateAbsRebalanceNotionalMillionsUsd,
    aggregateRebalancePctOfUniverseAum,
    dominantDirection: resolveDominantDirection(rows),
    mappingStatus: 'not_final',
  };
}

function parseEtfRow(raw: unknown, errors: string[]): LeveredEtfRebalanceRowV1 | null {
  if (!isPlainObject(raw)) {
    errors.push('Each etf row must be an object.');
    return null;
  }

  const ticker = raw.ticker;
  if (!requireNonEmptyString('ticker', ticker, errors)) return null;

  const direction = raw.direction;
  if (direction !== 'long' && direction !== 'inverse') {
    errors.push(`Row ${String(ticker)}: direction must be long or inverse.`);
  }

  const signedLeverage = raw.signedLeverage;
  const leverageMultiple = raw.leverageMultiple;
  if (!isFiniteNumber(signedLeverage)) {
    errors.push(`Row ${String(ticker)}: signedLeverage must be finite.`);
  }
  if (!isFiniteNumber(leverageMultiple) || (leverageMultiple as number) <= 0) {
    errors.push(`Row ${String(ticker)}: leverageMultiple must be a positive finite number.`);
  }

  if (direction === 'long' && isFiniteNumber(signedLeverage) && signedLeverage <= 0) {
    errors.push(`Row ${String(ticker)}: long direction requires positive signedLeverage.`);
  }
  if (direction === 'inverse' && isFiniteNumber(signedLeverage) && signedLeverage >= 0) {
    errors.push(`Row ${String(ticker)}: inverse direction requires negative signedLeverage.`);
  }
  if (
    isFiniteNumber(signedLeverage) &&
    isFiniteNumber(leverageMultiple) &&
    Math.abs(signedLeverage) !== leverageMultiple
  ) {
    errors.push(
      `Row ${String(ticker)}: |signedLeverage| must equal leverageMultiple.`
    );
  }

  const aum = raw.aumMillionsUsd;
  if (!isFiniteNumber(aum) || aum < 0) {
    errors.push(`Row ${String(ticker)}: aumMillionsUsd must be finite and non-negative.`);
  }

  const ret = raw.underlyingReturnPct;
  if (!isFiniteNumber(ret)) {
    errors.push(`Row ${String(ticker)}: underlyingReturnPct must be finite.`);
  }

  for (const field of [
    'fundName',
    'issuer',
    'aumSourceName',
    'aumSourceUrl',
    'crossCheckSourceName',
    'crossCheckSourceUrl',
    'returnSourceName',
    'returnSourceUrl',
  ] as const) {
    requireNonEmptyString(`Row ${String(ticker)} ${field}`, raw[field], errors);
  }

  for (const dateField of ['aumAsOf', 'returnAsOf'] as const) {
    const d = raw[dateField];
    if (typeof d !== 'string' || !parseIsoDate(d)) {
      errors.push(`Row ${String(ticker)}: ${dateField} must be ISO YYYY-MM-DD.`);
    }
  }

  const underlyingIndex = raw.underlyingIndex;
  if (
    underlyingIndex !== 'Nasdaq-100' &&
    underlyingIndex !== 'S&P 500' &&
    underlyingIndex !== 'Russell 2000'
  ) {
    errors.push(`Row ${String(ticker)}: underlyingIndex invalid.`);
  }

  const indexProxyTicker = raw.indexProxyTicker;
  if (indexProxyTicker !== 'QQQ' && indexProxyTicker !== 'SPY' && indexProxyTicker !== 'IWM') {
    errors.push(`Row ${String(ticker)}: indexProxyTicker must be QQQ, SPY, or IWM.`);
  }

  if (raw.usedInAggregate !== true) {
    errors.push(`Row ${String(ticker)}: usedInAggregate must be true for Tier-1 MVP rows.`);
  }

  const est = raw.estimatedRebalanceNotionalMillionsUsd;
  if (!isFiniteNumber(est)) {
    errors.push(
      `Row ${String(ticker)}: estimatedRebalanceNotionalMillionsUsd must be finite.`
    );
  }

  const estDir = raw.estimatedRebalanceDirection;
  if (estDir !== 'buy_underlying' && estDir !== 'sell_underlying' && estDir !== 'flat') {
    errors.push(`Row ${String(ticker)}: estimatedRebalanceDirection invalid.`);
  }

  if (errors.some((e) => e.includes(String(ticker)))) return null;

  if (
    isFiniteNumber(aum) &&
    isFiniteNumber(signedLeverage) &&
    isFiniteNumber(ret) &&
    isFiniteNumber(est)
  ) {
    const expected = computeEstimatedRebalanceNotional(aum, signedLeverage, ret);
    if (Math.abs(expected - est) > REBALANCE_NOTIONAL_TOLERANCE_MILLIONS) {
      errors.push(
        `Row ${String(ticker)}: estimatedRebalanceNotionalMillionsUsd (${est}) does not match formula (${expected}).`
      );
    }
    const expectedDir = computeEstimatedRebalanceDirection(est);
    if (estDir !== expectedDir) {
      errors.push(
        `Row ${String(ticker)}: estimatedRebalanceDirection must be ${expectedDir}.`
      );
    }
  }

  if (errors.some((e) => e.includes(String(ticker)))) return null;

  return raw as unknown as LeveredEtfRebalanceRowV1;
}

export function validateLeveredEtfRebalancePressureArtifact(
  raw: unknown,
  referenceAsOf?: string
): LeveredEtfRebalancePressureValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== LEVERED_ETF_REBALANCE_SIGNAL_ID) {
    errors.push(`signalId must be "${LEVERED_ETF_REBALANCE_SIGNAL_ID}".`);
  }
  if (raw.designOnly !== true) {
    errors.push('designOnly must be true for v1.1b example artifact.');
  }
  if (raw.updateFrequency !== 'weekly') {
    errors.push('updateFrequency must be "weekly".');
  }
  if (raw.observationType !== LEVERED_ETF_REBALANCE_OBSERVATION_TYPE) {
    errors.push(
      `observationType must be "${LEVERED_ETF_REBALANCE_OBSERVATION_TYPE}".`
    );
  }
  if (raw.universeDefinition !== LEVERED_ETF_REBALANCE_UNIVERSE_DEFINITION) {
    errors.push(
      `universeDefinition must be "${LEVERED_ETF_REBALANCE_UNIVERSE_DEFINITION}".`
    );
  }

  const asOf = raw.asOf;
  const publishedAt = raw.publishedAt;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be ISO YYYY-MM-DD.');
  }
  if (typeof publishedAt !== 'string' || !parseIsoDate(publishedAt)) {
    errors.push('publishedAt must be ISO YYYY-MM-DD.');
  }
  if (
    typeof asOf === 'string' &&
    typeof publishedAt === 'string' &&
    parseIsoDate(asOf) &&
    parseIsoDate(publishedAt) &&
    compareIso(publishedAt, asOf) < 0
  ) {
    errors.push('publishedAt must be on or after asOf.');
  }

  if (referenceAsOf && typeof asOf === 'string' && parseIsoDate(asOf) && compareIso(asOf, referenceAsOf) > 0) {
    warnings.push(`asOf ${asOf} is after reference ${referenceAsOf}.`);
  }

  if (!isPlainObject(raw.source)) {
    errors.push('source must be an object.');
  } else {
    requireNonEmptyString('source.name', raw.source.name, errors);
    requireNonEmptyString('source.url', raw.source.url, errors);
    if (raw.source.note !== undefined && typeof raw.source.note !== 'string') {
      errors.push('source.note must be a string when present.');
    }
  }

  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  if ('candidatePressureScore' in raw) {
    errors.push('candidatePressureScore must not be present in v1.1b artifacts.');
  }

  const rowsRaw = raw.etfRows;
  if (!Array.isArray(rowsRaw)) {
    errors.push('etfRows must be an array.');
    return { ok: false, errors };
  }

  const rows: LeveredEtfRebalanceRowV1[] = [];
  for (const rowRaw of rowsRaw) {
    const parsed = parseEtfRow(rowRaw, errors);
    if (parsed) rows.push(parsed);
  }

  const tickers = rows.map((r) => r.ticker);
  for (const deferred of DEFERRED_LEVERED_ETF_TICKERS) {
    if (tickers.includes(deferred)) {
      errors.push(`Deferred ticker ${deferred} must not appear in Tier-1 universe.`);
    }
  }

  if (rows.length !== TIER1_LEVERED_ETF_TICKERS.length) {
    errors.push(`etfRows must contain exactly ${TIER1_LEVERED_ETF_TICKERS.length} Tier-1 tickers.`);
  }

  for (const required of TIER1_LEVERED_ETF_TICKERS) {
    if (!tickers.includes(required)) {
      errors.push(`Missing required ticker ${required}.`);
    }
  }

  const dup = tickers.filter((t, i) => tickers.indexOf(t) !== i);
  if (dup.length > 0) {
    errors.push(`Duplicate tickers: ${[...new Set(dup)].join(', ')}.`);
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations must be an object.');
    return { ok: false, errors };
  }

  const obs = raw.observations;
  if (obs.mappingStatus !== 'not_final') {
    errors.push('observations.mappingStatus must be "not_final".');
  }
  if ('candidatePressureScore' in obs) {
    errors.push('observations.candidatePressureScore must not be present in v1.1b.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const expected = computeAggregateLeveredEtfRebalanceMetrics(rows);
  const fields: Array<keyof LeveredEtfRebalanceObservationsV1> = [
    'aggregateAumMillionsUsd',
    'aggregateEstimatedRebalanceNotionalMillionsUsd',
    'aggregateAbsRebalanceNotionalMillionsUsd',
    'aggregateRebalancePctOfUniverseAum',
    'dominantDirection',
  ];

  for (const key of fields) {
    const actual = obs[key];
    const exp = expected[key];
    if (!isFiniteNumber(actual) && key !== 'dominantDirection') {
      errors.push(`observations.${key} must be finite.`);
      continue;
    }
    if (key === 'dominantDirection') {
      if (actual !== exp) {
        errors.push(`observations.dominantDirection must be ${exp}.`);
      }
      continue;
    }
    const tol =
      key === 'aggregateRebalancePctOfUniverseAum'
        ? AGGREGATE_PCT_TOLERANCE
        : AGGREGATE_TOLERANCE_MILLIONS;
    if (Math.abs((actual as number) - (exp as number)) > tol) {
      errors.push(
        `observations.${key} (${actual}) does not match computed aggregate (${exp}).`
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const artifact: LeveredEtfRebalancePressureArtifactV1 = {
    artifactVersion: '1',
    signalId: LEVERED_ETF_REBALANCE_SIGNAL_ID,
    designOnly: true,
    asOf: asOf as string,
    publishedAt: publishedAt as string,
    source: {
      name: (raw.source as { name: string }).name,
      url: (raw.source as { url: string }).url,
      note: (raw.source as { note?: string }).note,
    },
    observationType: LEVERED_ETF_REBALANCE_OBSERVATION_TYPE,
    universeDefinition: LEVERED_ETF_REBALANCE_UNIVERSE_DEFINITION,
    updateFrequency: 'weekly',
    dataQuality: raw.dataQuality as 'verified_manual' | 'manual_unverified',
    etfRows: rows,
    observations: {
      aggregateAumMillionsUsd: obs.aggregateAumMillionsUsd as number,
      aggregateEstimatedRebalanceNotionalMillionsUsd:
        obs.aggregateEstimatedRebalanceNotionalMillionsUsd as number,
      aggregateAbsRebalanceNotionalMillionsUsd:
        obs.aggregateAbsRebalanceNotionalMillionsUsd as number,
      aggregateRebalancePctOfUniverseAum: obs.aggregateRebalancePctOfUniverseAum as number,
      dominantDirection: obs.dominantDirection as LeveredEtfDominantDirection,
      mappingStatus: 'not_final',
    },
  };

  return warnings.length > 0 ? { ok: true, artifact, warnings } : { ok: true, artifact };
}
