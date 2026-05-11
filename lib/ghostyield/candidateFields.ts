/**
 * Resolved candidate fields for scoring and freshness (Phase 2 static data).
 */

import type { Confidence, GhostYieldCandidateRaw } from './types';

export function effectiveDataConfidence(row: GhostYieldCandidateRaw): Confidence {
  return row.dataConfidence ?? row.confidence;
}

export function effectiveNavPerformance1Y(row: GhostYieldCandidateRaw): number | undefined {
  return row.navPerformance1Y ?? row.navTrend1Y;
}

export function effectiveNavPerformance3Y(row: GhostYieldCandidateRaw): number | undefined {
  return row.navPerformance3Y ?? row.navTrend3Y;
}

const ETF_MARK = /\betf\b/i;
const CEF_MARK = /\bcef\b/i;

export function structureLabelNorm(row: GhostYieldCandidateRaw): string {
  return row.structureLabel?.trim() ?? '';
}

/** True when wrapper looks like ETF (for NAV expectations). */
export function isEtfStructure(row: GhostYieldCandidateRaw): boolean {
  return ETF_MARK.test(structureLabelNorm(row));
}

/** True when wrapper looks like closed-end fund. */
export function isCefStructure(row: GhostYieldCandidateRaw): boolean {
  return CEF_MARK.test(structureLabelNorm(row));
}

/** NAV is expected for these static structures (ETF + CEF). */
export function expectsNavQuote(row: GhostYieldCandidateRaw): boolean {
  return isEtfStructure(row) || isCefStructure(row);
}

export function canInferPremiumDiscount(row: GhostYieldCandidateRaw): boolean {
  return row.marketPrice != null && row.nav != null && row.nav !== 0;
}

/** Listed BDC common stock rows (not BDC ETFs: those use structureLabel ETF). */
export function isListedBdcStock(row: GhostYieldCandidateRaw): boolean {
  return row.sleeveType === 'bdc_income' && /listed bdc/i.test(structureLabelNorm(row));
}

/** Which yield field the screener column should display (UI only — does not mutate row data). */
export type DisplayYieldKind = 'currentYield' | 'distributionRate' | 'secYield';

export function effectiveDisplayYield(row: GhostYieldCandidateRaw): {
  value: number | null;
  kind: DisplayYieldKind | null;
} {
  if (row.currentYield != null) return { value: row.currentYield, kind: 'currentYield' };
  if (row.distributionRate != null) return { value: row.distributionRate, kind: 'distributionRate' };
  if (row.secYield != null) return { value: row.secYield, kind: 'secYield' };
  return { value: null, kind: null };
}

export function displayYieldKindShortLabel(
  kind: DisplayYieldKind | null,
  row?: GhostYieldCandidateRaw
): string {
  if (kind === 'distributionRate' && row != null && isListedBdcStock(row)) {
    return 'Dist./NAV sh';
  }
  switch (kind) {
    case 'currentYield':
      return 'Current';
    case 'distributionRate':
      return 'Dist. rate';
    case 'secYield':
      return 'SEC';
    default:
      return '';
  }
}
