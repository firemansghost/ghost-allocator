import {
  classifyDirection,
  computeBasketMetricsFromRows,
  computeGross,
  computeLeveragedVsAssetManagerSpread,
  computeNet,
  computePctOfOpenInterest,
  TFF_FUTURES_ONLY_DATASET_ID,
  TREASURY_FUTURES_CONTRACT_PRODUCT_MAP,
  TREASURY_FUTURES_OBSERVATION_TYPE,
  TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID,
  TREASURY_FUTURES_PRODUCTION_CAVEATS,
  TREASURY_FUTURES_SERIES_DEFINITION,
  TREASURY_FUTURES_SOURCE_NAME,
  TREASURY_FUTURES_SOURCE_NOTE,
  TREASURY_FUTURES_SOURCE_URL,
  validateTreasuryFuturesPositioningProxyArtifact,
} from '@/lib/ghostflow/artifacts/treasuryFuturesPositioningProxy';
import type {
  TreasuryFuturesContractRowV1,
  TreasuryFuturesPositioningArtifactV1,
} from '@/lib/ghostflow/artifacts/types';
import type { CftcTffTreasuryNormalizedContract } from '../adapters/cftcTffTreasurySocrata';
import type { CftcTffTreasuryNormalizedFields } from '../adapters/cftcTffTreasurySocrata';
import { CFTC_TFF_TREASURY_ARTIFACT_ID } from '../adapters/cftcTffTreasurySocrataMeta';
import type {
  GhostFlowCandidateMapper,
  GhostFlowCandidateMapperInput,
  GhostFlowStageResult,
} from '../types';
import { mapperFail } from './mapperCommon';

function roundPct1(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function mapTreasuryFuturesContractRow(
  contract: CftcTffTreasuryNormalizedContract
): TreasuryFuturesContractRowV1 | null {
  const product = TREASURY_FUTURES_CONTRACT_PRODUCT_MAP[contract.cftcContractMarketCode];
  if (!product) return null;

  const o = contract.observations;
  const levMoneyNet = computeNet(o.leveragedFundsLong, o.leveragedFundsShort);
  const levMoneyGross = computeGross(o.leveragedFundsLong, o.leveragedFundsShort);
  const assetManagerNet = computeNet(o.assetManagerLong, o.assetManagerShort);
  const levMoneyNetPctOi = roundPct1(
    computePctOfOpenInterest(levMoneyNet, o.openInterestAll)
  );
  const levMoneyGrossPctOi = roundPct1(
    computePctOfOpenInterest(levMoneyGross, o.openInterestAll)
  );
  const assetManagerNetPctOi = roundPct1(
    computePctOfOpenInterest(assetManagerNet, o.openInterestAll)
  );

  return {
    contractMarketName: contract.contractMarketName,
    cftcContractMarketCode: contract.cftcContractMarketCode,
    tenor: product.tenor,
    role: product.role,
    includeInBasket: product.includeInBasket,
    usedInAggregate: product.usedInAggregate,
    reportDate: o.reportDate,
    reportWeek: o.reportWeek,
    openInterestAll: o.openInterestAll,
    levMoneyLong: o.leveragedFundsLong,
    levMoneyShort: o.leveragedFundsShort,
    levMoneySpread: o.leveragedFundsSpread,
    levMoneyNet,
    levMoneyNetPctOi,
    levMoneyGross,
    levMoneyGrossPctOi,
    changeLevMoneyLong: o.changeLeveragedFundsLong,
    changeLevMoneyShort: o.changeLeveragedFundsShort,
    levMoneyWowDeltaNet: o.changeLeveragedFundsLong - o.changeLeveragedFundsShort,
    assetManagerLong: o.assetManagerLong,
    assetManagerShort: o.assetManagerShort,
    assetManagerSpread: o.assetManagerSpread,
    assetManagerNet,
    assetManagerNetPctOi,
    levVsAssetManagerSpread: computeLeveragedVsAssetManagerSpread(levMoneyNet, assetManagerNet),
    direction: classifyDirection(levMoneyNetPctOi),
  };
}

export function mapTreasuryFuturesPositioningProxyCandidate(
  input: GhostFlowCandidateMapperInput<CftcTffTreasuryNormalizedFields>
): GhostFlowStageResult<TreasuryFuturesPositioningArtifactV1> {
  const { normalized, registryEntry } = input;

  if (registryEntry.artifactId !== CFTC_TFF_TREASURY_ARTIFACT_ID) {
    return mapperFail(
      'candidate_mapper_registry_mismatch',
      `Registry entry artifactId must be ${CFTC_TFF_TREASURY_ARTIFACT_ID}`
    );
  }

  if (normalized.artifactId !== 'treasuryFuturesPositioningProxy') {
    return mapperFail(
      'candidate_mapper_artifact_mismatch',
      'Normalized observation artifactId must be treasuryFuturesPositioningProxy'
    );
  }

  const asOf = normalized.observationAsOf ?? normalized.provenance.observationAsOf;
  if (!asOf) {
    return mapperFail(
      'candidate_mapper_missing_observation_date',
      'Normalized observation must include observationAsOf'
    );
  }

  const contracts: TreasuryFuturesContractRowV1[] = [];
  for (const core of normalized.fields.coreContracts) {
    const row = mapTreasuryFuturesContractRow(core);
    if (!row) {
      return mapperFail(
        'candidate_mapper_unknown_contract_code',
        `Unknown core contract code ${core.cftcContractMarketCode}`
      );
    }
    contracts.push(row);
  }
  for (const optional of normalized.fields.optionalContextContracts) {
    const row = mapTreasuryFuturesContractRow(optional);
    if (!row) {
      return mapperFail(
        'candidate_mapper_unknown_contract_code',
        `Unknown optional contract code ${optional.cftcContractMarketCode}`
      );
    }
    contracts.push(row);
  }

  const observations = computeBasketMetricsFromRows(contracts);

  const proposed: TreasuryFuturesPositioningArtifactV1 = {
    artifactVersion: '1',
    signalId: TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID,
    asOf,
    ...(normalized.provenance.sourcePublishedAt
      ? { publishedAt: normalized.provenance.sourcePublishedAt }
      : {}),
    source: {
      name: TREASURY_FUTURES_SOURCE_NAME,
      url: TREASURY_FUTURES_SOURCE_URL,
      note: TREASURY_FUTURES_SOURCE_NOTE,
    },
    observationType: TREASURY_FUTURES_OBSERVATION_TYPE,
    seriesDefinition: TREASURY_FUTURES_SERIES_DEFINITION,
    updateFrequency: 'weekly',
    dataQuality: 'verified_automated',
    datasetId: TFF_FUTURES_ONLY_DATASET_ID,
    mappingStatus: 'not_final',
    caveats: [...TREASURY_FUTURES_PRODUCTION_CAVEATS],
    contracts,
    observations,
  };

  const validation = validateTreasuryFuturesPositioningProxyArtifact(proposed, {
    mode: 'production',
  });
  if (!validation.ok) {
    return mapperFail(
      'candidate_mapper_validator_rejected',
      validation.errors.join('; ')
    );
  }

  return { ok: true, value: validation.artifact, issues: [] };
}

export const treasuryFuturesPositioningProxyCandidateMapper: GhostFlowCandidateMapper<
  CftcTffTreasuryNormalizedFields,
  TreasuryFuturesPositioningArtifactV1
> = {
  artifactId: 'treasuryFuturesPositioningProxy',
  map: mapTreasuryFuturesPositioningProxyCandidate,
};
