/**
 * GhostRegime Market Data Provider
 * Stooq CSV for US ETFs (+ optional STOOQ_API_KEY when Stooq serves apikey/captcha gate),
 * CoinGecko fallback for BTC-USD if Stooq fails, CBOE (VIX), AlphaVantage (PDBC with DBC/Stooq fallback)
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
  // Level-2 VAMS diagnostics only (compare-vams-profiles script)
  VT: 'vt.us',
  GLDM: 'gldm.us',
  FBTC: 'fbtc.us',
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

/** Stooq daily CSV header (see https://stooq.com/q/d/l/) */
const STOOQ_CSV_HEADER_RE = /^Date,Open,High,Low,Close,Volume/i;

/**
 * Stooq may return plaintext instructions (API key / captcha) instead of CSV when `apikey` is missing.
 * See: https://stooq.com/q/d/?s=spy.us&get_apikey
 */
export function isStooqApiKeyGateBody(text: string): boolean {
  const head = text.slice(0, 2500).toLowerCase();
  return (
    head.includes('get your apikey') ||
    (head.includes('captcha') && head.includes('apikey')) ||
    (head.includes('stooq') && head.includes('apikey') && head.includes('csv download link'))
  );
}

function buildStooqCsvUrl(
  stooqId: string,
  startStr: string,
  endStr: string
): { fetchUrl: string; displayUrl: string } {
  const base = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqId)}&d1=${startStr}&d2=${endStr}&i=d`;
  const apiKey = process.env.STOOQ_API_KEY?.trim();
  if (apiKey) {
    const q = `&apikey=${encodeURIComponent(apiKey)}`;
    return { fetchUrl: `${base}${q}`, displayUrl: `${base}&apikey=<redacted>` };
  }
  return { fetchUrl: base, displayUrl: base };
}

export type StooqFetchOutcome =
  | 'csv_ok'
  | 'stooq_apikey_gate'
  | 'non_csv_unexpected'
  | 'http_not_ok'
  | 'empty_body'
  | 'header_only'
  | 'zero_parsed_rows'
  | 'fetch_threw';

export interface StooqFetchDebug {
  request_url_display: string;
  http_status: number;
  content_type: string | null;
  body_preview: string;
  outcome: StooqFetchOutcome;
}

function emptyStooqDebug(
  displayUrl: string,
  status: number,
  ct: string | null,
  preview: string,
  outcome: StooqFetchOutcome
): StooqFetchDebug {
  return {
    request_url_display: displayUrl,
    http_status: status,
    content_type: ct,
    body_preview: preview.slice(0, 500),
    outcome,
  };
}

/** Human-readable line for provider_diagnostics.errors (not a substitute for structured stooq_probe). */
export function formatStooqFailureHint(debug: StooqFetchDebug): string {
  const p = debug.body_preview.replace(/\s+/g, ' ').trim().slice(0, 200);
  switch (debug.outcome) {
    case 'stooq_apikey_gate':
      return `Stooq returned API-key/captcha instructions instead of CSV. Set env STOOQ_API_KEY (see https://stooq.com/q/d/?s=spy.us&get_apikey). Preview: ${p}`;
    case 'non_csv_unexpected':
      return `Stooq response was not CSV (unexpected first line or HTML). Preview: ${p}`;
    case 'http_not_ok':
      return `Stooq HTTP ${debug.http_status}. Preview: ${p}`;
    case 'empty_body':
      return 'Stooq returned an empty body.';
    case 'header_only':
      return 'Stooq CSV had only a header row (no data in range).';
    case 'zero_parsed_rows':
      return 'Stooq CSV parsed zero valid price rows.';
    case 'fetch_threw':
      return 'Stooq fetch threw (network/timeout).';
    default:
      return `Stooq outcome=${debug.outcome}. Preview: ${p}`;
  }
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
): Promise<{ data: MarketDataPoint[]; resolvedId: string; debug: StooqFetchDebug }> {
  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const { fetchUrl, displayUrl } = buildStooqCsvUrl(stooqId, startStr, endStr);

  try {
    const response = await fetch(fetchUrl);
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, errBody, 'http_not_ok'),
      };
    }

    const text = await response.text();
    const preview = text.slice(0, 500);

    if (!text.trim()) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, '', 'empty_body'),
      };
    }

    if (isStooqApiKeyGateBody(text)) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'stooq_apikey_gate'),
      };
    }

    const headHtml = text.slice(0, 800).toLowerCase();
    if (headHtml.includes('<!doctype') || headHtml.includes('<html')) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'non_csv_unexpected'),
      };
    }

    const lines = text.trim().split('\n');
    const firstLine = (lines[0] ?? '').trim().replace(/^\uFEFF/, '');
    if (!STOOQ_CSV_HEADER_RE.test(firstLine)) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'non_csv_unexpected'),
      };
    }

    if (lines.length < 2) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'header_only'),
      };
    }

    const data: MarketDataPoint[] = [];
    let prevClose: number | null = null;

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

    const sorted = data.sort((a, b) => a.date.getTime() - b.date.getTime());
    if (sorted.length === 0) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'zero_parsed_rows'),
      };
    }

    return {
      data: sorted,
      resolvedId: stooqId,
      debug: {
        request_url_display: displayUrl,
        http_status: response.status,
        content_type: contentType,
        body_preview: preview.slice(0, 200) + (text.length > 200 ? '…' : ''),
        outcome: 'csv_ok',
      },
    };
  } catch (error) {
    console.error(`Error fetching Stooq data for ${symbol} (${stooqId}):`, error);
    return {
      data: [],
      resolvedId: stooqId,
      debug: emptyStooqDebug(displayUrl, 0, null, (error as Error).message || '', 'fetch_threw'),
    };
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
 * Fetch BTC price from CoinGecko (used when Stooq BTC CSV is unavailable)
 */
async function fetchCoinGeckoBtc(
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; error?: string }> {
  try {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${startTimestamp}&to=${endTimestamp}`;

    const response = await fetch(url);
    if (!response.ok) {
      const t = await response.text().catch(() => '');
      return {
        data: [],
        error: `CoinGecko HTTP ${response.status}: ${t.slice(0, 200)}`,
      };
    }

    const json = await response.json();
    const prices = json.prices || [];

    const dailyCloses = new Map<string, number>();
    for (const [timestamp, price] of prices) {
      const close = price as number;
      if (isNaN(close)) continue;

      const date = new Date(timestamp);
      const dateKey = date.toISOString().split('T')[0];
      dailyCloses.set(dateKey, close);
    }

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

    if (data.length === 0) {
      return { data: [], error: 'CoinGecko returned no prices in range' };
    }

    return { data };
  } catch (error) {
    console.error('Error fetching CoinGecko BTC data:', error);
    return { data: [], error: (error as Error).message };
  }
}

/**
 * Provider diagnostics: resolved IDs, error messages, and proxy usage per symbol
 */
export interface ProviderDiagnostics {
  resolvedIds: Record<string, string>; // symbol -> resolved provider ID
  errors: Record<string, string>; // symbol -> error message
  proxies: Record<string, string>; // original symbol -> proxy symbol (e.g., "PDBC" -> "DBC")
  /** Per fetch-key Stooq probe (symbol passed to fetch, e.g. SPY, DBC); body_preview shows why CSV failed */
  stooq_probe?: Record<string, StooqFetchDebug>;
}

/**
 * Default Market Data Provider Implementation
 */
export class DefaultMarketDataProvider implements MarketDataProvider {
  private diagnostics: ProviderDiagnostics = {
    resolvedIds: {},
    errors: {},
    proxies: {},
    stooq_probe: {},
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
      stooq_probe: {},
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
            if (dbcResult.debug.outcome !== 'csv_ok') {
              if (!this.diagnostics.stooq_probe) this.diagnostics.stooq_probe = {};
              this.diagnostics.stooq_probe['DBC'] = dbcResult.debug;
            }
            symbolData = dbcResult.data.map((point) => ({
              ...point,
              symbol: MARKET_SYMBOLS.PDBC, // Map DBC data to PDBC symbol
            }));
            this.diagnostics.proxies[MARKET_SYMBOLS.PDBC] = 'DBC';
            this.diagnostics.resolvedIds[MARKET_SYMBOLS.PDBC] = dbcResult.resolvedId;
            if (symbolData.length === 0) {
              this.diagnostics.errors[symbol] = `AlphaVantage failed (${avResult.error || 'no data'}). DBC (Stooq): ${formatStooqFailureHint(dbcResult.debug)}`;
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
        const stooqId = STOOQ_SYMBOL_MAP[symbol];
        if (!stooqId) {
          this.diagnostics.errors[symbol] = `No Stooq mapping for ${symbol}`;
        } else if (symbol === MARKET_SYMBOLS.BTC_USD) {
          const result = await fetchStooqData(symbol, stooqId, startDate, endDate);
          if (result.debug.outcome !== 'csv_ok') {
            if (!this.diagnostics.stooq_probe) this.diagnostics.stooq_probe = {};
            this.diagnostics.stooq_probe[symbol] = result.debug;
          }
          symbolData = result.data;
          this.diagnostics.resolvedIds[symbol] = result.resolvedId;
          if (symbolData.length === 0) {
            const cg = await fetchCoinGeckoBtc(startDate, endDate);
            if (cg.data.length > 0) {
              symbolData = cg.data;
              this.diagnostics.resolvedIds[symbol] = 'coingecko:bitcoin';
            } else {
              this.diagnostics.errors[symbol] =
                formatStooqFailureHint(result.debug) + (cg.error ? ` ${cg.error}` : '');
            }
          }
        } else {
          const result = await fetchStooqData(symbol, stooqId, startDate, endDate);
          if (result.debug.outcome !== 'csv_ok') {
            if (!this.diagnostics.stooq_probe) this.diagnostics.stooq_probe = {};
            this.diagnostics.stooq_probe[symbol] = result.debug;
          }
          symbolData = result.data;
          this.diagnostics.resolvedIds[symbol] = result.resolvedId;
          if (symbolData.length === 0) {
            this.diagnostics.errors[symbol] = formatStooqFailureHint(result.debug);
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

