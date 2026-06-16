/**
 * Marketstack EOD — optional paid fallback when Stooq fails for core US ETF symbols.
 * Stooq remains primary; this module is only invoked from DefaultMarketDataProvider after a failed Stooq attempt.
 *
 * Env: MARKETSTACK_ACCESS_KEY (dashboard access key; do not commit).
 * Env: ALLOW_MARKETSTACK_FALLBACK=true required to spend quota (see marketstackGuard.ts).
 * @see https://marketstack.com/documentation
 */

import type { MarketDataPoint } from './types';
import {
  evaluateMarketstackFallbackAllowed,
  formatMarketstackGuardSkipMessage,
  type MarketstackGuardDenyReason,
} from './marketstackGuard';

/** ETF/core symbols that may use Marketstack after Stooq failure (not PDBC, not BTC-USD, not VIX). */
export const MARKETSTACK_ETF_FALLBACK_SYMBOLS: ReadonlySet<string> = new Set([
  'SPY',
  'GLD',
  'EEM',
  'HYG',
  'IEF',
  'TIP',
  'TLT',
  'UUP',
]);

export function isMarketstackEtfFallbackSymbol(symbol: string): boolean {
  return MARKETSTACK_ETF_FALLBACK_SYMBOLS.has(symbol);
}

const MARKETSTACK_EOD_URL = 'https://api.marketstack.com/v1/eod';
/** Stay under typical page limits; paginate if needed. */
const PAGE_LIMIT = 1000;
/** Marketstack documents ~5 requests/sec — small gap between pagination calls. */
const PAGINATION_GAP_MS = 220;

function calculateReturn(prevClose: number, currentClose: number): number {
  if (prevClose === 0) return 0;
  return (currentClose - prevClose) / prevClose;
}

export type MarketstackFetchOutcome =
  | 'ok'
  | 'missing_access_key'
  | 'guard_blocked'
  | 'http_error'
  | 'api_error'
  | 'empty_data'
  | 'zero_parsed_rows'
  | 'fetch_threw';

export interface MarketstackFetchDebug {
  /** URL without access key */
  request_display: string;
  http_status: number;
  outcome: MarketstackFetchOutcome;
  body_preview?: string;
  pages_fetched?: number;
  api_message?: string;
  guard_reason?: MarketstackGuardDenyReason;
}

function redactedUrl(params: URLSearchParams): string {
  const p = new URLSearchParams(params);
  if (p.has('access_key')) p.set('access_key', '<redacted>');
  return `${MARKETSTACK_EOD_URL}?${p.toString()}`;
}

export function formatMarketstackFailureHint(debug: MarketstackFetchDebug): string {
  const prev = (debug.body_preview || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  switch (debug.outcome) {
    case 'missing_access_key':
      return 'Marketstack skipped (MARKETSTACK_ACCESS_KEY unset)';
    case 'guard_blocked':
      return debug.guard_reason
        ? formatMarketstackGuardSkipMessage(debug.guard_reason)
        : 'Marketstack fallback blocked by guard';
    case 'http_error':
      return `Marketstack HTTP ${debug.http_status}. Preview: ${prev}`;
    case 'api_error':
      return `Marketstack API error: ${debug.api_message || prev}`;
    case 'empty_data':
      return 'Marketstack returned no EOD rows for range';
    case 'zero_parsed_rows':
      return 'Marketstack response parsed zero usable rows';
    case 'fetch_threw':
      return `Marketstack fetch threw: ${prev}`;
    default:
      return `Marketstack outcome=${debug.outcome}. Preview: ${prev}`;
  }
}

/** Raw row from Marketstack `data[]` (subset). */
interface MarketstackEodRow {
  close?: number;
  date?: string;
  symbol?: string;
}

export function parseMarketstackEodBody(
  symbol: string,
  json: unknown,
  startDate: Date,
  endDate: Date
): { points: MarketDataPoint[]; apiError?: string } {
  if (!json || typeof json !== 'object') {
    return { points: [] };
  }
  const o = json as Record<string, unknown>;
  const err = o.error as Record<string, unknown> | undefined;
  if (err && typeof err === 'object') {
    const msg =
      typeof err.message === 'string'
        ? err.message
        : typeof err.code === 'string'
          ? err.code
          : 'unknown_api_error';
    return { points: [], apiError: msg };
  }
  const data = o.data;
  if (!Array.isArray(data)) {
    return { points: [] };
  }

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  /** Last row wins if API returns duplicate calendar days across pages */
  const byDay = new Map<string, { date: Date; close: number }>();

  for (const row of data as MarketstackEodRow[]) {
    if (typeof row.close !== 'number' || !Number.isFinite(row.close) || !row.date) continue;
    const d = new Date(row.date);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getTime() < startMs || d.getTime() > endMs) continue;
    const dayKey = d.toISOString().split('T')[0];
    byDay.set(dayKey, { date: d, close: row.close });
  }

  const raw = Array.from(byDay.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  let prevClose: number | null = null;
  const points: MarketDataPoint[] = [];
  for (const r of raw) {
    const returns = prevClose !== null ? calculateReturn(prevClose, r.close) : 0;
    points.push({
      symbol,
      date: r.date,
      close: r.close,
      returns,
    });
    prevClose = r.close;
  }

  return { points };
}

/**
 * Fetch daily EOD for one US ETF symbol. Caller ensures symbol is in MARKETSTACK_ETF_FALLBACK_SYMBOLS.
 */
export async function fetchMarketstackEod(
  symbol: string,
  startDate: Date,
  endDate: Date,
  accessKey: string
): Promise<{ data: MarketDataPoint[]; debug: MarketstackFetchDebug }> {
  const guard = evaluateMarketstackFallbackAllowed();
  if (!guard.allowed) {
    return {
      data: [],
      debug: {
        request_display: '(guard blocked — no request sent)',
        http_status: 0,
        outcome: 'guard_blocked',
        guard_reason: guard.denyReason,
      },
    };
  }

  const dateFrom = startDate.toISOString().split('T')[0];
  const dateTo = endDate.toISOString().split('T')[0];

  const mergedRows: MarketstackEodRow[] = [];
  let offset = 0;
  let pagesFetched = 0;
  let lastDisplay = '';
  let lastStatus = 0;

  try {
    for (;;) {
      const params = new URLSearchParams({
        access_key: accessKey,
        symbols: symbol,
        date_from: dateFrom,
        date_to: dateTo,
        limit: String(PAGE_LIMIT),
        offset: String(offset),
        sort: 'ASC',
      });
      lastDisplay = redactedUrl(params);
      const url = `${MARKETSTACK_EOD_URL}?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'ghost-allocator/ghostregime' },
      });
      lastStatus = response.status;
      const text = await response.text();
      const preview = text.slice(0, 500);

      if (!response.ok) {
        return {
          data: [],
          debug: {
            request_display: lastDisplay,
            http_status: response.status,
            outcome: 'http_error',
            body_preview: preview,
            pages_fetched: pagesFetched,
          },
        };
      }

      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        return {
          data: [],
          debug: {
            request_display: lastDisplay,
            http_status: response.status,
            outcome: 'http_error',
            body_preview: preview,
            pages_fetched: pagesFetched,
          },
        };
      }

      const o = json as Record<string, unknown>;
      const err = o.error as Record<string, unknown> | undefined;
      if (err && typeof err === 'object') {
        const apiMessage =
          typeof err.message === 'string'
            ? err.message
            : typeof err.code === 'string'
              ? String(err.code)
              : 'api_error';
        return {
          data: [],
          debug: {
            request_display: lastDisplay,
            http_status: response.status,
            outcome: 'api_error',
            body_preview: preview,
            api_message: apiMessage,
            pages_fetched: pagesFetched,
          },
        };
      }

      const dataArr = o.data;
      const batch = Array.isArray(dataArr) ? (dataArr as MarketstackEodRow[]) : [];
      mergedRows.push(...batch);
      pagesFetched += 1;

      const pag = o.pagination as Record<string, unknown> | undefined;
      const batchLen = batch.length;

      if (batchLen === 0) {
        break;
      }
      // Short page ⇒ no more data. Full page ⇒ may need another request unless API says we're done.
      if (batchLen < PAGE_LIMIT) {
        break;
      }
      const total = typeof pag?.total === 'number' ? (pag.total as number) : null;
      offset += batchLen;
      if (total !== null && offset >= total) {
        break;
      }
      await new Promise((r) => setTimeout(r, PAGINATION_GAP_MS));
    }

    const parsed = parseMarketstackEodBody(symbol, { data: mergedRows }, startDate, endDate);
    if (parsed.apiError) {
      return {
        data: [],
        debug: {
          request_display: lastDisplay,
          http_status: lastStatus,
          outcome: 'api_error',
          body_preview: parsed.apiError,
          api_message: parsed.apiError,
          pages_fetched: pagesFetched,
        },
      };
    }

    if (parsed.points.length === 0) {
      return {
        data: [],
        debug: {
          request_display: lastDisplay,
          http_status: lastStatus,
          outcome: mergedRows.length === 0 ? 'empty_data' : 'zero_parsed_rows',
          pages_fetched: pagesFetched,
        },
      };
    }

    return {
      data: parsed.points,
      debug: {
        request_display: lastDisplay,
        http_status: lastStatus,
        outcome: 'ok',
        pages_fetched: pagesFetched,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      data: [],
      debug: {
        request_display: lastDisplay,
        http_status: 0,
        outcome: 'fetch_threw',
        body_preview: msg,
      },
    };
  }
}
