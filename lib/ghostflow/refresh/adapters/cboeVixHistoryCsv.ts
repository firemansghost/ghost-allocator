/**
 * CBOE VIX History CSV adapter — deterministic fetch / parse / normalize.
 * Read-only; no scoring, artifact writes, or reference-date selection.
 */

import { createHash } from 'crypto';
import { parse as parseCsv } from 'csv-parse/sync';
import { isValidCalendarDate, isValidIsoTimestamp } from '../dateValidation';
import type {
  GhostFlowFetchContext,
  GhostFlowFetchedSource,
  GhostFlowNormalizeContext,
  GhostFlowNormalizedObservation,
  GhostFlowParseContext,
  GhostFlowParsedSource,
  GhostFlowRefreshIssue,
  GhostFlowSourceAdapter,
  GhostFlowStageResult,
} from '../types';
import {
  CBOE_VIX_ADAPTER_ID,
  CBOE_VIX_ARTIFACT_ID,
  CBOE_VIX_PARSER_VERSION,
  CBOE_VIX_SOURCE_FAMILY_ID,
  CBOE_VIX_SOURCE_LOCATOR,
  CBOE_VIX_SOURCE_NAME,
} from './cboeVixHistoryCsvMeta';

export {
  CBOE_VIX_ADAPTER_ID,
  CBOE_VIX_ARTIFACT_ID,
  CBOE_VIX_PARSER_VERSION,
  CBOE_VIX_SOURCE_FAMILY_ID,
  CBOE_VIX_SOURCE_LOCATOR,
  CBOE_VIX_SOURCE_NAME,
} from './cboeVixHistoryCsvMeta';

export interface CboeVixHistoryRow {
  observationAsOf: string;
  close: number;
  sourceLine: number;
}

export interface CboeVixNormalizedFields {
  vixClose: number;
}

export interface CboeVixFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  bytes: Uint8Array;
}

export type CboeVixFetchClient = (url: string) => Promise<CboeVixFetchResponse>;

export interface CboeVixHistoryCsvAdapterOptions {
  fetchClient?: CboeVixFetchClient;
}

const REQUIRED_DATE_HEADER = 'DATE';
const REQUIRED_CLOSE_HEADER = 'CLOSE';

function blockIssue(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage, code, severity: 'block', message };
}

function fail(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue(stage, code, message)] };
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function decodeUtf8(bytes: Uint8Array): GhostFlowStageResult<string> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: text, issues: [] };
  } catch {
    return fail('fetch', 'vix_fetch_invalid_utf8', 'CBOE VIX response is not valid UTF-8');
  }
}

/**
 * Convert verified CBOE DATE cell (MM/DD/YYYY) to YYYY-MM-DD via UTC round-trip.
 * Does not use permissive Date.parse on the source cell.
 */
export function parseCboeVixDateCell(cell: string): string | null {
  const trimmed = cell.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidCalendarDate(iso) ? iso : null;
}

export async function defaultCboeVixFetchClient(
  url: string
): Promise<CboeVixFetchResponse> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'text/csv,text/plain;q=0.9,*/*;q=0.1',
    },
    cache: 'no-store',
  });
  const buffer = new Uint8Array(await response.arrayBuffer());
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type') ?? undefined,
    bytes: buffer,
  };
}

export function createCboeVixHistoryCsvAdapter(
  options: CboeVixHistoryCsvAdapterOptions = {}
): GhostFlowSourceAdapter<string, readonly CboeVixHistoryRow[], CboeVixNormalizedFields> {
  const fetchClient = options.fetchClient ?? defaultCboeVixFetchClient;

  return {
    id: CBOE_VIX_ADAPTER_ID,
    parserVersion: CBOE_VIX_PARSER_VERSION,

    async fetch(
      context: GhostFlowFetchContext
    ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<string>>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail('fetch', 'vix_fetch_invalid_now', 'Fetch context.nowIso must be a valid ISO timestamp');
      }

      let response: CboeVixFetchResponse;
      try {
        response = await fetchClient(CBOE_VIX_SOURCE_LOCATOR);
      } catch {
        return fail('fetch', 'vix_fetch_exception', 'CBOE VIX fetch failed with an unexpected exception');
      }

      if (!response.ok) {
        return fail(
          'fetch',
          'vix_fetch_http_error',
          `CBOE VIX fetch returned HTTP ${response.status}`
        );
      }
      if (response.bytes.byteLength === 0) {
        return fail('fetch', 'vix_fetch_empty_body', 'CBOE VIX fetch returned an empty body');
      }

      const decoded = decodeUtf8(response.bytes);
      if (!decoded.ok) {
        return decoded;
      }

      return {
        ok: true,
        value: {
          raw: decoded.value,
          sourceMetadata: {
            sourceId: CBOE_VIX_SOURCE_FAMILY_ID,
            sourceLocator: CBOE_VIX_SOURCE_LOCATOR,
            retrievedAt: context.nowIso,
            contentType: response.contentType,
            contentSha256: sha256Hex(response.bytes),
          },
        },
        issues: [],
      };
    },

    parse(
      source: GhostFlowFetchedSource<string>,
      _context: GhostFlowParseContext
    ): GhostFlowStageResult<GhostFlowParsedSource<readonly CboeVixHistoryRow[]>> {
      let records: string[][];
      try {
        records = parseCsv(source.raw, {
          bom: true,
          trim: true,
          skip_empty_lines: true,
          relax_column_count: false,
        }) as string[][];
      } catch (err) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code: unknown }).code)
            : '';
        if (code === 'CSV_RECORD_INCONSISTENT_FIELDS_LENGTH') {
          return fail(
            'parse',
            'vix_csv_column_count_mismatch',
            'CBOE VIX CSV row has a mismatched column count'
          );
        }
        return fail('parse', 'vix_csv_parse_failed', 'CBOE VIX CSV could not be parsed');
      }

      if (records.length === 0) {
        return fail('parse', 'vix_csv_empty', 'CBOE VIX CSV is empty');
      }

      const header = records[0];
      if (!header || header.length === 0) {
        return fail('parse', 'vix_csv_empty', 'CBOE VIX CSV is missing a header row');
      }

      const headerCounts = new Map<string, number>();
      for (const cell of header) {
        const key = cell.trim().toUpperCase();
        headerCounts.set(key, (headerCounts.get(key) ?? 0) + 1);
      }

      if ((headerCounts.get(REQUIRED_DATE_HEADER) ?? 0) === 0) {
        return fail(
          'parse',
          'vix_csv_missing_required_header',
          'CBOE VIX CSV is missing required DATE header'
        );
      }
      if ((headerCounts.get(REQUIRED_CLOSE_HEADER) ?? 0) === 0) {
        return fail(
          'parse',
          'vix_csv_missing_required_header',
          'CBOE VIX CSV is missing required CLOSE header'
        );
      }
      if ((headerCounts.get(REQUIRED_DATE_HEADER) ?? 0) > 1) {
        return fail(
          'parse',
          'vix_csv_duplicate_header',
          'CBOE VIX CSV has duplicate DATE header'
        );
      }
      if ((headerCounts.get(REQUIRED_CLOSE_HEADER) ?? 0) > 1) {
        return fail(
          'parse',
          'vix_csv_duplicate_header',
          'CBOE VIX CSV has duplicate CLOSE header'
        );
      }

      const dateIndex = header.findIndex((c) => c.trim().toUpperCase() === REQUIRED_DATE_HEADER);
      const closeIndex = header.findIndex(
        (c) => c.trim().toUpperCase() === REQUIRED_CLOSE_HEADER
      );
      const expectedWidth = header.length;

      if (records.length < 2) {
        return fail('parse', 'vix_csv_empty', 'CBOE VIX CSV has a header but no data rows');
      }

      const rows: CboeVixHistoryRow[] = [];
      const seenDates = new Set<string>();

      for (let i = 1; i < records.length; i++) {
        const record = records[i]!;
        const sourceLine = i + 1;

        if (record.length !== expectedWidth) {
          return fail(
            'parse',
            'vix_csv_column_count_mismatch',
            `CBOE VIX CSV row ${sourceLine} has ${record.length} columns; expected ${expectedWidth}`
          );
        }

        const dateCell = record[dateIndex] ?? '';
        const closeCell = record[closeIndex] ?? '';

        const observationAsOf = parseCboeVixDateCell(dateCell);
        if (!observationAsOf) {
          return fail(
            'parse',
            'vix_csv_invalid_date',
            `CBOE VIX CSV row ${sourceLine} has an invalid DATE`
          );
        }

        const closeText = closeCell.trim();
        if (!closeText) {
          return fail(
            'parse',
            'vix_csv_invalid_close',
            `CBOE VIX CSV row ${sourceLine} has an empty CLOSE`
          );
        }
        if (!/^-?\d+(\.\d+)?$/.test(closeText)) {
          return fail(
            'parse',
            'vix_csv_invalid_close',
            `CBOE VIX CSV row ${sourceLine} has a nonnumeric CLOSE`
          );
        }
        const close = Number(closeText);
        if (!Number.isFinite(close) || close <= 0) {
          return fail(
            'parse',
            'vix_csv_invalid_close',
            `CBOE VIX CSV row ${sourceLine} has a nonpositive CLOSE`
          );
        }

        if (seenDates.has(observationAsOf)) {
          return fail(
            'parse',
            'vix_csv_duplicate_date',
            `CBOE VIX CSV has duplicate observation date ${observationAsOf}`
          );
        }
        seenDates.add(observationAsOf);

        rows.push({ observationAsOf, close, sourceLine });
      }

      if (rows.length === 0) {
        return fail('parse', 'vix_csv_empty', 'CBOE VIX CSV produced no valid rows');
      }

      return {
        ok: true,
        value: {
          parsed: rows,
          sourceMetadata: { ...source.sourceMetadata },
        },
        issues: [],
      };
    },

    normalize(
      source: GhostFlowParsedSource<readonly CboeVixHistoryRow[]>,
      context: GhostFlowNormalizeContext
    ): GhostFlowStageResult<GhostFlowNormalizedObservation<CboeVixNormalizedFields>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'normalize',
          'vix_normalize_invalid_now',
          'Normalize context.nowIso must be a valid ISO timestamp'
        );
      }

      // UTC calendar date of the represented instant (not the timestamp's written prefix).
      const nowDate = new Date(context.nowIso).toISOString().slice(0, 10);
      if (!isValidCalendarDate(nowDate)) {
        return fail(
          'normalize',
          'vix_normalize_invalid_now',
          'Normalize context.nowIso must contain a valid UTC calendar date'
        );
      }

      let ceiling = nowDate;
      if (context.referenceAsOf !== undefined) {
        if (!isValidCalendarDate(context.referenceAsOf)) {
          return fail(
            'normalize',
            'vix_normalize_invalid_reference_ceiling',
            'Normalize context.referenceAsOf must be a real YYYY-MM-DD calendar date'
          );
        }
        ceiling =
          context.referenceAsOf < nowDate ? context.referenceAsOf : nowDate;
      }

      if (source.parsed.length === 0) {
        return fail(
          'normalize',
          'vix_normalize_no_eligible_observation',
          'CBOE VIX parse produced no rows to normalize'
        );
      }

      for (const row of source.parsed) {
        if (row.observationAsOf > nowDate) {
          return fail(
            'normalize',
            'vix_normalize_future_observation',
            `CBOE VIX observation ${row.observationAsOf} is after nowIso UTC date ${nowDate}`
          );
        }
      }

      const eligible = source.parsed.filter((row) => row.observationAsOf <= ceiling);
      if (eligible.length === 0) {
        return fail(
          'normalize',
          'vix_normalize_no_eligible_observation',
          `No CBOE VIX observation on or before ceiling ${ceiling}`
        );
      }

      let selected = eligible[0]!;
      for (const row of eligible) {
        if (row.observationAsOf > selected.observationAsOf) {
          selected = row;
        }
      }

      return {
        ok: true,
        value: {
          artifactId: CBOE_VIX_ARTIFACT_ID,
          observationAsOf: selected.observationAsOf,
          fields: {
            vixClose: selected.close,
          },
          provenance: {
            sourceId: source.sourceMetadata.sourceId,
            sourceLocator: source.sourceMetadata.sourceLocator,
            retrievedAt: source.sourceMetadata.retrievedAt,
            observationAsOf: selected.observationAsOf,
            contentSha256: source.sourceMetadata.contentSha256,
            adapterId: CBOE_VIX_ADAPTER_ID,
            parserVersion: CBOE_VIX_PARSER_VERSION,
          },
        },
        issues: [],
      };
    },
  };
}

/** Default adapter instance (live fetch client; not invoked on import). */
export const CBOE_VIX_HISTORY_CSV_ADAPTER = createCboeVixHistoryCsvAdapter();

/** Metadata re-export for registry consumers that must not import the adapter. */
export const CBOE_VIX_ADAPTER_METADATA = {
  sourceFamilyId: CBOE_VIX_SOURCE_FAMILY_ID,
  sourceName: CBOE_VIX_SOURCE_NAME,
  sourceLocator: CBOE_VIX_SOURCE_LOCATOR,
  adapterId: CBOE_VIX_ADAPTER_ID,
  parserVersion: CBOE_VIX_PARSER_VERSION,
  artifactId: CBOE_VIX_ARTIFACT_ID,
} as const;
