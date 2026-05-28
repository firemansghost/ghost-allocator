/**
 * Levered ETF rebalance pressure example artifact for validation tests.
 */

import type { LeveredEtfRebalancePressureArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json';

export const FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE =
  exampleArtifact as LeveredEtfRebalancePressureArtifactV1;

export const FIXTURE_LEVERED_ETF_REBALANCE_REFERENCE_AS_OF = '2026-05-25';

export function cloneLeveredEtfExample(): LeveredEtfRebalancePressureArtifactV1 {
  return JSON.parse(
    JSON.stringify(FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE)
  ) as LeveredEtfRebalancePressureArtifactV1;
}
