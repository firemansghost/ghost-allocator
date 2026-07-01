/**
 * Yahoo ETF fallback in DefaultMarketDataProvider (mocked fetch only)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { MARKET_SYMBOLS } from '../config';
import { DefaultMarketDataProvider } from '../marketData';

const ENV_KEYS = [
  'DISABLE_MARKETSTACK_FALLBACK',
  'NODE_ENV',
  'VERCEL_ENV',
  'NEXT_PHASE',
  'ALLOW_MARKETSTACK_FALLBACK',
  'MARKETSTACK_ACCESS_KEY',
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

function saveEnv(): void {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
}

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

const STOOQ_BROWSER_CHALLENGE = `<!DOCTYPE html><html><body>Please enable JavaScript to verify your browser.</body></html>`;

function spyYahooFixture(symbol: string, rows: Array<{ ts: number; close: number }>) {
  return {
    chart: {
      result: [
        {
          timestamp: rows.map((r) => r.ts),
          indicators: { quote: [{ close: rows.map((r) => r.close) }] },
        },
      ],
    },
  };
}

const SPY_YAHOO_OK = spyYahooFixture('SPY', [
  { ts: 1704153600, close: 470 },
  { ts: 1704240000, close: 471 },
]);

describe('DefaultMarketDataProvider Yahoo ETF fallback', () => {
  const originalFetch = global.fetch;
  const requestedUrls: string[] = [];

  afterEach(() => {
    restoreEnv();
    global.fetch = originalFetch;
    requestedUrls.length = 0;
  });

  it('Stooq browser challenge triggers Yahoo ETF fallback with normalized rows', async () => {
    saveEnv();
    clearEnv();

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => STOOQ_BROWSER_CHALLENGE,
        } as Response;
      }
      if (url.includes('query1.finance.yahoo.com') && url.includes('/SPY')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(SPY_YAHOO_OK),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const data = await provider.getHistoricalPrices([MARKET_SYMBOLS.SPY], start, end);

    assert.ok(requestedUrls.some((u) => u.includes('query1.finance.yahoo.com')));
    assert.ok(requestedUrls.every((u) => !u.includes('api.marketstack.com')));
    assert.strictEqual(data.length, 2);
    assert.strictEqual(data[0].symbol, MARKET_SYMBOLS.SPY);
    assert.ok(typeof data[0].close === 'number');

    const diag = provider.getDiagnostics();
    assert.strictEqual(diag.resolvedIds[MARKET_SYMBOLS.SPY], 'yahoo:SPY');
    assert.strictEqual(diag.yahoo_probe?.[MARKET_SYMBOLS.SPY]?.outcome, 'chart_ok');
    assert.strictEqual(diag.yahoo_probe?.[MARKET_SYMBOLS.SPY]?.rows_parsed, 2);
    assert.match(
      diag.feed_routing?.[MARKET_SYMBOLS.SPY] ?? '',
      /Stooq \(stooq_browser_challenge\) → Yahoo \(chart_ok, rows=2\)/
    );
  });

  it('Yahoo success prevents Marketstack call even when ALLOW=true', async () => {
    saveEnv();
    clearEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.MARKETSTACK_ACCESS_KEY = 'secret-should-not-leak';

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => STOOQ_BROWSER_CHALLENGE,
        } as Response;
      }
      if (url.includes('query1.finance.yahoo.com') && url.includes('/GLD')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify(
              spyYahooFixture('GLD', [{ ts: 1704153600, close: 180 }])
            ),
        } as Response;
      }
      if (url.includes('api.marketstack.com')) {
        throw new Error('Marketstack should not be called when Yahoo succeeds');
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    await provider.getHistoricalPrices([MARKET_SYMBOLS.GLD], start, end);

    assert.ok(requestedUrls.every((u) => !u.includes('api.marketstack.com')));
    const diag = provider.getDiagnostics();
    assert.strictEqual(diag.resolvedIds[MARKET_SYMBOLS.GLD], 'yahoo:GLD');
    assert.ok(!JSON.stringify(diag).includes('secret-should-not-leak'));
  });

  it('Yahoo failure + ALLOW unset fails closed with actionable diagnostics', async () => {
    saveEnv();
    clearEnv();
    process.env.MARKETSTACK_ACCESS_KEY = 'secret-should-not-leak';

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => STOOQ_BROWSER_CHALLENGE,
        } as Response;
      }
      if (url.includes('query1.finance.yahoo.com')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ chart: { result: [] } }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const provider = new DefaultMarketDataProvider();
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const data = await provider.getHistoricalPrices([MARKET_SYMBOLS.SPY], start, end);

    assert.strictEqual(data.length, 0);
    assert.ok(requestedUrls.every((u) => !u.includes('api.marketstack.com')));

    const diag = provider.getDiagnostics();
    assert.strictEqual(diag.yahoo_probe?.[MARKET_SYMBOLS.SPY]?.outcome, 'missing_result');
    assert.strictEqual(diag.marketstack_probe?.[MARKET_SYMBOLS.SPY]?.outcome, 'guard_blocked');
    assert.strictEqual(
      diag.marketstack_probe?.[MARKET_SYMBOLS.SPY]?.guard_reason,
      'marketstack_disabled_by_guard'
    );
    assert.match(diag.feed_routing?.[MARKET_SYMBOLS.SPY] ?? '', /→ Yahoo \(missing_result, rows=0\)/);
    assert.match(diag.feed_routing?.[MARKET_SYMBOLS.SPY] ?? '', /→ Marketstack \(guard_blocked\)/);
    assert.ok(diag.errors?.[MARKET_SYMBOLS.SPY]?.includes('Yahoo'));
  });

  it('Yahoo failure + ALLOW=true reaches Marketstack emergency fallback', async () => {
    saveEnv();
    clearEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.MARKETSTACK_ACCESS_KEY = 'mock-ms-key';

    const MARKETSTACK_FIXTURE = {
      data: [{ date: '2024-01-02T00:00:00+0000', close: 100, symbol: 'SPY' }],
      pagination: { total: 1 },
    };

    global.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('stooq.com')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => STOOQ_BROWSER_CHALLENGE,
        } as Response;
      }
      if (url.includes('query1.finance.yahoo.com')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ chart: { result: [] } }),
        } as Response;
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
    assert.match(diag.feed_routing?.[MARKET_SYMBOLS.SPY] ?? '', /Yahoo \(missing_result, rows=0\)/);
    assert.match(diag.feed_routing?.[MARKET_SYMBOLS.SPY] ?? '', /Marketstack \(ok/);
  });
});
