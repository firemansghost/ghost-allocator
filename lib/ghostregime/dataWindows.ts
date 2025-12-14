/**
 * GhostRegime Data Window Utilities
 * "N observations" approach for calculating returns
 * ETFs/VIX naturally skip weekends/holidays, BTC uses calendar observations
 */

import type { MarketDataPoint } from './types';
import { TR_21, TR_63, TR_126, TR_252 } from './config';

/**
 * Get last N observations from sorted data array
 */
export function getLastNObservations(
  data: MarketDataPoint[],
  n: number
): MarketDataPoint[] {
  if (data.length === 0) return [];
  if (data.length <= n) return [...data];

  // Data should be sorted by date ascending
  return data.slice(-n);
}

/**
 * Calculate close-to-close return over a window
 * Returns the total return from first to last observation
 */
export function calculateTR(
  data: MarketDataPoint[],
  windowDays: number
): number {
  const window = getLastNObservations(data, windowDays);
  if (window.length < 2) return 0;

  const first = window[0];
  const last = window[window.length - 1];

  if (first.close === 0) return 0;
  return (last.close - first.close) / first.close;
}

/**
 * Calculate ratio return (dataA / dataB) over a window
 */
export function calculateRatioTR(
  dataA: MarketDataPoint[],
  dataB: MarketDataPoint[],
  windowDays: number
): number {
  const windowA = getLastNObservations(dataA, windowDays);
  const windowB = getLastNObservations(dataB, windowDays);

  if (windowA.length < 2 || windowB.length < 2) return 0;

  // Match dates between the two series
  const dateMapA = new Map<string, number>();
  const dateMapB = new Map<string, number>();

  for (const point of windowA) {
    const dateKey = point.date.toISOString().split('T')[0];
    dateMapA.set(dateKey, point.close);
  }

  for (const point of windowB) {
    const dateKey = point.date.toISOString().split('T')[0];
    dateMapB.set(dateKey, point.close);
  }

  // Find common dates
  const commonDates = Array.from(dateMapA.keys()).filter((d) => dateMapB.has(d));
  if (commonDates.length < 2) return 0;

  // Sort dates and get first/last
  commonDates.sort();
  const firstDate = commonDates[0];
  const lastDate = commonDates[commonDates.length - 1];

  const firstRatio = (dateMapA.get(firstDate) || 0) / (dateMapB.get(firstDate) || 1);
  const lastRatio = (dateMapA.get(lastDate) || 0) / (dateMapB.get(lastDate) || 1);

  if (firstRatio === 0) return 0;
  return (lastRatio - firstRatio) / firstRatio;
}

/**
 * Get data for a specific symbol from mixed array
 */
export function getDataForSymbol(
  data: MarketDataPoint[],
  symbol: string
): MarketDataPoint[] {
  return data.filter((d) => d.symbol === symbol).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate standard deviation of returns
 */
export function calculateStdDev(returns: number[]): number {
  if (returns.length === 0) return 0;
  if (returns.length === 1) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

/**
 * Get returns array for a symbol over a window
 */
export function getReturnsForWindow(
  data: MarketDataPoint[],
  symbol: string,
  windowDays: number
): number[] {
  const symbolData = getDataForSymbol(data, symbol);
  const window = getLastNObservations(symbolData, windowDays);
  return window.map((d) => d.returns || 0).filter((r) => !isNaN(r));
}

// Export window constants for convenience
export { TR_21, TR_63, TR_126, TR_252 };

