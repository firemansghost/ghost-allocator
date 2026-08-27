import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { recordGhostFlowPromotionReceipt } from '@/lib/ghostflow/refresh/promotion/receiptOperation';
import {
  serializeGhostFlowPromotionReceipt,
  type GhostFlowPromotionReceiptV1,
} from '@/lib/ghostflow/refresh/promotion/receiptTypes';
import type { GhostFlowCandidateMapper } from '@/lib/ghostflow/refresh/types';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

const ARTIFACTS = [
  'systematicFlowProxy.v1.json',
  'treasuryFuturesPositioningProxy.v1.json',
  'treasuryLongEndIncomeLens.v1.json',
] as const;

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

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

async function buildReadySystematicEnvelope(
  priorProduction: unknown
): Promise<GhostFlowCandidateEnvelope> {
  const production = priorProduction as { asOf: string };
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
    currentProductionRaw: priorProduction,
    injectNormalized: normalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');
  assert.strictEqual(generated.status, 'ready_for_review');
  return generated.envelope;
}

async function setupTempRepo(options: {
  currentMode: 'prior' | 'promoted' | 'wrongPayload';
}): Promise<{
  root: string;
  envelopePath: string;
  productionPath: string;
  productionBytesBefore: string;
  envelope: GhostFlowCandidateEnvelope;
}> {
  const root = join(tmpdir(), `gf-receipt-op-${randomBytes(8).toString('hex')}`);
  await mkdir(join(root, 'data', 'ghostflow', 'artifacts'), { recursive: true });
  await mkdir(join(root, 'tmp', 'ghostflow', 'candidates'), { recursive: true });

  const prior = loadTracked('systematicFlowProxy.v1.json');
  for (const name of ARTIFACTS) {
    const bytes = `${JSON.stringify(loadTracked(name), null, 2)}\n`;
    await writeFile(join(root, 'data', 'ghostflow', 'artifacts', name), bytes, 'utf8');
  }

  const envelope = await buildReadySystematicEnvelope(prior);
  const relative = 'data/ghostflow/artifacts/systematicFlowProxy.v1.json';
  const productionPath = join(root, relative);

  if (options.currentMode === 'promoted') {
    await writeFile(
      productionPath,
      `${JSON.stringify(envelope.proposedArtifact, null, 2)}\n`,
      'utf8'
    );
  } else if (options.currentMode === 'wrongPayload') {
    const wrong = JSON.parse(JSON.stringify(envelope.proposedArtifact)) as {
      basket: { basketScore: number };
    };
    wrong.basket.basketScore = 1;
    await writeFile(productionPath, `${JSON.stringify(wrong, null, 2)}\n`, 'utf8');
  }
  // prior mode: leave tracked prior production in place

  const envelopePath = join(
    root,
    'tmp',
    'ghostflow',
    'candidates',
    `${envelope.artifactId}.${envelope.normalizedObservation.observationAsOf}.${envelope.candidateIdentity.identityPrefix}.candidate.json`
  );
  await writeFile(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');

  return {
    root,
    envelopePath,
    productionPath,
    productionBytesBefore: await readFile(productionPath, 'utf8'),
    envelope,
  };
}

async function assertNoReceiptTree(root: string): Promise<void> {
  const receiptRoot = join(root, 'data', 'ghostflow', 'promotion-receipts');
  try {
    const entries = await readdir(receiptRoot);
    assert.strictEqual(entries.length, 0, 'receipt tree should be empty on dry-run/failure');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    assert.strictEqual(err.code, 'ENOENT');
  }
}

function assertNoTimestamps(receipt: GhostFlowPromotionReceiptV1): void {
  assert.ok(!('appliedAt' in receipt));
  assert.ok(!('recordedAt' in receipt));
  assert.strictEqual(receipt.reviewedEnvelopeBasename, undefined);
}

async function main(): Promise<void> {
  // B — dry run: full reconciliation, no mkdir/write, production unchanged
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const beforeHash = sha256(ctx.productionBytesBefore);
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: false,
      });
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.status, 'promotion_receipt_dry_run_ok');
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.summary.write, false);
      assert.strictEqual(
        result.summary.receiptPath,
        `data/ghostflow/promotion-receipts/systematicFlowProxy/${ctx.envelope.candidateIdentity.observationAsOf}.${ctx.envelope.candidateIdentity.identityPrefix}.receipt.json`
      );
      assertNoTimestamps(result.plan.receipt);
      await assertNoReceiptTree(ctx.root);
      const after = await readFile(ctx.productionPath, 'utf8');
      assert.strictEqual(sha256(after), beforeHash);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // C — write success + K basename omission + L timestamps + M production immutability
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const beforeHash = sha256(ctx.productionBytesBefore);
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.status, 'promotion_receipt_written');
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.summary.write, true);
      assertNoTimestamps(result.plan.receipt);

      const receiptBytes = await readFile(result.plan.receiptAbsolutePath, 'utf8');
      assert.strictEqual(receiptBytes, serializeGhostFlowPromotionReceipt(result.plan.receipt));
      const parsed = JSON.parse(receiptBytes) as GhostFlowPromotionReceiptV1;
      assert.strictEqual(parsed.reviewedEnvelopeBasename, undefined);
      assert.ok(!('appliedAt' in parsed));
      assert.ok(!('recordedAt' in parsed));

      const after = await readFile(ctx.productionPath, 'utf8');
      assert.strictEqual(sha256(after), beforeHash);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // D — idempotent retry via public operation
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const first = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(first.status, 'promotion_receipt_written');
      const bytes = await readFile(first.plan.receiptAbsolutePath, 'utf8');

      const second = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(second.ok, true);
      assert.strictEqual(second.status, 'promotion_receipt_already_exists');
      assert.strictEqual(second.exitCode, 0);
      assert.strictEqual(await readFile(first.plan.receiptAbsolutePath, 'utf8'), bytes);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // E — collision leaves existing untouched
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const first = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(first.ok, true);
      const conflicting = `${serializeGhostFlowPromotionReceipt(first.plan.receipt)}extra\n`;
      await writeFile(first.plan.receiptAbsolutePath, conflicting, 'utf8');

      const collision = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(collision.ok, false);
      if (!collision.ok) {
        assert.strictEqual(collision.status, 'promotion_receipt_collision');
        assert.strictEqual(collision.exitCode, 6);
      }
      assert.strictEqual(await readFile(first.plan.receiptAbsolutePath, 'utf8'), conflicting);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // F — not applied: current still prior → fail before write
  {
    const ctx = await setupTempRepo({ currentMode: 'prior' });
    try {
      const beforeHash = sha256(ctx.productionBytesBefore);
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.strictEqual(result.status, 'promotion_receipt_not_applied');
        assert.strictEqual(result.exitCode, 3);
      }
      await assertNoReceiptTree(ctx.root);
      assert.strictEqual(sha256(await readFile(ctx.productionPath, 'utf8')), beforeHash);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // G — current mismatch
  {
    const ctx = await setupTempRepo({ currentMode: 'wrongPayload' });
    try {
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.ok(
          result.status === 'promotion_receipt_current_mismatch' ||
            result.status === 'promotion_receipt_validation_failed'
        );
      }
      await assertNoReceiptTree(ctx.root);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // H — invalid envelope
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      await writeFile(ctx.envelopePath, '{not-json', 'utf8');
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
      });
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.strictEqual(result.status, 'promotion_receipt_envelope_invalid');
        assert.strictEqual(result.exitCode, 2);
      }
      await assertNoReceiptTree(ctx.root);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // I — mapper replay mismatch
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const badMapper: GhostFlowCandidateMapper<unknown, unknown> = {
        artifactId: 'systematicFlowProxy',
        map: () => ({
          ok: true,
          value: { ...(ctx.envelope.proposedArtifact as object), asOf: '1999-01-01' },
          issues: [],
        }),
      };
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: ctx.envelopePath,
        write: true,
        mapper: badMapper,
      });
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.ok(
          result.status === 'promotion_receipt_mapper_replay_mismatch' ||
            result.status === 'promotion_receipt_validation_failed'
        );
      }
      await assertNoReceiptTree(ctx.root);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  // J — path safety: envelope outside allowlist rejected before write
  {
    const ctx = await setupTempRepo({ currentMode: 'promoted' });
    try {
      const result = await recordGhostFlowPromotionReceipt({
        repoRoot: ctx.root,
        envelopePath: join(ctx.root, 'outside.candidate.json'),
        write: true,
      });
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.strictEqual(result.status, 'promotion_receipt_envelope_invalid');
      }
      await assertNoReceiptTree(ctx.root);
    } finally {
      await rm(ctx.root, { recursive: true, force: true });
    }
  }

  console.log('ghostflow/promotion/receiptOperation.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
