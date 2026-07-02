/**
 * GhostFlow v1.7 — consolidated dashboard state / trust audit (no score wiring).
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
  'index-inclusion-events',
  'cap-weight-premium',
  'tail-skew-context',
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
assert.strictEqual(scored.score.subScores.structuralFragility, 65);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Crowded / Reflexive');

assert.strictEqual(meta.publicSignalCount, 13);

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

assert.strictEqual(PUBLIC_ARTIFACT_SIGNAL_IDS.length, 13);
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('tail-skew-context'));
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('index-inclusion-events'));
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('cap-weight-premium'));
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('retirement-asset-growth'));
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('options-activity-proxy'));
assert.ok(!raw.signals.some((s) => s.id === 'odte-options'));

const TREASURY_DISPLAY_IDS = [
  'treasury-futures-positioning-proxy',
  'treasury-long-end-income-lens',
] as const;

for (const id of TREASURY_DISPLAY_IDS) {
  assert.ok(
    !PUBLIC_ARTIFACT_SIGNAL_IDS.includes(id),
    `Treasury id ${id} must not be in PUBLIC_ARTIFACT_SIGNAL_IDS`
  );
  assert.ok(
    !raw.signals.some((s) => s.id === id),
    `Treasury id ${id} must not be in buildSnapshot raw.signals`
  );
}

console.log('ghostflow/ghostflowCurrentState.test.ts: ok');
