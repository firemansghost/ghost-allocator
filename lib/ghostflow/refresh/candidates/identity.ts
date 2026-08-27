import { isValidCalendarDate } from '../dateValidation';
import type { GhostFlowNormalizedObservation } from '../types';
import { sha256HexFromCanonicalJson } from './canonicalJson';
import type { GhostFlowCandidateArtifactId, GhostFlowCandidateIdentity } from './types';

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

export function isValidSha256Hex(value: string): boolean {
  return SHA256_HEX_RE.test(value);
}

export interface GhostFlowCandidateIdentityInput {
  artifactId: GhostFlowCandidateArtifactId;
  normalized: GhostFlowNormalizedObservation<unknown>;
  promotionPayloadSha256: string;
}

function identityFieldError(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

export function buildCandidateIdentity(
  input: GhostFlowCandidateIdentityInput
): { ok: true; identity: GhostFlowCandidateIdentity } | { ok: false; message: string } {
  const { artifactId, normalized, promotionPayloadSha256 } = input;
  const { provenance, observationAsOf } = normalized;

  if (!isValidSha256Hex(promotionPayloadSha256)) {
    return identityFieldError(
      'promotionPayloadSha256 must be a 64-character lowercase hexadecimal SHA-256 digest'
    );
  }

  if (!isValidSha256Hex(provenance.contentSha256)) {
    return identityFieldError('normalized provenance contentSha256 must be a valid SHA-256 hex digest');
  }

  if (typeof provenance.adapterId !== 'string' || provenance.adapterId.trim().length === 0) {
    return identityFieldError('normalized provenance adapterId must be a non-empty string');
  }

  if (typeof provenance.parserVersion !== 'string' || provenance.parserVersion.trim().length === 0) {
    return identityFieldError('normalized provenance parserVersion must be a non-empty string');
  }

  if (!isValidCalendarDate(observationAsOf)) {
    return identityFieldError('normalized observationAsOf must be a valid calendar date');
  }

  const identityTuple = {
    artifactId,
    observationAsOf,
    contentSha256: provenance.contentSha256,
    adapterId: provenance.adapterId,
    parserVersion: provenance.parserVersion,
    promotionPayloadSha256,
  };

  const identityHash = sha256HexFromCanonicalJson(identityTuple);
  if (!identityHash.ok) {
    return { ok: false, message: identityHash.issues[0]?.message ?? 'Identity hash failed' };
  }

  return {
    ok: true,
    identity: {
      artifactId,
      observationAsOf,
      contentSha256: provenance.contentSha256,
      adapterId: provenance.adapterId,
      parserVersion: provenance.parserVersion,
      promotionPayloadSha256,
      identitySha256: identityHash.value,
      identityPrefix: identityHash.value.slice(0, 12),
    },
  };
}

export function candidateEnvelopeFilename(identity: GhostFlowCandidateIdentity): string {
  return `${identity.artifactId}.${identity.observationAsOf}.${identity.identityPrefix}.candidate.json`;
}
