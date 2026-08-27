import { basename, resolve, sep } from 'node:path';
import type { GhostFlowCandidateArtifactId } from '../candidates/types';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

export type GhostFlowPromotionReceiptDestination = {
  relativePath: string;
  absolutePath: string;
  authorizedReceiptRoot: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const IDENTITY_PREFIX = /^[a-f0-9]{12}$/;
const ARTIFACT_ID = /^[A-Za-z][A-Za-z0-9]*$/;

/**
 * Resolve a Phase 1 promotion-receipt destination and prove it is STRICTLY
 * beneath <repoRoot>/data/ghostflow/promotion-receipts/.
 *
 * Destination is derived only from validated identity fields — callers cannot
 * supply an arbitrary receipt path.
 *
 * Fail closed: never sanitize, strip `..`, basename-fallback, or rewrite paths.
 */
export function resolvePromotionReceiptDestination(input: {
  repoRoot: string;
  artifactId: GhostFlowCandidateArtifactId | string;
  observationAsOf: string;
  identityPrefix: string;
}): GhostFlowStageResult<GhostFlowPromotionReceiptDestination> {
  const { artifactId, observationAsOf, identityPrefix } = input;

  if (typeof artifactId !== 'string' || !ARTIFACT_ID.test(artifactId)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_receipt_destination_unsafe',
          `Invalid artifactId for receipt path: ${String(artifactId)}`
        ),
      ],
    };
  }

  if (typeof observationAsOf !== 'string' || !ISO_DATE.test(observationAsOf)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_receipt_destination_unsafe',
          `Invalid observationAsOf for receipt path: ${String(observationAsOf)}`
        ),
      ],
    };
  }

  if (typeof identityPrefix !== 'string' || !IDENTITY_PREFIX.test(identityPrefix)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_receipt_destination_unsafe',
          `Invalid identityPrefix for receipt path: ${String(identityPrefix)}`
        ),
      ],
    };
  }

  const relativePath = [
    'data',
    'ghostflow',
    'promotion-receipts',
    artifactId,
    `${observationAsOf}.${identityPrefix}.receipt.json`,
  ].join('/');

  const repoRootResolved = resolve(input.repoRoot);
  const authorizedReceiptRoot = resolve(
    repoRootResolved,
    'data',
    'ghostflow',
    'promotion-receipts'
  );
  const absolutePath = resolve(repoRootResolved, relativePath);

  if (!absolutePath.startsWith(`${authorizedReceiptRoot}${sep}`)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_receipt_destination_unsafe',
          `Promotion receipt destination must resolve strictly beneath ${authorizedReceiptRoot}`
        ),
      ],
    };
  }

  // Must be a file under an artifact subdirectory, not the root itself.
  if (basename(absolutePath) !== `${observationAsOf}.${identityPrefix}.receipt.json`) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_receipt_destination_unsafe',
          'Promotion receipt destination basename mismatch'
        ),
      ],
    };
  }

  return {
    ok: true,
    value: {
      relativePath,
      absolutePath,
      authorizedReceiptRoot,
    },
    issues: [],
  };
}
