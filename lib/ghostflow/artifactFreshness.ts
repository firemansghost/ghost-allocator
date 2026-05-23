/**
 * GhostFlow — static artifact freshness (no live clock in CI).
 *
 * Daily artifacts (VIX): trading days after asOf.
 * Weekly artifacts (ETF): calendar days after publishedAt (or asOf fallback).
 * Monthly artifacts (Active/Index): calendar days after publishedAt (or asOf fallback).
 */

import type { ArtifactFreshnessResult, GhostFlowArtifactFreshnessStatus } from './artifacts/types';

const DAILY_CAUTION_TRADING_DAYS = 3;
const DAILY_STALE_TRADING_DAYS = 5;

const WEEKLY_CAUTION_CALENDAR_DAYS = 8;
const WEEKLY_STALE_CALENDAR_DAYS = 14;

const MONTHLY_FRESH_CALENDAR_DAYS = 35;
const MONTHLY_CAUTION_CALENDAR_DAYS = 55;

function parseUtcDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Trading days strictly after `from` through `to` inclusive. */
export function tradingDaysAfter(fromIso: string, toIso: string): number {
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

/** Calendar days from `from` through `to` inclusive span (0 if same day). */
export function calendarDaysAfter(fromIso: string, toIso: string): number {
  const a = parseUtcDay(fromIso);
  const b = parseUtcDay(toIso);
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function statusFromTradingDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= 2) return 'fresh';
  if (days <= DAILY_STALE_TRADING_DAYS) return 'caution';
  return 'stale';
}

function statusFromCalendarDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= 7) return 'fresh';
  if (days <= WEEKLY_STALE_CALENDAR_DAYS) return 'caution';
  return 'stale';
}

function statusFromMonthlyCalendarDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= MONTHLY_FRESH_CALENDAR_DAYS) return 'fresh';
  if (days <= MONTHLY_CAUTION_CALENDAR_DAYS) return 'caution';
  return 'stale';
}

export function evaluateDailyArtifactFreshness(
  artifactAsOf: string,
  referenceAsOf: string,
  label = 'Volatility Regime'
): ArtifactFreshnessResult {
  const tradingDaysStale = tradingDaysAfter(artifactAsOf, referenceAsOf);
  const status = statusFromTradingDays(tradingDaysStale);
  const warnings: string[] = [];

  if (status === 'caution') {
    warnings.push(
      `${label} artifact is ${tradingDaysStale} trading days old (caution threshold: ${DAILY_CAUTION_TRADING_DAYS}+).`
    );
  } else if (status === 'stale') {
    warnings.push(
      `${label} artifact is ${tradingDaysStale} trading days old (stale threshold: >${DAILY_STALE_TRADING_DAYS}). Values shown are last manual update. Refresh recommended.`
    );
  }

  return { status, ageDays: tradingDaysStale, warnings };
}

export function evaluateWeeklyArtifactFreshness(
  freshnessAnchor: string,
  referenceAsOf: string,
  label = 'ETF Net Issuance'
): ArtifactFreshnessResult {
  const calendarDaysStale = calendarDaysAfter(freshnessAnchor, referenceAsOf);
  const status = statusFromCalendarDays(calendarDaysStale);
  const warnings: string[] = [];

  if (status === 'caution') {
    warnings.push(
      `${label} artifact is ${calendarDaysStale} calendar days since release (caution threshold: ${WEEKLY_CAUTION_CALENDAR_DAYS}+).`
    );
  } else if (status === 'stale') {
    warnings.push(
      `${label} artifact is ${calendarDaysStale} calendar days since release (stale threshold: >${WEEKLY_STALE_CALENDAR_DAYS}). Values shown are last manual update. Refresh recommended.`
    );
  }

  return { status, ageDays: calendarDaysStale, warnings };
}

export function evaluateMonthlyArtifactFreshness(
  freshnessAnchor: string,
  referenceAsOf: string,
  label = 'Active vs Index Flow'
): ArtifactFreshnessResult {
  const calendarDaysStale = calendarDaysAfter(freshnessAnchor, referenceAsOf);
  const status = statusFromMonthlyCalendarDays(calendarDaysStale);
  const warnings: string[] = [];

  if (status === 'caution') {
    warnings.push(
      `${label} artifact is ${calendarDaysStale} calendar days since release (caution threshold: ${MONTHLY_FRESH_CALENDAR_DAYS + 1}+). This is expected for monthly manual artifacts between source updates.`
    );
  } else if (status === 'stale') {
    warnings.push(
      `${label} artifact is ${calendarDaysStale} calendar days since release (stale threshold: >${MONTHLY_CAUTION_CALENDAR_DAYS}). Values shown are last manual update. Refresh recommended.`
    );
  }

  return { status, ageDays: calendarDaysStale, warnings };
}

/** @deprecated Use evaluateDailyArtifactFreshness */
export function evaluateArtifactFreshness(
  artifactAsOf: string,
  referenceAsOf: string
): ArtifactFreshnessResult {
  return evaluateDailyArtifactFreshness(artifactAsOf, referenceAsOf);
}
