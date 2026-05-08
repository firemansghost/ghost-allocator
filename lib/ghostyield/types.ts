/**
 * GhostYield — yield sleeve research types (Phase 1 static sample only).
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

/** Static inputs for Phase 1 environment gauge (no live macro feed). */
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
  /** True = placeholder only (no sample tickers in Phase 1) */
  comingSoon?: boolean;
}

/** Raw row before scoring (scores added by scoring.ts). */
export interface GhostYieldCandidateRaw {
  ticker: string;
  name: string;
  /** Income sleeve — where the cash flow comes from. Not the legal wrapper; see `structureLabel`. */
  sleeveType: YieldSleeveCategory;
  /** Fund vehicle (ETF, CEF, listed stock, etc.). */
  structureLabel?: string;
  yieldSource: string;
  currentYield: number;
  secYield?: number;
  navTrend1Y?: number;
  navTrend3Y?: number;
  premiumDiscount?: number;
  leverage?: number;
  expenseRatio?: number;
  distributionQuality: DistributionQuality;
  role: string;
  mainRisks: string[];
  bestUseCase: string;
  avoidIf: string;
  dataAsOf: string;
  sourceLabel: string;
  confidence: Confidence;
}

export interface GhostYieldCandidate extends GhostYieldCandidateRaw {
  riskScore: number;
  fitScore: number;
}
