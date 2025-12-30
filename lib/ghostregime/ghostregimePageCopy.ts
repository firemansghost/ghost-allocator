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

// Agreement Trend
export const AGREEMENT_TREND_HEADER = 'Signal agreement';
export const AGREEMENT_TREND_RISK_PREFIX = 'Risk agreement:';
export const AGREEMENT_TREND_INFLATION_PREFIX = 'Inflation agreement:';
export const AGREEMENT_TREND_CLEANER = 'cleaner';
export const AGREEMENT_TREND_MIXED = 'more mixed';
export const AGREEMENT_TREND_SAME = 'about the same';

// Agreement History
export const AGREEMENT_HISTORY_LABEL = 'Recent agreement';
export const TOP_DRIVERS_OLD_DATA_HINT = "Drivers/receipts weren't saved for this older snapshot. New snapshots will include them after the next update.";
export const AGREEMENT_HISTORY_HINT = "Agreement history uses receipts. This snapshot is older — it'll fill in after the next update.";
export const AGREEMENT_HISTORY_INSUFFICIENT_HINT = 'Agreement history will appear after a couple updates.';

// Confidence
export const CONFIDENCE_LABEL_PREFIX = 'Confidence:';
export const CONFIDENCE_TOOLTIP = 'Heuristic: agreement + breadth (coverage). Not a probability.';
export const COVERAGE_TOOLTIP = 'Coverage = how many signals fired (non-neutral) out of total signals.';

// Conviction
export const CONVICTION_LABEL_PREFIX = 'Conviction:';
export const CONVICTION_TOOLTIP = '|net vote| per available signals. Not a probability or forecast.';
export const CONVICTION_TOOLTIP_SPICY = '|net vote| per available signals. Not a probability or forecast. High conviction = signals piling onto one side today. Could be clarity… or a crowded trade.';
export const CONVICTION_TOOLTIP_NA = 'Conviction is unavailable when net vote or signal count is missing.';

// Regime Summary
export const REGIME_SUMMARY_TITLE = 'Regime Summary';
export const REGIME_CONVICTION_LABEL_PREFIX = 'Regime Conviction:';
export const REGIME_CONVICTION_TOOLTIP = 'Combined strength of today\'s Risk + Inflation signals. Not a forecast.';
export const REGIME_CONFIDENCE_LABEL_PREFIX = 'Regime Confidence:';
export const REGIME_CONFIDENCE_TOOLTIP = 'Heuristic from signal agreement + coverage. Not a probability.';
export const PRIMARY_DRIVER_PREFIX = 'Primary driver:';
export const PRIMARY_DRIVER_TOOLTIP = 'Which axis (Risk or Inflation) has the stronger signal today.';
export const FLIPWATCH_PILL_TOOLTIP = 'Flip Watch reduces whipsaw by waiting for confirmation.';
export const ACTIONABLE_READ_PREFIX = 'Actionable read:';
export const CROWDED_LABEL = 'Crowded';
export const CROWDED_TOOLTIP = 'Signals are piling onto one side. Could be clarity… or everyone running through the same door.';
export const COPY_SNAPSHOT_BUTTON = 'Copy';
export const COPY_SNAPSHOT_COPIED = 'Copied';
export const COPY_SNAPSHOT_DISABLED_TOOLTIP = 'Not enough data to copy snapshot.';
export const ACTIVE_ONLY_TOGGLE = 'Active only';
export const SHOW_ALL_TOGGLE = 'Show all';

