/**
 * Tests for getMaxTargets and % of max exposure math
 * Locks down display helpers for Max vs Today targets clarity
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getMaxTargets, pctOfMax } from '../ui';

describe('getMaxTargets', () => {
  it('returns 60/30/10 (0.6, 0.3, 0.1)', () => {
    const m = getMaxTargets();
    assert.strictEqual(m.stocks, 0.6, 'Max stocks should be 0.6');
    assert.strictEqual(m.gold, 0.3, 'Max gold should be 0.3');
    assert.strictEqual(m.btc, 0.1, 'Max BTC should be 0.1');
  });
});

describe('pctOfMax', () => {
  it('actual 0.30/0.30/0.0 with max 0.6/0.3/0.1: stocks 50%, gold 100%, btc 0%', () => {
    const max = getMaxTargets();
    const stocksPct = pctOfMax(0.30, max.stocks);
    const goldPct = pctOfMax(0.30, max.gold);
    const btcPct = pctOfMax(0, max.btc);

    assert.ok(Math.abs(stocksPct - 50) < 0.1, `Stocks % of max should be ~50%, got ${stocksPct}`);
    assert.strictEqual(goldPct, 100, 'Gold at max target = 100% of max');
    assert.strictEqual(btcPct, 0, 'BTC at 0 = 0% of max');
  });
});
