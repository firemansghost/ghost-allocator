import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import { resolvePromotionReceiptDestination } from '@/lib/ghostflow/refresh/promotion/receiptPathSafety';

function main(): void {
  const repoRoot = resolve('C:\\Users\\Bobby\\ghost-allocator');

  const ok = resolvePromotionReceiptDestination({
    repoRoot,
    artifactId: 'systematicFlowProxy',
    observationAsOf: '2026-08-18',
    identityPrefix: '93fbdc5760b0',
  });
  assert.strictEqual(ok.ok, true);
  if (!ok.ok) throw new Error('unreachable');
  assert.strictEqual(
    ok.value.relativePath,
    'data/ghostflow/promotion-receipts/systematicFlowProxy/2026-08-18.93fbdc5760b0.receipt.json'
  );
  assert.ok(
    ok.value.absolutePath.startsWith(`${ok.value.authorizedReceiptRoot}${sep}`)
  );
  assert.ok(ok.value.authorizedReceiptRoot.endsWith(`${sep}promotion-receipts`));

  for (const artifactId of [
    'treasuryFuturesPositioningProxy',
    'treasuryLongEndIncomeLens',
  ] as const) {
    const dest = resolvePromotionReceiptDestination({
      repoRoot,
      artifactId,
      observationAsOf: '2026-08-25',
      identityPrefix: 'aaaaaaaaaaaa',
    });
    assert.strictEqual(dest.ok, true);
    if (!dest.ok) throw new Error('unreachable');
    assert.ok(dest.value.relativePath.includes(artifactId));
  }

  assert.strictEqual(
    resolvePromotionReceiptDestination({
      repoRoot,
      artifactId: '../escape',
      observationAsOf: '2026-08-18',
      identityPrefix: '93fbdc5760b0',
    }).ok,
    false
  );
  assert.strictEqual(
    resolvePromotionReceiptDestination({
      repoRoot,
      artifactId: 'systematicFlowProxy',
      observationAsOf: '2026/08/18',
      identityPrefix: '93fbdc5760b0',
    }).ok,
    false
  );
  assert.strictEqual(
    resolvePromotionReceiptDestination({
      repoRoot,
      artifactId: 'systematicFlowProxy',
      observationAsOf: '2026-08-18',
      identityPrefix: 'NOTHEXPREFIX!',
    }).ok,
    false
  );
  assert.strictEqual(
    resolvePromotionReceiptDestination({
      repoRoot,
      artifactId: 'systematicFlowProxy',
      observationAsOf: '2026-08-18',
      identityPrefix: '93fbdc5760b0abcd',
    }).ok,
    false
  );

  console.log('ghostflow/promotion/receiptPathSafety.test.ts: ok');
}

main();
