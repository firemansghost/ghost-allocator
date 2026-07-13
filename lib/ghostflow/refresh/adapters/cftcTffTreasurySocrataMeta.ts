/**
 * CFTC TFF Treasury Socrata — Treasury-adapter metadata constants only.
 * Reuses source-family identity from cftcTffSocrataMeta.ts.
 * No network, parsing, hashing, or side effects.
 */

import {
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_SOURCE_FAMILY_ID,
} from './cftcTffSocrataMeta';

export {
  CFTC_TFF_DATASET_ID,
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_RESOURCE_ENDPOINT,
  CFTC_TFF_SOURCE_FAMILY_ID,
} from './cftcTffSocrataMeta';

export const CFTC_TFF_TREASURY_ADAPTER_ID = 'cftc-tff-treasury-socrata' as const;

export const CFTC_TFF_TREASURY_PARSER_VERSION = '1.0.0' as const;

export const CFTC_TFF_TREASURY_ARTIFACT_ID =
  'treasuryFuturesPositioningProxy' as const;

/** Exact registry source name for the Treasury CFTC entry. */
export const CFTC_TFF_TREASURY_SOURCE_NAME =
  'CFTC Public Reporting Environment — TFF Futures Only (Treasury)' as const;

export const CFTC_TFF_TREASURY_SOURCE_LOCATOR = CFTC_TFF_DATASET_PAGE_LOCATOR;

export const CFTC_TFF_TREASURY_SOURCE_FAMILY_ID = CFTC_TFF_SOURCE_FAMILY_ID;

/** Required aggregate core (deterministic order). */
export const CFTC_TFF_TREASURY_CORE_CONTRACT_CODES = [
  '042601',
  '044601',
  '043602',
  '020601',
] as const;

/** Optional Ultra context only (deterministic order). */
export const CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES = [
  '043607',
  '020604',
] as const;

/** All registered Treasury codes queried by the adapter. */
export const CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES = [
  ...CFTC_TFF_TREASURY_CORE_CONTRACT_CODES,
  ...CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES,
] as const;

export type CftcTffTreasuryCoreContractCode =
  (typeof CFTC_TFF_TREASURY_CORE_CONTRACT_CODES)[number];

export type CftcTffTreasuryOptionalContextContractCode =
  (typeof CFTC_TFF_TREASURY_OPTIONAL_CONTEXT_CONTRACT_CODES)[number];

export type CftcTffTreasuryRegisteredContractCode =
  (typeof CFTC_TFF_TREASURY_REGISTERED_CONTRACT_CODES)[number];
