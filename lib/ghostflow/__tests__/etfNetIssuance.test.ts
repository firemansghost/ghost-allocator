/**
 * GhostFlow v0.3 — ETF Net Issuance mapper, validation, and merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import {
  buildGhostFlowSnapshotWithArtifacts,
} from '../buildSnapshot';
import {
  formatIssuanceBillions,
  loadEtfNetIssuanceArtifact,
  mapDomesticEquityIssuanceToNumericValue,
  validateEtfNetIssuanceArtifact,
  ETF_ISSUANCE_PROXY_ANCHORS,
} from '../artifacts/etfNetIssuance';
import type { EtfNetIssuanceArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_DUAL_MERGE_EXPECTED,
  FIXTURE_ETF_MERGE_EXPECTED,
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
  FIXTURE_ETF_STALE_REFERENCE_AS_OF,
} from './fixtures/etfNetIssuance';
import {
  FIXTURE_MERGE_REFERENCE_AS_OF,
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- Mapper ---
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(-15000), 15);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(-10000), 15);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(0), 35);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(15000), 55);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(30000), 72);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(50000), 88);
assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(80000), 88);

assert.strictEqual(mapDomesticEquityIssuanceToNumericValue(20000), FIXTURE_ETF_MERGE_EXPECTED.issuanceProxy);
assert.strictEqual(formatIssuanceBillions(33919), '$33.9B');
assert.strictEqual(formatIssuanceBillions(33919.4), '$33.9B');
assert.notStrictEqual(formatIssuanceBillions(33919), '$33.919B');

for (let m = -10000; m <= 50000; m += 500) {
  const prev = mapDomesticEquityIssuanceToNumericValue(m - 500);
  const cur = mapDomesticEquityIssuanceToNumericValue(m);
  assert.ok(cur >= prev, `monotonicity failed at ${m}`);
  assert.ok(cur >= 0 && cur <= 100);
}

// --- Validation ---
const validArtifact: EtfNetIssuanceArtifactV1 = {
  ...FIXTURE_ETF_NET_ISSUANCE_MERGE,
};

let result = validateEtfNetIssuanceArtifact(validArtifact, FIXTURE_ETF_MERGE_REFERENCE_AS_OF);
assert.ok(result.ok);

result = validateEtfNetIssuanceArtifact({ ...validArtifact, signalId: 'wrong' as 'etf-flow' }, FIXTURE_ETF_MERGE_REFERENCE_AS_OF);
assert.ok(!result.ok);

result = validateEtfNetIssuanceArtifact(
  { ...validArtifact, seriesDefinition: 'wrong' as 'domestic_equity_etf_estimated_weekly_net_issuance' },
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateEtfNetIssuanceArtifact(
  { ...validArtifact, observations: { domesticEquityNetIssuanceMillionsUsd: 90000 } },
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

result = validateEtfNetIssuanceArtifact({ ...validArtifact, asOf: '2026-02-01' }, FIXTURE_ETF_MERGE_REFERENCE_AS_OF);
assert.ok(!result.ok);

result = validateEtfNetIssuanceArtifact(
  { ...validArtifact, publishedAt: '2026-01-01' },
  FIXTURE_ETF_MERGE_REFERENCE_AS_OF
);
assert.ok(!result.ok);

// --- Merge fixture ---
const etfOnly = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(etfOnly.meta.etfFlowSource, 'public');
assert.strictEqual(etfOnly.meta.volRegimeSource, 'mock_fallback');
assert.strictEqual(etfOnly.meta.publicSignalCount, 1);
assert.strictEqual(etfOnly.raw.passivePressure.etfFundFlowImpulse, FIXTURE_ETF_MERGE_EXPECTED.issuanceProxy);

const etfSignal = etfOnly.raw.signals.find((s) => s.id === 'etf-flow');
assert.ok(etfSignal);
assert.strictEqual(etfSignal!.dataStatus, 'public_proxy');
assert.strictEqual(etfSignal!.freshnessStatus, 'fresh');
assert.strictEqual(etfSignal!.artifactAsOf, '2026-01-08');
assert.strictEqual(etfSignal!.artifactPublishedAt, '2026-01-15');

const etfScored = scoreGhostFlowSnapshot(etfOnly.raw);
assert.strictEqual(etfScored.score.subScores.passivePressure, FIXTURE_ETF_MERGE_EXPECTED.etfOnlyPassivePressure);

// --- Dual merge ---
const dual = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(dual.meta.publicSignalCount, 2);
assert.strictEqual(dual.meta.volRegimeSource, 'public');
assert.strictEqual(dual.meta.etfFlowSource, 'public');

const dualScored = scoreGhostFlowSnapshot(dual.raw);
assert.strictEqual(dualScored.score.score, FIXTURE_DUAL_MERGE_EXPECTED.compositeScore);
assert.strictEqual(dualScored.score.subScores.passivePressure, FIXTURE_DUAL_MERGE_EXPECTED.passivePressure);

// --- Stale ETF still public ---
const staleEtf = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(staleEtf.meta.etfFlowSource, 'public');
assert.ok(staleEtf.meta.freshnessWarnings.some((w) => w.includes('ETF Net Issuance') && w.includes('stale')));
assert.strictEqual(staleEtf.raw.signals.find((s) => s.id === 'etf-flow')?.freshnessStatus, 'stale');

// --- Vol independent when ETF missing ---
const volOnly = buildGhostFlowSnapshotWithArtifacts({
  vol: FIXTURE_VOL_REGIME_MERGE,
  referenceAsOf: FIXTURE_MERGE_REFERENCE_AS_OF,
});
assert.strictEqual(volOnly.meta.publicSignalCount, 1);
assert.strictEqual(volOnly.raw.signals.find((s) => s.id === 'etf-flow')?.dataStatus, 'mock');

// --- Pure mock ---
assert.strictEqual(scoreGhostFlowSnapshot(MOCK_GHOSTFLOW_SNAPSHOT).score.score, 62);

// --- Committed artifact sanity ---
const loaded = loadEtfNetIssuanceArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

assert.strictEqual(ETF_ISSUANCE_PROXY_ANCHORS.length, 5);

console.log('ghostflow/etfNetIssuance.test.ts: ok');
