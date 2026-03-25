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
export const AGREEMENT_TOOLTIP = 'How many available signals vote the same way today.';
export const AGREEMENT_TOOLTIP_NA = 'All signals were neutral today.';

// Agreement Trend
export const AGREEMENT_TREND_HEADER = 'Signal agreement';
export const AGREEMENT_TREND_RISK_PREFIX = 'Risk agreement';
export const AGREEMENT_TREND_INFLATION_PREFIX = 'Inflation agreement';
export const AGREEMENT_TREND_UNCHANGED = 'unchanged';
export const AGREEMENT_TREND_IMPROVED = 'improved';
export const AGREEMENT_TREND_WORSENED = 'worsened';

// Agreement History
export const AGREEMENT_HISTORY_LABEL = 'Recent agreement';
export const TOP_DRIVERS_OLD_DATA_HINT = "Drivers/receipts weren't saved for this older snapshot. New snapshots will include them after the next update.";
export const AGREEMENT_HISTORY_HINT = "Agreement history uses receipts. This snapshot is older — it'll fill in after the next update.";
export const AGREEMENT_HISTORY_INSUFFICIENT_HINT = 'Agreement history will appear after a couple updates.';

// Confidence
export const CONFIDENCE_LABEL_PREFIX = 'Confidence:';
export const CONFIDENCE_TOOLTIP = 'Heuristic: agreement + breadth (coverage). Not a probability.';
export const COVERAGE_TOOLTIP = 'Signals available / signals expected (some can be missing).';

// Conviction
export const CONVICTION_LABEL_PREFIX = 'Conviction:';
export const CONVICTION_TOOLTIP = '|net vote| per available signals. Not a probability or forecast.';
export const CONVICTION_TOOLTIP_SPICY = '|net vote| per available signals. Not a probability or forecast. High conviction = signals piling onto one side today. Could be clarity… or a crowded trade.';
export const CONVICTION_TOOLTIP_NA = 'Conviction is unavailable when net vote or signal count is missing.';

// Regime overview (merged classification + summary chips)
export const REGIME_OVERVIEW_TITLE = 'Regime overview';
/** @deprecated Use REGIME_OVERVIEW_TITLE */
export const REGIME_SUMMARY_TITLE = REGIME_OVERVIEW_TITLE;

/** Posture snapshot band (hero) */
export const POSTURE_HOLD_NOW_LABEL = 'Hold now';
export const POSTURE_STARTING_POINT_LABEL = 'Starting point';
export const POSTURE_BRAKE_LABEL = 'Sleeve brake';
export const POSTURE_BASELINE_LABEL = 'Full-risk baseline';
export const POSTURE_WHY_CASH_LABEL = 'Why cash';
export const GLOSSARY_HOLD_BRAKE_MAX_LINK = 'What do Hold now / Brake / Max targets mean?';
export const SINCE_LAST_UPDATE_PREFIX = 'Since last update:';
export const SINCE_LAST_UPDATE_NO_CHANGE =
  'No change since the last update. Markets were boring. (Enjoy it.)';

export const REGIME_CONVICTION_LABEL_PREFIX = 'Regime Conviction:';
export const REGIME_CONVICTION_TOOLTIP = 'Combined strength of today\'s Risk + Inflation signals. Not a forecast.';
export const REGIME_CONFIDENCE_LABEL_PREFIX = 'Regime Confidence:';
export const REGIME_CONFIDENCE_TOOLTIP = 'Heuristic from signal agreement + coverage. Not a probability.';
export const PRIMARY_DRIVER_PREFIX = 'Primary driver:';
export const PRIMARY_DRIVER_TOOLTIP = 'Which axis (Risk or Inflation) has the stronger signal today.';
export const FLIPWATCH_PILL_TOOLTIP =
  'Regime confirmation: waits for an extra day before treating a regime change as real. Different from Pressure Watch (distance to signal flips).';
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
export const LEGEND_AGREEMENT = 'How many available signals vote the same way today.';
export const LEGEND_COVERAGE = 'Signals available / signals expected (some can be missing).';
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
export const CASH_NOW_PILL_TOOLTIP = "Total cash in 'Hold now' (base cash + cash released by the brake).";
export const THROTTLE_OFF_PILL_TOOLTIP = 'Brake reduced this sleeve from starting point to 0%, so that % becomes cash.';
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

/** Regime map footnote (plain English); pair with REGIME_MAP_METHODOLOGY_LINK_TEXT. */
export const REGIME_MAP_SLEEVE_NOTE_PREFIX =
  'The brake scales Stocks, Gold, and Bitcoin using rules-based signals on liquid proxies (SPY, GLD, BTC-USD). Details:';
export const REGIME_MAP_METHODOLOGY_LINK_TEXT = 'Methodology';
/** @deprecated Use REGIME_MAP_SLEEVE_NOTE_PREFIX */
export const REGIME_MAP_VAMS_PROXY_PREFIX = REGIME_MAP_SLEEVE_NOTE_PREFIX;
/** @deprecated Use REGIME_MAP_METHODOLOGY_LINK_TEXT */
export const REGIME_MAP_VAMS_PROXY_METHODOLOGY_LINK = REGIME_MAP_METHODOLOGY_LINK_TEXT;
export const GHOSTREGIME_METHODOLOGY_PILL_LABEL = 'Methodology';
export const GHOSTREGIME_METHODOLOGY_PILL_TOOLTIP =
  'How GhostRegime works: regime targets, sleeve brake, and methodology.';

// Snapshot viewing
export const VIEWING_SNAPSHOT_LABEL = 'Viewing snapshot:';
export const VIEWING_SNAPSHOT_TOOLTIP = 'You are viewing a historical snapshot, not the latest data.';
export const ASOF_INVALID_FALLBACK_HINT = 'Invalid as-of date — showing latest.';
export const ASOF_NOT_FOUND_FALLBACK_HINT = 'No snapshot found for {date} — showing latest.';
export const COPY_LINK_BUTTON = 'Copy link';
export const COPY_LINK_COPIED = 'Copied';
export const COPY_SUMMARY_BUTTON = 'Copy summary';
export const COPY_SUMMARY_COPIED = 'Copied';
export const BACK_TO_LATEST_LINK = 'Back to latest';

// Pressure Watch (movement vs thresholds; distinct from flip_watch_status regime confirmation)
export const PRESSURE_WATCH_TITLE = 'Pressure Watch';
export const PRESSURE_WATCH_SUBTITLE = "What's changing now";
export const PRESSURE_WATCH_TOOLTIP =
  'How far risk and inflation scores are from balanced (0), and how far sleeve signals are from the next threshold band. Compared to the prior trading snapshot only. Not a forecast.';
export const PRESSURE_WATCH_RISK_ROW_LABEL = 'Risk';
export const PRESSURE_WATCH_INFL_ROW_LABEL = 'Inflation';
export const PRESSURE_WATCH_DISTANCE_TO_BALANCE = 'Distance to balance';
export const PRESSURE_WATCH_DISTANCE_TO_FLIP = 'Distance to flip';
export const PRESSURE_WATCH_CLOSEST_LABEL = 'Closest pressure point';
export const PRESSURE_WATCH_ALLOC_IMPACT = 'If that sleeve flips next';
export const PRESSURE_WATCH_IF_STEP_TOOLTIP =
  'Illustrative: if only this sleeve moved one step across its band (same regime), approximate allocation change. Not a prediction.';
export const PRESSURE_WATCH_NEXT_FLIP_IMPACT_NEGLIGIBLE =
  'Next flip impact: negligible at current targets';
export const PRESSURE_WATCH_ADVANCED_ONE_STEP_LABEL = 'If one sleeve flips next (illustrative)';
export const PRESSURE_WATCH_NA = 'N/A';
export const PRESSURE_WATCH_ADVANCED_TITLE = 'Pressure Watch — full detail';
export const PRESSURE_WATCH_NO_SCORES =
  'Sleeve signal data not on this snapshot yet — N/A until included on the next update.';
export const PRESSURE_WATCH_TAG_NEAR_BALANCE = 'Near balance';
export const PRESSURE_WATCH_TAG_NEAR_FLIP = 'Near flip';
export const PRESSURE_WATCH_TAG_STABLE_VS_PRIOR = 'Stable vs prior';
export const PRESSURE_WATCH_PRIOR_UNAVAILABLE = 'No prior snapshot';

/** @deprecated Use PRESSURE_WATCH_* */
export const MOVEMENT_PRESSURE_TITLE = PRESSURE_WATCH_TITLE;
export const MOVEMENT_PRESSURE_TOOLTIP = PRESSURE_WATCH_TOOLTIP;
export const MOVEMENT_PRESSURE_CLOSEST_LABEL = PRESSURE_WATCH_CLOSEST_LABEL;
export const MOVEMENT_PRESSURE_IF_STEP_TOOLTIP = PRESSURE_WATCH_IF_STEP_TOOLTIP;
export const MOVEMENT_PRESSURE_NA = PRESSURE_WATCH_NA;
export const MOVEMENT_PRESSURE_ADVANCED_TITLE = PRESSURE_WATCH_ADVANCED_TITLE;
export const MOVEMENT_PRESSURE_NO_SCORES = PRESSURE_WATCH_NO_SCORES;

// Advanced detail: column labels
export const PRESSURE_WATCH_COL_SCORE = 'Signal score';
export const PRESSURE_WATCH_COL_DIST = 'Distance to band';
export const PRESSURE_WATCH_COL_PRIOR = 'vs prior snapshot';

/** Advanced / classification: regime flip confirmation (flip_watch_status), not Pressure Watch */
export const REGIME_CONFIRMATION_STATUS_LABEL = 'Regime confirmation';
/** Chip in Regime Summary when flip_watch_status is active */
export const REGIME_CONFIRMATION_CHIP_PREFIX = 'Regime confirmation:';

