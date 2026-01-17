import type {
  QuestionnaireAnswers,
  RiskLevel,
  ModelPortfolio,
  ExampleETF,
  RegimeScenario,
  PlatformSplit,
  Sleeve,
  SleeveId,
} from './types';
import { exampleETFs, sleeveDefinitions } from './sleeves';
import { MODEL_PORTFOLIOS, RISK_TO_MODEL } from './modelPortfolios';
import { buildVoyaImplementation } from './voya';

/**
 * Computes risk level from questionnaire answers using a numeric scoring system
 * Starts from neutral base (3), adjusts for various factors, then applies pension boost
 * If riskLevelOverride is set, returns that value instead (used by templates)
 */
export function computeRiskLevel(answers: QuestionnaireAnswers): RiskLevel {
  // If override is set (e.g., from a template), use it directly
  if (answers.riskLevelOverride !== undefined) {
    return answers.riskLevelOverride;
  }

  // Start at neutral
  let score = 3;

  // Age / horizon
  if (answers.yearsToGoal <= 5 || answers.isRetired) {
    score -= 1;
  } else if (answers.yearsToGoal >= 20) {
    score += 0.5;
  }

  // Drawdown tolerance
  if (answers.drawdownTolerance === 'low') score -= 1;
  if (answers.drawdownTolerance === 'high') score += 1;

  // Crash behavior
  if (answers.behaviorInCrash === 'panic_sell') score -= 1;
  if (answers.behaviorInCrash === 'buy_more') score += 0.5;

  // Income stability
  if (answers.incomeStability === 'low') score -= 0.5;
  if (answers.incomeStability === 'high') score += 0.25;

  // Complexity preference (very mild influence)
  if (answers.complexityPreference === 'simple') score -= 0.25;
  if (answers.complexityPreference === 'advanced') score += 0.25;

  // 🔥 Pension / income floor adjustment
  if (answers.hasPension) {
    switch (answers.pensionCoverage) {
      case 'most_or_all':
        score += 0.75;
        break;
      case 'about_half':
        score += 0.5;
        break;
      case 'less_than_half':
        score += 0.25;
        break;
      case 'none':
      default:
        // no change
        break;
    }
  }

  // Clamp and round to RiskLevel 1–5
  if (score < 1) score = 1;
  if (score > 5) score = 5;
  const rounded = Math.round(score) as RiskLevel;
  return rounded;
}

/**
 * Selects a model portfolio based on risk level and regime scenario
 * Defaults to 'stagflationary' scenario
 * 
 * TODO: In the future, scenario could influence the selection (e.g., different allocations for stagflationary vs deflationary regimes)
 */
export function selectModelPortfolio(
  riskLevel: RiskLevel,
  scenario: RegimeScenario = 'stagflationary'
): ModelPortfolio {
  // Map risk level to model ID using the single source of truth
  const modelId = RISK_TO_MODEL[riskLevel];
  const spec = MODEL_PORTFOLIOS[modelId];

  // Convert ModelPortfolioSpec to ModelPortfolio format
  // Build sleeves array from spec.sleeves Record
  // Filter out real_assets (legacy) and only include sleeves with non-zero weight
  const sleeves: Sleeve[] = Object.entries(spec.sleeves)
    .filter(([sleeveId]) => sleeveId !== 'real_assets') // Exclude legacy real_assets from Schwab lineup
    .map(([sleeveId, weight]) => {
      const sleeveDef = sleeveDefinitions[sleeveId as SleeveId];
      if (!sleeveDef) {
        throw new Error(`Sleeve definition not found for ID: ${sleeveId}`);
      }
      return {
        ...sleeveDef,
        weight: weight || 0,
      };
    })
    .filter((s) => s.weight > 0); // Only include sleeves with non-zero weight

  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    riskLevel: spec.riskLevel,
    sleeves,
  };
}

/**
 * Suggests example ETFs for a given model portfolio
 */
export function suggestExampleEtfs(
  modelPortfolio: ModelPortfolio
): ExampleETF[] {
  const sleeveIds = modelPortfolio.sleeves
    .filter((s) => s.weight > 0)
    .map((s) => s.id);

  // Get ETFs for each sleeve, limit to 1-2 per sleeve
  const etfsBySleeve: Record<string, ExampleETF[]> = {};
  for (const sleeveId of sleeveIds) {
    etfsBySleeve[sleeveId] = exampleETFs.filter(
      (etf) => etf.sleeveId === sleeveId
    );
  }

  // Return up to 2 ETFs per sleeve
  const suggested: ExampleETF[] = [];
  for (const sleeveId of sleeveIds) {
    const etfs = etfsBySleeve[sleeveId].slice(0, 2);
    suggested.push(...etfs);
  }

  return suggested;
}

/**
 * Computes the platform split between Voya and Schwab based on questionnaire answers
 */
export function computePlatformSplit(answers: QuestionnaireAnswers): PlatformSplit {
  if (answers.platform === 'voya_only') {
    return {
      platform: 'voya_only',
      targetVoyaPct: 100,
      targetSchwabPct: 0,
    };
  }

  // default starting point
  const current =
    typeof answers.currentSchwabPct === 'number' ? answers.currentSchwabPct : 50;
  const pref = answers.schwabPreference ?? 'stay_low';

  let targetSchwabPct = Math.min(75, Math.max(0, current));

  if (pref === 'use_full_75') {
    targetSchwabPct = 75;
  } else {
    // stay_low: keep near current, but gently clamp into [25, 60]
    targetSchwabPct = Math.min(60, Math.max(25, targetSchwabPct));
  }

  const targetVoyaPct = Math.max(0, 100 - targetSchwabPct);

  return {
    platform: 'voya_and_schwab',
    targetVoyaPct,
    targetSchwabPct,
  };
}

// Re-export buildVoyaImplementation for convenience
export { buildVoyaImplementation } from './voya';
// Re-export computeVoyaDeltaPlan and getVoyaDeltaSummary for convenience
export { computeVoyaDeltaPlan, getVoyaDeltaSummary } from './voyaDelta';


