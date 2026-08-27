import { resolve, sep } from 'node:path';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

export type GhostFlowPromotionRegistryDestination = {
  relativePath: string;
  absolutePath: string;
  authorizedArtifactRoot: string;
};

/**
 * Resolve a registry-owned production destination and prove it is STRICTLY
 * beneath <repoRoot>/data/ghostflow/artifacts/.
 *
 * Promotion is authorized only for registry-owned artifact JSON under that
 * directory. A future registry path relocation outside it requires an explicit
 * promotion-writer code/policy review — do not silently broaden this guard.
 *
 * Fail closed: never sanitize, strip `..`, basename-fallback, or rewrite paths.
 */
export function resolvePromotionRegistryDestination(input: {
  repoRoot: string;
  artifactPath: string;
}): GhostFlowStageResult<GhostFlowPromotionRegistryDestination> {
  const repoRootResolved = resolve(input.repoRoot);
  const authorizedArtifactRoot = resolve(repoRootResolved, 'data', 'ghostflow', 'artifacts');
  const absolutePath = resolve(repoRootResolved, input.artifactPath);

  // Files only — the authorized root directory itself is not a valid destination.
  if (!absolutePath.startsWith(`${authorizedArtifactRoot}${sep}`)) {
    return {
      ok: false,
      issues: [
        blockIssue(
          'promotion_destination_unsafe',
          `Promotion destination must resolve strictly beneath ${authorizedArtifactRoot}`
        ),
      ],
    };
  }

  return {
    ok: true,
    value: {
      relativePath: input.artifactPath,
      absolutePath,
      authorizedArtifactRoot,
    },
    issues: [],
  };
}
