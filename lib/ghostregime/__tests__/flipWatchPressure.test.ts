/**
 * Axis & sleeve pressure helper — boundary and allocation smoke tests
 */

import assert from 'assert';
import {
  distanceToNearestVamsBoundary,
  nextVamsStateAfterOneStep,
  computeRegimeMovementPressure,
} from '../flipWatchPressure';
import type { GhostRegimeRow } from '../types';

function baseRow(over: Partial<GhostRegimeRow> = {}): GhostRegimeRow {
  return {
    date: '2025-01-15',
    run_date_utc: '2025-01-15',
    regime: 'GOLDILOCKS',
    risk_regime: 'RISK ON',
    risk_score: 0.1,
    infl_score: 0.05,
    infl_core_score: 0,
    infl_sat_score: 0,
    risk_axis: 'RiskOn',
    infl_axis: 'Inflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.6,
    gold_target: 0.3,
    btc_target: 0.1,
    stocks_scale: 0.5,
    gold_scale: 0.5,
    btc_scale: 0.5,
    stocks_actual: 0.3,
    gold_actual: 0.15,
    btc_actual: 0.05,
    cash: 0.5,
    flip_watch_status: 'NONE',
    source: 'computed',
    stocks_vams_score: 0.1,
    gold_vams_score: 0.2,
    btc_vams_score: -0.3,
    ...over,
  };
}

// --- Boundary: VAMS score distance to nearest ±0.5 ---
assert.strictEqual(distanceToNearestVamsBoundary(0), 0.5, 'score 0 → 0.5 to nearest band');
assert.strictEqual(distanceToNearestVamsBoundary(0.5), 0, 'score +0.5 → on bull band');
assert.strictEqual(distanceToNearestVamsBoundary(-0.5), 0, 'score -0.5 → on bear band');
assert.ok(
  Math.abs(distanceToNearestVamsBoundary(0.6) - 0.1) < 1e-9,
  'bull: distance above +0.5'
);
assert.ok(
  Math.abs(distanceToNearestVamsBoundary(-0.8) - 0.3) < 1e-9,
  'bear: distance below -0.5'
);

// --- N/A: missing persisted VAMS scores ---
const noScores = baseRow({
  stocks_vams_score: undefined,
  gold_vams_score: undefined,
  btc_vams_score: undefined,
});
const prev = baseRow({ date: '2025-01-14', stocks_vams_score: 0.1, gold_vams_score: 0.1, btc_vams_score: 0.1 });
const naSummary = computeRegimeMovementPressure(noScores, prev);
assert.strictEqual(naSummary.closestSleeve, null);
assert.ok(naSummary.sleeves.every((s) => s.distanceToBoundary === null));

// --- Closest sleeve picks minimum distance among sleeves with scores ---
const mixed = baseRow({
  stocks_vams_score: 0.4,
  gold_vams_score: 0.2,
  btc_vams_score: -0.4,
});
// Distances: stocks 0.1, gold 0.3, btc 0.1 → tie stocks vs btc — first in list wins (stocks)
const mixSummary = computeRegimeMovementPressure(mixed, prev);
assert.ok(mixSummary.closestSleeve);
assert.strictEqual(mixSummary.closestSleeve!.key, 'stocks');

// --- nextVamsStateAfterOneStep neutral at 0: tie goes to bull (+2) per implementation ---
assert.strictEqual(nextVamsStateAfterOneStep(0, 0), 2);

console.log('flipWatchPressure tests passed');
