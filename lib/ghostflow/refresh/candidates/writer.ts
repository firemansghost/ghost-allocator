import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { GhostFlowNormalizedObservation, GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';
import { validateProposedProductionArtifact } from './artifactValidation';
import { buildCandidateIdentity, candidateEnvelopeFilename } from './identity';
import type {
  GhostFlowCandidateEnvelope,
  GhostFlowCandidateGenerationSummary,
  GhostFlowCandidateStatus,
} from './types';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

export function resolveCandidateOutputDirectory(
  repoRoot: string,
  outDirRelative?: string
): GhostFlowStageResult<string> {
  const allowedRoot = resolve(repoRoot, 'tmp', 'ghostflow');
  const targetRelative = outDirRelative ?? join('tmp', 'ghostflow', 'candidates');
  const resolved = resolve(repoRoot, targetRelative);

  if (targetRelative.includes('..')) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_output_path_unsafe',
          'Output directory must not contain path traversal segments'
        ),
      ],
    };
  }

  if (resolved !== allowedRoot && !resolved.startsWith(`${allowedRoot}${sep}`)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_output_path_unsafe',
          `Output directory must resolve beneath ${allowedRoot}`
        ),
      ],
    };
  }

  return { ok: true, value: resolved, issues: [] };
}

export type GhostFlowCandidateWriteResult = {
  status: Extract<
    GhostFlowCandidateStatus,
    'ready_for_review' | 'revision_review_required' | 'candidate_already_exists' | 'candidate_identity_collision'
  >;
  exitCode: number;
  outputPath?: string;
  issues: GhostFlowRefreshIssue[];
};

function parseStoredEnvelope(raw: string): GhostFlowStageResult<GhostFlowCandidateEnvelope> {
  try {
    const parsed = JSON.parse(raw) as GhostFlowCandidateEnvelope;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.candidateIdentity ||
      typeof parsed.candidateIdentity.identitySha256 !== 'string' ||
      typeof parsed.proposedArtifact !== 'object' ||
      !parsed.normalizedObservation ||
      typeof parsed.normalizedObservation.provenance !== 'object'
    ) {
      return {
        ok: false,
        issues: [blockIssue('candidate_stored_envelope_invalid', 'Stored candidate envelope is malformed')],
      };
    }
    return { ok: true, value: parsed, issues: [] };
  } catch {
    return {
      ok: false,
      issues: [blockIssue('candidate_stored_envelope_invalid', 'Stored candidate envelope is not valid JSON')],
    };
  }
}

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
      issues: [
        blockIssue(
          'candidate_stored_envelope_invalid',
          rebuiltIdentity.message
        ),
      ],
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

async function reconcileExistingCandidateFile(
  targetPath: string,
  incoming: GhostFlowCandidateEnvelope
): Promise<GhostFlowCandidateWriteResult> {
  let raw: string;
  try {
    raw = await readFile(targetPath, 'utf8');
  } catch {
    return {
      status: 'candidate_identity_collision',
      exitCode: 6,
      issues: [blockIssue('candidate_stored_envelope_unreadable', 'Existing candidate file could not be read')],
    };
  }

  const stored = parseStoredEnvelope(raw);
  if (!stored.ok) {
    return {
      status: 'candidate_identity_collision',
      exitCode: 6,
      issues: stored.issues,
    };
  }

  const internal = reconcileStoredCandidateEnvelope(stored.value);
  if (!internal.ok) {
    return {
      status: 'candidate_identity_collision',
      exitCode: 6,
      outputPath: targetPath,
      issues: internal.issues,
    };
  }

  const storedIdentity = stored.value.candidateIdentity;
  const incomingIdentity = incoming.candidateIdentity;

  const identityMatches =
    storedIdentity.identitySha256 === incomingIdentity.identitySha256 &&
    storedIdentity.promotionPayloadSha256 === incomingIdentity.promotionPayloadSha256;

  if (identityMatches) {
    return {
      status: 'candidate_already_exists',
      exitCode: 0,
      outputPath: targetPath,
      issues: [],
    };
  }

  return {
    status: 'candidate_identity_collision',
    exitCode: 6,
    outputPath: targetPath,
    issues: [
      blockIssue(
        'candidate_identity_collision',
        'Existing candidate file occupies target path with a different full identity'
      ),
    ],
  };
}

export async function writeGhostFlowCandidateEnvelope(input: {
  repoRoot: string;
  outDirRelative?: string;
  envelope: GhostFlowCandidateEnvelope;
}): Promise<GhostFlowCandidateWriteResult> {
  const dirResult = resolveCandidateOutputDirectory(input.repoRoot, input.outDirRelative);
  if (!dirResult.ok) {
    return {
      status: 'candidate_identity_collision',
      exitCode: 1,
      issues: dirResult.issues,
    };
  }

  await mkdir(dirResult.value, { recursive: true });
  const filename = candidateEnvelopeFilename(input.envelope.candidateIdentity);
  const targetPath = join(dirResult.value, filename);
  const bytes = `${JSON.stringify(input.envelope, null, 2)}\n`;

  try {
    await writeFile(targetPath, bytes, { flag: 'wx' });
    return {
      status: input.envelope.status,
      exitCode: input.envelope.status === 'revision_review_required' ? 3 : 0,
      outputPath: targetPath,
      issues: [],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'EEXIST') {
      return {
        status: 'candidate_identity_collision',
        exitCode: 1,
        issues: [
          blockIssue(
            'candidate_write_failed',
            err.message ?? 'Unexpected filesystem error while writing candidate envelope'
          ),
        ],
      };
    }
    return reconcileExistingCandidateFile(targetPath, input.envelope);
  }
}

export function mergeWriteSummary(
  generation: GhostFlowCandidateGenerationSummary,
  write?: GhostFlowCandidateWriteResult
): GhostFlowCandidateGenerationSummary {
  if (!write) {
    return generation;
  }

  const writeIssueCodes = write.issues.map((issue) => issue.code);
  const mergedIssueCodes =
    writeIssueCodes.length > 0
      ? [...(generation.issueCodes ?? []), ...writeIssueCodes]
      : generation.issueCodes ?? [];

  return {
    ...generation,
    status: write.status,
    exitCode: write.exitCode,
    outputPath: write.outputPath,
    issueCodes: mergedIssueCodes.length > 0 ? mergedIssueCodes : undefined,
  };
}
