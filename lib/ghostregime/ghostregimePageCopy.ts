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

// Legend
export const LEGEND_TITLE = 'What do these mean?';
export const LEGEND_AGREEMENT = 'Agreement: How many non-zero signals agree with the axis direction.';
export const LEGEND_COVERAGE = 'Coverage: How many signals fired (non-neutral) out of total signals.';
export const LEGEND_CONFIDENCE = 'Confidence: Heuristic combining agreement + coverage. Not a probability.';
export const LEGEND_CONVICTION = 'Conviction: |net vote| per available signals. Strength indicator, not a forecast.';
export const LEGEND_CROWDED = 'Crowded: Extreme conviction + high agreement. Could be clarity… or a crowded trade.';
export const LEGEND_NET_VOTE = 'Net vote: Sum of all signal votes for this axis. Shows push direction.';
export const LEGEND_DELTA = 'Δ since last: Change in key metrics compared to the previous snapshot.';

// View receipts
export const VIEW_RECEIPTS_LINK = 'View receipts →';

// Compare panel
export const COMPARE_LINK_LABEL = 'Compare to previous';
export const COMPARE_PANEL_TITLE = 'Compare:';
export const COMPARE_DISABLED_TOOLTIP = 'Need at least 2 snapshots to compare.';
export const COMPARE_REGIME_UNCHANGED = 'unchanged';
export const COMPARE_BIGGEST_CHANGE_LABEL = 'Biggest change:';
export const COMPARE_BIGGEST_CHANGE_TOOLTIP = 'Heuristic: largest movement among regime/conviction/agreement/confidence/net vote. Not advice.';
export const COMPARE_TOGGLE_SUMMARY = 'Summary';
export const COMPARE_TOGGLE_PILLS = 'Pills';
export const COPY_COMPARE_LINK = 'Copy compare link';
export const COPY_COMPARE_LINK_COPIED = 'Copied';
export const COPY_COMPARE_LINK_TOOLTIP_DISABLED = 'No previous snapshot available.';
export const PREV_SNAPSHOT_NOT_FOUND_HINT = 'Prev snapshot not found — using inferred previous.';
export const COMPARE_RESET_BUTTON = 'Reset';
export const COMPARE_RESET_TOOLTIP = 'Close compare panel and reset to default view';
export const COPY_BIGGEST_CHANGE_TOOLTIP = 'Copy biggest change';
export const COPY_BIGGEST_CHANGE_COPIED = 'Copied';
export const PREV_NOT_FOUND_INFO_TOOLTIP = 'Requested prev snapshot wasn\'t found. Using the nearest previous snapshot instead.';
export const ACTIONABLE_CASH_PILL_TOOLTIP = 'Cash = leftover after scaling targets down; it sits unallocated until rebalance. Not cash "held in" the asset.';
export const COMPARE_CONTEXT_LABEL = 'Context:';
export const COMPARE_CONTEXT_VIEWING = 'Viewing';
export const COMPARE_CONTEXT_COMPARING = 'Comparing to';
export const COMPARE_PREV_SNAPSHOT_TOOLTIP = 'Previous = the prior available trading snapshot in the current history window (not necessarily yesterday).';
export const PILLS_DELTA_COLORS_TOOLTIP = 'Colors show change direction, not "good" or "bad".';
export const RECEIPTS_SORT_DEFAULT = 'Default';
export const RECEIPTS_SORT_BY_STRENGTH = 'By strength';
export const COPY_DIFF_SUMMARY = 'Copy diff summary';
export const COPY_DIFF_SUMMARY_COPIED = 'Copied';
export const COPY_DIFF_SUMMARY_TOOLTIP_DISABLED = 'Not enough data to copy diff summary.';
export const PIN_COMPARE = 'Pin';
export const PIN_COMPARE_PINNED = 'Pinned';
export const PIN_COMPARE_TOOLTIP_DISABLED = 'Cannot pin: missing snapshot data.';
export const RECEIPTS_SEARCH_PLACEHOLDER_RISK = 'Search signals...';
export const RECEIPTS_SEARCH_PLACEHOLDER_INFL = 'Search signals...';
export const RECEIPTS_SEARCH_CLEAR = 'Clear';
export const DRIVER_SHOW_RULE = 'Show rule';
export const DRIVER_RULE_LABEL = 'Rule:';
export const DRIVER_META_LABEL = 'Meta:';
export const REGIME_LEGEND_TITLE = 'Regimes';
export const REGIME_LEGEND_RESET = 'Reset';
export const REGIME_LEGEND_SELECTED_SUFFIX = '(selected)';
export const REGIME_MAP_LEGEND_SUMMARY = 'Legend';
export const REGIME_MAP_LEGEND_TOOLTIP = 'Show the 4 regime descriptions.';
export const REGIME_MAP_METHODOLOGY_CTA = 'Methodology →';
export const REGIME_MAP_METHODOLOGY_LINK = 'Read methodology →';
export const GHOSTREGIME_METHODOLOGY_PILL_LABEL = 'Methodology';
export const GHOSTREGIME_METHODOLOGY_PILL_TOOLTIP = 'How this model works.';

// Snapshot viewing
export const VIEWING_SNAPSHOT_LABEL = 'Viewing snapshot:';
export const VIEWING_SNAPSHOT_TOOLTIP = 'You are viewing a historical snapshot, not the latest data.';
export const ASOF_INVALID_FALLBACK_HINT = 'Invalid as-of date — showing latest.';
export const ASOF_NOT_FOUND_FALLBACK_HINT = 'No snapshot found for {date} — showing latest.';
export const COPY_LINK_BUTTON = 'Copy link';
export const COPY_LINK_COPIED = 'Copied';
export const BACK_TO_LATEST_LINK = 'Back to latest';

