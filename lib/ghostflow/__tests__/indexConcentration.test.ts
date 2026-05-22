/**
 * GhostFlow v0.5 — Index Concentration mapper, validation, and merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { buildGhostFlowSnapshotWithArtifacts } from '../buildSnapshot';
import {
  formatIndexConcentrationDisplayValue,
  loadIndexConcentrationArtifact,
  mapTop10WeightToNumericValue,
  top10ConcentrationBandLabel,
  validateIndexConcentrationArtifact,
  INDEX_CONCENTRATION_ANCHORS,
} from '../artifacts/indexConcentration';
import type { IndexConcentrationArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
  FIXTURE_TRIPLE_MERGE_EXPECTED,
} from './fixtures/activeIndexFlow';
import {
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
} from './fixtures/etfNetIssuance';
import {
  FIXTURE_INDEX_CONCENTRATION_MERGE,
  FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED,
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF,
  FIXTURE_INDEX_CONCENTRATION_STALE_REFERENCE_AS_OF,
  FIXTURE_QUAD_MERGE_EXPECTED,
} from './fixtures/indexConcentration';
import {
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- Mapper anchors ---
assert.strictEqual(mapTop10WeightToNumericValue(15), 20);
assert.strictEqual(mapTop10WeightToNumericValue(22), 20);
assert.strictEqual(mapTop10WeightToNumericValue(28), 40);
assert.strictEqual(mapTop10WeightToNumericValue(33), 58);
assert.strictEqual(mapTop10WeightToNumericValue(37), 72);
assert.strictEqual(mapTop10WeightToNumericValue(40), 85);
assert.strictEqual(mapTop10WeightToNumericValue(45), 85);

assert.strictEqual(
  mapTop10WeightToNumericValue(FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED.top10WeightPercent),
  FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED.concentrationProxy
);

for (let p = 15; p <= 45; p += 0.5) {
  const prev = mapTop10WeightToNumericValue(Math.max(15, p - 0.5));
  const cur = mapTop10WeightToNumericValue(p);
  assert.ok(cur >= prev, `monotonicity failed at ${p}`);
  assert.ok(cur >= 0 && cur <= 100);
}

// --- Band label + display ---
assert.strictEqual(top10ConcentrationBandLabel(36.5), 'Top-heavy');
assert.strictEqual(
  formatIndexConcentrationDisplayValue(36.5, 70),
  'Top 10 index weight 36.5% · proxy 70/100'
);

// --- Validation ---
const validArtifact: IndexConcentrationArtifactV1 = { ...FIXTURE_INDEX_CONCENTRATION_MERGE };

let result = validateIndexConcentrationArtifact(
  validArtifact,
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(result.ok);

result = validateIndexConcentrationArtifact(
  { ...validArtifact, signalId: 'wrong' as 'concentration' },
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateIndexConcentrationArtifact(
  { ...validArtifact, seriesDefinition: 'wrong' as 'sp500_index_top10_weight_percent' },
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateIndexConcentrationArtifact(
  {
    ...validArtifact,
    observations: { sp500Top10IndexWeightPercent: 12 },
  },
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateIndexConcentrationArtifact(
  { ...validArtifact, asOf: '2026-06-01' },
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

// --- Merge concentration-only ---
const concentrationOnly = buildGhostFlowSnapshotWithArtifacts({
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  referenceAsOf: FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(concentrationOnly.meta.indexConcentrationSource, 'public');
assert.strictEqual(concentrationOnly.meta.volRegimeSource, 'mock_fallback');
assert.strictEqual(concentrationOnly.meta.etfFlowSource, 'mock_fallback');
assert.strictEqual(concentrationOnly.meta.activeIndexFlowSource, 'mock_fallback');
assert.strictEqual(concentrationOnly.meta.publicSignalCount, 1);
assert.strictEqual(
  concentrationOnly.raw.structuralFragility.indexConcentration,
  FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED.concentrationProxy
);
assert.strictEqual(
  concentrationOnly.raw.structuralFragility.activeShareOffsetProxy,
  MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility.activeShareOffsetProxy
);

const concentrationSignal = concentrationOnly.raw.signals.find((s) => s.id === 'concentration');
assert.ok(concentrationSignal);
assert.strictEqual(concentrationSignal!.dataStatus, 'public_proxy');
assert.strictEqual(concentrationSignal!.freshnessStatus, 'caution');
assert.strictEqual(concentrationSignal!.artifactAsOf, '2026-03-31');
assert.strictEqual(concentrationSignal!.artifactPublishedAt, '2026-04-09');
assert.strictEqual(concentrationSignal!.value, 'Top 10 index weight 36.5% · proxy 70/100');

const concentrationScored = scoreGhostFlowSnapshot(concentrationOnly.raw);
assert.strictEqual(
  concentrationScored.score.subScores.structuralFragility,
  FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED.indexConcentrationOnlyStructuralFragility
);

// --- Quad merge ---
const quad = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(quad.meta.publicSignalCount, 4);
assert.strictEqual(quad.meta.volRegimeSource, 'public');
assert.strictEqual(quad.meta.etfFlowSource, 'public');
assert.strictEqual(quad.meta.activeIndexFlowSource, 'public');
assert.strictEqual(quad.meta.indexConcentrationSource, 'public');

const quadScored = scoreGhostFlowSnapshot(quad.raw);
assert.strictEqual(quadScored.score.score, FIXTURE_QUAD_MERGE_EXPECTED.compositeScore);
assert.strictEqual(
  quadScored.score.subScores.structuralFragility,
  FIXTURE_QUAD_MERGE_EXPECTED.structuralFragility
);

// --- Triple merge baseline (v0.4 without concentration) ---
const triple = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
const tripleScored = scoreGhostFlowSnapshot(triple.raw);
assert.strictEqual(tripleScored.score.score, FIXTURE_TRIPLE_MERGE_EXPECTED.compositeScore);
assert.ok(
  quadScored.score.score >= tripleScored.score.score,
  'v0.5 quad merge composite should be >= v0.4 triple merge'
);

// --- Stale concentration still public ---
const staleConcentration = buildGhostFlowSnapshotWithArtifacts({
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  referenceAsOf: FIXTURE_INDEX_CONCENTRATION_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(staleConcentration.meta.indexConcentrationSource, 'public');
assert.ok(
  staleConcentration.meta.freshnessWarnings.some((w) => w.includes('Index Concentration') && w.includes('stale'))
);
assert.strictEqual(
  staleConcentration.raw.signals.find((s) => s.id === 'concentration')?.freshnessStatus,
  'stale'
);

// --- Invalid concentration validation rejects out-of-range percent ---
const invalidValidation = validateIndexConcentrationArtifact(
  {
    ...FIXTURE_INDEX_CONCENTRATION_MERGE,
    observations: { sp500Top10IndexWeightPercent: 99 },
  },
  FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF
);
assert.ok(!invalidValidation.ok);

// --- ETF independent when concentration missing ---
const etfOnly = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(etfOnly.meta.publicSignalCount, 1);
assert.strictEqual(etfOnly.raw.signals.find((s) => s.id === 'concentration')?.dataStatus, 'mock');
assert.strictEqual(
  etfOnly.raw.structuralFragility.indexConcentration,
  MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility.indexConcentration
);

// --- Committed artifact sanity ---
const loaded = loadIndexConcentrationArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

assert.strictEqual(INDEX_CONCENTRATION_ANCHORS.length, 5);

console.log('ghostflow/indexConcentration.test.ts: ok');
