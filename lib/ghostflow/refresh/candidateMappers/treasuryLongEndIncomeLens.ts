import {
  computeCurveSpread,
  TREASURY_LONG_END_BOARD_CAVEATS,
  TREASURY_LONG_END_BOARD_RELEASE_URL,
  TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
  TREASURY_LONG_END_BOARD_SOURCE_NAME,
  TREASURY_LONG_END_BOARD_SOURCE_NOTE,
  TREASURY_LONG_END_BOARD_SOURCE_SERIES,
  TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID,
  TREASURY_LONG_END_OBSERVATION_TYPE,
  validateTreasuryLongEndIncomeLensArtifact,
} from '@/lib/ghostflow/artifacts/treasuryLongEndIncomeLens';
import type {
  TreasuryLongEndIncomeLensArtifactV1,
  TreasuryLongEndIncomeLensObservationsV1,
} from '@/lib/ghostflow/artifacts/types';
import type { FrbH15TreasuryNormalizedFields } from '../adapters/frbH15TreasuryYieldsNormalize';
import {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_ARTIFACT_ID,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
} from '../adapters/frbH15TreasuryYieldsSdmxMeta';
import type {
  GhostFlowCandidateMapper,
  GhostFlowCandidateMapperInput,
  GhostFlowStageResult,
} from '../types';
import { mapperFail, reconcileCandidateMapperProvenance } from './mapperCommon';

function buildBoardObservations(
  fields: FrbH15TreasuryNormalizedFields
): TreasuryLongEndIncomeLensObservationsV1 {
  const observations: TreasuryLongEndIncomeLensObservationsV1 = {
    thirtyYearNominalYieldPct: fields.thirtyYearNominalYieldPct,
    thirtyYearTipsRealYieldPct: fields.thirtyYearTipsRealYieldPct,
    mappingStatus: 'not_final',
    nominalYieldPercentile: null,
    realYieldPercentile: null,
  };

  if (fields.twoYearYieldPct !== undefined) {
    observations.twoYearYieldPct = fields.twoYearYieldPct;
    observations.curve2s30sPct = computeCurveSpread(
      fields.thirtyYearNominalYieldPct,
      fields.twoYearYieldPct
    );
  }
  if (fields.fiveYearYieldPct !== undefined) {
    observations.fiveYearYieldPct = fields.fiveYearYieldPct;
    observations.curve5s30sPct = computeCurveSpread(
      fields.thirtyYearNominalYieldPct,
      fields.fiveYearYieldPct
    );
  }
  if (fields.tenYearYieldPct !== undefined) {
    observations.tenYearYieldPct = fields.tenYearYieldPct;
    observations.curve10s30sPct = computeCurveSpread(
      fields.thirtyYearNominalYieldPct,
      fields.tenYearYieldPct
    );
  }

  return observations;
}

export function mapTreasuryLongEndIncomeLensCandidate(
  input: GhostFlowCandidateMapperInput<FrbH15TreasuryNormalizedFields>
): GhostFlowStageResult<TreasuryLongEndIncomeLensArtifactV1> {
  const { normalized } = input;

  const provenance = reconcileCandidateMapperProvenance(input, {
    expectedArtifactId: FRB_H15_SDMX_ARTIFACT_ID,
    expectedSourceFamilyId: FRB_H15_SDMX_SOURCE_FAMILY_ID,
    expectedAdapterId: FRB_H15_SDMX_ADAPTER_ID,
    expectedParserVersion: FRB_H15_SDMX_PARSER_VERSION,
    expectedSourceLocator: FRB_H15_SDMX_SOURCE_LOCATOR,
  });
  if (!provenance.ok) {
    return provenance;
  }

  const asOf = provenance.observationAsOf;

  const proposed: TreasuryLongEndIncomeLensArtifactV1 = {
    artifactVersion: '1',
    signalId: TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID,
    asOf,
    ...(normalized.provenance.sourcePublishedAt
      ? { publishedAt: normalized.provenance.sourcePublishedAt }
      : {}),
    source: {
      name: TREASURY_LONG_END_BOARD_SOURCE_NAME,
      url: TREASURY_LONG_END_BOARD_RELEASE_URL,
      note: TREASURY_LONG_END_BOARD_SOURCE_NOTE,
      series: TREASURY_LONG_END_BOARD_SOURCE_SERIES.map((spec) => ({
        id: spec.id,
        label: spec.label,
        url: TREASURY_LONG_END_BOARD_RELEASE_URL,
        role: spec.role,
      })),
    },
    observationType: TREASURY_LONG_END_OBSERVATION_TYPE,
    seriesDefinition: TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
    updateFrequency: 'daily',
    dataQuality: 'verified_automated',
    mappingStatus: 'not_final',
    caveats: [...TREASURY_LONG_END_BOARD_CAVEATS],
    observations: buildBoardObservations(normalized.fields),
  };

  const validation = validateTreasuryLongEndIncomeLensArtifact(proposed, {
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

export const treasuryLongEndIncomeLensCandidateMapper: GhostFlowCandidateMapper<
  FrbH15TreasuryNormalizedFields,
  TreasuryLongEndIncomeLensArtifactV1
> = {
  artifactId: 'treasuryLongEndIncomeLens',
  map: mapTreasuryLongEndIncomeLensCandidate,
};
