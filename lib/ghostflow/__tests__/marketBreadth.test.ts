/**
 * GhostFlow v0.7 — Market Breadth Participation mapper, validation, and merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { buildGhostFlowSnapshotWithArtifacts } from '../buildSnapshot';
import {
  BREADTH_STRENGTH_ANCHORS,
  formatMarketBreadthDisplayValue,
  loadMarketBreadthArtifact,
  mapSp500Above50MaToBreadthWeakness,
  breadthParticipationBandLabel,
  validateMarketBreadthArtifact,
} from '../artifacts/marketBreadth';
import type { MarketBreadthArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
} from './fixtures/activeIndexFlow';
import {
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
} from './fixtures/etfNetIssuance';
import {
  FIXTURE_INDEX_CONCENTRATION_MERGE,
} from './fixtures/indexConcentration';
import {
  FIXTURE_MARKET_BREADTH_MERGE,
  FIXTURE_MARKET_BREADTH_MERGE_EXPECTED,
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF,
  FIXTURE_MARKET_BREADTH_STALE_REFERENCE_AS_OF,
  FIXTURE_HEXA_MERGE_EXPECTED,
} from './fixtures/marketBreadth';
import {
  FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  FIXTURE_PENTA_MERGE_EXPECTED,
} from './fixtures/passiveShareProxy';
import {
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- Mapper anchors ---
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(20), 92);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(15), 92);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(30), 80);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(40), 68);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(50), 52);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(60), 38);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(75), 20);
assert.strictEqual(mapSp500Above50MaToBreadthWeakness(90), 20);

assert.strictEqual(
  mapSp500Above50MaToBreadthWeakness(FIXTURE_MARKET_BREADTH_MERGE_EXPECTED.strengthPercent),
  FIXTURE_MARKET_BREADTH_MERGE_EXPECTED.breadthWeaknessProxy
);

for (let s = 20; s <= 75; s += 0.5) {
  const prev = mapSp500Above50MaToBreadthWeakness(Math.max(20, s - 0.5));
  const cur = mapSp500Above50MaToBreadthWeakness(s);
  assert.ok(cur <= prev, `monotonicity failed at strength ${s}`);
  assert.ok(cur >= 0 && cur <= 100);
}

// --- Band label + display ---
assert.strictEqual(breadthParticipationBandLabel(56.8), 'Mixed / split market');
assert.strictEqual(
  formatMarketBreadthDisplayValue(56.8, 42),
  '56.8% above 50-day MA · weakness proxy 42/100'
);

// --- Validation ---
const validArtifact: MarketBreadthArtifactV1 = { ...FIXTURE_MARKET_BREADTH_MERGE };

let result = validateMarketBreadthArtifact(
  validArtifact,
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF
);
assert.ok(result.ok);

result = validateMarketBreadthArtifact(
  { ...validArtifact, signalId: 'wrong' as 'breadth' },
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateMarketBreadthArtifact(
  { ...validArtifact, seriesDefinition: 'wrong' as 'sp500_percent_above_50_day_ma' },
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateMarketBreadthArtifact(
  {
    ...validArtifact,
    observations: { sp500Above50DayMaPercent: 101 },
  },
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateMarketBreadthArtifact(
  { ...validArtifact, asOf: '2026-06-01' },
  FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

// --- Merge breadth-only ---
const breadthOnly = buildGhostFlowSnapshotWithArtifacts({
  breadth: FIXTURE_MARKET_BREADTH_MERGE,
  referenceAsOf: FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(breadthOnly.meta.breadthSource, 'public');
assert.strictEqual(breadthOnly.meta.volRegimeSource, 'mock_fallback');
assert.strictEqual(breadthOnly.meta.publicSignalCount, 1);
assert.strictEqual(
  breadthOnly.raw.structuralFragility.breadthWeakness,
  FIXTURE_MARKET_BREADTH_MERGE_EXPECTED.breadthWeaknessProxy
);
assert.strictEqual(
  breadthOnly.raw.structuralFragility.indexConcentration,
  MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility.indexConcentration
);

const breadthSignal = breadthOnly.raw.signals.find((s) => s.id === 'breadth');
assert.ok(breadthSignal);
assert.strictEqual(breadthSignal!.dataStatus, 'public_proxy');
assert.strictEqual(breadthSignal!.freshnessStatus, 'fresh');
assert.strictEqual(breadthSignal!.name, 'Market Breadth Participation');
assert.strictEqual(breadthSignal!.value, '56.8% above 50-day MA · weakness proxy 42/100');

const breadthScored = scoreGhostFlowSnapshot(breadthOnly.raw);
assert.strictEqual(
  breadthScored.score.subScores.structuralFragility,
  FIXTURE_MARKET_BREADTH_MERGE_EXPECTED.breadthOnlyStructuralFragility
);

// --- Hexa merge (all six public artifacts) ---
const hexa = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  passiveShare: FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  breadth: FIXTURE_MARKET_BREADTH_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(hexa.meta.publicSignalCount, 6);
assert.strictEqual(hexa.meta.breadthSource, 'public');
assert.strictEqual(hexa.meta.passiveShareProxySource, 'public');
assert.strictEqual(hexa.meta.publicStructuralInputKeys.length, 4);
assert.strictEqual(hexa.meta.publicPassiveInputKeys.length, 2);

const hexaScored = scoreGhostFlowSnapshot(hexa.raw);
assert.strictEqual(hexaScored.score.score, FIXTURE_HEXA_MERGE_EXPECTED.compositeScore);
assert.strictEqual(
  hexaScored.score.subScores.structuralFragility,
  FIXTURE_HEXA_MERGE_EXPECTED.structuralFragility
);

// --- Penta merge baseline (v0.6 without breadth) ---
const penta = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  passiveShare: FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
const pentaScored = scoreGhostFlowSnapshot(penta.raw);
assert.strictEqual(pentaScored.score.score, FIXTURE_PENTA_MERGE_EXPECTED.compositeScore);
assert.ok(
  pentaScored.score.score >= hexaScored.score.score,
  'v0.7 hexa merge composite should be <= v0.6 penta merge when breadth lowers weakness vs mock'
);

// --- Stale breadth still public ---
const staleBreadth = buildGhostFlowSnapshotWithArtifacts({
  breadth: FIXTURE_MARKET_BREADTH_MERGE,
  referenceAsOf: FIXTURE_MARKET_BREADTH_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(staleBreadth.meta.breadthSource, 'public');
assert.ok(
  staleBreadth.meta.freshnessWarnings.some((w) => w.includes('Market Breadth Participation') && w.includes('stale'))
);
assert.strictEqual(
  staleBreadth.raw.signals.find((s) => s.id === 'breadth')?.freshnessStatus,
  'stale'
);

// --- ETF independent when breadth missing (invalid validation) ---
const etfOnly = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(etfOnly.meta.publicSignalCount, 1);
assert.strictEqual(etfOnly.raw.signals.find((s) => s.id === 'breadth')?.dataStatus, 'mock');
assert.strictEqual(
  etfOnly.raw.structuralFragility.breadthWeakness,
  MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility.breadthWeakness
);

// --- Committed artifact sanity ---
const loaded = loadMarketBreadthArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

assert.strictEqual(BREADTH_STRENGTH_ANCHORS.length, 6);

console.log('ghostflow/marketBreadth.test.ts: ok');
