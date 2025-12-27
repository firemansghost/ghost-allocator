/**
 * Model Portfolio Catalog
 * Placeholder definitions for future model portfolios
 */

export interface ModelPortfolio {
  id: string;
  name: string;
  description: string;
  intendedUser: string;
  turnoverExpectation: 'Low' | 'Medium' | 'High';
  oneLiner: string;
  comingSoon: boolean;
}

export const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk, steady growth focus',
    intendedUser: 'Set-it-and-mostly-forget-it',
    turnoverExpectation: 'Low',
    oneLiner: 'Uses GhostRegime to adjust exposure, not predict tops/bottoms.',
    comingSoon: true,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Moderate risk with growth potential',
    intendedUser: 'Can tolerate swings',
    turnoverExpectation: 'Low',
    oneLiner: 'Uses GhostRegime to adjust exposure, not predict tops/bottoms.',
    comingSoon: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Higher risk, higher growth potential',
    intendedUser: 'Comfortable with volatility',
    turnoverExpectation: 'Low',
    oneLiner: 'Uses GhostRegime to adjust exposure, not predict tops/bottoms.',
    comingSoon: true,
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Maximum growth focus',
    intendedUser: 'Can tolerate significant swings',
    turnoverExpectation: 'Low',
    oneLiner: 'Uses GhostRegime to adjust exposure, not predict tops/bottoms.',
    comingSoon: true,
  },
  {
    id: 'ghostregime-60-30-10',
    name: 'GhostRegime 60/30/10',
    description: 'Flagship template: 60% stocks, 30% gold, 10% BTC with regime-based scaling',
    intendedUser: 'Set-it-and-mostly-forget-it',
    turnoverExpectation: 'Low',
    oneLiner: 'Uses GhostRegime to adjust exposure, not predict tops/bottoms.',
    comingSoon: true,
  },
];

export function getModelPortfolio(id: string): ModelPortfolio | undefined {
  return MODEL_PORTFOLIOS.find((m) => m.id === id);
}












