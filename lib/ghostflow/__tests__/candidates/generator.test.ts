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

function loadProduction(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/ghostflow/artifacts', name), 'utf8')
  ) as unknown;
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

async function main(): Promise<void> {
  const newerNormalized = fixtureSystematicNormalized();
  newerNormalized.observationAsOf = '2026-08-18';
  newerNormalized.provenance.observationAsOf = '2026-08-18';
  for (const contract of newerNormalized.fields.scoreContracts) {
    contract.observations.reportDate = '2026-08-18';
  }
  newerNormalized.fields.vixContext.observations.reportDate = '2026-08-18';
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
    injectNormalized: fixtureH15Normalized(),
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
    injectNormalized: fixtureH15Normalized(),
  });
  assert.strictEqual(h15.ok, true);
  if (!h15.ok) throw new Error('unreachable');
  assert.strictEqual(
    (h15.envelope!.proposedArtifact as { seriesDefinition?: string }).seriesDefinition,
    'frb_h15_treasury_long_end_income_lens_v1'
  );

  console.log('ghostflow/candidates/generator.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
