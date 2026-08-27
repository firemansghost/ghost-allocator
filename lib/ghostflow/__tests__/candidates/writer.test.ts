import assert from 'node:assert/strict';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import {
  mergeWriteSummary,
  resolveCandidateOutputDirectory,
  writeGhostFlowCandidateEnvelope,
} from '@/lib/ghostflow/refresh/candidates/writer';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

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

async function buildEnvelope(): Promise<GhostFlowCandidateEnvelope> {
  const production = loadProduction('systematicFlowProxy.v1.json') as { asOf: string };
  const newerAsOf = nextCalendarDay(production.asOf);
  const newerNormalized = fixtureSystematicNormalized();
  newerNormalized.observationAsOf = newerAsOf;
  newerNormalized.provenance.observationAsOf = newerAsOf;
  for (const contract of newerNormalized.fields.scoreContracts) {
    contract.observations.reportDate = newerAsOf;
  }
  newerNormalized.fields.vixContext.observations.reportDate = newerAsOf;

  const generated = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: production,
    injectNormalized: newerNormalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) {
    throw new Error('unreachable');
  }
  assert.strictEqual(generated.status, 'ready_for_review');
  assert.strictEqual(generated.exitCode, 0);
  return generated.envelope;
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  assert.strictEqual(
    resolveCandidateOutputDirectory(repoRoot, join('tmp', 'ghostflow', 'candidates')).ok,
    true
  );
  assert.strictEqual(
    resolveCandidateOutputDirectory(repoRoot, join('tmp', 'ghostflow', '..', '..', 'outside')).ok,
    false
  );

  const envelope = await buildEnvelope();
  const outDirRelative = join('tmp', 'ghostflow', `candidates-writer-${Date.now()}`);
  await mkdir(join(repoRoot, outDirRelative), { recursive: true });

  const first = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope,
  });
  assert.strictEqual(first.exitCode, 0);
  assert.ok(first.outputPath);

  const firstBytes = await readFile(first.outputPath!, 'utf8');

  const generatedAtOnly = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope: {
      ...envelope,
      generatedAt: '2026-09-01T00:00:00.000Z',
    },
  });
  assert.strictEqual(generatedAtOnly.status, 'candidate_already_exists');
  assert.strictEqual(generatedAtOnly.exitCode, 0);
  assert.strictEqual(await readFile(first.outputPath!, 'utf8'), firstBytes);

  const retrievedAtOnly = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope: {
      ...envelope,
      normalizedObservation: {
        ...envelope.normalizedObservation,
        provenance: {
          ...envelope.normalizedObservation.provenance,
          retrievedAt: '2026-09-01T00:00:00.000Z',
        },
      },
    },
  });
  assert.strictEqual(retrievedAtOnly.status, 'candidate_already_exists');
  assert.strictEqual(retrievedAtOnly.exitCode, 0);
  assert.strictEqual(await readFile(first.outputPath!, 'utf8'), firstBytes);

  async function expectCollision(
    label: string,
    mutate: (stored: GhostFlowCandidateEnvelope) => void | Promise<void>
  ): Promise<void> {
    const before = await readFile(first.outputPath!, 'utf8');
    const stored = JSON.parse(before) as GhostFlowCandidateEnvelope;
    await mutate(stored);
    await writeFile(first.outputPath!, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
    const retry = await writeGhostFlowCandidateEnvelope({
      repoRoot,
      outDirRelative,
      envelope,
    });
    assert.strictEqual(retry.status, 'candidate_identity_collision', label);
    assert.strictEqual(retry.exitCode, 6, label);
    assert.strictEqual(await readFile(first.outputPath!, 'utf8'), `${JSON.stringify(stored, null, 2)}\n`, label);
    const summary = mergeWriteSummary(
      {
        artifactId: 'systematicFlowProxy',
        status: 'ready_for_review',
        exitCode: 0,
      },
      retry
    );
    assert.ok(summary.issueCodes && summary.issueCodes.length > 0, label);
    await writeFile(first.outputPath!, before, 'utf8');
  }

  await expectCollision('proposedArtifact modified', (stored) => {
    const artifact = stored.proposedArtifact as Record<string, unknown>;
    stored.proposedArtifact = { ...artifact, asOf: '2099-01-01' };
  });

  await expectCollision('promotionPayloadSha256 modified', (stored) => {
    stored.candidateIdentity.promotionPayloadSha256 = '0'.repeat(64);
  });

  await expectCollision('identitySha256 modified', (stored) => {
    stored.candidateIdentity.identitySha256 = '1'.repeat(64);
  });

  await expectCollision('identityPrefix modified', (stored) => {
    stored.candidateIdentity.identityPrefix = 'deadbeefdead';
  });

  await expectCollision('normalizedObservation.artifactId modified', (stored) => {
    stored.normalizedObservation.artifactId = 'tamperedArtifact';
  });

  await expectCollision('normalizedObservation.observationAsOf modified', (stored) => {
    stored.normalizedObservation.observationAsOf = '2099-01-01';
  });

  await expectCollision('contentSha256 modified', (stored) => {
    stored.normalizedObservation.provenance.contentSha256 = '0'.repeat(64);
  });

  await expectCollision('adapterId modified', (stored) => {
    stored.normalizedObservation.provenance.adapterId = 'tampered-adapter';
  });

  await expectCollision('parserVersion modified', (stored) => {
    stored.normalizedObservation.provenance.parserVersion = '9.9.9';
  });

  const malformedJsonPath = first.outputPath!;
  const validBeforeMalformed = await readFile(malformedJsonPath, 'utf8');
  await writeFile(malformedJsonPath, '{ not valid json', 'utf8');
  const malformedRetry = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope,
  });
  assert.strictEqual(malformedRetry.status, 'candidate_identity_collision');
  assert.strictEqual(malformedRetry.exitCode, 6);
  assert.strictEqual(await readFile(malformedJsonPath, 'utf8'), '{ not valid json');
  await writeFile(malformedJsonPath, validBeforeMalformed, 'utf8');

  await expectCollision('structurally malformed envelope', (stored) => {
    delete (stored as { candidateIdentity?: unknown }).candidateIdentity;
  });

  await rm(join(repoRoot, outDirRelative), { recursive: true, force: true });

  console.log('ghostflow/candidates/writer.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
