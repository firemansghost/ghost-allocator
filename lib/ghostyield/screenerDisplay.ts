/**
 * GhostYield screener UI copy — labels and tooltips only (no scoring logic).
 */

import type { GhostYieldFreshnessStatus } from './types';

export const FRESHNESS_STATUS_LABEL: Record<GhostYieldFreshnessStatus, string> = {
  fresh: 'Fresh Data',
  caution: 'Data Caution',
  stale: 'Stale Data',
  missing: 'Data Gaps',
  illustrative: 'Sample Data',
};

/** Column header `title` / tooltip for the Data QA badges. */
export const DATA_QA_COLUMN_TOOLTIP =
  'Source and data-quality status for this row in the manual snapshot (freshness and field completeness). These labels are not investment-risk ratings. Missing fields do not automatically mean a bad fund; fresh data does not automatically mean a safe fund.';

/** Tooltip on individual freshness badges (redundant with column but helps mobile). */
export function freshnessBadgeTitle(status: GhostYieldFreshnessStatus): string {
  const base = FRESHNESS_STATUS_LABEL[status];
  return `${base} — ${DATA_QA_COLUMN_TOOLTIP}`;
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, n));
}

export type RiskBandId = 'low' | 'moderate' | 'elevated' | 'high' | 'extreme';

export function riskScoreBand(score: number): RiskBandId {
  const s = clampScore(score);
  if (s <= 24) return 'low';
  if (s <= 49) return 'moderate';
  if (s <= 69) return 'elevated';
  if (s <= 84) return 'high';
  return 'extreme';
}

const RISK_BAND_WORD: Record<RiskBandId, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
  extreme: 'Extreme',
};

/** Short suffix for table cells (narrow screens). */
const RISK_BAND_SHORT: Record<RiskBandId, string> = {
  low: 'Low',
  moderate: 'Mod.',
  elevated: 'Elev.',
  high: 'High',
  extreme: 'Extr.',
};

export function riskScoreBandWord(score: number): string {
  return RISK_BAND_WORD[riskScoreBand(score)];
}

export function riskScoreBandShort(score: number): string {
  return RISK_BAND_SHORT[riskScoreBand(score)];
}

export function riskScoreTooltip(score: number): string {
  const w = riskScoreBandWord(score);
  return `Risk Score ${score} — ${w}. Scale 0–100 (higher = riskier). Bands: 0–24 Low, 25–49 Moderate, 50–69 Elevated, 70–84 High, 85–100 Extreme. Separate from Data QA (source snapshot quality on the row).`;
}

export type FitBandId = 'strong' | 'good' | 'watchlist' | 'weak';

export function fitScoreBand(score: number): FitBandId {
  const s = clampScore(score);
  if (s >= 85) return 'strong';
  if (s >= 70) return 'good';
  if (s >= 50) return 'watchlist';
  return 'weak';
}

const FIT_BAND_WORD: Record<FitBandId, string> = {
  strong: 'Strong Fit',
  good: 'Good Fit',
  watchlist: 'Watchlist Fit',
  weak: 'Weak Fit',
};

const FIT_BAND_SHORT: Record<FitBandId, string> = {
  strong: 'Strong',
  good: 'Good',
  watchlist: 'Watch',
  weak: 'Weak',
};

export function fitScoreBandWord(score: number): string {
  return FIT_BAND_WORD[fitScoreBand(score)];
}

export function fitScoreBandShort(score: number): string {
  return FIT_BAND_SHORT[fitScoreBand(score)];
}

export function fitScoreTooltip(score: number): string {
  const w = fitScoreBandWord(score);
  return `Fit Score ${score} — ${w}. Scale 0–100 (higher = better fit in the static GhostYield rules, not data QA). Bands: 85–100 Strong Fit, 70–84 Good Fit, 50–69 Watchlist Fit, below 50 Weak Fit.`;
}
