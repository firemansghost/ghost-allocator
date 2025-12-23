/**
 * Model Template Catalog
 * Single source of truth for model portfolio templates displayed on /models page
 * These are UI templates that users can select (or will be able to select)
 */

export type ModelTemplateBadge = 'Coming Soon' | 'Live' | 'House';
export type TurnoverExpectation = 'Low' | 'Medium' | 'High';
export type TemplateStatus = 'available' | 'coming_soon';

export interface ModelTemplate {
  id: string;
  title: string;
  status: TemplateStatus;
  badge?: ModelTemplateBadge;
  subtitle: string; // 1 line
  intendedFor: string;
  turnover: TurnoverExpectation;
  usesGhostRegime: boolean;
  description: string; // short paragraph used in card body
  tags?: string[];
  notes?: string[];
}

/**
 * Model Templates
 * Displayed in this exact order on /models page
 */
export const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    id: 'conservative',
    title: 'Conservative',
    status: 'coming_soon',
    badge: 'Coming Soon',
    subtitle: 'Lower risk, steady growth focus',
    intendedFor: 'Set-it-and-mostly-forget-it',
    turnover: 'Low',
    usesGhostRegime: true,
    description: 'Lower risk, steady growth focus',
    tags: ['defensive', 'low-volatility'],
  },
  {
    id: 'balanced',
    title: 'Balanced',
    status: 'coming_soon',
    badge: 'Coming Soon',
    subtitle: 'Moderate risk with growth potential',
    intendedFor: 'Can tolerate swings',
    turnover: 'Low',
    usesGhostRegime: true,
    description: 'Moderate risk with growth potential',
    tags: ['balanced', 'moderate-risk'],
  },
  {
    id: 'growth',
    title: 'Growth',
    status: 'coming_soon',
    badge: 'Coming Soon',
    subtitle: 'Higher risk, higher growth potential',
    intendedFor: 'Comfortable with volatility',
    turnover: 'Low',
    usesGhostRegime: true,
    description: 'Higher risk, higher growth potential',
    tags: ['growth', 'higher-risk'],
  },
  {
    id: 'aggressive',
    title: 'Aggressive',
    status: 'coming_soon',
    badge: 'Coming Soon',
    subtitle: 'Maximum growth focus',
    intendedFor: 'Can tolerate significant swings',
    turnover: 'Low',
    usesGhostRegime: true,
    description: 'Maximum growth focus',
    tags: ['aggressive', 'high-risk'],
  },
  {
    id: 'ghostregime-60-30-10',
    title: 'GhostRegime 60/30/10',
    status: 'available',
    badge: 'House',
    subtitle: 'Flagship template: 60% stocks, 30% gold, 10% BTC with regime-based scaling',
    intendedFor: 'Set-it-and-mostly-forget-it',
    turnover: 'Low',
    usesGhostRegime: true,
    description: 'Flagship template: 60% stocks, 30% gold, 10% BTC with regime-based scaling',
    tags: ['flagship', 'gold', 'bitcoin'],
    notes: [
      'Example implementation in Schwab: SPYM (stocks), GLDM (gold), FBTC (bitcoin)',
      'Requires Schwab/BrokerageLink',
      'This is the house template; other templates are risk-based and do NOT require Gold/BTC unless enabled later',
    ],
  },
];

/**
 * Get a model template by ID
 */
export function getModelTemplate(id: string): ModelTemplate | undefined {
  return MODEL_TEMPLATES.find((t) => t.id === id);
}

