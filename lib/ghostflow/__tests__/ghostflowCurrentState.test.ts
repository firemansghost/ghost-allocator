/**
 * GhostFlow v1.5a — consolidated dashboard state / trust audit (no score wiring).
 */

import assert from 'assert';
import { buildGhostFlowSnapshot } from '../buildSnapshot';
import {
  groupSignalsByPresentation,
  PUBLIC_ARTIFACT_SIGNAL_IDS,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';

const DISPLAY_ONLY_IDS = [
  'systematic-flow',
  'levered-etf-rebalance',
  'retirement-asset-growth',
  'options-activity-proxy',
] as const;

const SCORE_FED_PUBLIC_IDS = [
  'passive-share',
  'etf-flow',
  'vol-regime',
  'active-index-flow',
  'concentration',
  'breadth',
] as const;

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);

assert.strictEqual(scored.score.score, 62);
assert.strictEqual(scored.score.subScores.passivePressure, 58);
assert.strictEqual(scored.score.subScores.structuralFragility, 66);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Crowded / Reflexive');

assert.strictEqual(meta.publicSignalCount, 10);

assert.strictEqual(raw.passivePressure.systematicStrategyPressure, 62);
assert.strictEqual(raw.passivePressure.retirementFlowPressureProxy, 58);
assert.strictEqual(raw.passivePressure.leveredEtfRebalancePressure, 55);

const passiveKeys = meta.publicPassiveInputKeys ?? [];
assert.ok(!passiveKeys.includes('systematicStrategyPressure'));
assert.ok(!passiveKeys.includes('retirementFlowPressureProxy'));
assert.ok(!passiveKeys.includes('leveredEtfRebalancePressure'));

const grouped = groupSignalsByPresentation(scored.signals);
for (const id of DISPLAY_ONLY_IDS) {
  assert.ok(
    grouped.publicArtifacts.some((s) => s.id === id),
    `display-only card ${id} must be in publicArtifacts`
  );
  const sig = scored.signals.find((s) => s.id === id)!;
  assert.strictEqual(sig.dataStatus, 'public_proxy');
  assert.strictEqual(signalCardBadgeLabelForSignal(sig, 'public'), 'DISPLAY ONLY');
}

for (const id of SCORE_FED_PUBLIC_IDS) {
  assert.ok(
    grouped.publicArtifacts.some((s) => s.id === id),
    `score-fed public card ${id} must be in publicArtifacts`
  );
  const badge = signalCardBadgeLabelForSignal(
    scored.signals.find((s) => s.id === id)!,
    'public'
  );
  assert.notStrictEqual(badge, 'DISPLAY ONLY', `${id} is score-fed, not display-only`);
}

assert.deepStrictEqual(grouped.mockProxies.map((s) => s.id), []);

assert.strictEqual(PUBLIC_ARTIFACT_SIGNAL_IDS.length, 10);
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('retirement-asset-growth'));
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('options-activity-proxy'));
assert.ok(!raw.signals.some((s) => s.id === 'odte-options'));

console.log('ghostflow/ghostflowCurrentState.test.ts: ok');
