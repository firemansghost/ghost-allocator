/**
 * Scheduled refresh preflight — skip market fetch when persisted latest is fresh.
 * Freshness aligns with `/api/ghostregime/health` (max_age_days = 4).
 */

import { parseISO, differenceInDays, formatISO } from 'date-fns';
import type { GhostRegimeRow } from './types';

/** Same standard as `app/api/ghostregime/health/route.ts` */
export const GHOSTREGIME_HEALTH_MAX_AGE_DAYS = 4;

export type ScheduledPreflightDenyReason =
  | 'missing_latest'
  | 'latest_stale'
  | 'schema_outdated'
  | 'snapshot_too_old';

export interface ScheduledRefreshPreflightResult {
  /** When true, serve persisted latest without calling market providers */
  shouldSkipFetch: boolean;
  denyReason?: ScheduledPreflightDenyReason;
  ageDays?: number;
  maxAgeDays: number;
}

/** Schema guard — must match engine `isRowOutdated` checks */
export function isPersistedRowSchemaOutdated(row: GhostRegimeRow | null): boolean {
  if (!row) return false;
  return (
    !row.infl_total_score_pre_tiebreak ||
    !row.row_computed_at_utc ||
    !row.row_build_commit ||
    !row.row_engine_version
  );
}

/** Calendar age from snapshot date to run date (UTC midnight), matching health endpoint */
export function computeSnapshotAgeDays(runDateUtc: Date, snapshotDateStr: string): number {
  const latestDate = parseISO(snapshotDateStr);
  const todayUtc = new Date(runDateUtc);
  todayUtc.setUTCHours(0, 0, 0, 0);
  const latestDateUtc = new Date(latestDate);
  latestDateUtc.setUTCHours(0, 0, 0, 0);
  return differenceInDays(todayUtc, latestDateUtc);
}

export function isSnapshotFreshByHealthStandard(
  ageDays: number,
  maxAgeDays: number = GHOSTREGIME_HEALTH_MAX_AGE_DAYS
): boolean {
  return ageDays <= maxAgeDays;
}

/**
 * Evaluate whether scheduled cron may return persisted latest without market fetch.
 */
export function evaluateScheduledRefreshPreflight(
  latest: GhostRegimeRow | null,
  runDateUtc: Date,
  maxAgeDays: number = GHOSTREGIME_HEALTH_MAX_AGE_DAYS
): ScheduledRefreshPreflightResult {
  if (!latest) {
    return { shouldSkipFetch: false, denyReason: 'missing_latest', maxAgeDays };
  }
  if (latest.stale === true) {
    return { shouldSkipFetch: false, denyReason: 'latest_stale', maxAgeDays };
  }
  if (isPersistedRowSchemaOutdated(latest)) {
    return { shouldSkipFetch: false, denyReason: 'schema_outdated', maxAgeDays };
  }

  const ageDays = computeSnapshotAgeDays(runDateUtc, latest.date);
  if (!isSnapshotFreshByHealthStandard(ageDays, maxAgeDays)) {
    return {
      shouldSkipFetch: false,
      denyReason: 'snapshot_too_old',
      ageDays,
      maxAgeDays,
    };
  }

  return { shouldSkipFetch: true, ageDays, maxAgeDays };
}

/** Build a recent snapshot date string for tests (UTC date) */
export function formatRunDateUtc(date: Date): string {
  return formatISO(date, { representation: 'date' });
}
