import type {
  GhostFlowCandidateMapperInput,
  GhostFlowRefreshIssue,
  GhostFlowStageResult,
} from '../types';

export function mapperBlockIssue(
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

export function mapperFail(code: string, message: string): GhostFlowStageResult<never> {
  return { ok: false, issues: [mapperBlockIssue(code, message)] };
}

export function provenanceFail(code: string, message: string): CandidateMapperProvenanceResult {
  return { ok: false, issues: [mapperBlockIssue(code, message)] };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;

export interface CandidateMapperProvenanceExpectations {
  expectedArtifactId: string;
  expectedSourceFamilyId: string;
  expectedAdapterId: string;
  expectedParserVersion: string;
  expectedSourceLocator: string;
}

export type CandidateMapperProvenanceOk = { ok: true; observationAsOf: string };

export type CandidateMapperProvenanceResult =
  | CandidateMapperProvenanceOk
  | { ok: false; issues: GhostFlowRefreshIssue[] };

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m! - 1 &&
    date.getUTCDate() === d
  );
}

function isValidIsoTimestamp(value: string): boolean {
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

export function reconcileCandidateMapperProvenance<TFields>(
  input: GhostFlowCandidateMapperInput<TFields>,
  expectations: CandidateMapperProvenanceExpectations
): CandidateMapperProvenanceResult {
  const { normalized, registryEntry } = input;
  const {
    expectedArtifactId,
    expectedSourceFamilyId,
    expectedAdapterId,
    expectedParserVersion,
    expectedSourceLocator,
  } = expectations;

  if (registryEntry.artifactId !== expectedArtifactId) {
    return provenanceFail(
      'candidate_mapper_registry_mismatch',
      `Registry entry artifactId must be ${expectedArtifactId}`
    );
  }

  if (normalized.artifactId !== expectedArtifactId) {
    return provenanceFail(
      'candidate_mapper_artifact_mismatch',
      `Normalized observation artifactId must be ${expectedArtifactId}`
    );
  }

  if (registryEntry.adapter.implementationStatus !== 'implemented') {
    return provenanceFail(
      'candidate_mapper_adapter_mismatch',
      `Registry adapter ${registryEntry.adapter.adapterId} is not implemented`
    );
  }

  if (registryEntry.adapter.adapterId !== expectedAdapterId) {
    return provenanceFail(
      'candidate_mapper_adapter_mismatch',
      `Registry adapterId must be ${expectedAdapterId}`
    );
  }

  if (registryEntry.adapter.parserVersion !== expectedParserVersion) {
    return provenanceFail(
      'candidate_mapper_parser_version_mismatch',
      `Registry parserVersion must be ${expectedParserVersion}`
    );
  }

  if (registryEntry.canonicalSource.sourceFamilyId !== expectedSourceFamilyId) {
    return provenanceFail(
      'candidate_mapper_source_family_mismatch',
      `Registry sourceFamilyId must be ${expectedSourceFamilyId}`
    );
  }

  const { provenance } = normalized;

  if (provenance.sourceId !== expectedSourceFamilyId) {
    return provenanceFail(
      'candidate_mapper_source_family_mismatch',
      `Provenance sourceId must be ${expectedSourceFamilyId}`
    );
  }

  if (provenance.adapterId !== expectedAdapterId) {
    return provenanceFail(
      'candidate_mapper_adapter_mismatch',
      `Provenance adapterId must be ${expectedAdapterId}`
    );
  }

  if (provenance.adapterId !== registryEntry.adapter.adapterId) {
    return provenanceFail(
      'candidate_mapper_adapter_mismatch',
      'Provenance adapterId must match registry adapterId'
    );
  }

  if (provenance.parserVersion !== expectedParserVersion) {
    return provenanceFail(
      'candidate_mapper_parser_version_mismatch',
      `Provenance parserVersion must be ${expectedParserVersion}`
    );
  }

  if (provenance.parserVersion !== registryEntry.adapter.parserVersion) {
    return provenanceFail(
      'candidate_mapper_parser_version_mismatch',
      'Provenance parserVersion must match registry parserVersion'
    );
  }

  if (provenance.sourceLocator !== expectedSourceLocator) {
    return provenanceFail(
      'candidate_mapper_source_locator_mismatch',
      `Provenance sourceLocator must be ${expectedSourceLocator}`
    );
  }

  if (!isValidIsoTimestamp(provenance.retrievedAt)) {
    return provenanceFail(
      'candidate_mapper_invalid_provenance',
      'Provenance retrievedAt must be a valid ISO timestamp'
    );
  }

  if (!SHA256_HEX_RE.test(provenance.contentSha256)) {
    return provenanceFail(
      'candidate_mapper_invalid_provenance',
      'Provenance contentSha256 must be a 64-character SHA-256 hex digest'
    );
  }

  if (!provenance.observationAsOf) {
    return provenanceFail(
      'candidate_mapper_observation_date_mismatch',
      'Provenance observationAsOf is required'
    );
  }

  if (!isValidIsoDate(normalized.observationAsOf)) {
    return provenanceFail(
      'candidate_mapper_invalid_provenance',
      'Normalized observationAsOf must be a valid YYYY-MM-DD date'
    );
  }

  if (!isValidIsoDate(provenance.observationAsOf)) {
    return provenanceFail(
      'candidate_mapper_invalid_provenance',
      'Provenance observationAsOf must be a valid YYYY-MM-DD date'
    );
  }

  if (provenance.observationAsOf !== normalized.observationAsOf) {
    return provenanceFail(
      'candidate_mapper_observation_date_mismatch',
      'Provenance observationAsOf must equal normalized observationAsOf'
    );
  }

  return { ok: true, observationAsOf: normalized.observationAsOf };
}
