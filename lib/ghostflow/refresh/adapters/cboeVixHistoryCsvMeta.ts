/**
 * CBOE VIX History CSV — shared adapter metadata constants only.
 * No network, parsing, hashing, or side effects.
 */

export const CBOE_VIX_SOURCE_FAMILY_ID = 'cboe_vix_official_csv' as const;
export const CBOE_VIX_SOURCE_NAME = 'CBOE VIX History' as const;
export const CBOE_VIX_SOURCE_LOCATOR =
  'https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv' as const;
export const CBOE_VIX_ADAPTER_ID = 'cboe-vix-history-csv' as const;
export const CBOE_VIX_PARSER_VERSION = '1.0.0' as const;
export const CBOE_VIX_ARTIFACT_ID = 'volatilityRegime' as const;
