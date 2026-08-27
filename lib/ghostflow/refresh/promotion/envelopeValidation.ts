import { isValidCalendarDate } from '../dateValidation';
import { reconcileStoredCandidateEnvelope } from '../candidates/envelopeIntegrity';
import { isValidSha256Hex } from '../candidates/identity';
import {
  GHOSTFLOW_CANDIDATE_ARTIFACT_IDS,
  GHOSTFLOW_CANDIDATE_ENVELOPE_VERSION,
  type GhostFlowCandidateArtifactId,
  type GhostFlowCandidateEnvelope,
} from '../candidates/types';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';

const ARTIFACT_ALLOWLIST = new Set<string>(GHOSTFLOW_CANDIDATE_ARTIFACT_IDS);

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function fail(code: string, message: string): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue(code, message)] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRelativeRepoPath(value: string): boolean {
  if (value.trim().length === 0) return false;
  if (value.includes('..')) return false;
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('/') || value.startsWith('\\')) {
    return false;
  }
  return true;
}

/**
 * Fail-closed structural + eligibility + integrity validation for promotion.
 * Starts from unknown; does not trust TypeScript casts.
 */
export function validateCandidateEnvelopeForPromotion(
  raw: unknown
): GhostFlowStageResult<GhostFlowCandidateEnvelope> {
  if (!isPlainObject(raw)) {
    return fail('promotion_envelope_invalid', 'Envelope must be a JSON object');
  }

  if (raw.candidateVersion !== GHOSTFLOW_CANDIDATE_ENVELOPE_VERSION) {
    return fail(
      'promotion_envelope_invalid',
      `Unsupported candidateVersion: ${String(raw.candidateVersion)}`
    );
  }

  if (raw.artifactSchemaVersion !== '1') {
    return fail(
      'promotion_envelope_invalid',
      `Unsupported artifactSchemaVersion: ${String(raw.artifactSchemaVersion)}`
    );
  }

  if (raw.generationMode !== 'operator_fetch') {
    return fail(
      'promotion_envelope_invalid',
      `Unsupported generationMode: ${String(raw.generationMode)}`
    );
  }

  if (raw.humanReviewRequired !== true) {
    return fail(
      'promotion_envelope_invalid',
      'humanReviewRequired must be true for promotion'
    );
  }

  if (raw.status === 'revision_review_required') {
    return fail(
      'promotion_candidate_status_ineligible',
      'revision_review_required candidates are not eligible for promotion'
    );
  }

  if (raw.status !== 'ready_for_review') {
    return fail(
      'promotion_candidate_status_ineligible',
      `Candidate status is not eligible for promotion: ${String(raw.status)}`
    );
  }

  if (!isNonEmptyString(raw.artifactId) || !ARTIFACT_ALLOWLIST.has(raw.artifactId)) {
    return fail(
      'promotion_envelope_invalid',
      `Unsupported or missing artifactId: ${String(raw.artifactId)}`
    );
  }
  const artifactId = raw.artifactId as GhostFlowCandidateArtifactId;

  if (!isPlainObject(raw.currentProduction)) {
    return fail('promotion_envelope_invalid', 'currentProduction must be an object');
  }
  if (!isPlainObject(raw.candidateIdentity)) {
    return fail('promotion_envelope_invalid', 'candidateIdentity must be an object');
  }
  if (!isPlainObject(raw.normalizedObservation)) {
    return fail('promotion_envelope_invalid', 'normalizedObservation must be an object');
  }
  if (!isPlainObject(raw.normalizedObservation.provenance)) {
    return fail('promotion_envelope_invalid', 'normalizedObservation.provenance must be an object');
  }
  if (!isPlainObject(raw.proposedArtifact)) {
    return fail('promotion_envelope_invalid', 'proposedArtifact must be an object');
  }
  if (!isPlainObject(raw.validation)) {
    return fail('promotion_envelope_invalid', 'validation must be an object');
  }
  if (!isPlainObject(raw.diff)) {
    return fail('promotion_envelope_invalid', 'diff must be an object');
  }

  if (raw.validation.ok !== true) {
    return fail('promotion_envelope_invalid', 'validation.ok must be true');
  }
  if (!isNonEmptyString(raw.validation.validatorId)) {
    return fail('promotion_envelope_invalid', 'validation.validatorId must be a non-empty string');
  }
  if (!Array.isArray(raw.validation.errors)) {
    return fail('promotion_envelope_invalid', 'validation.errors must be an array');
  }
  if (raw.validation.errors.length !== 0) {
    return fail('promotion_envelope_invalid', 'validation.errors must be empty');
  }

  const currentProduction = raw.currentProduction;
  if (
    !isNonEmptyString(currentProduction.artifactId) ||
    !ARTIFACT_ALLOWLIST.has(currentProduction.artifactId)
  ) {
    return fail('promotion_envelope_invalid', 'currentProduction.artifactId is invalid');
  }
  if (currentProduction.artifactId !== artifactId) {
    return fail(
      'promotion_envelope_invalid',
      'currentProduction.artifactId must match envelope artifactId'
    );
  }
  if (
    !isNonEmptyString(currentProduction.artifactPath) ||
    !isRelativeRepoPath(currentProduction.artifactPath)
  ) {
    return fail(
      'promotion_envelope_invalid',
      'currentProduction.artifactPath must be a non-empty relative repository path'
    );
  }
  if (
    !isNonEmptyString(currentProduction.observationAsOf) ||
    !isValidCalendarDate(currentProduction.observationAsOf)
  ) {
    return fail(
      'promotion_envelope_invalid',
      'currentProduction.observationAsOf must be a valid calendar date'
    );
  }
  if (
    !isNonEmptyString(currentProduction.promotionPayloadSha256) ||
    !isValidSha256Hex(currentProduction.promotionPayloadSha256)
  ) {
    return fail(
      'promotion_envelope_invalid',
      'currentProduction.promotionPayloadSha256 must be a valid SHA-256 hex digest'
    );
  }
  if (
    currentProduction.sourcePublishedAt !== undefined &&
    (typeof currentProduction.sourcePublishedAt !== 'string' ||
      !isValidCalendarDate(currentProduction.sourcePublishedAt))
  ) {
    return fail(
      'promotion_envelope_invalid',
      'currentProduction.sourcePublishedAt must be a valid calendar date when present'
    );
  }

  const envelope = raw as unknown as GhostFlowCandidateEnvelope;
  const integrity = reconcileStoredCandidateEnvelope(envelope);
  if (!integrity.ok) {
    return integrity;
  }

  return { ok: true, value: envelope, issues: [] };
}
