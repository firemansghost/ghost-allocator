/**
 * Cap-weight premium proxy example artifact for validation tests (v1.9b.3 design only).
 */

import type { CapWeightPremiumProxyArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json';

export const FIXTURE_CAP_WEIGHT_PREMIUM_EXAMPLE =
  exampleArtifact as CapWeightPremiumProxyArtifactV1;

export const FIXTURE_CAP_WEIGHT_PREMIUM_REFERENCE_ASOF = '2026-06-15';

export function cloneCapWeightPremiumExample(): CapWeightPremiumProxyArtifactV1 {
  return JSON.parse(
    JSON.stringify(FIXTURE_CAP_WEIGHT_PREMIUM_EXAMPLE)
  ) as CapWeightPremiumProxyArtifactV1;
}
