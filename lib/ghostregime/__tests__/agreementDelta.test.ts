/**
 * Tests for agreement delta labeling (improved/worsened/unchanged)
 * Locks down the logic so label/arrow bugs cannot regress.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { GhostRegimeRow, SignalReceipt } from '../types';
import { computeAgreementDelta } from '../ui';
import {
  AGREEMENT_TREND_IMPROVED,
  AGREEMENT_TREND_WORSENED,
  AGREEMENT_TREND_UNCHANGED,
} from '../ghostregimePageCopy';

/** Create receipts that yield agree/total for Risk On axis (agree = vote > 0) */
function makeRiskReceipts(agree: number, total: number): SignalReceipt[] {
  const receipts: SignalReceipt[] = [];
  for (let i = 0; i < total; i++) {
    receipts.push({
      key: `r${i}`,
      label: `Risk ${i}`,
      vote: i < agree ? 1 : -1,
      direction: 'Risk On',
    });
  }
  return receipts;
}

/** Create receipts that yield agree/total for Inflation axis */
function makeInflReceipts(agree: number, total: number): SignalReceipt[] {
  const receipts: SignalReceipt[] = [];
  for (let i = 0; i < total; i++) {
    receipts.push({
      key: `i${i}`,
      label: `Infl ${i}`,
      vote: i < agree ? 1 : -1,
      direction: 'Inflation',
    });
  }
  return receipts;
}

/** Minimal GhostRegimeRow for agreement delta tests */
function makeRow(
  date: string,
  riskRegime: 'RISK ON' | 'RISK OFF',
  riskReceipts: SignalReceipt[],
  inflAxis: 'Inflation' | 'Disinflation',
  inflationReceipts: SignalReceipt[]
): GhostRegimeRow {
  return {
    date,
    run_date_utc: `${date}T12:00:00Z`,
    regime: 'GOLDILOCKS',
    risk_regime: riskRegime,
    risk_score: 0,
    infl_score: 0,
    infl_core_score: 0,
    infl_sat_score: 0,
    risk_axis: 'RiskOn',
    infl_axis: inflAxis,
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.6,
    gold_target: 0.3,
    btc_target: 0.1,
    stocks_scale: 1,
    gold_scale: 1,
    btc_scale: 0,
    stocks_actual: 0.6,
    gold_actual: 0.3,
    btc_actual: 0,
    cash: 0,
    flip_watch_status: 'NONE',
    source: 'computed',
    risk_receipts: riskReceipts,
    inflation_receipts: inflationReceipts,
  };
}

describe('computeAgreementDelta', () => {
  it('A) Improved: old 1/2 (50%) -> new 2/3 (67%)', () => {
    const current = makeRow(
      '2025-01-15',
      'RISK ON',
      makeRiskReceipts(2, 3), // 2/3 = 66.7%
      'Inflation',
      makeInflReceipts(2, 3)
    );
    const previous = makeRow(
      '2025-01-14',
      'RISK ON',
      makeRiskReceipts(1, 2), // 1/2 = 50%
      'Inflation',
      makeInflReceipts(1, 2)
    );

    const result = computeAgreementDelta(current, previous);

    assert(result.risk, 'Risk delta should exist');
    assert(result.risk!.line.includes(AGREEMENT_TREND_IMPROVED), `Expected IMPROVED, got: ${result.risk!.line}`);
    assert(
      result.risk!.line.includes('1/2') && result.risk!.line.includes('2/3'),
      `Expected "1/2 ... → 2/3 ...", got: ${result.risk!.line}`
    );
    assert(
      result.risk!.line.indexOf('1/2') < result.risk!.line.indexOf('2/3'),
      'Arrow direction: 1/2 (old) should come before 2/3 (new)'
    );

    assert(result.inflation, 'Inflation delta should exist');
    assert(result.inflation!.line.includes(AGREEMENT_TREND_IMPROVED), `Expected IMPROVED, got: ${result.inflation!.line}`);
    assert(
      result.inflation!.line.indexOf('1/2') < result.inflation!.line.indexOf('2/3'),
      'Arrow direction: 1/2 (old) should come before 2/3 (new)'
    );
  });

  it('B) Worsened: old 2/3 (67%) -> new 1/2 (50%)', () => {
    const current = makeRow(
      '2025-01-15',
      'RISK ON',
      makeRiskReceipts(1, 2), // 1/2 = 50%
      'Inflation',
      makeInflReceipts(1, 2)
    );
    const previous = makeRow(
      '2025-01-14',
      'RISK ON',
      makeRiskReceipts(2, 3), // 2/3 = 66.7%
      'Inflation',
      makeInflReceipts(2, 3)
    );

    const result = computeAgreementDelta(current, previous);

    assert(result.risk, 'Risk delta should exist');
    assert(result.risk!.line.includes(AGREEMENT_TREND_WORSENED), `Expected WORSENED, got: ${result.risk!.line}`);
    assert(
      result.risk!.line.includes('2/3') && result.risk!.line.includes('1/2'),
      `Expected "2/3 ... → 1/2 ...", got: ${result.risk!.line}`
    );
    assert(
      result.risk!.line.indexOf('2/3') < result.risk!.line.indexOf('1/2'),
      'Arrow direction: 2/3 (old) should come before 1/2 (new)'
    );

    assert(result.inflation, 'Inflation delta should exist');
    assert(result.inflation!.line.includes(AGREEMENT_TREND_WORSENED), `Expected WORSENED, got: ${result.inflation!.line}`);
    assert(
      result.inflation!.line.indexOf('2/3') < result.inflation!.line.indexOf('1/2'),
      'Arrow direction: 2/3 (old) should come before 1/2 (new)'
    );
  });

  it('C) Unchanged (exact): old 2/3 (67%) -> new 2/3 (67%)', () => {
    const receipts = makeRiskReceipts(2, 3);
    const inflReceipts = makeInflReceipts(2, 3);
    const current = makeRow('2025-01-15', 'RISK ON', receipts, 'Inflation', inflReceipts);
    const previous = makeRow('2025-01-14', 'RISK ON', receipts, 'Inflation', inflReceipts);

    const result = computeAgreementDelta(current, previous);

    assert(result.risk, 'Risk delta should exist');
    assert(result.risk!.line.includes(AGREEMENT_TREND_UNCHANGED), `Expected UNCHANGED, got: ${result.risk!.line}`);
    assert(result.risk!.line.includes('unchanged'), `Expected "unchanged" in string, got: ${result.risk!.line}`);

    assert(result.inflation, 'Inflation delta should exist');
    assert(result.inflation!.line.includes(AGREEMENT_TREND_UNCHANGED), `Expected UNCHANGED, got: ${result.inflation!.line}`);
  });

  it('D) Unchanged (within threshold): deltaPct < 0.5', () => {
    // 3/4 = 75%, 3/5 = 60% -> delta = -15. But we need delta < 0.5.
    // 2/3 = 66.67%, 2/3 with one more decimal could be 66.6 vs 66.7 -> delta 0.1
    // Use 5/8 = 62.5% and 5/8 = 62.5% (exact) - that's unchanged.
    // For within threshold: 2/3 (66.67) vs 3/5 (60) = delta -6.67, not < 0.5.
    // 10/15 = 66.67% vs 2/3 = 66.67% - same
    // 67/100 = 67% vs 2/3 = 66.67% -> delta 0.33, within 0.5
    const current = makeRow(
      '2025-01-15',
      'RISK ON',
      makeRiskReceipts(67, 100), // 67%
      'Inflation',
      makeInflReceipts(67, 100)
    );
    const previous = makeRow(
      '2025-01-14',
      'RISK ON',
      makeRiskReceipts(2, 3), // 66.67%
      'Inflation',
      makeInflReceipts(2, 3)
    );

    const result = computeAgreementDelta(current, previous);

    assert(result.risk, 'Risk delta should exist');
    assert(
      result.risk!.line.includes(AGREEMENT_TREND_UNCHANGED),
      `Expected UNCHANGED (delta ~0.33 < 0.5), got: ${result.risk!.line}`
    );
  });
});
