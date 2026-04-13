/**
 * Marketstack EOD fallback helpers (parsing + symbol eligibility)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isMarketstackEtfFallbackSymbol,
  parseMarketstackEodBody,
  formatMarketstackFailureHint,
  MARKETSTACK_ETF_FALLBACK_SYMBOLS,
} from '../marketstackEod';

describe('MARKETSTACK_ETF_FALLBACK_SYMBOLS', () => {
  it('covers core ETFs but not BTC or PDBC', () => {
    assert.strictEqual(MARKETSTACK_ETF_FALLBACK_SYMBOLS.has('SPY'), true);
    assert.strictEqual(MARKETSTACK_ETF_FALLBACK_SYMBOLS.has('GLD'), true);
    assert.strictEqual(isMarketstackEtfFallbackSymbol('BTC-USD'), false);
    assert.strictEqual(isMarketstackEtfFallbackSymbol('PDBC'), false);
  });
});

describe('parseMarketstackEodBody', () => {
  it('filters to fetch window and computes returns', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const json = {
      data: [
        { date: '2023-12-01T00:00:00+0000', close: 100, symbol: 'SPY' },
        { date: '2024-01-05T00:00:00+0000', close: 110, symbol: 'SPY' },
        { date: '2024-01-08T00:00:00+0000', close: 99, symbol: 'SPY' },
        { date: '2024-01-15T00:00:00+0000', close: 120, symbol: 'SPY' },
      ],
    };
    const { points, apiError } = parseMarketstackEodBody('SPY', json, start, end);
    assert.strictEqual(apiError, undefined);
    assert.strictEqual(points.length, 2);
    assert.strictEqual(points[0].close, 110);
    assert.strictEqual(points[1].close, 99);
    assert.strictEqual(points[1].returns < 0, true);
  });

  it('returns API error when top-level error object present', () => {
    const json = { error: { code: 'invalid_access_key', message: 'bad key' } };
    const r = parseMarketstackEodBody('SPY', json, new Date(), new Date());
    assert.strictEqual(r.points.length, 0);
    assert.strictEqual(r.apiError, 'bad key');
  });
});

describe('formatMarketstackFailureHint', () => {
  it('summarizes missing key', () => {
    const s = formatMarketstackFailureHint({
      request_display: 'x',
      http_status: 0,
      outcome: 'missing_access_key',
    });
    assert.ok(s.includes('MARKETSTACK_ACCESS_KEY'));
  });
});
