/**
 * R6 CHARACTERIZATION — remaining product-truth behavior
 *
 * R6A repaired (see r6aUiTruth.test.ts):
 *   - VAMS half-size is never described as off
 *   - vote=0 user display is Neutral (persisted direction may still store a side)
 *   - rounded headline totals remain coherent
 *   - primary-driver agreement thresholds use 0–100 units
 *   - allocation default is Exposure
 *
 * Historical T0 (pre-R6B, characterized then deferred):
 *   - "Coverage" public label
 *   - tie-break receipts entered Agreement / Coverage / Confidence / Conviction /
 *     Crowded / Top Drivers / Compare
 *
 * R6B approved contract (this file now locks the desired behavior):
 *   - public name is Participation, not Coverage
 *   - formula remains non-neutral evidence / present evidence
 *   - tie-breaks are resolution, not evidence
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint, SignalReceipt } from '../types';
import { computeOptionBVotes } from '../regimeCore';
import { computeAxisStats, formatScaleLabel } from '../ui';
import { MARKET_SYMBOLS } from '../config';
import { PARTICIPATION_TOOLTIP } from '../ghostregimePageCopy';

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

describe('R6 CHARACTERIZATION — R6B participation / receipt contract', () => {
  it('vote-0 inflation receipts are still persisted with a side, not Neutral', () => {
    const result = computeOptionBVotes(flatMarket(), undefined, true);
    const pdbc = result.inflation_receipts.find((r) => r.key === 'pdbc');
    assert.ok(pdbc);
    assert.strictEqual(pdbc.vote, 0);
    assert.notStrictEqual(pdbc.direction, 'Neutral');
    assert.ok(pdbc.direction === 'Inflation' || pdbc.direction === 'Disinflation');
  });

  it('Participation uses non-neutral evidence / present evidence (historical Coverage formula, new name)', () => {
    const receipts: SignalReceipt[] = [
      { key: 'a', label: 'A', vote: 0, direction: 'Disinflation' },
      { key: 'b', label: 'B', vote: 1, direction: 'Inflation' },
      { key: 'c', label: 'C', vote: -1, direction: 'Disinflation' },
    ];
    const stats = computeAxisStats(receipts, 'Inflation');
    assert.strictEqual(stats.totalSignals, 3);
    assert.strictEqual(stats.nonNeutral, 2);
    assert.ok(stats.participationLabel.includes('2/3'));
    assert.ok(stats.participationLabel.startsWith('Participation:'));
    assert.doesNotMatch(stats.participationLabel, /Coverage/);
    assert.match(PARTICIPATION_TOOLTIP, /evidence/i);
  });

  it('formatScaleLabel maps 0.5 → half size and 0 → off (helper contract)', () => {
    assert.strictEqual(formatScaleLabel(1), 'full size');
    assert.strictEqual(formatScaleLabel(0.5), 'half size');
    assert.strictEqual(formatScaleLabel(0), 'off');
  });
});
