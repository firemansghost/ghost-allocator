import assert from 'node:assert/strict';
import {
  TREASURY_LONG_END_BOARD_PRIMARY_SERIES,
  TREASURY_LONG_END_BOARD_RELEASE_URL,
  TREASURY_LONG_END_BOARD_CONTEXT_SERIES,
  validateTreasuryLongEndIncomeLensArtifact,
} from '@/lib/ghostflow/artifacts/treasuryLongEndIncomeLens';
import { mapTreasuryLongEndIncomeLensCandidate } from '@/lib/ghostflow/refresh/candidateMappers/treasuryLongEndIncomeLens';
import {
  FRB_H15_ADAPTER_ID,
  FRB_H15_PARSER_VERSION,
} from '@/lib/ghostflow/refresh/adapters/frbH15TreasuryYieldsMeta';
import {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_OPTIONAL_SERIES_NAMES,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_REQUIRED_SERIES_NAMES,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
} from '@/lib/ghostflow/refresh/adapters/frbH15TreasuryYieldsSdmxMeta';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import type { GhostFlowRefreshRegistryEntry } from '@/lib/ghostflow/refresh/types';
import {
  FIXTURE_CONTENT_SHA256,
  FIXTURE_RETRIEVED_AT,
  fixtureH15Normalized,
} from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'treasuryLongEndIncomeLens'
)!;

function mapWith(normalized: ReturnType<typeof fixtureH15Normalized>, entry = registryEntry) {
  return mapTreasuryLongEndIncomeLensCandidate({ normalized, registryEntry: entry });
}

function failCode(result: ReturnType<typeof mapWith>, code: string) {
  assert.strictEqual(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === code), `expected ${code}`);
}

// --- Board contract parity guard ---
assert.strictEqual(TREASURY_LONG_END_BOARD_RELEASE_URL, FRB_H15_SDMX_SOURCE_LOCATOR);
assert.deepStrictEqual(
  TREASURY_LONG_END_BOARD_PRIMARY_SERIES.map((s) => s.id),
  [...FRB_H15_SDMX_REQUIRED_SERIES_NAMES]
);
assert.deepStrictEqual(
  TREASURY_LONG_END_BOARD_CONTEXT_SERIES.map((s) => s.id),
  [...FRB_H15_SDMX_OPTIONAL_SERIES_NAMES]
);

// --- happy path ---
const normalized = fixtureH15Normalized();
const result = mapWith(normalized);
assert.strictEqual(result.ok, true, result.ok ? '' : result.issues.map((i) => i.message).join('; '));
if (!result.ok) throw new Error('unreachable');

assert.strictEqual(result.value.seriesDefinition, 'frb_h15_treasury_long_end_income_lens_v1');
assert.strictEqual(result.value.dataQuality, 'verified_automated');
assert.strictEqual(result.value.publishedAt, undefined);
assert.strictEqual(result.value.source.series.length, 5);
assert.ok(
  !('tenYearBreakevenInflationPct' in result.value.observations) ||
    result.value.observations.tenYearBreakevenInflationPct === undefined
);
assert.ok(
  validateTreasuryLongEndIncomeLensArtifact(result.value, { mode: 'production' }).ok
);

const repeat = mapWith(normalized);
assert.deepStrictEqual(repeat.value, result.value);

// --- adversarial provenance ---
const wrongFamily = fixtureH15Normalized();
wrongFamily.provenance.sourceId = 'wrong_family';
failCode(mapWith(wrongFamily), 'candidate_mapper_source_family_mismatch');

const wrongAdapter = fixtureH15Normalized();
wrongAdapter.provenance.adapterId = 'wrong-adapter';
failCode(mapWith(wrongAdapter), 'candidate_mapper_adapter_mismatch');

const wrongParser = fixtureH15Normalized();
wrongParser.provenance.parserVersion = '9.9.9';
failCode(mapWith(wrongParser), 'candidate_mapper_parser_version_mismatch');

const wrongLocator = fixtureH15Normalized();
wrongLocator.provenance.sourceLocator = 'https://example.test/wrong';
failCode(mapWith(wrongLocator), 'candidate_mapper_source_locator_mismatch');

const obsMismatch = fixtureH15Normalized();
obsMismatch.provenance.observationAsOf = '2026-08-25';
failCode(mapWith(obsMismatch), 'candidate_mapper_observation_date_mismatch');

const badSha = fixtureH15Normalized();
badSha.provenance.contentSha256 = 'abc123';
failCode(mapWith(badSha), 'candidate_mapper_invalid_provenance');

const badRetrieved = fixtureH15Normalized();
badRetrieved.provenance.retrievedAt = 'not-a-timestamp';
failCode(mapWith(badRetrieved), 'candidate_mapper_invalid_provenance');

const csvAdapter = fixtureH15Normalized();
csvAdapter.provenance.adapterId = FRB_H15_ADAPTER_ID;
csvAdapter.provenance.parserVersion = FRB_H15_PARSER_VERSION;
failCode(mapWith(csvAdapter), 'candidate_mapper_adapter_mismatch');

const badRegistryEntry = JSON.parse(JSON.stringify(registryEntry)) as GhostFlowRefreshRegistryEntry;
if (badRegistryEntry.adapter.implementationStatus === 'implemented') {
  badRegistryEntry.adapter.adapterId = FRB_H15_ADAPTER_ID;
}
failCode(mapWith(normalized, badRegistryEntry), 'candidate_mapper_adapter_mismatch');

assert.strictEqual(normalized.provenance.sourceLocator, FRB_H15_SDMX_SOURCE_LOCATOR);
assert.strictEqual(normalized.provenance.sourceId, FRB_H15_SDMX_SOURCE_FAMILY_ID);
assert.strictEqual(normalized.provenance.adapterId, FRB_H15_SDMX_ADAPTER_ID);
assert.strictEqual(normalized.provenance.parserVersion, FRB_H15_SDMX_PARSER_VERSION);
assert.strictEqual(normalized.provenance.contentSha256, FIXTURE_CONTENT_SHA256);
assert.strictEqual(normalized.provenance.retrievedAt, FIXTURE_RETRIEVED_AT);

console.log('ghostflow/candidateMappers/treasuryLongEndIncomeLensMapper.test.ts: ok');
