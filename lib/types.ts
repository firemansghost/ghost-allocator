export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export type RegimeScenario = 'stagflationary' | 'deflationary' | 'growth';

export type PensionCoverage =
  | 'none'
  | 'less_than_half'
  | 'about_half'
  | 'most_or_all';

export type PlatformType = 'voya_only' | 'voya_and_schwab';

export type PortfolioPreset =
  | 'standard'
  | 'ghostregime_60_30_10'
  | 'ghostregime_60_25_15';

export type GoldBtcTilt = 'none' | 'gold10_btc5' | 'gold15_btc5';

export type SchwabLineupStyle = 'standard' | 'simplify';

export type GoldInstrument = 'gldm' | 'ygld';

export type BtcInstrument = 'fbtc' | 'maxi';

export type SleeveId =
  | 'core_equity'
  | 'convex_equity'
  | 'real_assets'
  | 't_bills'
  | 'core_bonds'
  | 'managed_futures'
  | 'rate_hedge'
  | 'cash';

export interface CurrentVoyaHolding {
  fundId: string;
  fundName: string;
  allocationPct: number; // percent of the Voya slice, should sum ~100
}

export interface QuestionnaireAnswers {
  age: number;
  yearsToGoal: number;
  isRetired: boolean;
  drawdownTolerance: 'low' | 'medium' | 'high';
  behaviorInCrash: 'panic_sell' | 'hold' | 'buy_more';
  incomeStability: 'low' | 'medium' | 'high';
  complexityPreference: 'simple' | 'moderate' | 'advanced';
  hasPension: boolean;
  pensionCoverage: PensionCoverage;
  platform: PlatformType;
  currentSchwabPct?: number; // 0–75, only relevant when platform === "voya_and_schwab"
  schwabPreference?: 'stay_low' | 'use_full_75';
  portfolioPreset?: PortfolioPreset; // default to "standard"
  goldBtcTilt?: GoldBtcTilt; // default "none"
  schwabLineupStyle?: SchwabLineupStyle; // default "standard"
  goldInstrument?: GoldInstrument; // default "gldm"
  btcInstrument?: BtcInstrument; // default "fbtc"
  currentVoyaHoldings?: CurrentVoyaHolding[];
}

export interface Sleeve {
  id: SleeveId;
  name: string;
  description: string;
  weight: number; // 0-1, represents percentage
}

export interface ExampleETF {
  ticker: string;
  name: string;
  description: string;
  sleeveId: SleeveId;
}

export interface ModelPortfolio {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  sleeves: Sleeve[];
}

export interface QuestionnaireResult {
  answers: QuestionnaireAnswers;
  riskLevel: RiskLevel;
}

export interface PlatformSplit {
  platform: PlatformType; // 'voya_only' | 'voya_and_schwab'
  targetVoyaPct: number;   // percent of the total 457 balance
  targetSchwabPct: number; // percent of the total 457 balance (0–75 for voya_and_schwab)
}

export type VoyaImplementationStyle = 'core_mix';

export interface VoyaFundMixItem {
  id: string;
  name: string;
  role: string;          // short description e.g. "US large-cap core", "international equity"
  allocationPct: number; // percent of the Voya slice (not of total 457)
}

export interface VoyaImplementation {
  style: VoyaImplementationStyle;
  description: string;
  mix?: VoyaFundMixItem[];
  note?: string; // Optional user-facing note (e.g., fallback message)
}

export interface VoyaFundDelta {
  id: string;
  name: string;
  role?: string;
  currentPct: number; // % of the Voya portion today (0–100)
  targetPct: number;  // % of the Voya portion in the suggested mix (0–100)
  deltaPct: number;   // targetPct - currentPct (positive = increase)
}

export interface VoyaDeltaPlan {
  hasData: boolean;          // false if user didn't enter current mix
  totalCurrentPct: number;   // sum of currentPct values (for sanity display)
  deltas: VoyaFundDelta[];
  overweight: VoyaFundDelta[];  // deltaPct < -1
  underweight: VoyaFundDelta[]; // deltaPct > 1
}


