import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';
import { sha256HexFromCanonicalJson } from './canonicalJson';
import { candidateEnvelopeFilename } from './identity';
import { validateProposedProductionArtifact } from './artifactValidation';
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
      typeof parsed.proposedArtifact !== 'object'
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

  const storedEnvelope = stored.value;
  const storedValidated = validateProposedProductionArtifact(
    storedEnvelope.artifactId,
    storedEnvelope.proposedArtifact
  );
  if (!storedValidated.ok) {
    return {
      status: 'candidate_identity_collision',
      exitCode: 6,
      issues: storedValidated.issues,
    };
  }

  const storedIdentity = storedEnvelope.candidateIdentity;
  const incomingIdentity = incoming.candidateIdentity;

  const identityMatches =
    storedIdentity.identitySha256 === incomingIdentity.identitySha256 &&
    storedIdentity.promotionPayloadSha256 === incomingIdentity.promotionPayloadSha256 &&
    storedIdentity.contentSha256 === incomingIdentity.contentSha256 &&
    storedIdentity.adapterId === incomingIdentity.adapterId &&
    storedIdentity.parserVersion === incomingIdentity.parserVersion &&
    storedIdentity.observationAsOf === incomingIdentity.observationAsOf &&
    storedIdentity.artifactId === incomingIdentity.artifactId;

  const payloadMatches =
    storedValidated.value.promotionPayloadSha256 === incomingIdentity.promotionPayloadSha256;

  if (identityMatches && payloadMatches) {
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
  return {
    ...generation,
    status: write.status,
    exitCode: write.exitCode,
    outputPath: write.outputPath,
  };
}

export async function verifyStoredCandidatePayload(
  envelope: GhostFlowCandidateEnvelope
): Promise<GhostFlowStageResult<true>> {
  const hash = sha256HexFromCanonicalJson(envelope.proposedArtifact);
  if (!hash.ok) {
    return hash;
  }
  if (hash.value !== envelope.candidateIdentity.promotionPayloadSha256) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'candidate_stored_payload_hash_mismatch',
          'Stored proposedArtifact does not reconcile with promotionPayloadSha256'
        ),
      ],
    };
  }
  return { ok: true, value: true, issues: [] };
}
