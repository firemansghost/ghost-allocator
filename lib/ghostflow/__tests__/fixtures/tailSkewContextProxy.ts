/**
 * Tail Skew Context example artifact for validation tests (v1.9e.3 design only).
 */

import type { TailSkewContextArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/tailSkewContext.v1.example.json';

export const FIXTURE_TAIL_SKEW_EXAMPLE =
  exampleArtifact as TailSkewContextArtifactV1;

export const FIXTURE_TAIL_SKEW_REFERENCE_ASOF = '2026-06-18';

export function cloneTailSkewExample(): TailSkewContextArtifactV1 {
  return JSON.parse(JSON.stringify(FIXTURE_TAIL_SKEW_EXAMPLE));
}
