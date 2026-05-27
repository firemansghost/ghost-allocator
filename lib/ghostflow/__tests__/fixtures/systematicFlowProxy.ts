/**
 * Invalid CFTC TFF artifact variants for systematicFlowProxy validation tests.
 */

import type { SystematicFlowProxyArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import exampleArtifact from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.example.json';

export const FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE =
  exampleArtifact as SystematicFlowProxyArtifactV1;

export const FIXTURE_SYSTEMATIC_FLOW_REFERENCE_AS_OF = '2026-05-25';

export function cloneExample(): SystematicFlowProxyArtifactV1 {
  return JSON.parse(JSON.stringify(FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE)) as SystematicFlowProxyArtifactV1;
}
