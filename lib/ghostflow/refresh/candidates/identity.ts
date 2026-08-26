import type { GhostFlowNormalizedObservation } from '../types';
import { sha256HexFromCanonicalJson } from './canonicalJson';
import type { GhostFlowCandidateArtifactId, GhostFlowCandidateIdentity } from './types';

export interface GhostFlowCandidateIdentityInput {
  artifactId: GhostFlowCandidateArtifactId;
  normalized: GhostFlowNormalizedObservation<unknown>;
  promotionPayloadSha256: string;
}

export function buildCandidateIdentity(
  input: GhostFlowCandidateIdentityInput
): { ok: true; identity: GhostFlowCandidateIdentity } | { ok: false; message: string } {
  const { artifactId, normalized, promotionPayloadSha256 } = input;
  const { provenance, observationAsOf } = normalized;

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
