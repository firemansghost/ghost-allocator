import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import { sha256HexFromCanonicalJson } from '@/lib/ghostflow/refresh/candidates/canonicalJson';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { buildGhostFlowPromotionReceiptPlan } from '@/lib/ghostflow/refresh/promotion/receiptPlan';
import {
  serializeGhostFlowPromotionReceipt,
  type GhostFlowPromotionReceiptV1,
} from '@/lib/ghostflow/refresh/promotion/receiptTypes';
import type { GhostFlowCandidateMapper } from '@/lib/ghostflow/refresh/types';
import {
  fixtureH15Normalized,
  fixtureSystematicNormalized,
  fixtureTreasuryNormalized,
} from '../fixtures/candidateMapperFixtures';

function loadProduction(name: string): unknown {
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
  priorProduction: unknown;
  proposedArtifact: unknown;
}> {
  const production = loadProduction('systematicFlowProxy.v1.json') as { asOf: string };
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
  assert.strictEqual(generated.status, 'ready_for_review');
  return {
    envelope: generated.envelope,
    priorProduction: production,
    proposedArtifact: generated.envelope.proposedArtifact,
  };
}

async function buildReadyTreasuryEnvelope(): Promise<{
  envelope: GhostFlowCandidateEnvelope;
  proposedArtifact: unknown;
}> {
  const production = loadProduction('treasuryFuturesPositioningProxy.v1.json') as {
    asOf: string;
  };
  const newerAsOf = nextCalendarDay(production.asOf);
  const normalized = fixtureTreasuryNormalized();
  normalized.observationAsOf = newerAsOf;
  normalized.provenance.observationAsOf = newerAsOf;
  for (const contract of [
    ...normalized.fields.coreContracts,
    ...normalized.fields.optionalContextContracts,
  ]) {
    contract.observations.reportDate = newerAsOf;
  }

  const generated = await generateGhostFlowCandidate({
    artifactId: 'treasuryFuturesPositioningProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: production,
    injectNormalized: normalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');
  assert.strictEqual(generated.status, 'ready_for_review');
  return {
    envelope: generated.envelope,
    proposedArtifact: generated.envelope.proposedArtifact,
  };
}

async function buildReadyLongEndEnvelope(): Promise<{
  envelope: GhostFlowCandidateEnvelope;
  proposedArtifact: unknown;
}> {
  const production = loadProduction('treasuryLongEndIncomeLens.v1.json') as { asOf: string };
  const newerAsOf = nextCalendarDay(production.asOf);
  const normalized = fixtureH15Normalized();
  normalized.observationAsOf = newerAsOf;
  normalized.provenance.observationAsOf = newerAsOf;

  const generated = await generateGhostFlowCandidate({
    artifactId: 'treasuryLongEndIncomeLens',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: production,
    injectNormalized: normalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');
  assert.strictEqual(generated.status, 'ready_for_review');
  return {
    envelope: generated.envelope,
    proposedArtifact: generated.envelope.proposedArtifact,
  };
}

function assertNoTimestamps(receipt: GhostFlowPromotionReceiptV1): void {
  assert.ok(!('appliedAt' in receipt));
  assert.ok(!('recordedAt' in receipt));
  const json = serializeGhostFlowPromotionReceipt(receipt);
  assert.ok(!json.includes('"appliedAt"'));
  assert.ok(!json.includes('"recordedAt"'));
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const { envelope, priorProduction, proposedArtifact } =
    await buildReadySystematicEnvelope();

  // A. Valid post-apply reconciliation
  const applied = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: proposedArtifact,
    reviewedEnvelopePath:
      'tmp/ghostflow/candidates/systematicFlowProxy.2026-08-19.deadbeefdead.candidate.json',
  });
  assert.strictEqual(applied.ok, true);
  if (!applied.ok) throw new Error('unreachable');
  assert.strictEqual(applied.status, 'promotion_receipt_plan_ok');
  assert.strictEqual(applied.plan.receipt.receiptVersion, '1');
  assert.strictEqual(applied.plan.receipt.artifactId, 'systematicFlowProxy');
  assert.strictEqual(
    applied.plan.receipt.candidateIdentitySha256,
    envelope.candidateIdentity.identitySha256
  );
  assert.strictEqual(
    applied.plan.receipt.candidateIdentityPrefix,
    envelope.candidateIdentity.identityPrefix
  );
  assert.strictEqual(
    applied.plan.receipt.candidateObservationAsOf,
    envelope.candidateIdentity.observationAsOf
  );
  assert.strictEqual(
    applied.plan.receipt.candidatePromotionPayloadSha256,
    envelope.candidateIdentity.promotionPayloadSha256
  );
  assert.deepStrictEqual(applied.plan.receipt.sourceProvenance, {
    sourceId: envelope.normalizedObservation.provenance.sourceId,
    sourceLocator: envelope.normalizedObservation.provenance.sourceLocator,
    contentSha256: envelope.normalizedObservation.provenance.contentSha256,
    adapterId: envelope.normalizedObservation.provenance.adapterId,
    parserVersion: envelope.normalizedObservation.provenance.parserVersion,
  });
  assert.strictEqual(
    applied.plan.receipt.priorProduction.observationAsOf,
    envelope.currentProduction.observationAsOf
  );
  assert.strictEqual(
    applied.plan.receipt.priorProduction.promotionPayloadSha256,
    envelope.currentProduction.promotionPayloadSha256
  );
  assert.strictEqual(
    applied.plan.receipt.priorProduction.artifactPath,
    envelope.currentProduction.artifactPath
  );
  assert.strictEqual(
    applied.plan.receipt.promotedProduction.observationAsOf,
    envelope.candidateIdentity.observationAsOf
  );
  assert.strictEqual(
    applied.plan.receipt.promotedProduction.promotionPayloadSha256,
    envelope.candidateIdentity.promotionPayloadSha256
  );
  assert.strictEqual(
    applied.plan.receiptRelativePath,
    `data/ghostflow/promotion-receipts/systematicFlowProxy/${envelope.candidateIdentity.observationAsOf}.${envelope.candidateIdentity.identityPrefix}.receipt.json`
  );
  assert.strictEqual(
    applied.plan.receipt.reviewedEnvelopeBasename,
    'systematicFlowProxy.2026-08-19.deadbeefdead.candidate.json'
  );
  assertNoTimestamps(applied.plan.receipt);

  // J. Determinism
  const again = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: proposedArtifact,
    reviewedEnvelopePath:
      'tmp/ghostflow/candidates/systematicFlowProxy.2026-08-19.deadbeefdead.candidate.json',
  });
  assert.strictEqual(again.ok, true);
  if (!again.ok) throw new Error('unreachable');
  assert.deepStrictEqual(again.plan.receipt, applied.plan.receipt);
  assert.strictEqual(
    serializeGhostFlowPromotionReceipt(again.plan.receipt),
    serializeGhostFlowPromotionReceipt(applied.plan.receipt)
  );

  // B. Current production not yet applied
  const notApplied = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: priorProduction,
  });
  assert.strictEqual(notApplied.ok, false);
  if (notApplied.ok) throw new Error('unreachable');
  assert.strictEqual(notApplied.status, 'promotion_receipt_not_applied');
  assert.ok(
    notApplied.issues.some((issue) => issue.code === 'promotion_receipt_not_applied')
  );

  // C. Wrong current payload (same asOf, different hash)
  const wrongPayload = JSON.parse(JSON.stringify(proposedArtifact)) as {
    asOf: string;
    basket: { basketScore: number };
  };
  wrongPayload.basket.basketScore = 1;
  const wrongPayloadPlan = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: wrongPayload,
  });
  assert.strictEqual(wrongPayloadPlan.ok, false);
  if (wrongPayloadPlan.ok) throw new Error('unreachable');
  assert.ok(
    wrongPayloadPlan.status === 'promotion_receipt_current_mismatch' ||
      wrongPayloadPlan.status === 'promotion_receipt_validation_failed'
  );

  // D. Wrong current date
  const wrongDate = JSON.parse(JSON.stringify(proposedArtifact)) as {
    asOf: string;
    scoreContracts: Array<{ observations: { reportDate: string } }>;
    vixContext: { observations: { reportDate: string } };
  };
  wrongDate.asOf = '2099-01-01';
  for (const c of wrongDate.scoreContracts) {
    c.observations.reportDate = '2099-01-01';
  }
  wrongDate.vixContext.observations.reportDate = '2099-01-01';
  const wrongDatePlan = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: wrongDate,
  });
  assert.strictEqual(wrongDatePlan.ok, false);
  if (wrongDatePlan.ok) throw new Error('unreachable');
  assert.ok(
    wrongDatePlan.status === 'promotion_receipt_current_mismatch' ||
      wrongDatePlan.status === 'promotion_receipt_validation_failed'
  );

  // E. Mapper replay mismatch
  const badMapper: GhostFlowCandidateMapper<unknown, unknown> = {
    artifactId: 'systematicFlowProxy',
    map: () => ({
      ok: true,
      value: { ...((proposedArtifact as object) ?? {}), asOf: '2000-01-01' },
      issues: [],
    }),
  };
  const mapperMismatch = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope,
    currentProductionRaw: proposedArtifact,
    mapper: badMapper,
  });
  assert.strictEqual(mapperMismatch.ok, false);
  if (mapperMismatch.ok) throw new Error('unreachable');
  assert.ok(
    mapperMismatch.status === 'promotion_receipt_mapper_replay_mismatch' ||
      mapperMismatch.status === 'promotion_receipt_validation_failed'
  );

  // F. Invalid / ineligible envelope
  const revision = {
    ...envelope,
    status: 'revision_review_required' as const,
  };
  const revisionPlan = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope: revision,
    currentProductionRaw: proposedArtifact,
  });
  assert.strictEqual(revisionPlan.ok, false);
  if (revisionPlan.ok) throw new Error('unreachable');
  assert.strictEqual(revisionPlan.status, 'promotion_receipt_ineligible');

  const tamperedIdentity = {
    ...envelope,
    candidateIdentity: {
      ...envelope.candidateIdentity,
      identitySha256: '1'.repeat(64),
    },
  };
  const badIdentity = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope: tamperedIdentity,
    currentProductionRaw: proposedArtifact,
  });
  assert.strictEqual(badIdentity.ok, false);
  if (badIdentity.ok) throw new Error('unreachable');
  assert.strictEqual(badIdentity.status, 'promotion_receipt_envelope_invalid');

  // Treasury + Long-End smoke: valid post-apply
  const treasury = await buildReadyTreasuryEnvelope();
  const treasuryPlan = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope: treasury.envelope,
    currentProductionRaw: treasury.proposedArtifact,
  });
  assert.strictEqual(treasuryPlan.ok, true);
  if (!treasuryPlan.ok) throw new Error('unreachable');
  assert.strictEqual(treasuryPlan.plan.receipt.artifactId, 'treasuryFuturesPositioningProxy');
  assertNoTimestamps(treasuryPlan.plan.receipt);

  const longEnd = await buildReadyLongEndEnvelope();
  const longEndPlan = buildGhostFlowPromotionReceiptPlan({
    repoRoot,
    envelope: longEnd.envelope,
    currentProductionRaw: longEnd.proposedArtifact,
  });
  assert.strictEqual(longEndPlan.ok, true);
  if (!longEndPlan.ok) throw new Error('unreachable');
  assert.strictEqual(longEndPlan.plan.receipt.artifactId, 'treasuryLongEndIncomeLens');
  assertNoTimestamps(longEndPlan.plan.receipt);

  // Canonical hash of receipt is stable
  const hashA = sha256HexFromCanonicalJson(applied.plan.receipt);
  const hashB = sha256HexFromCanonicalJson(again.plan.receipt);
  assert.ok(hashA.ok && hashB.ok);
  if (!hashA.ok || !hashB.ok) throw new Error('unreachable');
  assert.strictEqual(hashA.value, hashB.value);

  console.log('ghostflow/promotion/receiptPlan.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
