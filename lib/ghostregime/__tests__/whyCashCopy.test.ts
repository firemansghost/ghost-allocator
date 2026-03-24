/**
 * "Why cash" copy must not claim sleeves are "off" when exposure is non-zero
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { GhostRegimeRow, SignalReceipt } from '../types';
import { buildWhyCashLine } from '../ui';

function row(partial: Partial<GhostRegimeRow> & Pick<GhostRegimeRow, 'stocks_actual' | 'gold_actual' | 'btc_actual' | 'cash'>): GhostRegimeRow {
  return {
    date: '2026-03-24',
    run_date_utc: '2026-03-24T12:00:00Z',
    regime: 'INFLATION',
    risk_regime: 'RISK OFF',
    risk_score: -1,
    infl_score: 1,
    infl_core_score: 1,
    infl_sat_score: 0,
    risk_axis: 'RiskOff',
    infl_axis: 'Inflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: -2,
    stocks_target: 0.3,
    gold_target: 0.15,
    btc_target: 0.05,
    stocks_scale: 0.5,
    gold_scale: 0.5,
    btc_scale: 0,
    flip_watch_status: 'NONE',
    source: 'computed',
    risk_receipts: [] as SignalReceipt[],
    inflation_receipts: [] as SignalReceipt[],
    ...partial,
  };
}

describe('buildWhyCashLine', () => {
  it('does not say Stocks are off when stocks_actual > 0', () => {
    const r = row({
      stocks_actual: 0.15,
      gold_actual: 0.075,
      btc_actual: 0,
      cash: 0.775,
    });
    const line = buildWhyCashLine(r);
    assert.match(line, /Stocks half size/i);
    assert.doesNotMatch(line, /Stocks off/i);
  });
});
