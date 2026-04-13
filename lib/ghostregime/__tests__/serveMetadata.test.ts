/**
 * Serve metadata helpers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeMarketSnapshotLagDays, extractRefreshErrorSummary } from '../serveMetadata';
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
  it('prefers first provider errors string', () => {
    const pd: ProviderDiagnostics = {
      resolvedIds: {},
      errors: { SPY: 'Stooq gate' },
      proxies: {},
    };
    assert.strictEqual(extractRefreshErrorSummary(pd), 'Stooq gate');
  });
});
