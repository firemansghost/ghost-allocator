/**
 * CBOE VIX History CSV adapter — fixture-driven tests (no live network).
 */

import assert from 'assert';
import { createHash } from 'crypto';
import {
  CBOE_VIX_HISTORY_CSV_ADAPTER,
  createCboeVixHistoryCsvAdapter,
  type CboeVixFetchClient,
  type CboeVixFetchResponse,
} from '../refresh/adapters/cboeVixHistoryCsv';
import {
  CBOE_VIX_ADAPTER_ID,
  CBOE_VIX_ARTIFACT_ID,
  CBOE_VIX_PARSER_VERSION,
  CBOE_VIX_SOURCE_FAMILY_ID,
  CBOE_VIX_SOURCE_LOCATOR,
  CBOE_VIX_SOURCE_NAME,
} from '../refresh/adapters/cboeVixHistoryCsvMeta';
import {
  GATE_C_ARTIFACT_IDS,
  GATE_C_CANDIDATE_GROUP_ID,
  GHOSTFLOW_REFRESH_REGISTRY,
} from '../refresh/registry';
import type { GhostFlowFetchedSource } from '../refresh/types';
import {
  ADAPTER_TEST_NOW_ISO,
  FIXTURE_VIX_BAD_ROW_WIDTH,
  FIXTURE_VIX_DUPLICATE_DATE_HEADER,
  FIXTURE_VIX_DUPLICATE_OBSERVATION,
  FIXTURE_VIX_EMPTY_CLOSE,
  FIXTURE_VIX_HEADER_ONLY,
  FIXTURE_VIX_INVALID_CALENDAR_DATE,
  FIXTURE_VIX_MISSING_CLOSE,
  FIXTURE_VIX_MISSING_DATE,
  FIXTURE_VIX_NEGATIVE_CLOSE,
  FIXTURE_VIX_NONNUMERIC_CLOSE,
  FIXTURE_VIX_UNSORTED,
  FIXTURE_VIX_VALID_BOM,
  FIXTURE_VIX_VALID_CRLF,
  FIXTURE_VIX_VALID_LF,
  FIXTURE_VIX_WHITESPACE,
  FIXTURE_VIX_WITH_FUTURE,
  FIXTURE_VIX_ZERO_CLOSE,
} from './fixtures/cboeVixHistoryCsvFixtures';

function textResponse(text: string, opts?: Partial<CboeVixFetchResponse>): CboeVixFetchResponse {
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

function trackingClient(
  response: CboeVixFetchResponse | (() => Promise<CboeVixFetchResponse>)
): { client: CboeVixFetchClient; urls: string[] } {
  const urls: string[] = [];
  const client: CboeVixFetchClient = async (url) => {
    urls.push(url);
    return typeof response === 'function' ? response() : response;
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

const vixEntry = GHOSTFLOW_REFRESH_REGISTRY.find((e) => e.artifactId === 'volatilityRegime')!;

// --- Metadata and registry (1–5) ---

assert.strictEqual(CBOE_VIX_HISTORY_CSV_ADAPTER.id, CBOE_VIX_ADAPTER_ID);
assert.strictEqual(CBOE_VIX_HISTORY_CSV_ADAPTER.parserVersion, CBOE_VIX_PARSER_VERSION);
assert.strictEqual(vixEntry.adapter.adapterId, CBOE_VIX_ADAPTER_ID);
assert.strictEqual(vixEntry.adapter.implementationStatus, 'implemented');
if (vixEntry.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(vixEntry.adapter.parserVersion, CBOE_VIX_PARSER_VERSION);
}
assert.strictEqual(vixEntry.canonicalSource.sourceFamilyId, CBOE_VIX_SOURCE_FAMILY_ID);
assert.strictEqual(vixEntry.canonicalSource.sourceName, CBOE_VIX_SOURCE_NAME);
assert.strictEqual(vixEntry.canonicalSource.sourceLocator, CBOE_VIX_SOURCE_LOCATOR);
assert.strictEqual(CBOE_VIX_ARTIFACT_ID, 'volatilityRegime');
assert.ok(GATE_C_ARTIFACT_IDS.includes('volatilityRegime'));
assert.strictEqual(vixEntry.candidateGroupId, GATE_C_CANDIDATE_GROUP_ID);
assert.strictEqual(vixEntry.acceptanceUnit, 'candidate_group');

async function fetched(
  text: string
): Promise<GhostFlowFetchedSource<string>> {
  const { client } = trackingClient(textResponse(text));
  const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
  const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
  assert.strictEqual(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  return result.value;
}

(async () => {
  // --- Fetch stage (6–15) ---

  {
    const { client, urls } = trackingClient(textResponse(FIXTURE_VIX_VALID_LF));
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    const result = await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(result.ok, true);
    if (!result.ok) throw new Error('unreachable');
    assert.deepStrictEqual(urls, [CBOE_VIX_SOURCE_LOCATOR]);
    assert.strictEqual(result.value.raw, FIXTURE_VIX_VALID_LF);
    const expectedHash = createHash('sha256')
      .update(new TextEncoder().encode(FIXTURE_VIX_VALID_LF))
      .digest('hex');
    assert.strictEqual(result.value.sourceMetadata.contentSha256, expectedHash);
    assert.strictEqual(result.value.sourceMetadata.retrievedAt, ADAPTER_TEST_NOW_ISO);
    assert.strictEqual(result.value.sourceMetadata.contentType, 'text/csv');
    assert.strictEqual(result.value.sourceMetadata.sourceId, CBOE_VIX_SOURCE_FAMILY_ID);
    assert.strictEqual(result.value.sourceMetadata.sourceLocator, CBOE_VIX_SOURCE_LOCATOR);
  }

  {
    const { client } = trackingClient({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      bytes: new TextEncoder().encode('unavailable'),
    });
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'vix_fetch_http_error');
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      bytes: new Uint8Array(),
    });
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'vix_fetch_empty_body');
  }

  {
    const { client } = trackingClient({
      ok: true,
      status: 200,
      bytes: new Uint8Array([0xff, 0xfe, 0xfd]),
    });
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'vix_fetch_invalid_utf8');
  }

  {
    const { client } = trackingClient(async () => {
      throw new Error('network down');
    });
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: ADAPTER_TEST_NOW_ISO }), 'vix_fetch_exception');
  }

  {
    const { client } = trackingClient(textResponse(FIXTURE_VIX_VALID_LF));
    const adapter = createCboeVixHistoryCsvAdapter({ fetchClient: client });
    assertFailCode(await adapter.fetch({ nowIso: 'not-a-timestamp' }), 'vix_fetch_invalid_now');
  }

  // --- Parse stage (16–32) ---

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const source = await fetched(FIXTURE_VIX_VALID_LF);
    const originalMeta = { ...source.sourceMetadata };
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assert.strictEqual(parsed.value.parsed.length, 3);
    assert.deepStrictEqual(
      parsed.value.parsed.map((r) => r.observationAsOf),
      ['2026-07-01', '2026-07-02', '2026-07-03']
    );
    assert.strictEqual(parsed.value.parsed[1]!.close, 16.59);
    assert.deepStrictEqual(parsed.value.sourceMetadata, originalMeta);
    assert.deepStrictEqual(source.sourceMetadata, originalMeta);
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse('')).client,
    });
    for (const text of [
      FIXTURE_VIX_VALID_BOM,
      FIXTURE_VIX_VALID_CRLF,
      FIXTURE_VIX_WHITESPACE,
    ]) {
      const parsed = adapter.parse(await fetched(text), { nowIso: ADAPTER_TEST_NOW_ISO });
      assert.strictEqual(parsed.ok, true, `expected ok for fixture`);
      if (!parsed.ok) throw new Error('unreachable');
      assert.ok(parsed.value.parsed.length >= 2);
    }
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse('')).client,
    });
    const cases: Array<[string, string]> = [
      [FIXTURE_VIX_MISSING_DATE, 'vix_csv_missing_required_header'],
      [FIXTURE_VIX_MISSING_CLOSE, 'vix_csv_missing_required_header'],
      [FIXTURE_VIX_DUPLICATE_DATE_HEADER, 'vix_csv_duplicate_header'],
      [FIXTURE_VIX_BAD_ROW_WIDTH, 'vix_csv_column_count_mismatch'],
      [FIXTURE_VIX_INVALID_CALENDAR_DATE, 'vix_csv_invalid_date'],
      [FIXTURE_VIX_EMPTY_CLOSE, 'vix_csv_invalid_close'],
      [FIXTURE_VIX_NONNUMERIC_CLOSE, 'vix_csv_invalid_close'],
      [FIXTURE_VIX_ZERO_CLOSE, 'vix_csv_invalid_close'],
      [FIXTURE_VIX_NEGATIVE_CLOSE, 'vix_csv_invalid_close'],
      [FIXTURE_VIX_DUPLICATE_OBSERVATION, 'vix_csv_duplicate_date'],
      [FIXTURE_VIX_HEADER_ONLY, 'vix_csv_empty'],
    ];
    for (const [text, code] of cases) {
      const parsed = adapter.parse(await fetched(text), { nowIso: ADAPTER_TEST_NOW_ISO });
      assertFailCode(parsed, code);
    }
  }

  // --- Normalize stage (33–43) ---

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_UNSORTED)).client,
    });
    const source = await fetched(FIXTURE_VIX_UNSORTED);
    const parsed = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const normalized = adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(normalized.ok, true);
    if (!normalized.ok) throw new Error('unreachable');
    assert.strictEqual(normalized.value.observationAsOf, '2026-07-03');
    assert.strictEqual(normalized.value.fields.vixClose, 16.8);
    assert.deepStrictEqual(Object.keys(normalized.value.fields), ['vixClose']);
    assert.strictEqual(normalized.value.artifactId, 'volatilityRegime');
    assert.strictEqual(normalized.value.provenance.adapterId, CBOE_VIX_ADAPTER_ID);
    assert.strictEqual(normalized.value.provenance.parserVersion, CBOE_VIX_PARSER_VERSION);
    assert.strictEqual(normalized.value.provenance.sourceId, CBOE_VIX_SOURCE_FAMILY_ID);
    assert.strictEqual(normalized.value.provenance.sourceLocator, CBOE_VIX_SOURCE_LOCATOR);
    assert.strictEqual(normalized.value.provenance.retrievedAt, ADAPTER_TEST_NOW_ISO);
    assert.strictEqual(normalized.value.provenance.observationAsOf, '2026-07-03');
    assert.ok(normalized.value.provenance.contentSha256.length === 64);
    assert.ok(!('sourcePublishedAt' in normalized.value.provenance));
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const parsed = adapter.parse(await fetched(FIXTURE_VIX_VALID_LF), {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const capped = adapter.normalize(parsed.value, {
      nowIso: ADAPTER_TEST_NOW_ISO,
      referenceAsOf: '2026-07-02',
    });
    assert.strictEqual(capped.ok, true);
    if (!capped.ok) throw new Error('unreachable');
    assert.strictEqual(capped.value.observationAsOf, '2026-07-02');
    assert.strictEqual(capped.value.fields.vixClose, 16.59);
  }

  // UTC date ceiling must come from the represented instant, not the timestamp prefix.
  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const parsed = adapter.parse(await fetched(FIXTURE_VIX_VALID_LF), {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');

    // 2026-07-02T23:30:00-05:00 → UTC 2026-07-03 → select 2026-07-03
    const negativeOffset = adapter.normalize(parsed.value, {
      nowIso: '2026-07-02T23:30:00-05:00',
    });
    assert.strictEqual(negativeOffset.ok, true);
    if (!negativeOffset.ok) throw new Error('unreachable');
    assert.strictEqual(negativeOffset.value.observationAsOf, '2026-07-03');
    assert.strictEqual(negativeOffset.value.fields.vixClose, 16.8);

    // 2026-07-03T00:30:00+05:00 → UTC 2026-07-02 → select 2026-07-02
    const positiveOffset = adapter.normalize(parsed.value, {
      nowIso: '2026-07-03T00:30:00+05:00',
    });
    assert.strictEqual(positiveOffset.ok, true);
    if (!positiveOffset.ok) throw new Error('unreachable');
    assert.strictEqual(positiveOffset.value.observationAsOf, '2026-07-02');
    assert.strictEqual(positiveOffset.value.fields.vixClose, 16.59);

    // Explicit earlier referenceAsOf still wins over UTC date from nowIso
    const referenceWins = adapter.normalize(parsed.value, {
      nowIso: '2026-07-02T23:30:00-05:00',
      referenceAsOf: '2026-07-02',
    });
    assert.strictEqual(referenceWins.ok, true);
    if (!referenceWins.ok) throw new Error('unreachable');
    assert.strictEqual(referenceWins.value.observationAsOf, '2026-07-02');
    assert.strictEqual(referenceWins.value.fields.vixClose, 16.59);
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const parsed = adapter.parse(await fetched(FIXTURE_VIX_VALID_LF), {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    assertFailCode(
      adapter.normalize(parsed.value, {
        nowIso: ADAPTER_TEST_NOW_ISO,
        referenceAsOf: '2026-02-31',
      }),
      'vix_normalize_invalid_reference_ceiling'
    );
    assertFailCode(
      adapter.normalize(parsed.value, {
        nowIso: ADAPTER_TEST_NOW_ISO,
        referenceAsOf: '2026-06-01',
      }),
      'vix_normalize_no_eligible_observation'
    );
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_WITH_FUTURE)).client,
    });
    const parsed = adapter.parse(await fetched(FIXTURE_VIX_WITH_FUTURE), {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    // Rows after UTC nowDate are excluded; mixed history still normalizes.
    const mixed = adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(mixed.ok, true);
    if (!mixed.ok) throw new Error('unreachable');
    assert.strictEqual(mixed.value.observationAsOf, '2026-07-09');
    assert.strictEqual(mixed.value.fields.vixClose, 16.59);

    // All observations after UTC nowDate still fail closed.
    assertFailCode(
      adapter.normalize(parsed.value, { nowIso: '2026-06-01T12:00:00.000Z' }),
      'vix_normalize_future_observation'
    );
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const source = await fetched(FIXTURE_VIX_VALID_LF);
    const a = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    const b = adapter.parse(source, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
    if (!a.ok || !b.ok) throw new Error('unreachable');
    const na = adapter.normalize(a.value, { nowIso: ADAPTER_TEST_NOW_ISO });
    const nb = adapter.normalize(b.value, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.deepStrictEqual(na, nb);
  }

  {
    const adapter = createCboeVixHistoryCsvAdapter({
      fetchClient: trackingClient(textResponse(FIXTURE_VIX_VALID_LF)).client,
    });
    const parsed = adapter.parse(await fetched(FIXTURE_VIX_VALID_LF), {
      nowIso: ADAPTER_TEST_NOW_ISO,
    });
    assert.strictEqual(parsed.ok, true);
    if (!parsed.ok) throw new Error('unreachable');
    const normalized = adapter.normalize(parsed.value, { nowIso: ADAPTER_TEST_NOW_ISO });
    assert.strictEqual(normalized.ok, true);
    if (!normalized.ok) throw new Error('unreachable');
    const serialized = JSON.stringify(normalized.value).toLowerCase();
    for (const forbidden of [
      'date,open,high,low,close',
      'localpath',
      'tmppath',
      'apikey',
      'token',
      'cookie',
      'numericvalue',
      'elevated flow pressure',
      'optionsvolatilityamplifier',
      'artifactversion',
    ]) {
      assert.ok(!serialized.includes(forbidden), `must not contain ${forbidden}`);
    }
  }

  console.log('ghostflow/cboeVixHistoryCsvAdapter.test.ts: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
