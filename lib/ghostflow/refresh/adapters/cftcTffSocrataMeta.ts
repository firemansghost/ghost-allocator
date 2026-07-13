/**
 * CFTC TFF Futures Only Socrata — shared adapter metadata constants only.
 * No network, parsing, hashing, or side effects.
 */

export const CFTC_TFF_DATASET_ID = 'gpe5-46if' as const;

export const CFTC_TFF_SOURCE_FAMILY_ID = 'cftc_tff_socrata' as const;

export const CFTC_TFF_SOURCE_NAME =
  'CFTC Public Reporting Environment — TFF Futures Only' as const;

/** Canonical dataset-page locator (registry / operator documentation). */
export const CFTC_TFF_DATASET_PAGE_LOCATOR =
  'https://publicreporting.cftc.gov/Commitments-of-Traders/TFF-Futures-Only/gpe5-46if/about_data' as const;

/** Socrata resource endpoint (query base). */
export const CFTC_TFF_RESOURCE_ENDPOINT =
  `https://publicreporting.cftc.gov/resource/${CFTC_TFF_DATASET_ID}.json` as const;

export const CFTC_TFF_SYSTEMATIC_ADAPTER_ID = 'cftc-tff-systematic-socrata' as const;

export const CFTC_TFF_SYSTEMATIC_PARSER_VERSION = '1.0.0' as const;

export const CFTC_TFF_SYSTEMATIC_ARTIFACT_ID = 'systematicFlowProxy' as const;

/** Score-basket contract market codes (deterministic order). */
export const CFTC_TFF_SCORE_CONTRACT_CODES = [
  '13874A',
  '209742',
  '239742',
] as const;

/** VIX futures — context only; not a score-basket member. */
export const CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE = '1170E1' as const;

/** All registered codes for the systematic adapter query (score + VIX). */
export const CFTC_TFF_REGISTERED_CONTRACT_CODES = [
  ...CFTC_TFF_SCORE_CONTRACT_CODES,
  CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE,
] as const;

export type CftcTffScoreContractCode = (typeof CFTC_TFF_SCORE_CONTRACT_CODES)[number];
export type CftcTffVixContextContractCode = typeof CFTC_TFF_VIX_CONTEXT_CONTRACT_CODE;
export type CftcTffRegisteredContractCode =
  (typeof CFTC_TFF_REGISTERED_CONTRACT_CODES)[number];
