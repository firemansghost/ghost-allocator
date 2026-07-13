/**
 * Synthetic CFTC TFF Socrata JSON fixtures for the systematic adapter.
 *
 * SYNTHETIC — schema-matching only.
 * NOT current CFTC market data.
 * NOT production evidence.
 * Do not treat these values as live observations.
 */

export const ADAPTER_TEST_NOW_ISO = '2026-07-09T15:30:00.000Z';

export type SyntheticCftcRowInput = {
  report_date_as_yyyy_mm_dd: string;
  yyyy_report_week_ww: string;
  contract_market_name: string;
  cftc_contract_market_code: string;
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
};

const NAMES: Record<string, string> = {
  '13874A': 'E-MINI S&P 500',
  '209742': 'NASDAQ MINI',
  '239742': 'RUSSELL E-MINI',
  '1170E1': 'VIX FUTURES',
};

/** Fabricated observation for one contract on one report date. */
export function synthRow(
  code: string,
  reportDateIsoPrefix: string,
  reportWeek: string,
  overrides: Partial<SyntheticCftcRowInput> = {}
): SyntheticCftcRowInput {
  const seed = code.charCodeAt(0) + reportDateIsoPrefix.length;
  return {
    report_date_as_yyyy_mm_dd: `${reportDateIsoPrefix}T00:00:00.000`,
    yyyy_report_week_ww: reportWeek,
    contract_market_name: NAMES[code] ?? `SYNTHETIC ${code}`,
    cftc_contract_market_code: code,
    futonly_or_combined: 'FutOnly',
    open_interest_all: String(100000 + seed * 17),
    lev_money_positions_long: String(10000 + seed * 3),
    lev_money_positions_short: String(9000 + seed * 2),
    lev_money_positions_spread: String(1000 + seed),
    change_in_lev_money_long: String(seed % 2 === 0 ? -120 : 85),
    change_in_lev_money_short: String(seed % 2 === 0 ? 40 : -55),
    change_in_lev_money_spread: String(10),
    pct_of_oi_lev_money_long: String(((seed % 20) + 5).toFixed(1)),
    pct_of_oi_lev_money_short: String(((seed % 15) + 4).toFixed(1)),
    pct_of_oi_lev_money_spread: String(((seed % 8) + 1).toFixed(1)),
    ...overrides,
  };
}

export function synthCompleteWeek(
  reportDateIsoPrefix: string,
  reportWeek: string
): SyntheticCftcRowInput[] {
  return ['13874A', '209742', '239742', '1170E1'].map((code) =>
    synthRow(code, reportDateIsoPrefix, reportWeek)
  );
}

export function rowsToJson(rows: readonly SyntheticCftcRowInput[]): string {
  return JSON.stringify(rows);
}

/** Valid multi-week response (newer week first, then older). */
export const FIXTURE_CFTC_VALID_MULTI_WEEK = rowsToJson([
  ...synthCompleteWeek('2026-07-07', '2026 Report Week 27'),
  ...synthCompleteWeek('2026-06-30', '2026 Report Week 26'),
]);

/** Same rows shuffled so normalize must ignore input order. */
export const FIXTURE_CFTC_UNSORTED = rowsToJson([
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-06-30', '2026 Report Week 26'),
  synthRow('13874A', '2026-06-30', '2026 Report Week 26'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
  synthRow('209742', '2026-06-30', '2026 Report Week 26'),
  synthRow('13874A', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-06-30', '2026 Report Week 26'),
]);

/** Latest week complete (baseline for successful normalize). */
export const FIXTURE_CFTC_LATEST_COMPLETE = FIXTURE_CFTC_VALID_MULTI_WEEK;

/** Latest week missing RTY — must fail closed (no older-week fallback). */
export const FIXTURE_CFTC_LATEST_INCOMPLETE = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27'),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
  ...synthCompleteWeek('2026-06-30', '2026 Report Week 26'),
]);

/** Same date, mismatched report weeks across contracts. */
export const FIXTURE_CFTC_MISMATCHED_WEEK = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27'),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 26'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);

/** Duplicate contract/date pair. */
export const FIXTURE_CFTC_DUPLICATE_CODE_DATE = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27'),
  synthRow('13874A', '2026-07-07', '2026 Report Week 27', {
    open_interest_all: '999999',
  }),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);

/** Unexpected contract code. */
export const FIXTURE_CFTC_UNEXPECTED_CODE = rowsToJson([
  synthRow('999999', '2026-07-07', '2026 Report Week 27'),
]);

/** Wrong FutOnly / Combined value. */
export const FIXTURE_CFTC_WRONG_FUTONLY = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27', {
    futonly_or_combined: 'Combined',
  }),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);

/** Missing required field. */
export const FIXTURE_CFTC_MISSING_FIELD = JSON.stringify([
  {
    report_date_as_yyyy_mm_dd: '2026-07-07T00:00:00.000',
    yyyy_report_week_ww: '2026 Report Week 27',
    contract_market_name: 'E-MINI S&P 500',
    cftc_contract_market_code: '13874A',
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
    // pct_of_oi_lev_money_spread intentionally omitted
  },
]);

/** Invalid calendar date (Feb 31). */
export const FIXTURE_CFTC_INVALID_CALENDAR_DATE = rowsToJson([
  synthRow('13874A', '2026-02-31', '2026 Report Week 09'),
]);

/** Future report date relative to ADAPTER_TEST_NOW_ISO. */
export const FIXTURE_CFTC_FUTURE_REPORT = rowsToJson([
  ...synthCompleteWeek('2099-12-31', '2099 Report Week 52'),
]);

export const FIXTURE_CFTC_EMPTY_ARRAY = '[]';

export const FIXTURE_CFTC_NON_ARRAY = '{"rows":[]}';

export const FIXTURE_CFTC_MALFORMED_JSON = '[{"report_date_as_yyyy_mm_dd":';

export const FIXTURE_CFTC_INVALID_OPEN_INTEREST = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27', {
    open_interest_all: '0',
  }),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);

export const FIXTURE_CFTC_NEGATIVE_POSITION = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27', {
    lev_money_positions_long: '-1',
  }),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);

/** Negative weekly change is valid. */
export const FIXTURE_CFTC_NEGATIVE_CHANGE_OK = rowsToJson(
  synthCompleteWeek('2026-07-07', '2026 Report Week 27').map((row, i) =>
    i === 0
      ? {
          ...row,
          change_in_lev_money_long: '-2500',
          change_in_lev_money_short: '-100',
          change_in_lev_money_spread: '-3',
        }
      : row
  )
);

export const FIXTURE_CFTC_INVALID_PERCENT = rowsToJson([
  synthRow('13874A', '2026-07-07', '2026 Report Week 27', {
    pct_of_oi_lev_money_long: '100.1',
  }),
  synthRow('209742', '2026-07-07', '2026 Report Week 27'),
  synthRow('239742', '2026-07-07', '2026 Report Week 27'),
  synthRow('1170E1', '2026-07-07', '2026 Report Week 27'),
]);
