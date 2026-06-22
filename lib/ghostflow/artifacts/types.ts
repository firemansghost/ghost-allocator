/**
 * GhostFlow — static public-data artifact types.
 */

import type { PassivePressureInputs, StructuralFragilityInputs } from '../types';

export type GhostFlowArtifactDataQuality = 'verified_manual' | 'manual_unverified' | 'mock_fallback';

export type GhostFlowArtifactFreshnessStatus = 'fresh' | 'caution' | 'stale' | 'missing';

export type GhostFlowUpdateFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

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

export type LeveredEtfRebalanceObservationType =
  'latest_session_snapshot_refreshed_manually';

export type LeveredEtfRebalanceUniverseDefinition = 'tier1_six_ticker_3x_index_etf_v1';

export type LeveredEtfDirection = 'long' | 'inverse';

export type LeveredEtfUnderlyingIndex = 'Nasdaq-100' | 'S&P 500' | 'Russell 2000';

export type LeveredEtfIndexProxyTicker = 'QQQ' | 'SPY' | 'IWM';

export type LeveredEtfRebalanceDirection = 'buy_underlying' | 'sell_underlying' | 'flat';

export type LeveredEtfDominantDirection =
  | 'buy_underlying'
  | 'sell_underlying'
  | 'mixed'
  | 'flat';

export type LeveredEtfMappingStatus = 'not_final';

export interface LeveredEtfRebalanceRowV1 {
  ticker: string;
  fundName: string;
  issuer: string;
  direction: LeveredEtfDirection;
  signedLeverage: number;
  leverageMultiple: number;
  underlyingIndex: LeveredEtfUnderlyingIndex;
  indexProxyTicker: LeveredEtfIndexProxyTicker;
  aumMillionsUsd: number;
  aumAsOf: string;
  aumSourceName: string;
  aumSourceUrl: string;
  crossCheckSourceName: string;
  crossCheckSourceUrl: string;
  underlyingReturnPct: number;
  returnAsOf: string;
  returnSourceName: string;
  returnSourceUrl: string;
  estimatedRebalanceNotionalMillionsUsd: number;
  estimatedRebalanceDirection: LeveredEtfRebalanceDirection;
  usedInAggregate: true;
}

export interface LeveredEtfRebalanceObservationsV1 {
  aggregateAumMillionsUsd: number;
  aggregateEstimatedRebalanceNotionalMillionsUsd: number;
  aggregateAbsRebalanceNotionalMillionsUsd: number;
  aggregateRebalancePctOfUniverseAum: number;
  dominantDirection: LeveredEtfDominantDirection;
  mappingStatus: LeveredEtfMappingStatus;
}

export interface LeveredEtfRebalancePressureArtifactV1 {
  artifactVersion: '1';
  signalId: 'levered-etf-rebalance-pressure';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: ArtifactSource;
  observationType: LeveredEtfRebalanceObservationType;
  universeDefinition: LeveredEtfRebalanceUniverseDefinition;
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  etfRows: LeveredEtfRebalanceRowV1[];
  observations: LeveredEtfRebalanceObservationsV1;
}

export interface LeveredEtfRebalancePressureValidationResult {
  ok: true;
  artifact: LeveredEtfRebalancePressureArtifactV1;
  warnings?: string[];
}

export interface LeveredEtfRebalancePressureValidationError {
  ok: false;
  errors: string[];
}

export type LeveredEtfRebalancePressureValidation =
  | LeveredEtfRebalancePressureValidationResult
  | LeveredEtfRebalancePressureValidationError;

export type RetirementFlowObservationType = 'quarterly_retirement_market_snapshot';

export type RetirementFlowSeriesDefinition =
  'ici_retirement_market_quarterly_assets_v1';

export type RetirementFlowMappingStatus = 'not_final';

export type RetirementFlowContributionSeasonFlag =
  | 'payroll_peak'
  | 'ira_contribution_season'
  | 'neutral';

export interface RetirementFlowPressureObservationsV1 {
  totalRetirementMarketAssetsTrillionsUsd: number;
  definedContributionAssetsTrillionsUsd: number;
  iraAssetsTrillionsUsd: number;
  mappingStatus: RetirementFlowMappingStatus;
  targetDateFundAssetsBillionsUsd?: number;
  priorQuarterTotalAssetsTrillionsUsd?: number;
  priorYearTotalAssetsTrillionsUsd?: number;
  quarterOverQuarterAssetGrowthPct?: number;
  yearOverYearAssetGrowthPct?: number;
  equityAllocationProxyPct?: number;
  contributionSeasonFlag?: RetirementFlowContributionSeasonFlag;
}

export interface RetirementFlowPressureArtifactV1 {
  artifactVersion: '1';
  signalId: 'retirement-flow-pressure-proxy';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: ArtifactSource;
  observationType: RetirementFlowObservationType;
  seriesDefinition: RetirementFlowSeriesDefinition;
  updateFrequency: 'quarterly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  caveats: string[];
  observations: RetirementFlowPressureObservationsV1;
}

export interface RetirementFlowPressureValidationResult {
  ok: true;
  artifact: RetirementFlowPressureArtifactV1;
}

export interface RetirementFlowPressureValidationError {
  ok: false;
  errors: string[];
}

export type RetirementFlowPressureProxyValidation =
  | RetirementFlowPressureValidationResult
  | RetirementFlowPressureValidationError;

/** OCC daily cleared options volume — index intensity proxy (v1.4c design only). */
export type OptionsActivityMappingStatus = 'not_final';

export interface OptionsActivityProxyObservationsV1 {
  totalOptionsContracts: number;
  indexOptionsContracts: number;
  indexShareOfTotalPct: number;
  mappingStatus: OptionsActivityMappingStatus;
  equityOptionsContracts?: number;
  etfOptionsContracts?: number;
  putCallRatio?: number;
  priorSessionIndexOptionsContracts?: number;
  indexOptionsDailyChangePct?: number;
}

/** Supplementary Cboe monthly context — not 0DTE; optional in v1.4c example. */
export interface OptionsActivityOptionalObservationsV1 {
  spxOptionsAdvThousands?: number;
  spxAdvAsOfMonth?: string;
  spxAdvSourceNote?: string;
  [key: string]: unknown;
}

export interface OptionsActivityProxyArtifactV1 {
  artifactVersion: '1';
  signalId: 'options-activity-proxy';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: ArtifactSource;
  observationType: 'occ_daily_volume_snapshot';
  seriesDefinition: 'occ_daily_options_volume_v1';
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  caveats: string[];
  observations: OptionsActivityProxyObservationsV1;
  optionalObservations?: OptionsActivityOptionalObservationsV1;
}

export interface OptionsActivityProxyValidationResult {
  ok: true;
  artifact: OptionsActivityProxyArtifactV1;
}

export interface OptionsActivityProxyValidationError {
  ok: false;
  errors: string[];
}

export type OptionsActivityProxyValidation =
  | OptionsActivityProxyValidationResult
  | OptionsActivityProxyValidationError;

/** SPY vs RSP cap-weight premium proxy — v1.9b.3 design scaffolding only. */
export type CapWeightPremiumPriceColumnUsed = 'adjusted' | 'close';

export type CapWeightPremiumMappingStatus = 'not_final';

export interface CapWeightPremiumPriceColumnUsedV1 {
  spy: CapWeightPremiumPriceColumnUsed;
  rsp: CapWeightPremiumPriceColumnUsed;
}

export interface CapWeightPremiumObservationsV1 {
  latestDate: string;
  spyAdjustedClose: number;
  rspAdjustedClose: number;
  spyRspRatio: number;
  ratioPercentile: number;
  spread1M: number;
  spread1MPercentile: number;
  spread3M: number;
  spread3MPercentile: number;
  spread6M: number;
  spread6MPercentile: number;
  spread1Y: number;
  spread1YAnnualized: number;
  spread1YPercentile: number;
  spread3Y: number;
  spread3YAnnualized: number;
  spread3YPercentile: number;
  spread5Y: number;
  spread5YAnnualized: number;
  spread5YPercentile: number;
  spyCurrentDrawdown: number;
  rspCurrentDrawdown: number;
  drawdownDivergence: number;
  alignedObservationCount: number;
  overlapStart: string;
  overlapEnd: string;
  priceColumnUsed: CapWeightPremiumPriceColumnUsedV1;
  mappingStatus: CapWeightPremiumMappingStatus;
}

export interface CapWeightPremiumMethodologyV1 {
  inputDescription?: string;
  alignment?: string;
  noForwardFill?: boolean;
  spreadDefinition?: string;
  percentileDefinition?: string;
  noCausalAttribution?: boolean;
  noScoreMapping?: boolean;
  [key: string]: unknown;
}

export interface CapWeightPremiumSourceV1 {
  name: string;
  url?: string;
  operatorSource?: string;
  retrievedAt?: string;
  method?: string;
  note?: string;
}

export interface CapWeightPremiumProxyArtifactV1 {
  artifactVersion: '1';
  signalId: 'cap-weight-premium-proxy';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: CapWeightPremiumSourceV1;
  observationType: 'spy_rsp_cap_weight_premium_snapshot';
  seriesDefinition: 'spy_rsp_adj_close_cap_weight_premium_v1';
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  methodology?: CapWeightPremiumMethodologyV1;
  caveats: string[];
  observations: CapWeightPremiumObservationsV1;
}

export interface CapWeightPremiumProxyValidationResult {
  ok: true;
  artifact: CapWeightPremiumProxyArtifactV1;
}

export interface CapWeightPremiumProxyValidationError {
  ok: false;
  errors: string[];
}

export type CapWeightPremiumProxyValidation =
  | CapWeightPremiumProxyValidationResult
  | CapWeightPremiumProxyValidationError;

/** Index inclusion / rebalance event proxy — v1.9c.3 design scaffolding only. */
export type IndexInclusionEventIndexFamily = 'sp_dji' | 'nasdaq' | 'ftse_russell' | 'other';

export type IndexInclusionEventAction =
  | 'add'
  | 'delete'
  | 'rebalance'
  | 'reconstitution'
  | 'unknown';

export type IndexInclusionEventSourceConfidence = 'high' | 'medium' | 'low';

export type IndexInclusionEventMappingStatus = 'not_final';

export interface IndexInclusionEventRecordV1 {
  eventId: string;
  sourceName: string;
  sourceUrl: string;
  announcedDate: string;
  effectiveDate: string | null;
  sourceAccessedDate: string;
  indexFamily: IndexInclusionEventIndexFamily;
  indexName: string;
  ticker: string;
  companyName?: string;
  action: IndexInclusionEventAction;
  eventType?: string;
  notes?: string;
  sourceConfidence?: IndexInclusionEventSourceConfidence;
  operatorVerified: boolean;
  floatEstimateAvailable: boolean;
  demandEstimateAvailable: boolean;
  mappingStatus: IndexInclusionEventMappingStatus;
  eventSeverityLabel?: string;
}

export interface IndexInclusionEventObservationsV1 {
  eventWindowStart: string;
  eventWindowEnd: string;
  eventCount: number;
  upcomingEventCount: number;
  recentEventCount: number;
  majorIndexEventCount?: number;
  sourceEventCount: number;
  mappingStatus: IndexInclusionEventMappingStatus;
  events: IndexInclusionEventRecordV1[];
}

export interface IndexInclusionEventSourceV1 {
  name: string;
  url: string;
  note?: string;
}

export interface IndexInclusionEventProxyArtifactV1 {
  artifactVersion: '1';
  signalId: 'index-inclusion-event-proxy';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: IndexInclusionEventSourceV1;
  observationType: 'index_inclusion_rebalance_event_snapshot';
  seriesDefinition: 'public_index_change_events_v1';
  updateFrequency: 'event_driven';
  dataQuality: 'verified_manual' | 'manual_unverified';
  mappingStatus: IndexInclusionEventMappingStatus;
  methodology: string;
  caveats: string[];
  observations: IndexInclusionEventObservationsV1;
}

export interface IndexInclusionEventProxyValidationResult {
  ok: true;
  artifact: IndexInclusionEventProxyArtifactV1;
}

export interface IndexInclusionEventProxyValidationError {
  ok: false;
  errors: string[];
}

export type IndexInclusionEventProxyValidation =
  | IndexInclusionEventProxyValidationResult
  | IndexInclusionEventProxyValidationError;

/** Cboe SKEW tail-skew context — v1.9e.3 example/validator scaffolding only. */
export type TailSkewMappingStatus = 'not_final';

export interface TailSkewLatestObservationV1 {
  date: string;
  skew: number;
}

export interface TailSkewContextObservationsV1 {
  currentSkew: number;
  latestObservation?: TailSkewLatestObservationV1;
  priorSessionSkew?: number;
  dailyChange?: number;
  dailyChangePct?: number;
  mappingStatus: TailSkewMappingStatus;
}

export interface TailSkewHistorySummaryV1 {
  rowCount: number;
  firstDate: string;
  latestDate: string;
  latestValue: number;
  sourceLockStatus?: string;
}

export interface TailSkewDisplayV1 {
  headline: string;
  body: string;
  caveat: string;
  badge: string;
}

export interface TailSkewProvenanceV1 {
  operatorRunCommand: string;
  spikeScriptVersion: string;
  csvFormat: string;
  transcriptionMethod: string;
}

export interface TailSkewSourceV1 {
  name: string;
  url: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceAccessedDate?: string;
  note?: string;
}

export interface TailSkewMethodologyV1 {
  indexDefinition?: string;
  noScoreMapping?: boolean;
  [key: string]: unknown;
}

export interface TailSkewContextArtifactV1 {
  artifactVersion: '1';
  signalId: 'tail-skew-context-proxy';
  designOnly?: true;
  title?: string;
  asOf: string;
  publishedAt: string;
  dataStatus?: 'public_proxy';
  mappingStatus?: TailSkewMappingStatus;
  units?: 'index_level';
  source: TailSkewSourceV1;
  observationType: 'cboe_skew_daily_snapshot';
  seriesDefinition: 'cboe_skew_daily_index_level_v1';
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  methodology?: TailSkewMethodologyV1;
  caveats: string[];
  observations: TailSkewContextObservationsV1;
  historySummary?: TailSkewHistorySummaryV1;
  display?: TailSkewDisplayV1;
  provenance?: TailSkewProvenanceV1;
  operatorNotes?: string;
}

export interface TailSkewContextValidationResult {
  ok: true;
  artifact: TailSkewContextArtifactV1;
}

export interface TailSkewContextValidationError {
  ok: false;
  errors: string[];
}

export type TailSkewContextValidation =
  | TailSkewContextValidationResult
  | TailSkewContextValidationError;

/** CFTC TFF Treasury futures positioning — v1.7b design only. */
export type TreasuryFuturesMappingStatus = 'not_final';

export type TreasuryFuturesDirection = 'net_long' | 'net_short' | 'flat';

export type TreasuryFuturesContractRole =
  | 'core'
  | 'optional_context'
  | 'funding_context'
  | 'deferred';

export type TreasuryFuturesTenor = '2Y' | '5Y' | '10Y' | '30Y' | 'ultra_10Y' | 'ultra_30Y';

export interface TreasuryFuturesContractRowV1 {
  contractMarketName: string;
  cftcContractMarketCode: string;
  tenor: TreasuryFuturesTenor;
  role: TreasuryFuturesContractRole;
  includeInBasket: boolean;
  usedInAggregate: boolean;
  reportDate: string;
  reportWeek: string;
  openInterestAll: number;
  levMoneyLong: number;
  levMoneyShort: number;
  levMoneySpread: number;
  levMoneyNet: number;
  levMoneyNetPctOi: number;
  levMoneyGross: number;
  levMoneyGrossPctOi: number;
  changeLevMoneyLong?: number;
  changeLevMoneyShort?: number;
  levMoneyWowDeltaNet?: number;
  assetManagerLong: number;
  assetManagerShort: number;
  assetManagerSpread: number;
  assetManagerNet: number;
  assetManagerNetPctOi: number;
  levVsAssetManagerSpread: number;
  direction: TreasuryFuturesDirection;
}

export interface TreasuryFuturesPositioningObservationsV1 {
  reportWeek: string;
  basketContractCount: number;
  basketOpenInterestAll: number;
  basketLevMoneyNet: number;
  basketLevMoneyNetPctOi: number;
  basketLevMoneyGrossPctOi: number;
  basketAssetManagerNetPctOi: number;
  basketLevVsAssetManagerSpread: number;
  basketDirection: TreasuryFuturesDirection;
  basketWowDeltaNet?: number;
  mappingStatus: TreasuryFuturesMappingStatus;
}

export interface TreasuryFuturesPositioningArtifactV1 {
  artifactVersion: '1';
  signalId: 'treasury-futures-positioning-proxy';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: ArtifactSource;
  observationType: 'cftc_tff_treasury_futures_positioning_snapshot';
  seriesDefinition: 'cftc_tff_futures_only_treasury_leveraged_funds_basket_v1';
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  datasetId: string;
  mappingStatus: TreasuryFuturesMappingStatus;
  caveats: string[];
  contracts: TreasuryFuturesContractRowV1[];
  observations: TreasuryFuturesPositioningObservationsV1;
}

export interface TreasuryFuturesPositioningValidationResult {
  ok: true;
  artifact: TreasuryFuturesPositioningArtifactV1;
}

export interface TreasuryFuturesPositioningValidationError {
  ok: false;
  errors: string[];
}

export type TreasuryFuturesPositioningValidation =
  | TreasuryFuturesPositioningValidationResult
  | TreasuryFuturesPositioningValidationError;

/** FRED Treasury long-end income lens — v1.7c design only. */
export type TreasuryLongEndMappingStatus = 'not_final';

export type TreasuryLongEndSourceSeriesRole = 'primary' | 'context';

export interface TreasuryLongEndIncomeLensSourceSeriesV1 {
  id: string;
  label: string;
  url: string;
  role: TreasuryLongEndSourceSeriesRole;
}

export interface TreasuryLongEndIncomeLensSourceV1 {
  name: string;
  url: string;
  note: string;
  series: TreasuryLongEndIncomeLensSourceSeriesV1[];
}

export interface TreasuryLongEndIncomeLensObservationsV1 {
  thirtyYearNominalYieldPct: number;
  thirtyYearTipsRealYieldPct: number;
  tenYearBreakevenInflationPct?: number;
  twoYearYieldPct?: number;
  fiveYearYieldPct?: number;
  tenYearYieldPct?: number;
  curve2s30sPct?: number;
  curve5s30sPct?: number;
  curve10s30sPct?: number;
  nominalYieldPercentile?: number | null;
  realYieldPercentile?: number | null;
  mappingStatus: TreasuryLongEndMappingStatus;
}

export interface TreasuryLongEndIncomeLensOptionalObservationsV1 {
  longDurationTreasuryEtfFlowMillionsUsd?: number | null;
  longDurationTreasuryEtfAumMillionsUsd?: number | null;
  termPremiumPct?: number | null;
}

export interface TreasuryLongEndIncomeLensArtifactV1 {
  artifactVersion: '1';
  signalId: 'treasury-long-end-income-lens';
  designOnly?: true;
  asOf: string;
  publishedAt: string;
  source: TreasuryLongEndIncomeLensSourceV1;
  observationType: 'treasury_long_end_income_snapshot';
  seriesDefinition: 'fred_treasury_long_end_income_lens_v1';
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  mappingStatus: TreasuryLongEndMappingStatus;
  caveats: string[];
  observations: TreasuryLongEndIncomeLensObservationsV1;
  optionalObservations?: TreasuryLongEndIncomeLensOptionalObservationsV1;
}

export interface TreasuryLongEndIncomeLensValidationResult {
  ok: true;
  artifact: TreasuryLongEndIncomeLensArtifactV1;
}

export interface TreasuryLongEndIncomeLensValidationError {
  ok: false;
  errors: string[];
}

export type TreasuryLongEndIncomeLensValidation =
  | TreasuryLongEndIncomeLensValidationResult
  | TreasuryLongEndIncomeLensValidationError;

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
