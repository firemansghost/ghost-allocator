import assert from 'node:assert/strict';
import { validateSystematicFlowProxyArtifact } from '@/lib/ghostflow/artifacts/systematicFlowProxy';
import { mapSystematicFlowProxyCandidate } from '@/lib/ghostflow/refresh/candidateMappers/systematicFlowProxy';
import { buildCftcTffSystematicResourceQueryUrl } from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataSource';
import {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
} from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataMeta';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import type { GhostFlowRefreshRegistryEntry } from '@/lib/ghostflow/refresh/types';
import {
  FIXTURE_CONTENT_SHA256,
  FIXTURE_RETRIEVED_AT,
  fixtureSystematicNormalized,
} from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'systematicFlowProxy'
)!;

function mapWith(normalized: ReturnType<typeof fixtureSystematicNormalized>, entry = registryEntry) {
  return mapSystematicFlowProxyCandidate({ normalized, registryEntry: entry });
}

// --- happy path ---
const normalized = fixtureSystematicNormalized();
const first = mapWith(normalized);
assert.strictEqual(first.ok, true);
if (!first.ok) throw new Error('unreachable');

assert.strictEqual(first.value.dataQuality, 'verified_automated');
assert.strictEqual(first.value.publishedAt, undefined);
assert.strictEqual(first.value.asOf, '2026-05-19');
assert.ok(validateSystematicFlowProxyArtifact(first.value).ok);

const withPublished = fixtureSystematicNormalized({ sourcePublishedAt: '2026-05-23' });
const publishedResult = mapWith(withPublished);
assert.strictEqual(publishedResult.ok, true);
if (!publishedResult.ok) throw new Error('unreachable');
assert.strictEqual(publishedResult.value.publishedAt, '2026-05-23');

const second = mapWith(normalized);
assert.deepStrictEqual(second.value, first.value);

// --- adversarial provenance ---
function failCode(result: ReturnType<typeof mapWith>, code: string) {
  assert.strictEqual(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === code), `expected ${code}`);
}

const wrongFamily = fixtureSystematicNormalized();
wrongFamily.provenance.sourceId = 'wrong_family';
failCode(mapWith(wrongFamily), 'candidate_mapper_source_family_mismatch');

const wrongAdapter = fixtureSystematicNormalized();
wrongAdapter.provenance.adapterId = 'wrong-adapter';
failCode(mapWith(wrongAdapter), 'candidate_mapper_adapter_mismatch');

const wrongParser = fixtureSystematicNormalized();
wrongParser.provenance.parserVersion = '9.9.9';
failCode(mapWith(wrongParser), 'candidate_mapper_parser_version_mismatch');

const wrongLocator = fixtureSystematicNormalized();
wrongLocator.provenance.sourceLocator = 'https://example.test/wrong';
failCode(mapWith(wrongLocator), 'candidate_mapper_source_locator_mismatch');

const obsMismatch = fixtureSystematicNormalized();
obsMismatch.provenance.observationAsOf = '2026-05-20';
failCode(mapWith(obsMismatch), 'candidate_mapper_observation_date_mismatch');

const badSha = fixtureSystematicNormalized();
badSha.provenance.contentSha256 = 'abc123';
failCode(mapWith(badSha), 'candidate_mapper_invalid_provenance');

const badRetrieved = fixtureSystematicNormalized();
badRetrieved.provenance.retrievedAt = 'not-a-timestamp';
failCode(mapWith(badRetrieved), 'candidate_mapper_invalid_provenance');

const wrongDataset = fixtureSystematicNormalized();
wrongDataset.fields.datasetId = 'wrong-dataset';
failCode(mapWith(wrongDataset), 'candidate_mapper_invalid_provenance');

const badRegistryEntry = JSON.parse(JSON.stringify(registryEntry)) as GhostFlowRefreshRegistryEntry;
if (badRegistryEntry.adapter.implementationStatus === 'implemented') {
  badRegistryEntry.adapter.adapterId = 'wrong-registry-adapter';
}
failCode(mapWith(normalized, badRegistryEntry), 'candidate_mapper_adapter_mismatch');

assert.strictEqual(
  normalized.provenance.sourceLocator,
  buildCftcTffSystematicResourceQueryUrl()
);
assert.strictEqual(normalized.provenance.sourceId, CFTC_TFF_SOURCE_FAMILY_ID);
assert.strictEqual(normalized.provenance.adapterId, CFTC_TFF_SYSTEMATIC_ADAPTER_ID);
assert.strictEqual(normalized.provenance.parserVersion, CFTC_TFF_SYSTEMATIC_PARSER_VERSION);
assert.strictEqual(normalized.provenance.contentSha256, FIXTURE_CONTENT_SHA256);
assert.strictEqual(normalized.provenance.retrievedAt, FIXTURE_RETRIEVED_AT);
assert.strictEqual(normalized.fields.datasetId, CFTC_TFF_DATASET_ID);

console.log('ghostflow/candidateMappers/systematicFlowProxyMapper.test.ts: ok');
