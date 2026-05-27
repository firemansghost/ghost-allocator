/**
 * GhostFlow v1.0a — CFTC TFF history research helper tests (no network).
 */

import assert from 'assert';
import {
  alignWeeklyBaskets,
  mappingScoreCapped,
  mappingScoreFixed,
  mappingScorePercentile,
  mappingScoreZScore,
  percentileRank,
  rowToScoreContract,
  summarizeDistribution,
} from '../research/cftcTffHistory';
import type { CftcTffRawRow } from '../research/cftcTffHistory';

function baseRow(
  code: string,
  date: string,
  week: string,
  long: number,
  short: number,
  oi: number
): CftcTffRawRow {
  return {
    report_date_as_yyyy_mm_dd: date,
    yyyy_report_week_ww: week,
    cftc_contract_market_code: code,
    contract_market_name: code,
    open_interest_all: String(oi),
    lev_money_positions_long: String(long),
    lev_money_positions_short: String(short),
    lev_money_positions_spread: '1000',
    change_in_lev_money_long: '100',
    change_in_lev_money_short: '-50',
    change_in_lev_money_spread: '10',
    pct_of_oi_lev_money_long: '10',
    pct_of_oi_lev_money_short: '20',
    pct_of_oi_lev_money_spread: '2',
    futonly_or_combined: 'FutOnly',
  };
}

// --- rowToScoreContract ---
const es = rowToScoreContract(baseRow('13874A', '2026-01-07', '2026 Report Week 01', 100, 200, 1000), '13874A');
assert.ok(es);
assert.strictEqual(es!.observations.reportDate, '2026-01-07');

// --- align: full week ---
const week1Rows = [
  baseRow('13874A', '2026-01-07', '2026 Report Week 01', 100, 400, 2000),
  baseRow('209742', '2026-01-07', '2026 Report Week 01', 50, 150, 1000),
  baseRow('239742', '2026-01-07', '2026 Report Week 01', 30, 80, 500),
];
const { aligned: oneWeek, skippedWeeks: skip0 } = alignWeeklyBaskets(week1Rows);
assert.strictEqual(oneWeek.length, 1);
assert.strictEqual(skip0.length, 0);
assert.ok(oneWeek[0]!.basket.basketScore >= 0 && oneWeek[0]!.basket.basketScore <= 100);

// --- align: missing contract skipped ---
const incomplete = [
  baseRow('13874A', '2026-01-14', '2026 Report Week 02', 100, 400, 2000),
  baseRow('209742', '2026-01-14', '2026 Report Week 02', 50, 150, 1000),
];
const { aligned: none, skippedWeeks: skip1 } = alignWeeklyBaskets(incomplete);
assert.strictEqual(none.length, 0);
assert.strictEqual(skip1.length, 1);
assert.ok(skip1[0]!.missingCodes.includes('239742'));

// --- percentileRank ---
const sorted = [10, 20, 30, 40, 50];
assert.strictEqual(percentileRank(sorted, 10), 10);
assert.strictEqual(percentileRank(sorted, 50), 90);
assert.ok(percentileRank(sorted, 30) >= 40 && percentileRank(sorted, 30) <= 60);

// --- mapping variants ---
assert.strictEqual(mappingScoreFixed(-18.5), 93);
assert.strictEqual(mappingScoreFixed(18.5), 93);
assert.strictEqual(mappingScoreCapped(-18.5, 80), 80);
const hist = [5, 10, 15, 18.5, 20, 25];
assert.ok(mappingScorePercentile(18.5, hist) >= 50);
assert.ok(mappingScoreZScore(18.5, hist) >= 0 && mappingScoreZScore(18.5, hist) <= 100);

// --- summarizeDistribution ---
const dist = summarizeDistribution([0, 50, 100]);
assert.strictEqual(dist.min, 0);
assert.strictEqual(dist.max, 100);
assert.strictEqual(dist.median, 50);

console.log('ghostflow/cftcTffHistory.test.ts: ok');
