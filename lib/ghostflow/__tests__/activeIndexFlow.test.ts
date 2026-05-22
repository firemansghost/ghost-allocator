/**
 * GhostFlow v0.4 — Active vs Index Flow mapper, validation, and merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { buildGhostFlowSnapshotWithArtifacts } from '../buildSnapshot';
import {
  computeFlowDifferentialMillionsUsd,
  formatFlowBillions,
  loadActiveIndexFlowArtifact,
  mapFlowDifferentialToNumericValue,
  validateActiveIndexFlowArtifact,
  ACTIVE_INDEX_DIFFERENTIAL_ANCHORS,
} from '../artifacts/activeIndexFlow';
import type { ActiveIndexFlowArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED,
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
  FIXTURE_ACTIVE_INDEX_STALE_REFERENCE_AS_OF,
  FIXTURE_TRIPLE_MERGE_EXPECTED,
} from './fixtures/activeIndexFlow';
import {
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
} from './fixtures/etfNetIssuance';
import {
  FIXTURE_MERGE_REFERENCE_AS_OF,
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- Differential ---
assert.strictEqual(
  computeFlowDifferentialMillionsUsd(-22251, 31463),
  FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED.differentialMillions
);

// --- Mapper ---
assert.strictEqual(mapFlowDifferentialToNumericValue(-1000), 20);
assert.strictEqual(mapFlowDifferentialToNumericValue(0), 20);
assert.strictEqual(mapFlowDifferentialToNumericValue(20000), 45);
assert.strictEqual(mapFlowDifferentialToNumericValue(50000), 70);
assert.strictEqual(mapFlowDifferentialToNumericValue(80000), 85);
assert.strictEqual(mapFlowDifferentialToNumericValue(120000), 85);

assert.strictEqual(
  mapFlowDifferentialToNumericValue(FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED.differentialMillions),
  FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED.flowTiltProxy
);

for (let m = -5000; m <= 90000; m += 2500) {
  const prev = mapFlowDifferentialToNumericValue(m - 2500);
  const cur = mapFlowDifferentialToNumericValue(m);
  assert.ok(cur >= prev, `monotonicity failed at ${m}`);
  assert.ok(cur >= 0 && cur <= 100);
}

// --- Display billions ---
assert.strictEqual(formatFlowBillions(-22251), '-$22.3B');
assert.strictEqual(formatFlowBillions(31463, true), '+$31.5B');
assert.strictEqual(formatFlowBillions(53714, true), '+$53.7B');
assert.notStrictEqual(formatFlowBillions(53714, true), '+$53.714B');

// --- Validation ---
const validArtifact: ActiveIndexFlowArtifactV1 = { ...FIXTURE_ACTIVE_INDEX_FLOW_MERGE };

let result = validateActiveIndexFlowArtifact(validArtifact, FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF);
assert.ok(result.ok);

result = validateActiveIndexFlowArtifact(
  { ...validArtifact, signalId: 'wrong' as 'active-index-flow' },
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateActiveIndexFlowArtifact(
  { ...validArtifact, seriesDefinition: 'wrong' as 'domestic_equity_active_index_monthly_net_flows' },
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateActiveIndexFlowArtifact(
  {
    ...validArtifact,
    observations: {
      activeDomesticEquityNetFlowMillionsUsd: -22251,
      indexDomesticEquityNetFlowMillionsUsd: 200000,
    },
  },
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateActiveIndexFlowArtifact(
  { ...validArtifact, asOf: '2026-06-01' },
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateActiveIndexFlowArtifact(
  { ...validArtifact, publishedAt: '2026-03-01' },
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

// --- Merge fixture ---
const activeOnly = buildGhostFlowSnapshotWithArtifacts({
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(activeOnly.meta.activeIndexFlowSource, 'public');
assert.strictEqual(activeOnly.meta.volRegimeSource, 'mock_fallback');
assert.strictEqual(activeOnly.meta.etfFlowSource, 'mock_fallback');
assert.strictEqual(activeOnly.meta.publicSignalCount, 1);
assert.strictEqual(
  activeOnly.raw.structuralFragility.activeShareOffsetProxy,
  FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED.flowTiltProxy
);
assert.strictEqual(activeOnly.raw.passivePressure.etfFundFlowImpulse, MOCK_GHOSTFLOW_SNAPSHOT.passivePressure.etfFundFlowImpulse);

const activeSignal = activeOnly.raw.signals.find((s) => s.id === 'active-index-flow');
assert.ok(activeSignal);
assert.strictEqual(activeSignal!.dataStatus, 'public_proxy');
assert.strictEqual(activeSignal!.freshnessStatus, 'fresh');
assert.strictEqual(activeSignal!.artifactAsOf, '2026-03-31');
assert.strictEqual(activeSignal!.artifactPublishedAt, '2026-04-30');

const activeScored = scoreGhostFlowSnapshot(activeOnly.raw);
assert.strictEqual(
  activeScored.score.subScores.structuralFragility,
  FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED.activeIndexOnlyStructuralFragility
);

// --- Triple merge ---
const triple = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(triple.meta.publicSignalCount, 3);
assert.strictEqual(triple.meta.volRegimeSource, 'public');
assert.strictEqual(triple.meta.etfFlowSource, 'public');
assert.strictEqual(triple.meta.activeIndexFlowSource, 'public');

const tripleScored = scoreGhostFlowSnapshot(triple.raw);
assert.strictEqual(tripleScored.score.score, FIXTURE_TRIPLE_MERGE_EXPECTED.compositeScore);
assert.strictEqual(
  tripleScored.score.subScores.structuralFragility,
  FIXTURE_TRIPLE_MERGE_EXPECTED.structuralFragility
);

// --- Stale active/index still public ---
const staleActive = buildGhostFlowSnapshotWithArtifacts({
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(staleActive.meta.activeIndexFlowSource, 'public');
assert.ok(
  staleActive.meta.freshnessWarnings.some((w) => w.includes('Active vs Index Flow') && w.includes('stale'))
);
assert.strictEqual(
  staleActive.raw.signals.find((s) => s.id === 'active-index-flow')?.freshnessStatus,
  'stale'
);

// --- ETF independent when active/index missing ---
const etfOnly = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(etfOnly.meta.publicSignalCount, 1);
assert.strictEqual(etfOnly.raw.signals.find((s) => s.id === 'active-index-flow')?.dataStatus, undefined);

// --- Committed artifact sanity ---
const loaded = loadActiveIndexFlowArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

assert.strictEqual(ACTIVE_INDEX_DIFFERENTIAL_ANCHORS.length, 4);

console.log('ghostflow/activeIndexFlow.test.ts: ok');
