/**
 * GhostRegime Market Data Provider
 * Working default implementation using Stooq (ETFs, BTC), CBOE (VIX), AlphaVantage (PDBC with DBC fallback)
 */

import type { MarketDataPoint } from './types';
import { MARKET_SYMBOLS } from './config';

/**
 * Stooq symbol mapping (ticker -> Stooq ID)
 * Stooq uses lowercase ticker with .us suffix for US ETFs
 */
const STOOQ_SYMBOL_MAP: Record<string, string> = {
  [MARKET_SYMBOLS.SPY]: 'spy.us',
  [MARKET_SYMBOLS.GLD]: 'gld.us',
  [MARKET_SYMBOLS.HYG]: 'hyg.us',
  [MARKET_SYMBOLS.IEF]: 'ief.us',
  [MARKET_SYMBOLS.EEM]: 'eem.us',
  [MARKET_SYMBOLS.TLT]: 'tlt.us',
  [MARKET_SYMBOLS.UUP]: 'uup.us',
  [MARKET_SYMBOLS.TIP]: 'tip.us', // TIP ETF from Stooq
  [MARKET_SYMBOLS.BTC_USD]: 'btcusd', // BTC-USD from Stooq
  // VIX is now fetched from CBOE CSV (not Stooq)
  // PDBC fallback: DBC (Stooq proxy)
  'DBC': 'dbc.us',
};

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
 * @param symbol - Original ticker symbol (e.g., "SPY")
 * @param stooqId - Resolved Stooq ID (e.g., "spy.us")
 */
async function fetchStooqData(
  symbol: string,
  stooqId: string,
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; resolvedId: string }> {
  try {
    // Stooq CSV URL format: https://stooq.com/q/d/l/?s={stooqId}&d1={start}&d2={end}&i=d
    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://stooq.com/q/d/l/?s=${stooqId}&d1=${startStr}&d2=${endStr}&i=d`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stooq fetch failed: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { data: [], resolvedId: stooqId };
    }

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
        symbol, // Keep original symbol for consistency
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    return {
      data: data.sort((a, b) => a.date.getTime() - b.date.getTime()),
      resolvedId: stooqId,
    };
  } catch (error) {
    console.error(`Error fetching Stooq data for ${symbol} (${stooqId}):`, error);
    return { data: [], resolvedId: stooqId };
  }
}

/**
 * Fetch VIX data from CBOE CSV
 * Downloads and parses the CBOE VIX History CSV file
 * @returns Object with data and error info
 */
async function fetchCboeVix(
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; error?: string }> {
  try {
    const url = 'https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CBOE fetch failed: ${response.statusText}`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('CBOE CSV is empty');
    }

    // Parse CSV manually (simple format: Date,Open,High,Low,Close)
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CBOE CSV has insufficient lines');
    }

    // Find header row and determine column indices
    const headerLine = lines[0].toLowerCase();
    const dateColIndex = headerLine.split(',').findIndex((col) => col.includes('date'));
    const closeColIndex = headerLine.split(',').findIndex((col) => col.includes('close'));

    if (dateColIndex === -1 || closeColIndex === -1) {
      throw new Error('CBOE CSV missing required columns (Date, Close)');
    }

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length <= Math.max(dateColIndex, closeColIndex)) continue;

      // Parse date (format: MM/DD/YYYY)
      const dateStr = columns[dateColIndex].trim();
      const [month, day, year] = dateStr.split('/');
      if (!month || !day || !year) continue;

      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) continue;

      // Filter by date range
      if (date < startDate || date > endDate) continue;

      // Parse close price
      const closeStr = columns[closeColIndex].trim();
      const close = parseFloat(closeStr);
      if (isNaN(close)) continue;

      const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;

      data.push({
        symbol: MARKET_SYMBOLS.VIX,
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    // Sort by date ascending
    const sortedData = data.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      data: sortedData,
    };
  } catch (error) {
    console.error('Error fetching CBOE VIX data:', error);
    return {
      data: [],
      error: (error as Error).message,
    };
  }
}

/**
 * Fetch PDBC data from AlphaVantage
 * AlphaVantage requires API key
 */
async function fetchAlphaVantagePdbc(
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; error?: string }> {
  try {
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    if (!apiKey) {
      return {
        data: [],
        error: 'Missing ALPHAVANTAGE_API_KEY in env',
      };
    }

    // AlphaVantage TIME_SERIES_DAILY endpoint
    // Use outputsize=compact (last ~100 trading days) to avoid premium tier requirement
    // This is sufficient for TR_63 and TR_21 calculations
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=PDBC&apikey=${apiKey}&outputsize=compact&datatype=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`AlphaVantage fetch failed: ${response.statusText}`);
    }

    const json = await response.json();
    
    // Check for API error messages - capture all error fields
    const errorMessage = json['Error Message'];
    const note = json['Note'];
    const information = json['Information'];
    
    if (errorMessage || note || information || !json['Time Series (Daily)']) {
      // Build comprehensive error message
      const errorParts: string[] = [];
      if (errorMessage) errorParts.push(`Error Message: ${errorMessage}`);
      if (note) errorParts.push(`Note: ${note}`);
      if (information) errorParts.push(`Information: ${information}`);
      if (!json['Time Series (Daily)']) {
        errorParts.push('No time series data in response');
      }
      return {
        data: [],
        error: errorParts.join('; '),
      };
    }

    const timeSeries = json['Time Series (Daily)'];

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

    // Convert object to array and filter by date range
    const entries = Object.entries(timeSeries)
      .map(([dateStr, values]: [string, any]) => ({
        date: new Date(dateStr),
        close: parseFloat(values['4. close']),
      }))
      .filter((item) => {
        const date = item.date;
        return date >= startDate && date <= endDate && !isNaN(item.close);
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const item of entries) {
      const returns = prevClose !== null ? calculateReturn(prevClose, item.close) : 0;

      data.push({
        symbol: MARKET_SYMBOLS.PDBC,
        date: item.date,
        close: item.close,
        returns,
      });

      prevClose = item.close;
    }

    return {
      data: data.sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  } catch (error) {
    console.error('Error fetching AlphaVantage PDBC data:', error);
    return {
      data: [],
      error: (error as Error).message,
    };
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

    // CoinGecko returns hourly data - aggregate to daily closes (last price of each day UTC)
    const dailyCloses = new Map<string, number>();
    for (const [timestamp, price] of prices) {
      const close = price as number;
      if (isNaN(close)) continue;

      const date = new Date(timestamp);
      // Use UTC date string as key (YYYY-MM-DD)
      const dateKey = date.toISOString().split('T')[0];
      
      // Keep the last price for each day (CoinGecko data is sorted by timestamp)
      dailyCloses.set(dateKey, close);
    }

    // Convert to MarketDataPoint array, sorted by date
    const data: MarketDataPoint[] = [];
    const sortedDates = Array.from(dailyCloses.keys()).sort();
    let prevClose: number | null = null;

    for (const dateKey of sortedDates) {
      const close = dailyCloses.get(dateKey)!;
      const date = new Date(dateKey + 'T00:00:00Z');
      const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;

      data.push({
        symbol: MARKET_SYMBOLS.BTC_USD,
        date,
        close,
        returns,
      });

      prevClose = close;
    }

    return data;
  } catch (error) {
    console.error('Error fetching CoinGecko BTC data:', error);
    return [];
  }
}

/**
 * Provider diagnostics: resolved IDs, error messages, and proxy usage per symbol
 */
export interface ProviderDiagnostics {
  resolvedIds: Record<string, string>; // symbol -> resolved provider ID
  errors: Record<string, string>; // symbol -> error message
  proxies: Record<string, string>; // original symbol -> proxy symbol (e.g., "PDBC" -> "DBC")
}

/**
 * Default Market Data Provider Implementation
 */
export class DefaultMarketDataProvider implements MarketDataProvider {
  private diagnostics: ProviderDiagnostics = {
    resolvedIds: {},
    errors: {},
    proxies: {},
  };

  /**
   * Get provider diagnostics (resolved IDs, errors, and proxies)
   */
  getDiagnostics(): ProviderDiagnostics {
    return { ...this.diagnostics };
  }

  /**
   * Clear diagnostics (call before new fetch)
   */
  clearDiagnostics(): void {
    this.diagnostics = {
      resolvedIds: {},
      errors: {},
      proxies: {},
    };
  }

  async getHistoricalPrices(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    this.clearDiagnostics();
    const allData: MarketDataPoint[] = [];

    for (const symbol of symbols) {
      let symbolData: MarketDataPoint[] = [];

      if (symbol === MARKET_SYMBOLS.VIX) {
        // VIX from CBOE CSV
        const result = await fetchCboeVix(startDate, endDate);
        symbolData = result.data;
        if (result.error) {
          this.diagnostics.errors[symbol] = result.error;
        }
      } else if (symbol === MARKET_SYMBOLS.PDBC) {
        // PDBC: Try AlphaVantage first, fall back to DBC (Stooq) if AV fails
        const avResult = await fetchAlphaVantagePdbc(startDate, endDate);
        if (avResult.data.length > 0) {
          symbolData = avResult.data;
        } else {
          // Fallback to DBC from Stooq
          const dbcStooqId = STOOQ_SYMBOL_MAP['DBC'];
          if (dbcStooqId) {
            const dbcResult = await fetchStooqData('DBC', dbcStooqId, startDate, endDate);
            symbolData = dbcResult.data.map((point) => ({
              ...point,
              symbol: MARKET_SYMBOLS.PDBC, // Map DBC data to PDBC symbol
            }));
            this.diagnostics.proxies[MARKET_SYMBOLS.PDBC] = 'DBC';
            this.diagnostics.resolvedIds[MARKET_SYMBOLS.PDBC] = dbcResult.resolvedId;
            if (symbolData.length === 0) {
              this.diagnostics.errors[symbol] = `AlphaVantage failed (${avResult.error || 'no data'}), DBC fallback also failed`;
            } else {
              // Note that we're using a proxy
              this.diagnostics.errors[symbol] = `Using DBC proxy (AlphaVantage: ${avResult.error || 'no data'})`;
            }
          } else {
            symbolData = [];
            this.diagnostics.errors[symbol] = `AlphaVantage failed (${avResult.error || 'no data'}), DBC fallback unavailable`;
          }
        }
      } else {
        // ETF from Stooq - use mapped ID
        const stooqId = STOOQ_SYMBOL_MAP[symbol];
        if (!stooqId) {
          this.diagnostics.errors[symbol] = `No Stooq mapping for ${symbol}`;
        } else {
          const result = await fetchStooqData(symbol, stooqId, startDate, endDate);
          symbolData = result.data;
          this.diagnostics.resolvedIds[symbol] = result.resolvedId;
          if (symbolData.length === 0) {
            this.diagnostics.errors[symbol] = `No data returned from Stooq for ${stooqId}`;
          }
        }
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

