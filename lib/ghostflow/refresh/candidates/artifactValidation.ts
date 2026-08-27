import { validateSystematicFlowProxyArtifact } from '../../artifacts/systematicFlowProxy';
import { validateTreasuryFuturesPositioningProxyArtifact } from '../../artifacts/treasuryFuturesPositioningProxy';
import { validateTreasuryLongEndIncomeLensArtifact } from '../../artifacts/treasuryLongEndIncomeLens';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';
import { sha256HexFromCanonicalJson } from './canonicalJson';
import type { GhostFlowCandidateArtifactId } from './types';

export type GhostFlowValidatedProductionArtifact = {
  artifactId: GhostFlowCandidateArtifactId;
  validatorId: string;
  artifact: unknown;
  observationAsOf: string;
  sourcePublishedAt?: string;
  promotionPayloadSha256: string;
};

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function fail(
  code: string,
  message: string
): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue(code, message)] };
}

function success(
  validated: GhostFlowValidatedProductionArtifact
): GhostFlowStageResult<GhostFlowValidatedProductionArtifact> {
  return { ok: true, value: validated, issues: [] };
}

export function validateCurrentProductionArtifact(
  artifactId: GhostFlowCandidateArtifactId,
  raw: unknown,
  artifactPath: string
): GhostFlowStageResult<GhostFlowValidatedProductionArtifact & { artifactPath: string }> {
  void artifactPath;
  const validated = validateProposedProductionArtifact(artifactId, raw);
  if (!validated.ok) {
    return validated;
  }
  return {
    ok: true,
    value: { ...validated.value, artifactPath },
    issues: [],
  };
}

export function validateProposedProductionArtifact(
  artifactId: GhostFlowCandidateArtifactId,
  raw: unknown
): GhostFlowStageResult<GhostFlowValidatedProductionArtifact> {
  switch (artifactId) {
    case 'systematicFlowProxy': {
      const result = validateSystematicFlowProxyArtifact(raw);
      if (!result.ok) {
        return fail(
          'candidate_production_validator_failed',
          result.errors.join('; ')
        );
      }
      const hash = sha256HexFromCanonicalJson(result.artifact);
      if (!hash.ok) {
        return hash;
      }
      return success({
        artifactId,
        validatorId: 'validateSystematicFlowProxyArtifact',
        artifact: result.artifact,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
        promotionPayloadSha256: hash.value,
      });
    }
    case 'treasuryFuturesPositioningProxy': {
      const result = validateTreasuryFuturesPositioningProxyArtifact(raw, {
        mode: 'production',
      });
      if (!result.ok) {
        return fail(
          'candidate_production_validator_failed',
          result.errors.join('; ')
        );
      }
      const hash = sha256HexFromCanonicalJson(result.artifact);
      if (!hash.ok) {
        return hash;
      }
      return success({
        artifactId,
        validatorId: 'validateTreasuryFuturesPositioningProxyArtifact',
        artifact: result.artifact,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
        promotionPayloadSha256: hash.value,
      });
    }
    case 'treasuryLongEndIncomeLens': {
      const result = validateTreasuryLongEndIncomeLensArtifact(raw, {
        mode: 'production',
      });
      if (!result.ok) {
        return fail(
          'candidate_production_validator_failed',
          result.errors.join('; ')
        );
      }
      const hash = sha256HexFromCanonicalJson(result.artifact);
      if (!hash.ok) {
        return hash;
      }
      return success({
        artifactId,
        validatorId: 'validateTreasuryLongEndIncomeLensArtifact',
        artifact: result.artifact,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
        promotionPayloadSha256: hash.value,
      });
    }
    default: {
      const _exhaustive: never = artifactId;
      return fail(
        'candidate_unsupported_artifact',
        `Unsupported candidate artifact: ${String(_exhaustive)}`
      );
    }
  }
}
