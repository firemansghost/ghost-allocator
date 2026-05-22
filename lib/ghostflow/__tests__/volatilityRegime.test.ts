/**
 * GhostFlow v0.2 — VIX mapper, artifact validation, and snapshot merge tests.
 */

import assert from 'assert';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { buildGhostFlowSnapshotWithArtifact } from '../buildSnapshot';
import {
  loadVolatilityRegimeArtifact,
  mapVixCloseToNumericValue,
  validateVolatilityRegimeArtifact,
  VIX_PROXY_ANCHORS,
} from '../artifacts/volatilityRegime';
import type { VolatilityRegimeArtifactV1 } from '../artifacts/types';
import {
  FIXTURE_MERGE_EXPECTED,
  FIXTURE_MERGE_REFERENCE_AS_OF,
  FIXTURE_STALE_REFERENCE_AS_OF,
  FIXTURE_VOL_REGIME_MERGE,
} from './fixtures/volatilityRegime';

// --- VIX mapper ---
assert.strictEqual(mapVixCloseToNumericValue(10), 15);
assert.strictEqual(mapVixCloseToNumericValue(12), 15);
assert.strictEqual(mapVixCloseToNumericValue(17), 35);
assert.strictEqual(mapVixCloseToNumericValue(22), 55);
assert.strictEqual(mapVixCloseToNumericValue(28), 72);
assert.strictEqual(mapVixCloseToNumericValue(29), 88);
assert.strictEqual(mapVixCloseToNumericValue(50), 88);

const v1744 = mapVixCloseToNumericValue(17.44);
assert.strictEqual(v1744, FIXTURE_MERGE_EXPECTED.volProxy);
assert.ok(v1744 > 35 && v1744 < 55, `17.44 should interpolate between 35 and 55, got ${v1744}`);

assert.ok(mapVixCloseToNumericValue(15) >= 15);
assert.ok(mapVixCloseToNumericValue(15) <= 35);
assert.ok(mapVixCloseToNumericValue(20) >= 35);
assert.ok(mapVixCloseToNumericValue(20) <= 55);

for (let v = 5; v <= 90; v += 0.5) {
  const prev = mapVixCloseToNumericValue(v - 0.5);
  const cur = mapVixCloseToNumericValue(v);
  assert.ok(cur >= prev, `monotonicity failed at vix=${v}`);
  assert.ok(cur >= 0 && cur <= 100);
}

// --- Validation (inline fixture — not committed artifact) ---
const validArtifact: VolatilityRegimeArtifactV1 = {
  artifactVersion: '1',
  signalId: 'vol-regime',
  asOf: '2026-01-15',
  publishedAt: '2026-01-15',
  source: { name: 'CBOE VIX History', url: 'https://example.com/vix.csv' },
  updateFrequency: 'daily',
  dataQuality: 'verified_manual',
  observations: { vixClose: 17.44 },
};

const validationReference = '2026-01-15';

let result = validateVolatilityRegimeArtifact(validArtifact, validationReference);
assert.ok(result.ok);

result = validateVolatilityRegimeArtifact({ ...validArtifact, signalId: 'wrong' as 'vol-regime' }, validationReference);
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact(
  { ...validArtifact, observations: { vixClose: 3 } },
  validationReference
);
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact({ ...validArtifact, asOf: '2026-01-20' }, validationReference);
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact(
  { ...validArtifact, publishedAt: '2026-01-10' },
  validationReference
);
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact(null, validationReference);
assert.ok(!result.ok);

// --- Merge with fixed test fixture (not committed artifact) ---
const built = buildGhostFlowSnapshotWithArtifact(FIXTURE_VOL_REGIME_MERGE, FIXTURE_MERGE_REFERENCE_AS_OF);
assert.strictEqual(built.meta.dataMix, 'mixed');
assert.strictEqual(built.meta.volRegimeSource, 'public');
assert.strictEqual(built.meta.publicPassiveInputKeys.length, 1);
assert.strictEqual(built.raw.passivePressure.optionsVolatilityAmplifier, FIXTURE_MERGE_EXPECTED.volProxy);

const volSignal = built.raw.signals.find((s) => s.id === 'vol-regime');
assert.ok(volSignal);
assert.strictEqual(volSignal!.dataStatus, 'public_proxy');
assert.strictEqual(volSignal!.freshnessStatus, 'fresh');
assert.strictEqual(volSignal!.artifactAsOf, FIXTURE_VOL_REGIME_MERGE.asOf);
assert.strictEqual(volSignal!.numericValue, FIXTURE_MERGE_EXPECTED.volProxy);

const mergedScore = scoreGhostFlowSnapshot(built.raw);
assert.strictEqual(mergedScore.score.score, FIXTURE_MERGE_EXPECTED.compositeScore);
assert.strictEqual(mergedScore.score.subScores.passivePressure, FIXTURE_MERGE_EXPECTED.passivePressure);
assert.strictEqual(mergedScore.score.subScores.structuralFragility, FIXTURE_MERGE_EXPECTED.structuralFragility);

// Stale fixture artifact still uses public values (not mock fallback)
const staleBuilt = buildGhostFlowSnapshotWithArtifact(FIXTURE_VOL_REGIME_MERGE, FIXTURE_STALE_REFERENCE_AS_OF);
assert.strictEqual(staleBuilt.meta.volRegimeSource, 'public');
assert.ok(staleBuilt.meta.freshnessWarnings.some((w) => w.includes('stale') || w.includes('trading days')));
assert.strictEqual(staleBuilt.raw.passivePressure.optionsVolatilityAmplifier, FIXTURE_MERGE_EXPECTED.volProxy);
assert.strictEqual(staleBuilt.raw.signals.find((s) => s.id === 'vol-regime')?.freshnessStatus, 'stale');

// Pure mock unchanged
const pureMock = scoreGhostFlowSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
assert.strictEqual(pureMock.score.score, 62);

assert.strictEqual(VIX_PROXY_ANCHORS.length, 5);

// --- Committed artifact sanity (shape only — no score expectations) ---
const loaded = loadVolatilityRegimeArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

console.log('ghostflow/volatilityRegime.test.ts: ok');
