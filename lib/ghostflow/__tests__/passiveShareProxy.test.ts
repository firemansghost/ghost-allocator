/**
 * GhostFlow v0.6 — ICI Index Share Proxy mapper, validation, and merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { buildGhostFlowSnapshotWithArtifacts } from '../buildSnapshot';
import {
  classifyStructuralScoreInput,
} from '../scoreInputClassification';
import {
  computeIndexAssetSharePercent,
  deriveDistanceToModelZone,
  formatDistanceToModelZoneDisplay,
  loadPassiveShareProxyArtifact,
  mapDistanceToZoneNumericValue,
  mapIndexSharePercentToStructuralProxy,
  evaluatePassiveShareProxyArtifactFreshness,
  validatePassiveShareProxyArtifact,
} from '../artifacts/passiveShareProxy';
import type { PassiveShareProxyArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
} from './fixtures/activeIndexFlow';
import {
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
} from './fixtures/etfNetIssuance';
import {
  FIXTURE_INDEX_CONCENTRATION_MERGE,
  FIXTURE_QUAD_MERGE_EXPECTED,
} from './fixtures/indexConcentration';
import {
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED,
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF,
  FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  FIXTURE_PASSIVE_SHARE_STALE_REFERENCE_AS_OF,
  FIXTURE_PENTA_MERGE_EXPECTED,
} from './fixtures/passiveShareProxy';
import {
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- Percent computation ---
const computedShare = computeIndexAssetSharePercent(7537800, 12945700);
assert.ok(Math.abs(computedShare - FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.indexAssetSharePercent) < 0.01);

// --- Identity mapping ---
assert.strictEqual(
  mapIndexSharePercentToStructuralProxy(FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.indexAssetSharePercent),
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.structuralProxy
);

// --- Distance to 65% zone ---
assert.strictEqual(
  deriveDistanceToModelZone(FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.indexAssetSharePercent),
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.distancePp
);
assert.strictEqual(formatDistanceToModelZoneDisplay(1.8), '1.8 pp');

// --- Validation ---
const validArtifact: PassiveShareProxyArtifactV1 = { ...FIXTURE_PASSIVE_SHARE_PROXY_MERGE };

let result = validatePassiveShareProxyArtifact(
  validArtifact,
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(result.ok);

result = validatePassiveShareProxyArtifact(
  { ...validArtifact, signalId: 'wrong' as 'passive-share' },
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validatePassiveShareProxyArtifact(
  { ...validArtifact, seriesDefinition: 'wrong' as 'ici_domestic_equity_index_asset_share_percent' },
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validatePassiveShareProxyArtifact(
  {
    ...validArtifact,
    observations: {
      activeDomesticEquityAssetsMillionsUsd: 7537800,
      indexDomesticEquityAssetsMillionsUsd: 12945700,
      indexAssetSharePercent: 99,
    },
  },
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validatePassiveShareProxyArtifact(
  {
    ...validArtifact,
    observations: {
      activeDomesticEquityAssetsMillionsUsd: 7537800,
      indexDomesticEquityAssetsMillionsUsd: 12945700,
      indexAssetSharePercent: 50,
    },
  },
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validatePassiveShareProxyArtifact(
  {
    ...validArtifact,
    observations: {
      activeDomesticEquityAssetsMillionsUsd: 0,
      indexDomesticEquityAssetsMillionsUsd: 12945700,
      indexAssetSharePercent: 63.2,
    },
  },
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

// --- Monthly freshness ---
const freshMonthly = evaluatePassiveShareProxyArtifactFreshness(
  FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF
);
assert.strictEqual(freshMonthly.status, 'fresh');
assert.strictEqual(freshMonthly.ageDays, 21);

const cautionMonthly = evaluatePassiveShareProxyArtifactFreshness(
  FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  '2026-06-05'
);
assert.strictEqual(cautionMonthly.status, 'caution');
assert.strictEqual(cautionMonthly.ageDays, 36);

// --- Merge passive-share only ---
const passiveOnly = buildGhostFlowSnapshotWithArtifacts({
  passiveShare: FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  referenceAsOf: FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(passiveOnly.meta.passiveShareProxySource, 'public');
assert.strictEqual(passiveOnly.meta.publicSignalCount, 1);
assert.strictEqual(passiveOnly.raw.passiveSharePercent, FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.indexAssetSharePercent);
assert.strictEqual(
  passiveOnly.raw.structuralFragility.passiveShareProxy,
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.structuralProxy
);
assert.strictEqual(
  passiveOnly.raw.structuralFragility.modelZoneProximity,
  mapDistanceToZoneNumericValue(
    deriveDistanceToModelZone(FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.indexAssetSharePercent)
  )
);
assert.strictEqual(
  passiveOnly.raw.structuralFragility.modelZoneProximity,
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.modelZoneProximity
);

const modelZoneMeta = classifyStructuralScoreInput(
  'modelZoneProximity',
  passiveOnly.meta.publicStructuralInputKeys,
  passiveOnly.meta.passiveShareProxySource
);
assert.strictEqual(modelZoneMeta.badge, 'DERIVED');
assert.ok(modelZoneMeta.derivedFootnote?.includes('distance-to-65'));

const passiveSignal = passiveOnly.raw.signals.find((s) => s.id === 'passive-share');
assert.ok(passiveSignal);
assert.strictEqual(passiveSignal!.name, 'ICI Index Share Proxy');
assert.strictEqual(passiveSignal!.dataStatus, 'public_proxy');
assert.strictEqual(passiveSignal!.freshnessStatus, 'fresh');
assert.ok(passiveSignal!.value.includes('ICI fund/ETF index share: 63.2%'));
assert.ok(passiveSignal!.cardCaveat?.includes('public proxy'));
assert.ok(passiveSignal!.cardCaveat?.includes('price-discovery capital'));

const distanceSignal = passiveOnly.raw.signals.find((s) => s.id === 'distance-65');
assert.ok(distanceSignal);
assert.strictEqual(distanceSignal!.dataStatus, 'public_proxy');
assert.strictEqual(distanceSignal!.value, '1.8 pp');
assert.strictEqual(distanceSignal!.name, 'Distance to Model-Stress Zone');
assert.ok(distanceSignal!.sourceNote?.includes('Derived'));

const passiveScored = scoreGhostFlowSnapshot(passiveOnly.raw);
const distanceScored = passiveScored.signals.find((s) => s.id === 'distance-65');
assert.ok(distanceScored);
assert.strictEqual(distanceScored!.status, 'pre_stress');
assert.strictEqual(
  passiveScored.score.subScores.structuralFragility,
  FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED.passiveShareOnlyStructuralFragility
);

// --- Penta merge ---
const penta = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  passiveShare: FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(penta.meta.publicSignalCount, 5);
assert.strictEqual(penta.meta.passiveShareProxySource, 'public');

const pentaScored = scoreGhostFlowSnapshot(penta.raw);
assert.strictEqual(pentaScored.score.score, FIXTURE_PENTA_MERGE_EXPECTED.compositeScore);
assert.strictEqual(
  pentaScored.score.subScores.structuralFragility,
  FIXTURE_PENTA_MERGE_EXPECTED.structuralFragility
);

// --- Quad merge baseline (v0.5 without passive share) ---
const quad = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
const quadScored = scoreGhostFlowSnapshot(quad.raw);
assert.strictEqual(quadScored.score.score, FIXTURE_QUAD_MERGE_EXPECTED.compositeScore);

// --- Stale passive share still public ---
const stalePassive = buildGhostFlowSnapshotWithArtifacts({
  passiveShare: FIXTURE_PASSIVE_SHARE_PROXY_MERGE,
  referenceAsOf: FIXTURE_PASSIVE_SHARE_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(stalePassive.meta.passiveShareProxySource, 'public');
assert.ok(
  stalePassive.meta.freshnessWarnings.some((w) => w.includes('ICI Index Share Proxy') && w.includes('stale'))
);
assert.strictEqual(
  stalePassive.raw.signals.find((s) => s.id === 'passive-share')?.freshnessStatus,
  'stale'
);

// --- ETF independent when passive share missing (invalid/missing artifact fallback) ---
const etfOnly = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(etfOnly.raw.passiveSharePercent, MOCK_GHOSTFLOW_SNAPSHOT.passiveSharePercent);
assert.strictEqual(
  etfOnly.raw.structuralFragility.passiveShareProxy,
  MOCK_GHOSTFLOW_SNAPSHOT.structuralFragility.passiveShareProxy
);
assert.strictEqual(etfOnly.raw.signals.find((s) => s.id === 'passive-share')?.dataStatus, 'mock');
assert.strictEqual(etfOnly.raw.signals.find((s) => s.id === 'distance-65')?.dataStatus, 'mock');
assert.strictEqual(etfOnly.meta.etfFlowSource, 'public');

const quadWithEtf = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  activeIndex: FIXTURE_ACTIVE_INDEX_FLOW_MERGE,
  indexConcentration: FIXTURE_INDEX_CONCENTRATION_MERGE,
  referenceAsOf: FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(quadWithEtf.meta.passiveShareProxySource, 'mock_fallback');
assert.strictEqual(quadWithEtf.raw.signals.find((s) => s.id === 'distance-65')?.dataStatus, 'mock');
assert.strictEqual(quadWithEtf.meta.etfFlowSource, 'public');
assert.strictEqual(quadWithEtf.meta.publicSignalCount, 4);

// --- Committed artifact sanity ---
const loaded = loadPassiveShareProxyArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

console.log('ghostflow/passiveShareProxy.test.ts: ok');
