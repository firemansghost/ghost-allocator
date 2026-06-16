/**
 * Serve-time metadata for GhostRegime API responses — honesty about refresh vs carry-forward.
 */

import { formatISO, parseISO, differenceInCalendarDays } from 'date-fns';
import type { GhostRegimeRow, GhostRegimeServeMetadata } from './types';
import type { ProviderDiagnostics } from './marketData';

/** Calendar days from market snapshot date to this request's run date (UTC date). */
export function computeMarketSnapshotLagDays(runDateUtc: Date, snapshotDateStr: string): number {
  const runDay = parseISO(`${formatISO(runDateUtc, { representation: 'date' })}T12:00:00.000Z`);
  const snapDay = parseISO(`${snapshotDateStr}T12:00:00.000Z`);
  return differenceInCalendarDays(runDay, snapDay);
}

export function extractRefreshErrorSummary(pd?: ProviderDiagnostics): string | undefined {
  if (!pd) return undefined;
  const btc = pd.btc_probe;
  if (btc && !btc.bootstrap_capable_succeeded) {
    const attemptLine = btc.provider_attempts
      .map((a) => `${a.provider}:${a.outcome}/${a.rows}`)
      .join(' → ');
    const flags: string[] = [];
    if (btc.coingecko_public_lookback_limited) flags.push('coingecko_public_lookback_limited');
    if (btc.coingecko_public_lookback_exceeded) flags.push('coingecko_public_lookback_exceeded');
    const range =
      btc.oldest_date && btc.newest_date ? ` ${btc.oldest_date}..${btc.newest_date}` : '';
    return `BTC fetch failed (${attemptLine}; obs=${btc.obs_in_fetch}${range}${flags.length ? `; ${flags.join(',')}` : ''})`.slice(
      0,
      400
    );
  }
  const errVals = Object.values(pd.errors).filter((e): e is string => Boolean(e && String(e).trim()));
  if (errVals.length > 0) {
    return errVals[0].slice(0, 400);
  }
  const probe = pd.stooq_probe;
  if (!probe) return undefined;
  for (const p of Object.values(probe)) {
    if (p.outcome && p.outcome !== 'csv_ok') {
      const hint = (p.body_preview || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      return `stooq:${p.outcome}${hint ? ` — ${hint}` : ''}`;
    }
  }
  return undefined;
}

export function buildServeMetadata(input: {
  runDateUtc: Date;
  row: Pick<GhostRegimeRow, 'date'>;
  force: boolean;
  scheduled?: boolean;
  refresh_outcome: GhostRegimeServeMetadata['refresh_outcome'];
  persisted_snapshot_preserved: boolean;
  stale_reason?: string;
  providerDiagnostics?: ProviderDiagnostics;
  persist_rejected_reason?: string;
}): GhostRegimeServeMetadata {
  const runStr = formatISO(input.runDateUtc, { representation: 'date' });
  const snap = input.row.date;
  const refreshAttempt: GhostRegimeServeMetadata['refresh_attempt'] = input.scheduled
    ? 'scheduled'
    : input.force
      ? 'force'
      : 'read';
  return {
    run_date_utc: runStr,
    latest_snapshot_date: snap,
    market_snapshot_lag_days: computeMarketSnapshotLagDays(input.runDateUtc, snap),
    refresh_attempt: refreshAttempt,
    refresh_outcome: input.refresh_outcome,
    persisted_snapshot_preserved: input.persisted_snapshot_preserved,
    persist_rejected_reason: input.persist_rejected_reason,
    stale_reason: input.stale_reason,
    refresh_error_summary: extractRefreshErrorSummary(input.providerDiagnostics),
  };
}

/** Merge serve_metadata onto a row (API response only; strip before any persist). */
export function attachServeMetadata(
  row: GhostRegimeRow,
  args: {
    runDateUtc: Date;
    force: boolean;
    scheduled?: boolean;
    refresh_outcome: GhostRegimeServeMetadata['refresh_outcome'];
    persisted_snapshot_preserved: boolean;
    stale_reason?: string;
    providerDiagnostics?: ProviderDiagnostics;
    persist_rejected_reason?: string;
  }
): GhostRegimeRow {
  return {
    ...row,
    serve_metadata: buildServeMetadata({
      runDateUtc: args.runDateUtc,
      row,
      force: args.force,
      scheduled: args.scheduled,
      refresh_outcome: args.refresh_outcome,
      persisted_snapshot_preserved: args.persisted_snapshot_preserved,
      stale_reason: args.stale_reason,
      providerDiagnostics: args.providerDiagnostics,
      persist_rejected_reason: args.persist_rejected_reason,
    }),
  };
}
