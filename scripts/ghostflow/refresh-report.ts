/**
 * GhostFlow manual report-only operator CLI.
 * Reads current production artifacts, fetches official sources, prints a review report.
 * Never writes production artifacts, candidates, history, or scores.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GHOSTFLOW_REFRESH_REGISTRY } from '../../lib/ghostflow/refresh/registry';
import {
  GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS,
  resolveOperatorRequestedArtifactIds,
  runGhostFlowOperatorReport,
  type GhostFlowOperatorReportArtifactId,
} from '../../lib/ghostflow/refresh/operatorRunner';
import { isValidCalendarDate } from '../../lib/ghostflow/refresh/dateValidation';
import type { GhostFlowRefreshReportStatus } from '../../lib/ghostflow/refresh/report';

const REGISTRY_BY_ID = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((entry) => [entry.artifactId, entry] as const)
);

type CliOptions = {
  artifactIds: GhostFlowOperatorReportArtifactId[];
  referenceAsOf?: string;
};

function printUsage(): void {
  console.error(`Usage: npm run ghostflow:refresh-report [-- --artifact <id>]... [--as-of YYYY-MM-DD]

Operator-enabled artifacts:
${GHOSTFLOW_OPERATOR_REPORT_ARTIFACT_IDS.map((id) => `  - ${id}`).join('\n')}

Default: run all three allowlisted artifacts.
`);
}

function parseArgs(argv: readonly string[]): CliOptions | { error: string } {
  const artifactIds: GhostFlowOperatorReportArtifactId[] = [];
  let referenceAsOf: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--artifact') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return { error: 'Missing value for --artifact' };
      }
      artifactIds.push(value as GhostFlowOperatorReportArtifactId);
      i += 1;
      continue;
    }
    if (arg === '--as-of') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return { error: 'Missing value for --as-of' };
      }
      if (!isValidCalendarDate(value)) {
        return { error: `Invalid --as-of calendar date: ${value}` };
      }
      referenceAsOf = value;
      i += 1;
      continue;
    }
    return { error: `Unknown argument: ${arg}` };
  }

  return {
    artifactIds,
    referenceAsOf,
  };
}

function loadCurrentArtifact(artifactId: GhostFlowOperatorReportArtifactId): unknown {
  const entry = REGISTRY_BY_ID.get(artifactId);
  if (!entry) {
    throw new Error(`Registry entry missing for ${artifactId}`);
  }
  const absolutePath = join(process.cwd(), entry.artifactPath);
  const text = readFileSync(absolutePath, 'utf8');
  return JSON.parse(text) as unknown;
}

function exitCodeForStatus(status: GhostFlowRefreshReportStatus): number {
  if (status === 'ready_for_review' || status === 'no_changes') {
    return 0;
  }
  if (status === 'partial_with_blocks' || status === 'blocked') {
    return 2;
  }
  return 1;
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    console.error(parsed.error);
    printUsage();
    process.exit(1);
  }

  const resolved = resolveOperatorRequestedArtifactIds(
    parsed.artifactIds.length > 0 ? parsed.artifactIds : undefined
  );
  if (!resolved.ok) {
    for (const issue of resolved.issues) {
      console.error(`${issue.code}: ${issue.message}`);
    }
    process.exit(1);
  }

  const requested = resolved.value;
  const currentArtifactsById: Partial<
    Record<GhostFlowOperatorReportArtifactId, unknown>
  > = {};

  for (const artifactId of requested) {
    currentArtifactsById[artifactId] = loadCurrentArtifact(artifactId);
  }

  const nowIso = new Date().toISOString();
  const result = await runGhostFlowOperatorReport({
    nowIso,
    requestedArtifactIds: requested,
    currentArtifactsById,
    referenceAsOf: parsed.referenceAsOf,
  });

  if (!result.ok) {
    console.error('Operator report construction failed:');
    console.error(JSON.stringify(result.issues, null, 2));
    process.exit(1);
  }

  console.log('GhostFlow Operator Refresh Report');
  console.log('Mode: report_only');
  console.log('Human review required: yes');
  console.log(JSON.stringify(result.report, null, 2));

  process.exit(exitCodeForStatus(result.report.overallStatus));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ghostflow:refresh-report failed: ${message}`);
  process.exit(1);
});
