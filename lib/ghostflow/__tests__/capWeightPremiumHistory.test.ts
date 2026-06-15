/**
 * GhostFlow v1.9b.1 — cap-weight premium history research (no network).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  alignPriceSeries,
  computeReturn,
  computeRatioSeries,
  computeRollingAnnualizedSpread,
  computeRollingReturnSpread,
  minAlignedRequired,
  parsePriceCsv,
  summarizeCapWeightPremiumStudy,
  summarizeDrawdown,
} from '../research/capWeightPremiumHistory';

const __dirname = dirname(fileURLToPath(import.meta.url));
const spyFixture = readFileSync(join(__dirname, 'fixtures', 'capWeightPremiumSpy.csv'), 'utf8');
const rspFixture = readFileSync(join(__dirname, 'fixtures', 'capWeightPremiumRsp.csv'), 'utf8');

// --- adjusted close parsing ---
const spyParsed = parsePriceCsv(spyFixture);
const rspParsed = parsePriceCsv(rspFixture);
assert.strictEqual(spyParsed.priceColumnUsed, 'adjusted');
assert.strictEqual(rspParsed.priceColumnUsed, 'adjusted');
assert.ok(spyParsed.rows.length >= 50);
assert.ok(rspParsed.rows.length >= 50);

// --- close fallback (inline) ---
const closeCsv = 'Date,Close\n2024-01-02,100\n2024-01-03,101\n';
const closeParsed = parsePriceCsv(closeCsv);
assert.strictEqual(closeParsed.priceColumnUsed, 'close');
assert.strictEqual(closeParsed.rows.length, 2);

// --- alignment ---
const { aligned, skippedSpy, skippedRsp } = alignPriceSeries(spyParsed.rows, rspParsed.rows);
assert.strictEqual(aligned.length, spyParsed.rows.length);
assert.strictEqual(skippedSpy, 0);
assert.strictEqual(skippedRsp, 0);
assert.ok(aligned[0]!.date <= aligned[aligned.length - 1]!.date);

// --- safe duplicate dedupe ---
const dupCsv = 'Date,Adj Close\n2024-01-02,100\n2024-01-02,100\n2024-01-03,101\n';
const dupParsed = parsePriceCsv(dupCsv);
assert.strictEqual(dupParsed.rows.length, 2);
assert.strictEqual(dupParsed.duplicatesDropped, 1);

// --- duplicate conflict ---
assert.throws(() => parsePriceCsv('Date,Adj Close\n2024-01-02,100\n2024-01-02,101\n'), /Conflicting/);

// --- non-positive price ---
assert.throws(() => parsePriceCsv('Date,Adj Close\n2024-01-02,0\n'), /Non-positive/);

// --- rolling return ---
assert.strictEqual(computeReturn(100, 110), 10);

// --- rolling spread: SPY outperforms RSP in fixtures ---
const spread21 = computeRollingReturnSpread(aligned, 21);
assert.ok(spread21.latest != null);
assert.ok(spread21.latest! > 0, 'fixture SPY should outperform RSP');
assert.ok(spread21.spreads.length === aligned.length - 21);

// --- ratio series ---
const ratios = computeRatioSeries(aligned);
assert.ok(ratios.length === aligned.length);
assert.ok(ratios[ratios.length - 1]! > 1);

// --- annualized spread (window 252 needs 260+ aligned rows) ---
const longAligned: Array<{ date: string; spy: number; rsp: number }> = [];
let d = new Date('2020-01-02T12:00:00Z');
for (let i = 0; i < 260; i++) {
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  longAligned.push({
    date: d.toISOString().slice(0, 10),
    spy: 100 * Math.pow(1.001, i),
    rsp: 100 * Math.pow(1.0005, i),
  });
  d.setUTCDate(d.getUTCDate() + 1);
}
const ann = computeRollingAnnualizedSpread(longAligned, 252);
assert.ok(ann != null && ann > 0);

// --- drawdown ---
const dd = summarizeDrawdown([100, 110, 90, 95]);
assert.ok(dd.maxDrawdownPct < 0);
assert.ok(dd.currentDrawdownPct <= 0);

// --- percentile bounds in summary ---
const summary = summarizeCapWeightPremiumStudy({
  aligned,
  windows: [21],
  spyCsvPath: 'spy.csv',
  rspCsvPath: 'rsp.csv',
  spyPriceColumn: 'adjusted',
  rspPriceColumn: 'adjusted',
});
assert.strictEqual(summary.researchOnly, true);
assert.strictEqual(summary.studyVersion, '1.9b.1');
assert.ok(summary.latestRatioPercentile >= 0 && summary.latestRatioPercentile <= 100);
const w21 = summary.rollingWindows.find((w) => w.windowDays === 21);
assert.ok(w21?.totalReturnSpreadPct != null);
assert.ok(w21!.latestSpreadPercentile! >= 0 && w21!.latestSpreadPercentile! <= 100);

// --- insufficient overlap ---
const shortAligned = aligned.slice(0, 10);
const shortSpread = computeRollingReturnSpread(shortAligned, 21);
assert.strictEqual(shortSpread.latest, null);
assert.ok(minAlignedRequired([21]) === 22);

// --- close-only warning ---
const closeSummary = summarizeCapWeightPremiumStudy({
  aligned,
  windows: [21],
  spyCsvPath: 'spy.csv',
  rspCsvPath: 'rsp.csv',
  spyPriceColumn: 'close',
  rspPriceColumn: 'adjusted',
});
assert.ok(closeSummary.warnings.some((w) => w.includes('Close only')));

console.log('ghostflow/capWeightPremiumHistory.test.ts: ok');
