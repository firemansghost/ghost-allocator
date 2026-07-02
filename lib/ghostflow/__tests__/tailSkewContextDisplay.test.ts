/**
 * GhostFlow v1.9e.4 — display-only Tail Skew Context signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeTailSkewContextDisplayIfValid,
} from '../buildSnapshot';
import {
  buildTailSkewDisplayExplanation,
  evaluateTailSkewArtifactFreshness,
  formatTailSkewCardValue,
  loadTailSkewContextArtifact,
  TAIL_SKEW_DISPLAY_CARD_CAVEAT,
  TAIL_SKEW_DISPLAY_SIGNAL_NAME,
} from '../artifacts/tailSkewContext';
import {
  groupSignalsByPresentation,
  PUBLIC_ARTIFACT_SIGNAL_IDS,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadTailSkewContextArtifact();
assert.ok(production.ok, production.ok ? '' : production.errors.join('; '));

const artifact = production.artifact;

assert.strictEqual(artifact.asOf, '2026-06-18');
assert.strictEqual(artifact.observations.currentSkew, 146.72);
assert.strictEqual(artifact.historySummary?.latestSourceDate, '2026-06-18');
assert.strictEqual(artifact.historySummary?.latestSourceValue, 146.72);

assert.strictEqual(
  formatTailSkewCardValue(artifact.observations),
  'SKEW index level: 146.72'
);

const fresh = evaluateTailSkewArtifactFreshness(artifact, GHOSTFLOW_REFERENCE_AS_OF);
assert.ok(['fresh', 'caution', 'stale'].includes(fresh.status));

assert.ok(buildTailSkewDisplayExplanation(artifact).includes('not included in the Research Composite'));
assert.ok(buildTailSkewDisplayExplanation(artifact).includes('VIX remains the score-fed volatility level'));

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const tailSkew = raw.signals.find((s) => s.id === 'tail-skew-context');

assert.ok(tailSkew, 'tail-skew-context signal must exist');
assert.strictEqual(tailSkew!.dataStatus, 'public_proxy');
assert.strictEqual(tailSkew!.name, TAIL_SKEW_DISPLAY_SIGNAL_NAME);
assert.strictEqual(tailSkew!.numericValue, 146.72);
assert.strictEqual(tailSkew!.value, 'SKEW index level: 146.72');
assert.ok(tailSkew!.cardCaveat?.includes('not a score input'));
assert.strictEqual(tailSkew!.artifactAsOf, '2026-06-18');

const scoredTailSkew = scored.signals.find((s) => s.id === 'tail-skew-context')!;
assert.strictEqual(signalCardBadgeLabelForSignal(scoredTailSkew, 'public'), 'DISPLAY ONLY');

assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'tail-skew-context'));
assert.ok(!meta.publicPassiveInputKeys?.includes('tail-skew-context' as never));

assert.strictEqual(scored.score.score, 55);
assert.strictEqual(scored.score.subScores.passivePressure, 45);
assert.strictEqual(scored.score.subScores.structuralFragility, 65);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Elevated Flow Pressure');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'tail-skew-context'));

const scoreFedCount = grouped.publicArtifacts.filter(
  (s) => signalCardBadgeLabelForSignal(s, 'public') !== 'DISPLAY ONLY'
).length;
const displayOnlyCount = grouped.publicArtifacts.filter(
  (s) => signalCardBadgeLabelForSignal(s, 'public') === 'DISPLAY ONLY'
).length;
assert.strictEqual(scoreFedCount, 6);
assert.strictEqual(displayOnlyCount, 7);

assert.strictEqual(PUBLIC_ARTIFACT_SIGNAL_IDS.length, 13);
assert.ok(PUBLIC_ARTIFACT_SIGNAL_IDS.includes('tail-skew-context'));

const invalidMerge = mergeTailSkewContextDisplayIfValid(
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

console.log('ghostflow/tailSkewContextDisplay.test.ts: ok');
