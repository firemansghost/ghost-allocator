import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import {
  fixtureH15Normalized,
  fixtureSystematicNormalized,
  fixtureTreasuryNormalized,
} from '../fixtures/candidateMapperFixtures';
import type { GhostFlowCandidateMapper } from '@/lib/ghostflow/refresh/types';
import type { GhostFlowOperatorAdapter } from '@/lib/ghostflow/refresh/operatorRunner';

function loadProduction(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/ghostflow/artifacts', name), 'utf8')
  ) as unknown;
}

function nextCalendarDay(asOf: string): string {
  const date = new Date(`${asOf}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function fixtureH15NewerThanProduction(): ReturnType<typeof fixtureH15Normalized> {
  const current = loadProduction('treasuryLongEndIncomeLens.v1.json') as { asOf: string };
  const newerAsOf = nextCalendarDay(current.asOf);
  const normalized = fixtureH15Normalized();
  normalized.observationAsOf = newerAsOf;
  normalized.provenance.observationAsOf = newerAsOf;
  return normalized;
}

function fixtureSystematicNewerThanProduction(): ReturnType<typeof fixtureSystematicNormalized> {
  const current = loadProduction('systematicFlowProxy.v1.json') as { asOf: string };
  const newerAsOf = nextCalendarDay(current.asOf);
  const normalized = fixtureSystematicNormalized();
  normalized.observationAsOf = newerAsOf;
  normalized.provenance.observationAsOf = newerAsOf;
  for (const contract of normalized.fields.scoreContracts) {
    contract.observations.reportDate = newerAsOf;
  }
  normalized.fields.vixContext.observations.reportDate = newerAsOf;
  return normalized;
}

async function runSystematic(
  normalized: ReturnType<typeof fixtureSystematicNormalized>,
  mapper?: GhostFlowCandidateMapper<unknown, unknown>
) {
  return generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: normalized,
    mapper,
  });
}

const systematicMapperStub = (
  map: GhostFlowCandidateMapper<unknown, unknown>['map']
): GhostFlowCandidateMapper<unknown, unknown> => ({
  artifactId: 'systematicFlowProxy',
  map,
});

const STUB_SOURCE_METADATA = {
  sourceId: 'stub',
  sourceLocator: 'stub://local',
  retrievedAt: '2026-08-26T22:00:00.000Z',
  contentSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

function stubAdapter(failingStage: 'fetch' | 'parse' | 'normalize'): GhostFlowOperatorAdapter {
  return {
    id: 'stub-adapter',
    parserVersion: '0.0.0',
    fetch: async () => {
      if (failingStage === 'fetch') {
        return {
          ok: false,
          issues: [{ stage: 'fetch', code: 'stub_fetch_failed', severity: 'block', message: 'fetch failed' }],
        };
      }
      return {
        ok: true,
        value: { raw: {}, sourceMetadata: STUB_SOURCE_METADATA },
        issues: [],
      };
    },
    parse: () => {
      if (failingStage === 'parse') {
        return {
          ok: false,
          issues: [{ stage: 'parse', code: 'stub_parse_failed', severity: 'block', message: 'parse failed' }],
        };
      }
      return {
        ok: true,
        value: { parsed: {}, sourceMetadata: STUB_SOURCE_METADATA },
        issues: [],
      };
    },
    normalize: () => {
      if (failingStage === 'normalize') {
        return {
          ok: false,
          issues: [{ stage: 'normalize', code: 'stub_normalize_failed', severity: 'block', message: 'normalize failed' }],
        };
      }
      return { ok: true, value: fixtureSystematicNormalized(), issues: [] };
    },
  };
}

async function main(): Promise<void> {
  const newerNormalized = fixtureSystematicNewerThanProduction();
  const newer = await runSystematic(newerNormalized);
  assert.strictEqual(newer.ok, true);
  if (!newer.ok) throw new Error('unreachable');
  assert.strictEqual(newer.status, 'ready_for_review');
  assert.strictEqual(newer.exitCode, 0);
  assert.ok(newer.envelope);
  assert.strictEqual(
    newer.envelope!.normalizedObservation.provenance.adapterId,
    'cftc-tff-systematic-socrata'
  );

  const production = loadProduction('systematicFlowProxy.v1.json') as { asOf: string };
  const sameDateNormalized = fixtureSystematicNormalized();
  sameDateNormalized.observationAsOf = production.asOf;
  sameDateNormalized.provenance.observationAsOf = production.asOf;

  const sameDateSamePayload = await runSystematic(
    sameDateNormalized,
    systematicMapperStub(() => ({
      ok: true,
      value: production,
      issues: [],
    }))
  );
  assert.strictEqual(sameDateSamePayload.status, 'no_change');
  assert.strictEqual(sameDateSamePayload.exitCode, 2);
  assert.strictEqual(sameDateSamePayload.envelope, undefined);

  const sameDateChanged = await runSystematic(
    sameDateNormalized,
    systematicMapperStub(() => ({
      ok: true,
      value: { ...production, publishedAt: '2099-01-01' },
      issues: [],
    }))
  );
  assert.strictEqual(sameDateChanged.status, 'revision_review_required');
  assert.strictEqual(sameDateChanged.exitCode, 3);
  assert.ok(sameDateChanged.envelope);

  const olderNormalized = fixtureSystematicNormalized();
  olderNormalized.observationAsOf = '2020-01-01';
  olderNormalized.provenance.observationAsOf = '2020-01-01';
  for (const contract of olderNormalized.fields.scoreContracts) {
    contract.observations.reportDate = '2020-01-01';
  }
  olderNormalized.fields.vixContext.observations.reportDate = '2020-01-01';
  const older = await runSystematic(olderNormalized);
  assert.strictEqual(older.status, 'no_newer_observation');
  assert.strictEqual(older.exitCode, 2);

  const invalidCurrent = await generateGhostFlowCandidate({
    artifactId: 'treasuryFuturesPositioningProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: { bad: true },
    injectNormalized: fixtureTreasuryNormalized(),
  });
  assert.strictEqual(invalidCurrent.status, 'current_production_invalid');
  assert.strictEqual(invalidCurrent.exitCode, 5);

  const mapperFail = await generateGhostFlowCandidate({
    artifactId: 'treasuryLongEndIncomeLens',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadProduction('treasuryLongEndIncomeLens.v1.json'),
    injectNormalized: fixtureH15NewerThanProduction(),
    mapper: {
      artifactId: 'treasuryLongEndIncomeLens',
      map: () => ({
        ok: false,
        issues: [{ stage: 'validate', code: 'x', severity: 'block', message: 'fail' }],
      }),
    },
  });
  assert.strictEqual(mapperFail.status, 'mapper_failed');
  assert.strictEqual(mapperFail.exitCode, 5);

  const h15 = await generateGhostFlowCandidate({
    artifactId: 'treasuryLongEndIncomeLens',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadProduction('treasuryLongEndIncomeLens.v1.json'),
    injectNormalized: fixtureH15NewerThanProduction(),
  });
  assert.strictEqual(h15.ok, true);
  assert.strictEqual(h15.status, 'ready_for_review');
  assert.strictEqual(h15.exitCode, 0);
  assert.ok(h15.envelope);
  if (!h15.ok || !h15.envelope) throw new Error('unreachable');
  const proposed = h15.envelope.proposedArtifact as {
    seriesDefinition?: string;
    dataQuality?: string;
    observations?: { tenYearBreakevenInflationPct?: unknown };
  };
  assert.strictEqual(proposed.seriesDefinition, 'frb_h15_treasury_long_end_income_lens_v1');
  assert.strictEqual(proposed.dataQuality, 'verified_automated');
  assert.equal(proposed.observations?.tenYearBreakevenInflationPct, undefined);

  const invalidNow = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: 'not-a-timestamp',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.strictEqual(invalidNow.status, 'validation_failed');
  assert.strictEqual(invalidNow.exitCode, 5);
  assert.strictEqual(invalidNow.envelope, undefined);
  assert.ok(invalidNow.summary.issueCodes?.includes('candidate_invalid_now_iso'));

  const dateOnlyNow = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.strictEqual(dateOnlyNow.status, 'validation_failed');
  assert.strictEqual(dateOnlyNow.exitCode, 5);

  const timezoneLessNow = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.strictEqual(timezoneLessNow.status, 'validation_failed');
  assert.strictEqual(timezoneLessNow.exitCode, 5);

  const validZNow = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.notStrictEqual(validZNow.status, 'validation_failed');

  const validOffsetNow = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000-04:00',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.notStrictEqual(validOffsetNow.status, 'validation_failed');

  const invalidReference = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    referenceAsOf: '2026-13-40',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: fixtureSystematicNormalized(),
  });
  assert.strictEqual(invalidReference.status, 'validation_failed');
  assert.strictEqual(invalidReference.exitCode, 5);
  assert.ok(invalidReference.summary.issueCodes?.includes('candidate_invalid_reference_as_of'));

  for (const stage of ['fetch', 'parse', 'normalize'] as const) {
    const sourceFailed = await generateGhostFlowCandidate({
      artifactId: 'systematicFlowProxy',
      nowIso: '2026-08-26T22:00:00.000Z',
      currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
      adapter: stubAdapter(stage),
    });
    assert.strictEqual(sourceFailed.status, 'source_failed', stage);
    assert.strictEqual(sourceFailed.exitCode, 4, stage);
    assert.strictEqual(sourceFailed.envelope, undefined, stage);
  }

  console.log('ghostflow/candidates/generator.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
