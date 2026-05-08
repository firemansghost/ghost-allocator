/**
 * GhostYield deterministic scoring (Phase 1).
 *
 * Risk score 0–100: higher = riskier sleeve characteristics.
 * Fit score 0–100: higher = better fit as a satellite yield sleeve around a core portfolio.
 *
 * Pure functions only — no I/O.
 */

import type {
  Confidence,
  DistributionQuality,
  GhostYieldCandidate,
  GhostYieldCandidateRaw,
  YieldEnvironmentInputs,
  YieldSleeveCategory,
} from './types';

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function distributionQualityWeight(q: DistributionQuality): number {
  switch (q) {
    case 'strong':
      return 0;
    case 'mixed':
      return 12;
    case 'weak':
      return 22;
    case 'uncertain':
      return 28;
    default:
      return 15;
  }
}

function confidencePenalty(c: Confidence): number {
  switch (c) {
    case 'high':
      return 0;
    case 'medium':
      return 5;
    case 'low':
      return 12;
    case 'illustrative':
      return 18;
    default:
      return 10;
  }
}

/** Category base risk tier (0–40) — structural complexity / typical failure modes */
function categoryBaseRisk(cat: YieldSleeveCategory): number {
  switch (cat) {
    case 'cash_tbills':
      return 4;
    case 'credit_income':
      return 18;
    case 'preferred_income':
      return 20;
    case 'bdc_income':
      return 26;
    case 'cef_credit':
      return 30;
    case 'midstream_income':
      return 24;
    case 'option_income':
      return 28;
    case 'opportunistic_credit':
    case 'special_situations_income':
      return 31;
    case 'natural_resources_income':
      return 26;
    case 'crypto_yield_coming_soon':
      return 0;
    default:
      return 20;
  }
}

/** Yield level contribution: very high headline yield adds risk points */
function yieldRiskPoints(currentYield: number): number {
  if (currentYield >= 0.14) return 28;
  if (currentYield >= 0.11) return 20;
  if (currentYield >= 0.085) return 12;
  if (currentYield >= 0.065) return 6;
  return 0;
}

function leverageRiskPoints(leverage?: number): number {
  if (leverage == null) return 0;
  if (leverage >= 1.45) return 22;
  if (leverage >= 1.25) return 15;
  if (leverage >= 1.05) return 8;
  return 0;
}

/** Negative NAV CAGR adds risk; positive reduces slightly */
function navTrendRiskPoints(nav1y?: number, nav3y?: number): number {
  let p = 0;
  if (nav1y != null && nav1y < -0.08) p += 18;
  else if (nav1y != null && nav1y < -0.03) p += 10;
  else if (nav1y != null && nav1y < 0) p += 5;
  if (nav3y != null && nav3y < -0.15) p += 12;
  else if (nav3y != null && nav3y < -0.05) p += 6;
  return Math.min(28, p);
}

/** Categories whose distributions are often quoted vs NAV (CEFs, many levered closed-end structures, BDC stock premiums). */
function usesNavPremiumSchedule(sleeve?: YieldSleeveCategory): boolean {
  return (
    sleeve === 'cef_credit' ||
    sleeve === 'bdc_income' ||
    sleeve === 'midstream_income' ||
    sleeve === 'opportunistic_credit' ||
    sleeve === 'special_situations_income' ||
    sleeve === 'natural_resources_income'
  );
}

/** Premium to NAV — rich pricing adds squeeze risk where NAV quotes matter. */
function premiumRiskPoints(premium?: number, sleeve?: YieldSleeveCategory): number {
  if (premium == null) return 0;
  if (!usesNavPremiumSchedule(sleeve)) {
    if (premium <= 0.02) return 0;
  }
  if (premium >= 0.18) return 16;
  if (premium >= 0.08) return 10;
  if (premium >= 0.03) return 5;
  if (premium < -0.12) return 0;
  return 0;
}

/** Heuristic: longer yieldSource string / certain keywords = more complex */
function yieldSourceComplexityPoints(yieldSource: string): number {
  const s = yieldSource.toLowerCase();
  let p = Math.min(12, Math.floor(s.length / 55));
  if (s.includes('return of capital') || s.includes('roc')) p += 10;
  if (s.includes('option') || s.includes('overwrite')) p += 6;
  if (s.includes('leverage') || s.includes('borrow')) p += 5;
  return Math.min(22, p);
}

export function computeGhostYieldRiskScore(row: GhostYieldCandidateRaw): number {
  let score =
    categoryBaseRisk(row.sleeveType) +
    yieldRiskPoints(row.currentYield) +
    leverageRiskPoints(row.leverage) +
    navTrendRiskPoints(row.navTrend1Y, row.navTrend3Y) +
    premiumRiskPoints(row.premiumDiscount, row.sleeveType) +
    distributionQualityWeight(row.distributionQuality) +
    confidencePenalty(row.confidence) +
    yieldSourceComplexityPoints(row.yieldSource);

  return clampInt(score, 0, 100);
}

export function computeGhostYieldFitScore(row: GhostYieldCandidateRaw): number {
  let fit = 72;

  // Moderate yield bands score better than extremes
  const y = row.currentYield;
  if (y >= 0.06 && y <= 0.095) fit += 14;
  else if (y >= 0.045 && y < 0.06) fit += 8;
  else if (y > 0.11 && y < 0.14) fit -= 6;
  else if (y >= 0.14) fit -= 14;
  else if (y < 0.03) fit += 4;

  switch (row.distributionQuality) {
    case 'strong':
      fit += 12;
      break;
    case 'mixed':
      fit += 4;
      break;
    case 'weak':
      fit -= 10;
      break;
    case 'uncertain':
      fit -= 14;
      break;
    default:
      break;
  }

  if (row.navTrend1Y != null) {
    if (row.navTrend1Y >= 0.02) fit += 8;
    else if (row.navTrend1Y >= 0) fit += 3;
    else if (row.navTrend1Y < -0.06) fit -= 14;
    else if (row.navTrend1Y < 0) fit -= 6;
  }
  if (row.navTrend3Y != null && row.navTrend3Y < -0.1) fit -= 8;

  const lev = row.leverage ?? 1;
  if (lev <= 1.02) fit += 6;
  else if (lev >= 1.35) fit -= 12;
  else if (lev >= 1.15) fit -= 5;

  if (row.premiumDiscount != null) {
    if (usesNavPremiumSchedule(row.sleeveType)) {
      if (row.premiumDiscount < -0.05) fit += 8;
      if (row.premiumDiscount > 0.12) fit -= 10;
    }
  }

  if (row.expenseRatio != null) {
    if (row.expenseRatio <= 0.005) fit += 4;
    if (row.expenseRatio >= 0.025) fit -= 8;
  }

  switch (row.confidence) {
    case 'high':
      fit += 6;
      break;
    case 'medium':
      fit += 2;
      break;
    case 'low':
      fit -= 8;
      break;
    case 'illustrative':
      fit -= 12;
      break;
    default:
      break;
  }

  const simpleSource =
    row.yieldSource.length < 90 &&
    !row.yieldSource.toLowerCase().includes(' roc') &&
    !row.yieldSource.toLowerCase().includes('return of capital');
  if (simpleSource) fit += 4;

  switch (row.sleeveType) {
    case 'cash_tbills':
      fit += 8;
      break;
    case 'credit_income':
      fit += 2;
      break;
    case 'crypto_yield_coming_soon':
      fit = 0;
      break;
    default:
      break;
  }

  return clampInt(fit, 0, 100);
}

/**
 * Environment gauge: combines static stress knobs into one 0–100 reading.
 * Higher = more hostile backdrop for yield sleeves overall (tighter conditions).
 */
export function computeYieldEnvironmentScore(env: YieldEnvironmentInputs): number {
  const wCredit = 0.45;
  const wRate = 0.35;
  const wVol = 0.2;
  const raw = wCredit * env.creditStress + wRate * env.ratePressure + wVol * env.volRegime;
  return clampInt(raw, 0, 100);
}

export function scoreCandidates(raw: GhostYieldCandidateRaw[]): GhostYieldCandidate[] {
  return raw.map((r) => ({
    ...r,
    riskScore: computeGhostYieldRiskScore(r),
    fitScore: computeGhostYieldFitScore(r),
  }));
}
