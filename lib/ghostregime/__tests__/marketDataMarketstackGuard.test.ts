/**
 * Marketstack fallback guard in DefaultMarketDataProvider (mocked fetch only)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { MARKET_SYMBOLS } from '../config';
import { DefaultMarketDataProvider } from '../marketData';

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

function clearGuardEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    delete process.env[key];
  }
}

function setAllowedMarketstackEnv(): void {
  process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
  delete process.env.NODE_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PHASE;
  delete process.env.DISABLE_MARKETSTACK_FALLBACK;
}

const STOOQ_GATE_BODY = `Get your apikey:

1. Open https://stooq.com/q/d/?s=spy.us&get_apikey
`;

const MARKETSTACK_FIXTURE = {
  data: [
    { date: '2024-01-02T00:00:00+0000', close: 100, symbol: 'SPY' },
    { date: '2024-01-03T00:00:00+0000', close: 101, symbol: 'SPY' },
  ],
  pagination: { total: 2 },
};

describe('DefaultMarketDataProvider Marketstack guard', () => {
  const originalFetch = global.fetch;
  const requestedUrls: string[] = [];

  afterEach(() => {
    restoreEnv();
    global.fetch = originalFetch;
    requestedUrls.length = 0;
  });

  it('does not request Marketstack when Stooq fails, key exists, ALLOW unset', async () => {
    saveEnv();
    clearGuardEnv();
    process.env.MARKETSTACK_ACCESS_KEY = 'secret-should-not-leak';

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return { ok: true, status: 200, headers: new Headers(), text: async () => STOOQ_GATE_BODY } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    await provider.getHistoricalPrices([MARKET_SYMBOLS.SPY], start, end);

    const diag = provider.getDiagnostics();
    assert.ok(requestedUrls.every((u) => !u.includes('api.marketstack.com')));
    assert.strictEqual(diag.marketstack_probe?.[MARKET_SYMBOLS.SPY]?.outcome, 'guard_blocked');
    assert.strictEqual(
      diag.marketstack_probe?.[MARKET_SYMBOLS.SPY]?.guard_reason,
      'marketstack_disabled_by_guard'
    );
    const blob = JSON.stringify(diag);
    assert.ok(!blob.includes('secret-should-not-leak'));
    assert.ok(!blob.includes('access_key='));
  });

  it('requests mocked Marketstack when ALLOW=true, key set, Stooq fails', async () => {
    saveEnv();
    clearGuardEnv();
    setAllowedMarketstackEnv();
    process.env.MARKETSTACK_ACCESS_KEY = 'mock-ms-key';

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return { ok: true, status: 200, headers: new Headers(), text: async () => STOOQ_GATE_BODY } as Response;
      }
      if (url.includes('api.marketstack.com')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(MARKETSTACK_FIXTURE),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const data = await provider.getHistoricalPrices([MARKET_SYMBOLS.SPY], start, end);

    assert.ok(requestedUrls.some((u) => u.includes('api.marketstack.com')));
    assert.ok(data.length > 0);
    const diag = provider.getDiagnostics();
    assert.strictEqual(diag.resolvedIds[MARKET_SYMBOLS.SPY], 'marketstack:SPY');
    assert.ok(!JSON.stringify(diag).includes('mock-ms-key'));
  });

  it('does not fetch Marketstack when ALLOW=true but key missing', async () => {
    saveEnv();
    clearGuardEnv();
    setAllowedMarketstackEnv();
    delete process.env.MARKETSTACK_ACCESS_KEY;

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return { ok: true, status: 200, headers: new Headers(), text: async () => STOOQ_GATE_BODY } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    await provider.getHistoricalPrices([MARKET_SYMBOLS.SPY], start, end);

    assert.ok(requestedUrls.every((u) => !u.includes('api.marketstack.com')));
    const diag = provider.getDiagnostics();
    assert.strictEqual(
      diag.marketstack_probe?.[MARKET_SYMBOLS.SPY]?.guard_reason,
      'marketstack_key_missing'
    );
  });
});
