import type { GhostFlowNormalizedObservation, GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';
import { validateProposedProductionArtifact } from './artifactValidation';
import { buildCandidateIdentity } from './identity';
import type { GhostFlowCandidateEnvelope } from './types';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

/**
 * Pure stored-envelope integrity reconciliation.
 * Shared by candidate writer (EEXIST) and promotion eligibility validation.
 * Does not perform filesystem I/O.
 */
export function reconcileStoredCandidateEnvelope(
  storedEnvelope: GhostFlowCandidateEnvelope
): GhostFlowStageResult<true> {
  const { artifactId, normalizedObservation, candidateIdentity, proposedArtifact } = storedEnvelope;
  const provenance = normalizedObservation.provenance;

  if (normalizedObservation.artifactId !== artifactId) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored normalizedObservation.artifactId must match envelope artifactId'
        ),
      ],
    };
  }

  if (candidateIdentity.artifactId !== artifactId) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.artifactId must match envelope artifactId'
        ),
      ],
    };
  }

  if (candidateIdentity.observationAsOf !== normalizedObservation.observationAsOf) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.observationAsOf must match normalizedObservation.observationAsOf'
        ),
      ],
    };
  }

  if (candidateIdentity.contentSha256 !== provenance.contentSha256) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.contentSha256 must match normalized provenance contentSha256'
        ),
      ],
    };
  }

  if (candidateIdentity.adapterId !== provenance.adapterId) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.adapterId must match normalized provenance adapterId'
        ),
      ],
    };
  }

  if (candidateIdentity.parserVersion !== provenance.parserVersion) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.parserVersion must match normalized provenance parserVersion'
        ),
      ],
    };
  }

  if (candidateIdentity.identityPrefix !== candidateIdentity.identitySha256.slice(0, 12)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          'Stored candidateIdentity.identityPrefix must equal identitySha256.slice(0, 12)'
        ),
      ],
    };
  }

  const storedValidated = validateProposedProductionArtifact(artifactId, proposedArtifact);
  if (!storedValidated.ok) {
    return storedValidated;
  }

  if (storedValidated.value.promotionPayloadSha256 !== candidateIdentity.promotionPayloadSha256) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_payload_hash_mismatch',
          'Stored proposedArtifact does not reconcile with candidateIdentity.promotionPayloadSha256'
        ),
      ],
    };
  }

  const rebuiltIdentity = buildCandidateIdentity({
    artifactId,
    normalized: normalizedObservation as GhostFlowNormalizedObservation<unknown>,
    promotionPayloadSha256: storedValidated.value.promotionPayloadSha256,
  });
  if (!rebuiltIdentity.ok) {
    return {
      ok: false,
      issues: [blockIssue('candidate_stored_envelope_invalid', rebuiltIdentity.message)],
    };
  }

  if (rebuiltIdentity.identity.identitySha256 !== candidateIdentity.identitySha256) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_identity_mismatch',
          'Stored candidateIdentity.identitySha256 does not recompute from stored normalized provenance'
        ),
      ],
    };
  }

  return { ok: true, value: true, issues: [] };
}
