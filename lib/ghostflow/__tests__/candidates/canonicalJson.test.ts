import assert from 'node:assert/strict';
import {
  canonicalJsonStringify,
  sha256HexFromCanonicalJson,
} from '@/lib/ghostflow/refresh/candidates/canonicalJson';
import { buildCandidateIdentity } from '@/lib/ghostflow/refresh/candidates/identity';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

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

const normalized = fixtureSystematicNormalized();
const identity1 = buildCandidateIdentity({
  artifactId: 'systematicFlowProxy',
  normalized,
  promotionPayloadSha256: 'abc123payload',
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
  promotionPayloadSha256: 'abc123payload',
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
  promotionPayloadSha256: 'abc123payload',
});
assert.strictEqual(identity3.ok, true);
if (!identity3.ok) throw new Error('unreachable');
assert.notStrictEqual(identity3.identity.identitySha256, identity1.identity.identitySha256);

console.log('ghostflow/candidates/canonicalJson.test.ts: ok');
