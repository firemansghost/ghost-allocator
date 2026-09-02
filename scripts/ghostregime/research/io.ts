/**
 * Frozen R7B0 snapshot loader. No provider calls. Does not modify the snapshot.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import type { MarketDataPoint } from '../../../lib/ghostregime/types';
import {
  MANIFEST_SHA256,
  REQUIRED_WARNING_POLICY,
  RESEARCH_END,
  RESEARCH_START,
  RETURN_SYMBOLS,
  SIGNAL_SYMBOLS,
  SNAPSHOT_ID,
  VALIDATION_REPORT_SHA256,
} from './study-contract';
import {
  parseUtcDateKey,
  utcWeekday,
  utcWeekdayName,
  type DateKey,
  type ResearchWarning,
  type ReturnObservation,
  type SessionCalendarRow,
  type SignalObservation,
  type VixExtraDate,
} from './types';

export interface SnapshotManifest {
  snapshot_id: string;
  research_start: string;
  research_end: string;
  [key: string]: unknown;
}

export interface LoadedSnapshot {
  root: string;
  snapshotId: string;
  manifestSha256: string;
  validationReportSha256: string;
  manifest: SnapshotManifest;
  calendar: SessionCalendarRow[];
  signalRows: SignalObservation[];
  returnRows: ReturnObservation[];
  signalMarketData: MarketDataPoint[];
  warnings: ResearchWarning[];
  vixExtraDates: VixExtraDate[];
  btcStaleSessions: DateKey[];
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readCsv(path: string): Record<string, string>[] {
  const text = readFileSync(path, 'utf8');
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`NON_FINITE_OR_NON_POSITIVE: ${label} ${value}`);
  }
}

function assertOrderedUnique(dates: DateKey[], label: string): void {
  const seen = new Set<string>();
  let prev: string | null = null;
  for (const date of dates) {
    parseUtcDateKey(date);
    if (seen.has(date)) {
      throw new Error(`DUPLICATE_DATE: ${label} ${date}`);
    }
    if (prev != null && date <= prev) {
      throw new Error(`UNORDERED_DATES: ${label} ${date} after ${prev}`);
    }
    seen.add(date);
    prev = date;
  }
}

function closeToCloseReturns(points: MarketDataPoint[]): MarketDataPoint[] {
  let prev: number | null = null;
  return points.map((point) => {
    const returns = prev != null && prev !== 0 ? (point.close - prev) / prev : 0;
    prev = point.close;
    return { ...point, returns };
  });
}

export function parseHashesFile(text: string): Array<{ hash: string; file: string }> {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([0-9a-f]{64})\s+(.+)$/i);
      if (!match) throw new Error(`MALFORMED_HASH_LINE: ${line}`);
      return { hash: match[1].toLowerCase(), file: match[2].replace(/\\/g, '/') };
    });
}

export function verifySnapshotHashes(root: string): { verified: number; manifestSha256: string; validationReportSha256: string } {
  const hashesPath = join(root, 'HASHES.sha256');
  if (!existsSync(hashesPath)) {
    throw new Error('MISSING_HASHES.sha256');
  }
  const entries = parseHashesFile(readFileSync(hashesPath, 'utf8'));
  for (const entry of entries) {
    const full = join(root, entry.file);
    if (!existsSync(full)) {
      throw new Error(`MISSING_HASHED_FILE: ${entry.file}`);
    }
    const got = sha256File(full);
    if (got !== entry.hash) {
      throw new Error(`HASH_MISMATCH: ${entry.file} expected ${entry.hash} got ${got}`);
    }
  }
  const manifestSha256 = sha256File(join(root, 'MANIFEST.json'));
  const validationReportSha256 = sha256File(join(root, 'VALIDATION_REPORT.md'));
  if (manifestSha256 !== MANIFEST_SHA256) {
    throw new Error(`MANIFEST_SHA_MISMATCH: expected ${MANIFEST_SHA256} got ${manifestSha256}`);
  }
  if (validationReportSha256 !== VALIDATION_REPORT_SHA256) {
    throw new Error(
      `VALIDATION_REPORT_SHA_MISMATCH: expected ${VALIDATION_REPORT_SHA256} got ${validationReportSha256}`
    );
  }
  return { verified: entries.length, manifestSha256, validationReportSha256 };
}

export function loadCalendar(root: string): SessionCalendarRow[] {
  const rows = readCsv(join(root, 'normalized/calendar/xnys_regular_close.csv'));
  const calendar = rows.map((row) => {
    const session = row.session_date;
    parseUtcDateKey(session);
    return {
      session_date: session,
      regular_close_utc: row.regular_close_utc,
      early_close: row.early_close_boolean === 'true',
    };
  });
  assertOrderedUnique(calendar.map((r) => r.session_date), 'calendar');
  return calendar;
}

export function parseSignalCsv(
  symbol: string,
  rows: Record<string, string>[]
): SignalObservation[] {
  if (rows.length === 0) throw new Error(`EMPTY_SIGNAL_FILE: ${symbol}`);
  const header = Object.keys(rows[0]);
  if (header.includes('adjusted_close') && !header.includes('raw_close') && !header.includes('index_level')) {
    throw new Error(`ADJUSTED_SIGNAL_FORBIDDEN: ${symbol}`);
  }

  const out: SignalObservation[] = [];
  for (const row of rows) {
    const dateKey = row.date_key;
    parseUtcDateKey(dateKey);
    const closeRaw = symbol === 'VIX' ? row.index_level : row.raw_close;
    if (closeRaw == null) {
      throw new Error(`MISSING_SIGNAL_VALUE: ${symbol} ${dateKey}`);
    }
    const close = Number(closeRaw);
    assertFinitePositive(close, `${symbol} ${dateKey}`);
    if (symbol === 'VIX' && close <= 0) {
      throw new Error(`NON_POSITIVE_VIX: ${dateKey}`);
    }
    out.push({
      symbol,
      date_key: dateKey,
      close,
      timestamp_utc: row.timestamp_utc,
      source: row.source,
    });
  }
  assertOrderedUnique(out.map((r) => r.date_key), `signal:${symbol}`);
  return out;
}

export function parseReturnEtfCsv(assetId: string, rows: Record<string, string>[]): ReturnObservation[] {
  if (rows.length === 0) throw new Error(`EMPTY_RETURN_FILE: ${assetId}`);
  const header = Object.keys(rows[0]);
  if (!header.includes('adjusted_close')) {
    throw new Error(`RAW_RETURN_FORBIDDEN: ${assetId} missing adjusted_close`);
  }
  const out: ReturnObservation[] = [];
  for (const row of rows) {
    const dateKey = row.date_key;
    parseUtcDateKey(dateKey);
    const adjusted = Number(row.adjusted_close);
    const raw = Number(row.raw_close);
    if (!Number.isFinite(adjusted) || adjusted <= 0) {
      throw new Error(`NON_FINITE_OR_NON_POSITIVE: return ${assetId} ${dateKey}`);
    }
    out.push({
      asset_id: assetId,
      date_key: dateKey,
      performance_close: adjusted,
      raw_close: Number.isFinite(raw) ? raw : undefined,
      source: row.source,
    });
  }
  assertOrderedUnique(out.map((r) => r.date_key), `return:${assetId}`);
  return out;
}

export function parseBtcReturnCsv(rows: Record<string, string>[]): {
  rows: ReturnObservation[];
  warnings: ResearchWarning[];
  staleSessions: DateKey[];
} {
  if (rows.length === 0) throw new Error('EMPTY_RETURN_FILE: BTC-USD');
  const out: ReturnObservation[] = [];
  const warnings: ResearchWarning[] = [];
  const staleSessions: DateKey[] = [];

  for (const row of rows) {
    const dateKey = row.session_date;
    parseUtcDateKey(dateKey);
    const close = Number(row.close);
    assertFinitePositive(close, `BTC-USD ${dateKey}`);
    if (!row.equity_close_utc || !row.btc_candle_end_utc) {
      throw new Error(`MISSING_BTC_SESSION_MAPPING: ${dateKey}`);
    }
    const equityMs = Date.parse(row.equity_close_utc);
    const endMs = Date.parse(row.btc_candle_end_utc);
    if (!Number.isFinite(equityMs) || !Number.isFinite(endMs)) {
      throw new Error(`MALFORMED_BTC_TIMESTAMP: ${dateKey}`);
    }
    if (endMs > equityMs) {
      throw new Error(`BTC_POST_CLOSE_LEAK: ${dateKey}`);
    }
    const staleHours = (equityMs - endMs) / 3_600_000;
    const stale = staleHours > 0;
    if (stale) {
      staleSessions.push(dateKey);
      warnings.push({
        code: 'BTC_STALE_MARK',
        message: `BTC mark is ${staleHours}h early vs equity close`,
        date: dateKey,
      });
      if (
        dateKey !== REQUIRED_WARNING_POLICY.btc_stale_session_date &&
        staleHours > 1
      ) {
        throw new Error(`UNEXPECTED_BTC_STALE_MARK: ${dateKey} lagH=${staleHours}`);
      }
    }
    out.push({
      asset_id: 'BTC-USD',
      date_key: dateKey,
      performance_close: close,
      source: row.source,
      btc_candle_start_utc: row.btc_candle_start_utc,
      btc_candle_end_utc: row.btc_candle_end_utc,
      equity_close_utc: row.equity_close_utc,
      stale_hours: stale ? staleHours : 0,
      post_close_leak: false,
    });
  }
  assertOrderedUnique(out.map((r) => r.date_key), 'return:BTC-USD');
  return { rows: out, warnings, staleSessions };
}

export function auditVixExtraDates(
  vixDates: DateKey[],
  xnysDates: DateKey[]
): { extras: VixExtraDate[]; warnings: ResearchWarning[] } {
  const xnys = new Set(xnysDates);
  const extras: VixExtraDate[] = [];
  for (const date of vixDates) {
    if (xnys.has(date)) continue;
    const weekend = utcWeekday(date) === 0 || utcWeekday(date) === 6;
    extras.push({
      date,
      weekday: utcWeekdayName(date),
      classification: weekend ? 'weekend' : 'non_xnys_weekday',
    });
  }
  const weekend = extras.filter((e) => e.classification === 'weekend');
  if (weekend.length > 0) {
    throw new Error(`UNEXPECTED_WEEKEND_VIX: ${weekend.map((e) => e.date).join(',')}`);
  }
  return {
    extras,
    warnings: extras.length
      ? [
          {
            code: 'VIX_EXTRA_DATES',
            message: `${extras.length} VIX observations fall outside the XNYS session calendar and are preserved as source observations`,
          },
        ]
      : [],
  };
}

export function signalRowsToMarketData(rows: SignalObservation[]): MarketDataPoint[] {
  const bySymbol = new Map<string, SignalObservation[]>();
  for (const row of rows) {
    const list = bySymbol.get(row.symbol) ?? [];
    list.push(row);
    bySymbol.set(row.symbol, list);
  }
  const out: MarketDataPoint[] = [];
  for (const [symbol, list] of bySymbol) {
    const points = closeToCloseReturns(
      list.map((row) => ({
        symbol,
        date: parseUtcDateKey(row.date_key),
        close: row.close,
      }))
    );
    out.push(...points);
  }
  return out;
}

function rejectRawBilAsPrimary(rows: ReturnObservation[]): void {
  const bil = rows.filter((r) => r.asset_id === 'BIL');
  if (bil.length < 2) return;
  const first = bil[0];
  const last = bil[bil.length - 1];
  if (first.raw_close == null || last.raw_close == null || first.raw_close === 0) {
    throw new Error('RAW_BIL_VALIDATION_UNAVAILABLE');
  }
  const rawCum = last.raw_close / first.raw_close - 1;
  const adjCum = last.performance_close / first.performance_close - 1;
  if (Math.abs(adjCum - rawCum) < 0.01) {
    throw new Error('RAW_BIL_LOOKS_LIKE_PRIMARY_SERIES');
  }
}

export function loadResearchSnapshot(root: string): LoadedSnapshot {
  const warnings: ResearchWarning[] = [];
  const hashes = verifySnapshotHashes(root);
  const manifest = JSON.parse(readFileSync(join(root, 'MANIFEST.json'), 'utf8')) as SnapshotManifest;
  if (manifest.snapshot_id !== SNAPSHOT_ID) {
    throw new Error(`SNAPSHOT_ID_MISMATCH: expected ${SNAPSHOT_ID} got ${manifest.snapshot_id}`);
  }
  if (manifest.research_start !== RESEARCH_START || manifest.research_end !== RESEARCH_END) {
    throw new Error('RESEARCH_WINDOW_MISMATCH');
  }

  const calendar = loadCalendar(root);
  const xnys = calendar.map((r) => r.session_date);

  const signalRows: SignalObservation[] = [];
  for (const symbol of SIGNAL_SYMBOLS) {
    const file = join(root, 'normalized/signal', `${symbol}.csv`);
    if (!existsSync(file)) throw new Error(`MISSING_SIGNAL_FILE: ${symbol}`);
    signalRows.push(...parseSignalCsv(symbol, readCsv(file)));
  }

  const returnRows: ReturnObservation[] = [];
  for (const symbol of RETURN_SYMBOLS) {
    const file = join(root, 'normalized/return', `${symbol}.csv`);
    if (!existsSync(file)) throw new Error(`MISSING_RETURN_FILE: ${symbol}`);
    if (symbol === 'BTC-USD') {
      const parsed = parseBtcReturnCsv(readCsv(file));
      returnRows.push(...parsed.rows);
      warnings.push(...parsed.warnings);
      if (
        parsed.staleSessions.length !== REQUIRED_WARNING_POLICY.btc_stale_session_count ||
        parsed.staleSessions[0] !== REQUIRED_WARNING_POLICY.btc_stale_session_date
      ) {
        throw new Error(
          `BTC_STALE_CONTRACT_MISMATCH: expected ${REQUIRED_WARNING_POLICY.btc_stale_session_date} only`
        );
      }
    } else {
      returnRows.push(...parseReturnEtfCsv(symbol, readCsv(file)));
    }
  }
  rejectRawBilAsPrimary(returnRows);

  const vixDates = signalRows.filter((r) => r.symbol === 'VIX').map((r) => r.date_key);
  const vixAudit = auditVixExtraDates(vixDates, xnys);
  warnings.push(...vixAudit.warnings);

  const spySignal = signalRows.filter((r) => r.symbol === 'SPY').map((r) => r.date_key);
  if (spySignal.join(',') !== xnys.join(',')) {
    throw new Error('SPY_SIGNAL_XNYS_MISMATCH');
  }

  return {
    root,
    snapshotId: manifest.snapshot_id,
    manifestSha256: hashes.manifestSha256,
    validationReportSha256: hashes.validationReportSha256,
    manifest,
    calendar,
    signalRows,
    returnRows,
    signalMarketData: signalRowsToMarketData(signalRows),
    warnings,
    vixExtraDates: vixAudit.extras,
    btcStaleSessions: returnRows
      .filter((r) => r.asset_id === 'BTC-USD' && (r.stale_hours ?? 0) > 0)
      .map((r) => r.date_key),
  };
}

export function eligiblePostCutoverSessions(
  spyDates: DateKey[],
  cutover: DateKey,
  end: DateKey
): DateKey[] {
  return spyDates.filter((date) => date > cutover && date <= end);
}
