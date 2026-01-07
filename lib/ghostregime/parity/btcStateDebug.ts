/**
 * BTC State Debug Exporter
 * Pure, deterministic function to extract all inputs that produced a BTC VAMS state
 */

import type { MarketDataPoint } from '../types';
import { computeVamsScore, vamsScoreToState, vamsStateToScale } from '../vams';
import { getDataForSymbol, calculateTR, getReturnsForWindow, calculateStdDev, TR_126, TR_252 } from '../dataWindows';
import { VAMS_THRESHOLD_HIGH, VAMS_THRESHOLD_LOW } from '../config';

export interface BtcStateDebugRow {
  date: string; // YYYY-MM-DD
  proxySymbol: string;
  lastPriceDateUsed: string | null; // ISO date string of last price used
  close: number | null; // Last close price
  tr126: number | null;
  tr252: number | null;
  momentumScore: number | null; // 0.6 * tr126 + 0.4 * tr252
  momentumWeights: { tr126: number; tr252: number }; // { 0.6, 0.4 }
  vol: number | null; // stdev(daily_returns, 63) * sqrt(252)
  volWindow: number; // 63
  combinedScore: number | null; // momentum / vol
  thresholdPos: number; // +0.50
  thresholdNeg: number; // -0.50
  state: number; // -2, 0, or 2
  scale: number; // 0.0, 0.5, or 1.0
  insufficientData: boolean; // True if not enough data to compute
  insufficientDataReason?: string;
}

/**
 * Build a debug row for BTC state computation
 * Pure and deterministic - same inputs produce same outputs
 */
export function buildBtcStateDebugRow(params: {
  date: Date;
  btcSeries: MarketDataPoint[];
  btcSymbol?: string;
}): BtcStateDebugRow {
  const { date, btcSeries, btcSymbol = 'BTC-USD' } = params;
  
  const symbolData = getDataForSymbol(btcSeries, btcSymbol);
  const filtered = symbolData.filter(d => d.date <= date);
  
  // Get last price date
  const lastPrice = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const lastPriceDateUsed = lastPrice ? lastPrice.date.toISOString() : null;
  const close = lastPrice ? lastPrice.close : null;
  
  // Check if we have enough data
  if (filtered.length < TR_252) {
    return {
      date: date.toISOString().split('T')[0],
      proxySymbol: btcSymbol,
      lastPriceDateUsed,
      close,
      tr126: null,
      tr252: null,
      momentumScore: null,
      momentumWeights: { tr126: 0.6, tr252: 0.4 },
      vol: null,
      volWindow: 63,
      combinedScore: null,
      thresholdPos: VAMS_THRESHOLD_HIGH,
      thresholdNeg: VAMS_THRESHOLD_LOW,
      state: 0,
      scale: 0.5,
      insufficientData: true,
      insufficientDataReason: `Need at least ${TR_252} observations, got ${filtered.length}`,
    };
  }
  
  // Calculate TR_126 and TR_252
  const tr126 = calculateTR(filtered, TR_126, date);
  const tr252 = calculateTR(filtered, TR_252, date);
  
  // Calculate momentum: 0.6 * TR_126 + 0.4 * TR_252
  const momentumScore = 0.6 * tr126 + 0.4 * tr252;
  
  // Calculate volatility: stdev(daily_returns, 63) * sqrt(252)
  const returns = getReturnsForWindow(btcSeries, btcSymbol, 63, date);
  let vol: number | null = null;
  if (returns.length < 63) {
    return {
      date: date.toISOString().split('T')[0],
      proxySymbol: btcSymbol,
      lastPriceDateUsed,
      close,
      tr126,
      tr252,
      momentumScore,
      momentumWeights: { tr126: 0.6, tr252: 0.4 },
      vol: null,
      volWindow: 63,
      combinedScore: null,
      thresholdPos: VAMS_THRESHOLD_HIGH,
      thresholdNeg: VAMS_THRESHOLD_LOW,
      state: 0,
      scale: 0.5,
      insufficientData: true,
      insufficientDataReason: `Need at least 63 returns for volatility, got ${returns.length}`,
    };
  }
  
  const stdDev = calculateStdDev(returns);
  vol = stdDev * Math.sqrt(252);
  
  // Calculate combined score
  let combinedScore: number | null = null;
  if (vol === 0) {
    combinedScore = 0;
  } else {
    combinedScore = momentumScore / vol;
  }
  
  // Convert to state
  const state = vamsScoreToState(combinedScore);
  const scale = vamsStateToScale(state);
  
  return {
    date: date.toISOString().split('T')[0],
    proxySymbol: btcSymbol,
    lastPriceDateUsed,
    close,
    tr126,
    tr252,
    momentumScore,
    momentumWeights: { tr126: 0.6, tr252: 0.4 },
    vol,
    volWindow: 63,
    combinedScore,
    thresholdPos: VAMS_THRESHOLD_HIGH,
    thresholdNeg: VAMS_THRESHOLD_LOW,
    state,
    scale,
    insufficientData: false,
  };
}
