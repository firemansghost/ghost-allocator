/**
 * GhostFlow Marketstack EOD CSV export helper — unit tests (no live API).
 */

import assert from 'node:assert/strict';
import {
  MARKETSTACK_PAGE_LIMIT,
  buildDryRunPlan,
  buildMarketstackEodUrl,
  buildProvenanceSidecar,
  estimateTotalApiCalls,
  mergeEodRows,
  parseExportArgs,
  parseMarketstackEodJson,
  rowsToCsv,
  fetchMarketstackEodPages,
} from '../research/marketstackEodExport';

// --- arg parsing ---
const args = parseExportArgs(
  ['--allow-marketstack', '--symbols', 'spy,rsp', '--date-from', '2003-01-01', '--date-to', '2026-07-01'],
  '2026-07-01'
);
assert.deepStrictEqual(args.symbols, ['SPY', 'RSP']);
assert.strictEqual(args.dateFrom, '2003-01-01');
assert.strictEqual(args.dateTo, '2026-07-01');
assert.strictEqual(args.allowMarketstack, true);
assert.strictEqual(args.dryRun, false);
assert.strictEqual(args.outDir, 'tmp/ghostflow/marketstack');

const sourceArgs = parseExportArgs(
  ['--source', 'marketstack', '--date-from', '2024-01-01', '--date-to', '2024-06-01'],
  '2026-07-01'
);
assert.strictEqual(sourceArgs.allowMarketstack, true);
assert.strictEqual(sourceArgs.dateTo, '2024-06-01');

assert.throws(() => parseExportArgs(['--allow-marketstack'], '2026-07-01'), /--date-from/);
assert.throws(
  () => parseExportArgs(['--date-from', '2026-07-02', '--date-to', '2026-07-01', '--allow-marketstack'], '2026-07-01'),
  /date-from/
);

// --- URL construction (redacted key) ---
const url = buildMarketstackEodUrl({
  accessKey: 'secret-key',
  symbol: 'SPY',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  offset: 0,
  redactKey: true,
});
assert.ok(url.includes('api.marketstack.com/v1/eod'));
assert.ok(url.includes('symbols=SPY'));
assert.ok(url.includes('access_key=%3Credacted%3E'));
assert.ok(!url.includes('secret-key'));
assert.ok(url.includes(`limit=${MARKETSTACK_PAGE_LIMIT}`));

// --- API call estimate ---
const est = estimateTotalApiCalls(['SPY', 'RSP'], '2003-01-01', '2026-07-01');
assert.ok(est.calendarDays > 8000);
assert.ok(est.estimatedTradingDays > 5000);
assert.strictEqual(est.callsPerSymbol.SPY, Math.ceil(est.estimatedTradingDays / MARKETSTACK_PAGE_LIMIT));
assert.strictEqual(est.totalCalls, est.callsPerSymbol.SPY! + est.callsPerSymbol.RSP!);

const shortEst = estimateTotalApiCalls(['SPY'], '2024-01-01', '2024-01-31');
assert.strictEqual(shortEst.callsPerSymbol.SPY, 1);

// --- JSON parsing ---
const page1 = {
  data: [
    { date: '2024-01-02T00:00:00+0000', close: 100, symbol: 'SPY' },
    { date: '2024-01-03T00:00:00+0000', close: 101, symbol: 'SPY' },
    { date: '2023-12-31T00:00:00+0000', close: 99, symbol: 'SPY' },
  ],
  pagination: { total: 1500, limit: 1000, offset: 0 },
};
const parsed1 = parseMarketstackEodJson(page1, '2024-01-01', '2024-01-31');
assert.strictEqual(parsed1.rows.length, 2);
assert.strictEqual(parsed1.rows[0]!.date, '2024-01-02');
assert.strictEqual(parsed1.rows[1]!.close, 101);

const errJson = { error: { message: 'invalid_access_key' } };
const parsedErr = parseMarketstackEodJson(errJson, '2024-01-01', '2024-01-31');
assert.strictEqual(parsedErr.apiError, 'invalid_access_key');
assert.strictEqual(parsedErr.rows.length, 0);

// --- merge pages ---
const merged = mergeEodRows([
  [{ date: '2024-01-02', close: 100 }],
  [{ date: '2024-01-03', close: 101 }, { date: '2024-01-02', close: 100.5 }],
]);
assert.strictEqual(merged.length, 2);
assert.strictEqual(merged[1]!.close, 101);

// --- CSV output ---
const csv = rowsToCsv([
  { date: '2024-01-02', close: 100.5 },
  { date: '2024-01-03', close: 101 },
]);
assert.strictEqual(csv, 'Date,Close\n2024-01-02,100.5\n2024-01-03,101\n');

// --- provenance sidecar ---
const sidecar = buildProvenanceSidecar({
  symbol: 'SPY',
  dateFrom: '2003-01-01',
  dateTo: '2026-07-01',
  generatedAt: '2026-07-04T00:00:00.000Z',
  apiCalls: 6,
  pagesFetched: 6,
  rowCount: 5000,
  csvFileName: 'SPY.csv',
});
assert.strictEqual(sidecar.source, 'Marketstack EOD');
assert.strictEqual(sidecar.adjustedClose, false);
assert.ok(String(sidecar.caveat).includes('not adjusted close'));

// --- dry-run plan ---
const plan = buildDryRunPlan(
  args,
  (sym) => `tmp/ghostflow/marketstack/${sym}.csv`,
  (sym) => `tmp/ghostflow/marketstack/${sym}.marketstack.meta.json`
);
assert.strictEqual(plan.estimate.totalCalls, est.totalCalls);
assert.ok(plan.csvPaths.SPY!.endsWith('SPY.csv'));

// --- mocked pagination fetch ---
(async () => {
  let fetchCount = 0;
  const mockFetch: typeof fetch = async (input) => {
    fetchCount += 1;
    const u = String(input);
    const offset = u.includes('offset=0') ? 0 : 1000;
    const data =
      offset === 0
        ? Array.from({ length: MARKETSTACK_PAGE_LIMIT }, (_, i) => {
            const d = new Date('2020-01-02T12:00:00Z');
            d.setUTCDate(d.getUTCDate() + i);
            return {
              date: `${d.toISOString().slice(0, 10)}T00:00:00+0000`,
              close: 100 + i * 0.01,
              symbol: 'SPY',
            };
          })
        : [{ date: '2022-01-04T00:00:00+0000', close: 110, symbol: 'SPY' }];
    return new Response(
      JSON.stringify({
        data,
        pagination: { total: MARKETSTACK_PAGE_LIMIT + 1, limit: MARKETSTACK_PAGE_LIMIT, offset },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const fetchResult = await fetchMarketstackEodPages(
    'SPY',
    '2020-01-01',
    '2024-12-31',
    'test-key',
    mockFetch,
    async () => {}
  );
  assert.strictEqual(fetchCount, 2);
  assert.strictEqual(fetchResult.apiCalls, 2);
  assert.strictEqual(fetchResult.pagesFetched, 2);
  assert.ok(fetchResult.rows.length >= MARKETSTACK_PAGE_LIMIT);

  console.log('marketstackEodExport.test.ts: all assertions passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
