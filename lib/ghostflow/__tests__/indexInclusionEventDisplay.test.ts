/**
 * GhostFlow v1.9c.4 — display-only index inclusion event signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeIndexInclusionEventDisplayIfValid,
} from '../buildSnapshot';
import {
  buildIndexInclusionEventDisplayExplanation,
  evaluateIndexInclusionEventArtifactFreshness,
  formatIndexInclusionEventCardValue,
  INDEX_INCLUSION_EVENT_DISPLAY_CARD_CAVEAT,
  INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME,
  loadIndexInclusionEventProxyArtifact,
} from '../artifacts/indexInclusionEventProxy';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadIndexInclusionEventProxyArtifact();
assert.ok(production.ok, production.ok ? '' : production.errors.join('; '));

const artifact = production.artifact;

assert.strictEqual(
  formatIndexInclusionEventCardValue(artifact.observations),
  'Index events in window: 4'
);

const fresh = evaluateIndexInclusionEventArtifactFreshness(artifact, GHOSTFLOW_REFERENCE_AS_OF);
assert.ok(['fresh', 'caution', 'stale'].includes(fresh.status));

assert.ok(buildIndexInclusionEventDisplayExplanation(artifact).includes('Latest effective date: 2026-04-20'));
assert.ok(buildIndexInclusionEventDisplayExplanation(artifact).includes('Event count is a display metric only'));

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const indexEvents = raw.signals.find((s) => s.id === 'index-inclusion-events');

assert.ok(indexEvents, 'index-inclusion-events signal must exist');
assert.strictEqual(indexEvents!.dataStatus, 'public_proxy');
assert.strictEqual(indexEvents!.name, INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME);
assert.strictEqual(indexEvents!.numericValue, 4);
assert.strictEqual(indexEvents!.value, 'Index events in window: 4');
assert.strictEqual(indexEvents!.cardCaveat, INDEX_INCLUSION_EVENT_DISPLAY_CARD_CAVEAT);
assert.ok(indexEvents!.explanation.includes('not included in the Research Composite'));
assert.strictEqual(indexEvents!.artifactAsOf, '2026-05-22');
assert.strictEqual(indexEvents!.artifactPublishedAt, '2026-06-16');

const scoredIndexEvents = scored.signals.find((s) => s.id === 'index-inclusion-events')!;
assert.strictEqual(signalCardBadgeLabelForSignal(scoredIndexEvents, 'public'), 'DISPLAY ONLY');

assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'index-inclusion-events'));
assert.ok(!meta.publicPassiveInputKeys?.includes('index-inclusion-events' as never));

assert.strictEqual(scored.score.score, 55);
assert.strictEqual(scored.score.subScores.passivePressure, 45);
assert.strictEqual(scored.score.subScores.structuralFragility, 65);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Elevated Flow Pressure');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'index-inclusion-events'));

const invalidMerge = mergeIndexInclusionEventDisplayIfValid(
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

console.log('ghostflow/indexInclusionEventDisplay.test.ts: ok');
