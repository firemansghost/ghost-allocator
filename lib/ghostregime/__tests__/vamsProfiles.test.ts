/**
 * VAMS profiles: synthetic fixtures, no network.
 */

import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import {
  VAMS_PROFILE_CLOSER_PARITY,
  VAMS_PROFILE_PRODUCTION,
  compareVamsProfiles,
  evaluateVamsProfile,
} from '../vamsProfiles';

const N = 280;

function series(symbol: string, n: number, close: (i: number) => number): MarketDataPoint[] {
  const base = new Date('2022-06-01T12:00:00.000Z');
  const out: MarketDataPoint[] = [];
  let prevClose: number | null = null;
  for (let i = 0; i < n; i++) {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + i);
    const c = close(i);
    const ret =
      prevClose !== null && prevClose !== 0 ? (c - prevClose) / prevClose : 0;
    out.push({ symbol, date, close: c, returns: ret });
    prevClose = c;
  }
  return out;
}

function merge(...chunks: MarketDataPoint[][]): MarketDataPoint[] {
  return chunks.flat().sort((a, b) => {
    const t = a.date.getTime() - b.date.getTime();
    return t !== 0 ? t : a.symbol.localeCompare(b.symbol);
  });
}

function lastDate(data: MarketDataPoint[]): Date {
  return data[data.length - 1]!.date;
}

void (async function run() {
  const drift = (i: number) => 100 + i * 0.05;
  const aligned = merge(
    series('SPY', N, drift),
    series('VT', N, drift),
    series('GLD', N, drift),
    series('GLDM', N, drift),
    series('BTC-USD', N, drift),
    series('FBTC', N, drift)
  );
  const asof = lastDate(aligned);

  const cmp = compareVamsProfiles(aligned, asof);
  assert.ok(cmp.asofDate);
  assert.strictEqual(cmp.production.stocks.symbol, VAMS_PROFILE_PRODUCTION.stocks);
  assert.strictEqual(cmp.closerParity.gold.symbol, VAMS_PROFILE_CLOSER_PARITY.gold);
  assert.strictEqual(cmp.divergence.stocks.statesEqual, true);
  assert.strictEqual(cmp.divergence.gold.statesEqual, true);
  assert.strictEqual(cmp.divergence.btc.statesEqual, true);
  assert.ok(Math.abs(cmp.divergence.stocks.scoreDelta) < 1e-9);
  assert.ok(Math.abs(cmp.divergence.gold.scoreDelta) < 1e-9);
  assert.ok(Math.abs(cmp.divergence.btc.scoreDelta) < 1e-9);

  const prodOnly = evaluateVamsProfile(aligned, VAMS_PROFILE_PRODUCTION, asof);
  assert.strictEqual(typeof prodOnly.stocks.score, 'number');
  assert.strictEqual(typeof prodOnly.stocks.state, 'number');
  assert.strictEqual(typeof prodOnly.stocks.scale, 'number');

  const strongTrend = (i: number) => 80 + i * 0.4;
  const flat = () => 100;
  const divergentStocks = merge(
    series('SPY', N, strongTrend),
    series('VT', N, flat),
    series('GLD', N, drift),
    series('GLDM', N, drift),
    series('BTC-USD', N, drift),
    series('FBTC', N, drift)
  );
  const cmp2 = compareVamsProfiles(divergentStocks, lastDate(divergentStocks));
  assert.ok(
    cmp2.production.stocks.score !== cmp2.closerParity.stocks.score,
    'expected SPY (trend) vs VT (flat → zero vol path) to yield different VAMS scores'
  );

  console.log('vamsProfiles.test.ts: ok');
})();
