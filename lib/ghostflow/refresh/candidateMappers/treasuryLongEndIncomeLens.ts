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
import { FRB_H15_ARTIFACT_ID } from '../adapters/frbH15TreasuryYieldsMeta';
import type {
  GhostFlowCandidateMapper,
  GhostFlowCandidateMapperInput,
  GhostFlowStageResult,
} from '../types';
import { mapperFail } from './mapperCommon';

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
  const { normalized, registryEntry } = input;

  if (registryEntry.artifactId !== FRB_H15_ARTIFACT_ID) {
    return mapperFail(
      'candidate_mapper_registry_mismatch',
      `Registry entry artifactId must be ${FRB_H15_ARTIFACT_ID}`
    );
  }

  if (normalized.artifactId !== 'treasuryLongEndIncomeLens') {
    return mapperFail(
      'candidate_mapper_artifact_mismatch',
      'Normalized observation artifactId must be treasuryLongEndIncomeLens'
    );
  }

  const asOf = normalized.observationAsOf ?? normalized.provenance.observationAsOf;
  if (!asOf) {
    return mapperFail(
      'candidate_mapper_missing_observation_date',
      'Normalized observation must include observationAsOf'
    );
  }

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
