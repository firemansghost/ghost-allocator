/**
 * GhostFlow v1.1e-calibration — levered ETF rebalance return-sensitivity research (pure, no I/O).
 *
 * MVP: fixed-current-AUM return-sensitivity study — not true historical AUM calibration.
 */

import {
  computeAggregateLeveredEtfRebalanceMetrics,
  computeEstimatedRebalanceDirection,
  computeEstimatedRebalanceNotional,
  TIER1_LEVERED_ETF_TICKERS,
} from '@/lib/ghostflow/artifacts/leveredEtfRebalancePressure';
import type {
  LeveredEtfDominantDirection,
  LeveredEtfIndexProxyTicker,
  LeveredEtfRebalanceObservationsV1,
  LeveredEtfRebalanceRowV1,
} from '@/lib/ghostflow/artifacts/types';
import { buildGhostFlowSnapshot } from '@/lib/ghostflow/buildSnapshot';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import {
  computeGhostFlowScore,
  computePassivePressureScore,
  computeStructuralFragilityScore,
  ghostFlowBand,
  ghostFlowBandLabel,
} from '@/lib/ghostflow/scoring';
import type { GhostFlowBand } from '@/lib/ghostflow/types';
import {
  distributionP90,
  pctAtOrAbove,
  percentileRank,
  summarizeDistribution,
  type DistributionSummary,
} from '@/lib/ghostflow/research/distribution';

export type LeveredAumMode = 'fixed-current' | 'csv-checkpoints';

export type IndexProxyTicker = LeveredEtfIndexProxyTicker;

export interface Tier1TickerConfig {
  ticker: (typeof TIER1_LEVERED_ETF_TICKERS)[number];
  signedLeverage: number;
  indexProxyTicker: IndexProxyTicker;
  direction: 'long' | 'inverse';
}

/** Tier-1 six-ticker universe (matches production artifact). */
export const TIER1_TICKER_CONFIG: readonly Tier1TickerConfig[] = [
  { ticker: 'TQQQ', signedLeverage: 3, indexProxyTicker: 'QQQ', direction: 'long' },
  { ticker: 'SQQQ', signedLeverage: -3, indexProxyTicker: 'QQQ', direction: 'inverse' },
  { ticker: 'UPRO', signedLeverage: 3, indexProxyTicker: 'SPY', direction: 'long' },
  { ticker: 'SPXU', signedLeverage: -3, indexProxyTicker: 'SPY', direction: 'inverse' },
  { ticker: 'TNA', signedLeverage: 3, indexProxyTicker: 'IWM', direction: 'long' },
  { ticker: 'TZA', signedLeverage: -3, indexProxyTicker: 'IWM', direction: 'inverse' },
] as const;

export interface DailyProxyReturns {
  date: string;
  qqqPct: number;
  spyPct: number;
  iwmPct: number;
}

export type AumResolver = (ticker: string, date: string) => number | null;

export interface SessionObservation {
  date: string;
  observations: LeveredEtfRebalanceObservationsV1;
}

export interface SessionAlignmentResult {
  aligned: SessionObservation[];
  skippedSessions: Array<{ date: string; missingProxies: IndexProxyTicker[] }>;
  totalDatesSeen: number;
}

export interface MappingComparisonRow {
  mapping: string;
  latestScore: number;
  pctSessionsGte70: number;
  pctSessionsGte80: number;
  pctSessionsGte90: number;
  medianScore: number;
  p90Score: number;
}

export interface ScorePreviewRow {
  label: string;
  leveredL: number;
  passivePressure: number;
  composite: number;
  band: GhostFlowBand;
  bandLabel: string;
}

/** Peers from mock snapshot + public artifact merges (matches dashboard score preview). */
const SCORE_PREVIEW_BASE = buildGhostFlowSnapshot(GHOSTFLOW_REFERENCE_AS_OF);
const MOCK_LEVERED = SCORE_PREVIEW_BASE.raw.passivePressure.leveredEtfRebalancePressure;

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function proxyReturnFor(
  proxy: IndexProxyTicker,
  returns: DailyProxyReturns
): number {
  switch (proxy) {
    case 'QQQ':
      return returns.qqqPct;
    case 'SPY':
      return returns.spyPct;
    case 'IWM':
      return returns.iwmPct;
  }
}

export function buildTier1RowsForSession(
  date: string,
  dailyReturns: DailyProxyReturns,
  aumResolver: AumResolver
): { rows: LeveredEtfRebalanceRowV1[] | null; missingProxies: IndexProxyTicker[] } {
  const missingProxies: IndexProxyTicker[] = [];
  for (const proxy of ['QQQ', 'SPY', 'IWM'] as const) {
    const v = proxyReturnFor(proxy, dailyReturns);
    if (!Number.isFinite(v)) missingProxies.push(proxy);
  }
  if (missingProxies.length > 0) return { rows: null, missingProxies };

  const rows: LeveredEtfRebalanceRowV1[] = [];

  for (const cfg of TIER1_TICKER_CONFIG) {
    const aum = aumResolver(cfg.ticker, date);
    if (aum === null || !Number.isFinite(aum)) {
      return { rows: null, missingProxies: [cfg.indexProxyTicker] };
    }
    const underlyingReturnPct = proxyReturnFor(cfg.indexProxyTicker, dailyReturns);
    const estimatedRebalanceNotionalMillionsUsd = computeEstimatedRebalanceNotional(
      aum,
      cfg.signedLeverage,
      underlyingReturnPct
    );
    rows.push({
      ticker: cfg.ticker,
      fundName: cfg.ticker,
      issuer: 'research',
      direction: cfg.direction,
      signedLeverage: cfg.signedLeverage,
      leverageMultiple: Math.abs(cfg.signedLeverage),
      underlyingIndex:
        cfg.indexProxyTicker === 'QQQ'
          ? 'Nasdaq-100'
          : cfg.indexProxyTicker === 'SPY'
            ? 'S&P 500'
            : 'Russell 2000',
      indexProxyTicker: cfg.indexProxyTicker,
      aumMillionsUsd: aum,
      aumAsOf: date,
      aumSourceName: 'research-fixed-aum',
      aumSourceUrl: 'research://fixed-current-aum',
      crossCheckSourceName: 'research',
      crossCheckSourceUrl: 'research://',
      underlyingReturnPct,
      returnAsOf: date,
      returnSourceName: 'research-proxy-returns',
      returnSourceUrl: 'research://',
      estimatedRebalanceNotionalMillionsUsd,
      estimatedRebalanceDirection: computeEstimatedRebalanceDirection(
        estimatedRebalanceNotionalMillionsUsd
      ),
      usedInAggregate: true,
    });
  }

  return { rows, missingProxies: [] };
}

export function buildSessionObservation(
  date: string,
  dailyReturns: DailyProxyReturns,
  aumResolver: AumResolver
): SessionObservation | null {
  const { rows, missingProxies } = buildTier1RowsForSession(date, dailyReturns, aumResolver);
  if (!rows) return null;
  if (missingProxies.length > 0) return null;
  return {
    date,
    observations: computeAggregateLeveredEtfRebalanceMetrics(rows),
  };
}

export function alignSessions(
  dailySeries: readonly DailyProxyReturns[],
  aumResolver: AumResolver
): SessionAlignmentResult {
  const aligned: SessionObservation[] = [];
  const skippedSessions: Array<{ date: string; missingProxies: IndexProxyTicker[] }> = [];

  for (const day of dailySeries) {
    const { rows, missingProxies } = buildTier1RowsForSession(day.date, day, aumResolver);
    if (!rows) {
      skippedSessions.push({
        date: day.date,
        missingProxies: missingProxies.length ? missingProxies : ['QQQ', 'SPY', 'IWM'],
      });
      continue;
    }
    aligned.push({
      date: day.date,
      observations: computeAggregateLeveredEtfRebalanceMetrics(rows),
    });
  }

  return {
    aligned,
    skippedSessions,
    totalDatesSeen: dailySeries.length,
  };
}

export function fixedCurrentAumResolver(
  aumMillionsByTicker: Readonly<Record<string, number>>
): AumResolver {
  return (ticker) => {
    const v = aumMillionsByTicker[ticker];
    return v !== undefined && Number.isFinite(v) ? v : null;
  };
}

export function aumMapFromProductionRows(
  rows: readonly Pick<LeveredEtfRebalanceRowV1, 'ticker' | 'aumMillionsUsd'>[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.ticker] = r.aumMillionsUsd;
  return map;
}

export function mappingLinearPct(pctOfAum: number, k = 20): number {
  return clampInt(pctOfAum * k, 0, 100);
}

/** Conservative manual bands for % of universe AUM (research preview). */
export function mappingManualBands(pctOfAum: number): number {
  const p = pctOfAum;
  if (p < 0.5) return 35;
  if (p < 1) return 45;
  if (p < 1.5) return 50;
  if (p < 2) return 55;
  if (p < 2.5) return 58;
  if (p < 3) return 60;
  if (p < 4) return 68;
  if (p < 5) return 75;
  if (p < 7) return 82;
  return 90;
}

export function mappingCapped(pctOfAum: number, k = 20, cap = 80): number {
  return Math.min(cap, mappingLinearPct(pctOfAum, k));
}

export function mappingPercentile(pctOfAum: number, historyPcts: readonly number[]): number {
  const sorted = [...historyPcts].sort((a, b) => a - b);
  return clampInt(percentileRank(sorted, pctOfAum), 0, 100);
}

export function directionMix(
  directions: readonly LeveredEtfDominantDirection[]
): Record<LeveredEtfDominantDirection, number> {
  const counts: Record<LeveredEtfDominantDirection, number> = {
    buy_underlying: 0,
    sell_underlying: 0,
    mixed: 0,
    flat: 0,
  };
  for (const d of directions) counts[d]++;
  const n = directions.length || 1;
  return {
    buy_underlying: Math.round((1000 * counts.buy_underlying) / n) / 10,
    sell_underlying: Math.round((1000 * counts.sell_underlying) / n) / 10,
    mixed: Math.round((1000 * counts.mixed) / n) / 10,
    flat: Math.round((1000 * counts.flat) / n) / 10,
  };
}

export function buildLeveredMappingComparison(
  aligned: readonly SessionObservation[],
  latest: SessionObservation,
  linearK = 20
): MappingComparisonRow[] {
  const pcts = aligned.map((s) => s.observations.aggregateRebalancePctOfUniverseAum);
  const latestPct = latest.observations.aggregateRebalancePctOfUniverseAum;

  const scoresLinear10 = aligned.map((s) => mappingLinearPct(s.observations.aggregateRebalancePctOfUniverseAum, 10));
  const scoresLinear20 = aligned.map((s) => mappingLinearPct(s.observations.aggregateRebalancePctOfUniverseAum, linearK));
  const scoresBands = aligned.map((s) => mappingManualBands(s.observations.aggregateRebalancePctOfUniverseAum));
  const scoresCapped = aligned.map((s) =>
    mappingCapped(s.observations.aggregateRebalancePctOfUniverseAum, linearK, 80)
  );
  const scoresPct = aligned.map((s) =>
    mappingPercentile(s.observations.aggregateRebalancePctOfUniverseAum, pcts)
  );

  const row = (
    mapping: string,
    latestScore: number,
    scores: readonly number[]
  ): MappingComparisonRow => ({
    mapping,
    latestScore,
    pctSessionsGte70: pctAtOrAbove(scores, 70),
    pctSessionsGte80: pctAtOrAbove(scores, 80),
    pctSessionsGte90: pctAtOrAbove(scores, 90),
    medianScore: summarizeDistribution(scores).median,
    p90Score: distributionP90(scores),
  });

  return [
    row('linear x10 on %AUM', mappingLinearPct(latestPct, 10), scoresLinear10),
    row(`linear x${linearK} on %AUM`, mappingLinearPct(latestPct, linearK), scoresLinear20),
    row('manual bands on %AUM', mappingManualBands(latestPct), scoresBands),
    row(`capped linear x${linearK} (cap 80)`, mappingCapped(latestPct, linearK, 80), scoresCapped),
    row('percentile rank %AUM', mappingPercentile(latestPct, pcts), scoresPct),
  ];
}

export function previewScoreWithLevered(leveredL: number): ScorePreviewRow {
  const passiveInputs = {
    ...SCORE_PREVIEW_BASE.raw.passivePressure,
    leveredEtfRebalancePressure: clampInt(leveredL, 0, 100),
  };
  const passivePressure = computePassivePressureScore(passiveInputs);
  const structuralFragility = computeStructuralFragilityScore(
    SCORE_PREVIEW_BASE.raw.structuralFragility
  );
  const composite = computeGhostFlowScore(passivePressure, structuralFragility);
  const band = ghostFlowBand(composite);
  return {
    label: `L=${clampInt(leveredL, 0, 100)}`,
    leveredL: clampInt(leveredL, 0, 100),
    passivePressure,
    composite,
    band,
    bandLabel: ghostFlowBandLabel(band),
  };
}

export function buildScoreImpactPreview(
  mappingRows: readonly MappingComparisonRow[]
): ScorePreviewRow[] {
  const mockRow = previewScoreWithLevered(MOCK_LEVERED);
  const rows: ScorePreviewRow[] = [
    { ...mockRow, label: `MOCK ${MOCK_LEVERED}` },
  ];
  for (const m of mappingRows) {
    rows.push(previewScoreWithLevered(m.latestScore));
  }
  return rows;
}

export function topSessionsByPctOfAum(
  aligned: readonly SessionObservation[],
  limit: number,
  order: 'high' | 'low'
): SessionObservation[] {
  const sorted = [...aligned].sort((a, b) => {
    const da = a.observations.aggregateRebalancePctOfUniverseAum;
    const db = b.observations.aggregateRebalancePctOfUniverseAum;
    return order === 'high' ? db - da : da - db;
  });
  return sorted.slice(0, limit);
}

export { summarizeDistribution, percentileRank, type DistributionSummary };

export const PRODUCTION_ARTIFACT_CROSS_CHECK_DATE = '2026-05-22' as const;

export const AGGREGATE_PCT_TOLERANCE = 0.05;
export const AGGREGATE_NOTIONAL_TOLERANCE_MILLIONS = 0.1;
