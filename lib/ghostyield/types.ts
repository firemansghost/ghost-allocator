/**
 * GhostYield — yield sleeve research types (Phase 2: static sample + NAV/distribution/freshness fields).
 */

export type YieldSleeveCategory =
  | 'cash_tbills'
  | 'credit_income'
  | 'preferred_income'
  | 'cef_credit'
  | 'opportunistic_credit'
  | 'special_situations_income'
  | 'bdc_income'
  | 'midstream_income'
  | 'natural_resources_income'
  | 'option_income'
  | 'crypto_yield_coming_soon';

/** Category card id: includes combined cards not tied to a single row `sleeveType`. */
export type GhostYieldCategoryCardId = YieldSleeveCategory | 'special_opportunistic_income';

export type Confidence = 'high' | 'medium' | 'low' | 'illustrative';

export type DistributionQuality = 'strong' | 'mixed' | 'weak' | 'uncertain';

/** Expected cadence for manual/static refresh UX. */
export type UpdateFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';

export type DistributionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'variable';

/** Roll-up for badges and scoring penalties. */
export type GhostYieldFreshnessStatus = 'fresh' | 'caution' | 'stale' | 'missing' | 'illustrative';

export interface CandidateFreshnessResult {
  status: GhostYieldFreshnessStatus;
  warnings: string[];
  /** When true, scoring applies a conservative data-quality penalty. */
  applyScoringPenalty: boolean;
}

/** Static inputs for Phase 2 environment gauge (no live macro feed). */
export interface YieldEnvironmentInputs {
  /** 0 = easy financial conditions for credit; 100 = stressed */
  creditStress: number;
  /** 0–100 policy/rates headwind for levered yield structures */
  ratePressure: number;
  /** 0–100 volatility regime (higher = rougher for option-income sleeves) */
  volRegime: number;
}

export interface GhostYieldCategoryMeta {
  id: GhostYieldCategoryCardId;
  /** Public card title */
  label: string;
  /** Short skeptical framing for the category */
  blurb: string;
  /** True = placeholder only (no sample tickers in Phase 2 yet) */
  comingSoon?: boolean;
}

/** Raw row before scoring (scores and freshness added by scoring.ts). */
export interface GhostYieldCandidateRaw {
  ticker: string;
  name: string;
  /** Income sleeve — where the cash flow comes from. Not the legal wrapper; see `structureLabel`. */
  sleeveType: YieldSleeveCategory;
  /** Fund vehicle (ETF, CEF, listed stock, etc.). */
  structureLabel?: string;
  yieldSource: string;
  /** Headline / indicative yield (decimal). */
  currentYield: number;
  secYield?: number;
  /** @deprecated Prefer navPerformance1Y when present; legacy static rows may still set navTrend1Y. */
  navTrend1Y?: number;
  /** @deprecated Prefer navPerformance3Y when present. */
  navTrend3Y?: number;
  premiumDiscount?: number;
  leverage?: number;
  expenseRatio?: number;
  distributionQuality: DistributionQuality;
  role: string;
  mainRisks: string[];
  bestUseCase: string;
  avoidIf: string;
  /** Legacy row-level as-of; use lineage dates when present. */
  dataAsOf: string;
  sourceLabel: string;
  confidence: Confidence;
  /** Optional override for lineage-aware confidence; falls back to `confidence`. */
  dataConfidence?: Confidence;

  marketPrice?: number;
  nav?: number;
  navPerformance1M?: number;
  navPerformance3M?: number;
  /** Total return approximations (decimal); override navTrend1Y when set. */
  navPerformance1Y?: number;
  navPerformance3Y?: number;
  marketPerformance1M?: number;
  marketPerformance3M?: number;
  marketPerformance1Y?: number;
  marketPerformance3Y?: number;

  latestDistributionAmount?: number;
  latestDistributionDate?: string;
  distributionFrequency?: DistributionFrequency;
  /** Annualized distribution rate estimate (decimal), comparable to secYield. */
  distributionRate?: number;
  estimatedReturnOfCapitalPct?: number;
  /** Optional illustrative: distribution yield minus NAV total return gap. */
  navYieldSpread?: number;

  navDataAsOf?: string;
  distributionDataAsOf?: string;
  quarterlyFundamentalDataAsOf?: string;
  sourceUrl?: string;
  updateFrequency?: UpdateFrequency;
}

export interface GhostYieldCandidate extends GhostYieldCandidateRaw {
  riskScore: number;
  fitScore: number;
  freshness: CandidateFreshnessResult;
}
