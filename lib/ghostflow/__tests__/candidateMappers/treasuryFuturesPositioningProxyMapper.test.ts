import assert from 'node:assert/strict';
import { validateTreasuryFuturesPositioningProxyArtifact } from '@/lib/ghostflow/artifacts/treasuryFuturesPositioningProxy';
import { mapTreasuryFuturesPositioningProxyCandidate } from '@/lib/ghostflow/refresh/candidateMappers/treasuryFuturesPositioningProxy';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import { fixtureTreasuryNormalized } from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'treasuryFuturesPositioningProxy'
)!;

const normalized = fixtureTreasuryNormalized();
const result = mapTreasuryFuturesPositioningProxyCandidate({ normalized, registryEntry });
assert.strictEqual(result.ok, true, result.ok ? '' : result.issues.map((i) => i.message).join('; '));
if (!result.ok) throw new Error('unreachable');

assert.strictEqual(result.value.dataQuality, 'verified_automated');
assert.strictEqual(result.value.mappingStatus, 'not_final');
assert.strictEqual(result.value.publishedAt, undefined);
assert.strictEqual(result.value.contracts.length, 6);
assert.ok(
  validateTreasuryFuturesPositioningProxyArtifact(result.value, { mode: 'production' }).ok
);

const core = result.value.contracts.filter((c) => c.role === 'core');
assert.strictEqual(core.length, 4);
assert.ok(core.every((c) => c.usedInAggregate));

const repeat = mapTreasuryFuturesPositioningProxyCandidate({ normalized, registryEntry });
assert.deepStrictEqual(repeat.value, result.value);

console.log('ghostflow/candidateMappers/treasuryFuturesPositioningProxyMapper.test.ts: ok');
