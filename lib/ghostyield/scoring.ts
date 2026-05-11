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
  GhostYieldScoreDriver,
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

/** Max score-driver bullets shown per column in the detail panel. */
export const MAX_SCORE_DRIVERS = 4;

export function riskSeverityFromPoints(points: number): 'low' | 'moderate' | 'high' {
  if (points >= 12) return 'high';
  if (points >= 6) return 'moderate';
  return 'low';
}

export function fitSeverityFromPoints(absDelta: number): 'low' | 'moderate' | 'high' {
  if (absDelta >= 10) return 'high';
  if (absDelta >= 5) return 'moderate';
  return 'low';
}

type RankedRisk = { driver: GhostYieldScoreDriver; points: number };
type RankedFit = { driver: GhostYieldScoreDriver; delta: number; positive: boolean };

function riskDriver(
  label: string,
  points: number,
  explanation: string
): GhostYieldScoreDriver {
  return {
    type: 'risk',
    label,
    impact: 'negative',
    severity: riskSeverityFromPoints(points),
    explanation,
  };
}

function fitDriver(
  label: string,
  delta: number,
  explanation: string
): GhostYieldScoreDriver {
  const positive = delta > 0;
  return {
    type: 'fit',
    label,
    impact: positive ? 'positive' : delta < 0 ? 'negative' : 'neutral',
    severity: fitSeverityFromPoints(Math.abs(delta)),
    explanation,
  };
}

/** Mirrors reasons encoded in cefPayoutStressRiskPoints (same thresholds, plain English). */
function cefPayoutStressExplanation(row: GhostYieldCandidateRaw): string {
  const cef = row.cefMetrics;
  if (!cef) return '';
  const parts: string[] = [];
  const dq = row.distributionQuality;
  const distRate = cef.distributionRate ?? row.distributionRate;
  if ((dq === 'weak' || dq === 'uncertain') && distRate != null && distRate > 0.12) {
    parts.push('distribution rate is high while payout quality is weak or uncertain');
  } else if (dq === 'weak' && distRate != null && distRate > 0.09) {
    parts.push('distribution rate is elevated with weak payout quality');
  }
  if (cef.coverageRatio != null && cef.coverageRatio < 1.0) {
    parts.push('structured coverage ratio is below one in the cited snapshot');
  }
  if (cef.uniiPerShare != null && cef.uniiPerShare < 0) {
    parts.push('UNII per share is negative where sourced');
  }
  if (parts.length === 0) return 'Structured CEF payout metrics add stress in the model.';
  return `The model adds stress because ${parts.join('; ')}.`;
}

/** Deterministic drivers aligned with existing scoring helpers — does not change numeric scores. */
export function buildGhostYieldScoreDrivers(
  row: GhostYieldCandidateRaw,
  freshness: CandidateFreshnessResult
): { riskDrivers: GhostYieldScoreDriver[]; fitDrivers: GhostYieldScoreDriver[] } {
  const dc = effectiveDataConfidence(row);
  const nav1y = effectiveNavPerformance1Y(row);
  const nav3y = effectiveNavPerformance3Y(row);

  const risks: RankedRisk[] = [];

  const cat = categoryBaseRisk(row.sleeveType);
  if (cat >= 14) {
    const d = riskDriver(
      'Sleeve category risk',
      cat,
      'This income sleeve sits in a structurally riskier category in the model (complexity and typical failure modes).'
    );
    risks.push({ driver: d, points: cat });
  }

  const yp = yieldRiskPoints(row.currentYield);
  if (yp > 0) {
    risks.push({
      driver: riskDriver(
        'Headline yield level',
        yp,
        'Very high quoted current yield lifts modeled risk because extreme carry often pairs with credit, leverage, or decay risk.'
      ),
      points: yp,
    });
  }

  const levPts = structuralLeverageRiskPoints(row);
  if (levPts > 0) {
    let expl: string;
    if (row.cefMetrics?.effectiveLeverage != null) {
      expl =
        'Effective CEF leverage (as a share of assets in the cited snapshot) raises modeled structural and NAV volatility risk.';
    } else if (row.bdcMetrics?.debtToEquity != null) {
      expl =
        'BDC debt-to-equity from structured metrics is in a range the model treats as added balance-sheet risk.';
    } else {
      expl = 'Leverage (balance-sheet style where applicable) adds risk in the model at the current keyed level.';
    }
    risks.push({ driver: riskDriver('Leverage', levPts, expl), points: levPts });
  }

  const navTrendPts = navTrendRiskPoints(nav1y, nav3y);
  if (navTrendPts > 0) {
    risks.push({
      driver: riskDriver(
        'NAV trend stress',
        navTrendPts,
        'Negative or weak trailing NAV performance increases modeled risk that distributions are harder to sustain.'
      ),
      points: navTrendPts,
    });
  }

  const premPts = premiumScheduleRiskPoints(row);
  if (premPts > 0) {
    const cefPrem = row.cefMetrics && (row.cefMetrics.premiumDiscount ?? row.premiumDiscount) != null;
    risks.push({
      driver: riskDriver(
        cefPrem ? 'Premium to NAV' : 'Rich premium / pricing',
        premPts,
        cefPrem
          ? 'Trading at a premium to NAV adds squeeze risk when the wrapper price is rich versus net asset value.'
          : 'Premium or rich pricing versus NAV (where the sleeve uses NAV-based schedules) adds modeled risk.'
      ),
      points: premPts,
    });
  }

  const dqPts = distributionQualityWeight(row.distributionQuality);
  if (dqPts > 0) {
    risks.push({
      driver: riskDriver(
        'Distribution quality',
        dqPts,
        `Distribution quality is ${row.distributionQuality} in the snapshot, so the model is more skeptical of payout durability.`
      ),
      points: dqPts,
    });
  }

  const confPts = confidencePenalty(dc);
  if (confPts > 0) {
    risks.push({
      driver: riskDriver(
        'Data confidence',
        confPts,
        'Lower data confidence on the manual row increases modeled uncertainty and a small risk penalty.'
      ),
      points: confPts,
    });
  }

  const ysc = yieldSourceComplexityPoints(row.yieldSource);
  if (ysc > 0) {
    risks.push({
      driver: riskDriver(
        row.sleeveType === 'option_income' ? 'Option-income complexity' : 'Yield-source complexity',
        ysc,
        row.sleeveType === 'option_income'
          ? 'Option-income structures often bundle upside limits, path dependency, and overwrite drag the model treats as more complex.'
          : 'The described yield source (length, ROC language, leverage, or options) adds a complexity risk tilt in the model.'
      ),
      points: ysc,
    });
  }

  const hyn = highYieldNegativeNavPoints(row);
  if (hyn > 0) {
    risks.push({
      driver: riskDriver(
        'High payout vs falling NAV',
        hyn,
        'High carry alongside negative NAV trend triggers a stress signal that payouts may be harder to maintain.'
      ),
      points: hyn,
    });
  }

  const roc = rocNavStressPoints(row);
  if (roc > 0) {
    risks.push({
      driver: riskDriver(
        'Return of capital + NAV decay',
        roc,
        'Estimated return-of-capital share combined with NAV decline adds modeled payout stress.'
      ),
      points: roc,
    });
  }

  const dvs = distributionVersusSecPoints(row);
  if (dvs > 0) {
    risks.push({
      driver: riskDriver(
        'Distribution vs SEC yield gap',
        dvs,
        'Distribution rate materially above SEC yield (when both are keyed) raises a skepticism penalty in the model.'
      ),
      points: dvs,
    });
  }

  const pvn = payoutVersusNavTrendPoints(row);
  if (pvn > 0) {
    risks.push({
      driver: riskDriver(
        'Payout vs NAV performance gap',
        pvn,
        'Payout appears high relative to recent NAV performance, which the model treats as sustainability risk.'
      ),
      points: pvn,
    });
  }

  const mnav = missingNavPoints(row);
  if (mnav > 0) {
    risks.push({
      driver: riskDriver(
        'Missing NAV',
        mnav,
        'The row expects a NAV-style quote for this structure but none is keyed, so the model applies a data-risk penalty.'
      ),
      points: mnav,
    });
  }

  const freshPts = freshnessDataPenalty(freshness);
  if (freshPts > 0) {
    risks.push({
      driver: riskDriver(
        'Stale or incomplete snapshot',
        freshPts,
        'Freshness or missing snapshot fields trigger a conservative scoring penalty, not a verdict on fund quality.'
      ),
      points: freshPts,
    });
  }

  const cef = row.cefMetrics;
  if (cef?.expenseRatioTotal != null) {
    const erPts = cefExpenseBurdenRiskPoints(cef.expenseRatioTotal);
    if (erPts > 0) {
      risks.push({
        driver: riskDriver(
          'CEF expense burden',
          erPts,
          'Total expense ratio from structured CEF metrics is high enough to raise the hurdle for net investor outcomes in the model.'
        ),
        points: erPts,
      });
    }
  }

  const payStress = cefPayoutStressRiskPoints(row);
  if (payStress > 0) {
    risks.push({
      driver: riskDriver('CEF payout stress', payStress, cefPayoutStressExplanation(row)),
      points: payStress,
    });
  }

  const bdc = row.bdcMetrics;
  if (bdc?.dividendCoverageRatio != null) {
    const cov = bdc.dividendCoverageRatio;
    let pts = 0;
    if (cov < 0.9) pts = 9;
    else if (cov < 1.0) pts = 4;
    if (pts > 0) {
      risks.push({
        driver: riskDriver(
          'BDC dividend coverage',
          pts,
          'Structured dividend coverage below one (or well below one) increases modeled payout risk for this BDC snapshot.'
        ),
        points: pts,
      });
    }
  }

  if (bdc?.nonAccrualCostPct != null) {
    const naPts = bdcNonAccrualRiskPoints(bdc.nonAccrualCostPct);
    if (naPts > 0) {
      risks.push({
        driver: riskDriver(
          'BDC non-accruals',
          naPts,
          'Non-accrual exposure as a share of portfolio cost is high enough to lift credit stress in the model.'
        ),
        points: naPts,
      });
    }
  }

  const sevOrder = (s: GhostYieldScoreDriver['severity']) => (s === 'high' ? 3 : s === 'moderate' ? 2 : 1);
  risks.sort((a, b) => {
    const sd = sevOrder(b.driver.severity) - sevOrder(a.driver.severity);
    if (sd !== 0) return sd;
    return b.points - a.points;
  });
  const riskDrivers = risks.slice(0, MAX_SCORE_DRIVERS).map((r) => r.driver);

  if (row.sleeveType === 'crypto_yield_coming_soon') {
    return {
      riskDrivers,
      fitDrivers: [
        {
          type: 'fit',
          label: 'Crypto yield placeholder',
          impact: 'negative',
          severity: 'high',
          explanation:
            'This sleeve is a placeholder; the model sets satellite fit to zero rather than scoring it like a normal yield row.',
        },
      ],
    };
  }

  const fits: RankedFit[] = [];

  const y = row.currentYield;
  if (y != null) {
    let d = 0;
    let label = 'Headline yield fit';
    let expl = '';
    if (y >= 0.06 && y <= 0.095) {
      d = 14;
      expl = 'Current yield sits in a range the model likes for a satellite sleeve without being extreme.';
    } else if (y >= 0.045 && y < 0.06) {
      d = 8;
      expl = 'Current yield is moderately supportive of fit in the model.';
    } else if (y > 0.11 && y < 0.14) {
      d = -6;
      expl = 'Current yield is high enough that the model trims fit slightly.';
    } else if (y >= 0.14) {
      d = -14;
      expl = 'Very high current yield reduces modeled fit because carry extremes carry more wipeout risk.';
    } else if (y < 0.03) {
      d = 4;
      expl = 'Lower headline yield modestly helps fit when you want less yield-chasing risk.';
    }
    if (d !== 0) fits.push({ driver: fitDriver(label, d, expl), delta: d, positive: d > 0 });
  }

  switch (row.distributionQuality) {
    case 'strong':
      fits.push({
        driver: fitDriver('Distribution quality', 12, 'Strong payout quality in the snapshot boosts modeled fit.'),
        delta: 12,
        positive: true,
      });
      break;
    case 'mixed':
      fits.push({
        driver: fitDriver('Distribution quality', 4, 'Mixed payout quality gives a modest positive nudge in the model.'),
        delta: 4,
        positive: true,
      });
      break;
    case 'weak':
      fits.push({
        driver: fitDriver('Distribution quality', -10, 'Weak payout quality reduces fit because the model discounts headline yield.'),
        delta: -10,
        positive: false,
      });
      break;
    case 'uncertain':
      fits.push({
        driver: fitDriver('Distribution quality', -14, 'Uncertain payout quality pulls fit down until the story is clearer.'),
        delta: -14,
        positive: false,
      });
      break;
    default:
      break;
  }

  if (nav1y != null) {
    let d = 0;
    let expl = '';
    if (nav1y >= 0.02) {
      d = 8;
      expl = 'Strong one-year NAV trend supports fit in the model.';
    } else if (nav1y >= 0) {
      d = 3;
      expl = 'Non-negative one-year NAV trend modestly helps fit.';
    } else if (nav1y < -0.06) {
      d = -14;
      expl = 'Meaningfully negative one-year NAV trend hurts fit versus distributions.';
    } else if (nav1y < 0) {
      d = -6;
      expl = 'Negative one-year NAV trend trims fit.';
    }
    if (d !== 0) {
      fits.push({ driver: fitDriver('NAV trend', d, expl), delta: d, positive: d > 0 });
    }
  }
  if (nav3y != null && nav3y < -0.1) {
    fits.push({
      driver: fitDriver('Longer NAV track record', -8, 'Weak three-year NAV trend reduces fit in the model.'),
      delta: -8,
      positive: false,
    });
  }

  if (row.leverage != null) {
    const lev = row.leverage;
    let d = 0;
    let expl = '';
    if (lev <= 1.02) {
      d = 6;
      expl = 'Lower keyed leverage supports fit for balance-sheet-heavy sleeves.';
    } else if (lev >= 1.35) {
      d = -12;
      expl = 'Very high leverage hurts fit in the model.';
    } else if (lev >= 1.15) {
      d = -5;
      expl = 'Elevated leverage modestly reduces fit.';
    }
    if (d !== 0) fits.push({ driver: fitDriver('Leverage fit', d, expl), delta: d, positive: d > 0 });
  }

  const premiumForFit = row.cefMetrics?.premiumDiscount ?? row.premiumDiscount;
  if (premiumForFit != null && usesNavPremiumSchedule(row.sleeveType)) {
    let d = 0;
    let expl = '';
    if (premiumForFit < -0.05) {
      d = 8;
      expl = 'A discount to NAV helps modeled fit when sleeves are often priced off NAV.';
    }
    if (premiumForFit > 0.12) {
      d = -10;
      expl = 'A large premium to NAV reduces fit because the entry is rich versus net asset value.';
    }
    if (d !== 0) {
      fits.push({
        driver: fitDriver('Discount / premium to NAV', d, expl),
        delta: d,
        positive: d > 0,
      });
    }
  }

  const expenseForFit = row.cefMetrics?.expenseRatioTotal ?? row.expenseRatio;
  if (expenseForFit != null) {
    let d = 0;
    let expl = '';
    if (expenseForFit <= 0.005) {
      d = 4;
      expl = 'Very low expense ratio supports fit.';
    }
    if (expenseForFit >= 0.025) {
      d = -8;
      expl = 'Higher expense ratio drags fit because costs eat more of gross yield.';
    }
    if (d !== 0) {
      fits.push({ driver: fitDriver('Expense ratio', d, expl), delta: d, positive: d > 0 });
    }
  }

  switch (dc) {
    case 'high':
      fits.push({
        driver: fitDriver('Data confidence', 6, 'High confidence on the cited snapshot improves fit in the model.'),
        delta: 6,
        positive: true,
      });
      break;
    case 'medium':
      fits.push({
        driver: fitDriver('Data confidence', 2, 'Medium confidence is a small positive in the model.'),
        delta: 2,
        positive: true,
      });
      break;
    case 'low':
      fits.push({
        driver: fitDriver('Data confidence', -8, 'Low data confidence trims fit.'),
        delta: -8,
        positive: false,
      });
      break;
    case 'illustrative':
      fits.push({
        driver: fitDriver('Data confidence', -12, 'Illustrative rows are heavily discounted for fit.'),
        delta: -12,
        positive: false,
      });
      break;
    default:
      break;
  }

  const simpleSource =
    row.yieldSource.length < 90 &&
    !row.yieldSource.toLowerCase().includes(' roc') &&
    !row.yieldSource.toLowerCase().includes('return of capital');
  if (simpleSource) {
    fits.push({
      driver: fitDriver('Simple yield story', 4, 'A shorter, simpler yield description modestly helps fit.'),
      delta: 4,
      positive: true,
    });
  }

  switch (row.sleeveType) {
    case 'cash_tbills':
      fits.push({
        driver: fitDriver('Cash / T-bill role', 8, 'Cash-like sleeves score as straightforward ballast in the model.'),
        delta: 8,
        positive: true,
      });
      break;
    case 'credit_income':
      fits.push({
        driver: fitDriver('Credit income role', 2, 'Bread-and-butter credit sleeves get a small role-based nudge.'),
        delta: 2,
        positive: true,
      });
      break;
    default:
      break;
  }

  if (freshness.status === 'fresh' && dc === 'high') {
    fits.push({
      driver: fitDriver('Fresh snapshot', 4, 'Fresh data with high confidence adds a small fit bonus.'),
      delta: 4,
      positive: true,
    });
  } else if (freshness.status === 'fresh' && dc === 'medium') {
    fits.push({
      driver: fitDriver('Fresh snapshot', 2, 'Fresh data with medium confidence helps a little.'),
      delta: 2,
      positive: true,
    });
  } else if (freshness.status === 'stale' || freshness.status === 'missing') {
    fits.push({
      driver: fitDriver('Snapshot freshness', -10, 'Stale or missing lineage fields reduce fit until the row is refreshed.'),
      delta: -10,
      positive: false,
    });
  } else if (freshness.status === 'caution' || freshness.status === 'illustrative') {
    fits.push({
      driver: fitDriver('Snapshot freshness', -4, 'Caution or illustrative freshness trims fit slightly.'),
      delta: -4,
      positive: false,
    });
  }

  const dRate = row.distributionRate;
  const sec = row.secYield;
  if (dRate != null && sec != null) {
    const g = Math.abs(dRate - sec);
    let d = 0;
    let expl = '';
    if (g <= 0.012) {
      d = 6;
      expl = 'Distribution rate tracks SEC yield closely in the keyed fields, which the model likes.';
    } else if (g <= 0.02) {
      d = 2;
      expl = 'SEC yield and distribution rate are reasonably aligned.';
    } else if (g >= 0.04) {
      d = -6;
      expl = 'Large mismatch between distribution rate and SEC yield reduces fit.';
    }
    if (d !== 0) {
      fits.push({ driver: fitDriver('SEC yield alignment', d, expl), delta: d, positive: d > 0 });
    }
  }

  const cefFit = scoreCefMetricAdjustments(row).fit;
  if (cefFit > 0) {
    fits.push({
      driver: fitDriver(
        'Wide CEF discount',
        cefFit,
        'A wider discount to NAV with non-weak payout quality and OK NAV trend adds a modest fit bump in structured CEF rows.'
      ),
      delta: cefFit,
      positive: true,
    });
  }

  const bdcCov = row.bdcMetrics?.dividendCoverageRatio;
  if (bdcCov != null) {
    let d = 0;
    let expl = '';
    if (bdcCov >= 1.1) {
      d = 4;
      expl = 'Strong BDC dividend coverage from structured metrics helps fit.';
    } else if (bdcCov >= 1.0) {
      d = 2;
      expl = 'Coverage at or above one in structured metrics is a modest positive for fit.';
    }
    if (d !== 0) {
      fits.push({ driver: fitDriver('BDC dividend coverage', d, expl), delta: d, positive: true });
    }
  }

  const fl = row.bdcMetrics?.firstLienPct;
  if (fl != null) {
    let d = 0;
    let expl = '';
    if (fl > 0.8) {
      d = 4;
      expl = 'High first-lien share in structured BDC metrics supports credit-quality fit.';
    } else if (fl < 0.6) {
      d = -3;
      expl = 'Lower first-lien share modestly reduces fit versus more senior-secured portfolios.';
    }
    if (d !== 0) {
      fits.push({ driver: fitDriver('BDC first-lien mix', d, expl), delta: d, positive: d > 0 });
    }
  }

  const sevFit = (s: GhostYieldScoreDriver['severity']) => (s === 'high' ? 3 : s === 'moderate' ? 2 : 1);
  fits.sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? -1 : 1;
    const sd = sevFit(b.driver.severity) - sevFit(a.driver.severity);
    if (sd !== 0) return sd;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });
  const fitDrivers = fits.slice(0, MAX_SCORE_DRIVERS).map((f) => f.driver);

  return { riskDrivers, fitDrivers };
}

export function getScoreDrivers(candidate: GhostYieldCandidate): {
  risk: GhostYieldScoreDriver[];
  fit: GhostYieldScoreDriver[];
} {
  return { risk: candidate.riskDrivers, fit: candidate.fitDrivers };
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
    const { riskDrivers, fitDrivers } = buildGhostYieldScoreDrivers(r, freshness);
    return {
      ...r,
      freshness,
      riskScore: computeGhostYieldRiskScore(r, freshness),
      fitScore: computeGhostYieldFitScore(r, freshness),
      riskDrivers,
      fitDrivers,
    };
  });
}
