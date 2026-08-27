import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { buildGhostFlowPromotionReceiptPlan } from '@/lib/ghostflow/refresh/promotion/receiptPlan';
import {
  serializeGhostFlowPromotionReceipt,
} from '@/lib/ghostflow/refresh/promotion/receiptTypes';
import { writeValidatedPromotionReceiptPlan } from '@/lib/ghostflow/refresh/promotion/receiptWriter';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

function loadTracked(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/ghostflow/artifacts', name), 'utf8')
  ) as unknown;
}

function nextCalendarDay(asOf: string): string {
  const date = new Date(`${asOf}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function buildReadySystematicEnvelope(): Promise<{
  envelope: GhostFlowCandidateEnvelope;
  proposedArtifact: unknown;
  priorProduction: unknown;
}> {
  const production = loadTracked('systematicFlowProxy.v1.json') as { asOf: string };
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
  return {
    envelope: generated.envelope,
    proposedArtifact: generated.envelope.proposedArtifact,
    priorProduction: production,
  };
}

async function main(): Promise<void> {
  const root = join(tmpdir(), `gf-receipt-writer-${randomBytes(8).toString('hex')}`);
  await mkdir(root, { recursive: true });

  try {
    const built = await buildReadySystematicEnvelope();
    const planResult = buildGhostFlowPromotionReceiptPlan({
      repoRoot: root,
      envelope: built.envelope,
      currentProductionRaw: built.proposedArtifact,
    });
    assert.strictEqual(planResult.ok, true);
    if (!planResult.ok) throw new Error('unreachable');

    const { plan } = planResult;
    const plannedBytes = serializeGhostFlowPromotionReceipt(plan.receipt);

    // C — write success
    const written = await writeValidatedPromotionReceiptPlan({ repoRoot: root, plan });
    assert.strictEqual(written.ok, true);
    assert.strictEqual(written.status, 'promotion_receipt_written');
    assert.strictEqual(written.exitCode, 0);
    const onDisk = await readFile(plan.receiptAbsolutePath, 'utf8');
    assert.strictEqual(onDisk, plannedBytes);
    assert.strictEqual(plan.receipt.reviewedEnvelopeBasename, undefined);
    assert.ok(!('appliedAt' in plan.receipt));
    assert.ok(!('recordedAt' in plan.receipt));

    // D — idempotent retry
    const again = await writeValidatedPromotionReceiptPlan({ repoRoot: root, plan });
    assert.strictEqual(again.ok, true);
    assert.strictEqual(again.status, 'promotion_receipt_already_exists');
    assert.strictEqual(again.exitCode, 0);
    assert.strictEqual(await readFile(plan.receiptAbsolutePath, 'utf8'), plannedBytes);

    // E — collision
    await writeFile(plan.receiptAbsolutePath, `${plannedBytes} \n`, 'utf8');
    const collision = await writeValidatedPromotionReceiptPlan({ repoRoot: root, plan });
    assert.strictEqual(collision.ok, false);
    if (!collision.ok) {
      assert.strictEqual(collision.status, 'promotion_receipt_collision');
      assert.strictEqual(collision.exitCode, 6);
    }
    assert.strictEqual(await readFile(plan.receiptAbsolutePath, 'utf8'), `${plannedBytes} \n`);

    // Path mismatch fail-closed (mutated plan paths)
    await writeFile(plan.receiptAbsolutePath, plannedBytes, 'utf8');
    const badPlan = {
      ...plan,
      receiptAbsolutePath: join(root, 'data', 'ghostflow', 'artifacts', 'evil.json'),
    };
    const mismatch = await writeValidatedPromotionReceiptPlan({ repoRoot: root, plan: badPlan });
    assert.strictEqual(mismatch.ok, false);
    if (!mismatch.ok) {
      assert.strictEqual(mismatch.status, 'promotion_receipt_write_failed');
      assert.strictEqual(mismatch.exitCode, 1);
    }

    console.log('ghostflow/promotion/receiptWriter.test.ts: ok');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
