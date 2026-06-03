/**
 * Options activity proxy example artifact for validation tests (v1.4c design only).
 */

import type { OptionsActivityProxyArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/optionsActivityProxy.v1.example.json';

export const FIXTURE_OPTIONS_ACTIVITY_EXAMPLE =
  exampleArtifact as OptionsActivityProxyArtifactV1;

export const FIXTURE_OPTIONS_ACTIVITY_REFERENCE_ASOF = '2026-05-25';

export function cloneOptionsActivityExample(): OptionsActivityProxyArtifactV1 {
  return JSON.parse(
    JSON.stringify(FIXTURE_OPTIONS_ACTIVITY_EXAMPLE)
  ) as OptionsActivityProxyArtifactV1;
}
