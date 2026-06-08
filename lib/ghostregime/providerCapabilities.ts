/**
 * GhostRegime market-data provider capability metadata (planning / clamp logic).
 */

import { VAMS_MIN_OBSERVATIONS_AT_ASOF } from './config';

export type BtcProviderId = 'yahoo' | 'stooq' | 'coingecko_public';

export interface ProviderCapability {
  supportsHistoricalBootstrap: boolean;
  supportsRecentRefresh: boolean;
  requiresApiKey: boolean | 'optional';
  maxLookbackDays: number;
  mayBeBrowserChallenged?: boolean;
}

export const BTC_PROVIDER_CAPABILITIES: Record<BtcProviderId, ProviderCapability> = {
  yahoo: {
    supportsHistoricalBootstrap: true,
    supportsRecentRefresh: true,
    requiresApiKey: false,
    maxLookbackDays: 2000,
  },
  stooq: {
    supportsHistoricalBootstrap: true,
    supportsRecentRefresh: true,
    requiresApiKey: 'optional',
    maxLookbackDays: 2000,
    mayBeBrowserChallenged: true,
  },
  coingecko_public: {
    supportsHistoricalBootstrap: false,
    supportsRecentRefresh: true,
    requiresApiKey: false,
    maxLookbackDays: 360,
  },
};

/** Public CoinGecko tier — stay under documented 365-day wall. */
export const COINGECKO_PUBLIC_MAX_LOOKBACK_DAYS =
  BTC_PROVIDER_CAPABILITIES.coingecko_public.maxLookbackDays;

/** Minimum BTC rows to skip fallback providers (matches VAMS gate). */
export const BTC_BOOTSTRAP_MIN_ROWS = VAMS_MIN_OBSERVATIONS_AT_ASOF;

export function clampCoinGeckoPublicStart(
  requestedStart: Date,
  endDate: Date
): { effectiveStart: Date; lookbackLimited: boolean } {
  const earliestAllowed = new Date(endDate);
  earliestAllowed.setUTCDate(
    earliestAllowed.getUTCDate() - COINGECKO_PUBLIC_MAX_LOOKBACK_DAYS
  );
  if (requestedStart.getTime() < earliestAllowed.getTime()) {
    return { effectiveStart: earliestAllowed, lookbackLimited: true };
  }
  return { effectiveStart: requestedStart, lookbackLimited: false };
}

/** Detect CoinGecko public 365-day / error 10012 responses. */
export function isCoinGeckoPublicLookbackExceeded(bodyText: string): boolean {
  const lower = bodyText.toLowerCase();
  return (
    lower.includes('10012') ||
    lower.includes('exceeds the allowed time range') ||
    lower.includes('within the past 365 days') ||
    lower.includes('365 days')
  );
}
