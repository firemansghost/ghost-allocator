/**
 * GhostRegime UI Helpers
 * 
 * Pure deterministic functions for formatting and deriving display information
 * for the GhostRegime page UI. No fetches, no hooks, no side effects.
 */

import type { GhostRegimeRow, RegimeType, SignalReceipt } from './types';
import {
  AGREEMENT_TREND_RISK_PREFIX,
  AGREEMENT_TREND_INFLATION_PREFIX,
  AGREEMENT_TREND_CLEANER,
  AGREEMENT_TREND_MIXED,
  AGREEMENT_TREND_SAME,
} from './ghostregimePageCopy';

/**
 * Format scale value to human-readable label
 */
export function formatScaleLabel(scale: number): 'full size' | 'half size' | 'off' | string {
  if (scale === 1.0) return 'full size';
  if (scale === 0.5) return 'half size';
  if (scale === 0.0) return 'off';
  return `${(scale * 100).toFixed(0)}%`;
}

/**
 * Format bucket × scale line for display
 * e.g. "bucket 10% × half size"
 * @deprecated Use formatBucketUtilizationLine instead
 */
export function formatBucketScaleLine(bucketPct: number, scale: number): string {
  const bucketPercent = (bucketPct * 100).toFixed(0);
  const scaleLabel = formatScaleLabel(scale);
  return `bucket ${bucketPercent}% × ${scaleLabel}`;
}

/**
 * Format bucket utilization line for display
 * e.g. "100% of your 60% bucket (scale 1.0 • full size)"
 * e.g. "50% of your 10% bucket (scale 0.5 • half size)"
 * e.g. "0% of your 10% bucket (scale 0.0 • off)"
 */
export function formatBucketUtilizationLine(bucketPct: number, scale: number): string {
  const bucketPercent = (bucketPct * 100).toFixed(0);
  const utilizationPct = (scale * 100).toFixed(0);
  const scaleLabel = formatScaleLabel(scale);
  return `${utilizationPct}% of your ${bucketPercent}% bucket (scale ${scale.toFixed(1)} • ${scaleLabel})`;
}

/**
 * Get cash sources (assets contributing leftover cash)
 * Returns array of asset names where scale < 1 and target > 0
 */
export function getCashSources(data: GhostRegimeRow): string[] {
  const sources: string[] = [];
  
  if (data.stocks_target > 0 && data.stocks_scale < 1) {
    sources.push('Stocks');
  }
  if (data.gold_target > 0 && data.gold_scale < 1) {
    sources.push('Gold');
  }
  if (data.btc_target > 0 && data.btc_scale < 1) {
    sources.push('Bitcoin');
  }
  
  return sources;
}

/**
 * Summarize changes between two GhostRegime rows
 * Returns a compact string summary, or null if no changes
 */
export function summarizeGhostRegimeChange(
  current: GhostRegimeRow,
  previous: GhostRegimeRow
): string | null {
  const changes: string[] = [];

  if (current.regime !== previous.regime) {
    changes.push(`Regime ${previous.regime} → ${current.regime}`);
  }

  if (current.risk_regime !== previous.risk_regime) {
    changes.push(`Risk ${previous.risk_regime} → ${current.risk_regime}`);
  }

  if (current.stocks_scale !== previous.stocks_scale) {
    changes.push(`Stocks scale ${previous.stocks_scale.toFixed(1)} → ${current.stocks_scale.toFixed(1)}`);
  }

  if (current.gold_scale !== previous.gold_scale) {
    changes.push(`Gold scale ${previous.gold_scale.toFixed(1)} → ${current.gold_scale.toFixed(1)}`);
  }

  if (current.btc_scale !== previous.btc_scale) {
    changes.push(`BTC scale ${previous.btc_scale.toFixed(1)} → ${current.btc_scale.toFixed(1)}`);
  }

  if (changes.length === 0) {
    return null;
  }

  return changes.join('; ');
}

/**
 * Build Today's Snapshot one-liner
 * Format: "Today: Targets 60/30/10. Scales: Stocks full, Gold full, BTC half → Actual 60/30/5 + 5 cash."
 */
export function buildTodaySnapshotLine(data: GhostRegimeRow | null): string | null {
  if (!data) return null;
  
  const stocksTarget = (data.stocks_target * 100).toFixed(0);
  const goldTarget = (data.gold_target * 100).toFixed(0);
  const btcTarget = (data.btc_target * 100).toFixed(0);
  
  const stocksActual = (data.stocks_actual * 100).toFixed(0);
  const goldActual = (data.gold_actual * 100).toFixed(0);
  const btcActual = (data.btc_actual * 100).toFixed(0);
  const cash = (data.cash * 100).toFixed(0);
  
  const stocksScale = formatScaleLabel(data.stocks_scale);
  const goldScale = formatScaleLabel(data.gold_scale);
  const btcScale = formatScaleLabel(data.btc_scale);
  
  const scales = [
    `Stocks ${stocksScale}`,
    `Gold ${goldScale}`,
    `BTC ${btcScale}`,
  ].join(', ');
  
  const actuals = `${stocksActual}/${goldActual}/${btcActual}`;
  const cashPart = parseFloat(cash) > 0.1 ? ` + ${cash} cash` : '';
  
  return `Today: Targets ${stocksTarget}/${goldTarget}/${btcTarget}. Scales: ${scales} → Actual ${actuals}${cashPart}.`;
}

/**
 * Build micro-flow line showing Targets → Scales → Actual → Cash
 * Format: "Targets (60/30/10) → Scales (full/full/half) → Actual (60/30/5) → Cash (5)"
 */
export function buildMicroFlowLine(data: GhostRegimeRow | null): string | null {
  if (!data) return null;
  
  const stocksTarget = (data.stocks_target * 100).toFixed(0);
  const goldTarget = (data.gold_target * 100).toFixed(0);
  const btcTarget = (data.btc_target * 100).toFixed(0);
  
  const stocksActual = (data.stocks_actual * 100).toFixed(0);
  const goldActual = (data.gold_actual * 100).toFixed(0);
  const btcActual = (data.btc_actual * 100).toFixed(0);
  const cash = (data.cash * 100).toFixed(0);
  
  const stocksScale = formatScaleLabel(data.stocks_scale);
  const goldScale = formatScaleLabel(data.gold_scale);
  const btcScale = formatScaleLabel(data.btc_scale);
  
  const targets = `${stocksTarget}/${goldTarget}/${btcTarget}`;
  const scales = `${stocksScale}/${goldScale}/${btcScale}`;
  const actuals = `${stocksActual}/${goldActual}/${btcActual}`;
  
  return `Targets (${targets}) → Scales (${scales}) → Actual (${actuals}) → Cash (${cash})`;
}

/**
 * Regime Map Configuration
 * Maps regime types to their position in the 2x2 grid
 */
export interface RegimeMapPosition {
  regime: RegimeType;
  riskAxis: 'Risk On' | 'Risk Off';
  inflAxis: 'Inflation' | 'Disinflation';
  label: string;
}

export const REGIME_MAP: RegimeMapPosition[] = [
  {
    regime: 'GOLDILOCKS',
    riskAxis: 'Risk On',
    inflAxis: 'Disinflation',
    label: 'GOLDILOCKS',
  },
  {
    regime: 'REFLATION',
    riskAxis: 'Risk On',
    inflAxis: 'Inflation',
    label: 'REFLATION',
  },
  {
    regime: 'INFLATION',
    riskAxis: 'Risk Off',
    inflAxis: 'Inflation',
    label: 'INFLATION',
  },
  {
    regime: 'DEFLATION',
    riskAxis: 'Risk Off',
    inflAxis: 'Disinflation',
    label: 'DEFLATION',
  },
];

/**
 * Get regime map position for a given regime
 */
export function getRegimeMapPosition(regime: RegimeType): RegimeMapPosition | undefined {
  return REGIME_MAP.find((m) => m.regime === regime);
}

/**
 * Format a signed number for display
 * e.g. 2 -> "+2", -3.0 -> "-3.0"
 */
export function formatSignedNumber(n: number): string {
  if (n > 0) return `+${n.toFixed(n % 1 === 0 ? 0 : 1)}`;
  return n.toFixed(n % 1 === 0 ? 0 : 1);
}

/**
 * Format VAMS state to human-readable label
 */
export function formatVamsState(state: number): string {
  if (state === 2) return 'full size';
  if (state === 0) return 'half size';
  if (state === -2) return 'off';
  return `${state}`;
}

/**
 * Describe axis from scores and generate regime explanation
 */
export function describeAxisFromScores(row: GhostRegimeRow): {
  riskLine: string;
  inflationLine: string;
  regimeLine: string;
  soWhatLines: string[];
} {
  const riskScore = row.risk_score;
  const inflScore = row.infl_score;
  
  const riskAxis = riskScore > 0 ? 'RISK ON' : 'RISK OFF';
  const inflAxis = inflScore > 0 ? 'INFLATION' : 'DISINFLATION';
  
  const riskLine = `Risk axis: **${riskAxis}** (risk score: ${formatSignedNumber(riskScore)})`;
  const inflationLine = `Inflation axis: **${inflAxis}** (inflation score: ${formatSignedNumber(inflScore)})`;
  const regimeLine = `→ That combination lands in **${row.regime}**.`;
  
  const soWhatLines: string[] = [];
  if (riskScore > 0) {
    soWhatLines.push('Markets are acting brave.');
  } else {
    soWhatLines.push('Markets are acting like they saw a ghost.');
  }
  if (inflScore > 0) {
    soWhatLines.push('Prices are being spicy.');
  } else {
    soWhatLines.push('Prices are calming down (for now).');
  }
  
  return {
    riskLine,
    inflationLine,
    regimeLine,
    soWhatLines,
  };
}

/**
 * Summarize changes between two GhostRegime rows with score deltas
 * Returns an array of change strings that can be joined with "; "
 */
export function summarizeGhostRegimeChangeDetailed(
  current: GhostRegimeRow,
  previous: GhostRegimeRow
): string[] {
  const changes: string[] = [];

  // Regime changes
  if (current.regime !== previous.regime) {
    changes.push(`Regime ${previous.regime} → ${current.regime}`);
  }

  // Risk regime changes
  if (current.risk_regime !== previous.risk_regime) {
    changes.push(`Risk ${previous.risk_regime} → ${current.risk_regime}`);
  }

  // Score deltas
  const riskDelta = current.risk_score - previous.risk_score;
  if (Math.abs(riskDelta) > 0.01) {
    const direction = riskDelta > 0 ? 'more Risk On' : 'more Risk Off';
    changes.push(`Risk score ${formatSignedNumber(riskDelta)} (${direction})`);
  }

  const inflDelta = current.infl_score - previous.infl_score;
  if (Math.abs(inflDelta) > 0.01) {
    const direction = inflDelta > 0 ? 'more Inflation' : 'more Disinflation';
    changes.push(`Inflation score ${formatSignedNumber(inflDelta)} (${direction})`);
  }

  // Scale changes
  if (current.stocks_scale !== previous.stocks_scale) {
    changes.push(`Stocks scale ${previous.stocks_scale.toFixed(1)} → ${current.stocks_scale.toFixed(1)}`);
  }

  if (current.gold_scale !== previous.gold_scale) {
    changes.push(`Gold scale ${previous.gold_scale.toFixed(1)} → ${current.gold_scale.toFixed(1)}`);
  }

  if (current.btc_scale !== previous.btc_scale) {
    changes.push(`BTC scale ${previous.btc_scale.toFixed(1)} → ${current.btc_scale.toFixed(1)}`);
  }

  return changes;
}

/**
 * Get Flip Watch copy for display
 */
export function getFlipWatchCopy(flipWatchStatus: string): {
  title: string;
  lines: string[];
} | null {
  if (flipWatchStatus === 'NONE') {
    return null; // Handled separately
  }

  const title = `Flip Watch: ${flipWatchStatus}`;
  const lines = [
    "This is the model saying: 'cool story — show me tomorrow too.'",
    'It reduces whipsaw by waiting for confirmation.',
  ];

  return { title, lines };
}

/**
 * Pick top N drivers from receipts
 * Sorting rules (deterministic):
 * - Prefer non-zero votes
 * - Higher absolute vote first
 * - Tie-break by stable key order (alphabetical) so it doesn't flicker
 */
export function pickTopDrivers(receipts: SignalReceipt[] | undefined, n: number = 2): SignalReceipt[] {
  if (!receipts || receipts.length === 0) {
    return [];
  }

  // Filter to non-zero votes, then sort by absolute vote (descending), then by key (ascending)
  const nonZero = receipts.filter((r) => r.vote !== 0);
  const sorted = nonZero.sort((a, b) => {
    const absA = Math.abs(a.vote);
    const absB = Math.abs(b.vote);
    if (absA !== absB) {
      return absB - absA; // Higher absolute vote first
    }
    // Tie-break by key (alphabetical)
    return a.key.localeCompare(b.key);
  });

  return sorted.slice(0, n);
}

/**
 * Format a driver line for display
 * e.g. "Credit vs Treasuries → Risk On (+1)"
 */
export function formatDriverLine(item: SignalReceipt): string {
  const voteStr = formatSignedNumber(item.vote);
  return `${item.label} → ${item.direction} (${voteStr})`;
}

/**
 * Group drivers by axis direction
 * Returns drivers pushing in the current axis direction vs the opposite
 */
export function groupDriversByAxis(
  receipts: SignalReceipt[] | undefined,
  currentAxis: 'Risk On' | 'Risk Off' | 'Inflation' | 'Disinflation'
): {
  pushingThisWay: SignalReceipt[];
  pushingOtherWay: SignalReceipt[];
} {
  if (!receipts || receipts.length === 0) {
    return { pushingThisWay: [], pushingOtherWay: [] };
  }

  const pushingThisWay: SignalReceipt[] = [];
  const pushingOtherWay: SignalReceipt[] = [];

  for (const receipt of receipts) {
    if (receipt.direction === currentAxis) {
      pushingThisWay.push(receipt);
    } else {
      pushingOtherWay.push(receipt);
    }
  }

  return { pushingThisWay, pushingOtherWay };
}

/**
 * Compute axis agreement from receipts
 * Returns how many non-zero votes align with the current axis direction
 */
export function computeAxisAgreement(
  receipts: SignalReceipt[] | undefined,
  axisDirection: 'Risk On' | 'Risk Off' | 'Inflation' | 'Disinflation'
): {
  agree: number;
  total: number;
  disagree: number;
  pct: number | null;
} {
  if (!receipts || receipts.length === 0) {
    return { agree: 0, total: 0, disagree: 0, pct: null };
  }

  // Filter to non-zero votes only
  const nonZero = receipts.filter((r) => r.vote !== 0);
  const total = nonZero.length;

  if (total === 0) {
    return { agree: 0, total: 0, disagree: 0, pct: null };
  }

  // Count votes that align with axis direction
  let agree = 0;
  for (const receipt of nonZero) {
    // Risk axis: Risk On means votes > 0 agree, Risk Off means votes < 0 agree
    // Inflation axis: Inflation means votes > 0 agree, Disinflation means votes < 0 agree
    const isAgreeing =
      (axisDirection === 'Risk On' || axisDirection === 'Inflation') 
        ? receipt.vote > 0 
        : receipt.vote < 0;
    
    if (isAgreeing) {
      agree++;
    }
  }

  const disagree = total - agree;
  const pct = total > 0 ? (agree / total) * 100 : null;

  return { agree, total, disagree, pct };
}

/**
 * Format agreement badge label and tooltip
 */
export function formatAgreementBadge(agreement: {
  agree: number;
  total: number;
  disagree: number;
  pct: number | null;
}): {
  label: string;
  tooltip: string;
} {
  if (agreement.total === 0) {
    return {
      label: 'Agreement: n/a',
      tooltip: 'All signals were neutral today.',
    };
  }

  const pctStr = agreement.pct !== null ? ` (${agreement.pct.toFixed(0)}%)` : '';
  return {
    label: `Agreement: ${agreement.agree}/${agreement.total}${pctStr}`,
    tooltip: 'Agreement among non-zero signal votes. Not a probability.',
  };
}

/**
 * Compute agreement delta between two rows
 * Returns trend lines for Risk and Inflation axes if both rows have receipts
 */
export function computeAgreementDelta(
  currentRow: GhostRegimeRow,
  previousRow: GhostRegimeRow
): {
  risk?: {
    current: ReturnType<typeof computeAxisAgreement>;
    prev: ReturnType<typeof computeAxisAgreement>;
    deltaPct: number | null;
    line: string;
  };
  inflation?: {
    current: ReturnType<typeof computeAxisAgreement>;
    prev: ReturnType<typeof computeAxisAgreement>;
    deltaPct: number | null;
    line: string;
  };
} {
  const result: ReturnType<typeof computeAgreementDelta> = {};

  // Risk axis agreement delta
  const riskAxisDirection = currentRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const currentRiskAgreement = computeAxisAgreement(currentRow.risk_receipts, riskAxisDirection);
  const prevRiskAgreement = computeAxisAgreement(previousRow.risk_receipts, riskAxisDirection);

  if (
    currentRiskAgreement.total > 0 &&
    prevRiskAgreement.total > 0 &&
    currentRiskAgreement.pct !== null &&
    prevRiskAgreement.pct !== null
  ) {
    const deltaPct = currentRiskAgreement.pct - prevRiskAgreement.pct;
    const descriptor =
      deltaPct >= 20 ? AGREEMENT_TREND_CLEANER : deltaPct <= -20 ? AGREEMENT_TREND_MIXED : AGREEMENT_TREND_SAME;
    const line = `${AGREEMENT_TREND_RISK_PREFIX} ${currentRiskAgreement.agree}/${currentRiskAgreement.total} (${currentRiskAgreement.pct.toFixed(0)}%) → ${prevRiskAgreement.agree}/${prevRiskAgreement.total} (${prevRiskAgreement.pct.toFixed(0)}%) (${descriptor})`;
    result.risk = {
      current: currentRiskAgreement,
      prev: prevRiskAgreement,
      deltaPct,
      line,
    };
  }

  // Inflation axis agreement delta
  const inflAxis = currentRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
  const currentInflAgreement = computeAxisAgreement(currentRow.inflation_receipts, inflAxis);
  const prevInflAgreement = computeAxisAgreement(previousRow.inflation_receipts, inflAxis);

  if (
    currentInflAgreement.total > 0 &&
    prevInflAgreement.total > 0 &&
    currentInflAgreement.pct !== null &&
    prevInflAgreement.pct !== null
  ) {
    const deltaPct = currentInflAgreement.pct - prevInflAgreement.pct;
    const descriptor =
      deltaPct >= 20 ? AGREEMENT_TREND_CLEANER : deltaPct <= -20 ? AGREEMENT_TREND_MIXED : AGREEMENT_TREND_SAME;
    const line = `${AGREEMENT_TREND_INFLATION_PREFIX} ${currentInflAgreement.agree}/${currentInflAgreement.total} (${currentInflAgreement.pct.toFixed(0)}%) → ${prevInflAgreement.agree}/${prevInflAgreement.total} (${prevInflAgreement.pct.toFixed(0)}%) (${descriptor})`;
    result.inflation = {
      current: currentInflAgreement,
      prev: prevInflAgreement,
      deltaPct,
      line,
    };
  }

  return result;
}

