/**
 * Marketstack EOD fallback helpers (parsing + symbol eligibility + guard)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  isMarketstackEtfFallbackSymbol,
  parseMarketstackEodBody,
  formatMarketstackFailureHint,
  fetchMarketstackEod,
  MARKETSTACK_ETF_FALLBACK_SYMBOLS,
} from '../marketstackEod';

const GUARD_ENV_KEYS = [
  'DISABLE_MARKETSTACK_FALLBACK',
  'NODE_ENV',
  'VERCEL_ENV',
  'NEXT_PHASE',
  'ALLOW_MARKETSTACK_FALLBACK',
  'MARKETSTACK_ACCESS_KEY',
] as const;

const saved: Partial<Record<(typeof GUARD_ENV_KEYS)[number], string | undefined>> = {};

function saveEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
}

function setAllowedMarketstackEnv(): void {
  process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
  delete process.env.NODE_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PHASE;
  delete process.env.DISABLE_MARKETSTACK_FALLBACK;
}

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

  it('summarizes guard_blocked without secrets', () => {
    const s = formatMarketstackFailureHint({
      request_display: '(guard blocked)',
      http_status: 0,
      outcome: 'guard_blocked',
      guard_reason: 'marketstack_disabled_by_guard',
    });
    assert.ok(s.includes('ALLOW_MARKETSTACK_FALLBACK'));
    assert.ok(!s.includes('access_key='));
  });
});

describe('fetchMarketstackEod guard', () => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;

  afterEach(() => {
    restoreEnv();
    global.fetch = originalFetch;
    fetchCalls = 0;
  });

  it('returns guard_blocked without calling fetch when ALLOW is unset', async () => {
    saveEnv();
    for (const key of GUARD_ENV_KEYS) {
      delete process.env[key];
    }
    process.env.MARKETSTACK_ACCESS_KEY = 'secret-key-must-not-appear';

    global.fetch = (() => {
      fetchCalls += 1;
      throw new Error('fetch should not be called');
    }) as typeof fetch;

    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-05T00:00:00Z');
    const r = await fetchMarketstackEod('SPY', start, end, 'secret-key-must-not-appear');

    assert.strictEqual(fetchCalls, 0);
    assert.strictEqual(r.data.length, 0);
    assert.strictEqual(r.debug.outcome, 'guard_blocked');
    assert.strictEqual(r.debug.guard_reason, 'marketstack_disabled_by_guard');
    assert.ok(!JSON.stringify(r.debug).includes('secret-key-must-not-appear'));
  });

  it('calls fetch when ALLOW=true and env is clean (mocked)', async () => {
    saveEnv();
    for (const key of GUARD_ENV_KEYS) {
      delete process.env[key];
    }
    setAllowedMarketstackEnv();

    const fixture = {
      data: [{ date: '2024-01-05T00:00:00+0000', close: 110, symbol: 'SPY' }],
      pagination: { total: 1 },
    };

    global.fetch = (async () => {
      fetchCalls += 1;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(fixture),
      } as Response;
    }) as typeof fetch;

    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const r = await fetchMarketstackEod('SPY', start, end, 'mock-key');

    assert.strictEqual(fetchCalls, 1);
    assert.strictEqual(r.debug.outcome, 'ok');
    assert.strictEqual(r.data.length, 1);
    assert.ok(!r.debug.request_display.includes('mock-key'));
  });
});
