/**
 * Yahoo Finance chart API — BTC-USD daily close series for GhostRegime VAMS bootstrap.
 */

import type { MarketDataPoint } from './types';
import { MARKET_SYMBOLS } from './config';

const YAHOO_BTC_SYMBOL = 'BTC-USD';

export type YahooChartOutcome =
  | 'chart_ok'
  | 'http_not_ok'
  | 'malformed_json'
  | 'missing_result'
  | 'missing_timestamps'
  | 'missing_close'
  | 'zero_valid_rows'
  | 'fetch_threw';

export interface YahooChartDebug {
  request_url_display: string;
  http_status: number;
  outcome: YahooChartOutcome;
  body_preview?: string;
  rows_parsed?: number;
}

function calculateReturn(prevClose: number, currentClose: number): number {
  if (prevClose === 0) return 0;
  return (currentClose - prevClose) / prevClose;
}

export function buildYahooChartUrl(startDate: Date, endDate: Date): string {
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    YAHOO_BTC_SYMBOL
  )}?period1=${period1}&period2=${period2}&interval=1d`;
}

export function formatYahooFailureHint(debug: YahooChartDebug): string {
  const p = (debug.body_preview || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  switch (debug.outcome) {
    case 'http_not_ok':
      return `Yahoo chart HTTP ${debug.http_status}. Preview: ${p}`;
    case 'malformed_json':
      return `Yahoo chart returned invalid JSON. Preview: ${p}`;
    case 'missing_result':
      return 'Yahoo chart response missing chart.result[0].';
    case 'missing_timestamps':
      return 'Yahoo chart response missing timestamp array.';
    case 'missing_close':
      return 'Yahoo chart response missing indicators.quote[0].close.';
    case 'zero_valid_rows':
      return 'Yahoo chart parsed zero valid daily close rows in range.';
    case 'fetch_threw':
      return 'Yahoo chart fetch threw (network/timeout).';
    default:
      return `Yahoo outcome=${debug.outcome}${p ? ` Preview: ${p}` : ''}`;
  }
}

/** Parse Yahoo v8 chart JSON into ascending daily MarketDataPoint rows (UTC date keys). */
export function parseYahooChartBody(
  symbol: string,
  json: unknown,
  startDate: Date,
  endDate: Date
): { data: MarketDataPoint[]; outcome: YahooChartOutcome } {
  const root = json as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };

  const result = root?.chart?.result?.[0];
  if (!result) {
    return { data: [], outcome: 'missing_result' };
  }

  const timestamps = result.timestamp;
  if (!timestamps?.length) {
    return { data: [], outcome: 'missing_timestamps' };
  }

  const closes = result.indicators?.quote?.[0]?.close;
  if (!closes?.length) {
    return { data: [], outcome: 'missing_close' };
  }

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const rows: MarketDataPoint[] = [];
  let prevClose: number | null = null;

  const len = Math.min(timestamps.length, closes.length);
  for (let i = 0; i < len; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (ts == null || close == null || !Number.isFinite(close)) continue;

    const date = new Date(ts * 1000);
    const t = date.getTime();
    if (t < startMs || t > endMs) continue;

    const returns = prevClose !== null ? calculateReturn(prevClose, close) : 0;
    rows.push({ symbol, date, close, returns });
    prevClose = close;
  }

  if (rows.length === 0) {
    return { data: [], outcome: 'zero_valid_rows' };
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { data: rows, outcome: 'chart_ok' };
}

export async function fetchYahooBtcChart(
  startDate: Date,
  endDate: Date
): Promise<{ data: MarketDataPoint[]; debug: YahooChartDebug; error?: string }> {
  const url = buildYahooChartUrl(startDate, endDate);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ghost-allocator/ghostregime',
      },
    });
    const bodyText = await response.text().catch(() => '');
    const preview = bodyText.slice(0, 500);

    if (!response.ok) {
      const debug: YahooChartDebug = {
        request_url_display: url,
        http_status: response.status,
        outcome: 'http_not_ok',
        body_preview: preview,
      };
      return { data: [], debug, error: formatYahooFailureHint(debug) };
    }

    let json: unknown;
    try {
      json = JSON.parse(bodyText);
    } catch {
      const debug: YahooChartDebug = {
        request_url_display: url,
        http_status: response.status,
        outcome: 'malformed_json',
        body_preview: preview,
      };
      return { data: [], debug, error: formatYahooFailureHint(debug) };
    }

    const parsed = parseYahooChartBody(MARKET_SYMBOLS.BTC_USD, json, startDate, endDate);
    const debug: YahooChartDebug = {
      request_url_display: url,
      http_status: response.status,
      outcome: parsed.outcome,
      body_preview: parsed.outcome === 'chart_ok' ? undefined : preview,
      rows_parsed: parsed.data.length,
    };

    if (parsed.outcome !== 'chart_ok') {
      return { data: [], debug, error: formatYahooFailureHint(debug) };
    }

    return { data: parsed.data, debug };
  } catch (error) {
    const debug: YahooChartDebug = {
      request_url_display: url,
      http_status: 0,
      outcome: 'fetch_threw',
      body_preview: (error as Error).message?.slice(0, 200),
    };
    return { data: [], debug, error: formatYahooFailureHint(debug) };
  }
}
