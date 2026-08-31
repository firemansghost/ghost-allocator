/**
 * GhostRegime Satellites - Bundle B Processing
 * Inflation-axis satellites with decay and fallback chains
 */

import type { SatelliteData } from './types';
import { getDataForSymbol, calculateTR, TR_21, TR_63 } from './dataWindows';
import { MARKET_SYMBOLS } from './config';

export interface SatelliteConfig {
  series: string;
  source_type: 'daily' | 'weekly' | 'monthly';
  axis: 'inflation';
  signal_definition: string;
  thresholds: {
    inflation_vote_gte_pp?: number;
    disinflation_vote_lte_pp?: number;
    inflation_vote_gte?: number;
    disinflation_vote_lte?: number;
  };
  ttl_days: number;
  half_life_days: number;
  vote_weight: number;
  vote_mapping: {
    '+1': string;
    '0': string;
    '-1': string;
  };
  fallback: string;
}

export interface SatelliteObservation {
  value: number;
  observationDate: Date;
  underlyingSource?: string;
  underlyingHorizon?: string;
}

export interface SatelliteDataProvider {
  getLatestObservation(series: string, asOfDate?: Date): Promise<SatelliteObservation | null>;
}

export const COMMODITY_NOWCAST_SERIES = 'Commodity Nowcast Basket (Energy+Metals)';
export const COMMODITY_PDBC_RECEIPT_LABEL = 'Commodity proxy (PDBC TR21)';

const THRESHOLD_KEYS = [
  'inflation_vote_gte_pp',
  'disinflation_vote_lte_pp',
  'inflation_vote_gte',
  'disinflation_vote_lte',
] as const;

/**
 * Signal-family identity for fallback compatibility.
 * Return horizons stay distinct (tr_21 ≠ tr_63). Cleveland/Truflation both map
 * to delta-7d YoY percentage-point units when cadence/thresholds otherwise match.
 */
export function satelliteSignalFamily(signalDefinition: string): string {
  const trMatch = signalDefinition.match(/tr_(\d+)/);
  if (trMatch) {
    return `tr_${trMatch[1]}`;
  }
  if (signalDefinition.includes('level_index')) {
    return 'level_index';
  }
  if (signalDefinition.includes('delta_') && signalDefinition.includes('_pp')) {
    const horizon = signalDefinition.includes('7d') ? '7d' : 'unknown';
    return `delta_${horizon}_yoy_pp`;
  }
  return signalDefinition;
}

function thresholdsEqual(
  a: SatelliteConfig['thresholds'],
  b: SatelliteConfig['thresholds']
): boolean {
  for (const key of THRESHOLD_KEYS) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function voteMappingEqual(
  a: SatelliteConfig['vote_mapping'],
  b: SatelliteConfig['vote_mapping']
): boolean {
  return a['+1'] === b['+1'] && a['0'] === b['0'] && a['-1'] === b['-1'];
}

/**
 * Conservative one-hop fallback compatibility.
 * Prefer false-negative containment: ambiguous aliases are rejected.
 */
export function isFallbackSemanticallyCompatible(
  primary: SatelliteConfig,
  fallback: SatelliteConfig
): boolean {
  if (primary.axis !== fallback.axis) return false;
  if (primary.source_type !== fallback.source_type) return false;
  if (satelliteSignalFamily(primary.signal_definition) !== satelliteSignalFamily(fallback.signal_definition)) {
    return false;
  }
  if (!thresholdsEqual(primary.thresholds, fallback.thresholds)) return false;
  if (!voteMappingEqual(primary.vote_mapping, fallback.vote_mapping)) return false;
  if (primary.vote_weight !== fallback.vote_weight) return false;
  if (primary.ttl_days !== fallback.ttl_days) return false;
  if (primary.half_life_days !== fallback.half_life_days) return false;
  return true;
}

function formatUnderlyingSource(data: {
  underlyingSource?: string;
  underlyingHorizon?: string;
  resolvedSeries?: string;
  fallbackUsed?: boolean;
}): string | undefined {
  if (data.underlyingSource === 'PDBC' && (data.underlyingHorizon === 'TR_21' || data.underlyingHorizon === 'tr_21')) {
    return 'PDBC TR21';
  }
  if (data.underlyingSource && data.underlyingHorizon) {
    return `${data.underlyingSource} ${data.underlyingHorizon.replace(/^TR_/, 'TR').replace('_', '')}`;
  }
  if (data.underlyingSource) return data.underlyingSource;
  if (data.fallbackUsed && data.resolvedSeries) return data.resolvedSeries;
  return undefined;
}

/**
 * Receipt label/note for persisted provenance. Scoring is unchanged.
 * Historical Blob rows are not rewritten; this applies to newly computed rows.
 */
export function satelliteReceiptPresentation(
  config: SatelliteConfig,
  data: SatelliteData
): { label: string; note: string } {
  const decayFactor = Math.pow(0.5, data.age_days / config.half_life_days);
  const source = formatUnderlyingSource(data);
  const isCommodityLane = config.series === COMMODITY_NOWCAST_SERIES;
  const isPdbcTr21 =
    data.underlyingSource === 'PDBC' &&
    (data.underlyingHorizon === 'TR_21' || data.underlyingHorizon === 'tr_21');

  let label = config.series;
  if (isCommodityLane && isPdbcTr21) {
    label = COMMODITY_PDBC_RECEIPT_LABEL;
  } else if (data.fallbackUsed && data.resolvedSeries && data.resolvedSeries !== config.series) {
    label = `${config.series} (via ${data.resolvedSeries})`;
  }

  const parts = [`Age: ${data.age_days}d, decay: ${(decayFactor * 100).toFixed(1)}%`];
  if (source) {
    parts.push(`source: ${source}`);
  }
  if (data.fallbackUsed && data.resolvedSeries) {
    parts.push(`fallback used: ${data.resolvedSeries}`);
  }

  return { label, note: parts.join('; ') };
}

/**
 * Default satellite configuration (from YAML spec)
 */
export const SATELLITE_CONFIGS: SatelliteConfig[] = [
  {
    series: 'Cleveland Fed Inflation Nowcast YoY',
    source_type: 'daily',
    axis: 'inflation',
    signal_definition: 'delta_7d_nowcast_yoy_pp',
    thresholds: {
      inflation_vote_gte_pp: 0.05,
      disinflation_vote_lte_pp: -0.05,
    },
    ttl_days: 7,
    half_life_days: 3,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'Truflation YoY',
  },
  {
    series: 'Truflation YoY',
    source_type: 'daily',
    axis: 'inflation',
    signal_definition: 'delta_7d_truflation_yoy_pp',
    thresholds: {
      inflation_vote_gte_pp: 0.05,
      disinflation_vote_lte_pp: -0.05,
    },
    ttl_days: 7,
    half_life_days: 3,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'Commodity Nowcast Basket',
  },
  {
    series: 'Commodity Nowcast Basket (Energy+Metals)',
    source_type: 'daily',
    axis: 'inflation',
    signal_definition: 'tr_21_basket',
    thresholds: {
      inflation_vote_gte: 0.02,
      disinflation_vote_lte: -0.02,
    },
    ttl_days: 7,
    half_life_days: 3,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'None',
  },
  {
    series: 'ISM Manufacturing Prices Paid',
    source_type: 'monthly',
    axis: 'inflation',
    signal_definition: 'level_index',
    thresholds: {
      inflation_vote_gte: 55,
      disinflation_vote_lte: 45,
    },
    ttl_days: 35,
    half_life_days: 14,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'ISM Services Prices Paid',
  },
  {
    series: 'ISM Services Prices Paid',
    source_type: 'monthly',
    axis: 'inflation',
    signal_definition: 'level_index',
    thresholds: {
      inflation_vote_gte: 55,
      disinflation_vote_lte: 45,
    },
    ttl_days: 35,
    half_life_days: 14,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'NFIB Price Plans',
  },
  {
    series: 'NFIB Price Plans',
    source_type: 'monthly',
    axis: 'inflation',
    signal_definition: 'level_index',
    thresholds: {
      inflation_vote_gte: 30,
      disinflation_vote_lte: 20,
    },
    ttl_days: 35,
    half_life_days: 14,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'ISM Manufacturing Prices Paid',
  },
  {
    series: 'Freight Pulse (BDI or Freightos)',
    source_type: 'weekly',
    axis: 'inflation',
    signal_definition: 'tr_63_series',
    thresholds: {
      inflation_vote_gte: 0.1,
      disinflation_vote_lte: -0.1,
    },
    ttl_days: 21,
    half_life_days: 10,
    vote_weight: 1.0,
    vote_mapping: { '+1': 'Inflation', '0': 'None', '-1': 'Disinflation' },
    fallback: 'Commodity Nowcast Basket (Energy+Metals)',
  },
];

/**
 * Default satellite data provider (stub implementation)
 * Commodity Nowcast Basket is always available (derived from market data)
 */
export class DefaultSatelliteDataProvider implements SatelliteDataProvider {
  private marketData: any[] = [];

  setMarketData(data: any[]) {
    this.marketData = data;
  }

  async getLatestObservation(series: string, asOfDate?: Date): Promise<SatelliteObservation | null> {
    // Live derived source only: PDBC TR21 Commodity proxy.
    // Cleveland / Truflation / ISM / NFIB / real Freight remain unimplemented stubs.
    if (series === COMMODITY_NOWCAST_SERIES) {
      return this.getCommodityBasketValue(asOfDate);
    }

    return null;
  }

  private getCommodityBasketValue(asOfDate?: Date): SatelliteObservation | null {
    // Derive from PDBC (commodity ETF) TR_21, using only observations on or before as-of.
    const pdbcData = getDataForSymbol(this.marketData, MARKET_SYMBOLS.PDBC);
    const filtered = asOfDate ? pdbcData.filter((d) => d.date <= asOfDate) : pdbcData;
    if (filtered.length < TR_21) return null;

    const tr = calculateTR(filtered, TR_21, asOfDate);
    const latestDate = filtered[filtered.length - 1].date;

    return {
      value: tr,
      observationDate: latestDate,
      underlyingSource: 'PDBC',
      underlyingHorizon: 'TR_21',
    };
  }
}

/**
 * Process satellites with decay and cap rules
 */
export function processSatellites(
  satelliteData: SatelliteData[],
  configs: SatelliteConfig[],
  today: Date
): number {
  let totalEffectiveVote = 0;

  for (const config of configs) {
    const data = satelliteData.find((d) => d.series === config.series);
    if (!data) continue;

    // Check TTL
    if (data.age_days > config.ttl_days) {
      continue; // Expired
    }

    // Calculate raw vote
    let rawVote = 0;
    const threshold = config.thresholds;

    if (config.signal_definition.includes('tr_')) {
      // Return-based signal
      if (threshold.inflation_vote_gte !== undefined && data.value >= threshold.inflation_vote_gte) {
        rawVote = 1;
      } else if (
        threshold.disinflation_vote_lte !== undefined &&
        data.value <= threshold.disinflation_vote_lte
      ) {
        rawVote = -1;
      }
    } else if (config.signal_definition.includes('level_index')) {
      // Level-based signal
      if (threshold.inflation_vote_gte !== undefined && data.value >= threshold.inflation_vote_gte) {
        rawVote = 1;
      } else if (
        threshold.disinflation_vote_lte !== undefined &&
        data.value <= threshold.disinflation_vote_lte
      ) {
        rawVote = -1;
      }
    } else if (config.signal_definition.includes('delta_') || config.signal_definition.includes('_pp')) {
      // Percentage point change
      if (threshold.inflation_vote_gte_pp !== undefined && data.value >= threshold.inflation_vote_gte_pp) {
        rawVote = 1;
      } else if (
        threshold.disinflation_vote_lte_pp !== undefined &&
        data.value <= threshold.disinflation_vote_lte_pp
      ) {
        rawVote = -1;
      }
    }

    // Apply decay formula: effective_vote = raw_vote * vote_weight * (0.5 ^ (age_days / half_life_days))
    const decayFactor = Math.pow(0.5, data.age_days / config.half_life_days);
    const effectiveVote = rawVote * config.vote_weight * decayFactor;

    totalEffectiveVote += effectiveVote;
  }

  // Cap rule: infl_sat_score_capped = clamp(sum(effective_vote_i), -1, +1)
  const cappedScore = Math.max(-1, Math.min(1, totalEffectiveVote));

  return cappedScore;
}

/**
 * Resolve satellite data with one-hop semantically compatible fallback.
 * Do not recurse. Do not alias incompatible lanes.
 */
export async function resolveSatelliteData(
  config: SatelliteConfig,
  provider: SatelliteDataProvider,
  marketData: any[],
  today: Date
): Promise<SatelliteData | null> {
  void marketData;

  let observation = await provider.getLatestObservation(config.series, today);
  let fallbackUsed = false;
  let resolvedSeries = config.series;

  if (!observation && config.fallback !== 'None') {
    const fallbackConfig = SATELLITE_CONFIGS.find((c) => c.series === config.fallback);
    if (fallbackConfig && isFallbackSemanticallyCompatible(config, fallbackConfig)) {
      observation = await provider.getLatestObservation(fallbackConfig.series, today);
      if (observation) {
        fallbackUsed = true;
        resolvedSeries = fallbackConfig.series;
      }
    }
  }

  if (!observation) return null;

  const ageMs = today.getTime() - observation.observationDate.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  return {
    series: config.series,
    value: observation.value,
    observationDate: observation.observationDate,
    age_days: ageDays,
    resolvedSeries,
    underlyingSource: observation.underlyingSource,
    underlyingHorizon: observation.underlyingHorizon,
    fallbackUsed,
  };
}
















