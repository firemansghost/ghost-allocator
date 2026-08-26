import assert from 'node:assert/strict';
import { validateTreasuryFuturesPositioningProxyArtifact } from '@/lib/ghostflow/artifacts/treasuryFuturesPositioningProxy';
import { mapTreasuryFuturesPositioningProxyCandidate } from '@/lib/ghostflow/refresh/candidateMappers/treasuryFuturesPositioningProxy';
import { buildCftcTffTreasuryResourceQueryUrl } from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataSource';
import {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_SOURCE_FAMILY_ID,
} from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataMeta';
import {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_PARSER_VERSION,
} from '@/lib/ghostflow/refresh/adapters/cftcTffTreasurySocrataMeta';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import type { GhostFlowRefreshRegistryEntry } from '@/lib/ghostflow/refresh/types';
import {
  FIXTURE_CONTENT_SHA256,
  FIXTURE_RETRIEVED_AT,
  fixtureTreasuryNormalized,
} from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'treasuryFuturesPositioningProxy'
)!;

function mapWith(normalized: ReturnType<typeof fixtureTreasuryNormalized>, entry = registryEntry) {
  return mapTreasuryFuturesPositioningProxyCandidate({ normalized, registryEntry: entry });
}

function failCode(result: ReturnType<typeof mapWith>, code: string) {
  assert.strictEqual(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === code), `expected ${code}`);
}

const normalized = fixtureTreasuryNormalized();
const result = mapWith(normalized);
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

const repeat = mapWith(normalized);
assert.deepStrictEqual(repeat.value, result.value);

const wrongFamily = fixtureTreasuryNormalized();
wrongFamily.provenance.sourceId = 'wrong_family';
failCode(mapWith(wrongFamily), 'candidate_mapper_source_family_mismatch');

const wrongAdapter = fixtureTreasuryNormalized();
wrongAdapter.provenance.adapterId = 'wrong-adapter';
failCode(mapWith(wrongAdapter), 'candidate_mapper_adapter_mismatch');

const wrongParser = fixtureTreasuryNormalized();
wrongParser.provenance.parserVersion = '9.9.9';
failCode(mapWith(wrongParser), 'candidate_mapper_parser_version_mismatch');

const wrongLocator = fixtureTreasuryNormalized();
wrongLocator.provenance.sourceLocator = 'https://example.test/wrong';
failCode(mapWith(wrongLocator), 'candidate_mapper_source_locator_mismatch');

const obsMismatch = fixtureTreasuryNormalized();
obsMismatch.provenance.observationAsOf = '2026-07-01';
failCode(mapWith(obsMismatch), 'candidate_mapper_observation_date_mismatch');

const badSha = fixtureTreasuryNormalized();
badSha.provenance.contentSha256 = 'abc123';
failCode(mapWith(badSha), 'candidate_mapper_invalid_provenance');

const badRetrieved = fixtureTreasuryNormalized();
badRetrieved.provenance.retrievedAt = 'not-a-timestamp';
failCode(mapWith(badRetrieved), 'candidate_mapper_invalid_provenance');

const wrongDataset = fixtureTreasuryNormalized();
wrongDataset.fields.datasetId = 'wrong-dataset';
failCode(mapWith(wrongDataset), 'candidate_mapper_invalid_provenance');

const badRegistryEntry = JSON.parse(JSON.stringify(registryEntry)) as GhostFlowRefreshRegistryEntry;
if (badRegistryEntry.adapter.implementationStatus === 'implemented') {
  badRegistryEntry.adapter.parserVersion = '9.9.9';
}
failCode(mapWith(normalized, badRegistryEntry), 'candidate_mapper_parser_version_mismatch');

assert.strictEqual(normalized.provenance.sourceLocator, buildCftcTffTreasuryResourceQueryUrl());
assert.strictEqual(normalized.provenance.sourceId, CFTC_TFF_SOURCE_FAMILY_ID);
assert.strictEqual(normalized.provenance.adapterId, CFTC_TFF_TREASURY_ADAPTER_ID);
assert.strictEqual(normalized.provenance.parserVersion, CFTC_TFF_TREASURY_PARSER_VERSION);
assert.strictEqual(normalized.provenance.contentSha256, FIXTURE_CONTENT_SHA256);
assert.strictEqual(normalized.provenance.retrievedAt, FIXTURE_RETRIEVED_AT);
assert.strictEqual(normalized.fields.datasetId, CFTC_TFF_DATASET_ID);

console.log('ghostflow/candidateMappers/treasuryFuturesPositioningProxyMapper.test.ts: ok');
