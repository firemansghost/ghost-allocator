/**
 * CFTC TFF Treasury Socrata adapter — fixture-driven tests (no live network).
 */

import assert from 'assert';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  CFTC_TFF_TREASURY_SOCRATA_ADAPTER,
  createCftcTffTreasurySocrataAdapter,
  type CftcTffFetchClient,
  type CftcTffFetchResponse,
} from '../refresh/adapters/cftcTffTreasurySocrata';
import {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_ARTIFACT_ID,
  CFTC_TFF_TREASURY_CORE_CONTRACT_CODES,
  CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES,
  CFTC_TFF_TREASURY_PARSER_VERSION,
  CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES,
  CFTC_TFF_TREASURY_SOURCE_LOCATOR,
  CFTC_TFF_TREASURY_SOURCE_NAME,
} from '../refresh/adapters/cftcTffTreasurySocrataMeta';
import {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_RESOURCE_ENDPOINT,
  CFTC_TFF_SOURCE_FAMILY_ID,
} from '../refresh/adapters/cftcTffSocrataMeta';
import {
  buildCftcTffSystematicResourceQueryUrl,
  buildCftcTffTreasuryResourceQueryUrl,
  CFTC_TFF_FUTONLY_VALUE,
  CFTC_TFF_TREASURY_QUERY_LIMIT,
  CFTC_TFF_TREASURY_SELECTED_FIELDS,
} from '../refresh/adapters/cftcTffSocrataSource';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../refresh/registry';
import type { GhostFlowFetchedSource } from '../refresh/types';
import {
  ADAPTER_TEST_NOW_ISO,
  FIXTURE_TREASURY_CORE_NO_OPTIONAL,
  FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL,
  FIXTURE_TREASURY_CORE_PLUS_ONE_OPTIONAL,
  FIXTURE_TREASURY_DUPLICATE_CODE_DATE,
  FIXTURE_TREASURY_EMPTY_ARRAY,
  FIXTURE_TREASURY_FUTURE_REPORT,
  FIXTURE_TREASURY_INVALID_AM_PCT,
  FIXTURE_TREASURY_INVALID_LEV_PCT,
  FIXTURE_TREASURY_INVALID_OPEN_INTEREST,
  FIXTURE_TREASURY_INVALID_TIMESTAMP,
  FIXTURE_TREASURY_LATEST_INCOMPLETE_CORE,
  FIXTURE_TREASURY_MALFORMED_JSON,
  FIXTURE_TREASURY_MISSING_FIELD,
  FIXTURE_TREASURY_MISMATCHED_CORE_WEEK,
  FIXTURE_TREASURY_MISMATCHED_OPTIONAL_WEEK,
  FIXTURE_TREASURY_NEGATIVE_AM_POSITION,
  FIXTURE_TREASURY_NEGATIVE_CHANGES_OK,
  FIXTURE_TREASURY_NEGATIVE_LEV_POSITION,
  FIXTURE_TREASURY_NON_ARRAY,
  FIXTURE_TREASURY_UNEXPECTED_CODE,
  FIXTURE_TREASURY_UNSORTED,
  FIXTURE_TREASURY_VALID_MULTI_WEEK,
  FIXTURE_TREASURY_WRONG_FUTONLY,
} from './fixtures/cftcTffTreasurySocrataFixtures';

/** Pre-refactor systematic baseline (PR #136) — must remain byte-for-byte identical. */
const BASELINE_SYSTEMATIC_QUERY_URL =
  "https://publicreporting.cftc.gov/resource/gpe5-46if.json?$select=report_date_as_yyyy_mm_dd%2Cyyyy_report_week_ww%2Ccontract_market_name%2Ccftc_contract_market_code%2Cfutonly_or_combined%2Copen_interest_all%2Clev_money_positions_long%2Clev_money_positions_short%2Clev_money_positions_spread%2Cchange_in_lev_money_long%2Cchange_in_lev_money_short%2Cchange_in_lev_money_spread%2Cpct_of_oi_lev_money_long%2Cpct_of_oi_lev_money_short%2Cpct_of_oi_lev_money_spread&$where=futonly_or_combined%20%3D%20'FutOnly'%20AND%20cftc_contract_market_code%20in%20('13874A'%2C'209742'%2C'239742'%2C'1170E1')&$order=report_date_as_yyyy_mm_dd%20DESC%2Ccftc_contract_market_code%20ASC&$limit=500";

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
  result: { ok: boolean; issues?: { code: string; severity?: string }[] },
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
    'levMoneyNet',
    'levMoneyGross',
    'basketOpenInterestAll',
    'basketLevMoneyNet',
    'direction',
    'mappingStatus',
    'includeInBasket',
    'usedInAggregate',
    'tenor',
    '"role"',
    'systematicStrategyPressure',
  ]) {
    assert.ok(!serialized.includes(banned), `must not contain ${banned}`);
  }
}

const treasuryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'treasuryFuturesPositioningProxy'
)!;
const systematicEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'systematicFlowProxy'
)!;
const longEndEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (e) => e.artifactId === 'treasuryLongEndIncomeLens'
)!;
const queryUrl = buildCftcTffTreasuryResourceQueryUrl();

// --- Metadata and registry (1–8) ---

assert.strictEqual(CFTC_TFF_TREASURY_SOCRATA_ADAPTER.id, CFTC_TFF_TREASURY_ADAPTER_ID);
assert.strictEqual(
  CFTC_TFF_TREASURY_SOCRATA_ADAPTER.parserVersion,
  CFTC_TFF_TREASURY_PARSER_VERSION
);
assert.strictEqual(treasuryEntry.adapter.adapterId, CFTC_TFF_TREASURY_ADAPTER_ID);
assert.strictEqual(treasuryEntry.adapter.implementationStatus, 'implemented');
if (treasuryEntry.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(
    treasuryEntry.adapter.parserVersion,
    CFTC_TFF_TREASURY_PARSER_VERSION
  );
}
assert.strictEqual(treasuryEntry.canonicalSource.sourceFamilyId, CFTC_TFF_SOURCE_FAMILY_ID);
assert.strictEqual(treasuryEntry.canonicalSource.sourceName, CFTC_TFF_TREASURY_SOURCE_NAME);
assert.strictEqual(
  treasuryEntry.canonicalSource.sourceLocator,
  CFTC_TFF_TREASURY_SOURCE_LOCATOR
);
assert.strictEqual(CFTC_TFF_TREASURY_ARTIFACT_ID, 'treasuryFuturesPositioningProxy');
assert.strictEqual(treasuryEntry.lane, 'treasury_display');
assert.strictEqual(treasuryEntry.failureSeverity, 'nonfatal_treasury');
assert.strictEqual(longEndEntry.adapter.implementationStatus, 'implemented');
assert.strictEqual(longEndEntry.adapter.adapterId, 'frb-h15-treasury-yields-csv');
assert.strictEqual(systematicEntry.adapter.implementationStatus, 'implemented');
if (systematicEntry.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(systematicEntry.adapter.parserVersion, '1.0.0');
}

// --- Query (9–16) ---

assert.ok(queryUrl.startsWith(CFTC_TFF_RESOURCE_ENDPOINT));
assert.ok(queryUrl.includes(CFTC_TFF_DATASET_ID));
assert.strictEqual(CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES.length, 6);
for (const code of CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES) {
  assert.ok(decodeURIComponent(queryUrl).includes(`'${code}'`));
}
assert.ok(decodeURIComponent(queryUrl).includes(CFTC_TFF_FUTONLY_VALUE));
for (const field of CFTC_TFF_TREASURY_SELECTED_FIELDS) {
  assert.ok(decodeURIComponent(queryUrl).includes(field));
}
assert.ok(
  decodeURIComponent(queryUrl).includes(
    'report_date_as_yyyy_mm_dd DESC,cftc_contract_market_code ASC'
  )
);
assert.ok(queryUrl.includes(`$limit=${CFTC_TFF_TREASURY_QUERY_LIMIT}`));
assert.ok(!/api[_-]?key/i.test(queryUrl));
assert.ok(!/token/i.test(queryUrl));
assert.ok(!/2026-07-09/.test(queryUrl));
assert.ok(!/discover/i.test(queryUrl));
assert.strictEqual(
  buildCftcTffSystematicResourceQueryUrl(),
  BASELINE_SYSTEMATIC_QUERY_URL
);

async function fetched(text: string): Promise<GhostFlowFetchedSource<string>> {
  const { client } = trackingClient(textResponse(text));
  const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
  const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
  assert.strictEqual(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

(async () => {
  // --- Fetch (17–27) ---

  {
    const { client, urls } = trackingClient(
      textResponse(FIXTURE_TREASURY_VALID_MULTI_WEEK)
    );
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(urls, [queryUrl]);
    const expectedHash = createHash('sha256')
      .update(new TextEncoder().encode(FIXTURE_TREASURY_VALID_MULTI_WEEK))
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
    const { client } = trackingClient(textResponse(FIXTURE_TREASURY_VALID_MULTI_WEEK));
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: 'not-a-timestamp' }),
      'cftc_tff_treasury_fetch_invalid_now'
    );
  }

  {
    const { client } = trackingClient({
      ok: false,
      status: 503,
      bytes: new TextEncoder().encode('unavailable'),
    });
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_treasury_fetch_http_error'
    );
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      contentType: 'application/json',
      bytes: new Uint8Array(),
    });
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_treasury_fetch_empty_body'
    );
  }

  {
    const { client } = trackingClient(
      textResponse(FIXTURE_TREASURY_VALID_MULTI_WEEK, { contentType: 'text/html' })
    );
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_treasury_fetch_invalid_content_type'
    );
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      contentType: 'application/json',
      bytes: new Uint8Array([0xff, 0xfe, 0xfd]),
    });
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_treasury_fetch_invalid_utf8'
    );
  }

  {
    const { client } = trackingClient(async () => {
      throw new Error('network down');
    });
    const adapter = createCftcTffTreasurySocrataAdapter({ fetchClient: client });
    assertFailCode(
      await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }),
      'cftc_tff_treasury_fetch_exception'
    );
  }

  // --- Parse (28–48) ---

  {
    const source = await fetched(FIXTURE_TREASURY_VALID_MULTI_WEEK);
    const adapter = createCftcTffTreasurySocrataAdapter();
    const originalMeta = { ...source.sourceMetadata };
    const originalRaw = source.raw;
    const result = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.parsed.length, 12);
    assert.deepStrictEqual(result.value.sourceMetadata, originalMeta);
    assert.strictEqual(source.raw, originalRaw);
  }

  for (const [fixture, code] of [
    [FIXTURE_TREASURY_MALFORMED_JSON, 'cftc_tff_treasury_json_parse_failed'],
    [FIXTURE_TREASURY_NON_ARRAY, 'cftc_tff_treasury_json_not_array'],
    [FIXTURE_TREASURY_EMPTY_ARRAY, 'cftc_tff_treasury_json_empty'],
    [FIXTURE_TREASURY_MISSING_FIELD, 'cftc_tff_treasury_missing_field'],
    [FIXTURE_TREASURY_INVALID_TIMESTAMP, 'cftc_tff_treasury_invalid_report_date'],
    [FIXTURE_TREASURY_UNEXPECTED_CODE, 'cftc_tff_treasury_unexpected_contract_code'],
    [FIXTURE_TREASURY_WRONG_FUTONLY, 'cftc_tff_treasury_wrong_report_type'],
    [FIXTURE_TREASURY_INVALID_OPEN_INTEREST, 'cftc_tff_treasury_invalid_numeric_field'],
    [FIXTURE_TREASURY_NEGATIVE_LEV_POSITION, 'cftc_tff_treasury_invalid_numeric_field'],
    [FIXTURE_TREASURY_NEGATIVE_AM_POSITION, 'cftc_tff_treasury_invalid_numeric_field'],
    [FIXTURE_TREASURY_INVALID_LEV_PCT, 'cftc_tff_treasury_invalid_numeric_field'],
    [FIXTURE_TREASURY_INVALID_AM_PCT, 'cftc_tff_treasury_invalid_numeric_field'],
    [FIXTURE_TREASURY_DUPLICATE_CODE_DATE, 'cftc_tff_treasury_duplicate_contract_date'],
  ] as const) {
    const source = await fetched(fixture);
    assertFailCode(
      createCftcTffTreasurySocrataAdapter().parse(source, {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      code
    );
  }

  {
    const blankWeek = JSON.parse(FIXTURE_TREASURY_CORE_NO_OPTIONAL) as Record<
      string,
      unknown
    >[];
    blankWeek[0]!.yyyy_report_week_ww = '   ';
    assertFailCode(
      createCftcTffTreasurySocrataAdapter().parse(await fetched(JSON.stringify(blankWeek)), {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_treasury_invalid_report_week'
    );
  }

  {
    const blankName = JSON.parse(FIXTURE_TREASURY_CORE_NO_OPTIONAL) as Record<
      string,
      unknown
    >[];
    blankName[0]!.contract_market_name = '';
    assertFailCode(
      createCftcTffTreasurySocrataAdapter().parse(await fetched(JSON.stringify(blankName)), {
        nowIso: ADAPTER_TEST_NOW_ISO,
      }),
      'cftc_tff_treasury_invalid_contract_name'
    );
  }

  {
    const blankCommodity = JSON.parse(FIXTURE_TREASURY_CORE_NO_OPTIONAL) as Record<
      string,
      unknown
    >[];
    blankCommodity[0]!.commodity_name = '';
    assertFailCode(
      createCftcTffTreasurySocrataAdapter().parse(
        await fetched(JSON.stringify(blankCommodity)),
        { nowIso: ADAPTER_TEST_NOW_ISO }
      ),
      'cftc_tff_treasury_invalid_commodity_name'
    );
  }

  {
    const blankExchange = JSON.parse(FIXTURE_TREASURY_CORE_NO_OPTIONAL) as Record<
      string,
      unknown
    >[];
    blankExchange[0]!.market_and_exchange_names = '';
    assertFailCode(
      createCftcTffTreasurySocrataAdapter().parse(
        await fetched(JSON.stringify(blankExchange)),
        { nowIso: ADAPTER_TEST_NOW_ISO }
      ),
      'cftc_tff_treasury_invalid_market_exchange_name'
    );
  }

  {
    const source = await fetched(FIXTURE_TREASURY_NEGATIVE_CHANGES_OK);
    const result = createCftcTffTreasurySocrataAdapter().parse(source, {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.ok(result.value.parsed.some((r) => r.changeLeveragedFundsLong < 0));
  }

  // --- Normalize (49–69) ---

  async function normalizeJson(
    text: string,
    ctx?: { nowIso?: string; referenceAsOf?: string }
  ) {
    const source = await fetched(text);
    const parsed = createCftcTffTreasurySocrataAdapter().parse(source, {
      nowIso: ctx?.nowIso ?? ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    return createCftcTffTreasurySocrataAdapter().normalize(parsed.value, {
      nowIso: ctx?.nowIso ?? ADAPTER_TEST_NOW_ISO,
      referenceAsOf: ctx?.referenceAsOf,
    });
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL);
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-07-07');
    assert.strictEqual(result.value.fields.datasetId, CFTC_TFF_DATASET_ID);
    assert.deepStrictEqual(
      result.value.fields.coreContracts.map((c) => c.cftcContractMarketCode),
      [...CFTC_TFF_TREASURY_CORE_CONTRACT_CODES]
    );
    assert.deepStrictEqual(
      result.value.fields.optionalContextContracts.map((c) => c.cftcContractMarketCode),
      [...CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES]
    );
    assert.strictEqual(result.issues.length, 0);
    assert.ok(!('sourcePublishedAt' in result.value.provenance));
    assertNoForbiddenKeys(result.value);
  }

  {
    const sorted = await normalizeJson(FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL);
    const unsorted = await normalizeJson(FIXTURE_TREASURY_UNSORTED);
    assert.strictEqual(sorted.ok && unsorted.ok, true);
    if (!sorted.ok || !unsorted.ok) throw new Error('unreachable');
    assert.deepStrictEqual(unsorted.value.fields, sorted.value.fields);
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_CORE_PLUS_ONE_OPTIONAL);
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(
      result.value.fields.optionalContextContracts.map((c) => c.cftcContractMarketCode),
      ['043607']
    );
    assert.strictEqual(result.issues.length, 1);
    assert.strictEqual(
      result.issues[0]!.code,
      'cftc_tff_treasury_optional_context_missing'
    );
    assert.strictEqual(result.issues[0]!.severity, 'review');
    assert.ok(result.issues[0]!.message.includes('020604'));
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_CORE_NO_OPTIONAL);
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(result.value.fields.optionalContextContracts, []);
    assert.strictEqual(result.issues.length, 1);
    assert.ok(result.issues[0]!.message.includes('043607'));
    assert.ok(result.issues[0]!.message.includes('020604'));
    // Older week optional rows must not carry forward.
    assert.strictEqual(result.value.observationAsOf, '2026-07-07');
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_VALID_MULTI_WEEK, {
      referenceAsOf: '2026-06-30',
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-06-30');
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_VALID_MULTI_WEEK, {
      referenceAsOf: '2026-06-31',
    });
    assertFailCode(result, 'cftc_tff_treasury_normalize_invalid_reference_ceiling');
  }

  {
    const result = await normalizeJson(FIXTURE_TREASURY_VALID_MULTI_WEEK, {
      nowIso: '2026-07-06T20:00:00.000-10:00',
    });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.strictEqual(result.value.observationAsOf, '2026-07-07');
  }

  {
    assertFailCode(
      await normalizeJson(FIXTURE_TREASURY_FUTURE_REPORT),
      'cftc_tff_treasury_normalize_future_observation'
    );
  }

  {
    assertFailCode(
      await normalizeJson(FIXTURE_TREASURY_VALID_MULTI_WEEK, {
        referenceAsOf: '2026-01-01',
      }),
      'cftc_tff_treasury_normalize_no_eligible_report'
    );
  }

  {
    assertFailCode(
      await normalizeJson(FIXTURE_TREASURY_LATEST_INCOMPLETE_CORE),
      'cftc_tff_treasury_normalize_incomplete_latest_core'
    );
  }

  {
    assertFailCode(
      await normalizeJson(FIXTURE_TREASURY_MISMATCHED_CORE_WEEK),
      'cftc_tff_treasury_normalize_report_week_mismatch'
    );
  }

  {
    assertFailCode(
      await normalizeJson(FIXTURE_TREASURY_MISMATCHED_OPTIONAL_WEEK),
      'cftc_tff_treasury_normalize_report_week_mismatch'
    );
  }

  {
    const a = await normalizeJson(FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL);
    const b = await normalizeJson(FIXTURE_TREASURY_CORE_PLUS_BOTH_OPTIONAL);
    assert.strictEqual(a.ok && b.ok, true);
    if (!a.ok || !b.ok) throw new Error('unreachable');
    assert.deepStrictEqual(a.value, b.value);
    assert.deepStrictEqual(a.issues, b.issues);
    assert.strictEqual(a.value.provenance.adapterId, CFTC_TFF_TREASURY_ADAPTER_ID);
    assert.strictEqual(a.value.provenance.parserVersion, CFTC_TFF_TREASURY_PARSER_VERSION);
    assert.strictEqual(a.value.provenance.sourceLocator, queryUrl);
  }

  // --- Boundaries (70–76) ---

  {
    const adapterSource = readFileSync(
      path.join(
        process.cwd(),
        'lib/ghostflow/refresh/adapters/cftcTffTreasurySocrata.ts'
      ),
      'utf8'
    );
    assert.ok(!adapterSource.includes('cftcTffSystematicSocrata'));
    for (const banned of [
      'computeNet',
      'computeGross',
      'computeBasketMetricsFromRows',
      'classifyDirection',
      'validateTreasuryFuturesPositioningProxyArtifact',
      'loadTreasuryFuturesPositioningProxyArtifact',
      'treasuryFuturesPositioningProxy.v1.json',
    ]) {
      assert.ok(!adapterSource.includes(banned), `must not reference ${banned}`);
    }
  }

  console.log('ghostflow/cftcTffTreasurySocrataAdapter.test.ts: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
