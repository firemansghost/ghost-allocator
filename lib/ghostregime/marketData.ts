/**
 * GhostRegime Market Data Provider
 * Yahoo chart (BTC-USD bootstrap + ETF fallback), Stooq CSV for US ETFs (+ optional STOOQ_API_KEY),
 * Marketstack emergency ETF fallback, CoinGecko recent-only BTC gap-fill, CBOE (VIX),
 * AlphaVantage (PDBC with DBC/Stooq fallback)
 */

import type { MarketDataPoint } from './types';
import { MARKET_SYMBOLS } from './config';
import {
  fetchMarketstackEod,
  formatMarketstackFailureHint,
  isMarketstackEtfFallbackSymbol,
} from './marketstackEod';
import {
  evaluateMarketstackFallbackAllowed,
  formatMarketstackGuardSkipMessage,
  type MarketstackGuardDenyReason,
} from './marketstackGuard';
import {
  BTC_BOOTSTRAP_MIN_ROWS,
  clampCoinGeckoPublicStart,
  isCoinGeckoPublicLookbackExceeded,
} from './providerCapabilities';
import {
  fetchYahooBtcChart,
  fetchYahooChart,
  formatYahooFailureHint,
  type YahooChartDebug,
} from './yahooChart';

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

/**
 * Stooq daily CSV header (see https://stooq.com/q/d/l/).
 * US equity series use `Date,Open,High,Low,Close,Volume`; some symbols (e.g. btcusd) omit Volume.
 */
export function isStooqDailyCsvHeader(firstLine: string): boolean {
  const line = firstLine.trim().replace(/^\uFEFF/, '');
  return /^Date,Open,High,Low,Close(?:,Volume)?$/i.test(line);
}

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

/** Stooq may return browser/JS verification HTML instead of CSV (common from serverless IPs). */
export function isStooqBrowserChallengeBody(text: string): boolean {
  const head = text.slice(0, 4000).toLowerCase();
  return (
    head.includes('requires javascript') ||
    head.includes('please enable javascript') ||
    head.includes('verify your browser') ||
    head.includes('browser verification') ||
    head.includes('checking your browser') ||
    (head.includes('<!doctype') && head.includes('javascript'))
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
  | 'stooq_browser_challenge'
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
    case 'stooq_browser_challenge':
      return `Stooq returned browser/JS verification instead of CSV (use Yahoo BTC bootstrap). Preview: ${p}`;
    case 'non_csv_unexpected':
      return `Stooq response was not recognized as daily CSV (expected header Date,Open,High,Low,Close with optional Volume, or HTML/error body). Preview: ${p}`;
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
 * Stooq CSV format: Date,Open,High,Low,Close[,Volume]
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

    if (isStooqBrowserChallengeBody(text)) {
      return {
        data: [],
        resolvedId: stooqId,
        debug: emptyStooqDebug(displayUrl, response.status, contentType, preview, 'stooq_browser_challenge'),
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
    if (!isStooqDailyCsvHeader(firstLine)) {
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
      // OHLC daily: 5 cols without Volume, 6 with Volume (close is index 4)
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

/** Public CoinGecko chunk size within the 360-day public cap. */
const COINGECKO_RANGE_CHUNK_SECONDS = 80 * 24 * 60 * 60;

export interface CoinGeckoBtcFetchMeta {
  lookbackLimited?: boolean;
  lookbackExceeded?: boolean;
}

/**
 * CoinGecko public BTC — recent-only gap-fill; not bootstrap-capable (max ~360 calendar days).
 */
export async function fetchCoinGeckoBtcPublic(
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; error?: string; meta: CoinGeckoBtcFetchMeta }> {
  const meta: CoinGeckoBtcFetchMeta = {};
  try {
    const { effectiveStart, lookbackLimited } = clampCoinGeckoPublicStart(startDate, endDate);
    if (lookbackLimited) {
      meta.lookbackLimited = true;
    }

    const startTimestamp = Math.floor(effectiveStart.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const pricePoints: [number, number][] = [];
    let cursor = startTimestamp;
    let lastError: string | undefined;

    while (cursor < endTimestamp) {
      const chunkEnd = Math.min(cursor + COINGECKO_RANGE_CHUNK_SECONDS, endTimestamp);
      const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${cursor}&to=${chunkEnd}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ghost-allocator/ghostregime',
        },
      });
      const bodyText = await response.text().catch(() => '');

      if (!response.ok) {
        if (isCoinGeckoPublicLookbackExceeded(bodyText)) {
          meta.lookbackExceeded = true;
          lastError = `coingecko_public_lookback_exceeded: HTTP ${response.status}: ${bodyText.slice(0, 240)}`;
        } else {
          lastError = `CoinGecko HTTP ${response.status} (chunk ${cursor}-${chunkEnd}): ${bodyText.slice(0, 240)}`;
        }
        return { data: [], error: lastError, meta };
      }

      let json: { prices?: [number, number][] };
      try {
        json = JSON.parse(bodyText) as { prices?: [number, number][] };
      } catch {
        return {
          data: [],
          error: `CoinGecko invalid JSON (chunk ${cursor}-${chunkEnd})`,
          meta,
        };
      }

      for (const pair of json.prices || []) {
        if (Array.isArray(pair) && pair.length >= 2) {
          pricePoints.push([pair[0], pair[1]]);
        }
      }

      cursor = chunkEnd + 1;
    }

    const dailyCloses = new Map<string, number>();
    for (const [timestamp, price] of pricePoints) {
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
      if (date < effectiveStart || date > endDate) continue;
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
      return {
        data: [],
        error: lastError || 'CoinGecko returned no prices in range',
        meta,
      };
    }

    return { data, meta };
  } catch (error) {
    console.error('Error fetching CoinGecko BTC data:', error);
    return { data: [], error: (error as Error).message, meta };
  }
}

export interface BtcProviderAttempt {
  provider: 'yahoo' | 'stooq' | 'coingecko_public';
  outcome: string;
  rows: number;
  note?: string;
}

export interface BtcMarketProbe {
  provider_attempts: BtcProviderAttempt[];
  oldest_date: string | null;
  newest_date: string | null;
  obs_in_fetch: number;
  coingecko_public_lookback_limited?: boolean;
  coingecko_public_lookback_exceeded?: boolean;
  bootstrap_capable_succeeded: boolean;
}

function btcDateRange(data: MarketDataPoint[]): { oldest: string | null; newest: string | null } {
  if (data.length === 0) return { oldest: null, newest: null };
  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    oldest: sorted[0].date.toISOString().split('T')[0],
    newest: sorted[sorted.length - 1].date.toISOString().split('T')[0],
  };
}

function finalizeBtcProbe(
  attempts: BtcProviderAttempt[],
  data: MarketDataPoint[],
  extra?: Pick<BtcMarketProbe, 'coingecko_public_lookback_limited' | 'coingecko_public_lookback_exceeded'>
): BtcMarketProbe {
  const range = btcDateRange(data);
  const bootstrapOk = data.length >= BTC_BOOTSTRAP_MIN_ROWS;
  return {
    provider_attempts: attempts,
    oldest_date: range.oldest,
    newest_date: range.newest,
    obs_in_fetch: data.length,
    bootstrap_capable_succeeded: bootstrapOk,
    ...extra,
  };
}

/**
 * BTC-USD provider chain: Yahoo (bootstrap) → Stooq (optional) → CoinGecko public (recent-only).
 */
export async function fetchBtcUsdFromProviders(
  startDate: Date,
  endDate: Date
): Promise<{
  data: MarketDataPoint[];
  resolvedId: string;
  error?: string;
  probe: BtcMarketProbe;
  stooqDebug?: StooqFetchDebug;
  yahooDebug?: YahooChartDebug;
}> {
  const attempts: BtcProviderAttempt[] = [];

  const yahoo = await fetchYahooBtcChart(startDate, endDate);
  attempts.push({
    provider: 'yahoo',
    outcome: yahoo.debug.outcome,
    rows: yahoo.data.length,
    note: yahoo.error,
  });

  if (yahoo.data.length >= BTC_BOOTSTRAP_MIN_ROWS) {
    return {
      data: yahoo.data,
      resolvedId: 'yahoo:BTC-USD',
      probe: finalizeBtcProbe(attempts, yahoo.data),
      yahooDebug: yahoo.debug,
    };
  }

  const stooqId = STOOQ_SYMBOL_MAP[MARKET_SYMBOLS.BTC_USD];
  const stooq = await fetchStooqData(MARKET_SYMBOLS.BTC_USD, stooqId, startDate, endDate);
  attempts.push({
    provider: 'stooq',
    outcome: stooq.debug.outcome,
    rows: stooq.data.length,
    note:
      stooq.data.length === 0
        ? formatStooqFailureHint(stooq.debug)
        : undefined,
  });

  if (stooq.data.length >= BTC_BOOTSTRAP_MIN_ROWS) {
    return {
      data: stooq.data,
      resolvedId: stooq.resolvedId,
      probe: finalizeBtcProbe(attempts, stooq.data),
      stooqDebug: stooq.debug,
      yahooDebug: yahoo.debug,
    };
  }

  const cg = await fetchCoinGeckoBtcPublic(startDate, endDate);
  attempts.push({
    provider: 'coingecko_public',
    outcome: cg.data.length > 0 ? 'prices_ok' : 'no_data',
    rows: cg.data.length,
    note: cg.error,
  });

  const best =
    yahoo.data.length >= stooq.data.length && yahoo.data.length >= cg.data.length
      ? { data: yahoo.data, resolvedId: 'yahoo:BTC-USD' }
      : stooq.data.length >= cg.data.length
        ? { data: stooq.data, resolvedId: stooq.resolvedId }
        : { data: cg.data, resolvedId: 'coingecko:bitcoin' };

  const errors: string[] = [];
  if (yahoo.error && yahoo.data.length === 0) errors.push(`Yahoo: ${yahoo.error}`);
  if (stooq.data.length === 0) errors.push(formatStooqFailureHint(stooq.debug));
  if (cg.error) errors.push(cg.error);
  if (best.data.length < BTC_BOOTSTRAP_MIN_ROWS) {
    errors.push(
      `No bootstrap-capable BTC provider reached ${BTC_BOOTSTRAP_MIN_ROWS} observations (CoinGecko public is recent-only, max ~360d)`
    );
  }

  return {
    data: best.data,
    resolvedId: best.resolvedId,
    error: errors.filter(Boolean).join(' | '),
    probe: finalizeBtcProbe(attempts, best.data, {
      coingecko_public_lookback_limited: cg.meta.lookbackLimited,
      coingecko_public_lookback_exceeded: cg.meta.lookbackExceeded,
    }),
    stooqDebug: stooq.debug,
    yahooDebug: yahoo.debug,
  };
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
  /** BTC-USD multi-provider chain probe */
  btc_probe?: BtcMarketProbe;
  /** One line per symbol: Stooq → Yahoo → Marketstack chain outcome */
  feed_routing?: Record<string, string>;
  /** Yahoo chart probe when ETF fallback ran (or failed) */
  yahoo_probe?: Record<
    string,
    {
      request_url_display: string;
      http_status: number;
      outcome: string;
      body_preview?: string;
      rows_parsed?: number;
    }
  >;
  /** Marketstack EOD probe when emergency fallback ran (or failed) */
  marketstack_probe?: Record<
    string,
    {
      request_display: string;
      http_status: number;
      outcome: string;
      body_preview?: string;
      pages_fetched?: number;
      api_message?: string;
      guard_reason?: MarketstackGuardDenyReason;
    }
  >;
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
          const btc = await fetchBtcUsdFromProviders(startDate, endDate);
          symbolData = btc.data;
          this.diagnostics.resolvedIds[symbol] = btc.resolvedId;
          this.diagnostics.btc_probe = btc.probe;
          this.diagnostics.feed_routing ??= {};
          const winner = btc.probe.provider_attempts.find(
            (a) => a.rows >= BTC_BOOTSTRAP_MIN_ROWS
          );
          this.diagnostics.feed_routing[symbol] = winner
            ? `${winner.provider} (bootstrap ok, rows=${winner.rows})`
            : `BTC chain: ${btc.probe.provider_attempts.map((a) => `${a.provider}:${a.outcome}/${a.rows}`).join(' → ')}`;
          if (btc.stooqDebug && btc.stooqDebug.outcome !== 'csv_ok') {
            if (!this.diagnostics.stooq_probe) this.diagnostics.stooq_probe = {};
            this.diagnostics.stooq_probe[symbol] = btc.stooqDebug;
          }
          if (btc.error && btc.data.length < BTC_BOOTSTRAP_MIN_ROWS) {
            this.diagnostics.errors[symbol] = btc.error;
          }
        } else {
          const result = await fetchStooqData(symbol, stooqId, startDate, endDate);
          if (result.debug.outcome !== 'csv_ok') {
            if (!this.diagnostics.stooq_probe) this.diagnostics.stooq_probe = {};
            this.diagnostics.stooq_probe[symbol] = result.debug;
          }

          const stooqUsable = result.debug.outcome === 'csv_ok' && result.data.length > 0;
          if (stooqUsable) {
            symbolData = result.data;
            this.diagnostics.resolvedIds[symbol] = result.resolvedId;
            this.diagnostics.feed_routing ??= {};
            this.diagnostics.feed_routing[symbol] = 'Stooq (csv_ok)';
          } else if (isMarketstackEtfFallbackSymbol(symbol)) {
            this.diagnostics.feed_routing ??= {};
            const stooqPart = `Stooq (${result.debug.outcome})`;

            const yahoo = await fetchYahooChart(symbol, symbol, startDate, endDate);
            this.diagnostics.yahoo_probe ??= {};
            this.diagnostics.yahoo_probe[symbol] = {
              request_url_display: yahoo.debug.request_url_display,
              http_status: yahoo.debug.http_status,
              outcome: yahoo.debug.outcome,
              body_preview: yahoo.debug.body_preview,
              rows_parsed: yahoo.debug.rows_parsed,
            };

            const yahooUsable = yahoo.debug.outcome === 'chart_ok' && yahoo.data.length > 0;
            if (yahooUsable) {
              symbolData = yahoo.data;
              this.diagnostics.resolvedIds[symbol] = `yahoo:${symbol}`;
              this.diagnostics.feed_routing[symbol] =
                `${stooqPart} → Yahoo (chart_ok, rows=${yahoo.data.length})`;
            } else {
              const yahooPart =
                yahoo.debug.outcome === 'chart_ok'
                  ? 'Yahoo (chart_ok, rows=0)'
                  : `Yahoo (${yahoo.debug.outcome}${
                      yahoo.debug.rows_parsed !== undefined
                        ? `, rows=${yahoo.debug.rows_parsed}`
                        : ''
                    })`;

              const guard = evaluateMarketstackFallbackAllowed();
              if (!guard.allowed) {
                this.diagnostics.resolvedIds[symbol] = result.resolvedId;
                this.diagnostics.marketstack_probe ??= {};
                this.diagnostics.marketstack_probe[symbol] = {
                  request_display: '(guard blocked — no request sent)',
                  http_status: 0,
                  outcome: 'guard_blocked',
                  guard_reason: guard.denyReason,
                };
                this.diagnostics.errors[symbol] =
                  `${formatStooqFailureHint(result.debug)} | ${formatYahooFailureHint(yahoo.debug)} | ${formatMarketstackGuardSkipMessage(guard.denyReason!)}`;
                this.diagnostics.feed_routing[symbol] =
                  `${stooqPart} → ${yahooPart} → Marketstack (guard_blocked)`;
              } else {
                const msKey = process.env.MARKETSTACK_ACCESS_KEY?.trim();
                if (msKey) {
                  const ms = await fetchMarketstackEod(symbol, startDate, endDate, msKey);
                  this.diagnostics.marketstack_probe ??= {};
                  this.diagnostics.marketstack_probe[symbol] = {
                    request_display: ms.debug.request_display,
                    http_status: ms.debug.http_status,
                    outcome: ms.debug.outcome,
                    body_preview: ms.debug.body_preview,
                    pages_fetched: ms.debug.pages_fetched,
                    api_message: ms.debug.api_message,
                    guard_reason: ms.debug.guard_reason,
                  };
                  if (ms.data.length > 0) {
                    symbolData = ms.data;
                    this.diagnostics.resolvedIds[symbol] = `marketstack:${symbol}`;
                    this.diagnostics.feed_routing[symbol] =
                      `${stooqPart} → ${yahooPart} → Marketstack (${ms.debug.outcome}, rows=${ms.data.length})`;
                  } else {
                    this.diagnostics.resolvedIds[symbol] = result.resolvedId;
                    this.diagnostics.errors[symbol] =
                      `${formatStooqFailureHint(result.debug)} | ${formatYahooFailureHint(yahoo.debug)} | Marketstack: ${formatMarketstackFailureHint(ms.debug)}`;
                    this.diagnostics.feed_routing[symbol] =
                      `${stooqPart} → ${yahooPart} → Marketstack failed (${ms.debug.outcome})`;
                  }
                } else {
                  this.diagnostics.resolvedIds[symbol] = result.resolvedId;
                  this.diagnostics.marketstack_probe ??= {};
                  this.diagnostics.marketstack_probe[symbol] = {
                    request_display: '(no key — no request sent)',
                    http_status: 0,
                    outcome: 'guard_blocked',
                    guard_reason: 'marketstack_key_missing',
                  };
                  this.diagnostics.errors[symbol] =
                    `${formatStooqFailureHint(result.debug)} | ${formatYahooFailureHint(yahoo.debug)} | ${formatMarketstackGuardSkipMessage('marketstack_key_missing')}`;
                  this.diagnostics.feed_routing[symbol] =
                    `${stooqPart} → ${yahooPart} → Marketstack (guard_blocked)`;
                }
              }
            }
          } else {
            symbolData = result.data;
            this.diagnostics.resolvedIds[symbol] = result.resolvedId;
            if (symbolData.length === 0) {
              this.diagnostics.errors[symbol] = formatStooqFailureHint(result.debug);
            }
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

