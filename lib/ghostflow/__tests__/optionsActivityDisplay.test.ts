/**
 * GhostFlow v1.4d — display-only index options intensity signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeOptionsActivityDisplayIfValid,
} from '../buildSnapshot';
import {
  evaluateOptionsActivityArtifactFreshness,
  formatOptionsActivityCardValue,
  loadOptionsActivityProxyArtifact,
  OPTIONS_ACTIVITY_DISPLAY_CARD_CAVEAT,
  OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME,
} from '../artifacts/optionsActivityProxy';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadOptionsActivityProxyArtifact();
assert.ok(production.ok, production.ok ? '' : production.errors.join('; '));

const artifact = production.artifact;

assert.strictEqual(
  formatOptionsActivityCardValue(artifact.observations),
  'Index 5.7M contracts · 7.5% of total'
);

const fresh = evaluateOptionsActivityArtifactFreshness(artifact, GHOSTFLOW_REFERENCE_AS_OF);
assert.ok(['fresh', 'caution', 'stale'].includes(fresh.status));

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const options = raw.signals.find((s) => s.id === 'options-activity-proxy');

assert.ok(options, 'options-activity-proxy signal must exist');
assert.strictEqual(options!.dataStatus, 'public_proxy');
assert.strictEqual(options!.name, OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME);
assert.strictEqual(options!.numericValue, 7.52);
assert.ok(options!.value.includes('Index 5.7M contracts'));
assert.ok(options!.value.includes('7.5% of total'));
assert.ok(!options!.value.includes('PCR'));
assert.strictEqual(options!.cardCaveat, OPTIONS_ACTIVITY_DISPLAY_CARD_CAVEAT);
assert.ok(options!.explanation.includes('Not 0DTE'));
assert.ok(options!.explanation.includes('gamma/GEX'));
assert.ok(options!.explanation.includes('not included in the Research Composite'));

assert.ok(!raw.signals.some((s) => s.id === 'odte-options'));

const scoredOptions = scored.signals.find((s) => s.id === 'options-activity-proxy')!;
assert.strictEqual(signalCardBadgeLabelForSignal(scoredOptions, 'public'), 'DISPLAY ONLY');

const volAmp = raw.passivePressure.optionsVolatilityAmplifier;
assert.ok(Number.isFinite(volAmp) && volAmp > 0);
assert.ok(meta.publicPassiveInputKeys?.includes('optionsVolatilityAmplifier'));
assert.strictEqual(
  raw.signals.find((s) => s.id === 'vol-regime')?.numericValue,
  volAmp
);
assert.strictEqual(meta.publicSignalCount, 10);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'options-activity-proxy'));

assert.strictEqual(scored.score.score, 62);
assert.strictEqual(scored.score.subScores.passivePressure, 58);
assert.strictEqual(scored.score.subScores.structuralFragility, 66);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Crowded / Reflexive');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'options-activity-proxy'));
assert.deepStrictEqual(grouped.mockProxies.map((s) => s.id), []);
assert.ok(!grouped.mockProxies.some((s) => s.id === 'odte-options'));

const invalidMerge = mergeOptionsActivityDisplayIfValid(
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

console.log('ghostflow/optionsActivityDisplay.test.ts: ok');
