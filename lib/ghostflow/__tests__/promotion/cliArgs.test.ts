import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import {
  parsePromoteCandidateCliArgs,
  resolvePromotionEnvelopePath,
} from '@/lib/ghostflow/refresh/promotion/cliArgs';

const repoRoot = resolve('C:/Users/Bobby/ghost-allocator');

function main(): void {
  assert.strictEqual(parsePromoteCandidateCliArgs([], repoRoot).ok, false);

  const relativeOk = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'candidates', 'x.2026-08-25.abc.candidate.json')],
    repoRoot
  );
  assert.strictEqual(relativeOk.ok, true);
  if (relativeOk.ok) {
    assert.strictEqual(relativeOk.value.apply, false);
  }

  const absoluteInside = resolve(
    repoRoot,
    'tmp',
    'ghostflow',
    'candidates',
    'systematicFlowProxy.2026-08-18.deadbeefdead.candidate.json'
  );
  const absoluteOk = parsePromoteCandidateCliArgs(['--envelope', absoluteInside], repoRoot);
  assert.strictEqual(absoluteOk.ok, true);
  if (absoluteOk.ok) {
    assert.strictEqual(absoluteOk.value.apply, false);
  }

  const applyOk = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--apply'],
    repoRoot
  );
  assert.strictEqual(applyOk.ok, true);
  if (applyOk.ok) {
    assert.strictEqual(applyOk.value.apply, true);
  }

  const applyFirst = parsePromoteCandidateCliArgs(
    ['--apply', '--envelope', join('tmp', 'ghostflow', 'a.candidate.json')],
    repoRoot
  );
  assert.strictEqual(applyFirst.ok, true);
  if (applyFirst.ok) {
    assert.strictEqual(applyFirst.value.apply, true);
  }

  const duplicateApply = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--apply', '--apply'],
    repoRoot
  );
  assert.strictEqual(duplicateApply.ok, false);

  const applyWithValue = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--apply', 'true'],
    repoRoot
  );
  assert.strictEqual(applyWithValue.ok, false);

  const external = parsePromoteCandidateCliArgs(
    ['--envelope', 'C:\\Windows\\Temp\\evil.candidate.json'],
    repoRoot
  );
  assert.strictEqual(external.ok, false);

  const traversal = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', '..', '..', 'outside.candidate.json')],
    repoRoot
  );
  assert.strictEqual(traversal.ok, false);

  const duplicate = parsePromoteCandidateCliArgs(
    [
      '--envelope',
      join('tmp', 'ghostflow', 'a.candidate.json'),
      '--envelope',
      join('tmp', 'ghostflow', 'b.candidate.json'),
    ],
    repoRoot
  );
  assert.strictEqual(duplicate.ok, false);

  for (const flag of [
    '--artifact',
    '--latest',
    '--all',
    '--force',
    '--yes',
    '--skip-validation',
  ]) {
    const rejected = parsePromoteCandidateCliArgs(
      ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), flag],
      repoRoot
    );
    assert.strictEqual(rejected.ok, false, flag);
  }

  const unknown = parsePromoteCandidateCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--verbose'],
    repoRoot
  );
  assert.strictEqual(unknown.ok, false);

  const badSuffix = resolvePromotionEnvelopePath(
    repoRoot,
    join('tmp', 'ghostflow', 'candidates', 'x.json')
  );
  assert.strictEqual(badSuffix.ok, false);

  const goodSuffix = resolvePromotionEnvelopePath(
    repoRoot,
    join('tmp', 'ghostflow', 'candidates', 'x.candidate.json')
  );
  assert.strictEqual(goodSuffix.ok, true);

  console.log('ghostflow/promotion/cliArgs.test.ts: ok');
}

main();
