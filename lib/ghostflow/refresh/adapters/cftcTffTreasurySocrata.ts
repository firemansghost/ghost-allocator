/**
 * CFTC TFF Treasury Socrata adapter — deterministic fetch / parse / normalize.
 * Raw source observations only; no net/gross/direction/basket/score.
 * Uses shared CFTC Socrata core — does not import the systematic adapter.
 */

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
  cftcTffCellAsTrimmedString,
  cftcTffSha256Hex,
  decodeCftcTffUtf8,
  defaultCftcTffFetchClient,
  isCftcTffJsonContentType,
  isCftcTffPlainObject,
  parseCftcTffIntegerCell,
  parseCftcTffPercentCell,
  parseCftcTffReportDateCell,
  type CftcTffFetchClient,
  type CftcTffFetchResponse,
} from './cftcTffSocrataCore';
import { CFTC_TFF_DATASET_ID, CFTC_TFF_SOURCE_FAMILY_ID } from './cftcTffSocrataMeta';
import {
  buildCftcTffTreasuryResourceQueryUrl,
  CFTC_TFF_FUTONLY_VALUE,
  CFTC_TFF_TREASURY_SELECTED_FIELDS,
} from './cftcTffSocrataSource';
import {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_ARTIFACT_ID,
  CFTC_TFF_TREASURY_CORE_CONTRACT_CODES,
  CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES,
  CFTC_TFF_TREASURY_PARSER_VERSION,
  CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES,
  type CftcTffTreasuryRegisteredContractCode,
} from './cftcTffTreasurySocrataMeta';

export {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_ARTIFACT_ID,
  CFTC_TFF_TREASURY_CORE_CONTRACT_CODES,
  CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES,
  CFTC_TFF_TREASURY_PARSER_VERSION,
  CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES,
  CFTC_TFF_TREASURY_SOURCE_LOCATOR,
  CFTC_TFF_TREASURY_SOURCE_NAME,
} from './cftcTffTreasurySocrataMeta';

export { buildCftcTffTreasuryResourceQueryUrl } from './cftcTffSocrataSource';

export interface CftcTffTreasuryParsedRow {
  reportDate: string;
  reportWeek: string;
  contractMarketName: string;
  cftcContractMarketCode: CftcTffTreasuryRegisteredContractCode;
  commodityName: string;
  marketAndExchangeNames: string;
  openInterestAll: number;
  leveragedFundsLong: number;
  leveragedFundsShort: number;
  leveragedFundsSpread: number;
  changeLeveragedFundsLong: number;
  changeLeveragedFundsShort: number;
  changeLeveragedFundsSpread: number;
  pctOiLeveragedFundsLong: number;
  pctOiLeveragedFundsShort: number;
  pctOiLeveragedFundsSpread: number;
  assetManagerLong: number;
  assetManagerShort: number;
  assetManagerSpread: number;
  changeAssetManagerLong: number;
  changeAssetManagerShort: number;
  changeAssetManagerSpread: number;
  pctOiAssetManagerLong: number;
  pctOiAssetManagerShort: number;
  pctOiAssetManagerSpread: number;
  sourceIndex: number;
}

export interface CftcTffTreasuryNormalizedContract {
  cftcContractMarketCode: string;
  contractMarketName: string;
  commodityName: string;
  marketAndExchangeNames: string;
  observations: {
    reportDate: string;
    reportWeek: string;
    openInterestAll: number;
    leveragedFundsLong: number;
    leveragedFundsShort: number;
    leveragedFundsSpread: number;
    changeLeveragedFundsLong: number;
    changeLeveragedFundsShort: number;
    changeLeveragedFundsSpread: number;
    pctOiLeveragedFundsLong: number;
    pctOiLeveragedFundsShort: number;
    pctOiLeveragedFundsSpread: number;
    assetManagerLong: number;
    assetManagerShort: number;
    assetManagerSpread: number;
    changeAssetManagerLong: number;
    changeAssetManagerShort: number;
    changeAssetManagerSpread: number;
    pctOiAssetManagerLong: number;
    pctOiAssetManagerShort: number;
    pctOiAssetManagerSpread: number;
  };
}

export interface CftcTffTreasuryNormalizedFields {
  datasetId: typeof CFTC_TFF_DATASET_ID;
  coreContracts: readonly CftcTffTreasuryNormalizedContract[];
  optionalContextContracts: readonly CftcTffTreasuryNormalizedContract[];
}

export interface CftcTffTreasurySocrataAdapterOptions {
  fetchClient?: CftcTffFetchClient;
}

const REGISTERED_CODE_SET = new Set<string>(
  CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES
);
const OPTIONAL_CODE_SET = new Set<string>(
  CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES
);

function blockIssue(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage, code, severity: 'block', message };
}

function reviewIssue(
  stage: 'normalize',
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage, code, severity: 'review', message };
}

function fail(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue(stage, code, message)] };
}

function toNormalizedContract(
  row: CftcTffTreasuryParsedRow
): CftcTffTreasuryNormalizedContract {
  return {
    cftcContractMarketCode: row.cftcContractMarketCode,
    contractMarketName: row.contractMarketName,
    commodityName: row.commodityName,
    marketAndExchangeNames: row.marketAndExchangeNames,
    observations: {
      reportDate: row.reportDate,
      reportWeek: row.reportWeek,
      openInterestAll: row.openInterestAll,
      leveragedFundsLong: row.leveragedFundsLong,
      leveragedFundsShort: row.leveragedFundsShort,
      leveragedFundsSpread: row.leveragedFundsSpread,
      changeLeveragedFundsLong: row.changeLeveragedFundsLong,
      changeLeveragedFundsShort: row.changeLeveragedFundsShort,
      changeLeveragedFundsSpread: row.changeLeveragedFundsSpread,
      pctOiLeveragedFundsLong: row.pctOiLeveragedFundsLong,
      pctOiLeveragedFundsShort: row.pctOiLeveragedFundsShort,
      pctOiLeveragedFundsSpread: row.pctOiLeveragedFundsSpread,
      assetManagerLong: row.assetManagerLong,
      assetManagerShort: row.assetManagerShort,
      assetManagerSpread: row.assetManagerSpread,
      changeAssetManagerLong: row.changeAssetManagerLong,
      changeAssetManagerShort: row.changeAssetManagerShort,
      changeAssetManagerSpread: row.changeAssetManagerSpread,
      pctOiAssetManagerLong: row.pctOiAssetManagerLong,
      pctOiAssetManagerShort: row.pctOiAssetManagerShort,
      pctOiAssetManagerSpread: row.pctOiAssetManagerSpread,
    },
  };
}

export function createCftcTffTreasurySocrataAdapter(
  options: CftcTffTreasurySocrataAdapterOptions = {}
): GhostFlowSourceAdapter<
  string,
  readonly CftcTffTreasuryParsedRow[],
  CftcTffTreasuryNormalizedFields
> {
  const fetchClient = options.fetchClient ?? defaultCftcTffFetchClient;

  return {
    id: CFTC_TFF_TREASURY_ADAPTER_ID,
    parserVersion: CFTC_TFF_TREASURY_PARSER_VERSION,

    async fetch(
      context: GhostFlowFetchContext
    ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<string>>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_invalid_now',
          'Fetch context.nowIso must be a valid ISO timestamp'
        );
      }

      const sourceLocator = buildCftcTffTreasuryResourceQueryUrl();

      let response: CftcTffFetchResponse;
      try {
        response = await fetchClient(sourceLocator);
      } catch {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_exception',
          'CFTC TFF Treasury fetch failed with an unexpected exception'
        );
      }

      if (!response.ok) {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_http_error',
          `CFTC TFF Treasury fetch returned HTTP ${response.status}`
        );
      }
      if (response.bytes.byteLength === 0) {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_empty_body',
          'CFTC TFF Treasury fetch returned an empty body'
        );
      }
      if (!isCftcTffJsonContentType(response.contentType)) {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_invalid_content_type',
          'CFTC TFF Treasury fetch returned a non-JSON content type'
        );
      }

      const decoded = decodeCftcTffUtf8(response.bytes);
      if (decoded === null) {
        return fail(
          'fetch',
          'cftc_tff_treasury_fetch_invalid_utf8',
          'CFTC TFF Treasury response is not valid UTF-8'
        );
      }

      return {
        ok: true,
        value: {
          raw: decoded,
          sourceMetadata: {
            sourceId: CFTC_TFF_SOURCE_FAMILY_ID,
            sourceLocator,
            retrievedAt: context.nowIso,
            contentType: response.contentType,
            contentSha256: cftcTffSha256Hex(response.bytes),
          },
        },
        issues: [],
      };
    },

    parse(
      source: GhostFlowFetchedSource<string>,
      _context: GhostFlowParseContext
    ): GhostFlowStageResult<GhostFlowParsedSource<readonly CftcTffTreasuryParsedRow[]>> {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(source.raw);
      } catch {
        return fail(
          'parse',
          'cftc_tff_treasury_json_parse_failed',
          'CFTC TFF Treasury JSON could not be parsed'
        );
      }

      if (!Array.isArray(parsedJson)) {
        return fail(
          'parse',
          'cftc_tff_treasury_json_not_array',
          'CFTC TFF Treasury JSON root must be an array'
        );
      }
      if (parsedJson.length === 0) {
        return fail(
          'parse',
          'cftc_tff_treasury_json_empty',
          'CFTC TFF Treasury JSON array is empty'
        );
      }

      const rows: CftcTffTreasuryParsedRow[] = [];
      const seenPairs = new Set<string>();

      for (let i = 0; i < parsedJson.length; i++) {
        const record = parsedJson[i];
        if (!isCftcTffPlainObject(record)) {
          return fail(
            'parse',
            'cftc_tff_treasury_row_not_object',
            `CFTC TFF Treasury row ${i} is not a plain object`
          );
        }

        for (const field of CFTC_TFF_TREASURY_SELECTED_FIELDS) {
          if (
            !(field in record) ||
            record[field] === null ||
            record[field] === undefined
          ) {
            return fail(
              'parse',
              'cftc_tff_treasury_missing_field',
              `CFTC TFF Treasury row ${i} is missing required field ${field}`
            );
          }
        }

        const reportDate = parseCftcTffReportDateCell(
          record.report_date_as_yyyy_mm_dd
        );
        if (!reportDate) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_report_date',
            `CFTC TFF Treasury row ${i} has an invalid report date`
          );
        }

        const reportWeek = cftcTffCellAsTrimmedString(record.yyyy_report_week_ww);
        if (!reportWeek) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_report_week',
            `CFTC TFF Treasury row ${i} has an invalid report week`
          );
        }

        const contractMarketName = cftcTffCellAsTrimmedString(
          record.contract_market_name
        );
        if (!contractMarketName) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_contract_name',
            `CFTC TFF Treasury row ${i} has an invalid contract market name`
          );
        }

        const commodityName = cftcTffCellAsTrimmedString(record.commodity_name);
        if (!commodityName) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_commodity_name',
            `CFTC TFF Treasury row ${i} has an invalid commodity name`
          );
        }

        const marketAndExchangeNames = cftcTffCellAsTrimmedString(
          record.market_and_exchange_names
        );
        if (!marketAndExchangeNames) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_market_exchange_name',
            `CFTC TFF Treasury row ${i} has an invalid market/exchange name`
          );
        }

        const codeRaw = cftcTffCellAsTrimmedString(record.cftc_contract_market_code);
        if (!codeRaw || !REGISTERED_CODE_SET.has(codeRaw)) {
          return fail(
            'parse',
            'cftc_tff_treasury_unexpected_contract_code',
            `CFTC TFF Treasury row ${i} has an unexpected contract market code`
          );
        }
        const cftcContractMarketCode =
          codeRaw as CftcTffTreasuryRegisteredContractCode;

        const futOnly = cftcTffCellAsTrimmedString(record.futonly_or_combined);
        if (futOnly !== CFTC_TFF_FUTONLY_VALUE) {
          return fail(
            'parse',
            'cftc_tff_treasury_wrong_report_type',
            `CFTC TFF Treasury row ${i} is not FutOnly`
          );
        }

        const openInterestAll = parseCftcTffIntegerCell(record.open_interest_all, {
          allowNegative: false,
          requirePositive: true,
        });
        const leveragedFundsLong = parseCftcTffIntegerCell(
          record.lev_money_positions_long,
          { allowNegative: false, requirePositive: false }
        );
        const leveragedFundsShort = parseCftcTffIntegerCell(
          record.lev_money_positions_short,
          { allowNegative: false, requirePositive: false }
        );
        const leveragedFundsSpread = parseCftcTffIntegerCell(
          record.lev_money_positions_spread,
          { allowNegative: false, requirePositive: false }
        );
        const changeLeveragedFundsLong = parseCftcTffIntegerCell(
          record.change_in_lev_money_long,
          { allowNegative: true, requirePositive: false }
        );
        const changeLeveragedFundsShort = parseCftcTffIntegerCell(
          record.change_in_lev_money_short,
          { allowNegative: true, requirePositive: false }
        );
        const changeLeveragedFundsSpread = parseCftcTffIntegerCell(
          record.change_in_lev_money_spread,
          { allowNegative: true, requirePositive: false }
        );
        const pctOiLeveragedFundsLong = parseCftcTffPercentCell(
          record.pct_of_oi_lev_money_long
        );
        const pctOiLeveragedFundsShort = parseCftcTffPercentCell(
          record.pct_of_oi_lev_money_short
        );
        const pctOiLeveragedFundsSpread = parseCftcTffPercentCell(
          record.pct_of_oi_lev_money_spread
        );
        const assetManagerLong = parseCftcTffIntegerCell(
          record.asset_mgr_positions_long,
          { allowNegative: false, requirePositive: false }
        );
        const assetManagerShort = parseCftcTffIntegerCell(
          record.asset_mgr_positions_short,
          { allowNegative: false, requirePositive: false }
        );
        const assetManagerSpread = parseCftcTffIntegerCell(
          record.asset_mgr_positions_spread,
          { allowNegative: false, requirePositive: false }
        );
        const changeAssetManagerLong = parseCftcTffIntegerCell(
          record.change_in_asset_mgr_long,
          { allowNegative: true, requirePositive: false }
        );
        const changeAssetManagerShort = parseCftcTffIntegerCell(
          record.change_in_asset_mgr_short,
          { allowNegative: true, requirePositive: false }
        );
        const changeAssetManagerSpread = parseCftcTffIntegerCell(
          record.change_in_asset_mgr_spread,
          { allowNegative: true, requirePositive: false }
        );
        const pctOiAssetManagerLong = parseCftcTffPercentCell(
          record.pct_of_oi_asset_mgr_long
        );
        const pctOiAssetManagerShort = parseCftcTffPercentCell(
          record.pct_of_oi_asset_mgr_short
        );
        const pctOiAssetManagerSpread = parseCftcTffPercentCell(
          record.pct_of_oi_asset_mgr_spread
        );

        if (
          openInterestAll === null ||
          leveragedFundsLong === null ||
          leveragedFundsShort === null ||
          leveragedFundsSpread === null ||
          changeLeveragedFundsLong === null ||
          changeLeveragedFundsShort === null ||
          changeLeveragedFundsSpread === null ||
          pctOiLeveragedFundsLong === null ||
          pctOiLeveragedFundsShort === null ||
          pctOiLeveragedFundsSpread === null ||
          assetManagerLong === null ||
          assetManagerShort === null ||
          assetManagerSpread === null ||
          changeAssetManagerLong === null ||
          changeAssetManagerShort === null ||
          changeAssetManagerSpread === null ||
          pctOiAssetManagerLong === null ||
          pctOiAssetManagerShort === null ||
          pctOiAssetManagerSpread === null
        ) {
          return fail(
            'parse',
            'cftc_tff_treasury_invalid_numeric_field',
            `CFTC TFF Treasury row ${i} has an invalid numeric field`
          );
        }

        const pairKey = `${cftcContractMarketCode}|${reportDate}`;
        if (seenPairs.has(pairKey)) {
          return fail(
            'parse',
            'cftc_tff_treasury_duplicate_contract_date',
            `CFTC TFF Treasury has duplicate contract/date ${pairKey}`
          );
        }
        seenPairs.add(pairKey);

        rows.push({
          reportDate,
          reportWeek,
          contractMarketName,
          cftcContractMarketCode,
          commodityName,
          marketAndExchangeNames,
          openInterestAll,
          leveragedFundsLong,
          leveragedFundsShort,
          leveragedFundsSpread,
          changeLeveragedFundsLong,
          changeLeveragedFundsShort,
          changeLeveragedFundsSpread,
          pctOiLeveragedFundsLong,
          pctOiLeveragedFundsShort,
          pctOiLeveragedFundsSpread,
          assetManagerLong,
          assetManagerShort,
          assetManagerSpread,
          changeAssetManagerLong,
          changeAssetManagerShort,
          changeAssetManagerSpread,
          pctOiAssetManagerLong,
          pctOiAssetManagerShort,
          pctOiAssetManagerSpread,
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
      source: GhostFlowParsedSource<readonly CftcTffTreasuryParsedRow[]>,
      context: GhostFlowNormalizeContext
    ): GhostFlowStageResult<
      GhostFlowNormalizedObservation<CftcTffTreasuryNormalizedFields>
    > {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'normalize',
          'cftc_tff_treasury_normalize_invalid_now',
          'Normalize context.nowIso must be a valid ISO timestamp'
        );
      }

      const nowDate = new Date(context.nowIso).toISOString().slice(0, 10);
      if (!isValidCalendarDate(nowDate)) {
        return fail(
          'normalize',
          'cftc_tff_treasury_normalize_invalid_now',
          'Normalize context.nowIso must contain a valid UTC calendar date'
        );
      }

      let ceiling = nowDate;
      if (context.referenceAsOf !== undefined) {
        if (!isValidCalendarDate(context.referenceAsOf)) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_invalid_reference_ceiling',
            'Normalize context.referenceAsOf must be a real YYYY-MM-DD calendar date'
          );
        }
        ceiling =
          context.referenceAsOf < nowDate ? context.referenceAsOf : nowDate;
      }

      if (source.parsed.length === 0) {
        return fail(
          'normalize',
          'cftc_tff_treasury_normalize_no_eligible_report',
          'CFTC TFF Treasury parse produced no rows to normalize'
        );
      }

      for (const row of source.parsed) {
        if (row.reportDate > nowDate) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_future_observation',
            `CFTC TFF Treasury observation ${row.reportDate} is after nowIso UTC date ${nowDate}`
          );
        }
      }

      const eligible = source.parsed.filter((row) => row.reportDate <= ceiling);
      if (eligible.length === 0) {
        return fail(
          'normalize',
          'cftc_tff_treasury_normalize_no_eligible_report',
          `No CFTC TFF Treasury observation on or before ceiling ${ceiling}`
        );
      }

      let latestDate = eligible[0]!.reportDate;
      for (const row of eligible) {
        if (row.reportDate > latestDate) {
          latestDate = row.reportDate;
        }
      }

      const latestRows = eligible.filter((row) => row.reportDate === latestDate);
      const byCode = new Map<string, CftcTffTreasuryParsedRow>();
      for (const row of latestRows) {
        if (byCode.has(row.cftcContractMarketCode)) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_duplicate_latest_contract',
            `CFTC TFF Treasury latest report ${latestDate} has duplicate code ${row.cftcContractMarketCode}`
          );
        }
        byCode.set(row.cftcContractMarketCode, row);
      }

      for (const code of CFTC_TFF_TREASURY_CORE_CONTRACT_CODES) {
        if (!byCode.has(code)) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_incomplete_latest_core',
            `CFTC TFF Treasury latest eligible report ${latestDate} is missing core contract ${code}`
          );
        }
      }

      const coreWeek = byCode.get(CFTC_TFF_TREASURY_CORE_CONTRACT_CODES[0]!)!.reportWeek;
      for (const code of CFTC_TFF_TREASURY_CORE_CONTRACT_CODES) {
        if (byCode.get(code)!.reportWeek !== coreWeek) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_report_week_mismatch',
            `CFTC TFF Treasury latest report ${latestDate} has mismatched core report weeks`
          );
        }
      }

      for (const code of CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES) {
        const optionalRow = byCode.get(code);
        if (optionalRow && optionalRow.reportWeek !== coreWeek) {
          return fail(
            'normalize',
            'cftc_tff_treasury_normalize_report_week_mismatch',
            `CFTC TFF Treasury latest report ${latestDate} has mismatched optional report week for ${code}`
          );
        }
      }

      const coreContracts = CFTC_TFF_TREASURY_CORE_CONTRACT_CODES.map((code) =>
        toNormalizedContract(byCode.get(code)!)
      );

      const optionalContextContracts =
        CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES.filter((code) =>
          byCode.has(code)
        ).map((code) => toNormalizedContract(byCode.get(code)!));

      const missingOptional = CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES.filter(
        (code) => !byCode.has(code)
      );

      const issues: GhostFlowRefreshIssue[] = [];
      if (missingOptional.length > 0) {
        issues.push(
          reviewIssue(
            'normalize',
            'cftc_tff_treasury_optional_context_missing',
            `CFTC TFF Treasury latest report ${latestDate} is missing optional context contract(s): ${missingOptional.join(', ')}`
          )
        );
      }

      // Ensure optional codes present are from registered optional set only (defense).
      for (const code of byCode.keys()) {
        if (
          !CFTC_TFF_TREASURY_CORE_CONTRACT_CODES.includes(
            code as (typeof CFTC_TFF_TREASURY_CORE_CONTRACT_CODES)[number]
          ) &&
          !OPTIONAL_CODE_SET.has(code)
        ) {
          // Unreachable after parse; keep silent.
        }
      }

      return {
        ok: true,
        value: {
          artifactId: CFTC_TFF_TREASURY_ARTIFACT_ID,
          observationAsOf: latestDate,
          fields: {
            datasetId: CFTC_TFF_DATASET_ID,
            coreContracts,
            optionalContextContracts,
          },
          provenance: {
            sourceId: source.sourceMetadata.sourceId,
            sourceLocator: source.sourceMetadata.sourceLocator,
            retrievedAt: source.sourceMetadata.retrievedAt,
            observationAsOf: latestDate,
            contentSha256: source.sourceMetadata.contentSha256,
            adapterId: CFTC_TFF_TREASURY_ADAPTER_ID,
            parserVersion: CFTC_TFF_TREASURY_PARSER_VERSION,
          },
        },
        issues,
      };
    },
  };
}

/** Default adapter instance (live fetch client; not invoked on import). */
export const CFTC_TFF_TREASURY_SOCRATA_ADAPTER =
  createCftcTffTreasurySocrataAdapter();
