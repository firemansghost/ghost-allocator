import assert from 'node:assert/strict';
import { buildCandidateDiff } from '@/lib/ghostflow/refresh/candidates/diff';
import { sha256HexFromCanonicalJson } from '@/lib/ghostflow/refresh/candidates/canonicalJson';
import { FIXTURE_CONTENT_SHA256 } from '../fixtures/candidateMapperFixtures';

const provenance = {
  sourceId: 'cftc_tff_socrata',
  sourceLocator: 'https://example.test/source',
  retrievedAt: '2026-08-26T22:00:23Z',
  contentSha256: FIXTURE_CONTENT_SHA256,
  adapterId: 'cftc-tff-systematic-socrata',
  parserVersion: '1.0.0',
  observationAsOf: '2026-08-18',
};

const current = {
  asOf: '2026-06-30',
  source: { name: 'A', note: 'n' },
  values: [{ x: 1 }, { x: 2 }],
};
const candidateSame = JSON.parse(JSON.stringify(current)) as typeof current;
const currentHash = sha256HexFromCanonicalJson(current);
const sameHash = sha256HexFromCanonicalJson(candidateSame);
assert.ok(currentHash.ok && sameHash.ok);

const noChange = buildCandidateDiff({
  currentArtifact: current,
  candidateArtifact: candidateSame,
  currentObservationAsOf: '2026-06-30',
  candidateObservationAsOf: '2026-06-30',
  candidateSourceProvenance: provenance,
  currentPromotionPayloadSha256: currentHash.value!,
  candidatePromotionPayloadSha256: sameHash.value!,
});
assert.strictEqual(noChange.observationDateRelation, 'same');
assert.strictEqual(noChange.promotionPayloadChanged, false);
assert.strictEqual(noChange.fieldChanges.length, 0);

const candidateChanged = {
  ...current,
  source: { name: 'B', note: 'n' },
  values: [{ x: 9 }, { x: 2 }],
};
const changedHash = sha256HexFromCanonicalJson(candidateChanged);
assert.ok(changedHash.ok);

const diff = buildCandidateDiff({
  currentArtifact: current,
  candidateArtifact: candidateChanged,
  currentObservationAsOf: '2026-06-30',
  candidateObservationAsOf: '2026-08-18',
  candidateSourceProvenance: provenance,
  currentPromotionPayloadSha256: currentHash.value!,
  candidatePromotionPayloadSha256: changedHash.value!,
});
assert.strictEqual(diff.observationDateRelation, 'newer');
assert.strictEqual(diff.promotionPayloadChanged, true);
assert.ok(diff.fieldChanges.some((entry) => entry.path === '$.source.name'));
assert.ok(diff.fieldChanges.some((entry) => entry.path === '$.values[0].x'));
assert.deepStrictEqual(diff.candidateSourceProvenance, provenance);

const older = buildCandidateDiff({
  currentArtifact: current,
  candidateArtifact: candidateChanged,
  currentObservationAsOf: '2026-08-18',
  candidateObservationAsOf: '2026-06-30',
  candidateSourceProvenance: provenance,
  currentPromotionPayloadSha256: currentHash.value!,
  candidatePromotionPayloadSha256: changedHash.value!,
});
assert.strictEqual(older.observationDateRelation, 'older');

console.log('ghostflow/candidates/diff.test.ts: ok');
