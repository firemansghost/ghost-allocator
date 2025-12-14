/**
 * GhostRegime Market Data Provider
 * Working default implementation using Stooq (ETFs), FRED (VIX), CoinGecko (BTC)
 * No API keys required
 */

import type { MarketDataPoint } from './types';
import { MARKET_SYMBOLS } from './config';

export interface MarketDataProvider {
  getHistoricalPrices(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]>;
  getLatestPrice(symbol: string): Promise<MarketDataPoint | null>;
}

/**
 * Calculate close-to-close return (NOT total return)
 */
function calculateReturn(prevClose: number, currentClose: number): number {
  if (prevClose === 0) return 0;
  return (currentClose - prevClose) / prevClose;
}

/**
 * Fetch ETF data from Stooq
 * Stooq CSV format: Date,Open,High,Low,Close,Volume
 */
async function fetchStooqData(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<MarketDataPoint[]> {
  try {
    // Stooq CSV URL format: https://stooq.com/q/d/l/?s={symbol}&d1={start}&d2={end}&i=d
    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://stooq.com/q/d/l/?s=${symbol}&d1=${startStr}&d2=${endStr}&i=d`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stooq fetch failed: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return []; // Header only

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 5) continue;

      const dateStr = parts[0];
      const close = parseFloat(parts[4]);

      if (isNaN(close)) continue;

      const date = new Date(dateStr);
      const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;

      data.push({
        symbol,
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    return data.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error(`Error fetching Stooq data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch VIX data from FRED (VIXCLS series)
 */
async function fetchFredVix(startDate: Date, endDate: Date): Promise<MarketDataPoint[]> {
  try {
    // FRED API (public, no key required for basic usage)
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&observation_start=${startStr}&observation_end=${endStr}&file_type=json&api_key=`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FRED fetch failed: ${response.statusText}`);
    }

    const json = await response.json();
    const observations = json.observations || [];

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

    for (const obs of observations) {
      if (obs.value === '.' || obs.value === null) continue;

      const close = parseFloat(obs.value);
      if (isNaN(close)) continue;

      const date = new Date(obs.date);
      const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;

      data.push({
        symbol: MARKET_SYMBOLS.VIX,
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    return data.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error fetching FRED VIX data:', error);
    return [];
  }
}

/**
 * Fetch BTC price from CoinGecko
 */
async function fetchCoinGeckoBtc(
  startDate: Date,
  endDate: Date
): Promise<MarketDataPoint[]> {
  try {
    // CoinGecko public API (no key required)
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${startTimestamp}&to=${endTimestamp}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko fetch failed: ${response.statusText}`);
    }

    const json = await response.json();
    const prices = json.prices || [];

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

    for (const [timestamp, price] of prices) {
      const close = price as number;
      if (isNaN(close)) continue;

      const date = new Date(timestamp);
      const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;

      data.push({
        symbol: MARKET_SYMBOLS.BTC_USD,
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    return data.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error fetching CoinGecko BTC data:', error);
    return [];
  }
}

/**
 * Default Market Data Provider Implementation
 */
export class DefaultMarketDataProvider implements MarketDataProvider {
  async getHistoricalPrices(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    const allData: MarketDataPoint[] = [];

    for (const symbol of symbols) {
      let symbolData: MarketDataPoint[] = [];

      if (symbol === MARKET_SYMBOLS.VIX) {
        symbolData = await fetchFredVix(startDate, endDate);
      } else if (symbol === MARKET_SYMBOLS.BTC_USD) {
        symbolData = await fetchCoinGeckoBtc(startDate, endDate);
      } else {
        // ETF from Stooq
        symbolData = await fetchStooqData(symbol, startDate, endDate);
      }

      allData.push(...symbolData);
    }

    return allData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 5); // Get last 5 days to ensure we have latest

    const data = await this.getHistoricalPrices([symbol], startDate, endDate);
    if (data.length === 0) return null;

    // Return the most recent data point
    return data[data.length - 1];
  }
}

// Export singleton instance
export const defaultMarketDataProvider = new DefaultMarketDataProvider();

