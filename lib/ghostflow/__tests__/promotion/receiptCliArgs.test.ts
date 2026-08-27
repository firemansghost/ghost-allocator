import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import {
  parseRecordPromotionReceiptCliArgs,
} from '@/lib/ghostflow/refresh/promotion/receiptCliArgs';

const repoRoot = resolve('C:/Users/Bobby/ghost-allocator');

function main(): void {
  assert.strictEqual(parseRecordPromotionReceiptCliArgs([], repoRoot).ok, false);

  const relativeOk = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'candidates', 'x.2026-08-25.abc.candidate.json')],
    repoRoot
  );
  assert.strictEqual(relativeOk.ok, true);
  if (relativeOk.ok) {
    assert.strictEqual(relativeOk.value.write, false);
  }

  const writeOk = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--write'],
    repoRoot
  );
  assert.strictEqual(writeOk.ok, true);
  if (writeOk.ok) {
    assert.strictEqual(writeOk.value.write, true);
  }

  const writeFirst = parseRecordPromotionReceiptCliArgs(
    ['--write', '--envelope', join('tmp', 'ghostflow', 'a.candidate.json')],
    repoRoot
  );
  assert.strictEqual(writeFirst.ok, true);
  if (writeFirst.ok) {
    assert.strictEqual(writeFirst.value.write, true);
  }

  const duplicateWrite = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--write', '--write'],
    repoRoot
  );
  assert.strictEqual(duplicateWrite.ok, false);

  const writeWithValue = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--write', 'true'],
    repoRoot
  );
  assert.strictEqual(writeWithValue.ok, false);

  const duplicateEnvelope = parseRecordPromotionReceiptCliArgs(
    [
      '--envelope',
      join('tmp', 'ghostflow', 'a.candidate.json'),
      '--envelope',
      join('tmp', 'ghostflow', 'b.candidate.json'),
    ],
    repoRoot
  );
  assert.strictEqual(duplicateEnvelope.ok, false);

  const unknown = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--force'],
    repoRoot
  );
  assert.strictEqual(unknown.ok, false);

  const applyRejected = parseRecordPromotionReceiptCliArgs(
    ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), '--apply'],
    repoRoot
  );
  assert.strictEqual(applyRejected.ok, false);

  for (const flag of ['--artifact', '--latest', '--all', '--yes', '--skip-validation']) {
    const rejected = parseRecordPromotionReceiptCliArgs(
      ['--envelope', join('tmp', 'ghostflow', 'a.candidate.json'), flag],
      repoRoot
    );
    assert.strictEqual(rejected.ok, false, flag);
  }

  const external = parseRecordPromotionReceiptCliArgs(
    ['--envelope', 'C:\\Windows\\Temp\\evil.candidate.json'],
    repoRoot
  );
  assert.strictEqual(external.ok, false);

  console.log('ghostflow/promotion/receiptCliArgs.test.ts: ok');
}

main();
