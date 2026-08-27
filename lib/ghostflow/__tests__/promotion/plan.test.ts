import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import {
  buildGhostFlowPromotionPlan,
  dryRunGhostFlowCandidatePromotion,
} from '@/lib/ghostflow/refresh/promotion/plan';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import type { GhostFlowCandidateMapper } from '@/lib/ghostflow/refresh/types';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';
import { sha256HexFromCanonicalJson } from '@/lib/ghostflow/refresh/candidates/canonicalJson';

function loadTrackedProduction(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/ghostflow/artifacts', name), 'utf8')
  ) as unknown;
}

function nextCalendarDay(asOf: string): string {
  const date = new Date(`${asOf}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function buildReadySystematicEnvelope(): Promise<GhostFlowCandidateEnvelope> {
  const production = loadTrackedProduction('systematicFlowProxy.v1.json') as { asOf: string };
  const newerAsOf = nextCalendarDay(production.asOf);
  const normalized = fixtureSystematicNormalized();
  normalized.observationAsOf = newerAsOf;
  normalized.provenance.observationAsOf = newerAsOf;
  for (const contract of normalized.fields.scoreContracts) {
    contract.observations.reportDate = newerAsOf;
  }
  normalized.fields.vixContext.observations.reportDate = newerAsOf;

  const generated = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: production,
    injectNormalized: normalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');
  assert.strictEqual(generated.status, 'ready_for_review');
  assert.strictEqual(generated.exitCode, 0);
  return generated.envelope;
}

async function writeTempRepo(
  root: string,
  productionRaw: unknown
): Promise<{ envelopePath: string; productionPath: string }> {
  const relative = 'data/ghostflow/artifacts/systematicFlowProxy.v1.json';
  const productionPath = join(root, relative);
  await mkdir(join(root, 'data', 'ghostflow', 'artifacts'), { recursive: true });
  await mkdir(join(root, 'tmp', 'ghostflow', 'candidates'), { recursive: true });
  await writeFile(productionPath, `${JSON.stringify(productionRaw, null, 2)}\n`, 'utf8');

  const envelope = await buildReadySystematicEnvelope();
  const envelopeWithPath: GhostFlowCandidateEnvelope = {
    ...envelope,
    currentProduction: {
      ...envelope.currentProduction,
      artifactPath: relative,
    },
  };
  // Re-fingerprint current production against temp copy (same semantic content as tracked).
  const hash = sha256HexFromCanonicalJson(productionRaw);
  assert.ok(hash.ok);
  if (!hash.ok) throw new Error('unreachable');

  // Envelope was built against tracked production; ensure fingerprint still matches temp bytes.
  assert.strictEqual(
    envelopeWithPath.currentProduction.promotionPayloadSha256,
    hash.value
  );

  const envelopePath = join(
    root,
    'tmp',
    'ghostflow',
    'candidates',
    `${envelope.artifactId}.${envelope.normalizedObservation.observationAsOf}.${envelope.candidateIdentity.identityPrefix}.candidate.json`
  );
  await writeFile(envelopePath, `${JSON.stringify(envelopeWithPath, null, 2)}\n`, 'utf8');
  return { envelopePath, productionPath };
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const production = loadTrackedProduction('systematicFlowProxy.v1.json');
  const envelope = await buildReadySystematicEnvelope();

  const okPlan = await buildGhostFlowPromotionPlan({
    repoRoot,
    envelope,
    currentProductionRaw: production,
  });
  assert.strictEqual(okPlan.ok, true);
  if (!okPlan.ok) throw new Error('unreachable');
  assert.strictEqual(okPlan.plan.destinationRelativePath, envelope.currentProduction.artifactPath);
  assert.strictEqual(
    okPlan.plan.proposedPromotionPayloadSha256,
    envelope.candidateIdentity.promotionPayloadSha256
  );

  const mismatchedMapper: GhostFlowCandidateMapper<unknown, unknown> = {
    artifactId: 'systematicFlowProxy',
    map: () => ({
      ok: true,
      value: {
        ...(envelope.proposedArtifact as object),
        publishedAt: '2099-01-01',
      },
      issues: [],
    }),
  };
  const mapperMismatch = await buildGhostFlowPromotionPlan({
    repoRoot,
    envelope,
    mapper: mismatchedMapper,
    currentProductionRaw: production,
  });
  assert.strictEqual(mapperMismatch.ok, false);
  if (!mapperMismatch.ok) {
    assert.strictEqual(mapperMismatch.status, 'promotion_mapper_replay_mismatch');
    assert.strictEqual(mapperMismatch.exitCode, 4);
  }

  const realMapper = (
    await import('@/lib/ghostflow/refresh/candidateMappers/systematicFlowProxy')
  ).systematicFlowProxyCandidateMapper;

  const provenanceFailMapper: GhostFlowCandidateMapper<unknown, unknown> = {
    artifactId: 'systematicFlowProxy',
    map: (input) =>
      realMapper.map({
        ...input,
        normalized: {
          ...input.normalized,
          provenance: {
            ...input.normalized.provenance,
            adapterId: 'stale-adapter',
          },
        },
      } as never),
  };
  const staleAdapterReplay = await buildGhostFlowPromotionPlan({
    repoRoot,
    envelope,
    mapper: provenanceFailMapper,
    currentProductionRaw: production,
  });
  assert.strictEqual(staleAdapterReplay.ok, false);
  if (!staleAdapterReplay.ok) {
    assert.strictEqual(staleAdapterReplay.exitCode, 4);
  }

  const staleParserMapper: GhostFlowCandidateMapper<unknown, unknown> = {
    artifactId: 'systematicFlowProxy',
    map: (input) =>
      realMapper.map({
        ...input,
        normalized: {
          ...input.normalized,
          provenance: {
            ...input.normalized.provenance,
            parserVersion: '0.0.0-stale',
          },
        },
      } as never),
  };
  const staleParserReplay = await buildGhostFlowPromotionPlan({
    repoRoot,
    envelope,
    mapper: staleParserMapper,
    currentProductionRaw: production,
  });
  assert.strictEqual(staleParserReplay.ok, false);
  if (!staleParserReplay.ok) {
    assert.strictEqual(staleParserReplay.exitCode, 4);
  }

  const staleLocatorMapper: GhostFlowCandidateMapper<unknown, unknown> = {
    artifactId: 'systematicFlowProxy',
    map: (input) =>
      realMapper.map({
        ...input,
        normalized: {
          ...input.normalized,
          provenance: {
            ...input.normalized.provenance,
            sourceLocator: 'https://example.invalid/stale',
          },
        },
      } as never),
  };
  const staleLocatorReplay = await buildGhostFlowPromotionPlan({
    repoRoot,
    envelope,
    mapper: staleLocatorMapper,
    currentProductionRaw: production,
  });
  assert.strictEqual(staleLocatorReplay.ok, false);
  if (!staleLocatorReplay.ok) {
    assert.strictEqual(staleLocatorReplay.exitCode, 4);
  }

  // Temp-repo lock / date / no-write tests
  const tempRoot = join(repoRoot, 'tmp', 'ghostflow', `promotion-plan-${Date.now()}`);
  await mkdir(tempRoot, { recursive: true });
  try {
    const { envelopePath, productionPath } = await writeTempRepo(tempRoot, production);
    const beforeBytes = await readFile(productionPath, 'utf8');

    const dryOk = await dryRunGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath,
    });
    assert.strictEqual(dryOk.ok, true);
    assert.strictEqual(dryOk.exitCode, 0);
    assert.strictEqual(await readFile(productionPath, 'utf8'), beforeBytes);

    // changed production hash → stale
    const changedHash = {
      ...(production as object),
      publishedAt: '2099-01-01',
    };
    await writeFile(productionPath, `${JSON.stringify(changedHash, null, 2)}\n`, 'utf8');
    const staleHash = await dryRunGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath,
    });
    assert.strictEqual(staleHash.ok, false);
    if (!staleHash.ok) {
      assert.strictEqual(staleHash.status, 'promotion_stale_current_production');
      assert.strictEqual(staleHash.exitCode, 3);
    }
    await writeFile(productionPath, beforeBytes, 'utf8');

    // changed asOf → stale (keep production valid by syncing reportDates)
    const changedAsOf = JSON.parse(JSON.stringify(production)) as {
      asOf: string;
      publishedAt?: string;
      scoreContracts: Array<{ observations: { reportDate: string } }>;
      vixContext: { observations: { reportDate: string } };
    };
    changedAsOf.asOf = '2020-01-01';
    changedAsOf.publishedAt = '2020-01-02';
    for (const c of changedAsOf.scoreContracts) {
      c.observations.reportDate = '2020-01-01';
    }
    changedAsOf.vixContext.observations.reportDate = '2020-01-01';
    await writeFile(productionPath, `${JSON.stringify(changedAsOf, null, 2)}\n`, 'utf8');
    const staleAsOf = await dryRunGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath,
    });
    assert.strictEqual(staleAsOf.ok, false);
    if (!staleAsOf.ok) {
      assert.strictEqual(staleAsOf.exitCode, 3);
    }
    await writeFile(productionPath, beforeBytes, 'utf8');

    // envelope artifactPath changed → stale (via plan after reading envelope)
    const envelopeJson = JSON.parse(await readFile(envelopePath, 'utf8')) as GhostFlowCandidateEnvelope;
    const pathMismatch: GhostFlowCandidateEnvelope = {
      ...envelopeJson,
      currentProduction: {
        ...envelopeJson.currentProduction,
        artifactPath: 'data/ghostflow/artifacts/other.v1.json',
      },
    };
    const pathMismatchPlan = await buildGhostFlowPromotionPlan({
      repoRoot: tempRoot,
      envelope: pathMismatch,
      currentProductionRaw: production,
    });
    assert.strictEqual(pathMismatchPlan.ok, false);
    if (!pathMismatchPlan.ok) {
      assert.strictEqual(pathMismatchPlan.exitCode, 3);
    }

    // sourcePublishedAt present and equal succeeds (envelope already has it if production has publishedAt)
    if (envelope.currentProduction.sourcePublishedAt) {
      const withPublished = await buildGhostFlowPromotionPlan({
        repoRoot: tempRoot,
        envelope: envelopeJson,
        currentProductionRaw: production,
      });
      assert.strictEqual(withPublished.ok, true);
    }

    // sourcePublishedAt present and differs → stale
    if (envelope.currentProduction.sourcePublishedAt) {
      const publishedMismatch: GhostFlowCandidateEnvelope = {
        ...envelopeJson,
        currentProduction: {
          ...envelopeJson.currentProduction,
          sourcePublishedAt: '2099-01-01',
        },
      };
      const publishedStale = await buildGhostFlowPromotionPlan({
        repoRoot: tempRoot,
        envelope: publishedMismatch,
        currentProductionRaw: production,
      });
      assert.strictEqual(publishedStale.ok, false);
      if (!publishedStale.ok) {
        assert.strictEqual(publishedStale.exitCode, 3);
      }
    }

    // sourcePublishedAt absent → no extra equality required
    const fingerprintWithoutPublished = { ...envelopeJson.currentProduction };
    delete fingerprintWithoutPublished.sourcePublishedAt;
    const absentPublished: GhostFlowCandidateEnvelope = {
      ...envelopeJson,
      currentProduction: fingerprintWithoutPublished,
    };
    const absentOk = await buildGhostFlowPromotionPlan({
      repoRoot: tempRoot,
      envelope: absentPublished,
      currentProductionRaw: production,
    });
    assert.strictEqual(absentOk.ok, true);

    // invalid current production → exit 5
    const invalidCurrent = await buildGhostFlowPromotionPlan({
      repoRoot: tempRoot,
      envelope: envelopeJson,
      currentProductionRaw: { bad: true },
    });
    assert.strictEqual(invalidCurrent.ok, false);
    if (!invalidCurrent.ok) {
      assert.strictEqual(invalidCurrent.exitCode, 5);
    }

    // missing production file
    await rm(productionPath, { force: true });
    const missing = await dryRunGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath,
    });
    assert.strictEqual(missing.ok, false);
    if (!missing.ok) {
      assert.strictEqual(missing.exitCode, 5);
    }

    // Date gate: same / older via envelope built against future current asOf
    await writeFile(productionPath, beforeBytes, 'utf8');
    const sameDateNormalized = fixtureSystematicNormalized();
    const productionAsOf = (production as { asOf: string }).asOf;
    sameDateNormalized.observationAsOf = productionAsOf;
    sameDateNormalized.provenance.observationAsOf = productionAsOf;
    for (const contract of sameDateNormalized.fields.scoreContracts) {
      contract.observations.reportDate = productionAsOf;
    }
    sameDateNormalized.fields.vixContext.observations.reportDate = productionAsOf;
    const sameDateGenerated = await generateGhostFlowCandidate({
      artifactId: 'systematicFlowProxy',
      nowIso: '2026-08-26T22:00:00.000Z',
      currentProductionRaw: production,
      injectNormalized: sameDateNormalized,
      mapper: {
        artifactId: 'systematicFlowProxy',
        map: () => ({
          ok: true,
          value: { ...(production as object), publishedAt: '2099-01-01' },
          issues: [],
        }),
      },
    });
    // same date with changed payload → revision_review_required (not promotable via envelope validation)
    assert.strictEqual(sameDateGenerated.status, 'revision_review_required');

    // Construct older ready envelope by using older observation than production
    const olderNormalized = fixtureSystematicNormalized();
    olderNormalized.observationAsOf = '2020-01-01';
    olderNormalized.provenance.observationAsOf = '2020-01-01';
    for (const contract of olderNormalized.fields.scoreContracts) {
      contract.observations.reportDate = '2020-01-01';
    }
    olderNormalized.fields.vixContext.observations.reportDate = '2020-01-01';
    const olderGenerated = await generateGhostFlowCandidate({
      artifactId: 'systematicFlowProxy',
      nowIso: '2026-08-26T22:00:00.000Z',
      currentProductionRaw: production,
      injectNormalized: olderNormalized,
    });
    assert.strictEqual(olderGenerated.status, 'no_newer_observation');

    // same-date gate: current fingerprint/raw asOf equals candidate asOf
    const sameDateCurrent = envelope.proposedArtifact as object;
    const sameDateHash = sha256HexFromCanonicalJson(sameDateCurrent);
    assert.ok(sameDateHash.ok);
    if (!sameDateHash.ok) throw new Error('unreachable');
    const sameDateEnvelope: GhostFlowCandidateEnvelope = {
      ...envelope,
      currentProduction: {
        artifactId: 'systematicFlowProxy',
        artifactPath: envelope.currentProduction.artifactPath,
        observationAsOf: (sameDateCurrent as { asOf: string }).asOf,
        promotionPayloadSha256: sameDateHash.value,
        ...((sameDateCurrent as { publishedAt?: string }).publishedAt
          ? { sourcePublishedAt: (sameDateCurrent as { publishedAt: string }).publishedAt }
          : {}),
      },
    };
    const sameDatePlan = await buildGhostFlowPromotionPlan({
      repoRoot,
      envelope: sameDateEnvelope,
      currentProductionRaw: sameDateCurrent,
    });
    assert.strictEqual(sameDatePlan.ok, false);
    if (!sameDatePlan.ok) {
      assert.strictEqual(sameDatePlan.exitCode, 2);
      assert.ok(sameDatePlan.issues.some((issue) => issue.code === 'promotion_date_not_newer'));
    }

    // older: current asOf > candidate asOf
    const newerCurrent = {
      ...(envelope.proposedArtifact as object),
      asOf: '2026-12-01',
      publishedAt: '2026-12-02',
    };
    // May fail validator due to reportDate mismatch — skip if invalid and use fingerprint-only
    // approach with inject that bypasses validator... we need valid current.
    // Use production as current (asOf 2026-06-30) and force candidate asOf to 2020 via mapper stub
    // returning old asOf artifact — but then hash won't match envelope.candidateIdentity.
    // Date gate uses replayed validated asOf, so:
    const olderCandidateMapper: GhostFlowCandidateMapper<unknown, unknown> = {
      artifactId: 'systematicFlowProxy',
      map: () => {
        const older = JSON.parse(JSON.stringify(envelope.proposedArtifact)) as {
          asOf: string;
          publishedAt?: string;
          scoreContracts: Array<{ observations: { reportDate: string } }>;
          vixContext: { observations: { reportDate: string } };
        };
        older.asOf = '2020-01-01';
        older.publishedAt = '2020-01-02';
        for (const c of older.scoreContracts) {
          c.observations.reportDate = '2020-01-01';
        }
        older.vixContext.observations.reportDate = '2020-01-01';
        return { ok: true, value: older, issues: [] };
      },
    };
    const olderViaMapper = await buildGhostFlowPromotionPlan({
      repoRoot,
      envelope,
      mapper: olderCandidateMapper,
      currentProductionRaw: production,
    });
    assert.strictEqual(olderViaMapper.ok, false);
    if (!olderViaMapper.ok) {
      assert.strictEqual(olderViaMapper.exitCode, 4);
    }

    // Proper older date gate: rebuild envelope identity around an older proposed artifact that
    // still maps from older normalized — generator already returns no_newer_observation (no envelope).
    // So construct manually: take ready envelope, replace proposed with older validated? Can't keep identity.
    // Use sameDateEnvelope pattern with current asOf after candidate:
    // candidate remains newer-than-production observation; set current fingerprint/raw
    // asOf to 2026-09-01 with matching contracts so current is after the candidate.
    const olderThanCandidateCurrent = JSON.parse(JSON.stringify(envelope.proposedArtifact)) as {
      asOf: string;
      publishedAt?: string;
      scoreContracts: Array<{ observations: { reportDate: string } }>;
      vixContext: { observations: { reportDate: string } };
    };
    olderThanCandidateCurrent.asOf = '2026-09-01';
    olderThanCandidateCurrent.publishedAt = '2026-09-02';
    for (const c of olderThanCandidateCurrent.scoreContracts) {
      c.observations.reportDate = '2026-09-01';
    }
    olderThanCandidateCurrent.vixContext.observations.reportDate = '2026-09-01';
    const olderCurrentHash = sha256HexFromCanonicalJson(olderThanCandidateCurrent);
    assert.ok(olderCurrentHash.ok);
    if (!olderCurrentHash.ok) throw new Error('unreachable');
    const olderDateEnvelope: GhostFlowCandidateEnvelope = {
      ...envelope,
      currentProduction: {
        artifactId: 'systematicFlowProxy',
        artifactPath: envelope.currentProduction.artifactPath,
        observationAsOf: '2026-09-01',
        promotionPayloadSha256: olderCurrentHash.value,
        sourcePublishedAt: '2026-09-02',
      },
    };
    const olderDatePlan = await buildGhostFlowPromotionPlan({
      repoRoot,
      envelope: olderDateEnvelope,
      currentProductionRaw: olderThanCandidateCurrent,
    });
    assert.strictEqual(olderDatePlan.ok, false);
    if (!olderDatePlan.ok) {
      assert.strictEqual(olderDatePlan.exitCode, 2);
      assert.ok(olderDatePlan.issues.some((issue) => issue.code === 'promotion_date_not_newer'));
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }

  console.log('ghostflow/promotion/plan.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
