/**
 * CFTC TFF Socrata — deterministic query construction (pure, no I/O).
 */

import {
  CFTC_TFF_REGISTERED_CONTRACT_CODES,
  CFTC_TFF_RESOURCE_ENDPOINT,
} from './cftcTffSocrataMeta';
import { CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES } from './cftcTffTreasurySocrataMeta';

/** Fixed SoQL select list for the systematic adapter. */
export const CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS = [
  'report_date_as_yyyy_mm_dd',
  'yyyy_report_week_ww',
  'contract_market_name',
  'cftc_contract_market_code',
  'futonly_or_combined',
  'open_interest_all',
  'lev_money_positions_long',
  'lev_money_positions_short',
  'lev_money_positions_spread',
  'change_in_lev_money_long',
  'change_in_lev_money_short',
  'change_in_lev_money_spread',
  'pct_of_oi_lev_money_long',
  'pct_of_oi_lev_money_short',
  'pct_of_oi_lev_money_spread',
] as const;

export const CFTC_TFF_SYSTEMATIC_QUERY_LIMIT = 500 as const;

export const CFTC_TFF_FUTONLY_VALUE = 'FutOnly' as const;

/** Fixed SoQL select list for the Treasury adapter. */
export const CFTC_TFF_TREASURY_SELECTED_FIELDS = [
  'report_date_as_yyyy_mm_dd',
  'yyyy_report_week_ww',
  'contract_market_name',
  'cftc_contract_market_code',
  'commodity_name',
  'market_and_exchange_names',
  'futonly_or_combined',
  'open_interest_all',
  'lev_money_positions_long',
  'lev_money_positions_short',
  'lev_money_positions_spread',
  'change_in_lev_money_long',
  'change_in_lev_money_short',
  'change_in_lev_money_spread',
  'pct_of_oi_lev_money_long',
  'pct_of_oi_lev_money_short',
  'pct_of_oi_lev_money_spread',
  'asset_mgr_positions_long',
  'asset_mgr_positions_short',
  'asset_mgr_positions_spread',
  'change_in_asset_mgr_long',
  'change_in_asset_mgr_short',
  'change_in_asset_mgr_spread',
  'pct_of_oi_asset_mgr_long',
  'pct_of_oi_asset_mgr_short',
  'pct_of_oi_asset_mgr_spread',
] as const;

export const CFTC_TFF_TREASURY_QUERY_LIMIT = 500 as const;

export interface CftcTffResourceQuerySpec {
  selectedFields: readonly string[];
  contractCodes: readonly string[];
  limit: number;
}

/**
 * Source-family deterministic Socrata resource URL.
 * Eligibility relative to nowIso / referenceAsOf is owned by normalize — not this query.
 */
export function buildCftcTffResourceQueryUrl(
  spec: CftcTffResourceQuerySpec
): string {
  const codeList = spec.contractCodes.map((c) => `'${c}'`).join(',');
  const select = spec.selectedFields.join(',');
  const where = [
    `futonly_or_combined = '${CFTC_TFF_FUTONLY_VALUE}'`,
    `cftc_contract_market_code in (${codeList})`,
  ].join(' AND ');
  const order = 'report_date_as_yyyy_mm_dd DESC,cftc_contract_market_code ASC';

  return (
    `${CFTC_TFF_RESOURCE_ENDPOINT}` +
    `?$select=${encodeURIComponent(select)}` +
    `&$where=${encodeURIComponent(where)}` +
    `&$order=${encodeURIComponent(order)}` +
    `&$limit=${spec.limit}`
  );
}

/**
 * Build the exact deterministic Socrata resource URL for the systematic adapter.
 * Delegates to the shared builder; URL must remain byte-for-byte stable.
 */
export function buildCftcTffSystematicResourceQueryUrl(): string {
  return buildCftcTffResourceQueryUrl({
    selectedFields: CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS,
    contractCodes: CFTC_TFF_REGISTERED_CONTRACT_CODES,
    limit: CFTC_TFF_SYSTEMATIC_QUERY_LIMIT,
  });
}

/**
 * Build the exact deterministic Socrata resource URL for the Treasury adapter.
 */
export function buildCftcTffTreasuryResourceQueryUrl(): string {
  return buildCftcTffResourceQueryUrl({
    selectedFields: CFTC_TFF_TREASURY_SELECTED_FIELDS,
    contractCodes: CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES,
    limit: CFTC_TFF_TREASURY_QUERY_LIMIT,
  });
}
