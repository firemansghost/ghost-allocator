/**
 * GhostFlow v0.9f — display-only CFTC TFF systematic-flow signal card tests.
 */

import assert from 'assert';
import { buildGhostFlowSnapshot } from '../buildSnapshot';
import {
  SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME,
  formatSystematicFlowDisplayValue,
  loadSystematicFlowProxyArtifact,
} from '../artifacts/systematicFlowProxy';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
  signalCardDisplayName,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { PRODUCTION_SCORE_BASELINE } from './fixtures/productionScoreBaseline';

const loaded = loadSystematicFlowProxyArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));
const production = loaded.artifact;
const expectedDisplay = formatSystematicFlowDisplayValue(production.basket);

assert.strictEqual(formatSystematicFlowDisplayValue(production.basket), expectedDisplay);

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const systematic = raw.signals.find((s) => s.id === 'systematic-flow');

assert.ok(systematic, 'systematic-flow signal must exist');
assert.strictEqual(systematic!.dataStatus, 'public_proxy');
assert.strictEqual(systematic!.numericValue, production.basket.basketScore);
assert.strictEqual(systematic!.name, SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME);
assert.strictEqual(systematic!.value, expectedDisplay);
assert.ok(systematic!.value.includes('Net short'));
assert.ok(
  systematic!.cardCaveat?.includes('Display-only CFTC TFF positioning proxy') &&
    systematic!.cardCaveat?.includes('not included in the Research Composite')
);

assert.strictEqual(
  raw.passivePressure.systematicStrategyPressure,
  PRODUCTION_SCORE_BASELINE.mockPassiveInputs.systematicStrategyPressure
);
assert.ok(!meta.publicPassiveInputKeys.includes('systematicStrategyPressure'));
assert.strictEqual(meta.publicSignalCount, PRODUCTION_SCORE_BASELINE.publicSignalCount);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'systematic-flow'));

assert.strictEqual(scored.score.score, PRODUCTION_SCORE_BASELINE.composite);
assert.strictEqual(scored.score.subScores.passivePressure, PRODUCTION_SCORE_BASELINE.passive);
assert.strictEqual(
  scored.score.subScores.structuralFragility,
  PRODUCTION_SCORE_BASELINE.structural
);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), PRODUCTION_SCORE_BASELINE.bandLabel);

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'systematic-flow'));
assert.deepStrictEqual(grouped.mockProxies.map((s) => s.id), []);

const publicSystematic = grouped.publicArtifacts.find((s) => s.id === 'systematic-flow')!;
const scoredSystematic = scored.signals.find((s) => s.id === 'systematic-flow')!;
assert.strictEqual(
  signalCardBadgeLabelForSignal(scoredSystematic, 'public'),
  'DISPLAY ONLY'
);
assert.strictEqual(
  signalCardDisplayName(publicSystematic),
  SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME
);
assert.notStrictEqual(signalCardDisplayName(publicSystematic), 'Future Systematic Flow Feed');

console.log('ghostflow/systematicFlowDisplay.test.ts: ok');
