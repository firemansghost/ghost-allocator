/**
 * Persist gate — invalid snapshots must not be written as latest
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPersistSnapshotRejection, isValidPersistableSnapshot } from '../persistGate';
import type { GhostRegimeRow } from '../types';

function baseRow(): GhostRegimeRow {
  return {
    date: '2025-01-15',
    run_date_utc: '2025-01-15',
    regime: 'GOLDILOCKS',
    risk_regime: 'RISK ON',
    risk_score: 1,
    infl_score: 0,
    infl_core_score: 0,
    infl_sat_score: 0,
    risk_axis: 'RiskOn',
    infl_axis: 'Disinflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.5,
    gold_target: 0.2,
    btc_target: 0.05,
    stocks_scale: 1,
    gold_scale: 1,
    btc_scale: 1,
    stocks_actual: 0.5,
    gold_actual: 0.2,
    btc_actual: 0.05,
    cash: 0.2,
    flip_watch_status: 'NONE',
    source: 'computed',
    row_computed_at_utc: '2025-01-15T12:00:00.000Z',
    row_build_commit: 'abc',
    row_engine_version: 'ghostregime-v1',
  };
}

describe('isValidPersistableSnapshot', () => {
  it('accepts a fully specified computed row', () => {
    assert.strictEqual(isValidPersistableSnapshot(baseRow()), true);
  });

  it('rejects row missing row_computed_at_utc', () => {
    const r = baseRow();
    delete (r as Partial<GhostRegimeRow>).row_computed_at_utc;
    assert.strictEqual(isValidPersistableSnapshot(r), false);
    assert.strictEqual(getPersistSnapshotRejection(r), 'missing_row_computed_at_utc');
  });

  it('rejects non-finite scores', () => {
    const r = baseRow();
    r.risk_score = NaN;
    assert.strictEqual(getPersistSnapshotRejection(r)?.startsWith('invalid_risk_score'), true);
  });
});
