/**
 * GhostYield screener UI copy — labels and tooltips only (no scoring logic).
 */

import type { GhostYieldEvidenceGate, GhostYieldFreshnessStatus } from './types';
import { isFitDisplaySuppressed } from './evidenceGate';

export const FRESHNESS_STATUS_LABEL: Record<GhostYieldFreshnessStatus, string> = {
  fresh: 'Fresh in snapshot',
  caution: 'Data Caution',
  stale: 'Stale Data',
  missing: 'Data Gaps',
  illustrative: 'Sample Data',
};

export const EVIDENCE_GATE_LABEL: Record<GhostYieldEvidenceGate, string> = {
  clear: 'Clear',
  qualified: 'Qualified',
  insufficient: 'Insufficient',
};

export const EVIDENCE_GATE_SHORT: Record<GhostYieldEvidenceGate, string> = {
  clear: 'Clear',
  qualified: 'Qual.',
  insufficient: 'Insuff.',
};

/** Column header `title` / tooltip for the Data QA badges. */
export const DATA_QA_COLUMN_TOOLTIP =
  "Snapshot freshness/completeness for this manual row. Measured against the snapshot reference date, not today's date. Data QA badges are not investment-risk ratings. Risk and Fit are economic scores; Evidence (Clear / Qualified / Insufficient) gates how they are presented.";

/** Column tooltip for Evidence gate. */
export const EVIDENCE_COLUMN_TOOLTIP =
  'Evidence posture derived from snapshot confidence, freshness, and critical expected fields (such as NAV for ETF/CEF wrappers). Clear = adequate; Qualified = usable with caution; Insufficient = Fit withheld and Risk shown with a warning. Not an investment-risk rating.';

/** Tooltip on individual freshness badges (redundant with column but helps mobile). */
export function freshnessBadgeTitle(status: GhostYieldFreshnessStatus): string {
  const base = FRESHNESS_STATUS_LABEL[status];
  return `${base} — ${DATA_QA_COLUMN_TOOLTIP}`;
}

export function evidenceGateTitle(gate: GhostYieldEvidenceGate): string {
  return `Evidence: ${EVIDENCE_GATE_LABEL[gate]} — ${EVIDENCE_COLUMN_TOOLTIP}`;
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

export function riskScoreTooltip(score: number, gate?: GhostYieldEvidenceGate): string {
  const w = riskScoreBandWord(score);
  const base = `Risk Score ${score} — ${w}. Scale 0–100 (higher = riskier). Bands: 0–24 Low, 25–49 Moderate, 50–69 Elevated, 70–84 High, 85–100 Extreme. Economic sleeve/investment factors only — evidence quality is not blended into this number.`;
  if (!gate || gate === 'clear') return base;
  return `${base} Evidence: ${EVIDENCE_GATE_LABEL[gate]} — interpret with the snapshot-quality caveat.`;
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

export function fitScoreTooltip(score: number, gate?: GhostYieldEvidenceGate): string {
  if (gate && isFitDisplaySuppressed(gate)) {
    return `Fit Score withheld — Evidence: Insufficient. Critical snapshot gaps (for example missing expected NAV) prevent showing Model Fit. Economic fit is still computed internally but not displayed.`;
  }
  const w = fitScoreBandWord(score);
  const base = `Fit Score ${score} — ${w}. Scale 0–100 (higher = better economic fit under GhostYield rules; not a recommendation). Bands: 85–100 Strong Fit, 70–84 Good Fit, 50–69 Watchlist Fit, below 50 Weak Fit. Economic fit factors only — evidence quality is not blended into this number.`;
  if (!gate || gate === 'clear') return base;
  return `${base} Evidence: ${EVIDENCE_GATE_LABEL[gate]}.`;
}

export { isFitDisplaySuppressed };
