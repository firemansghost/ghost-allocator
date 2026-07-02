/**
 * GhostFlow v1.2d — display-only retirement asset-growth signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeRetirementFlowDisplayIfValid,
} from '../buildSnapshot';
import {
  evaluateRetirementFlowPressureArtifactFreshness,
  formatRetirementFlowDisplayValue,
  RETIREMENT_FLOW_DISPLAY_CARD_CAVEAT,
  RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME,
} from '../artifacts/retirementFlowPressureProxy';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import loadProduction from '@/data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json';
import type { RetirementFlowPressureArtifactV1 } from '../artifacts/types';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadProduction as RetirementFlowPressureArtifactV1;

assert.strictEqual(
  formatRetirementFlowDisplayValue(production.observations),
  '$49.1T retirement assets · QoQ +2.1% · YoY +11.2%'
);

const fresh = evaluateRetirementFlowPressureArtifactFreshness(
  production,
  GHOSTFLOW_REFERENCE_AS_OF
);
assert.strictEqual(fresh.status, 'stale');
assert.ok(
  fresh.warnings.some((w) => w.includes('stale') || w.includes('Refresh recommended'))
);

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const retirement = raw.signals.find((s) => s.id === 'retirement-asset-growth');

assert.ok(retirement, 'retirement-asset-growth signal must exist');
assert.strictEqual(retirement!.dataStatus, 'public_proxy');
assert.strictEqual(retirement!.name, RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME);
assert.strictEqual(retirement!.numericValue, 2.1);
assert.ok(retirement!.value.includes('$49.1T'));
assert.ok(retirement!.value.includes('QoQ +2.1%'));
assert.ok(retirement!.value.includes('YoY +11.2%'));
assert.strictEqual(retirement!.cardCaveat, RETIREMENT_FLOW_DISPLAY_CARD_CAVEAT);

const scoredRetirement = scored.signals.find((s) => s.id === 'retirement-asset-growth')!;
assert.strictEqual(
  signalCardBadgeLabelForSignal(scoredRetirement, 'public'),
  'DISPLAY ONLY'
);

assert.strictEqual(raw.passivePressure.retirementFlowPressureProxy, 58);
assert.ok(!meta.publicPassiveInputKeys?.includes('retirementFlowPressureProxy'));
assert.strictEqual(meta.publicStructuralInputKeys?.length, 4);
assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'retirement-asset-growth'));

assert.strictEqual(scored.score.score, 55);
assert.strictEqual(scored.score.subScores.passivePressure, 45);
assert.strictEqual(scored.score.subScores.structuralFragility, 65);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Elevated Flow Pressure');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'retirement-asset-growth'));
assert.deepStrictEqual(grouped.mockProxies.map((s) => s.id), []);

const invalidMerge = mergeRetirementFlowDisplayIfValid(
  {
    ...MOCK_GHOSTFLOW_SNAPSHOT,
    passivePressure: { ...MOCK_GHOSTFLOW_SNAPSHOT.passivePressure },
    structuralFragility: { ...MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility },
    signals: MOCK_GHOSTFLOW_SNAPSHOT.signals.map((s) => ({ ...s })),
  },
  { ok: false, errors: ['artifactVersion must be "1".'] },
  GHOSTFLOW_REFERENCE_AS_OF
);
assert.ok(invalidMerge.warnings.some((w) => w.includes('No display card added')));
assert.ok(!invalidMerge.publicSignal);
assert.ok(
  !invalidMerge.raw.signals.some((s) => s.id === 'retirement-asset-growth')
);

console.log('ghostflow/retirementFlowDisplay.test.ts: ok');
