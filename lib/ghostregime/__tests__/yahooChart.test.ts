/**
 * Yahoo Finance chart parser (BTC-USD)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MARKET_SYMBOLS } from '../config';
import {
  buildYahooChartUrl,
  parseYahooChartBody,
  formatYahooFailureHint,
} from '../yahooChart';

describe('buildYahooChartUrl', () => {
  it('includes BTC-USD and unix period bounds', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-06-01T00:00:00Z');
    const url = buildYahooChartUrl('BTC-USD', start, end);
    assert.match(url, /BTC-USD/);
    assert.match(url, /period1=/);
    assert.match(url, /interval=1d/);
  });

  it('includes SPY ticker for ETF fallback URL construction', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-06-01T00:00:00Z');
    const url = buildYahooChartUrl('SPY', start, end);
    assert.match(url, /\/chart\/SPY\?/);
    assert.match(url, /period2=/);
  });
});

describe('parseYahooChartBody', () => {
  it('parses valid chart fixture into sorted market data points', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const json = {
      chart: {
        result: [
          {
            timestamp: [
              1704067200, // 2024-01-01
              1704153600, // 2024-01-02
              1704240000, // 2024-01-03
            ],
            indicators: {
              quote: [{ close: [42000, null, 43000] }],
            },
          },
        ],
      },
    };
    const { data, outcome } = parseYahooChartBody(MARKET_SYMBOLS.BTC_USD, json, start, end);
    assert.strictEqual(outcome, 'chart_ok');
    assert.strictEqual(data.length, 2);
    assert.strictEqual(data[0].close, 42000);
    assert.strictEqual(data[1].close, 43000);
    assert.strictEqual(data[0].symbol, MARKET_SYMBOLS.BTC_USD);
    assert.ok(data[1].date.getTime() > data[0].date.getTime());
    assert.ok(typeof data[1].returns === 'number');
  });

  it('rejects missing result', () => {
    const r = parseYahooChartBody(
      MARKET_SYMBOLS.BTC_USD,
      { chart: { result: [] } },
      new Date(),
      new Date()
    );
    assert.strictEqual(r.outcome, 'missing_result');
    assert.strictEqual(r.data.length, 0);
  });

  it('rejects missing timestamps', () => {
    const r = parseYahooChartBody(
      MARKET_SYMBOLS.BTC_USD,
      { chart: { result: [{ indicators: { quote: [{ close: [1] }] } }] } },
      new Date(),
      new Date()
    );
    assert.strictEqual(r.outcome, 'missing_timestamps');
  });

  it('rejects missing close array', () => {
    const r = parseYahooChartBody(
      MARKET_SYMBOLS.BTC_USD,
      { chart: { result: [{ timestamp: [1704067200] }] } },
      new Date(),
      new Date()
    );
    assert.strictEqual(r.outcome, 'missing_close');
  });

  it('returns zero_valid_rows when all closes are null', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-10T23:59:59Z');
    const json = {
      chart: {
        result: [
          {
            timestamp: [1704067200, 1704153600],
            indicators: { quote: [{ close: [null, null] }] },
          },
        ],
      },
    };
    const r = parseYahooChartBody(MARKET_SYMBOLS.BTC_USD, json, start, end);
    assert.strictEqual(r.outcome, 'zero_valid_rows');
  });
});

describe('formatYahooFailureHint', () => {
  it('describes http_not_ok', () => {
    const s = formatYahooFailureHint({
      request_url_display: 'x',
      http_status: 503,
      outcome: 'http_not_ok',
      body_preview: 'error',
    });
    assert.match(s, /503/);
  });
});
