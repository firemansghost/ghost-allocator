/**
 * Board H.15 Treasury yields adapter — deterministic dual-package fetch / parse / normalize.
 * Display-only; no scoring, curve derivation, breakeven, artifact writes, or workflow wiring.
 *
 * Packages:
 * 1) Official preformatted Treasury Constant Maturities (nominal maturities)
 * 2) Custom single-series package for 30Y inflation-indexed (RIFLGFCY30_XII_N.B)
 *
 * T10YIE / breakeven is intentionally omitted (separate product decision required).
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
  FRB_H15_ADAPTER_ID,
  FRB_H15_ARTIFACT_ID,
  FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS,
  FRB_H15_PARSER_VERSION,
  FRB_H15_REQUIRED_SERIES_UNIQUE_IDS,
  FRB_H15_SOURCE_FAMILY_ID,
  FRB_H15_SOURCE_LOCATOR,
  FRB_H15_SOURCE_NAME,
  FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS,
  FRB_H15_TIPS_30_SERIES_UNIQUE_ID,
  type FrbH15OptionalSeriesUniqueId,
  type FrbH15RegisteredSeriesUniqueId,
} from './frbH15TreasuryYieldsMeta';

export {
  FRB_H15_ADAPTER_ID,
  FRB_H15_ARTIFACT_ID,
  FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS,
  FRB_H15_PARSER_VERSION,
  FRB_H15_REQUIRED_SERIES_UNIQUE_IDS,
  FRB_H15_SOURCE_FAMILY_ID,
  FRB_H15_SOURCE_LOCATOR,
  FRB_H15_SOURCE_NAME,
  FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS,
  FRB_H15_TIPS_30_SERIES_UNIQUE_ID,
} from './frbH15TreasuryYieldsMeta';

/** Board DDP serieslist missing-value sentinel. */
export const FRB_H15_MISSING_VALUE = 'ND' as const;

const PACKAGE_BYTE_SEPARATOR = Uint8Array.of(0x1e);

const REQUIRED_SET = new Set<string>(FRB_H15_REQUIRED_SERIES_UNIQUE_IDS);
const REGISTERED_SET = new Set<string>([
  ...FRB_H15_REQUIRED_SERIES_UNIQUE_IDS,
  ...FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS,
]);

export interface FrbH15ObservationRow {
  seriesUniqueId: FrbH15RegisteredSeriesUniqueId;
  observationAsOf: string;
  valuePct: number;
  sourcePackage: 'tcm' | 'tips30';
  sourceLine: number;
}

export interface FrbH15TreasuryNormalizedFields {
  thirtyYearNominalYieldPct: number;
  thirtyYearTipsRealYieldPct: number;
  twoYearYieldPct?: number;
  fiveYearYieldPct?: number;
  tenYearYieldPct?: number;
}

export interface FrbH15FetchedPackages {
  treasuryConstantMaturitiesCsv: string;
  tips30Csv: string;
}

export interface FrbH15FetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  bytes: Uint8Array;
}

export type FrbH15FetchClient = (url: string) => Promise<FrbH15FetchResponse>;

export interface FrbH15TreasuryYieldsAdapterOptions {
  fetchClient?: FrbH15FetchClient;
}

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

/** Board DDP package hash: MD5 of unique IDs joined by LF (verified against official TCM package). */
export function frbH15PackageSeriesHash(
  seriesUniqueIds: readonly string[]
): string {
  return createHash('md5').update(seriesUniqueIds.join('\n'), 'utf8').digest('hex');
}

export function buildFrbH15PackageOutputUrl(
  seriesUniqueIds: readonly string[]
): string {
  const series = frbH15PackageSeriesHash(seriesUniqueIds);
  const params = new URLSearchParams({
    rel: 'H15',
    series,
    lastObs: '',
    from: '',
    to: '',
    filetype: 'csv',
    label: 'include',
    layout: 'serieslist',
    type: 'package',
  });
  return `https://www.federalreserve.gov/datadownload/Output.aspx?${params.toString()}`;
}

export const FRB_H15_TCM_PACKAGE_OUTPUT_URL = buildFrbH15PackageOutputUrl(
  FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS
);

export const FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL = buildFrbH15PackageOutputUrl([
  FRB_H15_TIPS_30_SERIES_UNIQUE_ID,
]);

function decodeUtf8(bytes: Uint8Array): GhostFlowStageResult<string> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: text, issues: [] };
  } catch {
    return fail(
      'fetch',
      'h15_fetch_invalid_utf8',
      'Board H.15 response is not valid UTF-8'
    );
  }
}

function concatPackageBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.byteLength + PACKAGE_BYTE_SEPARATOR.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(PACKAGE_BYTE_SEPARATOR, a.byteLength);
  out.set(b, a.byteLength + PACKAGE_BYTE_SEPARATOR.byteLength);
  return out;
}

export async function defaultFrbH15FetchClient(
  url: string
): Promise<FrbH15FetchResponse> {
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

function isMetadataLabel(cell: string): boolean {
  const t = cell.trim();
  return (
    t === 'Series Description:' ||
    t === 'Unit:' ||
    t === 'Multiplier:' ||
    t === 'Currency:' ||
    t === 'Series Name:'
  );
}

function parseObservationDate(cell: string): string | null {
  const trimmed = cell.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return isValidCalendarDate(trimmed) ? trimmed : null;
}

function parseYieldCell(cell: string): 'nd' | number | null {
  const trimmed = cell.trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase() === FRB_H15_MISSING_VALUE) return 'nd';
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseSeriesListPackage(
  csvText: string,
  sourcePackage: 'tcm' | 'tips30',
  acceptUniqueIds: ReadonlySet<string>
): GhostFlowStageResult<FrbH15ObservationRow[]> {
  let records: string[][];
  try {
    records = parseCsv(csvText, {
      bom: true,
      trim: true,
      relax_column_count: true,
      skip_empty_lines: true,
    }) as string[][];
  } catch {
    return fail('parse', 'h15_csv_parse_failed', 'Board H.15 CSV could not be parsed');
  }

  if (records.length === 0) {
    return fail('parse', 'h15_csv_empty', 'Board H.15 CSV is empty');
  }

  const rows: FrbH15ObservationRow[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    const sourceLine = i + 1;
    if (record.length < 2) {
      return fail(
        'parse',
        'h15_csv_invalid_row',
        `Board H.15 CSV row ${sourceLine} has too few columns`
      );
    }

    const seriesUniqueId = (record[0] ?? '').trim();
    const second = record[1] ?? '';

    if (!seriesUniqueId.startsWith('H15/H15/')) {
      return fail(
        'parse',
        'h15_csv_invalid_series_id',
        `Board H.15 CSV row ${sourceLine} has an invalid series unique id`
      );
    }

    if (isMetadataLabel(second)) {
      continue;
    }

    if (!acceptUniqueIds.has(seriesUniqueId)) {
      // Preformatted TCM includes unused maturities — ignore deliberately.
      if (sourcePackage === 'tcm') continue;
      return fail(
        'parse',
        'h15_csv_unexpected_series',
        `Board H.15 tips30 package contains unexpected series ${seriesUniqueId}`
      );
    }

    if (record.length < 3) {
      return fail(
        'parse',
        'h15_csv_invalid_row',
        `Board H.15 CSV row ${sourceLine} is missing a value column`
      );
    }

    const observationAsOf = parseObservationDate(second);
    if (!observationAsOf) {
      return fail(
        'parse',
        'h15_csv_invalid_date',
        `Board H.15 CSV row ${sourceLine} has an invalid observation date`
      );
    }

    const parsedValue = parseYieldCell(record[2] ?? '');
    if (parsedValue === null) {
      return fail(
        'parse',
        'h15_csv_invalid_value',
        `Board H.15 CSV row ${sourceLine} has an invalid yield value`
      );
    }
    if (parsedValue === 'nd') {
      continue;
    }

    const key = `${seriesUniqueId}|${observationAsOf}`;
    if (seen.has(key)) {
      return fail(
        'parse',
        'h15_csv_duplicate_observation',
        `Board H.15 CSV has duplicate observation for ${seriesUniqueId} on ${observationAsOf}`
      );
    }
    seen.add(key);

    rows.push({
      seriesUniqueId: seriesUniqueId as FrbH15RegisteredSeriesUniqueId,
      observationAsOf,
      valuePct: parsedValue,
      sourcePackage,
      sourceLine,
    });
  }

  return { ok: true, value: rows, issues: [] };
}

const FIELD_BY_SERIES: Record<
  FrbH15RegisteredSeriesUniqueId,
  keyof FrbH15TreasuryNormalizedFields
> = {
  'H15/H15/RIFLGFCY30_N.B': 'thirtyYearNominalYieldPct',
  'H15/H15/RIFLGFCY30_XII_N.B': 'thirtyYearTipsRealYieldPct',
  'H15/H15/RIFLGFCY02_N.B': 'twoYearYieldPct',
  'H15/H15/RIFLGFCY05_N.B': 'fiveYearYieldPct',
  'H15/H15/RIFLGFCY10_N.B': 'tenYearYieldPct',
};

export function createFrbH15TreasuryYieldsAdapter(
  options: FrbH15TreasuryYieldsAdapterOptions = {}
): GhostFlowSourceAdapter<
  FrbH15FetchedPackages,
  readonly FrbH15ObservationRow[],
  FrbH15TreasuryNormalizedFields
> {
  const fetchClient = options.fetchClient ?? defaultFrbH15FetchClient;

  return {
    id: FRB_H15_ADAPTER_ID,
    parserVersion: FRB_H15_PARSER_VERSION,

    async fetch(
      context: GhostFlowFetchContext
    ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<FrbH15FetchedPackages>>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'fetch',
          'h15_fetch_invalid_now',
          'Fetch context.nowIso must be a valid ISO timestamp'
        );
      }

      async function fetchOne(
        url: string,
        label: string
      ): Promise<GhostFlowStageResult<{ text: string; bytes: Uint8Array; contentType?: string }>> {
        let response: FrbH15FetchResponse;
        try {
          response = await fetchClient(url);
        } catch {
          return fail(
            'fetch',
            'h15_fetch_exception',
            `Board H.15 ${label} fetch failed with an unexpected exception`
          );
        }
        if (!response.ok) {
          return fail(
            'fetch',
            'h15_fetch_http_error',
            `Board H.15 ${label} fetch returned HTTP ${response.status}`
          );
        }
        if (response.bytes.byteLength === 0) {
          return fail(
            'fetch',
            'h15_fetch_empty_body',
            `Board H.15 ${label} fetch returned an empty body`
          );
        }
        const decoded = decodeUtf8(response.bytes);
        if (!decoded.ok) return decoded;
        return {
          ok: true,
          value: {
            text: decoded.value,
            bytes: response.bytes,
            contentType: response.contentType,
          },
          issues: [],
        };
      }

      const tcm = await fetchOne(FRB_H15_TCM_PACKAGE_OUTPUT_URL, 'TCM package');
      if (!tcm.ok) return tcm;
      const tips = await fetchOne(FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL, 'TIPS-30 package');
      if (!tips.ok) return tips;

      return {
        ok: true,
        value: {
          raw: {
            treasuryConstantMaturitiesCsv: tcm.value.text,
            tips30Csv: tips.value.text,
          },
          sourceMetadata: {
            sourceId: FRB_H15_SOURCE_FAMILY_ID,
            sourceLocator: FRB_H15_SOURCE_LOCATOR,
            retrievedAt: context.nowIso,
            contentType: tcm.value.contentType ?? tips.value.contentType,
            contentSha256: sha256Hex(
              concatPackageBytes(tcm.value.bytes, tips.value.bytes)
            ),
          },
        },
        issues: [],
      };
    },

    parse(
      source: GhostFlowFetchedSource<FrbH15FetchedPackages>,
      _context: GhostFlowParseContext
    ): GhostFlowStageResult<GhostFlowParsedSource<readonly FrbH15ObservationRow[]>> {
      const tcm = parseSeriesListPackage(
        source.raw.treasuryConstantMaturitiesCsv,
        'tcm',
        REGISTERED_SET
      );
      if (!tcm.ok) return tcm;

      const tips = parseSeriesListPackage(
        source.raw.tips30Csv,
        'tips30',
        new Set([FRB_H15_TIPS_30_SERIES_UNIQUE_ID])
      );
      if (!tips.ok) return tips;

      if (tips.value.length === 0) {
        return fail(
          'parse',
          'h15_csv_empty',
          'Board H.15 tips30 package produced no numeric observations'
        );
      }

      const requiredPresent = new Set<string>();
      for (const row of [...tcm.value, ...tips.value]) {
        if (REQUIRED_SET.has(row.seriesUniqueId)) {
          requiredPresent.add(row.seriesUniqueId);
        }
      }
      for (const id of FRB_H15_REQUIRED_SERIES_UNIQUE_IDS) {
        if (!requiredPresent.has(id)) {
          return fail(
            'parse',
            'h15_csv_missing_required_series',
            `Board H.15 packages are missing required series ${id}`
          );
        }
      }

      return {
        ok: true,
        value: {
          parsed: [...tcm.value, ...tips.value],
          sourceMetadata: { ...source.sourceMetadata },
        },
        issues: [],
      };
    },

    normalize(
      source: GhostFlowParsedSource<readonly FrbH15ObservationRow[]>,
      context: GhostFlowNormalizeContext
    ): GhostFlowStageResult<GhostFlowNormalizedObservation<FrbH15TreasuryNormalizedFields>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'normalize',
          'h15_normalize_invalid_now',
          'Normalize context.nowIso must be a valid ISO timestamp'
        );
      }

      const nowDate = new Date(context.nowIso).toISOString().slice(0, 10);
      if (!isValidCalendarDate(nowDate)) {
        return fail(
          'normalize',
          'h15_normalize_invalid_now',
          'Normalize context.nowIso must contain a valid UTC calendar date'
        );
      }

      let ceiling = nowDate;
      if (context.referenceAsOf !== undefined) {
        if (!isValidCalendarDate(context.referenceAsOf)) {
          return fail(
            'normalize',
            'h15_normalize_invalid_reference_ceiling',
            'Normalize context.referenceAsOf must be a real YYYY-MM-DD calendar date'
          );
        }
        ceiling =
          context.referenceAsOf < nowDate ? context.referenceAsOf : nowDate;
      }

      for (const row of source.parsed) {
        if (row.observationAsOf > nowDate) {
          return fail(
            'normalize',
            'h15_normalize_future_observation',
            `Board H.15 observation ${row.observationAsOf} is after nowIso UTC date ${nowDate}`
          );
        }
      }

      const bySeriesDate = new Map<string, number>();
      for (const row of source.parsed) {
        if (row.observationAsOf > ceiling) continue;
        bySeriesDate.set(`${row.seriesUniqueId}|${row.observationAsOf}`, row.valuePct);
      }

      const requiredDates: string[][] = FRB_H15_REQUIRED_SERIES_UNIQUE_IDS.map((id) => {
        const dates: string[] = [];
        for (const key of bySeriesDate.keys()) {
          if (key.startsWith(`${id}|`)) {
            dates.push(key.slice(id.length + 1));
          }
        }
        return dates;
      });

      if (requiredDates.some((d) => d.length === 0)) {
        return fail(
          'normalize',
          'h15_normalize_no_eligible_observation',
          `No Board H.15 required-series observation on or before ceiling ${ceiling}`
        );
      }

      const common = new Set(requiredDates[0]!);
      for (let i = 1; i < requiredDates.length; i++) {
        const next = new Set(requiredDates[i]!);
        for (const d of [...common]) {
          if (!next.has(d)) common.delete(d);
        }
      }

      if (common.size === 0) {
        return fail(
          'normalize',
          'h15_normalize_no_common_date',
          'No common Board H.15 observation date across required series'
        );
      }

      let asOf: string | null = null;
      for (const d of common) {
        if (asOf === null || d > asOf) asOf = d;
      }
      if (!asOf) {
        return fail(
          'normalize',
          'h15_normalize_no_common_date',
          'No common Board H.15 observation date across required series'
        );
      }

      const thirtyYearNominalYieldPct = bySeriesDate.get(
        `H15/H15/RIFLGFCY30_N.B|${asOf}`
      );
      const thirtyYearTipsRealYieldPct = bySeriesDate.get(
        `H15/H15/RIFLGFCY30_XII_N.B|${asOf}`
      );
      if (
        thirtyYearNominalYieldPct === undefined ||
        thirtyYearTipsRealYieldPct === undefined
      ) {
        return fail(
          'normalize',
          'h15_normalize_incomplete_required',
          `Required Board H.15 yields incomplete on ${asOf}`
        );
      }

      const fields: FrbH15TreasuryNormalizedFields = {
        thirtyYearNominalYieldPct,
        thirtyYearTipsRealYieldPct,
      };

      for (const id of FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS) {
        const v = bySeriesDate.get(`${id}|${asOf}`);
        if (v === undefined) continue;
        const field = FIELD_BY_SERIES[id as FrbH15OptionalSeriesUniqueId];
        fields[field] = v;
      }

      // Defensive: adapter must never emit breakeven (methodology not approved).
      if ('tenYearBreakevenInflationPct' in (fields as object)) {
        return fail(
          'normalize',
          'h15_normalize_breakeven_forbidden',
          'Board H.15 adapter must not emit tenYearBreakevenInflationPct'
        );
      }

      return {
        ok: true,
        value: {
          artifactId: FRB_H15_ARTIFACT_ID,
          observationAsOf: asOf,
          fields,
          provenance: {
            sourceId: source.sourceMetadata.sourceId,
            sourceLocator: source.sourceMetadata.sourceLocator,
            retrievedAt: source.sourceMetadata.retrievedAt,
            observationAsOf: asOf,
            contentSha256: source.sourceMetadata.contentSha256,
            adapterId: FRB_H15_ADAPTER_ID,
            parserVersion: FRB_H15_PARSER_VERSION,
          },
        },
        issues: [],
      };
    },
  };
}

/** Default adapter instance (live fetch client; not invoked on import). */
export const FRB_H15_TREASURY_YIELDS_ADAPTER = createFrbH15TreasuryYieldsAdapter();

export const FRB_H15_ADAPTER_METADATA = {
  sourceFamilyId: FRB_H15_SOURCE_FAMILY_ID,
  sourceName: FRB_H15_SOURCE_NAME,
  sourceLocator: FRB_H15_SOURCE_LOCATOR,
  adapterId: FRB_H15_ADAPTER_ID,
  parserVersion: FRB_H15_PARSER_VERSION,
  artifactId: FRB_H15_ARTIFACT_ID,
} as const;
