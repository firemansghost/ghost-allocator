import type {
  QuestionnaireAnswers,
  RiskLevel,
  ModelPortfolio,
  ExampleETF,
  RegimeScenario,
} from './types';
import { modelPortfolios, exampleETFs } from './sleeves';

/**
 * Computes risk level from questionnaire answers using a numeric scoring system
 * Starts from neutral base (3), adjusts for various factors, then applies pension boost
 */
export function computeRiskLevel(answers: QuestionnaireAnswers): RiskLevel {
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
 */
export function selectModelPortfolio(
  riskLevel: RiskLevel,
  scenario: RegimeScenario = 'stagflationary'
): ModelPortfolio {
  // For now, we map risk levels directly to portfolios
  // In the future, scenario could influence the selection
  if (riskLevel <= 1) {
    return modelPortfolios.find((p) => p.id === 'conservative')!;
  } else if (riskLevel === 2) {
    // Check if user is retired to use retirement portfolio
    // For now, default to conservative for level 2
    return modelPortfolios.find((p) => p.id === 'conservative')!;
  } else if (riskLevel === 3) {
    return modelPortfolios.find((p) => p.id === 'moderate')!;
  } else if (riskLevel >= 4) {
    return modelPortfolios.find((p) => p.id === 'aggressive')!;
  }
  // Default fallback
  return modelPortfolios.find((p) => p.id === 'moderate')!;
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


