/**
 * Board H.15 Treasury yields adapter — fixture-driven tests (no live network).
 */

import assert from 'assert';
import { createHash } from 'crypto';
import {
  FRB_H15_TCM_PACKAGE_OUTPUT_URL,
  FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL,
  FRB_H15_TREASURY_YIELDS_ADAPTER,
  buildFrbH15PackageOutputUrl,
  createFrbH15TreasuryYieldsAdapter,
  frbH15PackageSeriesHash,
  type FrbH15FetchClient,
  type FrbH15FetchResponse,
  type FrbH15FetchedPackages,
} from '../refresh/adapters/frbH15TreasuryYields';
import {
  FRB_H15_ADAPTER_ID,
  FRB_H15_ARTIFACT_ID,
  FRB_H15_PARSER_VERSION,
  FRB_H15_SOURCE_FAMILY_ID,
  FRB_H15_SOURCE_LOCATOR,
  FRB_H15_SOURCE_NAME,
  FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS,
  FRB_H15_TIPS_30_SERIES_UNIQUE_ID,
} from '../refresh/adapters/frbH15TreasuryYieldsMeta';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../refresh/registry';
import type { GhostFlowFetchedSource } from '../refresh/types';
import {
  ADAPTER_TEST_NOW_ISO,
  FIXTURE_H15_TCM_BAD_VALUE,
  FIXTURE_H15_TCM_FUTURE,
  FIXTURE_H15_TCM_INVALID_DATE,
  FIXTURE_H15_TCM_NO_COMMON,
  FIXTURE_H15_TCM_OPTIONAL_GAP,
  FIXTURE_H15_TCM_VALID,
  FIXTURE_H15_TIPS30_FUTURE,
  FIXTURE_H15_TIPS30_MATCHING,
  FIXTURE_H15_TIPS30_NO_COMMON,
  FIXTURE_H15_TIPS30_VALID,
} from './fixtures/frbH15TreasuryYieldsFixtures';

function textResponse(text: string, opts?: Partial<FrbH15FetchResponse>): FrbH15FetchResponse {
  const bytes = new TextEncoder().encode(text);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    contentType: 'text/csv',
    bytes,
    ...opts,
    bytes: opts?.bytes ?? bytes,
  };
}

function dualClient(
  tcmText: string,
  tipsText: string
): { client: FrbH15FetchClient; urls: string[] } {
  const urls: string[] = [];
  const client: FrbH15FetchClient = async (url) => {
    urls.push(url);
    if (url === FRB_H15_TCM_PACKAGE_OUTPUT_URL) return textResponse(tcmText);
    if (url === FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL) return textResponse(tipsText);
    throw new Error(`unexpected url ${url}`);
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

assert.strictEqual(FRB_H15_TREASURY_YIELDS_ADAPTER.id, FRB_H15_ADAPTER_ID);
assert.strictEqual(FRB_H15_TREASURY_YIELDS_ADAPTER.parserVersion, FRB_H15_PARSER_VERSION);
assert.strictEqual(longEnd.adapter.adapterId, FRB_H15_ADAPTER_ID);
assert.strictEqual(longEnd.adapter.implementationStatus, 'implemented');
if (longEnd.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(longEnd.adapter.parserVersion, FRB_H15_PARSER_VERSION);
}
assert.strictEqual(longEnd.canonicalSource.sourceFamilyId, FRB_H15_SOURCE_FAMILY_ID);
assert.strictEqual(longEnd.canonicalSource.sourceName, FRB_H15_SOURCE_NAME);
assert.strictEqual(longEnd.canonicalSource.sourceLocator, FRB_H15_SOURCE_LOCATOR);
assert.strictEqual(longEnd.authentication.kind, 'none');
assert.strictEqual(longEnd.approvalPolicy, 'human_required');
assert.strictEqual(longEnd.lane, 'treasury_display');
assert.strictEqual(longEnd.failureSeverity, 'nonfatal_treasury');
assert.strictEqual(FRB_H15_ARTIFACT_ID, 'treasuryLongEndIncomeLens');

// Locked DDP package hashes (Board algorithm: MD5 of unique IDs joined by LF).
assert.strictEqual(
  frbH15PackageSeriesHash(FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS),
  'bf17364827e38702b42a58cf8eaa3f78'
);
assert.strictEqual(
  frbH15PackageSeriesHash([FRB_H15_TIPS_30_SERIES_UNIQUE_ID]),
  '5a2ee5c97b9512270146d6ce9960a9ab'
);
assert.ok(FRB_H15_TCM_PACKAGE_OUTPUT_URL.includes('series=bf17364827e38702b42a58cf8eaa3f78'));
assert.ok(FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL.includes('series=5a2ee5c97b9512270146d6ce9960a9ab'));
assert.strictEqual(
  buildFrbH15PackageOutputUrl(FRB_H15_TCM_PACKAGE_SERIES_UNIQUE_IDS),
  FRB_H15_TCM_PACKAGE_OUTPUT_URL
);

async function fetched(
  tcm: string,
  tips: string
): Promise<GhostFlowFetchedSource<FrbH15FetchedPackages>> {
  const { client } = dualClient(tcm, tips);
  const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
  const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
  assert.strictEqual(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

(async () => {
  {
    const { client, urls } = dualClient(FIXTURE_H15_TCM_VALID, FIXTURE_H15_TIPS30_VALID);
    const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
    const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(urls, [
      FRB_H15_TCM_PACKAGE_OUTPUT_URL,
      FRB_H15_TIPS_30_PACKAGE_OUTPUT_URL,
    ]);
    assert.strictEqual(result.value.raw.treasuryConstantMaturitiesCsv, FIXTURE_H15_TCM_VALID);
    assert.strictEqual(result.value.raw.tips30Csv, FIXTURE_H15_TIPS30_VALID);
    const sep = Uint8Array.of(0x1e);
    const a = new TextEncoder().encode(FIXTURE_H15_TCM_VALID);
    const b = new TextEncoder().encode(FIXTURE_H15_TIPS30_VALID);
    const concat = new Uint8Array(a.length + sep.length + b.length);
    concat.set(a, 0);
    concat.set(sep, a.length);
    concat.set(b, a.length + sep.length);
    assert.strictEqual(
      result.value.sourceMetadata.contentSha256,
      createHash('sha256').update(concat).digest('hex')
    );
    assert.strictEqual(result.value.sourceMetadata.sourceId, FRB_H15_SOURCE_FAMILY_ID);
    assert.strictEqual(result.value.sourceMetadata.sourceLocator, FRB_H15_SOURCE_LOCATOR);
  }

  {
    const urls: string[] = [];
    const client: FrbH15FetchClient = async (url) => {
      urls.push(url);
      if (urls.length === 1) {
        return { ok: false, status: 503, bytes: new TextEncoder().encode('err') };
      }
      return textResponse(FIXTURE_H15_TIPS30_VALID);
    };
    const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_http_error');
  }

  {
    const client: FrbH15FetchClient = async (url) => {
      if (url === FRB_H15_TCM_PACKAGE_OUTPUT_URL) return textResponse(FIXTURE_H15_TCM_VALID);
      return { ok: true, status: 200, bytes: new Uint8Array() };
    };
    const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_empty_body');
  }

  {
    const client: FrbH15FetchClient = async () => {
      throw new Error('network');
    };
    const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'h15_fetch_exception');
  }

  {
    const { client } = dualClient(FIXTURE_H15_TCM_VALID, FIXTURE_H15_TIPS30_VALID);
    const adapter = createFrbH15TreasuryYieldsAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: 'nope' }), 'h15_fetch_invalid_now');
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter({
      fetchClient: dualClient(FIXTURE_H15_TCM_VALID, FIXTURE_H15_TIPS30_VALID).client,
    });
    const source = await fetched(FIXTURE_H15_TCM_VALID, FIXTURE_H15_TIPS30_VALID);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assert.ok(parsed.value.parsed.some((r) => r.seriesUniqueId === 'H15/H15/RIFLGFCY30_N.B'));
    assert.ok(
      parsed.value.parsed.some((r) => r.seriesUniqueId === 'H15/H15/RIFLGFCY30_XII_N.B')
    );
    assert.ok(
      !parsed.value.parsed.some(
        (r) => r.observationAsOf === '2026-07-02' && r.seriesUniqueId.includes('RIFLGFCY02')
      )
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_INVALID_DATE, FIXTURE_H15_TIPS30_MATCHING);
    assertFailCode(
      adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_csv_invalid_date'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_BAD_VALUE, FIXTURE_H15_TIPS30_MATCHING);
    assertFailCode(
      adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_csv_invalid_value'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_VALID, FIXTURE_H15_TIPS30_VALID);
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
    assert.strictEqual(normalized.value.provenance.adapterId, FRB_H15_ADAPTER_ID);
    assert.strictEqual(normalized.value.artifactId, FRB_H15_ARTIFACT_ID);
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_OPTIONAL_GAP, FIXTURE_H15_TIPS30_MATCHING);
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
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_NO_COMMON, FIXTURE_H15_TIPS30_NO_COMMON);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assertFailCode(
      adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_normalize_no_common_date'
    );
  }

  {
    const adapter = createFrbH15TreasuryYieldsAdapter();
    const source = await fetched(FIXTURE_H15_TCM_FUTURE, FIXTURE_H15_TIPS30_FUTURE);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assertFailCode(
      adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO }),
      'h15_normalize_future_observation'
    );
  }

  console.log('ghostflow/frbH15TreasuryYieldsAdapter.test.ts: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
