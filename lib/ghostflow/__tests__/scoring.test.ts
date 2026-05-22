/**
 * GhostFlow v0.1 scoring tests.
 */

import assert from 'assert';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import {
  computeGhostFlowScore,
  computePassivePressureScore,
  computeStructuralFragilityScore,
  distanceToModelStressZone,
  ghostFlowBand,
  ghostFlowBandLabel,
  GHOSTFLOW_SCORE_BANDS,
  passiveShareBand,
  scoreGhostFlowSnapshot,
  signalStatusFromValue,
} from '../scoring';

const passive = computePassivePressureScore(MOCK_GHOSTFLOW_SNAPSHOT.passivePressure);
const structural = computeStructuralFragilityScore(MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility);
const composite = computeGhostFlowScore(passive, structural);

assert.strictEqual(passive, 62);
assert.strictEqual(structural, 62);
assert.strictEqual(composite, 62);

assert.strictEqual(ghostFlowBand(62), 'crowded_reflexive');
assert.strictEqual(ghostFlowBandLabel(ghostFlowBand(62)), 'Crowded / Reflexive');
assert.strictEqual(GHOSTFLOW_SCORE_BANDS.length, 5);
assert.strictEqual(GHOSTFLOW_SCORE_BANDS[1].label, 'Normal Mechanical Pressure');
assert.strictEqual(ghostFlowBand(20), 'quiet_plumbing');
assert.strictEqual(ghostFlowBand(21), 'normal_mechanical');
assert.strictEqual(ghostFlowBand(60), 'elevated_flow');
assert.strictEqual(ghostFlowBand(61), 'crowded_reflexive');
assert.strictEqual(ghostFlowBand(81), 'fragility_zone');

assert.strictEqual(passiveShareBand(58).id, 'watch');
assert.strictEqual(passiveShareBand(62).id, 'pre_stress');
assert.strictEqual(passiveShareBand(65).id, 'model_stress');
assert.strictEqual(passiveShareBand(49).id, 'normal');

assert.strictEqual(signalStatusFromValue(20), 'quiet');
assert.strictEqual(signalStatusFromValue(40), 'watch');
assert.strictEqual(signalStatusFromValue(58), 'elevated');
assert.strictEqual(signalStatusFromValue(70), 'stress');

assert.strictEqual(distanceToModelStressZone(58), 7);

const scored = scoreGhostFlowSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
assert.strictEqual(scored.score.score, 62);
assert.strictEqual(scored.signals.length, 8);
assert.ok(scored.signals.every((s) => s.status));

console.log('ghostflow/scoring.test.ts: ok');
