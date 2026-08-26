import { join } from 'node:path';
import { isValidCalendarDate } from '../dateValidation';
import {
  GHOSTFLOW_CANDIDATE_ARTIFACT_IDS,
  type GhostFlowCandidateArtifactId,
} from './types';
import { resolveCandidateOutputDirectory } from './writer';

const ALLOWLIST = new Set<string>(GHOSTFLOW_CANDIDATE_ARTIFACT_IDS);

export type GhostFlowGenerateCandidateCliOptions = {
  artifactId: GhostFlowCandidateArtifactId;
  referenceAsOf?: string;
  outDirRelative: string;
};

export function parseGenerateCandidateCliArgs(
  argv: readonly string[],
  repoRoot: string
): { ok: true; value: GhostFlowGenerateCandidateCliOptions } | { ok: false; error: string } {
  let artifactId: string | undefined;
  let referenceAsOf: string | undefined;
  let outDirRelative = join('tmp', 'ghostflow', 'candidates');

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--artifact') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return { ok: false, error: 'Missing value for --artifact' };
      }
      if (artifactId !== undefined) {
        return { ok: false, error: 'Only one --artifact selection is allowed' };
      }
      artifactId = value;
      i += 1;
      continue;
    }
    if (arg === '--as-of') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return { ok: false, error: 'Missing value for --as-of' };
      }
      if (!isValidCalendarDate(value)) {
        return { ok: false, error: `Invalid --as-of calendar date: ${value}` };
      }
      referenceAsOf = value;
      i += 1;
      continue;
    }
    if (arg === '--out-dir') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return { ok: false, error: 'Missing value for --out-dir' };
      }
      outDirRelative = value;
      i += 1;
      continue;
    }
    return { ok: false, error: `Unknown argument: ${arg}` };
  }

  if (!artifactId) {
    return { ok: false, error: 'Missing required --artifact' };
  }

  if (artifactId === 'all') {
    return { ok: false, error: '--artifact all is not supported' };
  }

  if (!ALLOWLIST.has(artifactId)) {
    return { ok: false, error: `Unknown artifact id: ${artifactId}` };
  }

  const outDir = resolveCandidateOutputDirectory(repoRoot, outDirRelative);
  if (!outDir.ok) {
    return { ok: false, error: outDir.issues[0]?.message ?? 'Invalid --out-dir' };
  }

  return {
    ok: true,
    value: {
      artifactId: artifactId as GhostFlowCandidateArtifactId,
      referenceAsOf,
      outDirRelative,
    },
  };
}

export function generateCandidateCliUsage(): string {
  return `Usage: npm run ghostflow:generate-candidate -- --artifact <id> [--out-dir tmp/ghostflow/candidates] [--as-of YYYY-MM-DD]

Supported artifacts:
${GHOSTFLOW_CANDIDATE_ARTIFACT_IDS.map((id) => `  - ${id}`).join('\n')}
`;
}
