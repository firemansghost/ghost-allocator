/**
 * Retirement flow pressure proxy example artifact for validation tests.
 */

import type { RetirementFlowPressureArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json';

export const FIXTURE_RETIREMENT_FLOW_EXAMPLE =
  exampleArtifact as RetirementFlowPressureArtifactV1;

export const FIXTURE_RETIREMENT_FLOW_REFERENCE_AS_OF = '2026-05-25';

export function cloneRetirementFlowExample(): RetirementFlowPressureArtifactV1 {
  return JSON.parse(
    JSON.stringify(FIXTURE_RETIREMENT_FLOW_EXAMPLE)
  ) as RetirementFlowPressureArtifactV1;
}
