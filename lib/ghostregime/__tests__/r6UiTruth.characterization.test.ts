/**
 * R6 CHARACTERIZATION — current product-truth behavior, not desired permanent contract
 *
 * Deferred desired behavior (do not encode as R1 invariants):
 *   - neutral receipts render Neutral
 *   - coverage means data availability
 *   - VAMS half-size is never described as off
 *   - rounded headline totals remain coherent
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint, SignalReceipt } from '../types';
import { computeOptionBVotes } from '../regimeCore';
import { computeAxisStats, formatScaleLabel } from '../ui';
import { MARKET_SYMBOLS } from '../config';

function createMockData(symbol: string, closes: number[]): MarketDataPoint[] {
  const baseDate = new Date('2025-01-01');
  return closes.map((close, i) => ({
    symbol,
    date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
    close,
    returns: i > 0 ? (close - closes[i - 1]) / closes[i - 1] : 0,
  }));
}

function flatMarket(): MarketDataPoint[] {
  const symbols = [
    MARKET_SYMBOLS.SPY,
    MARKET_SYMBOLS.HYG,
    MARKET_SYMBOLS.IEF,
    MARKET_SYMBOLS.EEM,
    MARKET_SYMBOLS.PDBC,
    MARKET_SYMBOLS.TIP,
    MARKET_SYMBOLS.TLT,
    MARKET_SYMBOLS.UUP,
    MARKET_SYMBOLS.VIX,
  ];
  const out: MarketDataPoint[] = [];
  for (const symbol of symbols) {
    out.push(...createMockData(symbol, Array(80).fill(symbol === MARKET_SYMBOLS.VIX ? 20 : 100)));
  }
  return out;
}

describe('R6 CHARACTERIZATION — current receipt / coverage / scale labels', () => {
  it('vote-0 inflation receipts currently render a side, not Neutral', () => {
    const result = computeOptionBVotes(flatMarket(), undefined, true);
    const pdbc = result.inflation_receipts.find((r) => r.key === 'pdbc');
    assert.ok(pdbc);
    assert.strictEqual(pdbc.vote, 0);
    assert.notStrictEqual(pdbc.direction, 'Neutral');
    assert.ok(pdbc.direction === 'Inflation' || pdbc.direction === 'Disinflation');
  });

  it('coverage currently uses non-neutral count, not mere availability', () => {
    const receipts: SignalReceipt[] = [
      { key: 'a', label: 'A', vote: 0, direction: 'Disinflation' },
      { key: 'b', label: 'B', vote: 1, direction: 'Inflation' },
      { key: 'c', label: 'C', vote: -1, direction: 'Disinflation' },
    ];
    const stats = computeAxisStats(receipts, 'Inflation');
    assert.strictEqual(stats.totalSignals, 3);
    assert.strictEqual(stats.nonNeutral, 2);
    assert.ok(stats.coverageLabel.includes('2/3'));
  });

  it('formatScaleLabel currently maps 0.5 → half size and 0 → off (helper only)', () => {
    assert.strictEqual(formatScaleLabel(1), 'full size');
    assert.strictEqual(formatScaleLabel(0.5), 'half size');
    assert.strictEqual(formatScaleLabel(0), 'off');
  });
});
