/**
 * Index inclusion event proxy example artifact for validation tests (v1.9c.3 design only).
 */

import type { IndexInclusionEventProxyArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json';

export const FIXTURE_INDEX_INCLUSION_EVENT_EXAMPLE =
  exampleArtifact as IndexInclusionEventProxyArtifactV1;

export const FIXTURE_INDEX_INCLUSION_REFERENCE_ASOF = '2026-06-15';

export function cloneIndexInclusionEventExample(): IndexInclusionEventProxyArtifactV1 {
  return JSON.parse(
    JSON.stringify(FIXTURE_INDEX_INCLUSION_EVENT_EXAMPLE)
  ) as IndexInclusionEventProxyArtifactV1;
}
