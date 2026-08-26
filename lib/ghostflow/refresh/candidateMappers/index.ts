import type { GhostFlowCandidateMapper } from '../types';
import { systematicFlowProxyCandidateMapper } from './systematicFlowProxy';
import { treasuryFuturesPositioningProxyCandidateMapper } from './treasuryFuturesPositioningProxy';
import { treasuryLongEndIncomeLensCandidateMapper } from './treasuryLongEndIncomeLens';

export const GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY = [
  systematicFlowProxyCandidateMapper,
  treasuryFuturesPositioningProxyCandidateMapper,
  treasuryLongEndIncomeLensCandidateMapper,
] as const;

export type GhostFlowCandidateMapperRegistryEntry =
  (typeof GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY)[number];

export {
  mapSystematicFlowProxyCandidate,
  systematicFlowProxyCandidateMapper,
} from './systematicFlowProxy';
export {
  mapTreasuryFuturesContractRow,
  mapTreasuryFuturesPositioningProxyCandidate,
  treasuryFuturesPositioningProxyCandidateMapper,
} from './treasuryFuturesPositioningProxy';
export {
  mapTreasuryLongEndIncomeLensCandidate,
  treasuryLongEndIncomeLensCandidateMapper,
} from './treasuryLongEndIncomeLens';
