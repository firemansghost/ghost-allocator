import exampleSystematic from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.example.json';
import type { CftcTffSystematicNormalizedFields } from '@/lib/ghostflow/refresh/adapters/cftcTffSystematicSocrata';
import type { CftcTffTreasuryNormalizedFields } from '@/lib/ghostflow/refresh/adapters/cftcTffTreasurySocrata';
import type { FrbH15TreasuryNormalizedFields } from '@/lib/ghostflow/refresh/adapters/frbH15TreasuryYieldsNormalize';
import {
  buildCftcTffSystematicResourceQueryUrl,
  buildCftcTffTreasuryResourceQueryUrl,
} from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataSource';
import {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
} from '@/lib/ghostflow/refresh/adapters/cftcTffSocrataMeta';
import {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_PARSER_VERSION,
} from '@/lib/ghostflow/refresh/adapters/cftcTffTreasurySocrataMeta';
import {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
} from '@/lib/ghostflow/refresh/adapters/frbH15TreasuryYieldsSdmxMeta';
import type { GhostFlowNormalizedObservation } from '@/lib/ghostflow/refresh/types';

/** Realistic 64-char SHA-256 hex digest for offline fixtures. */
export const FIXTURE_CONTENT_SHA256 =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as const;

export const FIXTURE_RETRIEVED_AT = '2026-07-09T15:30:00.000Z' as const;

export function fixtureSystematicNormalized(
  opts?: { sourcePublishedAt?: string }
): GhostFlowNormalizedObservation<CftcTffSystematicNormalizedFields> {
  const observationAsOf = '2026-05-19';
  const ex = exampleSystematic as {
    scoreContracts: CftcTffSystematicNormalizedFields['scoreContracts'];
    vixContext: CftcTffSystematicNormalizedFields['vixContext'];
  };
  return {
    artifactId: 'systematicFlowProxy',
    observationAsOf,
    fields: {
      datasetId: CFTC_TFF_DATASET_ID,
      scoreContracts: ex.scoreContracts.map((c) => ({
        cftcContractMarketCode: c.cftcContractMarketCode,
        contractMarketName: c.contractMarketName,
        observations: { ...c.observations },
      })),
      vixContext: {
        cftcContractMarketCode: ex.vixContext.cftcContractMarketCode,
        contractMarketName: ex.vixContext.contractMarketName,
        observations: { ...ex.vixContext.observations },
      },
    },
    provenance: {
      sourceId: CFTC_TFF_SOURCE_FAMILY_ID,
      sourceLocator: buildCftcTffSystematicResourceQueryUrl(),
      retrievedAt: FIXTURE_RETRIEVED_AT,
      contentSha256: FIXTURE_CONTENT_SHA256,
      adapterId: CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
      parserVersion: CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
      observationAsOf,
      ...(opts?.sourcePublishedAt ? { sourcePublishedAt: opts.sourcePublishedAt } : {}),
    },
  };
}

export function fixtureTreasuryNormalized(
  opts?: { sourcePublishedAt?: string }
): GhostFlowNormalizedObservation<CftcTffTreasuryNormalizedFields> {
  const mk = (
    code: string,
    name: string,
    reportDate: string,
    reportWeek: string,
    long: number,
    short: number,
    spread: number,
    oi: number,
    amLong: number,
    amShort: number,
    amSpread: number
  ) => ({
    cftcContractMarketCode: code,
    contractMarketName: name,
    commodityName: 'T-NOTES',
    marketAndExchangeNames: 'CBOT',
    observations: {
      reportDate,
      reportWeek,
      openInterestAll: oi,
      leveragedFundsLong: long,
      leveragedFundsShort: short,
      leveragedFundsSpread: spread,
      changeLeveragedFundsLong: 100,
      changeLeveragedFundsShort: 50,
      changeLeveragedFundsSpread: 10,
      pctOiLeveragedFundsLong: 10,
      pctOiLeveragedFundsShort: 20,
      pctOiLeveragedFundsSpread: 2,
      assetManagerLong: amLong,
      assetManagerShort: amShort,
      assetManagerSpread: amSpread,
      changeAssetManagerLong: 0,
      changeAssetManagerShort: 0,
      changeAssetManagerSpread: 0,
      pctOiAssetManagerLong: 30,
      pctOiAssetManagerShort: 10,
      pctOiAssetManagerSpread: 5,
    },
  });

  const reportDate = '2026-06-30';
  const reportWeek = '2026 Report Week 26';

  return {
    artifactId: 'treasuryFuturesPositioningProxy',
    observationAsOf: reportDate,
    fields: {
      datasetId: CFTC_TFF_DATASET_ID,
      coreContracts: [
        mk('042601', 'UST 2Y NOTE', reportDate, reportWeek, 378363, 2127238, 313221, 4490379, 2538045, 578035, 520184),
        mk('044601', 'UST 5Y NOTE', reportDate, reportWeek, 545213, 2691503, 202304, 6267012, 3956443, 1025573, 848669),
        mk('043602', 'UST 10Y NOTE', reportDate, reportWeek, 354091, 2323942, 128875, 5248455, 3218515, 840365, 755829),
        mk('020601', 'UST BOND', reportDate, reportWeek, 176947, 518869, 38992, 1923876, 1115022, 588136, 229023),
      ],
      optionalContextContracts: [
        mk('043607', 'ULTRA UST 10Y', reportDate, reportWeek, 142941, 454223, 15610, 2456590, 1284281, 605118, 584161),
        mk('020604', 'ULTRA UST BOND', reportDate, reportWeek, 87866, 997768, 30877, 2456625, 1670677, 544142, 385370),
      ],
    },
    provenance: {
      sourceId: CFTC_TFF_SOURCE_FAMILY_ID,
      sourceLocator: buildCftcTffTreasuryResourceQueryUrl(),
      retrievedAt: FIXTURE_RETRIEVED_AT,
      contentSha256: FIXTURE_CONTENT_SHA256,
      adapterId: CFTC_TFF_TREASURY_ADAPTER_ID,
      parserVersion: CFTC_TFF_TREASURY_PARSER_VERSION,
      observationAsOf: reportDate,
      ...(opts?.sourcePublishedAt ? { sourcePublishedAt: opts.sourcePublishedAt } : {}),
    },
  };
}

export function fixtureH15Normalized(
  opts?: { sourcePublishedAt?: string }
): GhostFlowNormalizedObservation<FrbH15TreasuryNormalizedFields> {
  const observationAsOf = '2026-08-24';
  return {
    artifactId: 'treasuryLongEndIncomeLens',
    observationAsOf,
    fields: {
      thirtyYearNominalYieldPct: 4.97,
      thirtyYearTipsRealYieldPct: 2.78,
      twoYearYieldPct: 4.17,
      fiveYearYieldPct: 4.24,
      tenYearYieldPct: 4.48,
    },
    provenance: {
      sourceId: FRB_H15_SDMX_SOURCE_FAMILY_ID,
      sourceLocator: FRB_H15_SDMX_SOURCE_LOCATOR,
      retrievedAt: FIXTURE_RETRIEVED_AT,
      contentSha256: FIXTURE_CONTENT_SHA256,
      adapterId: FRB_H15_SDMX_ADAPTER_ID,
      parserVersion: FRB_H15_SDMX_PARSER_VERSION,
      observationAsOf,
      ...(opts?.sourcePublishedAt ? { sourcePublishedAt: opts.sourcePublishedAt } : {}),
    },
  };
}
