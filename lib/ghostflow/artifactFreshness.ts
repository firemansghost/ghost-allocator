/**
 * GhostFlow v0.2 — static artifact freshness (no live clock in CI).
 *
 * Daily VIX artifact:
 * - 0–2 trading days stale: fresh
 * - 3–5 trading days stale: caution
 * - >5 trading days stale: stale
 */

import type { ArtifactFreshnessResult, GhostFlowArtifactFreshnessStatus } from './artifacts/types';

const CAUTION_TRADING_DAYS = 3;
const STALE_TRADING_DAYS = 5;

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

function statusFromTradingDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= 2) return 'fresh';
  if (days <= STALE_TRADING_DAYS) return 'caution';
  return 'stale';
}

export function evaluateArtifactFreshness(
  artifactAsOf: string,
  referenceAsOf: string
): ArtifactFreshnessResult {
  const tradingDaysStale = tradingDaysAfter(artifactAsOf, referenceAsOf);
  const status = statusFromTradingDays(tradingDaysStale);
  const warnings: string[] = [];

  if (status === 'caution') {
    warnings.push(
      `Volatility Regime artifact is ${tradingDaysStale} trading days old (caution threshold: ${CAUTION_TRADING_DAYS}+).`
    );
  } else if (status === 'stale') {
    warnings.push(
      `Volatility Regime artifact is ${tradingDaysStale} trading days old (stale threshold: >${STALE_TRADING_DAYS}). Values shown are last manual update — refresh recommended.`
    );
  }

  return { status, tradingDaysStale, warnings };
}
