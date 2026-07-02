/**
 * Serve metadata helpers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeMarketSnapshotLagDays, extractRefreshErrorSummary, buildServeMetadata, buildEtfProviderRoutingSummary } from '../serveMetadata';
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

describe('buildEtfProviderRoutingSummary', () => {
  it('summarizes Yahoo ETF fallback when Stooq failed', () => {
    const pd: ProviderDiagnostics = {
      resolvedIds: {
        SPY: 'yahoo:SPY',
        GLD: 'yahoo:GLD',
        HYG: 'yahoo:HYG',
        IEF: 'yahoo:IEF',
        EEM: 'yahoo:EEM',
        TIP: 'yahoo:TIP',
        TLT: 'yahoo:TLT',
        UUP: 'yahoo:UUP',
      },
      errors: {},
      proxies: {},
      stooq_probe: {
        SPY: {
          request_url_display: 'x',
          http_status: 200,
          content_type: 'text/html',
          body_preview: 'javascript',
          outcome: 'stooq_browser_challenge',
        },
      },
      feed_routing: {
        SPY: 'Stooq (stooq_browser_challenge) → Yahoo (chart_ok, rows=421)',
      },
    };
    const summary = buildEtfProviderRoutingSummary(pd);
    assert.strictEqual(summary?.marketstack_used, false);
    assert.strictEqual(summary?.yahoo_etf_fallback_used, true);
    assert.strictEqual(summary?.stooq_browser_challenge_detected, true);
    assert.strictEqual(summary?.symbols.find((s) => s.symbol === 'SPY')?.provider, 'Yahoo');
  });

  it('detects Marketstack emergency fallback', () => {
    const pd: ProviderDiagnostics = {
      resolvedIds: { SPY: 'marketstack:SPY', GLD: 'yahoo:GLD' },
      errors: {},
      proxies: {},
      feed_routing: {
        SPY: 'Stooq (stooq_apikey_gate) → Yahoo (missing_result, rows=0) → Marketstack (ok, rows=400)',
        GLD: 'Stooq (stooq_browser_challenge) → Yahoo (chart_ok, rows=421)',
      },
    };
    const summary = buildEtfProviderRoutingSummary(pd);
    assert.strictEqual(summary?.marketstack_used, true);
    assert.strictEqual(summary?.yahoo_etf_fallback_used, true);
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
