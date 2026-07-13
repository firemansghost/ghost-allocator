/**
 * CFTC TFF systematic Socrata adapter — deterministic fetch / parse / normalize.
 * Read-only; no basket, pressure score, artifact writes, or score-input replacement.
 */

import { createHash } from 'crypto';
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
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_REGISTERED_CONTRACT_CODES,
  CFTC_TFF_SCORE_CONTRACT_CODES,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SOURCE_NAME,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
  CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE,
  type CftcTffRegisteredContractCode,
} from './cftcTffSocrataMeta';
import {
  buildCftcTffSystematicResourceQueryUrl,
  CFTC_TFF_FUTONLY_VALUE,
  CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS,
} from './cftcTffSocrataSource';

export {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_RESOURCE_ENDPOINT,
  CFTC_TFF_SCORE_CONTRACT_CODES,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SOURCE_NAME,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
  CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE,
} from './cftcTffSocrataMeta';

export { buildCftcTffSystematicResourceQueryUrl } from './cftcTffSocrataSource';

export interface CftcTffParsedRow {
  reportDate: string;
  reportWeek: string;
  contractMarketName: string;
  cftcContractMarketCode: CftcTffRegisteredContractCode;
  openInterestAll: number;
  leveragedFundsLong: number;
  leveragedFundsShort: number;
  leveragedFundsSpread: number;
  changeLong: number;
  changeShort: number;
  changeSpread: number;
  pctOiLong: number;
  pctOiShort: number;
  pctOiSpread: number;
  sourceIndex: number;
}

export interface CftcTffNormalizedContract {
  cftcContractMarketCode: string;
  contractMarketName: string;
  observations: {
    reportDate: string;
    reportWeek: string;
    openInterestAll: number;
    leveragedFundsLong: number;
    leveragedFundsShort: number;
    leveragedFundsSpread: number;
    changeLong: number;
    changeShort: number;
    changeSpread: number;
    pctOiLong: number;
    pctOiShort: number;
    pctOiSpread: number;
  };
}

export interface CftcTffSystematicNormalizedFields {
  datasetId: typeof CFTC_TFF_DATASET_ID;
  scoreContracts: readonly CftcTffNormalizedContract[];
  vixContext: CftcTffNormalizedContract;
}

export interface CftcTffFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  bytes: Uint8Array;
}

export type CftcTffFetchClient = (url: string) => Promise<CftcTffFetchResponse>;

export interface CftcTffSystematicSocrataAdapterOptions {
  fetchClient?: CftcTffFetchClient;
}

const REGISTERED_CODE_SET = new Set<string>(CFTC_TFF_REGISTERED_CONTRACT_CODES);

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
    return fail(
      'fetch',
      'cftc_tff_fetch_invalid_utf8',
      'CFTC TFF response is not valid UTF-8'
    );
  }
}

function isJsonContentType(contentType: string | undefined): boolean {
  if (contentType === undefined || contentType.trim() === '') return true;
  const primary = contentType.split(';')[0]!.trim().toLowerCase();
  return primary === 'application/json' || primary === 'text/json';
}

/**
 * Convert observed Socrata report_date_as_yyyy_mm_dd to YYYY-MM-DD.
 * Official sample shape: `YYYY-MM-DDTHH:mm:ss.sss` (no Z). Also accepts plain YYYY-MM-DD.
 * Does not use permissive Date.parse on an unverified cell.
 */
export function parseCftcTffReportDateCell(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const match =
    /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(
      trimmed
    );
  if (!match) return null;
  const iso = match[1]!;
  return isValidCalendarDate(iso) ? iso : null;
}

function cellAsTrimmedString(raw: unknown): string | null {
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return null;
}

function parseIntegerCell(
  raw: unknown,
  opts: { allowNegative: boolean; requirePositive: boolean }
): number | null {
  const text = cellAsTrimmedString(raw);
  if (text === null || text === '') return null;
  if (opts.allowNegative) {
    if (!/^-?\d+$/.test(text)) return null;
  } else if (!/^\d+$/.test(text)) {
    return null;
  }
  const n = Number(text);
  if (!Number.isInteger(n) || !Number.isFinite(n)) return null;
  if (opts.requirePositive && n <= 0) return null;
  if (!opts.allowNegative && n < 0) return null;
  return n;
}

function parsePercentCell(raw: unknown): number | null {
  const text = cellAsTrimmedString(raw);
  if (text === null || text === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNormalizedContract(row: CftcTffParsedRow): CftcTffNormalizedContract {
  return {
    cftcContractMarketCode: row.cftcContractMarketCode,
    contractMarketName: row.contractMarketName,
    observations: {
      reportDate: row.reportDate,
      reportWeek: row.reportWeek,
      openInterestAll: row.openInterestAll,
      leveragedFundsLong: row.leveragedFundsLong,
      leveragedFundsShort: row.leveragedFundsShort,
      leveragedFundsSpread: row.leveragedFundsSpread,
      changeLong: row.changeLong,
      changeShort: row.changeShort,
      changeSpread: row.changeSpread,
      pctOiLong: row.pctOiLong,
      pctOiShort: row.pctOiShort,
      pctOiSpread: row.pctOiSpread,
    },
  };
}

export async function defaultCftcTffFetchClient(
  url: string
): Promise<CftcTffFetchResponse> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
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

export function createCftcTffSystematicSocrataAdapter(
  options: CftcTffSystematicSocrataAdapterOptions = {}
): GhostFlowSourceAdapter<
  string,
  readonly CftcTffParsedRow[],
  CftcTffSystematicNormalizedFields
> {
  const fetchClient = options.fetchClient ?? defaultCftcTffFetchClient;

  return {
    id: CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
    parserVersion: CFTC_TFF_SYSTEMATIC_PARSER_VERSION,

    async fetch(
      context: GhostFlowFetchContext
    ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<string>>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'fetch',
          'cftc_tff_fetch_invalid_now',
          'Fetch context.nowIso must be a valid ISO timestamp'
        );
      }

      const sourceLocator = buildCftcTffSystematicResourceQueryUrl();

      let response: CftcTffFetchResponse;
      try {
        response = await fetchClient(sourceLocator);
      } catch {
        return fail(
          'fetch',
          'cftc_tff_fetch_exception',
          'CFTC TFF fetch failed with an unexpected exception'
        );
      }

      if (!response.ok) {
        return fail(
          'fetch',
          'cftc_tff_fetch_http_error',
          `CFTC TFF fetch returned HTTP ${response.status}`
        );
      }
      if (response.bytes.byteLength === 0) {
        return fail(
          'fetch',
          'cftc_tff_fetch_empty_body',
          'CFTC TFF fetch returned an empty body'
        );
      }
      if (!isJsonContentType(response.contentType)) {
        return fail(
          'fetch',
          'cftc_tff_fetch_invalid_content_type',
          'CFTC TFF fetch returned a non-JSON content type'
        );
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
            sourceId: CFTC_TFF_SOURCE_FAMILY_ID,
            sourceLocator,
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
    ): GhostFlowStageResult<GhostFlowParsedSource<readonly CftcTffParsedRow[]>> {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(source.raw);
      } catch {
        return fail(
          'parse',
          'cftc_tff_json_parse_failed',
          'CFTC TFF JSON could not be parsed'
        );
      }

      if (!Array.isArray(parsedJson)) {
        return fail(
          'parse',
          'cftc_tff_json_not_array',
          'CFTC TFF JSON root must be an array'
        );
      }
      if (parsedJson.length === 0) {
        return fail('parse', 'cftc_tff_json_empty', 'CFTC TFF JSON array is empty');
      }

      const rows: CftcTffParsedRow[] = [];
      const seenPairs = new Set<string>();

      for (let i = 0; i < parsedJson.length; i++) {
        const record = parsedJson[i];
        if (!isPlainObject(record)) {
          return fail(
            'parse',
            'cftc_tff_row_not_object',
            `CFTC TFF row ${i} is not a plain object`
          );
        }

        for (const field of CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS) {
          if (!(field in record) || record[field] === null || record[field] === undefined) {
            return fail(
              'parse',
              'cftc_tff_missing_field',
              `CFTC TFF row ${i} is missing required field ${field}`
            );
          }
        }

        const reportDate = parseCftcTffReportDateCell(record.report_date_as_yyyy_mm_dd);
        if (!reportDate) {
          return fail(
            'parse',
            'cftc_tff_invalid_report_date',
            `CFTC TFF row ${i} has an invalid report date`
          );
        }

        const reportWeek = cellAsTrimmedString(record.yyyy_report_week_ww);
        if (!reportWeek) {
          return fail(
            'parse',
            'cftc_tff_invalid_report_week',
            `CFTC TFF row ${i} has an invalid report week`
          );
        }

        const contractMarketName = cellAsTrimmedString(record.contract_market_name);
        if (!contractMarketName) {
          return fail(
            'parse',
            'cftc_tff_invalid_contract_name',
            `CFTC TFF row ${i} has an invalid contract market name`
          );
        }

        const codeRaw = cellAsTrimmedString(record.cftc_contract_market_code);
        if (!codeRaw || !REGISTERED_CODE_SET.has(codeRaw)) {
          return fail(
            'parse',
            'cftc_tff_unexpected_contract_code',
            `CFTC TFF row ${i} has an unexpected contract market code`
          );
        }
        const cftcContractMarketCode = codeRaw as CftcTffRegisteredContractCode;

        const futOnly = cellAsTrimmedString(record.futonly_or_combined);
        if (futOnly !== CFTC_TFF_FUTONLY_VALUE) {
          return fail(
            'parse',
            'cftc_tff_wrong_report_type',
            `CFTC TFF row ${i} is not FutOnly`
          );
        }

        const openInterestAll = parseIntegerCell(record.open_interest_all, {
          allowNegative: false,
          requirePositive: true,
        });
        const leveragedFundsLong = parseIntegerCell(record.lev_money_positions_long, {
          allowNegative: false,
          requirePositive: false,
        });
        const leveragedFundsShort = parseIntegerCell(record.lev_money_positions_short, {
          allowNegative: false,
          requirePositive: false,
        });
        const leveragedFundsSpread = parseIntegerCell(record.lev_money_positions_spread, {
          allowNegative: false,
          requirePositive: false,
        });
        const changeLong = parseIntegerCell(record.change_in_lev_money_long, {
          allowNegative: true,
          requirePositive: false,
        });
        const changeShort = parseIntegerCell(record.change_in_lev_money_short, {
          allowNegative: true,
          requirePositive: false,
        });
        const changeSpread = parseIntegerCell(record.change_in_lev_money_spread, {
          allowNegative: true,
          requirePositive: false,
        });
        const pctOiLong = parsePercentCell(record.pct_of_oi_lev_money_long);
        const pctOiShort = parsePercentCell(record.pct_of_oi_lev_money_short);
        const pctOiSpread = parsePercentCell(record.pct_of_oi_lev_money_spread);

        if (
          openInterestAll === null ||
          leveragedFundsLong === null ||
          leveragedFundsShort === null ||
          leveragedFundsSpread === null ||
          changeLong === null ||
          changeShort === null ||
          changeSpread === null ||
          pctOiLong === null ||
          pctOiShort === null ||
          pctOiSpread === null
        ) {
          return fail(
            'parse',
            'cftc_tff_invalid_numeric_field',
            `CFTC TFF row ${i} has an invalid numeric field`
          );
        }

        const pairKey = `${cftcContractMarketCode}|${reportDate}`;
        if (seenPairs.has(pairKey)) {
          return fail(
            'parse',
            'cftc_tff_duplicate_contract_date',
            `CFTC TFF has duplicate contract/date ${pairKey}`
          );
        }
        seenPairs.add(pairKey);

        rows.push({
          reportDate,
          reportWeek,
          contractMarketName,
          cftcContractMarketCode,
          openInterestAll,
          leveragedFundsLong,
          leveragedFundsShort,
          leveragedFundsSpread,
          changeLong,
          changeShort,
          changeSpread,
          pctOiLong,
          pctOiShort,
          pctOiSpread,
          sourceIndex: i,
        });
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
      source: GhostFlowParsedSource<readonly CftcTffParsedRow[]>,
      context: GhostFlowNormalizeContext
    ): GhostFlowStageResult<
      GhostFlowNormalizedObservation<CftcTffSystematicNormalizedFields>
    > {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'normalize',
          'cftc_tff_normalize_invalid_now',
          'Normalize context.nowIso must be a valid ISO timestamp'
        );
      }

      const nowDate = new Date(context.nowIso).toISOString().slice(0, 10);
      if (!isValidCalendarDate(nowDate)) {
        return fail(
          'normalize',
          'cftc_tff_normalize_invalid_now',
          'Normalize context.nowIso must contain a valid UTC calendar date'
        );
      }

      let ceiling = nowDate;
      if (context.referenceAsOf !== undefined) {
        if (!isValidCalendarDate(context.referenceAsOf)) {
          return fail(
            'normalize',
            'cftc_tff_normalize_invalid_reference_ceiling',
            'Normalize context.referenceAsOf must be a real YYYY-MM-DD calendar date'
          );
        }
        ceiling =
          context.referenceAsOf < nowDate ? context.referenceAsOf : nowDate;
      }

      if (source.parsed.length === 0) {
        return fail(
          'normalize',
          'cftc_tff_normalize_no_eligible_report',
          'CFTC TFF parse produced no rows to normalize'
        );
      }

      for (const row of source.parsed) {
        if (row.reportDate > nowDate) {
          return fail(
            'normalize',
            'cftc_tff_normalize_future_observation',
            `CFTC TFF observation ${row.reportDate} is after nowIso UTC date ${nowDate}`
          );
        }
      }

      const eligible = source.parsed.filter((row) => row.reportDate <= ceiling);
      if (eligible.length === 0) {
        return fail(
          'normalize',
          'cftc_tff_normalize_no_eligible_report',
          `No CFTC TFF observation on or before ceiling ${ceiling}`
        );
      }

      let latestDate = eligible[0]!.reportDate;
      for (const row of eligible) {
        if (row.reportDate > latestDate) {
          latestDate = row.reportDate;
        }
      }

      const latestRows = eligible.filter((row) => row.reportDate === latestDate);
      const byCode = new Map<string, CftcTffParsedRow>();
      for (const row of latestRows) {
        if (byCode.has(row.cftcContractMarketCode)) {
          return fail(
            'normalize',
            'cftc_tff_normalize_duplicate_latest_contract',
            `CFTC TFF latest report ${latestDate} has duplicate code ${row.cftcContractMarketCode}`
          );
        }
        byCode.set(row.cftcContractMarketCode, row);
      }

      for (const code of CFTC_TFF_REGISTERED_CONTRACT_CODES) {
        if (!byCode.has(code)) {
          return fail(
            'normalize',
            'cftc_tff_normalize_incomplete_latest_report',
            `CFTC TFF latest eligible report ${latestDate} is missing contract ${code}`
          );
        }
      }

      const weekSet = new Set(
        CFTC_TFF_REGISTERED_CONTRACT_CODES.map((code) => byCode.get(code)!.reportWeek)
      );
      if (weekSet.size !== 1) {
        return fail(
          'normalize',
          'cftc_tff_normalize_report_week_mismatch',
          `CFTC TFF latest report ${latestDate} has mismatched report weeks`
        );
      }

      const scoreContracts = CFTC_TFF_SCORE_CONTRACT_CODES.map((code) =>
        toNormalizedContract(byCode.get(code)!)
      );
      const vixContext = toNormalizedContract(
        byCode.get(CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE)!
      );

      return {
        ok: true,
        value: {
          artifactId: CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
          observationAsOf: latestDate,
          fields: {
            datasetId: CFTC_TFF_DATASET_ID,
            scoreContracts,
            vixContext,
          },
          provenance: {
            sourceId: source.sourceMetadata.sourceId,
            sourceLocator: source.sourceMetadata.sourceLocator,
            retrievedAt: source.sourceMetadata.retrievedAt,
            observationAsOf: latestDate,
            contentSha256: source.sourceMetadata.contentSha256,
            adapterId: CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
            parserVersion: CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
          },
        },
        issues: [],
      };
    },
  };
}

/** Default adapter instance (live fetch client; not invoked on import). */
export const CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER =
  createCftcTffSystematicSocrataAdapter();

/** Metadata envelope for registry consumers that must not import the adapter. */
export const CFTC_TFF_SYSTEMATIC_ADAPTER_METADATA = {
  sourceFamilyId: CFTC_TFF_SOURCE_FAMILY_ID,
  sourceName: CFTC_TFF_SOURCE_NAME,
  sourceLocator: CFTC_TFF_DATASET_PAGE_LOCATOR,
  adapterId: CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  parserVersion: CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
  artifactId: CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
} as const;
