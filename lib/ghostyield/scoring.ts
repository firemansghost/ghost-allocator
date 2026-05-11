/**
 * GhostYield deterministic scoring (Phase 2 + Phase 5.2 structured metrics).
 *
 * Risk score 0–100: higher = riskier sleeve characteristics.
 * Fit score 0–100: higher = better fit as a satellite yield sleeve around a core portfolio.
 *
 * Phase 5.2: optional `cefMetrics` / `bdcMetrics` add modest, transparent adjustments. CEF blocks focus on structural
 * leverage (asset-based %), premium-to-NAVrichness, expense burden, and payout/coverage stress. BDC blocks focus on
 * dividend coverage, non-accrual credit quality, balance-sheet leverage (debt/equity), and first-lien portfolio tilt.
 * Premium/discount and leverage slices are deduped when structured metrics replace generic inputs.
 *
 * Pure functions only — no I/O.
 */

import type {
  CandidateFreshnessResult,
  Confidence,
  DistributionQuality,
  GhostYieldCandidate,
  GhostYieldCandidateRaw,
  YieldEnvironmentInputs,
  YieldSleeveCategory,
} from './types';
import { evaluateCandidateFreshness } from './dataFreshness';
import {
  effectiveDataConfidence,
  effectiveNavPerformance1Y,
  effectiveNavPerformance3Y,
  expectsNavQuote,
} from './candidateFields';

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
function yieldRiskPoints(currentYield: number | null | undefined): number {
  if (currentYield == null) return 0;
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

/**
 * CEF structural leverage as fraction of assets (e.g. 0.25 = 25%). Tiered risk — does not use debt/equity thresholds.
 */
function cefStructuralLeverageRiskPoints(effectiveLeverage: number): number {
  if (effectiveLeverage < 0.15) return 1;
  if (effectiveLeverage < 0.25) return 4;
  if (effectiveLeverage < 0.35) return 7;
  if (effectiveLeverage <= 0.4) return 10;
  return 13;
}

/** CEF premium risk only (discounts do not reduce risk here). */
function cefPremiumDiscountRiskPointsFromPremium(premium: number): number {
  if (premium <= 0) return 0;
  if (premium > 0.1) return 10;
  if (premium > 0.05) return 5;
  return 0;
}

/** BDC regulatory-style debt/equity (e.g. 1.12 = 112%). Replaces generic leverageRiskPoints when structured. */
function bdcDebtToEquityRiskPoints(debtToEquity: number): number {
  if (debtToEquity < 1.0) return 3;
  if (debtToEquity < 1.25) return 7;
  if (debtToEquity < 1.5) return 11;
  return 15;
}

function cefExpenseBurdenRiskPoints(expenseRatioTotal: number): number {
  if (expenseRatioTotal > 0.05) return 8;
  if (expenseRatioTotal > 0.04) return 5;
  if (expenseRatioTotal > 0.025) return 3;
  return 0;
}

/**
 * CEF payout stress: high stated distribution rate with weak quality, thin coverage, or negative UNII.
 * Adjustment weights `cefMetrics.distributionRate` when present.
 */
function cefPayoutStressRiskPoints(row: GhostYieldCandidateRaw): number {
  const cef = row.cefMetrics;
  if (!cef) return 0;
  let p = 0;
  const dq = row.distributionQuality;
  const distRate = cef.distributionRate ?? row.distributionRate;
  if ((dq === 'weak' || dq === 'uncertain') && distRate != null && distRate > 0.12) {
    p += 4;
  } else if (dq === 'weak' && distRate != null && distRate > 0.09) {
    p += 2;
  }
  const cov = cef.coverageRatio;
  if (cov != null && cov < 1.0) p += 4;
  const unii = cef.uniiPerShare;
  if (unii != null && unii < 0) p += 4;
  return Math.min(14, p);
}

function bdcNonAccrualRiskPoints(pct: number): number {
  if (pct >= 0.05) return 9;
  if (pct >= 0.03) return 6;
  if (pct >= 0.01) return 3;
  return 0;
}

/**
 * Extra CEF risk/fit from structured fields excluding leverage & premium (handled in main risk/fit to avoid double-count).
 * CEF adjustments: expense burden + payout stress (risk); modest valuation fit when wide discount aligns with quality/NAV.
 */
export function scoreCefMetricAdjustments(row: GhostYieldCandidateRaw): { risk: number; fit: number } {
  const cef = row.cefMetrics;
  if (!cef) return { risk: 0, fit: 0 };

  let risk = 0;
  const er = cef.expenseRatioTotal;
  if (er != null) risk += cefExpenseBurdenRiskPoints(er);
  risk += cefPayoutStressRiskPoints(row);

  let fit = 0;
  const pd = cef.premiumDiscount ?? row.premiumDiscount;
  const nav1y = effectiveNavPerformance1Y(row);
  const navWeak = nav1y != null && nav1y < -0.03;
  const qualWeak = row.distributionQuality === 'weak';
  if (pd != null && pd < -0.1 && !qualWeak && !navWeak) {
    fit += 3;
  }

  return { risk, fit };
}

/**
 * BDC structured metrics: coverage, non-accruals, first-lien tilt (debt/equity risk is applied in main score).
 * BDC adjustments: dividend coverage and non-accruals (risk); coverage and seniority (fit).
 */
export function scoreBdcMetricAdjustments(row: GhostYieldCandidateRaw): { risk: number; fit: number } {
  const bdc = row.bdcMetrics;
  if (!bdc) return { risk: 0, fit: 0 };

  let risk = 0;
  let fit = 0;

  const cov = bdc.dividendCoverageRatio;
  if (cov != null) {
    if (cov < 0.9) risk += 9;
    else if (cov < 1.0) risk += 4;

    if (cov >= 1.1) fit += 4;
    else if (cov >= 1.0) fit += 2;
  }

  const na = bdc.nonAccrualCostPct;
  if (na != null) risk += bdcNonAccrualRiskPoints(na);

  const fl = bdc.firstLienPct;
  if (fl != null) {
    if (fl > 0.8) fit += 4;
    else if (fl < 0.6) fit -= 3;
  }

  return { risk, fit };
}

function structuralLeverageRiskPoints(row: GhostYieldCandidateRaw): number {
  if (row.cefMetrics?.effectiveLeverage != null) {
    return cefStructuralLeverageRiskPoints(row.cefMetrics.effectiveLeverage);
  }
  if (row.bdcMetrics?.debtToEquity != null) {
    return bdcDebtToEquityRiskPoints(row.bdcMetrics.debtToEquity);
  }
  return leverageRiskPoints(row.leverage);
}

function premiumScheduleRiskPoints(row: GhostYieldCandidateRaw): number {
  if (row.cefMetrics) {
    const pd = row.cefMetrics.premiumDiscount ?? row.premiumDiscount;
    if (pd == null) return 0;
    return cefPremiumDiscountRiskPointsFromPremium(pd);
  }
  return premiumRiskPoints(row.premiumDiscount, row.sleeveType);
}

/** Listed BDC + null headline yield: NAV-quoted distributionRate must not drive generic payout stress heuristics. */
function skipBdcNavQuotedDistributionStress(row: GhostYieldCandidateRaw): boolean {
  return row.bdcMetrics != null && row.currentYield == null;
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

/** High carry + NAV shrink */
function highYieldNegativeNavPoints(row: GhostYieldCandidateRaw): number {
  if (skipBdcNavQuotedDistributionStress(row)) return 0;
  const nav1y = effectiveNavPerformance1Y(row);
  if (nav1y == null || nav1y >= 0) return 0;
  const y = Math.max(row.currentYield ?? 0, row.distributionRate ?? 0);
  if (y >= 0.11) return 12;
  if (y >= 0.085) return 8;
  if (y >= 0.07) return 4;
  return 0;
}

/** Estimated ROC share + NAV decay */
function rocNavStressPoints(row: GhostYieldCandidateRaw): number {
  const roc = row.estimatedReturnOfCapitalPct;
  const nav1y = effectiveNavPerformance1Y(row);
  if (roc == null || nav1y == null || nav1y >= 0) return 0;
  if (roc >= 0.35) return 14;
  if (roc >= 0.2) return 8;
  return 0;
}

/** Distribution materially above SEC yield when both known. */
function distributionVersusSecPoints(row: GhostYieldCandidateRaw): number {
  const d = row.distributionRate;
  const s = row.secYield;
  if (d == null || s == null) return 0;
  if (d - s >= 0.04) return 12;
  if (d - s >= 0.025) return 8;
  return 0;
}

/** Payout looks high vs NAV trend (unsustainable heuristic). */
function payoutVersusNavTrendPoints(row: GhostYieldCandidateRaw): number {
  if (skipBdcNavQuotedDistributionStress(row)) return 0;
  const d = row.distributionRate ?? row.currentYield ?? 0;
  const nav1y = effectiveNavPerformance1Y(row);
  if (nav1y == null) return 0;
  const gap = d - nav1y;
  if (gap >= 0.12) return 14;
  if (gap >= 0.08) return 10;
  if (gap >= 0.06) return 6;
  return 0;
}

function missingNavPoints(row: GhostYieldCandidateRaw): number {
  return expectsNavQuote(row) && row.nav == null ? 14 : 0;
}

function freshnessDataPenalty(f: CandidateFreshnessResult): number {
  if (!f.applyScoringPenalty) return 0;
  switch (f.status) {
    case 'illustrative':
      return 6;
    case 'missing':
      return 14;
    case 'stale':
      return 12;
    case 'caution':
      return 7;
    default:
      return 4;
  }
}

/** Categories whose distributions are often quoted vs NAV (CEFs, many levered closed-end structures, BDC stock premiums). */
export function usesNavPremiumSchedule(sleeve?: YieldSleeveCategory): boolean {
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

export function computeGhostYieldRiskScore(
  row: GhostYieldCandidateRaw,
  freshness: CandidateFreshnessResult
): number {
  const dc = effectiveDataConfidence(row);
  const nav1y = effectiveNavPerformance1Y(row);
  const nav3y = effectiveNavPerformance3Y(row);
  const cefAdj = scoreCefMetricAdjustments(row);
  const bdcAdj = scoreBdcMetricAdjustments(row);

  let score =
    categoryBaseRisk(row.sleeveType) +
    yieldRiskPoints(row.currentYield) +
    structuralLeverageRiskPoints(row) +
    navTrendRiskPoints(nav1y, nav3y) +
    premiumScheduleRiskPoints(row) +
    distributionQualityWeight(row.distributionQuality) +
    confidencePenalty(dc) +
    yieldSourceComplexityPoints(row.yieldSource) +
    highYieldNegativeNavPoints(row) +
    rocNavStressPoints(row) +
    distributionVersusSecPoints(row) +
    payoutVersusNavTrendPoints(row) +
    missingNavPoints(row) +
    freshnessDataPenalty(freshness) +
    cefAdj.risk +
    bdcAdj.risk;

  return clampInt(score, 0, 100);
}

export function computeGhostYieldFitScore(row: GhostYieldCandidateRaw, freshness: CandidateFreshnessResult): number {
  const dc = effectiveDataConfidence(row);
  let fit = 72;
  const cefAdj = scoreCefMetricAdjustments(row);
  const bdcAdj = scoreBdcMetricAdjustments(row);
  fit += cefAdj.fit + bdcAdj.fit;

  const y = row.currentYield;
  if (y != null) {
    if (y >= 0.06 && y <= 0.095) fit += 14;
    else if (y >= 0.045 && y < 0.06) fit += 8;
    else if (y > 0.11 && y < 0.14) fit -= 6;
    else if (y >= 0.14) fit -= 14;
    else if (y < 0.03) fit += 4;
  }

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

  const nav1y = effectiveNavPerformance1Y(row);
  const nav3y = effectiveNavPerformance3Y(row);
  if (nav1y != null) {
    if (nav1y >= 0.02) fit += 8;
    else if (nav1y >= 0) fit += 3;
    else if (nav1y < -0.06) fit -= 14;
    else if (nav1y < 0) fit -= 6;
  }
  if (nav3y != null && nav3y < -0.1) fit -= 8;

  if (row.leverage != null) {
    const lev = row.leverage;
    if (lev <= 1.02) fit += 6;
    else if (lev >= 1.35) fit -= 12;
    else if (lev >= 1.15) fit -= 5;
  }

  const premiumForFit = row.cefMetrics?.premiumDiscount ?? row.premiumDiscount;
  if (premiumForFit != null) {
    if (usesNavPremiumSchedule(row.sleeveType)) {
      if (premiumForFit < -0.05) fit += 8;
      if (premiumForFit > 0.12) fit -= 10;
    }
  }

  const expenseForFit = row.cefMetrics?.expenseRatioTotal ?? row.expenseRatio;
  if (expenseForFit != null) {
    if (expenseForFit <= 0.005) fit += 4;
    if (expenseForFit >= 0.025) fit -= 8;
  }

  switch (dc) {
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

  if (freshness.status === 'fresh' && dc === 'high') fit += 4;
  else if (freshness.status === 'fresh' && dc === 'medium') fit += 2;
  else if (freshness.status === 'stale' || freshness.status === 'missing') fit -= 10;
  else if (freshness.status === 'caution' || freshness.status === 'illustrative') fit -= 4;

  const dRate = row.distributionRate;
  const sec = row.secYield;
  if (dRate != null && sec != null) {
    const g = Math.abs(dRate - sec);
    if (g <= 0.012) fit += 6;
    else if (g <= 0.02) fit += 2;
    else if (g >= 0.04) fit -= 6;
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

export function scoreCandidates(
  raw: GhostYieldCandidateRaw[],
  referenceAsOf: string
): GhostYieldCandidate[] {
  return raw.map((r) => {
    const freshness = evaluateCandidateFreshness(r, referenceAsOf);
    return {
      ...r,
      freshness,
      riskScore: computeGhostYieldRiskScore(r, freshness),
      fitScore: computeGhostYieldFitScore(r, freshness),
    };
  });
}
