/**
 * GhostRegime Methodology Content
 * 
 * If you change data providers in lib/ghostregime/*, update this file. The UI should not lie.
 * 
 * This module centralizes the "Data Sources & Update Timing" content for the methodology page.
 * Keep it in sync with the actual providers used in lib/ghostregime/marketData.ts.
 */

export type ExternalLink = {
  label: string;
  href: string;
};

export type DataSourceItem = {
  key: string;
  label: string; // e.g., "ETF prices (SPY, GLD, ...)"
  description: string; // e.g., "Daily close data from Stooq"
  links?: ExternalLink[];
};

/**
 * Data sources used by GhostRegime
 * Matches the actual providers in lib/ghostregime/marketData.ts
 */
export const GHOSTREGIME_DATA_SOURCES: DataSourceItem[] = [
  {
    key: 'etfs',
    label: 'ETF prices',
    description: '(SPY, GLD, HYG, IEF, EEM, TLT, UUP, TIP, etc.): daily close data from',
    links: [
      {
        label: 'Stooq',
        href: 'https://stooq.com',
      },
    ],
  },
  {
    key: 'vix',
    label: 'VIX',
    description: ':',
    links: [
      {
        label: 'CBOE',
        href: 'https://www.cboe.com/tradable_products/vix/',
      },
    ],
    // Note: The description will be rendered as "VIX: CBOE data" in the UI
  },
  {
    key: 'bitcoin',
    label: 'Bitcoin',
    description: ' (BTC-USD):',
    links: [
      {
        label: 'Stooq',
        href: 'https://stooq.com',
      },
    ],
  },
  {
    key: 'commodities',
    label: 'Commodities',
    description: ' (PDBC): typically',
    links: [
      {
        label: 'AlphaVantage',
        href: 'https://www.alphavantage.co',
      },
    ],
    // Note: The description mentions "with DBC fallback from Stooq" - this is handled in the UI rendering
  },
];

/**
 * Note about price returns vs total return
 */
export const GHOSTREGIME_PRICE_RETURN_NOTE: string =
  'GhostRegime uses close-to-close price returns, not total return — so dividends can cause differences vs brokerage total-return charts.';

/**
 * Reasons why broker accounts might not match perfectly
 * Used in the <details> collapsible section
 */
export const GHOSTREGIME_BROKER_MISMATCH_REASONS: string[] = [
  'Different pricing timestamps (your broker might use intraday vs. close)',
  'Dividends/total return vs. price return (we use price return)',
  'Holiday/weekend gaps (data might lag on non-trading days)',
  'Data revisions (providers sometimes backfill corrections)',
];

/**
 * Update timing lines
 */
export const GHOSTREGIME_UPDATE_TIMING_LINES: string[] = [
  'GhostRegime is designed to update once per weekday after market close. Current job runs around 03:30 UTC (Mon–Fri), which is roughly evening in US Central time.',
  "It's a daily model — most humans rebalance on a cadence, not every time a number twitches.",
];

/**
 * Stale behavior explanation
 */
export const GHOSTREGIME_STALE_BEHAVIOR_LINE: string =
  'If a data source is unavailable, we mark the snapshot stale and keep showing the last good result rather than face-planting.';

/**
 * Additional note for commodities (PDBC) fallback
 * This is rendered separately in the UI to clarify the DBC fallback
 */
export const GHOSTREGIME_COMMODITIES_FALLBACK_NOTE: string = ', with DBC fallback from Stooq';





