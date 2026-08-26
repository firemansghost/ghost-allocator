/**
 * GhostFlow candidate generator CLI.
 * Generates local review envelopes under tmp/ghostflow/candidates only.
 * Never writes production artifacts or promotes candidates.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateCandidateCliUsage,
  parseGenerateCandidateCliArgs,
} from '../../lib/ghostflow/refresh/candidates/cliArgs';
import { generateGhostFlowCandidate } from '../../lib/ghostflow/refresh/candidates/generator';
import {
  mergeWriteSummary,
  writeGhostFlowCandidateEnvelope,
} from '../../lib/ghostflow/refresh/candidates/writer';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../../lib/ghostflow/refresh/registry';
import type { GhostFlowCandidateArtifactId } from '../../lib/ghostflow/refresh/candidates/types';

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

function loadCurrentProduction(artifactId: GhostFlowCandidateArtifactId): unknown {
  const entry = REGISTRY_BY_ID.get(artifactId);
  if (!entry) {
    throw new Error(`Registry entry missing for ${artifactId}`);
  }
  const absolutePath = join(process.cwd(), entry.artifactPath);
  const text = readFileSync(absolutePath, 'utf8');
  return JSON.parse(text) as unknown;
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const parsed = parseGenerateCandidateCliArgs(process.argv.slice(2), repoRoot);
  if (!parsed.ok) {
    console.error(parsed.error);
    console.error(generateCandidateCliUsage());
    process.exit(1);
  }

  const nowIso = new Date().toISOString();
  const currentProductionRaw = loadCurrentProduction(parsed.value.artifactId);

  const generated = await generateGhostFlowCandidate({
    artifactId: parsed.value.artifactId,
    nowIso,
    referenceAsOf: parsed.value.referenceAsOf,
    currentProductionRaw,
  });

  if (!generated.ok) {
    console.log(JSON.stringify(generated.summary));
    process.exit(generated.exitCode);
  }

  if (!generated.envelope) {
    console.log(JSON.stringify(generated.summary));
    process.exit(generated.exitCode);
  }

  const writeResult = await writeGhostFlowCandidateEnvelope({
    repoRoot,
    outDirRelative: parsed.value.outDirRelative,
    envelope: generated.envelope,
  });

  const summary = mergeWriteSummary(generated.summary, writeResult);
  summary.outputPath = writeResult.outputPath;
  summary.candidateIdentitySha256 = generated.envelope.candidateIdentity.identitySha256;
  summary.candidateObservationAsOf = generated.envelope.normalizedObservation.observationAsOf;

  console.log(JSON.stringify(summary));
  process.exit(writeResult.exitCode);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ghostflow:generate-candidate failed: ${message}`);
  process.exit(1);
});
