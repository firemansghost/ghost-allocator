/**
 * Serve metadata helpers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeMarketSnapshotLagDays, extractRefreshErrorSummary, buildServeMetadata } from '../serveMetadata';
import type { ProviderDiagnostics } from '../marketData';

describe('computeMarketSnapshotLagDays', () => {
  it('returns 0 when run and snapshot share the same UTC calendar date', () => {
    const run = new Date('2025-04-13T15:00:00.000Z');
    assert.strictEqual(computeMarketSnapshotLagDays(run, '2025-04-13'), 0);
  });

  it('returns positive days when run is after snapshot', () => {
    const run = new Date('2025-04-15T12:00:00.000Z');
    assert.strictEqual(computeMarketSnapshotLagDays(run, '2025-04-10'), 5);
  });
});

describe('extractRefreshErrorSummary', () => {
  it('prefers BTC probe summary when bootstrap failed', () => {
    const pd: ProviderDiagnostics = {
      resolvedIds: {},
      errors: { 'BTC-USD': 'chain failed' },
      proxies: {},
      btc_probe: {
        provider_attempts: [
          { provider: 'yahoo', outcome: 'zero_valid_rows', rows: 0 },
          { provider: 'stooq', outcome: 'stooq_browser_challenge', rows: 0 },
        ],
        oldest_date: null,
        newest_date: null,
        obs_in_fetch: 0,
        coingecko_public_lookback_exceeded: true,
        bootstrap_capable_succeeded: false,
      },
    };
    const s = extractRefreshErrorSummary(pd);
    assert.ok(s?.includes('BTC fetch failed'));
    assert.ok(s?.includes('coingecko_public_lookback_exceeded'));
  });

  it('falls back to first provider errors string when BTC ok', () => {
    const pd: ProviderDiagnostics = {
      resolvedIds: {},
      errors: { SPY: 'Stooq gate' },
      proxies: {},
    };
    assert.strictEqual(extractRefreshErrorSummary(pd), 'Stooq gate');
  });
});

describe('buildServeMetadata scheduled', () => {
  it('sets refresh_attempt scheduled and preserves outcome', () => {
    const run = new Date('2026-06-15T03:30:00.000Z');
    const meta = buildServeMetadata({
      runDateUtc: run,
      row: { date: '2026-06-12' },
      force: false,
      scheduled: true,
      refresh_outcome: 'scheduled_served_persisted_no_fetch',
      persisted_snapshot_preserved: true,
    });
    assert.strictEqual(meta.refresh_attempt, 'scheduled');
    assert.strictEqual(meta.refresh_outcome, 'scheduled_served_persisted_no_fetch');
    assert.ok(meta.market_snapshot_lag_days >= 2);
  });
});
