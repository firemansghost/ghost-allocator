/**
 * GhostRegime VAMS Calculation
 * Surrogate VAMS using close-to-close price returns (NOT total return)
 */

import type { MarketDataPoint, VamsState } from './types';
import { VAMS_THRESHOLD_HIGH, VAMS_THRESHOLD_LOW, VAMS_SCALE_MAP } from './config';
import { getDataForSymbol, calculateTR, getReturnsForWindow, calculateStdDev, TR_126, TR_252 } from './dataWindows';

/**
 * Compute VAMS score for a symbol
 * mom = 0.6 * TR_126 + 0.4 * TR_252
 * vol = stdev(daily_returns, 63) * sqrt(252)
 * score = mom / vol
 * @param asofDate Optional date to compute as-of (filters data to this date)
 */
export function computeVamsScore(
  marketData: MarketDataPoint[],
  symbol: string,
  asofDate?: Date
): number {
  const symbolData = getDataForSymbol(marketData, symbol);
  
  let filtered = symbolData;
  if (asofDate) {
    filtered = symbolData.filter(d => d.date <= asofDate);
  }
  
  if (filtered.length < TR_252) {
    return 0; // Not enough data
  }

  // Calculate momentum: 0.6 * TR_126 + 0.4 * TR_252
  const tr126 = calculateTR(filtered, TR_126, asofDate);
  const tr252 = calculateTR(filtered, TR_252, asofDate);
  const mom = 0.6 * tr126 + 0.4 * tr252;

  // Calculate volatility: stdev(daily_returns, 63) * sqrt(252)
  const returns = getReturnsForWindow(symbolData, symbol, 63, asofDate);
  if (returns.length < 63) {
    return 0; // Not enough returns
  }

  const stdDev = calculateStdDev(returns);
  const vol = stdDev * Math.sqrt(252);

  // Calculate score
  if (vol === 0) return 0;
  const score = mom / vol;

  return score;
}

/**
 * Convert VAMS score to state
 * score >= +0.50 → state = 2
 * score <= -0.50 → state = -2
 * else state = 0
 */
export function vamsScoreToState(score: number): VamsState {
  if (score >= VAMS_THRESHOLD_HIGH) {
    return 2;
  } else if (score <= VAMS_THRESHOLD_LOW) {
    return -2;
  } else {
    return 0;
  }
}

/**
 * Convert VAMS state to scale
 * 2 → 1
 * 0 → 0.5
 * -2 → 0
 */
export function vamsStateToScale(state: VamsState): number {
  return VAMS_SCALE_MAP[state] ?? 0.5;
}

/**
 * Compute VAMS for all three drivers (stocks, gold, BTC)
 * @param asofDate Optional date to compute as-of (filters data to this date)
 */
export function computeAllVamsStates(
  marketData: MarketDataPoint[],
  btcSymbol: string = 'BTC-USD',
  asofDate?: Date
): {
  stocks: VamsState;
  gold: VamsState;
  btc: VamsState;
} {
  const stocksScore = computeVamsScore(marketData, 'SPY', asofDate);
  const goldScore = computeVamsScore(marketData, 'GLD', asofDate);
  const btcScore = computeVamsScore(marketData, btcSymbol, asofDate);

  return {
    stocks: vamsScoreToState(stocksScore),
    gold: vamsScoreToState(goldScore),
    btc: vamsScoreToState(btcScore),
  };
}

