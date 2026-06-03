import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildQuarterlySeries,
  buildRetirementMappingComparison,
  buildRetirementScoreImpactPreview,
  computeQoQGrowthPct,
  computeYoYGrowthPct,
  findLatestQuarter,
  isQuarterlyPeriod,
  mappingPercentile,
  MOCK_RETIREMENT_SCORE,
  parseTable1Csv,
  previewScoreWithRetirement,
} from '../research/retirementFlowHistory';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureCsv = readFileSync(
  join(__dirname, 'fixtures', 'retirementFlowHistoryQuarterly.csv'),
  'utf8'
);

const rows = parseTable1Csv(fixtureCsv);
const parsed = buildQuarterlySeries(rows, '2007:Q1');
const { quarterly, skippedRows } = parsed;

assert.ok(isQuarterlyPeriod('2025:Q4'));
assert.ok(!isQuarterlyPeriod('2006'));
assert.ok(skippedRows.includes('2006'), 'annual 2006 excluded from quarterly series');

assert.strictEqual(quarterly[0]!.period, '2007:Q1');
assert.strictEqual(quarterly[quarterly.length - 1]!.period, '2025:Q4');

const q2 = quarterly.find((q) => q.period === '2007:Q2')!;
const q1 = quarterly.find((q) => q.period === '2007:Q1')!;
const expectedQoQ = computeQoQGrowthPct(q2.totalBillions, q1.totalBillions);
assert.ok(q2.qoqTotalGrowthPct != null);
assert.ok(Math.abs(q2.qoqTotalGrowthPct - expectedQoQ!) < 0.05);

const y2010q1 = quarterly.find((q) => q.period === '2010:Q1')!;
const y2009q1 = quarterly.find((q) => q.period === '2009:Q1')!;
const expectedYoY = computeYoYGrowthPct(y2010q1.totalBillions, y2009q1.totalBillions);
assert.ok(y2010q1.yoyTotalGrowthPct != null);
assert.ok(Math.abs(y2010q1.yoyTotalGrowthPct - expectedYoY!) < 0.05);

const latest = findLatestQuarter(quarterly, '2025:Q4');
assert.ok(latest);
assert.ok(latest.iraSharePct > 0 && latest.dcSharePct > 0);

const qoqHist = quarterly
  .map((q) => q.qoqTotalGrowthPct)
  .filter((v): v is number => v != null)
  .sort((a, b) => a - b);
const latestQoQ = latest.qoqTotalGrowthPct ?? 0;
const pctile = mappingPercentile(latestQoQ, qoqHist);
assert.ok(pctile >= 0 && pctile <= 100);
assert.ok(Number.isInteger(pctile));

const mapping = buildRetirementMappingComparison(quarterly, latest);
assert.ok(mapping.length >= 4);
for (const m of mapping) {
  assert.ok(m.latestScore >= 0 && m.latestScore <= 100);
}

const preview = buildRetirementScoreImpactPreview(mapping);
const mockRow = preview.find((r) => r.label.includes('MOCK'));
assert.ok(mockRow);
assert.strictEqual(mockRow.retirementR, MOCK_RETIREMENT_SCORE);

const at58 = previewScoreWithRetirement(58);
assert.strictEqual(at58.retirementR, 58);
assert.ok(at58.passivePressure >= 0 && at58.composite >= 0);

console.log('ghostflow/retirementFlowHistory.test.ts: ok');
