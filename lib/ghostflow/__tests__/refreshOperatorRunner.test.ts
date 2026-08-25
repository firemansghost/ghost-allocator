/**
 * GhostFlow report-only operator runner — deterministic tests (no live network).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import systematicExample from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.example.json';
import treasuryFuturesProduction from '@/data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json';
import treasuryLongEndProduction from '@/data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json';
import { summarizeCurrentGhostFlowArtifact } from '../refresh/currentArtifactSummary';
import {
  DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP,
  GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS,
  resolveOperatorRequestedArtifactIds,
  runGhostFlowOperatorReport,
  type GhostFlowOperatorAdapter,
  type GhostFlowOperatorAdapterMap,
  type GhostFlowOperatorReportArtifactId,
} from '../refresh/operatorRunner';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../refresh/registry';
import type { GhostFlowCurrentArtifactSummary } from '../refresh/report';
import type {
  GhostFlowFetchedSource,
  GhostFlowNormalizedObservation,
  GhostFlowParsedSource,
  GhostFlowRefreshIssue,
  GhostFlowSourceAdapter,
  GhostFlowStageResult,
} from '../refresh/types';
import { FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE } from './fixtures/systematicFlowProxy';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';

const OPERATOR_NOW_ISO = '2026-08-25T16:00:00.000Z';
const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

function registryPath(artifactId: GhostFlowOperatorReportArtifactId): string {
  const entry = REGISTRY_BY_ID.get(artifactId);
  assert.ok(entry, `registry entry for ${artifactId}`);
  return entry!.artifactPath;
}

function currentSummary(
  artifactId: GhostFlowOperatorReportArtifactId,
  observationAsOf: string,
  sourcePublishedAt?: string
): GhostFlowCurrentArtifactSummary {
  return {
    artifactId,
    artifactPath: registryPath(artifactId),
    observationAsOf,
    sourcePublishedAt,
  };
}

function registryAdapterMeta(artifactId: GhostFlowOperatorReportArtifactId): {
  adapterId: string;
  parserVersion: string;
} {
  const entry = REGISTRY_BY_ID.get(artifactId);
  assert.ok(entry, `registry entry for ${artifactId}`);
  return {
    adapterId: entry!.adapter.adapterId,
    parserVersion: entry!.adapter.parserVersion ?? '0.0.0-test',
  };
}

function normalizedObservation(
  artifactId: GhostFlowOperatorReportArtifactId,
  observationAsOf: string,
  opts?: { sourcePublishedAt?: string }
): GhostFlowNormalizedObservation<{ marker: string }> {
  const meta = registryAdapterMeta(artifactId);
  return {
    artifactId,
    observationAsOf,
    fields: { marker: 'must-not-leak' },
    provenance: {
      sourceId: 'test-source',
      sourceLocator: 'https://example.test/source',
      retrievedAt: OPERATOR_NOW_ISO,
      contentSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      adapterId: meta.adapterId,
      parserVersion: meta.parserVersion,
      ...(opts?.sourcePublishedAt ? { sourcePublishedAt: opts.sourcePublishedAt } : {}),
    },
  };
}

type AdapterCallCounts = {
  fetch: number;
  parse: number;
  normalize: number;
};

function createFakeAdapter(
  artifactId: GhostFlowOperatorReportArtifactId,
  config: {
  observationAsOf?: string;
  sourcePublishedAt?: string;
  fetchResult?: GhostFlowStageResult<GhostFlowFetchedSource<unknown>>;
  parseResult?: GhostFlowStageResult<GhostFlowParsedSource<unknown>>;
  normalizeResult?: GhostFlowStageResult<GhostFlowNormalizedObservation<unknown>>;
  reviewIssue?: GhostFlowRefreshIssue;
  infoIssue?: GhostFlowRefreshIssue;
}): { adapter: GhostFlowOperatorAdapter; calls: AdapterCallCounts } {
  const calls: AdapterCallCounts = { fetch: 0, parse: 0, normalize: 0 };
  const meta = registryAdapterMeta(artifactId);

  const defaultFetched: GhostFlowFetchedSource<unknown> = {
    raw: { rows: [] },
    sourceMetadata: {
      sourceId: 'test',
      sourceLocator: 'https://example.test',
      retrievedAt: OPERATOR_NOW_ISO,
      contentSha256: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    },
  };

  const defaultParsed: GhostFlowParsedSource<unknown> = {
    parsed: { rows: [] },
    sourceMetadata: defaultFetched.sourceMetadata,
  };

  const adapter: GhostFlowSourceAdapter<unknown, unknown, unknown> = {
    id: meta.adapterId,
    parserVersion: meta.parserVersion,
    async fetch(_context) {
      calls.fetch += 1;
      if (config.fetchResult) return config.fetchResult;
      return { ok: true, value: defaultFetched, issues: [] };
    },
    parse(_source, _context) {
      calls.parse += 1;
      if (config.parseResult) return config.parseResult;
      return { ok: true, value: defaultParsed, issues: [] };
    },
    normalize(_source, _context) {
      calls.normalize += 1;
      if (config.normalizeResult) return config.normalizeResult;
      const issues: GhostFlowRefreshIssue[] = [];
      if (config.reviewIssue) issues.push(config.reviewIssue);
      if (config.infoIssue) issues.push(config.infoIssue);
      return {
        ok: true,
        value: normalizedObservation(
          artifactId,
          config.observationAsOf ?? '2026-08-01',
          { sourcePublishedAt: config.sourcePublishedAt }
        ),
        issues,
      };
    },
  };

  return { adapter, calls };
}

function fakeAdapterMap(
  overrides: Partial<GhostFlowOperatorAdapterMap>
): GhostFlowOperatorAdapterMap {
  const systematic = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-08-01' });
  const treasury = createFakeAdapter('treasuryFuturesPositioningProxy', {
    observationAsOf: '2026-08-01',
  });
  const longEnd = createFakeAdapter('treasuryLongEndIncomeLens', { observationAsOf: '2026-08-01' });
  return {
    systematicFlowProxy: overrides.systematicFlowProxy ?? systematic.adapter,
    treasuryFuturesPositioningProxy:
      overrides.treasuryFuturesPositioningProxy ?? treasury.adapter,
    treasuryLongEndIncomeLens:
      overrides.treasuryLongEndIncomeLens ?? longEnd.adapter,
  };
}

async function runWithSummaries(
  requested: GhostFlowOperatorReportArtifactId[],
  summaries: Partial<Record<GhostFlowOperatorReportArtifactId, GhostFlowCurrentArtifactSummary>>,
  adapters?: GhostFlowOperatorAdapterMap,
  referenceAsOf?: string
) {
  return runGhostFlowOperatorReport({
    nowIso: OPERATOR_NOW_ISO,
    requestedArtifactIds: requested,
    currentArtifactsById: {},
    currentSummariesById: summaries,
    adapters: adapters ?? fakeAdapterMap({}),
    referenceAsOf,
  });
}

// --- Allowlist (1–10) ---

assert.deepStrictEqual(GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS, [
  'systematicFlowProxy',
  'treasuryFuturesPositioningProxy',
  'treasuryLongEndIncomeLens',
]);

{
  const registryOrder = GHOSTFLOW_REFRESH_REGISTRY.map((e) => e.artifactId).filter(
    (id): id is GhostFlowOperatorReportArtifactId =>
      (GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS as readonly string[]).includes(id)
  );
  assert.deepStrictEqual([...GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS], registryOrder);
}

{
  const allowSet = new Set(GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS);
  assert.ok(!allowSet.has('volatilityRegime'));
  assert.ok(!allowSet.has('marketBreadth'));
}

for (const entry of GHOSTFLOW_REFRESH_REGISTRY) {
  if (entry.adapter.implementationStatus !== 'implemented') {
    assert.ok(!GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS.includes(entry.artifactId as never));
  }
  if (entry.adapter.implementationStatus === 'spike_available') {
    assert.ok(!GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS.includes(entry.artifactId as never));
  }
}

for (const artifactId of GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS) {
  const entry = REGISTRY_BY_ID.get(artifactId);
  assert.ok(entry);
  assert.strictEqual(entry!.adapter.implementationStatus, 'implemented');
  assert.strictEqual(entry!.automationReadiness, 'green');
  assert.strictEqual(entry!.approvalPolicy, 'human_required');
  assert.strictEqual(entry!.authentication.kind, 'none');
  assert.notStrictEqual(entry!.lane, 'score_fed_equity');
}

// --- Current artifact validation (11–16) ---

{
  const result = summarizeCurrentGhostFlowArtifact(
    'systematicFlowProxy',
    FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE,
    registryPath('systematicFlowProxy')
  );
  assert.ok(result.ok);
  assert.strictEqual(result.value.observationAsOf, FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE.asOf);
  assert.strictEqual(
    result.value.sourcePublishedAt,
    FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE.publishedAt
  );
}

{
  const result = summarizeCurrentGhostFlowArtifact(
    'treasuryFuturesPositioningProxy',
    treasuryFuturesProduction,
    registryPath('treasuryFuturesPositioningProxy')
  );
  assert.ok(result.ok);
  assert.ok(result.value.observationAsOf);
}

{
  const result = summarizeCurrentGhostFlowArtifact(
    'treasuryLongEndIncomeLens',
    treasuryLongEndProduction,
    registryPath('treasuryLongEndIncomeLens')
  );
  assert.ok(result.ok);
  assert.ok(result.value.observationAsOf);
}

{
  const result = summarizeCurrentGhostFlowArtifact(
    'systematicFlowProxy',
    { artifactVersion: 'broken' },
    registryPath('systematicFlowProxy')
  );
  assert.ok(!result.ok);
  assert.ok(result.issues.some((i) => i.code === 'operator_current_artifact_invalid'));
}

async function runAsyncOperatorRunnerTests(): Promise<void> {
{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const result = await runGhostFlowOperatorReport({
    nowIso: OPERATOR_NOW_ISO,
    requestedArtifactIds: ['systematicFlowProxy'],
    currentArtifactsById: { systematicFlowProxy: { broken: true } },
    adapters: {
      ...fakeAdapterMap({}),
      systematicFlowProxy: fake.adapter,
    },
  });
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'manual_input_required');
  assert.strictEqual(fake.calls.fetch, 0);
}

{
  const resolved = resolveOperatorRequestedArtifactIds(['volatilityRegime']);
  assert.ok(!resolved.ok);
  assert.ok(resolved.issues.some((i) => i.code === 'operator_artifact_not_allowlisted'));
}

// --- Adapter execution (17–26) ---

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-07-01' });
  await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.strictEqual(fake.calls.fetch, 1);
  assert.strictEqual(fake.calls.parse, 1);
  assert.strictEqual(fake.calls.normalize, 1);
}

{
  const fake = createFakeAdapter('systematicFlowProxy', {
    fetchResult: {
      ok: false,
      issues: [
        {
          stage: 'fetch',
          code: 'fetch_failed',
          severity: 'block',
          message: 'fetch failed',
        },
      ],
    },
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(fake.calls.parse, 0);
  assert.strictEqual(fake.calls.normalize, 0);
  assert.strictEqual(result.attempts[0]!.status, 'source_failed');
}

{
  const fake = createFakeAdapter('systematicFlowProxy', {
    parseResult: {
      ok: false,
      issues: [
        {
          stage: 'parse',
          code: 'parse_failed',
          severity: 'block',
          message: 'parse failed',
        },
      ],
    },
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(fake.calls.normalize, 0);
  assert.strictEqual(result.attempts[0]!.status, 'source_failed');
}

{
  const fake = createFakeAdapter('systematicFlowProxy', {
    normalizeResult: {
      ok: false,
      issues: [
        {
          stage: 'normalize',
          code: 'normalize_failed',
          severity: 'block',
          message: 'normalize failed',
        },
      ],
    },
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'source_failed');
}

{
  const reviewIssue: GhostFlowRefreshIssue = {
    stage: 'normalize',
    code: 'adapter_review_note',
    severity: 'review',
    message: 'review survives',
  };
  const infoIssue: GhostFlowRefreshIssue = {
    stage: 'normalize',
    code: 'adapter_info_note',
    severity: 'info',
    message: 'info survives',
  };
  const fake = createFakeAdapter('systematicFlowProxy', {
    observationAsOf: '2026-08-01',
    reviewIssue,
    infoIssue,
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'no_newer_observation');
  assert.ok(result.attempts[0]!.issues.some((i) => i.code === 'adapter_review_note'));
  assert.ok(result.attempts[0]!.issues.some((i) => i.code === 'adapter_info_note'));
}

// --- Comparison (27–34) ---

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'candidate_observation_available');
  assert.strictEqual(result.attempts[0]!.candidate?.observationAsOf, '2026-09-01');
}

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-08-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'no_newer_observation');
  assert.strictEqual(result.attempts[0]!.candidate, undefined);
}

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-07-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.status, 'no_newer_observation');
  assert.strictEqual(result.attempts[0]!.candidate, undefined);
  assert.ok(
    result.attempts[0]!.issues.some(
      (i) => i.code === 'operator_source_observation_older_than_current'
    )
  );
}

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  const candidate = result.ok ? result.attempts[0]!.candidate : undefined;
  assert.ok(candidate);
  assert.strictEqual(
    candidate!.adapterId,
    registryAdapterMeta('systematicFlowProxy').adapterId
  );
  assert.strictEqual(
    candidate!.parserVersion,
    registryAdapterMeta('systematicFlowProxy').parserVersion
  );
  assert.strictEqual(candidate!.retrievedAt, OPERATOR_NOW_ISO);
  assert.strictEqual(candidate!.contentSha256.length, 64);
  assert.strictEqual(candidate!.sourcePublishedAt, undefined);
}

{
  const fake = createFakeAdapter('systematicFlowProxy', {
    observationAsOf: '2026-09-01',
    sourcePublishedAt: '2026-09-02',
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.attempts[0]!.candidate?.sourcePublishedAt, '2026-09-02');
}

// --- Reference ceiling (35–38) ---

{
  let seenReference: string | undefined = 'unset';
  const baseFake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-08-01' });
  const adapter: GhostFlowOperatorAdapter = {
    id: baseFake.adapter.id,
    parserVersion: baseFake.adapter.parserVersion,
    async fetch(context) {
      seenReference = context.referenceAsOf;
      return baseFake.adapter.fetch(context);
    },
    parse: baseFake.adapter.parse,
    normalize: baseFake.adapter.normalize,
  };
  await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: adapter })
  );
  assert.strictEqual(seenReference, undefined);
}

{
  let seenReference: string | undefined;
  const baseFake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-08-01' });
  const adapter: GhostFlowOperatorAdapter = {
    id: baseFake.adapter.id,
    parserVersion: baseFake.adapter.parserVersion,
    async fetch(context) {
      seenReference = context.referenceAsOf;
      return baseFake.adapter.fetch(context);
    },
    parse: baseFake.adapter.parse,
    normalize: baseFake.adapter.normalize,
  };
  await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: adapter }),
    '2026-08-20'
  );
  assert.strictEqual(seenReference, '2026-08-20');
}

{
  assert.strictEqual(GHOSTFLOW_REFERENCE_AS_OF, '2026-07-01');
}

{
  const result = await runGhostFlowOperatorReport({
    nowIso: OPERATOR_NOW_ISO,
    requestedArtifactIds: ['systematicFlowProxy'],
    currentArtifactsById: { systematicFlowProxy: systematicExample },
    referenceAsOf: 'not-a-date',
  });
  assert.ok(!result.ok);
  assert.ok(result.issues.some((i) => i.code === 'operator_invalid_reference_as_of'));
}

// --- Multi-artifact (39–47) ---

{
  const result = await runWithSummaries(
    GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS as unknown as GhostFlowOperatorReportArtifactId[],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
      treasuryLongEndIncomeLens: currentSummary('treasuryLongEndIncomeLens', '2026-08-01'),
    },
    fakeAdapterMap({})
  );
  assert.ok(result.ok);
  assert.deepStrictEqual(result.report.requestedArtifactIds, GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS);
}

{
  const result = await runWithSummaries(
    ['treasuryLongEndIncomeLens'],
    { treasuryLongEndIncomeLens: currentSummary('treasuryLongEndIncomeLens', '2026-08-01') }
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.requestedArtifactIds.length, 1);
}

{
  const result = await runWithSummaries(
    ['systematicFlowProxy', 'treasuryFuturesPositioningProxy'],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
    }
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.requestedArtifactIds.length, 2);
}

{
  const resolved = resolveOperatorRequestedArtifactIds([
    'systematicFlowProxy',
    'systematicFlowProxy',
  ]);
  assert.ok(resolved.ok);
  assert.deepStrictEqual(resolved.value, ['systematicFlowProxy']);
}

{
  const resolved = resolveOperatorRequestedArtifactIds(['etfNetIssuance']);
  assert.ok(!resolved.ok);
}

{
  const newer = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const same = createFakeAdapter('treasuryFuturesPositioningProxy', { observationAsOf: '2026-08-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy', 'treasuryFuturesPositioningProxy'],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
    },
    fakeAdapterMap({
      systematicFlowProxy: newer.adapter,
      treasuryFuturesPositioningProxy: same.adapter,
    })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.overallStatus, 'ready_for_review');
}

{
  const newer = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const failed = createFakeAdapter('treasuryFuturesPositioningProxy', {
    fetchResult: {
      ok: false,
      issues: [
        { stage: 'fetch', code: 'fetch_failed', severity: 'block', message: 'fail' },
      ],
    },
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy', 'treasuryFuturesPositioningProxy'],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
    },
    fakeAdapterMap({
      systematicFlowProxy: newer.adapter,
      treasuryFuturesPositioningProxy: failed.adapter,
    })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.overallStatus, 'partial_with_blocks');
}

{
  const same = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-08-01' });
  const result = await runWithSummaries(
    GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS as unknown as GhostFlowOperatorReportArtifactId[],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
      treasuryLongEndIncomeLens: currentSummary('treasuryLongEndIncomeLens', '2026-08-01'),
    },
    fakeAdapterMap({
      systematicFlowProxy: same.adapter,
      treasuryFuturesPositioningProxy: createFakeAdapter('treasuryFuturesPositioningProxy', {
        observationAsOf: '2026-08-01',
      }).adapter,
      treasuryLongEndIncomeLens: createFakeAdapter('treasuryLongEndIncomeLens', {
        observationAsOf: '2026-08-01',
      }).adapter,
    })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.overallStatus, 'no_changes');
}

{
  const failed = createFakeAdapter('systematicFlowProxy', {
    fetchResult: {
      ok: false,
      issues: [
        { stage: 'fetch', code: 'fetch_failed', severity: 'block', message: 'fail' },
      ],
    },
  });
  const result = await runWithSummaries(
    GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS as unknown as GhostFlowOperatorReportArtifactId[],
    {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
      treasuryFuturesPositioningProxy: currentSummary(
        'treasuryFuturesPositioningProxy',
        '2026-08-01'
      ),
      treasuryLongEndIncomeLens: currentSummary('treasuryLongEndIncomeLens', '2026-08-01'),
    },
    fakeAdapterMap({
      systematicFlowProxy: failed.adapter,
      treasuryFuturesPositioningProxy: createFakeAdapter('treasuryFuturesPositioningProxy', {
        fetchResult: {
          ok: false,
          issues: [
            { stage: 'fetch', code: 'fetch_failed', severity: 'block', message: 'fail' },
          ],
        },
      }).adapter,
      treasuryLongEndIncomeLens: createFakeAdapter('treasuryLongEndIncomeLens', {
        fetchResult: {
          ok: false,
          issues: [
            { stage: 'fetch', code: 'fetch_failed', severity: 'block', message: 'fail' },
          ],
        },
      }).adapter,
    })
  );
  assert.ok(result.ok);
  assert.strictEqual(result.report.overallStatus, 'blocked');
}

// --- Security / scope (48–57) ---

{
  const fake = createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  const serialized = JSON.stringify(result.report);
  assert.ok(!serialized.includes('"fields"'));
  assert.ok(!serialized.includes('must-not-leak'));
  assert.ok(!serialized.includes('nominalYield30Y'));
  assert.ok(!serialized.includes('leveragedFundsLong'));
  assert.ok(!serialized.includes('basketNetPctOi'));
  assert.ok(!serialized.includes('compositeScore'));
}

{
  const runnerSource = readFileSync(
    join(process.cwd(), 'lib/ghostflow/refresh/operatorRunner.ts'),
    'utf8'
  );
  const cliSource = readFileSync(
    join(process.cwd(), 'scripts/ghostflow/refresh-report.ts'),
    'utf8'
  );
  for (const source of [runnerSource, cliSource]) {
    assert.ok(!source.includes('.github/workflows'));
    assert.ok(!source.includes('buildSnapshot'));
    assert.ok(!source.includes('mockGhostflowSnapshot'));
    assert.ok(!source.includes('cboeVixHistory'));
    assert.ok(!source.includes('marketBreadth'));
    assert.ok(!source.includes('createPullRequest'));
    assert.ok(!source.includes('writeFileSync'));
  }
}

assert.ok(DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP.systematicFlowProxy);
assert.ok(DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP.treasuryFuturesPositioningProxy);
assert.ok(DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP.treasuryLongEndIncomeLens);

// --- Determinism (58–60) ---

{
  const adapters = fakeAdapterMap({
    systematicFlowProxy: createFakeAdapter('systematicFlowProxy', { observationAsOf: '2026-09-01' }).adapter,
  });
  const input = {
    nowIso: OPERATOR_NOW_ISO,
    requestedArtifactIds: ['systematicFlowProxy'] as const,
    currentArtifactsById: {},
    currentSummariesById: {
      systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01'),
    },
    adapters,
  };
  const a = await runGhostFlowOperatorReport(input);
  const b = await runGhostFlowOperatorReport(input);
  assert.ok(a.ok && b.ok);
  assert.deepStrictEqual(a.report, b.report);
}

{
  const resolvedDefault = resolveOperatorRequestedArtifactIds(undefined);
  assert.ok(resolvedDefault.ok);
  assert.deepStrictEqual(resolvedDefault.value, GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS);
}

{
  const fake = createFakeAdapter('systematicFlowProxy', {
    observationAsOf: '2026-07-01',
    infoIssue: {
      stage: 'normalize',
      code: 'adapter_info_note',
      severity: 'info',
      message: 'info survives',
    },
  });
  const result = await runWithSummaries(
    ['systematicFlowProxy'],
    { systematicFlowProxy: currentSummary('systematicFlowProxy', '2026-08-01') },
    fakeAdapterMap({ systematicFlowProxy: fake.adapter })
  );
  assert.ok(result.ok);
  const codes = result.attempts[0]!.issues.map((i) => i.code);
  assert.deepStrictEqual(codes, [
    'adapter_info_note',
    'operator_source_observation_older_than_current',
  ]);
}

}

runAsyncOperatorRunnerTests()
  .then(() => {
    console.log('refreshOperatorRunner.test.ts: all tests passed');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
