/**
 * GhostRegime Flip Watch — transition telemetry (R4 Option A)
 *
 * Flip Watch does not confirm, delay, suppress, or approve regime changes.
 * The classified regime and allocations apply immediately.
 */

import type { CurrentFlipWatchStatus, LegacyFlipWatchStatus, RegimeType } from './types';
import { FLIP_WATCH } from './config';

export type HistoryRowForFlipWatch = {
  date: string;
  regime: RegimeType;
  stale?: boolean;
};

/**
 * Regime of the prior unique persisted trading snapshot.
 *
 * From persisted history: ignore same-or-later dates, skip stale/fail-closed
 * rows, dedupe by date (last write wins), then take the greatest earlier
 * trading date. Empty history → null. No wall-clock arithmetic.
 */
export function priorUniqueTradingRegime(
  history: ReadonlyArray<HistoryRowForFlipWatch>,
  currentAsOfDate: string
): RegimeType | null {
  const byDate = new Map<string, RegimeType>();
  for (const row of history) {
    if (!row?.date || !row.regime) continue;
    if (row.stale === true) continue;
    if (row.date >= currentAsOfDate) continue;
    byDate.set(row.date, row.regime);
  }
  if (byDate.size === 0) return null;

  let latestPrior: string | null = null;
  for (const date of byDate.keys()) {
    if (latestPrior === null || date > latestPrior) {
      latestPrior = date;
    }
  }
  return latestPrior ? (byDate.get(latestPrior) ?? null) : null;
}

/**
 * Transition telemetry from the current final regime vs the prior unique
 * persisted trading regime. No calendar-day parameter.
 *
 * New R4 compute must not emit BREWING or PENDING_CONFIRMATION.
 */
export function detectFlipWatch(
  currentRegime: RegimeType,
  previousUniqueRegime: RegimeType | null,
  riskScore: number,
  inflScore: number
): CurrentFlipWatchStatus {
  const regimeChanged =
    previousUniqueRegime !== null && previousUniqueRegime !== currentRegime;

  if (!regimeChanged) {
    return 'NONE';
  }

  const maxScore = Math.max(Math.abs(riskScore), Math.abs(inflScore));
  if (maxScore >= FLIP_WATCH.STRONG_FLIP_SCORE_THRESHOLD) {
    return 'STRONG_FLIP';
  }

  return 'REGIME_CHANGE';
}

export function isLegacyFlipWatchStatus(
  status: string | null | undefined
): status is LegacyFlipWatchStatus {
  return status === 'BREWING' || status === 'PENDING_CONFIRMATION';
}
