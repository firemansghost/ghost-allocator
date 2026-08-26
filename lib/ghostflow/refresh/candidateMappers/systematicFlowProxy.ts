import {
  computeBasketMetrics,
  SYSTEMATIC_FLOW_PROXY_SIGNAL_ID,
  SYSTEMATIC_FLOW_PROXY_SOURCE_NAME,
  SYSTEMATIC_FLOW_PROXY_SOURCE_NOTE,
  SYSTEMATIC_FLOW_PROXY_SOURCE_URL,
  TFF_FUTURES_ONLY_DATASET_ID,
  validateSystematicFlowProxyArtifact,
} from '@/lib/ghostflow/artifacts/systematicFlowProxy';
import type {
  SystematicFlowProxyArtifactV1,
  SystematicFlowProxyScoreContract,
  SystematicFlowProxyVixContext,
} from '@/lib/ghostflow/artifacts/types';
import type { CftcTffNormalizedContract } from '../adapters/cftcTffSystematicSocrata';
import type { CftcTffSystematicNormalizedFields } from '../adapters/cftcTffSystematicSocrata';
import { CFTC_TFF_SYSTEMATIC_ARTIFACT_ID } from '../adapters/cftcTffSocrataMeta';
import type {
  GhostFlowCandidateMapper,
  GhostFlowCandidateMapperInput,
  GhostFlowStageResult,
} from '../types';
import { mapperFail } from './mapperCommon';

function mapScoreContract(contract: CftcTffNormalizedContract): SystematicFlowProxyScoreContract {
  return {
    cftcContractMarketCode: contract.cftcContractMarketCode,
    contractMarketName: contract.contractMarketName,
    usedInScore: true,
    observations: { ...contract.observations },
  };
}

function mapVixContext(contract: CftcTffNormalizedContract): SystematicFlowProxyVixContext {
  return {
    cftcContractMarketCode: contract.cftcContractMarketCode,
    contractMarketName: contract.contractMarketName,
    usedInScore: false,
    observations: { ...contract.observations },
  };
}

export function mapSystematicFlowProxyCandidate(
  input: GhostFlowCandidateMapperInput<CftcTffSystematicNormalizedFields>
): GhostFlowStageResult<SystematicFlowProxyArtifactV1> {
  const { normalized, registryEntry } = input;

  if (registryEntry.artifactId !== CFTC_TFF_SYSTEMATIC_ARTIFACT_ID) {
    return mapperFail(
      'candidate_mapper_registry_mismatch',
      `Registry entry artifactId must be ${CFTC_TFF_SYSTEMATIC_ARTIFACT_ID}`
    );
  }

  if (normalized.artifactId !== 'systematicFlowProxy') {
    return mapperFail(
      'candidate_mapper_artifact_mismatch',
      'Normalized observation artifactId must be systematicFlowProxy'
    );
  }

  const asOf = normalized.observationAsOf ?? normalized.provenance.observationAsOf;
  if (!asOf) {
    return mapperFail(
      'candidate_mapper_missing_observation_date',
      'Normalized observation must include observationAsOf'
    );
  }

  const scoreContracts = normalized.fields.scoreContracts.map(mapScoreContract);
  const vixContext = mapVixContext(normalized.fields.vixContext);
  const basket = computeBasketMetrics(scoreContracts);

  const proposed: SystematicFlowProxyArtifactV1 = {
    artifactVersion: '1',
    signalId: SYSTEMATIC_FLOW_PROXY_SIGNAL_ID,
    asOf,
    ...(normalized.provenance.sourcePublishedAt
      ? { publishedAt: normalized.provenance.sourcePublishedAt }
      : {}),
    source: {
      name: SYSTEMATIC_FLOW_PROXY_SOURCE_NAME,
      url: SYSTEMATIC_FLOW_PROXY_SOURCE_URL,
      note: SYSTEMATIC_FLOW_PROXY_SOURCE_NOTE,
    },
    seriesDefinition: 'cftc_tff_futures_only_leveraged_funds_equity_basket',
    updateFrequency: 'weekly',
    dataQuality: 'verified_automated',
    datasetId: TFF_FUTURES_ONLY_DATASET_ID,
    scoreContracts,
    vixContext,
    basket,
  };

  const validation = validateSystematicFlowProxyArtifact(proposed);
  if (!validation.ok) {
    return mapperFail(
      'candidate_mapper_validator_rejected',
      validation.errors.join('; ')
    );
  }

  return { ok: true, value: validation.artifact, issues: [] };
}

export const systematicFlowProxyCandidateMapper: GhostFlowCandidateMapper<
  CftcTffSystematicNormalizedFields,
  SystematicFlowProxyArtifactV1
> = {
  artifactId: 'systematicFlowProxy',
  map: mapSystematicFlowProxyCandidate,
};
