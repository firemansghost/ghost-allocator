/**
 * Builder Smoke Test
 * Validates key invariants for the Portfolio Builder system without secrets or network.
 * Run: npm run smoke:builder
 */

import type { RiskLevel, QuestionnaireAnswers } from '../lib/types';
import { MODEL_PORTFOLIOS, type ModelId } from '../lib/modelPortfolios';
import { selectModelPortfolio } from '../lib/portfolioEngine';
import { getStandardSchwabLineup } from '../lib/schwabLineups';
import { buildVoyaImplementation } from '../lib/voya';
import { VOYA_FUNDS_BY_ID } from '../lib/voyaFunds';
import { sleeveDefinitions } from '../lib/sleeves';

const WEIGHT_TOLERANCE = 0.1; // ±0.1% for sums
const VALID_SLEEVE_IDS = new Set<string>(Object.keys(sleeveDefinitions));

/** Minimal QuestionnaireAnswers for buildVoyaImplementation (no network) */
function minimalAnswers(overrides: Partial<QuestionnaireAnswers>): QuestionnaireAnswers {
  return {
    age: 50,
    yearsToGoal: 15,
    isRetired: false,
    drawdownTolerance: 'medium',
    behaviorInCrash: 'hold',
    incomeStability: 'medium',
    complexityPreference: 'moderate',
    hasPension: false,
    pensionCoverage: 'none',
    platform: 'voya_only',
    portfolioPreset: 'standard',
    goldBtcTilt: 'none',
    ...overrides,
  };
}

/** Extract all tickers from a Schwab lineup (ignore cash/no-etf sleeves) */
function extractTickers(
  lineup: ReturnType<typeof getStandardSchwabLineup>
): string[] {
  const tickers: string[] = [];
  for (const item of lineup) {
    if (item.type === 'tilt' && item.ticker) {
      tickers.push(item.ticker);
    }
    if (item.type === 'sleeve' && item.etfs) {
      for (const etf of item.etfs) {
        tickers.push(etf.ticker);
      }
    }
  }
  return tickers;
}

// --- A) Model portfolio weights sanity ---
function checkModelPortfolioWeights(): void {
  for (const [modelId, spec] of Object.entries(MODEL_PORTFOLIOS) as [ModelId, (typeof MODEL_PORTFOLIOS)[ModelId]][]) {
    const sleeveIds = Object.keys(spec.sleeves);
    const seen = new Set<string>();
    for (const id of sleeveIds) {
      if (seen.has(id)) {
        throw new Error(
          `[A] Model ${modelId}: Duplicate sleeve ID "${id}". File: lib/modelPortfolios.ts`
        );
      }
      seen.add(id);
    }

    for (const [sleeveId, weight] of Object.entries(spec.sleeves)) {
      if (weight < 0) {
        throw new Error(
          `[A] Model ${modelId}: Negative weight for sleeve "${sleeveId}" = ${weight}. File: lib/modelPortfolios.ts`
        );
      }
      if (!VALID_SLEEVE_IDS.has(sleeveId)) {
        throw new Error(
          `[A] Model ${modelId}: Invalid sleeve ID "${sleeveId}" (not in sleeveDefinitions). File: lib/modelPortfolios.ts, lib/sleeves.ts`
        );
      }
    }

    const sum = Object.values(spec.sleeves).reduce((s, w) => s + w, 0);
    const pct = sum * 100;
    if (Math.abs(pct - 100) > WEIGHT_TOLERANCE) {
      throw new Error(
        `[A] Model ${modelId}: Sleeve weights sum to ${pct.toFixed(2)}%, expected ~100% (tolerance ±${WEIGHT_TOLERANCE}%). File: lib/modelPortfolios.ts`
      );
    }
  }
}

// --- B) Schwab lineup sanity ---
function checkSchwabLineups(): void {
  const riskLevels: RiskLevel[] = [1, 2, 3, 4, 5];
  const lineupStyles = ['standard', 'simplify'] as const;
  const goldInstrument = 'gldm' as const;
  const btcInstrument = 'fbtc' as const;
  const tilt = 'none' as const;

  for (const riskLevel of riskLevels) {
    const portfolio = selectModelPortfolio(riskLevel);

    for (const lineupStyle of lineupStyles) {
      const lineup = getStandardSchwabLineup(
        portfolio.sleeves,
        riskLevel,
        lineupStyle,
        goldInstrument,
        btcInstrument,
        tilt
      );

      // Simplify mode intentionally shares SBIL for both t_bills and cash; only check standard
      if (lineupStyle === 'standard') {
        const tickers = extractTickers(lineup);
        const uniqueTickers = new Set(tickers);
        if (tickers.length !== uniqueTickers.size) {
          const dupes = tickers.filter((t, i) => tickers.indexOf(t) !== i);
          throw new Error(
            `[B] Risk ${riskLevel}, lineupStyle=${lineupStyle}: Duplicate tickers: ${[...new Set(dupes)].join(', ')}. File: lib/schwabLineups.ts, lib/portfolioEngine.ts`
          );
        }
      }

      const total = lineup.reduce((s, i) => s + i.weight, 0);
      if (Math.abs(total - 100) > WEIGHT_TOLERANCE) {
        throw new Error(
          `[B] Risk ${riskLevel}, lineupStyle=${lineupStyle}: Lineup weights sum to ${total.toFixed(2)}%, expected ~100%. File: lib/schwabLineups.ts`
        );
      }

      for (const item of lineup) {
        if (!VALID_SLEEVE_IDS.has(item.id) && item.type === 'sleeve') {
          throw new Error(
            `[B] Risk ${riskLevel}, lineupStyle=${lineupStyle}: Invalid sleeve ID "${item.id}" in lineup (not in SleeveId). File: lib/schwabLineups.ts, lib/sleeves.ts`
          );
        }
      }
    }
  }
}

// --- C) Voya fund ID integrity ---
function checkVoyaFundIntegrity(): void {
  const riskLevels: RiskLevel[] = [1, 2, 3, 4, 5];
  const platforms = ['voya_only', 'voya_and_schwab'] as const;

  for (const riskLevel of riskLevels) {
    for (const platform of platforms) {
      const answers = minimalAnswers({
        platform,
        portfolioPreset: 'standard',
        complexityPreference: 'moderate',
        goldBtcTilt: 'none',
        riskLevelOverride: riskLevel,
      });

      const impl = buildVoyaImplementation(answers, riskLevel);
      const mix = impl.mix ?? [];

      for (const item of mix) {
        const fundId = item.id;
        if (!VOYA_FUNDS_BY_ID.has(fundId)) {
          throw new Error(
            `[C] Risk ${riskLevel}, platform=${platform}: Invalid fund ID "${fundId}" in Voya mix (not in VOYA_FUNDS). File: lib/voya.ts, lib/voyaFunds.ts`
          );
        }
      }

      const sum = mix.reduce((s, i) => s + i.allocationPct, 0);
      if (Math.abs(sum - 100) > WEIGHT_TOLERANCE) {
        throw new Error(
          `[C] Risk ${riskLevel}, platform=${platform}: Voya mix weights sum to ${sum.toFixed(2)}%, expected ~100%. File: lib/voya.ts`
        );
      }
    }
  }
}

// --- Main ---
function main(): void {
  console.log('Builder smoke test...');

  checkModelPortfolioWeights();
  console.log('  [A] Model portfolio weights: OK');

  checkSchwabLineups();
  console.log('  [B] Schwab lineups: OK');

  checkVoyaFundIntegrity();
  console.log('  [C] Voya fund integrity: OK');

  const modelCount = Object.keys(MODEL_PORTFOLIOS).length;
  const riskCount = 5;
  const lineupStyles = 2;
  const platforms = 2;
  console.log('');
  console.log(
    `Smoke test passed. Models: ${modelCount}, Schwab lineups: ${riskCount}×${lineupStyles}, Voya mixes: ${riskCount}×${platforms}.`
  );
}

main();
