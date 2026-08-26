import assert from 'node:assert/strict';
import { validateSystematicFlowProxyArtifact } from '@/lib/ghostflow/artifacts/systematicFlowProxy';
import { mapSystematicFlowProxyCandidate } from '@/lib/ghostflow/refresh/candidateMappers/systematicFlowProxy';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'systematicFlowProxy'
)!;

const normalized = fixtureSystematicNormalized();
const first = mapSystematicFlowProxyCandidate({ normalized, registryEntry });
assert.strictEqual(first.ok, true);
if (!first.ok) throw new Error('unreachable');

assert.strictEqual(first.value.dataQuality, 'verified_automated');
assert.strictEqual(first.value.publishedAt, undefined);
assert.strictEqual(first.value.asOf, '2026-05-19');
assert.ok(validateSystematicFlowProxyArtifact(first.value).ok);

const withPublished = fixtureSystematicNormalized({ sourcePublishedAt: '2026-05-23' });
const publishedResult = mapSystematicFlowProxyCandidate({
  normalized: withPublished,
  registryEntry,
});
assert.strictEqual(publishedResult.ok, true);
if (!publishedResult.ok) throw new Error('unreachable');
assert.strictEqual(publishedResult.value.publishedAt, '2026-05-23');

const second = mapSystematicFlowProxyCandidate({ normalized, registryEntry });
assert.deepStrictEqual(second.value, first.value);

console.log('ghostflow/candidateMappers/systematicFlowProxyMapper.test.ts: ok');
