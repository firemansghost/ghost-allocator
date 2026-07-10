/**
 * GhostFlow v0.9f — display-only CFTC TFF systematic-flow signal card tests.
 */

import assert from 'assert';
import { buildGhostFlowSnapshot } from '../buildSnapshot';
import {
  SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME,
  formatSystematicFlowDisplayValue,
} from '../artifacts/systematicFlowProxy';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
  signalCardDisplayName,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import loadProduction from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.json';
import type { SystematicFlowProxyArtifactV1 } from '../artifacts/types';

const production = loadProduction as SystematicFlowProxyArtifactV1;

assert.strictEqual(
  formatSystematicFlowDisplayValue(production.basket),
  'Net short 19.4% OI · pressure 97'
);

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const systematic = raw.signals.find((s) => s.id === 'systematic-flow');

assert.ok(systematic, 'systematic-flow signal must exist');
assert.strictEqual(systematic!.dataStatus, 'public_proxy');
assert.strictEqual(systematic!.numericValue, 97);
assert.strictEqual(systematic!.name, SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME);
assert.ok(systematic!.value.includes('Net short'));
assert.ok(systematic!.value.includes('19.4% OI'));
assert.ok(systematic!.value.includes('pressure 97'));
assert.ok(
  systematic!.cardCaveat?.includes('Display-only CFTC TFF positioning proxy') &&
    systematic!.cardCaveat?.includes('not included in the Research Composite')
);

assert.strictEqual(raw.passivePressure.systematicStrategyPressure, 62);
assert.ok(!meta.publicPassiveInputKeys.includes('systematicStrategyPressure'));
assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'systematic-flow'));

assert.strictEqual(scored.score.score, 60);
assert.strictEqual(scored.score.subScores.passivePressure, 53);
assert.strictEqual(scored.score.subScores.structuralFragility, 67);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Elevated Flow Pressure');

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
