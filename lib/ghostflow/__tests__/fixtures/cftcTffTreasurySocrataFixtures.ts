/**
 * Synthetic CFTC TFF Treasury Socrata JSON fixtures.
 *
 * SYNTHETIC — schema-matching only.
 * NOT current CFTC market data.
 * NOT production evidence.
 */

export const ADAPTER_TEST_NOW_ISO = '2026-07-09T15:30:00.000Z';

export type SyntheticTreasuryRowInput = {
  report_date_as_yyyy_mm_dd: string;
  yyyy_report_week_ww: string;
  contract_market_name: string;
  cftc_contract_market_code: string;
  commodity_name: string;
  market_and_exchange_names: string;
  futonly_or_combined?: string;
  open_interest_all?: string | number;
  lev_money_positions_long?: string | number;
  lev_money_positions_short?: string | number;
  lev_money_positions_spread?: string | number;
  change_in_lev_money_long?: string | number;
  change_in_lev_money_short?: string | number;
  change_in_lev_money_spread?: string | number;
  pct_of_oi_lev_money_long?: string | number;
  pct_of_oi_lev_money_short?: string | number;
  pct_of_oi_lev_money_spread?: string | number;
  asset_mgr_positions_long?: string | number;
  asset_mgr_positions_short?: string | number;
  asset_mgr_positions_spread?: string | number;
  change_in_asset_mgr_long?: string | number;
  change_in_asset_mgr_short?: string | number;
  change_in_asset_mgr_spread?: string | number;
  pct_of_oi_asset_mgr_long?: string | number;
  pct_of_oi_asset_mgr_short?: string | number;
  pct_of_oi_asset_mgr_spread?: string | number;
};

const META: Record<string, { name: string; commodity: string; exchange: string }> = {
  '042601': {
    name: 'UST 2Y NOTE',
    commodity: 'T-NOTES, 1-2 YEAR',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
  '044601': {
    name: 'UST 5Y NOTE',
    commodity: 'T-NOTES, 4-6 YEAR',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
  '043602': {
    name: 'UST 10Y NOTE',
    commodity: 'T-NOTES, 6.5-10 YEAR',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
  '020601': {
    name: 'UST BOND',
    commodity: 'T-BONDS',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
  '043607': {
    name: 'ULTRA UST 10Y',
    commodity: 'T-NOTES, 6.5-10 YEAR',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
  '020604': {
    name: 'ULTRA UST BOND',
    commodity: 'T-BONDS',
    exchange: 'CHICAGO BOARD OF TRADE',
  },
};

const CORE = ['042601', '044601', '043602', '020601'] as const;
const OPTIONAL = ['043607', '020604'] as const;
const ALL = [...CORE, ...OPTIONAL] as const;

export function synthTreasuryRow(
  code: string,
  reportDateIsoPrefix: string,
  reportWeek: string,
  overrides: Partial<SyntheticTreasuryRowInput> = {}
): SyntheticTreasuryRowInput {
  const seed = code.charCodeAt(0) + reportDateIsoPrefix.length + code.length;
  const meta = META[code] ?? {
    name: `SYNTHETIC ${code}`,
    commodity: 'SYNTHETIC',
    exchange: 'SYNTHETIC EXCHANGE',
  };
  return {
    report_date_as_yyyy_mm_dd: `${reportDateIsoPrefix}T00:00:00.000`,
    yyyy_report_week_ww: reportWeek,
    contract_market_name: meta.name,
    cftc_contract_market_code: code,
    commodity_name: meta.commodity,
    market_and_exchange_names: meta.exchange,
    futonly_or_combined: 'FutOnly',
    open_interest_all: String(200000 + seed * 31),
    lev_money_positions_long: String(20000 + seed * 5),
    lev_money_positions_short: String(18000 + seed * 4),
    lev_money_positions_spread: String(1500 + seed),
    change_in_lev_money_long: String(seed % 2 === 0 ? -210 : 95),
    change_in_lev_money_short: String(seed % 2 === 0 ? 33 : -44),
    change_in_lev_money_spread: String(8),
    pct_of_oi_lev_money_long: String(((seed % 18) + 6).toFixed(1)),
    pct_of_oi_lev_money_short: String(((seed % 14) + 5).toFixed(1)),
    pct_of_oi_lev_money_spread: String(((seed % 7) + 1).toFixed(1)),
    asset_mgr_positions_long: String(30000 + seed * 6),
    asset_mgr_positions_short: String(12000 + seed * 3),
    asset_mgr_positions_spread: String(2200 + seed),
    change_in_asset_mgr_long: String(seed % 2 === 0 ? -88 : 120),
    change_in_asset_mgr_short: String(seed % 2 === 0 ? 55 : -30),
    change_in_asset_mgr_spread: String(4),
    pct_of_oi_asset_mgr_long: String(((seed % 22) + 8).toFixed(1)),
    pct_of_oi_asset_mgr_short: String(((seed % 12) + 3).toFixed(1)),
    pct_of_oi_asset_mgr_spread: String(((seed % 6) + 1).toFixed(1)),
    ...overrides,
  };
}

export function synthCompleteSix(
  reportDateIsoPrefix: string,
  reportWeek: string
): SyntheticTreasuryRowInput[] {
  return ALL.map((code) => synthTreasuryRow(code, reportDateIsoPrefix, reportWeek));
}

export function synthCompleteCore(
  reportDateIsoPrefix: string,
  reportWeek: string
): SyntheticTreasuryRowInput[] {
  return CORE.map((code) => synthTreasuryRow(code, reportDateIsoPrefix, reportWeek));
}

export function rowsToJson(rows: readonly SyntheticTreasuryRowInput[]): string {
  return JSON.stringify(rows);
}

export const FIXTURE_TREASURY_VALID_MULTI_WEEK = rowsToJson([
  ...synthCompleteSix('2026-07-07', '2026 Report Week 27'),
  ...synthCompleteSix('2026-06-30', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_UNSORTED = rowsToJson([
  synthTreasuryRow('020604', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('042601', '2026-06-30', '2026 Report Week 26'),
  synthTreasuryRow('043602', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('044601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('020601', '2026-06-30', '2026 Report Week 26'),
  synthTreasuryRow('043607', '2026-06-30', '2026 Report Week 26'),
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('020601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('044601', '2026-06-30', '2026 Report Week 26'),
  synthTreasuryRow('043602', '2026-06-30', '2026 Report Week 26'),
  synthTreasuryRow('043607', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('020604', '2026-06-30', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL = FIXTURE_TREASURY_VALID_MULTI_WEEK;

export const FIXTURE_TREASURY_CORE_PLUS_ONE_OPTIONAL = rowsToJson([
  ...synthCompleteCore('2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('043607', '2026-07-07', '2026 Report Week 27'),
  ...synthCompleteSix('2026-06-30', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_CORE_NO_OPTIONAL = rowsToJson([
  ...synthCompleteCore('2026-07-07', '2026 Report Week 27'),
  ...synthCompleteSix('2026-06-30', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_LATEST_INCOMPLETE_CORE = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('044601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('043602', '2026-07-07', '2026 Report Week 27'),
  // missing 020601 on latest
  ...synthCompleteSix('2026-06-30', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_MISMATCHED_CORE_WEEK = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('044601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('043602', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('020601', '2026-07-07', '2026 Report Week 26'),
]);

export const FIXTURE_TREASURY_MISMATCHED_OPTIONAL_WEEK = rowsToJson([
  ...synthCompleteCore('2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('043607', '2026-07-07', '2026 Report Week 26'),
  synthTreasuryRow('020604', '2026-07-07', '2026 Report Week 27'),
]);

export const FIXTURE_TREASURY_DUPLICATE_CODE_DATE = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    open_interest_all: '999999',
  }),
  synthTreasuryRow('044601', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('043602', '2026-07-07', '2026 Report Week 27'),
  synthTreasuryRow('020601', '2026-07-07', '2026 Report Week 27'),
]);

export const FIXTURE_TREASURY_UNEXPECTED_CODE = rowsToJson([
  synthTreasuryRow('999999', '2026-07-07', '2026 Report Week 27'),
]);

export const FIXTURE_TREASURY_WRONG_FUTONLY = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    futonly_or_combined: 'Combined',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);

export const FIXTURE_TREASURY_MISSING_FIELD = JSON.stringify([
  {
    report_date_as_yyyy_mm_dd: '2026-07-07T00:00:00.000',
    yyyy_report_week_ww: '2026 Report Week 27',
    contract_market_name: 'UST 2Y NOTE',
    cftc_contract_market_code: '042601',
    commodity_name: 'T-NOTES, 1-2 YEAR',
    market_and_exchange_names: 'CHICAGO BOARD OF TRADE',
    futonly_or_combined: 'FutOnly',
    open_interest_all: '100000',
    lev_money_positions_long: '10000',
    lev_money_positions_short: '9000',
    lev_money_positions_spread: '1000',
    change_in_lev_money_long: '10',
    change_in_lev_money_short: '-5',
    change_in_lev_money_spread: '1',
    pct_of_oi_lev_money_long: '10.0',
    pct_of_oi_lev_money_short: '9.0',
    pct_of_oi_lev_money_spread: '1.0',
    asset_mgr_positions_long: '20000',
    asset_mgr_positions_short: '8000',
    asset_mgr_positions_spread: '500',
    change_in_asset_mgr_long: '3',
    change_in_asset_mgr_short: '-2',
    change_in_asset_mgr_spread: '1',
    pct_of_oi_asset_mgr_long: '20.0',
    pct_of_oi_asset_mgr_short: '8.0',
    // pct_of_oi_asset_mgr_spread omitted
  },
]);

export const FIXTURE_TREASURY_INVALID_TIMESTAMP = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    report_date_as_yyyy_mm_dd: '2026-07-07T12:30:00.000',
  }),
]);

export const FIXTURE_TREASURY_FUTURE_REPORT = rowsToJson(
  synthCompleteSix('2099-12-31', '2099 Report Week 52')
);

export const FIXTURE_TREASURY_EMPTY_ARRAY = '[]';
export const FIXTURE_TREASURY_NON_ARRAY = '{"rows":[]}';
export const FIXTURE_TREASURY_MALFORMED_JSON = '[{"report_date_as_yyyy_mm_dd":';

export const FIXTURE_TREASURY_INVALID_OPEN_INTEREST = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    open_interest_all: '0',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);

export const FIXTURE_TREASURY_NEGATIVE_LEV_POSITION = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    lev_money_positions_long: '-1',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);

export const FIXTURE_TREASURY_NEGATIVE_AM_POSITION = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    asset_mgr_positions_short: '-2',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);

export const FIXTURE_TREASURY_NEGATIVE_CHANGES_OK = rowsToJson(
  synthCompleteCore('2026-07-07', '2026 Report Week 27').map((row, i) =>
    i === 0
      ? {
          ...row,
          change_in_lev_money_long: '-2500',
          change_in_asset_mgr_short: '-100',
        }
      : row
  )
);

export const FIXTURE_TREASURY_INVALID_LEV_PCT = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    pct_of_oi_lev_money_long: '100.1',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);

export const FIXTURE_TREASURY_INVALID_AM_PCT = rowsToJson([
  synthTreasuryRow('042601', '2026-07-07', '2026 Report Week 27', {
    pct_of_oi_asset_mgr_long: '-1',
  }),
  ...CORE.slice(1).map((c) => synthTreasuryRow(c, '2026-07-07', '2026 Report Week 27')),
]);
