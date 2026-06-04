/**
 * GhostFlow v1.1d — display-only levered ETF rebalance pressure signal card tests.
 */

import assert from 'assert';
import {
  buildGhostFlowSnapshot,
  mergeLeveredEtfRebalanceDisplayIfValid,
} from '../buildSnapshot';
import {
  evaluateLeveredEtfRebalanceArtifactFreshness,
  formatLeveredEtfRebalanceDisplayValue,
  LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_NAME,
} from '../artifacts/leveredEtfRebalancePressure';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
} from '../signalPresentation';
import { ghostFlowBandLabel, scoreGhostFlowSnapshot } from '../scoring';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import loadProduction from '@/data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json';
import type { LeveredEtfRebalancePressureArtifactV1 } from '../artifacts/types';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';

const production = loadProduction as LeveredEtfRebalancePressureArtifactV1;

assert.strictEqual(
  formatLeveredEtfRebalanceDisplayValue(production.observations),
  'Est. buy $1.34B · 2.78% of universe AUM'
);

const fresh = evaluateLeveredEtfRebalanceArtifactFreshness(
  production,
  GHOSTFLOW_REFERENCE_AS_OF
);
assert.strictEqual(fresh.status, 'fresh');

const { raw, meta } = buildGhostFlowSnapshot();
const scored = scoreGhostFlowSnapshot(raw);
const levered = raw.signals.find((s) => s.id === 'levered-etf-rebalance');

assert.ok(levered, 'levered-etf-rebalance signal must exist');
assert.strictEqual(levered!.dataStatus, 'public_proxy');
assert.strictEqual(levered!.name, LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_NAME);
assert.strictEqual(levered!.numericValue, 2.78);
assert.ok(levered!.value.includes('buy'));
assert.ok(levered!.value.includes('$1.34B'));
assert.ok(levered!.value.includes('2.78%'));
assert.ok(
  levered!.cardCaveat?.includes('Display-only levered ETF rebalance estimate') &&
    levered!.cardCaveat?.includes('not included in the Research Composite')
);

const scoredLevered = scored.signals.find((s) => s.id === 'levered-etf-rebalance')!;
assert.strictEqual(
  signalCardBadgeLabelForSignal(scoredLevered, 'public'),
  'DISPLAY ONLY'
);

assert.strictEqual(raw.passivePressure.leveredEtfRebalancePressure, 55);
assert.ok(!meta.publicPassiveInputKeys?.includes('leveredEtfRebalancePressure'));
assert.strictEqual(meta.publicStructuralInputKeys?.length, 4);
assert.strictEqual(meta.publicSignalCount, 10);
assert.ok(meta.publicSignals.some((s) => s.signalId === 'levered-etf-rebalance'));

assert.strictEqual(scored.score.score, 62);
assert.strictEqual(scored.score.subScores.passivePressure, 58);
assert.strictEqual(scored.score.subScores.structuralFragility, 66);
assert.strictEqual(ghostFlowBandLabel(scored.score.band), 'Crowded / Reflexive');

const grouped = groupSignalsByPresentation(scored.signals);
assert.ok(grouped.publicArtifacts.some((s) => s.id === 'levered-etf-rebalance'));
assert.deepStrictEqual(grouped.mockProxies.map((s) => s.id), []);

const invalidMerge = mergeLeveredEtfRebalanceDisplayIfValid(
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
  !invalidMerge.raw.signals.some((s) => s.id === 'levered-etf-rebalance')
);

console.log('ghostflow/leveredEtfRebalanceDisplay.test.ts: ok');
