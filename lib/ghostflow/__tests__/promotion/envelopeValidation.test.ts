import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import { validateCandidateEnvelopeForPromotion } from '@/lib/ghostflow/refresh/promotion/envelopeValidation';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

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

async function buildReadyEnvelope(): Promise<GhostFlowCandidateEnvelope> {
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
  assert.strictEqual(generated.exitCode, 0);
  return generated.envelope;
}

async function main(): Promise<void> {
  const ready = await buildReadyEnvelope();
  const accepted = validateCandidateEnvelopeForPromotion(ready);
  assert.strictEqual(accepted.ok, true);

  const revision = { ...ready, status: 'revision_review_required' as const };
  const revisionRejected = validateCandidateEnvelopeForPromotion(revision);
  assert.strictEqual(revisionRejected.ok, false);
  if (!revisionRejected.ok) {
    assert.ok(
      revisionRejected.issues.some((issue) => issue.code === 'promotion_candidate_status_ineligible')
    );
  }

  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({ ...ready, candidateVersion: '99' }).ok,
    false
  );
  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({ ...ready, artifactSchemaVersion: '2' }).ok,
    false
  );
  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({ ...ready, generationMode: 'other' }).ok,
    false
  );
  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({ ...ready, humanReviewRequired: false }).ok,
    false
  );
  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({ ...ready, artifactId: 'volatilityRegime' }).ok,
    false
  );

  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({
      ...ready,
      candidateIdentity: { broken: true },
    }).ok,
    false
  );

  const tamperedIdentityHash = {
    ...ready,
    candidateIdentity: {
      ...ready.candidateIdentity,
      identitySha256: '1'.repeat(64),
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedIdentityHash).ok, false);

  const tamperedPrefix = {
    ...ready,
    candidateIdentity: {
      ...ready.candidateIdentity,
      identityPrefix: 'deadbeefdead',
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedPrefix).ok, false);

  const tamperedProposed = {
    ...ready,
    proposedArtifact: {
      ...(ready.proposedArtifact as object),
      asOf: '2099-01-01',
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedProposed).ok, false);

  const tamperedContent = {
    ...ready,
    normalizedObservation: {
      ...ready.normalizedObservation,
      provenance: {
        ...ready.normalizedObservation.provenance,
        contentSha256: '0'.repeat(64),
      },
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedContent).ok, false);

  const tamperedAdapter = {
    ...ready,
    normalizedObservation: {
      ...ready.normalizedObservation,
      provenance: {
        ...ready.normalizedObservation.provenance,
        adapterId: 'tampered-adapter',
      },
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedAdapter).ok, false);

  const tamperedParser = {
    ...ready,
    normalizedObservation: {
      ...ready.normalizedObservation,
      provenance: {
        ...ready.normalizedObservation.provenance,
        parserVersion: '9.9.9',
      },
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(tamperedParser).ok, false);

  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({
      ...ready,
      currentProduction: { bad: true },
    }).ok,
    false
  );

  const mismatchedCurrentArtifact = {
    ...ready,
    currentProduction: {
      ...ready.currentProduction,
      artifactId: 'treasuryLongEndIncomeLens' as const,
    },
  };
  assert.strictEqual(validateCandidateEnvelopeForPromotion(mismatchedCurrentArtifact).ok, false);

  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({
      ...ready,
      validation: { ...ready.validation, ok: false },
    }).ok,
    false
  );
  assert.strictEqual(
    validateCandidateEnvelopeForPromotion({
      ...ready,
      validation: { ...ready.validation, errors: ['x'] },
    }).ok,
    false
  );

  console.log('ghostflow/promotion/envelopeValidation.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
