/**
 * GhostFlow — static public-data artifact types.
 */

import type { PassivePressureInputs, StructuralFragilityInputs } from '../types';

export type GhostFlowArtifactDataQuality = 'verified_manual' | 'manual_unverified' | 'mock_fallback';

export type GhostFlowArtifactFreshnessStatus = 'fresh' | 'caution' | 'stale' | 'missing';

export type GhostFlowUpdateFrequency = 'daily' | 'weekly' | 'monthly';

export type EtfNetIssuanceSeriesDefinition = 'domestic_equity_etf_estimated_weekly_net_issuance';

export type ActiveIndexFlowSeriesDefinition = 'domestic_equity_active_index_monthly_net_flows';

export type IndexConcentrationSeriesDefinition = 'sp500_index_top10_weight_percent';

export type PassiveShareProxySeriesDefinition = 'ici_domestic_equity_index_asset_share_percent';

export type MarketBreadthSeriesDefinition = 'sp500_percent_above_50_day_ma';

export type SystematicFlowProxySeriesDefinition = 'cftc_tff_futures_only_leveraged_funds_equity_basket';

export type SystematicFlowProxyBasketDirection = 'net_long' | 'net_short' | 'flat';

export interface ArtifactSource {
  name: string;
  url?: string;
  note?: string;
}

export interface VolatilityRegimeObservations {
  vixClose: number;
}

export interface VolatilityRegimeOptionalObservations {
  vix9dClose?: number | null;
  vix3mClose?: number | null;
  spyRealizedVol21dAnn?: number | null;
}

export interface VolatilityRegimeArtifactV1 {
  artifactVersion: '1';
  signalId: 'vol-regime';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: VolatilityRegimeObservations;
  optionalObservations?: VolatilityRegimeOptionalObservations;
}

export interface EtfNetIssuanceObservations {
  domesticEquityNetIssuanceMillionsUsd: number;
}

export interface EtfNetIssuanceOptionalObservations {
  totalEtfNetIssuanceMillionsUsd?: number | null;
  equityEtfNetIssuanceMillionsUsd?: number | null;
  fourWeekAverageDomesticEquityMillionsUsd?: number | null;
}

export interface EtfNetIssuanceArtifactV1 {
  artifactVersion: '1';
  signalId: 'etf-flow';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: EtfNetIssuanceSeriesDefinition;
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: EtfNetIssuanceObservations;
  optionalObservations?: EtfNetIssuanceOptionalObservations;
}

export interface ActiveIndexFlowObservations {
  activeDomesticEquityNetFlowMillionsUsd: number;
  indexDomesticEquityNetFlowMillionsUsd: number;
}

export interface ActiveIndexFlowOptionalObservations {
  worldEquityActiveMillionsUsd?: number | null;
  worldEquityIndexMillionsUsd?: number | null;
  totalLongTermActiveMillionsUsd?: number | null;
  totalLongTermIndexMillionsUsd?: number | null;
}

export interface ActiveIndexFlowArtifactV1 {
  artifactVersion: '1';
  signalId: 'active-index-flow';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: ActiveIndexFlowSeriesDefinition;
  updateFrequency: 'monthly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: ActiveIndexFlowObservations;
  optionalObservations?: ActiveIndexFlowOptionalObservations;
}

export interface VolatilityRegimeValidationResult {
  ok: true;
  artifact: VolatilityRegimeArtifactV1;
}

export interface VolatilityRegimeValidationError {
  ok: false;
  errors: string[];
}

export type VolatilityRegimeValidation = VolatilityRegimeValidationResult | VolatilityRegimeValidationError;

export interface EtfNetIssuanceValidationResult {
  ok: true;
  artifact: EtfNetIssuanceArtifactV1;
}

export interface EtfNetIssuanceValidationError {
  ok: false;
  errors: string[];
}

export type EtfNetIssuanceValidation = EtfNetIssuanceValidationResult | EtfNetIssuanceValidationError;

export interface ActiveIndexFlowValidationResult {
  ok: true;
  artifact: ActiveIndexFlowArtifactV1;
  warnings?: string[];
}

export interface ActiveIndexFlowValidationError {
  ok: false;
  errors: string[];
}

export type ActiveIndexFlowValidation = ActiveIndexFlowValidationResult | ActiveIndexFlowValidationError;

export interface IndexConcentrationObservations {
  sp500Top10IndexWeightPercent: number;
}

export interface IndexConcentrationOptionalObservations {
  sp500Top5IndexWeightPercent?: number | null;
  largestConstituentWeightPercent?: number | null;
  constituentCount?: number | null;
  sourceTable?: string | null;
}

export interface IndexConcentrationArtifactV1 {
  artifactVersion: '1';
  signalId: 'concentration';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: IndexConcentrationSeriesDefinition;
  updateFrequency: 'monthly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: IndexConcentrationObservations;
  optionalObservations?: IndexConcentrationOptionalObservations;
}

export interface IndexConcentrationValidationResult {
  ok: true;
  artifact: IndexConcentrationArtifactV1;
  warnings?: string[];
}

export interface IndexConcentrationValidationError {
  ok: false;
  errors: string[];
}

export type IndexConcentrationValidation = IndexConcentrationValidationResult | IndexConcentrationValidationError;

export interface PassiveShareProxyObservations {
  activeDomesticEquityAssetsMillionsUsd: number;
  indexDomesticEquityAssetsMillionsUsd: number;
  indexAssetSharePercent: number;
}

export interface PassiveShareProxyOptionalObservations {
  iciReportedIndexSharePercent?: number | null;
  worldEquityActiveAssetsMillionsUsd?: number | null;
  worldEquityIndexAssetsMillionsUsd?: number | null;
  totalLongTermActiveAssetsMillionsUsd?: number | null;
  totalLongTermIndexAssetsMillionsUsd?: number | null;
}

export interface PassiveShareProxyArtifactV1 {
  artifactVersion: '1';
  signalId: 'passive-share';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: PassiveShareProxySeriesDefinition;
  updateFrequency: 'monthly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: PassiveShareProxyObservations;
  optionalObservations?: PassiveShareProxyOptionalObservations;
}

export interface PassiveShareProxyValidationResult {
  ok: true;
  artifact: PassiveShareProxyArtifactV1;
  warnings?: string[];
}

export interface PassiveShareProxyValidationError {
  ok: false;
  errors: string[];
}

export type PassiveShareProxyValidation = PassiveShareProxyValidationResult | PassiveShareProxyValidationError;

export interface MarketBreadthObservations {
  sp500Above50DayMaPercent: number;
}

export interface MarketBreadthOptionalObservations {
  sourceSymbol?: string | null;
  sp500Above200DayMaPercent?: number | null;
  backupSourceName?: string | null;
  backupReadingPercent?: number | null;
}

export interface MarketBreadthArtifactV1 {
  artifactVersion: '1';
  signalId: 'breadth';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: MarketBreadthSeriesDefinition;
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: MarketBreadthObservations;
  optionalObservations?: MarketBreadthOptionalObservations;
}

export interface MarketBreadthValidationResult {
  ok: true;
  artifact: MarketBreadthArtifactV1;
  warnings?: string[];
}

export interface MarketBreadthValidationError {
  ok: false;
  errors: string[];
}

export type MarketBreadthValidation = MarketBreadthValidationResult | MarketBreadthValidationError;

export interface SystematicFlowProxyContractObservation {
  reportDate: string;
  reportWeek: string;
  openInterestAll: number;
  leveragedFundsLong: number;
  leveragedFundsShort: number;
  leveragedFundsSpread: number;
  changeLong: number;
  changeShort: number;
  changeSpread: number;
  pctOiLong: number;
  pctOiShort: number;
  pctOiSpread: number;
}

export interface SystematicFlowProxyScoreContract {
  cftcContractMarketCode: string;
  contractMarketName: string;
  usedInScore: true;
  observations: SystematicFlowProxyContractObservation;
}

export interface SystematicFlowProxyVixContext {
  cftcContractMarketCode: string;
  contractMarketName: string;
  usedInScore: false;
  observations: SystematicFlowProxyContractObservation;
}

export interface SystematicFlowProxyBasket {
  basketNetContracts: number;
  basketOpenInterestAll: number;
  basketNetPctOi: number;
  basketAbsNetPctOi: number;
  basketDirection: SystematicFlowProxyBasketDirection;
  basketWeeklyDeltaNetContracts?: number;
  basketScore: number;
}

export interface SystematicFlowProxyArtifactV1 {
  artifactVersion: '1';
  signalId: 'systematic-flow-proxy';
  designOnly?: boolean;
  asOf: string;
  publishedAt: string;
  source: ArtifactSource;
  seriesDefinition: SystematicFlowProxySeriesDefinition;
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  datasetId: string;
  scoreContracts: SystematicFlowProxyScoreContract[];
  vixContext?: SystematicFlowProxyVixContext;
  basket: SystematicFlowProxyBasket;
}

export interface SystematicFlowProxyValidationResult {
  ok: true;
  artifact: SystematicFlowProxyArtifactV1;
  warnings?: string[];
}

export interface SystematicFlowProxyValidationError {
  ok: false;
  errors: string[];
}

export type SystematicFlowProxyValidation =
  | SystematicFlowProxyValidationResult
  | SystematicFlowProxyValidationError;

export interface ArtifactFreshnessResult {
  status: GhostFlowArtifactFreshnessStatus;
  ageDays: number;
  warnings: string[];
}

export interface GhostFlowPublicSignalMeta {
  signalId: string;
  name: string;
  sourceName: string;
  sourceUrl?: string;
  asOf: string;
  publishedAt?: string;
  freshnessStatus: GhostFlowArtifactFreshnessStatus;
}

export interface GhostFlowSnapshotMeta {
  dataMix: 'mock' | 'mixed';
  freshnessWarnings: string[];
  publicSignalCount: number;
  publicSignals: GhostFlowPublicSignalMeta[];
  publicPassiveInputKeys: Array<keyof PassivePressureInputs>;
  publicStructuralInputKeys: Array<keyof StructuralFragilityInputs>;
  /** @deprecated Prefer publicSignals */
  volRegimeSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  volRegimeAsOf?: string;
  /** @deprecated Prefer publicSignals */
  etfFlowSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  etfFlowAsOf?: string;
  /** @deprecated Prefer publicSignals */
  activeIndexFlowSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  activeIndexFlowAsOf?: string;
  /** @deprecated Prefer publicSignals */
  indexConcentrationSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  indexConcentrationAsOf?: string;
  /** @deprecated Prefer publicSignals */
  passiveShareProxySource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  passiveShareProxyAsOf?: string;
  /** @deprecated Prefer publicSignals */
  breadthSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  breadthAsOf?: string;
}

export interface GhostFlowBuildResult {
  raw: import('../types').GhostFlowRawSnapshot;
  meta: GhostFlowSnapshotMeta;
}

export interface ApplyArtifactOutcome {
  raw: import('../types').GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
  publicPassiveInputKey?: keyof PassivePressureInputs;
  publicStructuralInputKey?: keyof StructuralFragilityInputs;
}
