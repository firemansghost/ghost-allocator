import assert from 'node:assert/strict';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import {
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

  const newerNormalized = fixtureSystematicNormalized();
  newerNormalized.observationAsOf = '2026-08-18';
  newerNormalized.provenance.observationAsOf = '2026-08-18';
  for (const contract of newerNormalized.fields.scoreContracts) {
    contract.observations.reportDate = '2026-08-18';
  }
  newerNormalized.fields.vixContext.observations.reportDate = '2026-08-18';

  const generated = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadProduction('systematicFlowProxy.v1.json'),
    injectNormalized: newerNormalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');

  const outDirRelative = join('tmp', 'ghostflow', `candidates-writer-${Date.now()}`);
  await mkdir(join(repoRoot, outDirRelative), { recursive: true });

  const first = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope: generated.envelope as GhostFlowCandidateEnvelope,
  });
  assert.strictEqual(first.exitCode, 0);
  assert.ok(first.outputPath);

  const firstBytes = await readFile(first.outputPath!, 'utf8');
  const second = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope: {
      ...(generated.envelope as GhostFlowCandidateEnvelope),
      generatedAt: '2026-09-01T00:00:00.000Z',
      normalizedObservation: {
        ...(generated.envelope as GhostFlowCandidateEnvelope).normalizedObservation,
        provenance: {
          ...(generated.envelope as GhostFlowCandidateEnvelope).normalizedObservation.provenance,
          retrievedAt: '2026-09-01T00:00:00.000Z',
        },
      },
    },
  });
  assert.strictEqual(second.status, 'candidate_already_exists');
  assert.strictEqual(second.exitCode, 0);
  const secondBytes = await readFile(first.outputPath!, 'utf8');
  assert.strictEqual(firstBytes, secondBytes);

  const stored = JSON.parse(firstBytes) as GhostFlowCandidateEnvelope;
  stored.candidateIdentity.promotionPayloadSha256 = '0'.repeat(64);
  await writeFile(first.outputPath!, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
  const corruptRetry = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative,
    envelope: generated.envelope as GhostFlowCandidateEnvelope,
  });
  assert.strictEqual(corruptRetry.status, 'candidate_identity_collision');
  assert.strictEqual(corruptRetry.exitCode, 6);

  await rm(join(repoRoot, outDirRelative), { recursive: true, force: true });

  console.log('ghostflow/candidates/writer.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
