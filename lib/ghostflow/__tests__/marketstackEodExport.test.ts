/**
 * GhostFlow Marketstack EOD CSV export helper — unit tests (no live API).
 */

import assert from 'node:assert/strict';
import {
  CAP_WEIGHT_STUDY_MIN_ALIGNED_ROWS,
  MARKETSTACK_PAGE_LIMIT,
  assessExportCoverage,
  buildDryRunPlan,
  buildMarketstackEodUrl,
  buildProvenanceSidecar,
  coercePaginationNumber,
  estimateTotalApiCalls,
  mergeEodRows,
  parseExportArgs,
  parseMarketstackEodJson,
  parsePaginationMeta,
  rowsToCsv,
  shouldFetchNextPage,
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
assert.strictEqual(args.allowPartial, false);
assert.strictEqual(args.dryRun, false);
assert.strictEqual(args.outDir, 'tmp/ghostflow/marketstack');
assert.strictEqual(args.minRowsRequired, CAP_WEIGHT_STUDY_MIN_ALIGNED_ROWS);

const partialArgs = parseExportArgs(
  ['--allow-marketstack', '--allow-partial', '--date-from', '2020-01-01', '--date-to', '2020-12-31'],
  '2026-07-01'
);
assert.strictEqual(partialArgs.allowPartial, true);

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

// --- pagination coercion ---
assert.strictEqual(coercePaginationNumber('1000'), 1000);
assert.strictEqual(coercePaginationNumber(5926), 5926);
assert.strictEqual(coercePaginationNumber('n/a'), null);

const pag = parsePaginationMeta({
  pagination: { limit: '1000', offset: 0, count: '1000', total: '5926' },
});
assert.strictEqual(pag?.total, 5926);
assert.strictEqual(pag?.count, 1000);

assert.strictEqual(
  shouldFetchNextPage({ batchLen: 1000, offset: 0, pagination: { total: 5926, count: 1000 } }),
  true
);
assert.strictEqual(
  shouldFetchNextPage({ batchLen: 1000, offset: 5000, pagination: { total: 5926, count: 1000 } }),
  false
);
assert.strictEqual(
  shouldFetchNextPage({ batchLen: 500, offset: 0, pagination: { total: 5926, count: 500 } }),
  false
);

// --- API call estimate ---
const est = estimateTotalApiCalls(['SPY', 'RSP'], '2003-01-01', '2026-07-01');
assert.ok(est.calendarDays > 8000);
assert.ok(est.estimatedTradingDays > 5000);
assert.strictEqual(est.callsPerSymbol.SPY, Math.ceil(est.estimatedTradingDays / MARKETSTACK_PAGE_LIMIT));
assert.strictEqual(est.totalCalls, est.callsPerSymbol.SPY! + est.callsPerSymbol.RSP!);

// --- coverage assessment (live-run shape: 1000 rows, 2016-2020) ---
const partialRows = Array.from({ length: 1000 }, (_, i) => {
  const d = new Date('2016-07-05T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + i);
  return { date: d.toISOString().slice(0, 10), close: 100 + i };
});
const partialCoverage = assessExportCoverage({
  rows: partialRows,
  dateFrom: '2003-01-01',
  dateTo: '2026-07-01',
});
assert.strictEqual(partialCoverage.coverageStatus, 'partial');
assert.strictEqual(partialCoverage.rowCount, 1000);
assert.ok(partialCoverage.warnings.length > 0);
assert.ok(partialCoverage.likelyCause?.includes('1000 rows'));

const completeRows = Array.from({ length: CAP_WEIGHT_STUDY_MIN_ALIGNED_ROWS }, (_, i) => {
  const d = new Date('2020-01-02T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + i);
  return { date: d.toISOString().slice(0, 10), close: 100 + i };
});
const completeCoverage = assessExportCoverage({
  rows: completeRows,
  dateFrom: '2020-01-01',
  dateTo: completeRows[completeRows.length - 1]!.date,
  minRowsRequired: CAP_WEIGHT_STUDY_MIN_ALIGNED_ROWS,
});
assert.strictEqual(completeCoverage.coverageStatus, 'complete');

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
  apiCalls: 1,
  pagesFetched: 1,
  rowCount: 1000,
  csvFileName: 'SPY.csv',
  coverage: partialCoverage,
  paginationPages: [{ limit: 1000, offset: 0, count: 1000, total: 1000 }],
});
assert.strictEqual(sidecar.coverageStatus, 'partial');
assert.deepStrictEqual(sidecar.pagination, [{ limit: 1000, offset: 0, count: 1000, total: 1000 }]);

// --- dry-run plan ---
const plan = buildDryRunPlan(
  args,
  (sym) => `tmp/ghostflow/marketstack/${sym}.csv`,
  (sym) => `tmp/ghostflow/marketstack/${sym}.marketstack.meta.json`
);
assert.ok(plan.coverageWarning.includes('fails closed'));

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
        pagination: {
          total: MARKETSTACK_PAGE_LIMIT + 1,
          limit: MARKETSTACK_PAGE_LIMIT,
          offset,
          count: data.length,
        },
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
  assert.strictEqual(fetchResult.paginationPages.length, 2);
  assert.ok(fetchResult.rows.length >= MARKETSTACK_PAGE_LIMIT);

  // string total pagination continues
  let stringTotalCalls = 0;
  const stringTotalFetch: typeof fetch = async (input) => {
    stringTotalCalls += 1;
    const u = String(input);
    const offset = u.includes('offset=1000') ? 1000 : 0;
    const data =
      offset === 0
        ? Array.from({ length: MARKETSTACK_PAGE_LIMIT }, (_, i) => ({
            date: `2021-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00+0000`,
            close: 100,
            symbol: 'SPY',
          }))
        : [];
    return new Response(
      JSON.stringify({
        data,
        pagination: { total: '2000', count: '1000', offset, limit: '1000' },
      }),
      { status: 200 }
    );
  };
  const stringResult = await fetchMarketstackEodPages(
    'SPY',
    '2021-01-01',
    '2021-12-31',
    'test-key',
    stringTotalFetch,
    async () => {}
  );
  assert.strictEqual(stringTotalCalls, 2);
  assert.strictEqual(stringResult.pagesFetched, 2);

  console.log('marketstackEodExport.test.ts: all assertions passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
