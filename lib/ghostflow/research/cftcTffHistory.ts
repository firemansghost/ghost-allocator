/**
 * GhostFlow v1.0a — CFTC TFF historical basket research helpers (pure, no I/O).
 */

import {
  computeBasketMetrics,
  mapBasketNetPctOiToPressureScore,
  MVP_SCORE_CONTRACT_CODES,
  VIX_CONTEXT_CONTRACT_CODE,
} from '@/lib/ghostflow/artifacts/systematicFlowProxy';
import type {
  SystematicFlowProxyBasket,
  SystematicFlowProxyBasketDirection,
  SystematicFlowProxyContractObservation,
  SystematicFlowProxyScoreContract,
} from '@/lib/ghostflow/artifacts/types';

export const TFF_FUTURES_ONLY_DATASET_ID = 'gpe5-46if' as const;

export const CFTC_PRE_RESOURCE_URL =
  `https://publicreporting.cftc.gov/resource/${TFF_FUTURES_ONLY_DATASET_ID}.json` as const;

export const MVP_CONTRACT_META: Record<
  (typeof MVP_SCORE_CONTRACT_CODES)[number],
  string
> = {
  '13874A': 'E-MINI S&P 500',
  '209742': 'NASDAQ MINI',
  '239742': 'RUSSELL E-MINI',
};

export type CftcTffRawRow = Record<string, string | undefined>;

export interface WeeklyAlignedBasket {
  reportDate: string;
  reportWeek: string;
  scoreContracts: SystematicFlowProxyScoreContract[];
  basket: SystematicFlowProxyBasket;
}

export interface WeeklyAlignmentResult {
  aligned: WeeklyAlignedBasket[];
  skippedWeeks: Array<{ reportDate: string; missingCodes: string[] }>;
  totalReportDatesSeen: number;
}

export interface DistributionSummary {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  mean: number;
}

export interface MappingComparisonRow {
  mapping: string;
  latestScore: number;
  pctWeeksGte70: number;
  pctWeeksGte80: number;
  pctWeeksGte90: number;
  medianScore: number;
  p90Score: number;
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function num(row: CftcTffRawRow, key: string): number | null {
  const v = row[key];
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function reportDateFromRow(row: CftcTffRawRow): string | null {
  const raw = row.report_date_as_yyyy_mm_dd;
  if (!raw) return null;
  return raw.slice(0, 10);
}

export function rowToScoreContract(
  row: CftcTffRawRow,
  code: (typeof MVP_SCORE_CONTRACT_CODES)[number]
): SystematicFlowProxyScoreContract | null {
  const reportDate = reportDateFromRow(row);
  const reportWeek = row.yyyy_report_week_ww?.trim();
  if (!reportDate || !reportWeek) return null;

  const openInterestAll = num(row, 'open_interest_all');
  const leveragedFundsLong = num(row, 'lev_money_positions_long');
  const leveragedFundsShort = num(row, 'lev_money_positions_short');
  const leveragedFundsSpread = num(row, 'lev_money_positions_spread');
  const changeLong = num(row, 'change_in_lev_money_long');
  const changeShort = num(row, 'change_in_lev_money_short');
  const changeSpread = num(row, 'change_in_lev_money_spread');
  const pctOiLong = num(row, 'pct_of_oi_lev_money_long');
  const pctOiShort = num(row, 'pct_of_oi_lev_money_short');
  const pctOiSpread = num(row, 'pct_of_oi_lev_money_spread');

  if (
    openInterestAll === null ||
    leveragedFundsLong === null ||
    leveragedFundsShort === null ||
    leveragedFundsSpread === null ||
    changeLong === null ||
    changeShort === null ||
    changeSpread === null ||
    pctOiLong === null ||
    pctOiShort === null ||
    pctOiSpread === null
  ) {
    return null;
  }

  const observations: SystematicFlowProxyContractObservation = {
    reportDate,
    reportWeek,
    openInterestAll,
    leveragedFundsLong,
    leveragedFundsShort,
    leveragedFundsSpread,
    changeLong,
    changeShort,
    changeSpread,
    pctOiLong,
    pctOiShort,
    pctOiSpread,
  };

  return {
    cftcContractMarketCode: code,
    contractMarketName: row.contract_market_name?.trim() || MVP_CONTRACT_META[code],
    usedInScore: true,
    observations,
  };
}

export function groupRowsByReportDate(rows: CftcTffRawRow[]): Map<string, CftcTffRawRow[]> {
  const byDate = new Map<string, CftcTffRawRow[]>();
  for (const row of rows) {
    const date = reportDateFromRow(row);
    const code = row.cftc_contract_market_code;
    if (!date || !code) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(row);
  }
  return byDate;
}

export function alignWeeklyBaskets(
  rows: CftcTffRawRow[],
  options?: { since?: string }
): WeeklyAlignmentResult {
  const byDate = groupRowsByReportDate(rows);
  const reportDates = [...byDate.keys()].sort();
  const aligned: WeeklyAlignedBasket[] = [];
  const skippedWeeks: WeeklyAlignmentResult['skippedWeeks'] = [];

  for (const reportDate of reportDates) {
    if (options?.since && reportDate < options.since) continue;

    const weekRows = byDate.get(reportDate)!;
    const byCode = new Map<string, CftcTffRawRow>();
    for (const row of weekRows) {
      const code = row.cftc_contract_market_code;
      if (!code) continue;
      if (!byCode.has(code)) byCode.set(code, row);
    }

    const missingCodes = MVP_SCORE_CONTRACT_CODES.filter((c) => !byCode.has(c));
    if (missingCodes.length > 0) {
      skippedWeeks.push({ reportDate, missingCodes: [...missingCodes] });
      continue;
    }

    const scoreContracts: SystematicFlowProxyScoreContract[] = [];
    for (const code of MVP_SCORE_CONTRACT_CODES) {
      const contract = rowToScoreContract(byCode.get(code)!, code);
      if (!contract) {
        skippedWeeks.push({ reportDate, missingCodes: [code] });
        scoreContracts.length = 0;
        break;
      }
      scoreContracts.push(contract);
    }
    if (scoreContracts.length !== MVP_SCORE_CONTRACT_CODES.length) continue;

    const reportWeek = scoreContracts[0]!.observations.reportWeek;
    const basket = computeBasketMetrics(scoreContracts);
    aligned.push({ reportDate, reportWeek, scoreContracts, basket });
  }

  return {
    aligned,
    skippedWeeks,
    totalReportDatesSeen: reportDates.length,
  };
}

/** Percentile rank 0–100: share of sample <= value (linear interpolation on sorted values). */
export function percentileRank(sortedAsc: readonly number[], value: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return value >= sortedAsc[0]! ? 100 : 0;

  let below = 0;
  let equal = 0;
  for (const v of sortedAsc) {
    if (v < value) below++;
    else if (v === value) equal++;
    else break;
  }
  const rank = (below + 0.5 * equal) / sortedAsc.length;
  return Math.round(rank * 1000) / 10;
}

function percentileLinear(sortedAsc: readonly number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0]!;
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo]!;
  const w = idx - lo;
  return sortedAsc[lo]! * (1 - w) + sortedAsc[hi]! * w;
}

export function summarizeDistribution(values: readonly number[]): DistributionSummary {
  if (values.length === 0) {
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, mean: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0]!,
    p25: Math.round(percentileLinear(sorted, 0.25) * 10) / 10,
    median: Math.round(percentileLinear(sorted, 0.5) * 10) / 10,
    p75: Math.round(percentileLinear(sorted, 0.75) * 10) / 10,
    max: sorted[sorted.length - 1]!,
    mean: Math.round((sum / sorted.length) * 10) / 10,
  };
}

export function pctWeeksAtOrAbove(scores: readonly number[], threshold: number): number {
  if (scores.length === 0) return 0;
  const count = scores.filter((s) => s >= threshold).length;
  return Math.round((1000 * count) / scores.length) / 10;
}

export function directionMix(
  directions: readonly SystematicFlowProxyBasketDirection[]
): Record<SystematicFlowProxyBasketDirection, number> {
  const counts: Record<SystematicFlowProxyBasketDirection, number> = {
    net_long: 0,
    net_short: 0,
    flat: 0,
  };
  for (const d of directions) counts[d]++;
  const n = directions.length || 1;
  return {
    net_long: Math.round((1000 * counts.net_long) / n) / 10,
    net_short: Math.round((1000 * counts.net_short) / n) / 10,
    flat: Math.round((1000 * counts.flat) / n) / 10,
  };
}

export function mappingScoreFixed(basketNetPctOi: number): number {
  return mapBasketNetPctOiToPressureScore(basketNetPctOi);
}

export function mappingScorePercentile(
  basketAbsNetPctOi: number,
  historicalAbsNetPctOi: readonly number[]
): number {
  const sorted = [...historicalAbsNetPctOi].sort((a, b) => a - b);
  return clampInt(percentileRank(sorted, basketAbsNetPctOi), 0, 100);
}

export function mappingScoreCapped(basketNetPctOi: number, cap: number): number {
  return Math.min(cap, mappingScoreFixed(basketNetPctOi));
}

export function mappingScoreZScore(
  basketAbsNetPctOi: number,
  historicalAbsNetPctOi: readonly number[],
  k = 15
): number {
  if (historicalAbsNetPctOi.length < 2) return mappingScoreFixed(basketAbsNetPctOi);
  const mean =
    historicalAbsNetPctOi.reduce((a, b) => a + b, 0) / historicalAbsNetPctOi.length;
  const variance =
    historicalAbsNetPctOi.reduce((a, v) => a + (v - mean) ** 2, 0) /
    historicalAbsNetPctOi.length;
  const std = Math.sqrt(variance) || 1;
  const z = (basketAbsNetPctOi - mean) / std;
  return clampInt(50 + k * z, 0, 100);
}

export function buildMappingComparison(
  aligned: readonly WeeklyAlignedBasket[],
  latest: WeeklyAlignedBasket,
  cap = 80
): MappingComparisonRow[] {
  const absPct = aligned.map((w) => w.basket.basketAbsNetPctOi);
  const scoresA = aligned.map((w) => mappingScoreFixed(w.basket.basketNetPctOi));
  const scoresB = aligned.map((w) =>
    mappingScorePercentile(w.basket.basketAbsNetPctOi, absPct)
  );
  const scoresC = aligned.map((w) => mappingScoreCapped(w.basket.basketNetPctOi, cap));
  const scoresD = aligned.map((w) => mappingScoreZScore(w.basket.basketAbsNetPctOi, absPct));

  const latestB = mappingScorePercentile(latest.basket.basketAbsNetPctOi, absPct);
  const latestC = mappingScoreCapped(latest.basket.basketNetPctOi, cap);
  const latestD = mappingScoreZScore(latest.basket.basketAbsNetPctOi, absPct);

  const row = (
    mapping: string,
    latestScore: number,
    scores: readonly number[]
  ): MappingComparisonRow => ({
    mapping,
    latestScore,
    pctWeeksGte70: pctWeeksAtOrAbove(scores, 70),
    pctWeeksGte80: pctWeeksAtOrAbove(scores, 80),
    pctWeeksGte90: pctWeeksAtOrAbove(scores, 90),
    medianScore: summarizeDistribution(scores).median,
    p90Score: Math.round(percentileLinear([...scores].sort((a, b) => a - b), 0.9)),
  });

  return [
    row('A fixed abs(netPctOi)*5', mappingScoreFixed(latest.basket.basketNetPctOi), scoresA),
    row('B percentile rank abs(netPctOi)', latestB, scoresB),
    row(`C capped linear (cap ${cap})`, latestC, scoresC),
    row('D z-score abs(netPctOi) → 50+15z', latestD, scoresD),
  ];
}

export function topWeeksByNetPctOi(
  aligned: readonly WeeklyAlignedBasket[],
  direction: 'net_short' | 'net_long',
  limit: number
): WeeklyAlignedBasket[] {
  const filtered = aligned.filter((w) =>
    direction === 'net_short' ? w.basket.basketNetPctOi < 0 : w.basket.basketNetPctOi > 0
  );
  const sorted = [...filtered].sort((a, b) => {
    if (direction === 'net_short') {
      return a.basket.basketNetPctOi - b.basket.basketNetPctOi;
    }
    return b.basket.basketNetPctOi - a.basket.basketNetPctOi;
  });
  return sorted.slice(0, limit);
}

export function isVixRow(row: CftcTffRawRow): boolean {
  return row.cftc_contract_market_code === VIX_CONTEXT_CONTRACT_CODE;
}

export function filterMvpRows(rows: CftcTffRawRow[]): CftcTffRawRow[] {
  return rows.filter((r) =>
    MVP_SCORE_CONTRACT_CODES.includes(
      r.cftc_contract_market_code as (typeof MVP_SCORE_CONTRACT_CODES)[number]
    )
  );
}
