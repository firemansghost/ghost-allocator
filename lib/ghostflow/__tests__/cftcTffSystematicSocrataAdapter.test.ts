/**
 * CFTC TFF systematic Socrata adapter — fixture-driven tests (no live network).
 */

import assert from 'assert';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER,
  createCftcTffSystematicSocrataAdapter,
  parseCftcTffReportDateCell,
  type CftcTffFetchClient,
  type CftcTffFetchResponse,
} from '../refresh/adapters/cftcTffSystematicSocrata';
import {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_REGISTERED_CONTRACT_CODES,
  CFTC_TFF_RESOURCE_ENDPOINT,
  CFTC_TFF_SCORE_CONTRACT_CODES,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SOURCE_NAME,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
  CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE,
} from '../refresh/adapters/cftcTffSocrataMeta';
import {
  buildCftcTffSystematicResourceQueryUrl,
  CFTC_TFF_FUTONLY_VALUE,
  CFTC_TFF_SYSTEMATIC_QUERY_LIMIT,
  CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS,
} from '../refresh/adapters/cftcTffSocrataSource';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../refresh/registry';
import type { GhostFlowFetchedSource } from '../refresh/types';
import {
  ADAPTER_TEST_NOW_ISO,
  FIXTURE_CFTC_DUPLICATE_CODE_DATE,
  FIXTURE_CFTC_EMPTY_ARRAY,
  FIXTURE_CFTC_FUTURE_REPORT,
  FIXTURE_CFTC_INVALID_CALENDAR_DATE,
  FIXTURE_CFTC_INVALID_OPEN_INTEREST,
  FIXTURE_CFTC_INVALID_PERCENT,
  FIXTURE_CFTC_LATEST_COMPLETE,
  FIXTURE_CFTC_LATEST_INCOMPLETE,
  FIXTURE_CFTC_MALFORMED_JSON,
  FIXTURE_CFTC_MISSING_FIELD,
  FIXTURE_CFTC_MISMATCHED_WEEK,
  FIXTURE_CFTC_NEGATIVE_CHANGE_OK,
  FIXTURE_CFTC_NEGATIVE_POSITION,
  FIXTURE_CFTC_NON_ARRAY,
  FIXTURE_CFTC_UNEXPECTED_CODE,
  FIXTURE_CFTC_UNSORTED,
  FIXTURE_CFTC_VALID_MULTI_WEEK,
  FIXTURE_CFTC_WRONG_FUTONLY,
} from './fixtures/cftcTffSystematicSocrataFixtures';

function textResponse(
  text: string,
  opts?: Partial<CftcTffFetchResponse>
): CftcTffFetchResponse {
  const bytes = new TextEncoder().encode(text);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    contentType: 'application/json; charset=utf-8',
    bytes,
    ...opts,
    bytes: opts?.bytes ?? bytes,
  };
}

function trackingClient(
  response: CftcTffFetchResponse | (() => Promise<CftcTffFetchResponse>)
): { client: CftcTffFetchClient; urls: string[] } {
  const urls: string[] = [];
  const client: CftcTffFetchClient = async (url) => {
    urls.push(url);
    return typeof response === 'function' ? response() : response;
  };
  return { client, urls };
}

function assertFailCode(
  result: { ok: boolean; issues?: { code: string; stage?: string; severity?: string }[] },
  code: string
): void {
  assert.strictEqual(result.ok, false);
  assert.ok(
    result.issues?.some((i) => i.code === code),
    `expected ${code}; got ${result.issues?.map((i) => i.code).join(', ')}`
  );
  const issue = result.issues!.find((i) => i.code === code)!;
  assert.strictEqual(issue.severity, 'block');
}

function assertNoForbiddenKeys(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const banned of [
    'usedInScore',
    'basketNetContracts',
    'basketNetPctOi',
    'basketDirection',
    'basketScore',
    'systematicStrategyPressure',
    'dataQuality',
    'signalId',
    '"basket"',
  ]) {
    assert.ok(
      !serialized.includes(banned),
      `normalized output must not contain ${banned}`
    );
  }
}

const systematicEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'systematicFlowProxy'
)!;
const treasuryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'treasuryFuturesPositioningProxy'
)!;
const queryUrl = buildCftcTffSystematicResourceQueryUrl();

// --- Metadata and registry (1–8) ---

assert.strictEqual(
  CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER.id,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID
);
assert.strictEqual(
  CFTC_TFF_SYSTEMATIC_SOCRATA_ADAPTER.parserVersion,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION
);
assert.strictEqual(systematicEntry.adapter.adapterId, CFTC_TFF_SYSTEMATIC_ADAPTER_ID);
assert.strictEqual(systematicEntry.adapter.implementationStatus, 'implemented');
if (systematicEntry.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(
    systematicEntry.adapter.parserVersion,
    CFTC_TFF_SYSTEMATIC_PARSER_VERSION
  );
}
assert.strictEqual(
  systematicEntry.canonicalSource.sourceFamilyId,
  CFTC_TFF_SOURCE_FAMILY_ID
);
assert.strictEqual(systematicEntry.canonicalSource.sourceName, CFTC_TFF_SOURCE_NAME);
assert.strictEqual(
  systematicEntry.canonicalSource.sourceLocator,
  CFTC_TFF_DATASET_PAGE_LOCATOR
);
assert.strictEqual(CFTC_TFF_SYSTEMATIC_ARTIFACT_ID, 'systematicFlowProxy');
assert.strictEqual(systematicEntry.lane, 'display_only_equity');
assert.strictEqual(systematicEntry.failureSeverity, 'nonfatal_display');
assert.strictEqual(treasuryEntry.adapter.implementationStatus, 'spike_available');

{
  const adapterSource = readFileSync(
    path.join(
      process.cwd(),
      'lib/ghostflow/refresh/adapters/cftcTffSystematicSocrata.ts'
    ),
    'utf8'
  );
  assert.ok(!adapterSource.includes('systematicStrategyPressure'));
  assert.ok(!adapterSource.includes('MOCK'));
  assert.ok(!/\bsystematicStrategyPressure\b/.test(adapterSource));
}

// --- Query construction (9–14) ---

assert.ok(queryUrl.startsWith(CFTC_TFF_RESOURCE_ENDPOINT));
assert.ok(queryUrl.includes(CFTC_TFF_DATASET_ID));
for (const code of CFTC_TFF_REGISTERED_CONTRACT_CODES) {
  assert.ok(decodeURIComponent(queryUrl).includes(`'${code}'`));
}
assert.strictEqual(CFTC_TFF_REGISTERED_CONTRACT_CODES.length, 4);
assert.ok(decodeURIComponent(queryUrl).includes(CFTC_TFF_FUTONLY_VALUE));
for (const field of CFTC_TFF_SYSTEMATIC_SELECTED_FIELDS) {
  assert.ok(decodeURIComponent(queryUrl).includes(field));
}
assert.ok(
  decodeURIComponent(queryUrl).includes(
    'report_date_as_yyyy_mm_dd DESC,cftc_contract_market_code ASC'
  )
);
assert.ok(queryUrl.includes(`$limit=${CFTC_TFF_SYSTEMATIC_QUERY_LIMIT}`));
assert.ok(!/api[_-]?key/i.test(queryUrl));
assert.ok(!/token/i.test(queryUrl));
assert.ok(!/2026-07-09/.test(queryUrl));
assert.ok(!/now/i.test(queryUrl));

// --- Report-date cell parsing (fail-closed on observed Socrata shape) ---

assert.strictEqual(
  parseCftcTffReportDateCell('2026-07-07T00:00:00.000'),
  '2026-07-07'
);
assert.strictEqual(
  parseCftcTffReportDateCell(' 2026-07-07T00:00:00.000 '),
  '2026-07-07'
);
for (const invalid of [
  '2026-07-07T99:99:99.000',
  '2026-07-07T25:72:91.000',
  '2026-07-07T12:30:00.000',
  '2026-07-07T00:00:00',
  '2026-07-07T00:00:00.000Z',
  '2026-07-07T00:00:00.000-05:00',
  '2026-07-07',
  '2026-07-07T00:00:00.000junk',
  '2026-02-30T00:00:00.000',
]) {
  assert.strictEqual(
    parseCftcTffReportDateCell(invalid),
    null,
    `expected null for ${invalid}`
  );
}

async function fetched(
  text: string
): Promise<GhostFlowFetchedSource<string>> {
  const { client } = trackingClient(textResponse(text));
  const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
  const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
  assert.strictEqual(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

(async () => {
  // --- Fetch (15–25) ---

  {
    const { client, urls } = trackingClient(textResponse(FIXTURE_CFTC_VALID_MULTI_WEEK));
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(urls, [queryUrl]);
    assert.strictEqual(result.value.raw, FIXTURE_CFTC_VALID_MULTI_WEEK);
    const expectedHash = createHash('sha256')
      .update(new TextEncoder().encode(FIXTURE_CFTC_VALID_MULTI_WEEK))
      .digest('hex');
    assert.strictEqual(result.value.sourceMetadata.contentSha256, expectedHash);
    assert.strictEqual(result.value.sourceMetadata.retrievedAt, ADAPTER_TEST_NOW_ISO);
    assert.strictEqual(
      result.value.sourceMetadata.contentType,
      'application/json; charset=utf-8'
    );
    assert.strictEqual(result.value.sourceMetadata.sourceId, CFTC_TFF_SOURCE_FAMILY_ID);
    assert.strictEqual(result.value.sourceMetadata.sourceLocator, queryUrl);
  }

  {
    const { client } = trackingClient(textResponse(FIXTURE_CFTC_VALID_MULTI_WEEK));
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: 'not-a-timestamp' }),
      'cftc_tff_fetch_invalid_now'
    );
  }

  {
    const { client } = trackingClient({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      bytes: new TextEncoder().encode('unavailable'),
    });
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_fetch_http_error'
    );
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      contentType: 'application/json',
      bytes: new Uint8Array(),
    });
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_fetch_empty_body'
    );
  }

  {
    const { client } = trackingClient(
      textResponse(FIXTURE_CFTC_VALID_MULTI_WEEK, {
        contentType: 'text/html',
      })
    );
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_fetch_invalid_content_type'
    );
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      contentType: 'application/json',
      bytes: new Uint8Array([0xff, 0xfe, 0xfd]),
    });
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_fetch_invalid_utf8'
    );
  }

  {
    const { client } = trackingClient(async () => {
      throw new Error('network down');
    });
    const adapter = createCftcTffSystematicSocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_fetch_exception'
    );
  }

  // --- Parse (26–42) ---

  {
    const source = await fetched(FIXTURE_CFTC_VALID_MULTI_WEEK);
    const adapter = createCftcTffSystematicSocrataAdapter();
    const originalMeta = { ...source.sourceMetadata };
    const originalRaw = source.raw;
    const result = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.parsed.length, 8);
    assert.deepStrictEqual(result.value.sourceMetadata, originalMeta);
    assert.strictEqual(source.raw, originalRaw);
    assert.deepStrictEqual(source.sourceMetadata, originalMeta);
  }

  {
    const source = await fetched(FIXTURE_CFTC_MALFORMED_JSON);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_json_parse_failed'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_NON_ARRAY);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_json_not_array'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_EMPTY_ARRAY);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_json_empty'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_MISSING_FIELD);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_missing_field'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_INVALID_CALENDAR_DATE);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_report_date'
    );
  }

  {
    const badTimestamp = JSON.parse(FIXTURE_CFTC_LATEST_COMPLETE) as Record<
      string,
      unknown
    >[];
    badTimestamp[0]!.report_date_as_yyyy_mm_dd = '2026-07-07T99:99:99.000';
    const source = await fetched(JSON.stringify(badTimestamp));
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_report_date'
    );
  }

  {
    const badWeek = JSON.parse(FIXTURE_CFTC_LATEST_COMPLETE) as Record<string, unknown>[];
    badWeek[0]!.yyyy_report_week_ww = '   ';
    const source = await fetched(JSON.stringify(badWeek));
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_report_week'
    );
  }

  {
    const badName = JSON.parse(FIXTURE_CFTC_LATEST_COMPLETE) as Record<string, unknown>[];
    badName[0]!.contract_market_name = '';
    const source = await fetched(JSON.stringify(badName));
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_contract_name'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_UNEXPECTED_CODE);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_unexpected_contract_code'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_WRONG_FUTONLY);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_wrong_report_type'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_INVALID_OPEN_INTEREST);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_numeric_field'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_NEGATIVE_POSITION);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_numeric_field'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_NEGATIVE_CHANGE_OK);
    const result = createCftcTffSystematicSocrataAdapter().parse(source, {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.ok(result.value.parsed.some((r) => r.changeLong < 0));
  }

  {
    const source = await fetched(FIXTURE_CFTC_INVALID_PERCENT);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_invalid_numeric_field'
    );
  }

  {
    const source = await fetched(FIXTURE_CFTC_DUPLICATE_CODE_DATE);
    assertFailCode(
      createCftcTffSystematicSocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_duplicate_contract_date'
    );
  }

  // --- Normalize (43–61) ---

  async function normalizeJson(text: string, ctx?: { nowIso?: string; referenceAsOf?: string }) {
    const source = await fetched(text);
    const parsed = createCftcTffSystematicSocrataAdapter().parse(source, {
      nowIso: ctx?.nowIso ?? ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    return createCftcTffSystematicSocrataAdapter().normalize(parsed.value, {
      nowIso: ctx?.nowIso ?? ADAPTER_TEST_NOW_ISO,
      referenceAsOf: ctx?.referenceAsOf,
    });
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_LATEST_COMPLETE);
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-07-07');
    assert.strictEqual(result.value.fields.datasetId, CFTC_TFF_DATASET_ID);
    assert.deepStrictEqual(
      result.value.fields.scoreContracts.map((c) => c.cftcContractMarketCode),
      [...CFTC_TFF_SCORE_CONTRACT_CODES]
    );
    assert.strictEqual(
      result.value.fields.vixContext.cftcContractMarketCode,
      CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE
    );
    assert.strictEqual(
      result.value.provenance.adapterId,
      CFTC_TFF_SYSTEMATIC_ADAPTER_ID
    );
    assert.strictEqual(
      result.value.provenance.parserVersion,
      CFTC_TFF_SYSTEMATIC_PARSER_VERSION
    );
    assert.strictEqual(result.value.provenance.sourceId, CFTC_TFF_SOURCE_FAMILY_ID);
    assert.strictEqual(result.value.provenance.sourceLocator, queryUrl);
    assert.strictEqual(result.value.provenance.retrievedAt, ADAPTER_TEST_NOW_ISO);
    assert.strictEqual(result.value.provenance.observationAsOf, '2026-07-07');
    assert.ok(!('sourcePublishedAt' in result.value.provenance));
    assertNoForbiddenKeys(result.value);
    assert.ok(!JSON.stringify(result.value).includes(FIXTURE_CFTC_LATEST_COMPLETE));
  }

  {
    const sorted = await normalizeJson(FIXTURE_CFTC_LATEST_COMPLETE);
    const unsorted = await normalizeJson(FIXTURE_CFTC_UNSORTED);
    assert.strictEqual(sorted.ok, true);
    assert.strictEqual(unsorted.ok, true);
    if (!sorted.ok || !unsorted.ok) throw new Error('unreachable');
    assert.deepStrictEqual(unsorted.value.fields, sorted.value.fields);
    assert.strictEqual(unsorted.value.observationAsOf, sorted.value.observationAsOf);
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_VALID_MULTI_WEEK, {
      referenceAsOf: '2026-06-30',
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-06-30');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_VALID_MULTI_WEEK, {
      referenceAsOf: '2026-06-31',
    });
    assertFailCode(result, 'cftc_tff_normalize_invalid_reference_ceiling');
  }

  {
    // Written calendar prefix is 2026-07-06; represented UTC date is 2026-07-07.
    const result = await normalizeJson(FIXTURE_CFTC_VALID_MULTI_WEEK, {
      nowIso: '2026-07-06T20:00:00.000-10:00',
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-07-07');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_FUTURE_REPORT);
    assertFailCode(result, 'cftc_tff_normalize_future_observation');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_VALID_MULTI_WEEK, {
      nowIso: '2020-01-01T00:00:00.000Z',
    });
    // All fixture dates are after 2020-01-01 → future observation
    assertFailCode(result, 'cftc_tff_normalize_future_observation');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_VALID_MULTI_WEEK, {
      referenceAsOf: '2026-01-01',
    });
    assertFailCode(result, 'cftc_tff_normalize_no_eligible_report');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_LATEST_INCOMPLETE);
    assertFailCode(result, 'cftc_tff_normalize_incomplete_latest_report');
  }

  {
    const result = await normalizeJson(FIXTURE_CFTC_MISMATCHED_WEEK);
    assertFailCode(result, 'cftc_tff_normalize_report_week_mismatch');
  }

  {
    const a = await normalizeJson(FIXTURE_CFTC_LATEST_COMPLETE);
    const b = await normalizeJson(FIXTURE_CFTC_LATEST_COMPLETE);
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
    if (!a.ok || !b.ok) throw new Error('unreachable');
    assert.deepStrictEqual(a.value, b.value);
  }

  // --- Existing boundaries (62–66) ---

  {
    const adapterSource = readFileSync(
      path.join(
        process.cwd(),
        'lib/ghostflow/refresh/adapters/cftcTffSystematicSocrata.ts'
      ),
      'utf8'
    );
    for (const banned of [
      'computeNetContracts',
      'computeBasketMetrics',
      'mapBasketNetPctOiToPressureScore',
      'validateSystematicFlowProxyArtifact',
      'loadSystematicFlowProxyArtifact',
      'scoreGhostFlowSnapshot',
      'buildGhostFlowSnapshotWithArtifact',
      'systematicFlowProxy.v1.json',
    ]) {
      assert.ok(!adapterSource.includes(banned), `adapter must not call/load ${banned}`);
    }
  }

  console.log('ghostflow/cftcTffSystematicSocrataAdapter.test.ts: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
