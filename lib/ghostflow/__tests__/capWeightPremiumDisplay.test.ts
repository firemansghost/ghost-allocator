/**
 * GhostFlow v1.9b.4 — display-only cap-weight premium signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeCapWeightPremiumDisplayIfValid,
} from '../buildSnapshot';
import {
  buildCapWeightPremiumDisplayExplanation,
  CAP_WEIGHT_PREMIUM_DISPLAY_CARD_CAVEAT,
  CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME,
  evaluateCapWeightPremiumArtifactFreshness,
  formatCapWeightPremiumCardValue,
  loadCapWeightPremiumProxyArtifact,
} from '../artifacts/capWeightPremiumProxy';
import {
  groupSignalsByPresentation,
  PUBLIC_ARTIFACT_SIGNAL_IDS,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadCapWeightPremiumProxyArtifact();
assert.ok(production.ok, production.ok ? '' : production.errors.join('; '));

const artifact = production.artifact;

assert.strictEqual(
  formatCapWeightPremiumCardValue(artifact.observations),
  '5Y premium percentile: 97.9'
);

const fresh = evaluateCapWeightPremiumArtifactFreshness(artifact, GHOSTFLOW_REFERENCE_AS_OF);
assert.ok(['fresh', 'caution', 'stale'].includes(fresh.status));

assert.ok(buildCapWeightPremiumDisplayExplanation(artifact).includes('SPY/RSP ratio 3.4945'));
assert.ok(buildCapWeightPremiumDisplayExplanation(artifact).includes('5Y spread +33.27%'));
assert.ok(buildCapWeightPremiumDisplayExplanation(artifact).includes('1M spread -3.83%'));
assert.ok(buildCapWeightPremiumDisplayExplanation(artifact).includes('ratio percentile 97.6'));
assert.ok(buildCapWeightPremiumDisplayExplanation(artifact).includes('not a pressure score'));

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const capWeight = raw.signals.find((s) => s.id === 'cap-weight-premium');

assert.ok(capWeight, 'cap-weight-premium signal must exist');
assert.strictEqual(capWeight!.dataStatus, 'public_proxy');
assert.strictEqual(capWeight!.name, CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME);
assert.strictEqual(capWeight!.numericValue, 97.9);
assert.strictEqual(capWeight!.value, '5Y premium percentile: 97.9');
assert.strictEqual(capWeight!.cardCaveat, CAP_WEIGHT_PREMIUM_DISPLAY_CARD_CAVEAT);
assert.ok(capWeight!.explanation.includes('not included in the Research Composite'));
assert.strictEqual(capWeight!.artifactAsOf, '2026-07-01');
assert.strictEqual(capWeight!.artifactPublishedAt, '2026-07-05');

const scoredCapWeight = scored.signals.find((s) => s.id === 'cap-weight-premium')!;
assert.strictEqual(signalCardBadgeLabelForSignal(scoredCapWeight, 'public'), 'DISPLAY ONLY');

assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'cap-weight-premium'));
assert.ok(!meta.publicPassiveInputKeys?.includes('cap-weight-premium' as never));

assert.strictEqual(scored.score.score, 60);
assert.strictEqual(scored.score.subScores.passivePressure, 53);
assert.strictEqual(scored.score.subScores.structuralFragility, 67);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Elevated Flow Pressure');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'cap-weight-premium'));

assert.strictEqual(PUBLIC_ARTIFACT_SIGNAL_IDS.length, 13);
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('cap-weight-premium'));

const invalidMerge = mergeCapWeightPremiumDisplayIfValid(
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

console.log('ghostflow/capWeightPremiumDisplay.test.ts: ok');
