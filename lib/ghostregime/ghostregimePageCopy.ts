/**
 * GhostRegime Page Copy
 * 
 * Centralized copy for the GhostRegime main page UI.
 * If you change GhostRegime page wording, do it here. Components should not embed copy.
 */

export const WHY_REGIME_TITLE = 'Why this regime today?';

export const FLIPWATCH_TITLE_PREFIX = 'Flip Watch:';

export const FLIPWATCH_NONE_HINT = 'Flip Watch is off — no one-day head fake detected.';

export const FLIPWATCH_EXPLANATION_LINES = [
  "This is the model saying: 'cool story — show me tomorrow too.'",
  'It reduces whipsaw by waiting for confirmation.',
];

export const SO_WHAT_LINES = {
  riskOn: 'Markets are acting brave.',
  riskOff: 'Markets are acting like they saw a ghost.',
  inflation: 'Prices are being spicy.',
  disinflation: 'Prices are calming down (for now).',
} as const;

// Top Drivers Today
export const TOP_DRIVERS_TITLE = 'Top drivers today';
export const TOP_DRIVERS_RISK_HEADER = 'Risk axis';
export const TOP_DRIVERS_INFLATION_HEADER = 'Inflation axis';
export const TOP_DRIVERS_FALLBACK = 'Driver list unavailable for this snapshot (older data).';
export const TOP_DRIVERS_FOOTNOTE = "These are the two biggest signal votes feeding today's scores. Full receipts live in Nerd Mode.";
export const TOP_DRIVERS_NO_STRONG_DRIVERS = 'No strong drivers today. The model is basically shrugging.';

// Agreement/Confidence
export const AGREEMENT_LABEL_PREFIX = 'Agreement:';
export const AGREEMENT_TOOLTIP = 'Agreement among non-zero signal votes. Not a probability.';
export const AGREEMENT_TOOLTIP_NA = 'All signals were neutral today.';

