/**
 * Tests for cash breakdown and Targets/Scales/Actual display
 * Locks down the fix for: Targets hiding base cash, cash attribution misleading
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { GhostRegimeRow, SignalReceipt } from '../types';
import { computeCashBreakdown, buildTodaySnapshotBlocks } from '../ui';

/** Minimal GhostRegimeRow for cash breakdown tests */
function makeRow(
  stocksTarget: number,
  goldTarget: number,
  btcTarget: number,
  stocksScale: number,
  goldScale: number,
  btcScale: number,
  cash: number
): GhostRegimeRow {
  return {
    date: '2025-01-21',
    run_date_utc: '2025-01-21T12:00:00Z',
    regime: 'DEFLATION',
    risk_regime: 'RISK OFF',
    risk_score: 0,
    infl_score: 0,
    infl_core_score: 0,
    infl_sat_score: 0,
    risk_axis: 'RiskOff',
    infl_axis: 'Disinflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: stocksTarget,
    gold_target: goldTarget,
    btc_target: btcTarget,
    stocks_scale: stocksScale,
    gold_scale: goldScale,
    btc_scale: btcScale,
    stocks_actual: stocksTarget * stocksScale,
    gold_actual: goldTarget * goldScale,
    btc_actual: btcTarget * btcScale,
    cash,
    flip_watch_status: 'NONE',
    source: 'computed',
    risk_receipts: [] as SignalReceipt[],
    inflation_receipts: [] as SignalReceipt[],
  };
}

describe('computeCashBreakdown', () => {
  it('Risk Off case: targets 30/30/5, scales 1/1/0, actual 30/30/0, cash 40%', () => {
    const row = makeRow(0.30, 0.30, 0.05, 1, 1, 0, 0.40);
    const breakdown = computeCashBreakdown(row);

    assert.strictEqual(breakdown.cashTarget, 0.35, 'Base cash (from starting point) should be 35%');
    assert.strictEqual(breakdown.cashFromThrottles, 0.05, 'Throttle cash should be 5% (BTC only)');
    assert.strictEqual(breakdown.cashFromStocks, 0, 'No cash from stocks');
    assert.strictEqual(breakdown.cashFromGold, 0, 'No cash from gold');
    assert.strictEqual(breakdown.cashFromBtc, 0.05, '5% from BTC throttle');
    assert.strictEqual(breakdown.throttleSourceNames.length, 1, 'One throttle source');
    assert.strictEqual(breakdown.throttleSourceNames[0], 'Bitcoin', 'Throttle source is Bitcoin');
    assert.strictEqual(breakdown.cashTotal, 0.40, 'Total cash 40%');
    assert.strictEqual(breakdown.isConsistent, true, '0.35 + 0.05 = 0.40');
  });
});

describe('buildTodaySnapshotBlocks', () => {
  it('Targets includes + 35 cash when base cash is 35%', () => {
    const row = makeRow(0.30, 0.30, 0.05, 1, 1, 0, 0.40);
    const blocks = buildTodaySnapshotBlocks(row);
    assert(blocks, 'Blocks should exist');
    assert(
      blocks!.targets.includes('+ 35 cash'),
      `Targets should include "+ 35 cash", got: ${blocks!.targets}`
    );
  });

  it('Actual includes + 40 cash', () => {
    const row = makeRow(0.30, 0.30, 0.05, 1, 1, 0, 0.40);
    const blocks = buildTodaySnapshotBlocks(row);
    assert(blocks, 'Blocks should exist');
    assert(
      blocks!.actual.includes('+ 40 cash'),
      `Actual should include "+ 40 cash", got: ${blocks!.actual}`
    );
  });
});
