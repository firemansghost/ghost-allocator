/**
 * Board H.15 Treasury yields SDMX/XML adapter — fixture-driven tests (no live network).
 */

import assert from 'assert';
import { createHash } from 'crypto';
import {
  FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER,
  createFrbH15TreasuryYieldsSdmxAdapter,
  parseFrbH15SdmxXml,
  type FrbH15SdmxFetchClient,
  type FrbH15SdmxFetchResponse,
} from '../refresh/adapters/frbH15TreasuryYieldsSdmx';
import {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_ARTIFACT_ID,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
  FRB_H15_SDMX_SOURCE_NAME,
} from '../refresh/adapters/frbH15TreasuryYieldsSdmxMeta';
import { extractFrbH15ZipMember } from '../refresh/adapters/frbH15ZipMember';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../refresh/registry';
import type { GhostFlowFetchedSource } from '../refresh/types';
import {
  ADAPTER_TEST_NOW_ISO,
  FIXTURE_H15_SDMX_BAD_VALUE_XML,
  FIXTURE_H15_SDMX_BLANK_PREINCEPTION_XML,
  FIXTURE_H15_SDMX_DUPLICATE_MEMBER_ZIP,
  FIXTURE_H15_SDMX_DUPLICATE_SERIES_XML,
  FIXTURE_H15_SDMX_FUTURE_XML,
  FIXTURE_H15_SDMX_INVALID_DATE_XML,
  FIXTURE_H15_SDMX_INVALID_UTF8_ZIP,
  FIXTURE_H15_SDMX_MALFORMED_ZIP,
  FIXTURE_H15_SDMX_MISSING_MEMBER_ZIP,
  FIXTURE_H15_SDMX_MISSING_REQUIRED_XML,
  FIXTURE_H15_SDMX_NO_COMMON_XML,
  FIXTURE_H15_SDMX_OPTIONAL_GAP_XML,
  FIXTURE_H15_SDMX_UNKNOWN_STATUS_XML,
  FIXTURE_H15_SDMX_A_MINUS9999_XML,
  FIXTURE_H15_SDMX_CRC_MISMATCH_ZIP,
  FIXTURE_H15_SDMX_DATA_DESCRIPTOR_FLAG_ZIP,
  FIXTURE_H15_SDMX_DUPLICATE_AA_XML,
  FIXTURE_H15_SDMX_DUPLICATE_ND_A_XML,
  FIXTURE_H15_SDMX_DUPLICATE_ND_ND_XML,
  FIXTURE_H15_SDMX_DUPLICATE_OBS_STATUS_XML,
  FIXTURE_H15_SDMX_ENCRYPTED_FLAG_ZIP,
  FIXTURE_H15_SDMX_MALFORMED_NESTED_OBS_XML,
  FIXTURE_H15_SDMX_MISSING_DATASET_CLOSE_XML,
  FIXTURE_H15_SDMX_MISSING_MESSAGEGROUP_CLOSE_XML,
  FIXTURE_H15_SDMX_MISSING_STATUS_INVALID_DATE_XML,
  FIXTURE_H15_SDMX_NON_SELF_CLOSING_OBS_XML,
  FIXTURE_H15_SDMX_NO_NAMESPACE_XML,
  FIXTURE_H15_SDMX_OVERSIZE_DECLARED_ZIP,
  FIXTURE_H15_SDMX_REQUIRED_OUTSIDE_DATASET_XML,
  FIXTURE_H15_SDMX_STORED_ZIP,
  FIXTURE_H15_SDMX_UNEXPECTED_TRAILING_ZIP,
  FIXTURE_H15_SDMX_XOBS_STATUS_XML,
  FIXTURE_H15_SDMX_XOBS_VALUE_XML,
  FIXTURE_H15_SDMX_XTIME_PERIOD_XML,
  FIXTURE_H15_SDMX_ZIP64_SIZE_ZIP,
  FIXTURE_H15_SDMX_VALID_XML,
  FIXTURE_H15_SDMX_VALID_ZIP,
  FIXTURE_H15_SDMX_VALID_ZIP_SHA256,
  fixtureZipSha256,
  zipWithH15Data,
} from './fixtures/frbH15TreasuryYieldsSdmxFixtures';

function zipResponse(bytes: Uint8Array, opts?: Partial<FrbH15SdmxFetchResponse>): FrbH15SdmxFetchResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    contentType: 'application/zip',
    bytes,
    ...opts,
    bytes: opts?.bytes ?? bytes,
  };
}

function zipClient(bytes: Uint8Array): { client: FrbH15SdmxFetchClient; urls: string[] } {
  const urls: string[] = [];
  const client: FrbH15SdmxFetchClient = async (url) => {
    urls.push(url);
    assert.strictEqual(url, FRB_H15_SDMX_SOURCE_LOCATOR);
    return zipResponse(bytes);
  };
  return { client, urls };
}

function assertFailCode(
  result: { ok: boolean; issues?: { code: string }[] },
  code: string
): void {
  assert.strictEqual(result.ok, false);
  assert.ok(
    result.issues?.some((i) => i.code === code),
    `expected ${code}; got ${result.issues?.map((i) => i.code).join(', ')}`
  );
}

const longEnd = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'treasuryLongEndIncomeLens'
)!;

assert.strictEqual(FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER.id, FRB_H15_SDMX_ADAPTER_ID);
assert.strictEqual(
  FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER.parserVersion,
  FRB_H15_SDMX_PARSER_VERSION
);
assert.strictEqual(FRB_H15_SDMX_PARSER_VERSION, '1.0.0');
assert.strictEqual(longEnd.adapter.adapterId, FRB_H15_SDMX_ADAPTER_ID);
assert.strictEqual(longEnd.adapter.implementationStatus, 'implemented');
assert.strictEqual(longEnd.adapter.parserVersion, '1.0.0');
assert.strictEqual(longEnd.canonicalSource.sourceFamilyId, FRB_H15_SDMX_SOURCE_FAMILY_ID);
assert.strictEqual(longEnd.canonicalSource.sourceName, FRB_H15_SDMX_SOURCE_NAME);
assert.strictEqual(longEnd.canonicalSource.sourceLocator, FRB_H15_SDMX_SOURCE_LOCATOR);
assert.strictEqual(longEnd.sourceFormat, 'xml');
assert.strictEqual(longEnd.authentication.kind, 'none');
assert.strictEqual(longEnd.approvalPolicy, 'human_required');
assert.strictEqual(longEnd.lane, 'treasury_display');
assert.strictEqual(FRB_H15_SDMX_ARTIFACT_ID, 'treasuryLongEndIncomeLens');

async function fetched(bytes: Uint8Array): Promise<GhostFlowFetchedSource<Uint8Array>> {
  const { client } = zipClient(bytes);
  const adapter = createFrbH15TreasuryYieldsSdmxAdapter({ fetchClient: client });
  const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
  assert.strictEqual(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

(async () => {
  {
    const { client, urls } = zipClient(FIXTURE_H15_SDMX_VALID_ZIP);
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({ fetchClient: client });
    const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(urls, [FRB_H15_SDMX_SOURCE_LOCATOR]);
    assert.strictEqual(result.value.raw.byteLength, FIXTURE_H15_SDMX_VALID_ZIP.byteLength);
    assert.strictEqual(result.value.sourceMetadata.contentSha256, FIXTURE_H15_SDMX_VALID_ZIP_SHA256);
    assert.strictEqual(result.value.sourceMetadata.sourceId, FRB_H15_SDMX_SOURCE_FAMILY_ID);
    assert.strictEqual(result.value.sourceMetadata.sourceLocator, FRB_H15_SDMX_SOURCE_LOCATOR);
    assert.strictEqual(
      result.value.sourceMetadata.contentSha256,
      createHash('sha256').update(FIXTURE_H15_SDMX_VALID_ZIP).digest('hex')
    );
  }

  {
    const client: FrbH15SdmxFetchClient = async () => ({
      ok: false,
      status: 503,
      bytes: new TextEncoder().encode('err'),
    });
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_http_error');
  }

  {
    const client: FrbH15SdmxFetchClient = async () => ({
      ok: true,
      status: 200,
      bytes: new Uint8Array(),
    });
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_empty_body');
  }

  {
    const client: FrbH15SdmxFetchClient = async () => {
      throw new Error('network');
    };
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_exception');
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(FIXTURE_H15_SDMX_VALID_ZIP).client,
    });
    assertFailCode(await adapter.fetch({ nowIso: 'nope' }), 'h15_fetch_invalid_now');
  }

  {
    const extracted = extractFrbH15ZipMember(FIXTURE_H15_SDMX_VALID_ZIP);
    assert.strictEqual(extracted.ok, true);
    if (!extracted.ok) throw new Error('unreachable');
    assert.strictEqual(extracted.memberName, 'H15_data.xml');
    assert.ok(extracted.bytes.byteLength > 0);
    assert.ok(new TextDecoder().decode(extracted.bytes).includes('RIFLGFCY30_N.B'));
  }

  {
    const missing = extractFrbH15ZipMember(FIXTURE_H15_SDMX_MISSING_MEMBER_ZIP);
    assert.strictEqual(missing.ok, false);
    if (missing.ok) throw new Error('unreachable');
    assert.strictEqual(missing.code, 'h15_zip_missing_member');
  }

  {
    const dup = extractFrbH15ZipMember(FIXTURE_H15_SDMX_DUPLICATE_MEMBER_ZIP);
    assert.strictEqual(dup.ok, false);
    if (dup.ok) throw new Error('unreachable');
    assert.strictEqual(dup.code, 'h15_zip_duplicate_member');
  }

  {
    const bad = extractFrbH15ZipMember(FIXTURE_H15_SDMX_MALFORMED_ZIP);
    assert.strictEqual(bad.ok, false);
    if (bad.ok) throw new Error('unreachable');
    assert.ok(
      bad.code === 'h15_zip_malformed' || bad.code === 'h15_zip_truncated' || bad.code === 'h15_zip_missing_member'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter();
    const source = await fetched(FIXTURE_H15_SDMX_INVALID_UTF8_ZIP);
    assertFailCode(adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_xml_invalid_utf8');
  }

  {
    const parsed = parseFrbH15SdmxXml(FIXTURE_H15_SDMX_VALID_XML);
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assert.ok(parsed.value.some((r) => r.seriesName === 'RIFLGFCY30_N.B'));
    assert.ok(parsed.value.some((r) => r.seriesName === 'RIFLGFCY30_XII_N.B'));
    assert.ok(!parsed.value.some((r) => r.seriesName === 'RIFLGFCM01_N.B'));
    assert.ok(
      !parsed.value.some(
        (r) => r.observationAsOf === '2026-07-02' && r.seriesName === 'RIFLGFCY02_N.B'
      )
    );
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_DUPLICATE_SERIES_XML), 'h15_sdmx_duplicate_series');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_MISSING_REQUIRED_XML), 'h15_sdmx_missing_required_series');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_INVALID_DATE_XML), 'h15_sdmx_invalid_date');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_BAD_VALUE_XML), 'h15_sdmx_invalid_value');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_UNKNOWN_STATUS_XML), 'h15_sdmx_unknown_obs_status');
  }

  {
    const parsed = parseFrbH15SdmxXml(FIXTURE_H15_SDMX_BLANK_PREINCEPTION_XML);
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assert.strictEqual(
      parsed.value.filter((r) => r.seriesName === 'RIFLGFCY02_N.B').length,
      0
    );
    assert.ok(
      !parsed.value.some(
        (r) =>
          r.seriesName === 'RIFLGFCY02_N.B' &&
          (r.observationAsOf === '1962-01-02' ||
            r.observationAsOf === '1962-01-03' ||
            r.observationAsOf === '2026-06-30' ||
            r.observationAsOf === '2026-07-01')
      )
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(FIXTURE_H15_SDMX_VALID_ZIP).client,
    });
    const source = await fetched(FIXTURE_H15_SDMX_VALID_ZIP);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const normalized = adapter.normalize(parsed.value, {
      nowIso: ADAPTER_TEST_NOW_ISO,
      referenceAsOf: '2026-07-01',
    });
    assert.strictEqual(normalized.ok, true);
    if (!normalized.ok) throw new Error('unreachable');
    assert.strictEqual(normalized.value.observationAsOf, '2026-07-01');
    assert.strictEqual(normalized.value.fields.thirtyYearNominalYieldPct, 4.97);
    assert.strictEqual(normalized.value.fields.thirtyYearTipsRealYieldPct, 2.78);
    assert.strictEqual(normalized.value.fields.twoYearYieldPct, 4.17);
    assert.strictEqual(normalized.value.fields.fiveYearYieldPct, 4.24);
    assert.strictEqual(normalized.value.fields.tenYearYieldPct, 4.48);
    assert.ok(!('tenYearBreakevenInflationPct' in normalized.value.fields));
    assert.ok(!('t10yie' in normalized.value.fields));
    assert.strictEqual(normalized.value.provenance.adapterId, FRB_H15_SDMX_ADAPTER_ID);
    assert.strictEqual(normalized.value.provenance.parserVersion, '1.0.0');
    assert.strictEqual(normalized.value.provenance.sourceId, FRB_H15_SDMX_SOURCE_FAMILY_ID);
    assert.strictEqual(normalized.value.provenance.sourceLocator, FRB_H15_SDMX_SOURCE_LOCATOR);
    assert.strictEqual(normalized.value.provenance.contentSha256, FIXTURE_H15_SDMX_VALID_ZIP_SHA256);
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(zipWithH15Data(FIXTURE_H15_SDMX_OPTIONAL_GAP_XML)).client,
    });
    const source = await fetched(zipWithH15Data(FIXTURE_H15_SDMX_OPTIONAL_GAP_XML));
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const normalized = adapter.normalize(parsed.value, {
      nowIso: ADAPTER_TEST_NOW_ISO,
      referenceAsOf: '2026-07-01',
    });
    assert.strictEqual(normalized.ok, true);
    if (!normalized.ok) throw new Error('unreachable');
    assert.strictEqual(normalized.value.fields.twoYearYieldPct, undefined);
    assert.strictEqual(normalized.value.fields.fiveYearYieldPct, 4.24);
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(zipWithH15Data(FIXTURE_H15_SDMX_NO_COMMON_XML)).client,
    });
    const source = await fetched(zipWithH15Data(FIXTURE_H15_SDMX_NO_COMMON_XML));
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assertFailCode(
      adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_normalize_no_common_date'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(zipWithH15Data(FIXTURE_H15_SDMX_FUTURE_XML)).client,
    });
    const source = await fetched(zipWithH15Data(FIXTURE_H15_SDMX_FUTURE_XML));
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assertFailCode(
      adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_normalize_future_observation'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsSdmxAdapter({
      fetchClient: zipClient(FIXTURE_H15_SDMX_VALID_ZIP).client,
    });
    const source = await fetched(FIXTURE_H15_SDMX_VALID_ZIP);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const first = adapter.normalize(parsed.value, {
      nowIso: ADAPTER_TEST_NOW_ISO,
      referenceAsOf: '2026-07-01',
    });
    const second = adapter.normalize(parsed.value, {
      nowIso: ADAPTER_TEST_NOW_ISO,
      referenceAsOf: '2026-07-01',
    });
    assert.deepStrictEqual(first, second);
    assert.strictEqual(
      fixtureZipSha256(source.raw),
      first.ok ? first.value.provenance.contentSha256 : 'unreachable'
    );
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_NO_NAMESPACE_XML), 'h15_sdmx_invalid_structure');
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_MISSING_DATASET_CLOSE_XML),
      'h15_sdmx_invalid_structure'
    );
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_MISSING_MESSAGEGROUP_CLOSE_XML),
      'h15_sdmx_invalid_structure'
    );
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_MISSING_STATUS_INVALID_DATE_XML),
      'h15_sdmx_invalid_date'
    );
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_DUPLICATE_AA_XML), 'h15_sdmx_duplicate_observation');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_DUPLICATE_ND_ND_XML), 'h15_sdmx_duplicate_observation');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_DUPLICATE_ND_A_XML), 'h15_sdmx_duplicate_observation');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_A_MINUS9999_XML), 'h15_sdmx_invalid_value');
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_REQUIRED_OUTSIDE_DATASET_XML),
      'h15_sdmx_missing_required_series'
    );
  }

  {
    const outsideObs = parseFrbH15SdmxXml(FIXTURE_H15_SDMX_REQUIRED_OUTSIDE_DATASET_XML);
    assert.strictEqual(outsideObs.ok, false);
    if (outsideObs.ok) throw new Error('unreachable');
    assert.ok(
      !('value' in outsideObs && Array.isArray((outsideObs as { value: unknown }).value))
    );
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_NON_SELF_CLOSING_OBS_XML),
      'h15_sdmx_invalid_observation'
    );
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_MALFORMED_NESTED_OBS_XML),
      'h15_sdmx_invalid_observation'
    );
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_XOBS_STATUS_XML), 'h15_sdmx_invalid_observation');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_XTIME_PERIOD_XML), 'h15_sdmx_invalid_observation');
  }

  {
    assertFailCode(parseFrbH15SdmxXml(FIXTURE_H15_SDMX_XOBS_VALUE_XML), 'h15_sdmx_invalid_observation');
  }

  {
    assertFailCode(
      parseFrbH15SdmxXml(FIXTURE_H15_SDMX_DUPLICATE_OBS_STATUS_XML),
      'h15_sdmx_invalid_observation'
    );
  }

  {
    const crc = extractFrbH15ZipMember(FIXTURE_H15_SDMX_CRC_MISMATCH_ZIP);
    assert.strictEqual(crc.ok, false);
    if (crc.ok) throw new Error('unreachable');
    assert.strictEqual(crc.code, 'h15_zip_crc_mismatch');
  }

  {
    const encrypted = extractFrbH15ZipMember(FIXTURE_H15_SDMX_ENCRYPTED_FLAG_ZIP);
    assert.strictEqual(encrypted.ok, false);
    if (encrypted.ok) throw new Error('unreachable');
    assert.strictEqual(encrypted.code, 'h15_zip_unsupported_flags');
  }

  {
    const dataDescriptor = extractFrbH15ZipMember(FIXTURE_H15_SDMX_DATA_DESCRIPTOR_FLAG_ZIP);
    assert.strictEqual(dataDescriptor.ok, false);
    if (dataDescriptor.ok) throw new Error('unreachable');
    assert.strictEqual(dataDescriptor.code, 'h15_zip_unsupported_flags');
  }

  {
    const zip64 = extractFrbH15ZipMember(FIXTURE_H15_SDMX_ZIP64_SIZE_ZIP);
    assert.strictEqual(zip64.ok, false);
    if (zip64.ok) throw new Error('unreachable');
    assert.strictEqual(zip64.code, 'h15_zip_unsupported_zip64');
  }

  {
    const oversize = extractFrbH15ZipMember(FIXTURE_H15_SDMX_OVERSIZE_DECLARED_ZIP);
    assert.strictEqual(oversize.ok, false);
    if (oversize.ok) throw new Error('unreachable');
    assert.strictEqual(oversize.code, 'h15_zip_member_too_large');
  }

  {
    const trailing = extractFrbH15ZipMember(FIXTURE_H15_SDMX_UNEXPECTED_TRAILING_ZIP);
    assert.strictEqual(trailing.ok, false);
    if (trailing.ok) throw new Error('unreachable');
    assert.strictEqual(trailing.code, 'h15_zip_malformed');
  }

  {
    const stored = extractFrbH15ZipMember(FIXTURE_H15_SDMX_STORED_ZIP);
    assert.strictEqual(stored.ok, true);
    if (!stored.ok) throw new Error('unreachable');
    assert.ok(new TextDecoder().decode(stored.bytes).includes('RIFLGFCY30_N.B'));
  }

  console.log('ghostflow/frbH15TreasuryYieldsSdmxAdapter.test.ts: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
