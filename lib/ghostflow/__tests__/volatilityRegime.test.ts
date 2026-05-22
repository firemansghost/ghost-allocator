/**
 * GhostFlow v0.2 — VIX mapper, artifact validation, and snapshot merge tests.
 */

import assert from 'assert';
import { buildGhostFlowSnapshot } from '../buildSnapshot';
import { scoreGhostFlowSnapshot } from '../scoring';
import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import {
  mapVixCloseToNumericValue,
  validateVolatilityRegimeArtifact,
  VIX_PROXY_ANCHORS,
} from '../artifacts/volatilityRegime';
import type { VolatilityRegimeArtifactV1 } from '../artifacts/types';

// --- VIX mapper ---
assert.strictEqual(mapVixCloseToNumericValue(10), 15);
assert.strictEqual(mapVixCloseToNumericValue(12), 15);
assert.strictEqual(mapVixCloseToNumericValue(17), 35);
assert.strictEqual(mapVixCloseToNumericValue(22), 55);
assert.strictEqual(mapVixCloseToNumericValue(28), 72);
assert.strictEqual(mapVixCloseToNumericValue(29), 88);
assert.strictEqual(mapVixCloseToNumericValue(50), 88);

const v1744 = mapVixCloseToNumericValue(17.44);
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

// --- Validation ---
const validArtifact: VolatilityRegimeArtifactV1 = {
  artifactVersion: '1',
  signalId: 'vol-regime',
  asOf: '2026-05-20',
  publishedAt: '2026-05-20',
  source: { name: 'CBOE VIX History', url: 'https://example.com/vix.csv' },
  updateFrequency: 'daily',
  dataQuality: 'verified_manual',
  observations: { vixClose: 17.44 },
};

let result = validateVolatilityRegimeArtifact(validArtifact, '2026-05-20');
assert.ok(result.ok);

result = validateVolatilityRegimeArtifact({ ...validArtifact, signalId: 'wrong' as 'vol-regime' }, '2026-05-20');
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact(
  { ...validArtifact, observations: { vixClose: 3 } },
  '2026-05-20'
);
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact({ ...validArtifact, asOf: '2026-05-25' }, '2026-05-20');
assert.ok(!result.ok);

result = validateVolatilityRegimeArtifact(
  { ...validArtifact, publishedAt: '2026-05-18' },
  '2026-05-20'
);
assert.ok(!result.ok);

// --- Merge with committed artifact ---
const built = buildGhostFlowSnapshot('2026-05-20');
assert.strictEqual(built.meta.dataMix, 'mixed');
assert.strictEqual(built.meta.volRegimeSource, 'public');
assert.strictEqual(built.meta.publicPassiveInputKeys.length, 1);
assert.strictEqual(built.raw.passivePressure.optionsVolatilityAmplifier, v1744);

const volSignal = built.raw.signals.find((s) => s.id === 'vol-regime');
assert.ok(volSignal);
assert.strictEqual(volSignal!.dataStatus, 'public_proxy');
assert.strictEqual(volSignal!.freshnessStatus, 'fresh');
assert.strictEqual(volSignal!.artifactAsOf, '2026-05-20');

const mergedScore = scoreGhostFlowSnapshot(built.raw);
assert.strictEqual(mergedScore.score.score, 59);
assert.strictEqual(mergedScore.score.subScores.passivePressure, 56);
assert.strictEqual(mergedScore.score.subScores.structuralFragility, 62);

// --- Stale artifact still uses public values ---
const staleBuilt = buildGhostFlowSnapshot('2026-05-28');
assert.strictEqual(staleBuilt.meta.volRegimeSource, 'public');
assert.ok(staleBuilt.meta.freshnessWarnings.some((w) => w.includes('stale') || w.includes('trading days')));
assert.strictEqual(staleBuilt.raw.passivePressure.optionsVolatilityAmplifier, v1744);

// --- Invalid artifact fallback ---
const invalidResult = validateVolatilityRegimeArtifact(null, '2026-05-20');
assert.ok(!invalidResult.ok);

// Pure mock unchanged
const pureMock = scoreGhostFlowSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
assert.strictEqual(pureMock.score.score, 62);

assert.strictEqual(VIX_PROXY_ANCHORS.length, 5);

console.log('ghostflow/volatilityRegime.test.ts: ok');
