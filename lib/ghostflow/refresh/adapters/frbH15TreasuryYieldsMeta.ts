/**
 * Board of Governors H.15 Treasury yields — adapter metadata constants only.
 * No network, parsing, hashing, or side effects.
 */

/** Official H.15 Data Download Program choose page (canonical family locator). */
export const FRB_H15_SOURCE_FAMILY_ID = 'frb_h15_treasury_yields' as const;

export const FRB_H15_SOURCE_NAME =
  'Board of Governors H.15 — Treasury constant maturity (nominal + inflation-indexed)' as const;

export const FRB_H15_SOURCE_LOCATOR =
  'https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15' as const;

export const FRB_H15_ADAPTER_ID = 'frb-h15-treasury-yields-csv' as const;

export const FRB_H15_PARSER_VERSION = '1.0.0' as const;

export const FRB_H15_ARTIFACT_ID = 'treasuryLongEndIncomeLens' as const;

/**
 * Official preformatted “Treasury Constant Maturities” package unique IDs
 * (daily / business-day), package hash order locked to Board DDP.
 * MD5(uniqueIds joined by "\\n") === bf17364827e38702b42a58cf8eaa3f78
 */
export const FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS = [
  'H15/H15/RIFLGFCM01_N.B',
  'H15/H15/RIFLGFCM03_N.B',
  'H15/H15/RIFLGFCM06_N.B',
  'H15/H15/RIFLGFCY01_N.B',
  'H15/H15/RIFLGFCY02_N.B',
  'H15/H15/RIFLGFCY03_N.B',
  'H15/H15/RIFLGFCY05_N.B',
  'H15/H15/RIFLGFCY07_N.B',
  'H15/H15/RIFLGFCY10_N.B',
  'H15/H15/RIFLGFCY20_N.B',
  'H15/H15/RIFLGFCY30_N.B',
] as const;

/** 30-year inflation-indexed constant maturity (daily). */
export const FRB_H15_TIPS_30_SERIES_UNIQUE_ID =
  'H15/H15/RIFLGFCY30_XII_N.B' as const;

/** Required core series for normalize (must share a common observation date). */
export const FRB_H15_REQUIRED_SERIES_UNIQUE_IDS = [
  'H15/H15/RIFLGFCY30_N.B',
  'H15/H15/RIFLGFCY30_XII_N.B',
] as const;

/** Optional nominal context series (included only when present on asOf). */
export const FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS = [
  'H15/H15/RIFLGFCY02_N.B',
  'H15/H15/RIFLGFCY05_N.B',
  'H15/H15/RIFLGFCY10_N.B',
] as const;

export type FrbH15RequiredSeriesUniqueId =
  (typeof FRB_H15_REQUIRED_SERIES_UNIQUE_IDS)[number];

export type FrbH15OptionalSeriesUniqueId =
  (typeof FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS)[number];

export type FrbH15RegisteredSeriesUniqueId =
  | FrbH15RequiredSeriesUniqueId
  | FrbH15OptionalSeriesUniqueId;
