import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  generateCandidateCliUsage,
  parseGenerateCandidateCliArgs,
} from '@/lib/ghostflow/refresh/candidates/cliArgs';

const repoRoot = process.cwd();

const ok = parseGenerateCandidateCliArgs(
  ['--artifact', 'systematicFlowProxy'],
  repoRoot
);
assert.strictEqual(ok.ok, true);

const missing = parseGenerateCandidateCliArgs([], repoRoot);
assert.strictEqual(missing.ok, false);

const unknown = parseGenerateCandidateCliArgs(['--artifact', 'marketBreadth'], repoRoot);
assert.strictEqual(unknown.ok, false);

const allRejected = parseGenerateCandidateCliArgs(['--artifact', 'all'], repoRoot);
assert.strictEqual(allRejected.ok, false);

const missingValue = parseGenerateCandidateCliArgs(['--artifact'], repoRoot);
assert.strictEqual(missingValue.ok, false);

const doubleArtifact = parseGenerateCandidateCliArgs(
  ['--artifact', 'systematicFlowProxy', '--artifact', 'treasuryFuturesPositioningProxy'],
  repoRoot
);
assert.strictEqual(doubleArtifact.ok, false);

const validAsOf = parseGenerateCandidateCliArgs(
  ['--artifact', 'treasuryLongEndIncomeLens', '--as-of', '2026-08-24'],
  repoRoot
);
assert.strictEqual(validAsOf.ok, true);

const invalidAsOf = parseGenerateCandidateCliArgs(
  ['--artifact', 'treasuryLongEndIncomeLens', '--as-of', '2026-02-30'],
  repoRoot
);
assert.strictEqual(invalidAsOf.ok, false);

const nestedOutDir = parseGenerateCandidateCliArgs(
  ['--artifact', 'systematicFlowProxy', '--out-dir', join('tmp', 'ghostflow', 'candidates', 'nested')],
  repoRoot
);
assert.strictEqual(nestedOutDir.ok, true);

const traversal = parseGenerateCandidateCliArgs(
  ['--artifact', 'systematicFlowProxy', '--out-dir', join('tmp', 'ghostflow', '..', '..', 'escape')],
  repoRoot
);
assert.strictEqual(traversal.ok, false);

assert.ok(generateCandidateCliUsage().includes('systematicFlowProxy'));

console.log('ghostflow/candidates/cliArgs.test.ts: ok');
