export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export type RegimeScenario = 'stagflationary' | 'deflationary' | 'growth';

export type PensionCoverage =
  | 'none'
  | 'less_than_half'
  | 'about_half'
  | 'most_or_all';

export type SleeveId =
  | 'core_equity'
  | 'convex_equity'
  | 'real_assets'
  | 't_bills'
  | 'core_bonds'
  | 'managed_futures'
  | 'rate_hedge'
  | 'cash';

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


