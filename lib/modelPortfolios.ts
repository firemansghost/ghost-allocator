import type { RiskLevel, SleeveId } from './types';
import { sleeveDefinitions } from './sleeves';

/**
 * Model Portfolio ID - maps to risk levels 1-5
 */
export type ModelId = 'r1' | 'r2' | 'r3' | 'r4' | 'r5';

/**
 * Model Portfolio Specification
 * Single source of truth for model portfolio sleeve allocations
 */
export interface ModelPortfolioSpec {
  id: ModelId;
  name: string;
  riskLevel: RiskLevel;
  description: string;
  sleeves: Record<SleeveId, number>; // sleeve ID -> weight (0-1, represents percentage)
}

/**
 * Model Portfolio Definitions
 * These are the "blueprints" that drive builder output.
 * Weights are percentages (0-1) and should sum to ~1.0 (100%).
 */
export const MODEL_PORTFOLIOS: Record<ModelId, ModelPortfolioSpec> = {
  r1: {
    id: 'r1',
    name: 'Conservative',
    riskLevel: 1,
    description: 'Lower risk, higher allocation to defensive assets and cash. Suitable for those near retirement or with low risk tolerance.',
    sleeves: {
      core_equity: 0.20,
      convex_equity: 0.10,
      real_assets: 0.15,
      t_bills: 0.20,
      core_bonds: 0.15,
      managed_futures: 0.10,
      rate_hedge: 0.05,
      cash: 0.05,
    },
  },
  r2: {
    id: 'r2',
    name: 'Conservative',
    riskLevel: 2,
    description: 'Lower risk, higher allocation to defensive assets and cash. Suitable for those near retirement or with low risk tolerance.',
    sleeves: {
      core_equity: 0.20,
      convex_equity: 0.10,
      real_assets: 0.15,
      t_bills: 0.20,
      core_bonds: 0.15,
      managed_futures: 0.10,
      rate_hedge: 0.05,
      cash: 0.05,
    },
  },
  r3: {
    id: 'r3',
    name: 'Moderate',
    riskLevel: 3,
    description: 'Balanced allocation across asset classes. Designed for investors with medium-term horizons and moderate risk tolerance.',
    sleeves: {
      core_equity: 0.30,
      convex_equity: 0.15,
      real_assets: 0.15,
      t_bills: 0.10,
      core_bonds: 0.10,
      managed_futures: 0.12,
      rate_hedge: 0.05,
      cash: 0.03,
    },
  },
  r4: {
    id: 'r4',
    name: 'Aggressive',
    riskLevel: 4,
    description: 'Higher equity allocation with strategic use of convexity and real assets. For investors with longer horizons and higher risk tolerance.',
    sleeves: {
      core_equity: 0.35,
      convex_equity: 0.20,
      real_assets: 0.15,
      t_bills: 0.05,
      core_bonds: 0.05,
      managed_futures: 0.15,
      rate_hedge: 0.03,
      cash: 0.02,
    },
  },
  r5: {
    id: 'r5',
    name: 'Aggressive',
    riskLevel: 5,
    description: 'Higher equity allocation with strategic use of convexity and real assets. For investors with longer horizons and higher risk tolerance.',
    sleeves: {
      core_equity: 0.35,
      convex_equity: 0.20,
      real_assets: 0.15,
      t_bills: 0.05,
      core_bonds: 0.05,
      managed_futures: 0.15,
      rate_hedge: 0.03,
      cash: 0.02,
    },
  },
};

/**
 * Risk Level to Model ID Mapping
 * Maps computed risk level (1-5) to the corresponding model portfolio
 */
export const RISK_TO_MODEL: Record<RiskLevel, ModelId> = {
  1: 'r1',
  2: 'r2',
  3: 'r3',
  4: 'r4',
  5: 'r5',
};

/**
 * Sum sleeve weights for a model portfolio spec
 */
export function sumSleeves(spec: ModelPortfolioSpec): number {
  return Object.values(spec.sleeves).reduce((sum, weight) => sum + weight, 0);
}

/**
 * Validate model portfolio specifications
 * Checks:
 * - All sleeve keys exist in sleeve definitions
 * - All values are numbers
 * - Sum is ~100% (tolerance: ±0.5%)
 */
export function validateModelSpecs(specs: Record<ModelId, ModelPortfolioSpec>): void {
  const allSleeveIds = new Set(Object.keys(sleeveDefinitions) as SleeveId[]);
  const tolerance = 0.005; // ±0.5%

  for (const [modelId, spec] of Object.entries(specs)) {
    // Check all sleeve keys exist
    for (const sleeveId of Object.keys(spec.sleeves) as SleeveId[]) {
      if (!allSleeveIds.has(sleeveId)) {
        throw new Error(
          `Model ${modelId}: Invalid sleeve ID "${sleeveId}". Must be one of: ${Array.from(allSleeveIds).join(', ')}`
        );
      }
    }

    // Check all values are numbers
    for (const [sleeveId, weight] of Object.entries(spec.sleeves)) {
      if (typeof weight !== 'number' || isNaN(weight)) {
        throw new Error(
          `Model ${modelId}: Sleeve "${sleeveId}" has invalid weight: ${weight}. Must be a number.`
        );
      }
    }

    // Check sum is ~100%
    const sum = sumSleeves(spec);
    if (Math.abs(sum - 1.0) > tolerance) {
      throw new Error(
        `Model ${modelId}: Sleeve weights sum to ${(sum * 100).toFixed(2)}%, expected ~100% (tolerance: ±${(tolerance * 100).toFixed(1)}%)`
      );
    }
  }
}

// Validate in development to catch mistakes early
if (process.env.NODE_ENV !== 'production') {
  try {
    validateModelSpecs(MODEL_PORTFOLIOS);
  } catch (error) {
    console.error('Model portfolio validation failed:', error);
    // In development, we want to fail loudly
    throw error;
  }
}





