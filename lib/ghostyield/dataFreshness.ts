/**
 * GhostYield Phase 2 — static freshness rules (no live clock in CI).
 *
 * NAV staleness: more than 5 trading days between navDataAsOf and reference (weekdays counted).
 * Distribution: calendar days from distributionDataAsOf — >45 caution, >90 stale.
 * Quarterly fundamentals: calendar days from quarterlyFundamentalDataAsOf — >120 stale.
 *
 * Uses dataAsOf as fallback for NAV age only when nav is present but navDataAsOf is absent.
 */

import type {
  CandidateFreshnessResult,
  GhostYieldCandidate,
  GhostYieldCandidateRaw,
  GhostYieldFreshnessStatus,
} from './types';
import {
  canInferPremiumDiscount,
  effectiveDataConfidence,
  expectsNavQuote,
  isCefStructure,
} from './candidateFields';

const DIST_CAUTION_DAYS = 45;
const DIST_STALE_DAYS = 90;
const QUARTERLY_STALE_DAYS = 120;
const NAV_STALE_TRADING_DAYS = 5;

function parseUtcDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Calendar days from `from` to `to` (inclusive of `to`, exclusive of `from` span) — simple diff. */
function calendarDaysBetween(fromIso: string, toIso: string): number {
  const a = parseUtcDay(fromIso);
  const b = parseUtcDay(toIso);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** Trading days strictly after `from` through `to` inclusive. */
function tradingDaysAfter(fromIso: string, toIso: string): number {
  const end = parseUtcDay(toIso);
  let cur = parseUtcDay(fromIso);
  cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
  let n = 0;
  while (cur.getTime() <= end.getTime()) {
    const wd = cur.getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
  }
  return n;
}

function navAsOfIso(row: GhostYieldCandidateRaw): string | undefined {
  return row.navDataAsOf ?? (row.nav != null ? row.dataAsOf : undefined);
}

export function evaluateCandidateFreshness(
  row: GhostYieldCandidateRaw,
  referenceAsOf: string
): CandidateFreshnessResult {
  const warnings: string[] = [];
  const dc = effectiveDataConfidence(row);

  let navTradingStale = false;
  const navAsOf = navAsOfIso(row);
  if (navAsOf) {
    const td = tradingDaysAfter(navAsOf, referenceAsOf);
    if (td > NAV_STALE_TRADING_DAYS) {
      navTradingStale = true;
      warnings.push(`NAV / market data is older than ${NAV_STALE_TRADING_DAYS} trading days (sample dates).`);
    }
  } else if (row.nav != null) {
    warnings.push('NAV level present without navDataAsOf — using row dataAsOf only in scoring if needed.');
  }

  let distCaution = false;
  let distStale = false;
  if (row.distributionDataAsOf) {
    const cd = calendarDaysBetween(row.distributionDataAsOf, referenceAsOf);
    if (cd > DIST_STALE_DAYS) {
      distStale = true;
      warnings.push(`Distribution / fund-page data older than ${DIST_STALE_DAYS} days (stale).`);
    } else if (cd > DIST_CAUTION_DAYS) {
      distCaution = true;
      warnings.push(`Distribution / fund-page data older than ${DIST_CAUTION_DAYS} days (caution).`);
    }
  }

  let qStale = false;
  if (row.quarterlyFundamentalDataAsOf) {
    if (calendarDaysBetween(row.quarterlyFundamentalDataAsOf, referenceAsOf) > QUARTERLY_STALE_DAYS) {
      qStale = true;
      warnings.push(`Quarterly fundamentals older than ${QUARTERLY_STALE_DAYS} days (stale).`);
    }
  }

  const needsNav = expectsNavQuote(row);
  const navMissing = needsNav && row.nav == null;
  if (navMissing) {
    warnings.push('Missing NAV for an ETF/CEF-style wrapper in the static row.');
  }

  if (isCefStructure(row) && row.premiumDiscount == null && !canInferPremiumDiscount(row)) {
    warnings.push('Missing premium/discount for a CEF-style wrapper (cannot infer from price vs NAV).');
  }

  const distSkips =
    row.sleeveType === 'cash_tbills' ||
    row.sleeveType === 'crypto_yield_coming_soon';

  const missingDistCore =
    !distSkips &&
    row.latestDistributionDate == null &&
    row.distributionRate == null &&
    row.latestDistributionAmount == null;

  if (missingDistCore) {
    warnings.push('Missing distribution source fields (date, rate, or amount) on static row.');
  }

  if (dc === 'low') {
    warnings.push('Low data confidence — treat numbers as rough.');
  }

  if (dc === 'illustrative') {
    warnings.push('Illustrative / sample-only data — not verified market figures.');
  }

  let status: GhostYieldFreshnessStatus = 'fresh';

  if (dc === 'illustrative') {
    status = 'illustrative';
  } else if (navMissing) {
    status = 'missing';
  } else if (navTradingStale || distStale || qStale) {
    status = 'stale';
  } else if (distCaution || warnings.length > 0) {
    status = 'caution';
  }

  const applyScoringPenalty =
    dc === 'illustrative' ||
    status === 'missing' ||
    status === 'stale' ||
    status === 'caution' ||
    dc === 'low';

  return {
    status,
    warnings,
    applyScoringPenalty,
  };
}

export interface PortfolioFreshnessSummary {
  referenceAsOf: string;
  latestNavDataAsOf: string | null;
  latestDistributionDataAsOf: string | null;
  staleCount: number;
  missingCount: number;
  lowConfidenceCount: number;
  illustrativeCount: number;
  /** Up to 3 most common warning lines. */
  topWarnings: string[];
}

export function summarizePortfolioFreshness(
  candidates: GhostYieldCandidate[],
  referenceAsOf: string
): PortfolioFreshnessSummary {
  let latestNav: string | null = null;
  let latestDist: string | null = null;
  let staleCount = 0;
  let missingCount = 0;
  let illustrativeCount = 0;
  let lowConfidenceCount = 0;
  const warningCounts = new Map<string, number>();

  for (const c of candidates) {
    if (c.freshness.status === 'stale') staleCount++;
    if (c.freshness.status === 'missing') missingCount++;
    if (c.freshness.status === 'illustrative') illustrativeCount++;
    if (effectiveDataConfidence(c) === 'low') lowConfidenceCount++;

    if (c.navDataAsOf) {
      if (!latestNav || c.navDataAsOf > latestNav) latestNav = c.navDataAsOf;
    }
    if (c.distributionDataAsOf) {
      if (!latestDist || c.distributionDataAsOf > latestDist) latestDist = c.distributionDataAsOf;
    }

    for (const w of c.freshness.warnings) {
      warningCounts.set(w, (warningCounts.get(w) ?? 0) + 1);
    }
  }

  const topWarnings = [...warningCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([msg]) => msg);

  return {
    referenceAsOf,
    latestNavDataAsOf: latestNav,
    latestDistributionDataAsOf: latestDist,
    staleCount,
    missingCount,
    lowConfidenceCount,
    illustrativeCount,
    topWarnings,
  };
}
