import assert from 'node:assert/strict';
import {
  canonicalJsonStringify,
  sha256HexFromCanonicalJson,
} from '@/lib/ghostflow/refresh/candidates/canonicalJson';
import { buildCandidateIdentity } from '@/lib/ghostflow/refresh/candidates/identity';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

const FIXTURE_PROMOTION_SHA256 =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const objA = { b: 2, a: 1, nested: { z: 9, y: 8 } };
const objB = { nested: { y: 8, z: 9 }, a: 1, b: 2 };
const hashA = sha256HexFromCanonicalJson(objA);
const hashB = sha256HexFromCanonicalJson(objB);
assert.strictEqual(hashA.ok, true);
assert.strictEqual(hashB.ok, true);
if (!hashA.ok || !hashB.ok) throw new Error('unreachable');
assert.strictEqual(hashA.value, hashB.value);

const arr1 = sha256HexFromCanonicalJson([1, 2, 3]);
const arr2 = sha256HexFromCanonicalJson([1, 3, 2]);
assert.ok(arr1.ok && arr2.ok);
assert.notStrictEqual(arr1.value, arr2.value);

const samePayload = sha256HexFromCanonicalJson({ x: 1, y: 'a' });
const samePayload2 = sha256HexFromCanonicalJson({ y: 'a', x: 1 });
assert.ok(samePayload.ok && samePayload2.ok);
assert.strictEqual(samePayload.value, samePayload2.value);

const changed = sha256HexFromCanonicalJson({ x: 2, y: 'a' });
assert.ok(changed.ok && samePayload.ok);
assert.notStrictEqual(changed.value, samePayload.value);

const withUndefined = canonicalJsonStringify({ a: 1, b: undefined, c: 2 });
assert.strictEqual(withUndefined.ok, true);
if (!withUndefined.ok) throw new Error('unreachable');
assert.strictEqual(withUndefined.value, '{"a":1,"c":2}');

const nonFinite = canonicalJsonStringify({ a: Number.NaN });
assert.strictEqual(nonFinite.ok, false);

const unsupported = canonicalJsonStringify(() => {});
assert.strictEqual(unsupported.ok, false);

const directCycle: { self?: unknown } = {};
directCycle.self = directCycle;
const directCycleResult = canonicalJsonStringify(directCycle);
assert.strictEqual(directCycleResult.ok, false);
if (!directCycleResult.ok) {
  assert.strictEqual(directCycleResult.issues[0]?.code, 'candidate_canonical_json_invalid');
}

const nodeA: { b?: { a?: unknown } } = {};
const nodeB: { a?: unknown } = {};
nodeA.b = nodeB;
nodeB.a = nodeA;
const indirectCycleResult = canonicalJsonStringify(nodeA);
assert.strictEqual(indirectCycleResult.ok, false);

const shared = { x: 1 };
const sharedRef = canonicalJsonStringify({ a: shared, b: shared });
assert.strictEqual(sharedRef.ok, true);
if (!sharedRef.ok) throw new Error('unreachable');
const sharedHash1 = sha256HexFromCanonicalJson({ a: shared, b: shared });
const sharedHash2 = sha256HexFromCanonicalJson({ b: shared, a: shared });
assert.ok(sharedHash1.ok && sharedHash2.ok);
assert.strictEqual(sharedHash1.value, sharedHash2.value);

const dateRejected = canonicalJsonStringify(new Date('2026-01-01T00:00:00.000Z'));
assert.strictEqual(dateRejected.ok, false);

const mapRejected = canonicalJsonStringify(new Map([['a', 1]]));
assert.strictEqual(mapRejected.ok, false);

const setRejected = canonicalJsonStringify(new Set([1, 2]));
assert.strictEqual(setRejected.ok, false);

const normalized = fixtureSystematicNormalized();
const identity1 = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized,
  promotionPayloadSha256: FIXTURE_PROMOTION_SHA256,
});
assert.strictEqual(identity1.ok, true);
if (!identity1.ok) throw new Error('unreachable');

const identity2 = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized: {
    ...normalized,
    provenance: {
      ...normalized.provenance,
      retrievedAt: '2026-09-01T12:00:00.000Z',
    },
  },
  promotionPayloadSha256: FIXTURE_PROMOTION_SHA256,
});
assert.strictEqual(identity2.ok, true);
if (!identity2.ok) throw new Error('unreachable');
assert.strictEqual(identity2.identity.identitySha256, identity1.identity.identitySha256);

const identity3 = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized: {
    ...normalized,
    provenance: {
      ...normalized.provenance,
      contentSha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    },
  },
  promotionPayloadSha256: FIXTURE_PROMOTION_SHA256,
});
assert.strictEqual(identity3.ok, true);
if (!identity3.ok) throw new Error('unreachable');
assert.notStrictEqual(identity3.identity.identitySha256, identity1.identity.identitySha256);

const invalidPromotionHash = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized,
  promotionPayloadSha256: 'abc123payload',
});
assert.strictEqual(invalidPromotionHash.ok, false);

const validPromotionHash = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized,
  promotionPayloadSha256: FIXTURE_PROMOTION_SHA256,
});
assert.strictEqual(validPromotionHash.ok, true);

console.log('ghostflow/candidates/canonicalJson.test.ts: ok');
