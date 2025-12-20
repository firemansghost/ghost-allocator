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

export interface SatelliteDataProvider {
  getLatestObservation(series: string): Promise<{
    value: number;
    observationDate: Date;
  } | null>;
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

  async getLatestObservation(series: string): Promise<{
    value: number;
    observationDate: Date;
  } | null> {
    // Escape hatch: Commodity Nowcast Basket is always available
    if (series === 'Commodity Nowcast Basket (Energy+Metals)') {
      return this.getCommodityBasketValue();
    }

    // Other series are stubs for now
    // In production, these would fetch from real sources
    return null;
  }

  private getCommodityBasketValue(): {
    value: number;
    observationDate: Date;
  } | null {
    // Derive from PDBC (commodity ETF) TR_21
    const pdbcData = getDataForSymbol(this.marketData, MARKET_SYMBOLS.PDBC);
    if (pdbcData.length < TR_21) return null;

    const tr = calculateTR(pdbcData, TR_21);
    const latestDate = pdbcData[pdbcData.length - 1].date;

    return {
      value: tr,
      observationDate: latestDate,
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
 * Resolve satellite data with fallback chain
 */
export async function resolveSatelliteData(
  config: SatelliteConfig,
  provider: SatelliteDataProvider,
  marketData: any[],
  today: Date
): Promise<SatelliteData | null> {
  // Try primary series
  let observation = await provider.getLatestObservation(config.series);

  // If not available, try fallback chain
  if (!observation && config.fallback !== 'None') {
    const fallbackConfig = SATELLITE_CONFIGS.find((c) => c.series === config.fallback);
    if (fallbackConfig) {
      observation = await provider.getLatestObservation(fallbackConfig.series);
    }
  }

  if (!observation) return null;

  // Calculate age in days
  const ageMs = today.getTime() - observation.observationDate.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  return {
    series: config.series,
    value: observation.value,
    observationDate: observation.observationDate,
    age_days: ageDays,
  };
}








