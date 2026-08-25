/**
 * Pure current-production artifact summarization for the GhostFlow operator runner.
 * Validates through existing artifact validators; extracts date metadata only.
 */

import { validateSystematicFlowProxyArtifact } from '../artifacts/systematicFlowProxy';
import { validateTreasuryFuturesPositioningProxyArtifact } from '../artifacts/treasuryFuturesPositioningProxy';
import { validateTreasuryLongEndIncomeLensArtifact } from '../artifacts/treasuryLongEndIncomeLens';
import type { GhostFlowRegisteredArtifactId } from './registry';
import type { GhostFlowCurrentArtifactSummary } from './report';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from './types';

/** Artifacts supported by current-artifact summarization (matches operator allowlist). */
export type GhostFlowOperatorSummarizableArtifactId = Extract<
  GhostFlowRegisteredArtifactId,
  'systematicFlowProxy' | 'treasuryFuturesPositioningProxy' | 'treasuryLongEndIncomeLens'
>;

function validateIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function okSummary(
  summary: GhostFlowCurrentArtifactSummary
): GhostFlowStageResult<GhostFlowCurrentArtifactSummary> {
  return { ok: true, value: summary, issues: [] };
}

function failSummary(
  issues: GhostFlowRefreshIssue[]
): GhostFlowStageResult<GhostFlowCurrentArtifactSummary> {
  return { ok: false, issues };
}

/**
 * Validate a current production artifact and return a date-only summary.
 * Does not expose score, basket, yield, or contract field values.
 */
export function summarizeCurrentGhostFlowArtifact(
  artifactId: GhostFlowOperatorSummarizableArtifactId,
  raw: unknown,
  artifactPath: string
): GhostFlowStageResult<GhostFlowCurrentArtifactSummary> {
  if (raw === undefined || raw === null) {
    return failSummary([
      validateIssue(
        'operator_current_artifact_parse_failed',
        `Current artifact payload missing for ${artifactId}`
      ),
    ]);
  }

  const base: GhostFlowCurrentArtifactSummary = { artifactId, artifactPath };

  switch (artifactId) {
    case 'systematicFlowProxy': {
      const result = validateSystematicFlowProxyArtifact(raw);
      if (!result.ok) {
        return failSummary([
          validateIssue(
            'operator_current_artifact_invalid',
            `Current systematicFlowProxy artifact failed validation: ${result.errors.join('; ')}`
          ),
        ]);
      }
      return okSummary({
        ...base,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
      });
    }
    case 'treasuryFuturesPositioningProxy': {
      const result = validateTreasuryFuturesPositioningProxyArtifact(raw, {
        mode: 'production',
      });
      if (!result.ok) {
        return failSummary([
          validateIssue(
            'operator_current_artifact_invalid',
            `Current treasuryFuturesPositioningProxy artifact failed validation: ${result.errors.join('; ')}`
          ),
        ]);
      }
      return okSummary({
        ...base,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
      });
    }
    case 'treasuryLongEndIncomeLens': {
      const result = validateTreasuryLongEndIncomeLensArtifact(raw, {
        mode: 'production',
      });
      if (!result.ok) {
        return failSummary([
          validateIssue(
            'operator_current_artifact_invalid',
            `Current treasuryLongEndIncomeLens artifact failed validation: ${result.errors.join('; ')}`
          ),
        ]);
      }
      return okSummary({
        ...base,
        observationAsOf: result.artifact.asOf,
        sourcePublishedAt: result.artifact.publishedAt,
      });
    }
    default: {
      const _exhaustive: never = artifactId;
      return failSummary([
        validateIssue(
          'operator_current_artifact_unsupported',
          `Unsupported operator artifact id: ${String(_exhaustive)}`
        ),
      ]);
    }
  }
}
