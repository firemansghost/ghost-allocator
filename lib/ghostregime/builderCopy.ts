/**
 * GhostRegime Builder Education Copy
 * 
 * If you change Builder GhostRegime education wording, do it here. Components should not embed copy.
 * 
 * This module centralizes all micro-copy used in the Builder's GhostRegime house education panels.
 * Reuse constants from lib/ghostregime/content.ts where applicable (update timing, stale behavior, etc.).
 */

// Note: We import from content.ts only if we need to reuse constants.
// Currently, Builder has its own cadence line wording, so no imports needed.

/**
 * Snapshot panel title
 */
export const BUILDER_GHOSTREGIME_SNAPSHOT_TITLE = 'GhostRegime snapshot';

/**
 * Stale badge label
 */
export const BUILDER_STALE_BADGE = 'Stale';

/**
 * "So what?" intro line (shown after scale explanations)
 */
export const BUILDER_SO_WHAT_INTRO_LINE =
  'Anything scaled down sits as Schwab cash until you rebalance.';

/**
 * Change summary section header
 */
export const BUILDER_CHANGE_SUMMARY_HEADER = 'What changed since last update:';

/**
 * No changes message
 */
export const BUILDER_NO_CHANGE_LINE =
  'No change since the last update. Markets were boring. (Enjoy it.)';

/**
 * Change summary fallback (when history fetch fails)
 */
export const BUILDER_CHANGE_SUMMARY_FALLBACK_LINE =
  "Change summary unavailable — showing today's snapshot only.";

/**
 * Link labels
 */
export const BUILDER_LINK_DASHBOARD = 'Open dashboard';
export const BUILDER_LINK_METHODOLOGY = 'Read methodology';

/**
 * Glossary section
 */
export const BUILDER_GLOSSARY_SUMMARY = 'What do these mean?';

export interface GlossaryItem {
  term: string;
  definition: string;
}

export const BUILDER_GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Regime',
    definition: 'macro backdrop (growth/inflation mix).',
  },
  {
    term: 'Scales',
    definition: "how much exposure we're taking today (1, 0.5, 0).",
  },
  {
    term: 'Cash',
    definition: 'unallocated Schwab cash created when something is scaled down.',
  },
];

/**
 * Scaling callout
 */
export const BUILDER_SCALING_CALLOUT_TITLE = 'GhostRegime scaling applied';
export const BUILDER_SCALING_AS_OF_PREFIX = 'As of: ';
export const BUILDER_SCALING_STOCKS_LABEL = 'Stocks ×';
export const BUILDER_SCALING_GOLD_LABEL = 'Gold ×';
export const BUILDER_SCALING_BTC_LABEL = 'BTC ×';

/**
 * Cadence line
 * Note: This is Builder-specific wording. The methodology page uses a slightly different version
 * from GHOSTREGIME_UPDATE_TIMING_LINES, but this one is more specific to the Builder context.
 */
export const BUILDER_SCALING_CADENCE_LINE =
  'Targets can change as regimes change. Most people apply changes on a simple cadence (e.g., monthly) rather than reacting daily.';

/**
 * Rebalance cheatsheet
 */
export const BUILDER_REBALANCE_TITLE = 'Rebalance cheatsheet';
export const BUILDER_REBALANCE_SUBTITLE = 'Based on your Schwab slice. Use your chosen cadence.';
export const BUILDER_REBALANCE_INTRO = "If you're rebalancing today:";
export const BUILDER_REBALANCE_TRIM_TEMPLATE = 'Trim {ticker} by ~{delta}%';
export const BUILDER_REBALANCE_ADD_TEMPLATE = 'Add {ticker} by ~{delta}%';
export const BUILDER_REBALANCE_CASH_NOTE = 'Use Schwab cash to fund the adds';
export const BUILDER_DO_NOTHING_LINE = "You're basically on target. Do nothing. Touch grass.";

/**
 * Execution hints
 */
export const BUILDER_EXECUTION_HINT_SUMMARY = 'How do I execute this?';
export const BUILDER_EXECUTION_HINT_LINES: string[] = [
  "In Schwab, you're adjusting ETFs + Schwab cash.",
  "In Voya, you're adjusting core funds (Stable Value is cash-like).",
  'House preset uses Schwab for Gold/BTC exposure.',
];

/**
 * Why this setup?
 */
export const BUILDER_WHY_SETUP_TITLE = 'Why this setup?';
export const BUILDER_WHY_SETUP_SUMMARY_TEMPLATE = 'Why {stocks}/{gold}/{btc}?';

/**
 * Why setup explanation lines (templates with placeholders)
 * These will be formatted with actual values in the component
 */
export interface WhySetupLine {
  label: string; // e.g., "{stocks}% Stocks"
  description: string; // e.g., "= growth engine ({ticker})"
}

export const BUILDER_WHY_SETUP_STOCKS_TEMPLATE: WhySetupLine = {
  label: '{stocks}% Stocks',
  description: '= growth engine ({ticker})',
};

export const BUILDER_WHY_SETUP_GOLD_TEMPLATE: WhySetupLine = {
  label: '{gold}% Gold',
  description: '= inflation/monetary weirdness hedge ({label})',
};

export const BUILDER_WHY_SETUP_BTC_TEMPLATE: WhySetupLine = {
  label: '{btc}% Bitcoin',
  description: '= asymmetric "call option on chaos" ({label})',
};

export const BUILDER_WHY_SETUP_DIVERSIFICATION_NOTE =
  "It's diversified… but still admits we live in interesting times.";
export const BUILDER_WHY_SETUP_TARGET_SCOPE_NOTE =
  'These targets are for your Schwab brokerage slice (not your whole 457).';

/**
 * Scale explanation
 */
export const BUILDER_SCALE_EXPLANATION_SUMMARY = 'What do the scales mean?';

export interface ScaleExplanationItem {
  value: string; // e.g., "1.0"
  description: string; // e.g., "full size (normal exposure)"
}

export const BUILDER_SCALE_EXPLANATION_ITEMS: ScaleExplanationItem[] = [
  {
    value: '1.0',
    description: 'full size (normal exposure)',
  },
  {
    value: '0.5',
    description: 'half size (cautious)',
  },
  {
    value: '0.0',
    description: 'off (risk control)',
  },
];

export const BUILDER_SCALE_CASH_EXPLANATION_LINE =
  'When something is scaled down, the unused portion sits as Schwab cash (unallocated) until your next rebalance.';

/**
 * Fallback messages (when GhostRegime data unavailable)
 */
export const BUILDER_SCALING_MISSING_LINE =
  "Scales come from GhostRegime. Data isn't available right now, so you're seeing base targets (no scaling).";
export const BUILDER_DATA_UNAVAILABLE_LINE =
  "GhostRegime data isn't available right now — showing base targets (no scaling).";

/**
 * Cash distinction (Schwab cash vs Voya Stable Value)
 */
export const BUILDER_CASH_LABEL = 'Schwab cash (unallocated)';
export const BUILDER_CASH_DISTINCTION_LINE =
  'This is cash sitting in your Schwab brokerage slice — not your Voya "Stable Value Option".';
export const BUILDER_CASH_EXPLANATION_LINE =
  'When GhostRegime scales an asset down, the difference stays as Schwab cash until you rebalance.';

