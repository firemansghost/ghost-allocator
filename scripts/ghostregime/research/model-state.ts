/**
 * Research-only GhostRegime model-state adapter.
 *
 * Does not call computeGhostRegime() for full history (production rejects
 * dates at or before CUTOVER_DATE_UTC). Reuses lower-level production pures.
 * Do not mutate CUTOVER_DATE_UTC or add a production bypass.
 */

import { formatISO } from 'date-fns';
import {
  MARKET_SYMBOLS,
  TIEBREAK_RULE,
  TR_21,
  TR_63,
} from '../../../lib/ghostregime/config';
import {
  applyStressOverride,
  classifyRegime,
  computeOptionBVotes,
  mapToRiskRegime,
} from '../../../lib/ghostregime/regimeCore';
import {
  ACTIVE_SATELLITE_CONFIGS,
  DefaultSatelliteDataProvider,
  processSatellites,
  resolveSatelliteData,
} from '../../../lib/ghostregime/satellites';
import { computeAllVamsStates } from '../../../lib/ghostregime/vams';
import { computeAllocations } from '../../../lib/ghostregime/allocations';
import {
  calculateRatioTR,
  getDataForSymbol,
  getLastNObservations,
} from '../../../lib/ghostregime/dataWindows';
import type { MarketDataPoint, RegimeType, SatelliteData } from '../../../lib/ghostregime/types';
import { NUMERIC_TOLERANCE } from './study-contract';
import {
  MODEL_STATE_PARITY_FIELDS,
  dateKeyFromUtc,
  type ModelStateParityField,
  type ResearchModelState,
} from './types';
import { computeGhostRegime } from '../../../lib/ghostregime/engine';

export type ParityMismatchCounts = Record<ModelStateParityField, number>;

export function emptyParityCounts(): ParityMismatchCounts {
  return Object.fromEntries(MODEL_STATE_PARITY_FIELDS.map((field) => [field, 0])) as ParityMismatchCounts;
}

export function compareAllocationRelevantState(
  research: ResearchModelState,
  production: {
    regime: string;
    risk_regime: string;
    risk_score: number;
    infl_score: number;
    infl_core_score: number;
    infl_sat_score: number;
    risk_tiebreaker_used: boolean;
    infl_tiebreaker_used: boolean;
    stocks_vams_state: number;
    gold_vams_state: number;
    btc_vams_state: number;
    stocks_target: number;
    gold_target: number;
    btc_target: number;
    stocks_scale: number;
    gold_scale: number;
    btc_scale: number;
    stocks_actual: number;
    gold_actual: number;
    btc_actual: number;
    cash: number;
  },
  tolerance = NUMERIC_TOLERANCE
): ModelStateParityField[] {
  const mismatches: ModelStateParityField[] = [];
  for (const field of MODEL_STATE_PARITY_FIELDS) {
    const a = research[field];
    const b = production[field];
    if (typeof a === 'number' && typeof b === 'number') {
      if (Math.abs(a - b) > tolerance) mismatches.push(field);
    } else if (a !== b) {
      mismatches.push(field);
    }
  }
  return mismatches;
}

export async function runPostCutoverParity(args: {
  marketData: MarketDataPoint[];
  spyDates: string[];
  cutover: string;
  end: string;
}): Promise<{
  dates_tested: number;
  first_date: string | null;
  last_date: string | null;
  mismatch_counts: ParityMismatchCounts;
  total_mismatches: number;
  first_mismatch: { date: string; fields: ModelStateParityField[] } | null;
  nonzero_infl_sat_score_dates: number;
}> {
  const dates = args.spyDates.filter((date) => date > args.cutover && date <= args.end);
  const counts = emptyParityCounts();
  let firstMismatch: { date: string; fields: ModelStateParityField[] } | null = null;
  let nonzeroSat = 0;

  for (const dateKey of dates) {
    const asof = new Date(`${dateKey}T00:00:00.000Z`);
    const satelliteData = await resolveResearchSatellites(args.marketData, asof);
    const research = await computeResearchModelState(args.marketData, asof, { satelliteData });
    if (research.infl_sat_score !== 0) {
      nonzeroSat += 1;
      throw new Error(`UNEXPECTED_ACTIVE_SATELLITE_SCORE at ${dateKey}: ${research.infl_sat_score}`);
    }
    const production = await productionModelStateForParity(args.marketData, asof, satelliteData);
    const mismatches = compareAllocationRelevantState(research, production);
    if (mismatches.length > 0 && firstMismatch == null) {
      firstMismatch = { date: dateKey, fields: mismatches };
    }
    for (const field of mismatches) counts[field] += 1;
  }

  return {
    dates_tested: dates.length,
    first_date: dates[0] ?? null,
    last_date: dates[dates.length - 1] ?? null,
    mismatch_counts: counts,
    total_mismatches: Object.values(counts).reduce((sum, n) => sum + n, 0),
    first_mismatch: firstMismatch,
    nonzero_infl_sat_score_dates: nonzeroSat,
  };
}

export async function productionModelStateForParity(
  marketData: MarketDataPoint[],
  asofDate: Date,
  satelliteData: SatelliteData[]
): Promise<ResearchModelState> {
  const row = await computeGhostRegime(asofDate, marketData, satelliteData, null);
  return {
    date: row.date,
    regime: row.regime,
    risk_regime: row.risk_regime,
    risk_score: row.risk_score,
    infl_score: row.infl_score,
    infl_core_score: row.infl_core_score,
    infl_sat_score: row.infl_sat_score,
    risk_tiebreaker_used: row.risk_tiebreaker_used,
    infl_tiebreaker_used: row.infl_tiebreaker_used,
    stocks_vams_state: row.stocks_vams_state,
    gold_vams_state: row.gold_vams_state,
    btc_vams_state: row.btc_vams_state,
    stocks_target: row.stocks_target,
    gold_target: row.gold_target,
    btc_target: row.btc_target,
    stocks_scale: row.stocks_scale,
    gold_scale: row.gold_scale,
    btc_scale: row.btc_scale,
    stocks_actual: row.stocks_actual,
    gold_actual: row.gold_actual,
    btc_actual: row.btc_actual,
    cash: row.cash,
  };
}

export async function resolveResearchSatellites(
  marketData: MarketDataPoint[],
  asofDate: Date
): Promise<SatelliteData[]> {
  const provider = new DefaultSatelliteDataProvider();
  provider.setMarketData(marketData);
  const satelliteData: SatelliteData[] = [];
  for (const config of ACTIVE_SATELLITE_CONFIGS) {
    const row = await resolveSatelliteData(config, provider, marketData, asofDate);
    if (row) satelliteData.push(row);
  }
  return satelliteData;
}

/**
 * Inflation PDBC TR21 tie-break orchestration (mirrors engine.ts, research-only).
 * Uses production getDataForSymbol / getLastNObservations / TR_21 / TIEBREAK_RULE.
 */
export function applyInflationPdbcTieBreak(
  marketData: MarketDataPoint[],
  asofDate: Date,
  inflTotalScorePreTiebreak: number
): { inflTotalScore: number; inflTiebreakerUsed: boolean } {
  if (inflTotalScorePreTiebreak !== 0) {
    return { inflTotalScore: inflTotalScorePreTiebreak, inflTiebreakerUsed: false };
  }

  const pdbcData = getDataForSymbol(marketData, MARKET_SYMBOLS.PDBC);
  const filteredPdbcData = pdbcData.filter((d) => d.date <= asofDate);

  if (filteredPdbcData.length < TR_21) {
    throw new Error('MISSING_TIEBREAK_INPUT');
  }

  const window = getLastNObservations(filteredPdbcData, TR_21);
  if (window.length < 2) {
    throw new Error('MISSING_TIEBREAK_INPUT');
  }

  const first = window[0];
  const last = window[window.length - 1];
  if (first.close === 0) {
    throw new Error('MISSING_TIEBREAK_INPUT');
  }

  const pdbcTR21 = (last.close - first.close) / first.close;
  const validDataPoints = filteredPdbcData.filter((d) => d.close > 0 && !Number.isNaN(d.close));
  if (validDataPoints.length < TR_21 || Number.isNaN(pdbcTR21) || !Number.isFinite(pdbcTR21)) {
    throw new Error('MISSING_TIEBREAK_INPUT');
  }

  const isInflationary = TIEBREAK_RULE === 'GT_ZERO' ? pdbcTR21 > 0 : pdbcTR21 >= 0;
  return {
    inflTotalScore: isInflationary ? 1 : -1,
    inflTiebreakerUsed: true,
  };
}

export async function computeResearchModelState(
  marketData: MarketDataPoint[],
  asofDate: Date,
  options?: {
    satelliteData?: SatelliteData[];
    previousRegime?: RegimeType | null;
    allowNonzeroInflSatScore?: boolean;
  }
): Promise<ResearchModelState> {
  void options?.previousRegime;

  const votes = computeOptionBVotes(marketData, asofDate, false, undefined);
  const riskScore = votes.risk_score;
  const inflCoreScore = votes.infl_score;

  const satelliteData =
    options?.satelliteData ?? (await resolveResearchSatellites(marketData, asofDate));
  const inflSatScore = processSatellites(satelliteData, ACTIVE_SATELLITE_CONFIGS, asofDate);

  if (inflSatScore !== 0 && !options?.allowNonzeroInflSatScore) {
    throw new Error(
      `UNEXPECTED_ACTIVE_SATELLITE_SCORE: infl_sat_score=${inflSatScore} at ${formatISO(asofDate, { representation: 'date' })}. R5B v1.0.4 score-fed satellites are expected to resolve no active observations.`
    );
  }

  const inflTotalScorePreTiebreak = inflCoreScore + inflSatScore;
  const { inflTotalScore, inflTiebreakerUsed } = applyInflationPdbcTieBreak(
    marketData,
    asofDate,
    inflTotalScorePreTiebreak
  );

  let regime = classifyRegime(riskScore, inflTotalScore);
  let riskRegime = mapToRiskRegime(regime);

  const vixData = getDataForSymbol(marketData, MARKET_SYMBOLS.VIX).filter((d) => d.date <= asofDate);
  const hygData = getDataForSymbol(marketData, MARKET_SYMBOLS.HYG).filter((d) => d.date <= asofDate);
  const iefData = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF).filter((d) => d.date <= asofDate);

  if (vixData.length > 0 && hygData.length >= TR_63 && iefData.length >= TR_63) {
    const latestVix = vixData[vixData.length - 1].close;
    const hygIefRatio = calculateRatioTR(hygData, iefData, TR_63, asofDate);
    riskRegime = applyStressOverride(latestVix, hygIefRatio, riskRegime);
    if (riskRegime === 'RISK OFF' && (regime === 'GOLDILOCKS' || regime === 'REFLATION')) {
      regime = inflTotalScore > 0 ? 'INFLATION' : 'DEFLATION';
    }
  }

  const vamsStates = computeAllVamsStates(marketData, MARKET_SYMBOLS.BTC_USD, asofDate);
  const allocations = computeAllocations(regime, vamsStates);

  return {
    date: dateKeyFromUtc(asofDate),
    regime,
    risk_regime: riskRegime,
    risk_score: riskScore,
    infl_score: inflTotalScore,
    infl_core_score: inflCoreScore,
    infl_sat_score: inflSatScore,
    risk_tiebreaker_used: votes.risk_tiebreaker_used,
    infl_tiebreaker_used: inflTiebreakerUsed,
    stocks_vams_state: vamsStates.stocks,
    gold_vams_state: vamsStates.gold,
    btc_vams_state: vamsStates.btc,
    stocks_target: allocations.stocks_target,
    gold_target: allocations.gold_target,
    btc_target: allocations.btc_target,
    stocks_scale: allocations.stocks_scale,
    gold_scale: allocations.gold_scale,
    btc_scale: allocations.btc_scale,
    stocks_actual: allocations.stocks_actual,
    gold_actual: allocations.gold_actual,
    btc_actual: allocations.btc_actual,
    cash: allocations.cash,
  };
}
