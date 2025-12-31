/**
 * GhostRegime UI Helpers
 * 
 * Pure deterministic functions for formatting and deriving display information
 * for the GhostRegime page UI. No fetches, no hooks, no side effects.
 */

import type { GhostRegimeRow, RegimeType, SignalReceipt } from './types';

/**
 * Sort receipts by strength (absolute vote value) or keep default order
 */
export function sortReceipts(
  receipts: SignalReceipt[],
  mode: 'default' | 'strength'
): SignalReceipt[] {
  if (mode === 'default') {
    return receipts;
  }
  
  // Sort by absolute vote descending, then by key for deterministic tie-breaker
  return [...receipts].sort((a, b) => {
    const absA = Math.abs(a.vote);
    const absB = Math.abs(b.vote);
    
    if (absB !== absA) {
      return absB - absA; // Descending by absolute vote
    }
    
    // Tie-breaker: sort by key (deterministic)
    return a.key.localeCompare(b.key);
  });
}

// Compare panel types
export type CompareAxis = 'risk' | 'infl';
export type CompareKind = 'regime' | 'crowded' | 'conviction' | 'agreement' | 'netvote' | 'confidence';

export interface CompareBiggestChange {
  headline: string;
  kind: CompareKind;
  axis?: CompareAxis;
  detail?: string;
  tooltip: string;
}
import {
  AGREEMENT_TREND_RISK_PREFIX,
  AGREEMENT_TREND_INFLATION_PREFIX,
  AGREEMENT_TREND_CLEANER,
  AGREEMENT_TREND_MIXED,
  AGREEMENT_TREND_SAME,
  CONVICTION_LABEL_PREFIX,
  CONVICTION_TOOLTIP,
  CONVICTION_TOOLTIP_SPICY,
  CONVICTION_TOOLTIP_NA,
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
 * Format a single cash source to a friendly label
 */
export function formatCashSourceLabel(source: string): string {
  const mapping: Record<string, string> = {
    'Bitcoin': 'BTC throttle',
    'Stocks': 'Equity throttle',
    'Gold': 'Gold throttle',
  };
  return mapping[source] || source;
}

/**
 * Format cash sources array to a pill label
 */
export function formatCashPillLabel(sources: string[]): string {
  if (sources.length === 0) {
    return '';
  }
  if (sources.length === 1) {
    return `Cash from ${formatCashSourceLabel(sources[0])}`;
  }
  // Multiple sources: use generic label
  return 'Cash from throttling';
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
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute conviction metric: strength of net vote per available signals
 * Returns a 0..100 index representing how "strong" the net vote is relative to signal count
 */
export function computeConviction(
  netVote: number | null | undefined,
  totalSignals: number | null | undefined
): {
  raw: number | null;
  index: number | null;
  bucketLabel: string | null;
  label: string;
  tooltip: string;
} {
  if (netVote === null || netVote === undefined || !totalSignals || totalSignals === 0) {
    return {
      raw: null,
      index: null,
      bucketLabel: null,
      label: `${CONVICTION_LABEL_PREFIX} n/a`,
      tooltip: CONVICTION_TOOLTIP_NA,
    };
  }

  const raw = Math.abs(netVote) / totalSignals;
  const index = clamp(Math.round(raw * 100), 0, 100);
  
  // Determine bucket label
  let bucketLabel: string | null = null;
  if (index >= 0 && index <= 25) {
    bucketLabel = 'weak';
  } else if (index >= 26 && index <= 50) {
    bucketLabel = 'lean';
  } else if (index >= 51 && index <= 75) {
    bucketLabel = 'strong';
  } else if (index >= 76 && index <= 100) {
    bucketLabel = 'lopsided';
  }

  return {
    raw,
    index,
    bucketLabel,
    label: bucketLabel ? `${CONVICTION_LABEL_PREFIX} ${index} (${bucketLabel})` : `${CONVICTION_LABEL_PREFIX} ${index}`,
    tooltip: CONVICTION_TOOLTIP_SPICY,
  };
}

/**
 * Compute axis statistics: agreement + coverage + confidence
 * Returns comprehensive stats for an axis including confidence heuristic
 */
export function computeAxisStats(
  receipts: SignalReceipt[] | undefined,
  axisDirection: 'Risk On' | 'Risk Off' | 'Inflation' | 'Disinflation'
): {
  totalSignals: number;
  nonNeutral: number;
  agree: number;
  disagree: number;
  agreementPct: number | null;
  coveragePct: number | null;
  agreementLabel: string;
  coverageLabel: string;
  confidence: {
    label: 'High' | 'Medium' | 'Low' | 'n/a';
    score: number | null;
    tooltip: string;
  };
} {
  if (!receipts || receipts.length === 0) {
    return {
      totalSignals: 0,
      nonNeutral: 0,
      agree: 0,
      disagree: 0,
      agreementPct: null,
      coveragePct: null,
      agreementLabel: 'Agreement: n/a',
      coverageLabel: 'Coverage: n/a',
      confidence: {
        label: 'n/a',
        score: null,
        tooltip: 'Heuristic: agreement + breadth (coverage). Not a probability.',
      },
    };
  }

  const totalSignals = receipts.length;
  const nonZero = receipts.filter((r) => r.vote !== 0);
  const nonNeutral = nonZero.length;

  if (nonNeutral === 0) {
    return {
      totalSignals,
      nonNeutral: 0,
      agree: 0,
      disagree: 0,
      agreementPct: null,
      coveragePct: 0,
      agreementLabel: 'Agreement: n/a',
      coverageLabel: `Coverage: 0/${totalSignals} signals`,
      confidence: {
        label: 'n/a',
        score: null,
        tooltip: 'Heuristic: agreement + breadth (coverage). Not a probability.',
      },
    };
  }

  // Count votes that align with axis direction
  let agree = 0;
  for (const receipt of nonZero) {
    const isAgreeing =
      (axisDirection === 'Risk On' || axisDirection === 'Inflation')
        ? receipt.vote > 0
        : receipt.vote < 0;
    
    if (isAgreeing) {
      agree++;
    }
  }

  const disagree = nonNeutral - agree;
  const agreementPct = nonNeutral > 0 ? (agree / nonNeutral) * 100 : null;
  const coveragePct = totalSignals > 0 ? (nonNeutral / totalSignals) * 100 : null;

  // Confidence heuristic: 0.7 * agreement + 0.3 * coverage (both 0..1)
  let confidence: { label: 'High' | 'Medium' | 'Low' | 'n/a'; score: number | null; tooltip: string };
  if (agreementPct === null || coveragePct === null) {
    confidence = {
      label: 'n/a',
      score: null,
      tooltip: 'Heuristic: agreement + breadth (coverage). Not a probability.',
    };
  } else {
    const agreementNorm = agreementPct / 100;
    const coverageNorm = coveragePct / 100;
    const score = 0.7 * agreementNorm + 0.3 * coverageNorm;
    
    let label: 'High' | 'Medium' | 'Low';
    if (score >= 0.85) {
      label = 'High';
    } else if (score >= 0.65) {
      label = 'Medium';
    } else {
      label = 'Low';
    }
    
    confidence = {
      label,
      score,
      tooltip: 'Heuristic: agreement + breadth (coverage). Not a probability.',
    };
  }

  const agreementPctStr = agreementPct !== null ? ` (${agreementPct.toFixed(0)}%)` : '';
  const agreementLabel = `Agreement: ${agree}/${nonNeutral}${agreementPctStr}`;
  const coverageLabel = `Coverage: ${nonNeutral}/${totalSignals} signals`;

  return {
    totalSignals,
    nonNeutral,
    agree,
    disagree,
    agreementPct,
    coveragePct,
    agreementLabel,
    coverageLabel,
    confidence,
  };
}

/**
 * Derive "Voted" label from vote sign (UI-only, for receipts table)
 * Risk axis: + => "Risk On", - => "Risk Off", 0 => "Neutral"
 * Inflation axis: + => "Inflation", - => "Disinflation", 0 => "Neutral"
 */
export function deriveVotedLabel(
  vote: number,
  axisType: 'risk' | 'inflation'
): string {
  if (vote === 0) return 'Neutral';
  
  if (axisType === 'risk') {
    return vote > 0 ? 'Risk On' : 'Risk Off';
  } else {
    return vote > 0 ? 'Inflation' : 'Disinflation';
  }
}

/**
 * Sanitize receipt note by removing trailing direction parentheticals
 * Removes patterns like "(Inflation)", "(Disinflation)", "(RiskOn)", "(RiskOff)", etc.
 * Returns the "rule" portion only (thresholds/conditions).
 */
export function sanitizeReceiptNote(note?: string): string {
  if (!note) return '';
  
  let sanitized = note.trim();
  
  // Remove trailing direction parentheticals (case-insensitive)
  const directionPatterns = [
    /\s*\(Inflation\)\s*$/i,
    /\s*\(Disinflation\)\s*$/i,
    /\s*\(RiskOn\)\s*$/i,
    /\s*\(Risk Off\)\s*$/i,
    /\s*\(Risk\s+On\)\s*$/i,
    /\s*\(Risk\s+Off\)\s*$/i,
  ];
  
  for (const pattern of directionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove meta portion (Age:, decay:) if present
  const metaIndex = sanitized.search(/\s+Age:/i);
  if (metaIndex > 0) {
    sanitized = sanitized.substring(0, metaIndex);
  }
  
  return sanitized.trim();
}

/**
 * Split receipt note into Rule (threshold/condition) and Meta (age/decay/etc)
 */
export function splitReceiptNote(note?: string): { rule: string; meta: string } {
  if (!note) return { rule: '', meta: '' };
  
  const trimmed = note.trim();
  
  // Find meta portion (starts with "Age:" or contains "decay:")
  const ageIndex = trimmed.search(/\s+Age:/i);
  const decayIndex = trimmed.search(/\s+decay:/i);
  
  let rule = trimmed;
  let meta = '';
  
  if (ageIndex > 0) {
    rule = trimmed.substring(0, ageIndex).trim();
    meta = trimmed.substring(ageIndex).trim();
  } else if (decayIndex > 0) {
    // If no Age: but has decay:, treat everything from decay: as meta
    rule = trimmed.substring(0, decayIndex).trim();
    meta = trimmed.substring(decayIndex).trim();
  }
  
  // Sanitize rule (remove direction parentheticals)
  rule = sanitizeReceiptNote(rule);
  
  return { rule, meta };
}

/**
 * Compute overall regime conviction index from Risk and Inflation conviction indices
 * Returns average if both exist, single value if only one exists, null otherwise
 */
export function computeRegimeConvictionIndex(
  riskIndex: number | null | undefined,
  inflIndex: number | null | undefined
): number | null {
  if (riskIndex !== null && riskIndex !== undefined && inflIndex !== null && inflIndex !== undefined) {
    return Math.round((riskIndex + inflIndex) / 2);
  }
  if (riskIndex !== null && riskIndex !== undefined) {
    return riskIndex;
  }
  if (inflIndex !== null && inflIndex !== undefined) {
    return inflIndex;
  }
  return null;
}

/**
 * Compute overall regime confidence label from Risk and Inflation confidence labels
 * Returns the LOWER of the two (High > Medium > Low), or single value if only one exists
 */
export function computeRegimeConfidenceLabel(
  riskLabel: string | null | undefined,
  inflLabel: string | null | undefined
): string | null {
  const labels = ['High', 'Medium', 'Low', 'n/a'];
  const getPriority = (label: string | null | undefined): number => {
    if (!label) return 999;
    const idx = labels.indexOf(label);
    return idx === -1 ? 999 : idx;
  };
  
  const riskPriority = getPriority(riskLabel);
  const inflPriority = getPriority(inflLabel);
  
  if (riskPriority === 999 && inflPriority === 999) {
    return null;
  }
  
  // Return the one with higher priority (lower index = higher confidence)
  if (riskPriority === 999) return inflLabel ?? null;
  if (inflPriority === 999) return riskLabel ?? null;
  
  // Return the lower confidence (higher priority number)
  return (riskPriority > inflPriority ? riskLabel : inflLabel) ?? null;
}

/**
 * Compute primary driver from Risk and Inflation scores/conviction
 * Returns which axis has the stronger signal and a short "why it won" reason
 */
export function computePrimaryDriver(
  riskScore: number | null | undefined,
  inflScore: number | null | undefined,
  riskConvictionIndex: number | null | undefined,
  inflConvictionIndex: number | null | undefined,
  riskConfidenceLabel: string | null | undefined,
  inflConfidenceLabel: string | null | undefined,
  riskAgreementPct: number | null | undefined,
  inflAgreementPct: number | null | undefined
): { label: string; whyReason: string | null; detail?: string } {
  // If we have conviction indices, use those for comparison
  if (riskConvictionIndex !== null && riskConvictionIndex !== undefined && 
      inflConvictionIndex !== null && inflConvictionIndex !== undefined) {
    const diff = Math.abs(riskConvictionIndex - inflConvictionIndex);
    
    if (diff >= 15) {
      // Clear winner
      const winner = riskConvictionIndex > inflConvictionIndex ? 'Risk' : 'Inflation';
      const other = winner === 'Risk' ? 'Inflation' : 'Risk';
      return { 
        label: winner, 
        whyReason: `${winner} stronger than ${other}`,
        detail: `${winner} conviction ${riskConvictionIndex > inflConvictionIndex ? riskConvictionIndex : inflConvictionIndex} vs ${other} ${riskConvictionIndex > inflConvictionIndex ? inflConvictionIndex : riskConvictionIndex}`
      };
    } else {
      // Tie - determine if strong/weak/mixed
      const bothStrong = riskConvictionIndex >= 60 && inflConvictionIndex >= 60;
      const bothWeak = riskConvictionIndex <= 35 && inflConvictionIndex <= 35;
      
      if (bothStrong) {
        return { label: 'Tie', whyReason: 'Tie: both axes strong' };
      } else if (bothWeak) {
        return { label: 'Tie', whyReason: 'Tie: both axes weak' };
      } else {
        // Check if signals are clean or mixed using agreement/confidence
        const riskClean = (riskAgreementPct !== null && riskAgreementPct !== undefined && riskAgreementPct >= 0.75) || riskConfidenceLabel === 'High';
        const inflClean = (inflAgreementPct !== null && inflAgreementPct !== undefined && inflAgreementPct >= 0.75) || inflConfidenceLabel === 'High';
        const riskMixed = (riskAgreementPct !== null && riskAgreementPct !== undefined && riskAgreementPct <= 0.5) || riskConfidenceLabel === 'Low';
        const inflMixed = (inflAgreementPct !== null && inflAgreementPct !== undefined && inflAgreementPct <= 0.5) || inflConfidenceLabel === 'Low';
        
        if (riskMixed && inflMixed) {
          return { label: 'Tie', whyReason: 'Tie: mixed signals' };
        } else if (riskClean && inflClean) {
          return { label: 'Tie', whyReason: 'Tie: both axes strong' };
        } else {
          return { label: 'Tie', whyReason: 'Tie: mixed signals' };
        }
      }
    }
  }
  
  // Fallback to score-based comparison
  if (riskScore === null || riskScore === undefined || inflScore === null || inflScore === undefined) {
    // Check if only one axis available
    if ((riskScore !== null && riskScore !== undefined) && (inflScore === null || inflScore === undefined)) {
      return { label: 'Risk', whyReason: 'Only Risk signals available' };
    } else if ((riskScore === null || riskScore === undefined) && (inflScore !== null && inflScore !== undefined)) {
      return { label: 'Inflation', whyReason: 'Only Inflation signals available' };
    }
    return { label: 'n/a', whyReason: null };
  }
  
  const absRisk = Math.abs(riskScore);
  const absInfl = Math.abs(inflScore);
  
  if (absRisk > absInfl) {
    return { label: 'Risk', whyReason: 'Risk moved more than Inflation' };
  } else if (absInfl > absRisk) {
    return { label: 'Inflation', whyReason: 'Inflation moved more than Risk' };
  } else {
    return { label: 'Tie', whyReason: 'Tie: both axes strong' };
  }
}

/**
 * Format Flip Watch status for display
 */
export function formatFlipWatchLabel(flipWatch: string | null | undefined): string {
  if (!flipWatch || flipWatch === 'NONE') {
    return 'off';
  }
  return flipWatch;
}

/**
 * Format signed integer for display (e.g., +2, -1, 0)
 */
export function formatSignedInt(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return '0';
}

/**
 * Compute net vote (sum) for an axis from receipts
 * Excludes zeros from label calculation but includes them in numeric sum
 */
export function computeAxisNetVote(
  receipts: SignalReceipt[] | undefined,
  axisType: 'risk' | 'inflation'
): { net: number; totalNonZero: number; totalSignals: number; directionLabel: string; label: string } {
  if (!receipts || receipts.length === 0) {
    return { net: 0, totalNonZero: 0, totalSignals: 0, directionLabel: 'Neutral', label: '0 (Neutral)' };
  }
  
  // Sum all votes (including zeros)
  const net = receipts.reduce((sum, r) => sum + r.vote, 0);
  const totalNonZero = receipts.filter(r => r.vote !== 0).length;
  const totalSignals = receipts.length;
  
  if (net === 0) {
    return { net: 0, totalNonZero, totalSignals, directionLabel: 'Neutral', label: totalSignals > 0 ? `0/${totalSignals} (Neutral)` : '0 (Neutral)' };
  }
  
  // Determine direction label based on axis type
  let direction: string;
  if (axisType === 'risk') {
    direction = net > 0 ? 'Risk On' : 'Risk Off';
  } else {
    direction = net > 0 ? 'Inflation' : 'Disinflation';
  }
  
  return { 
    net, 
    totalNonZero,
    totalSignals,
    directionLabel: direction,
    label: `${formatSignedInt(net)}/${totalSignals} (${direction})`
  };
}

/**
 * Compute crowding tag (signals piling onto one side)
 */
export function computeCrowdingTag(params: {
  convictionIndex: number | null;
  confidenceLabel: string | null;
  agreementPct: number | null;
  coveragePct: number | null;
}): boolean {
  const { convictionIndex, confidenceLabel, agreementPct, coveragePct } = params;
  
  if (convictionIndex === null || convictionIndex === undefined || convictionIndex < 76) {
    return false;
  }
  
  if (confidenceLabel !== 'High') {
    return false;
  }
  
  if (agreementPct === null || agreementPct < 80) {
    return false;
  }
  
  if (coveragePct === null || coveragePct < 0.5) {
    return false;
  }
  
  return true;
}

/**
 * Compute axis stat deltas between current and previous row
 */
export function computeAxisStatDeltas(
  currRow: GhostRegimeRow,
  prevRow: GhostRegimeRow | null | undefined,
  axis: 'risk' | 'inflation'
): string | null {
  if (!prevRow) {
    return null;
  }
  
  const axisDirection = axis === 'risk' 
    ? (currRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off')
    : (currRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation');
  
  const currReceipts = axis === 'risk' ? currRow.risk_receipts : currRow.inflation_receipts;
  const prevReceipts = axis === 'risk' ? prevRow.risk_receipts : prevRow.inflation_receipts;
  
  if (!currReceipts || currReceipts.length === 0 || !prevReceipts || prevReceipts.length === 0) {
    return null;
  }
  
  const currAgreement = computeAxisAgreement(currReceipts, axisDirection);
  const prevAgreement = computeAxisAgreement(prevReceipts, axisDirection);
  
  if (currAgreement.total === 0 || prevAgreement.total === 0) {
    return null;
  }
  
  const currStats = computeAxisStats(currReceipts, axisDirection);
  const prevStats = computeAxisStats(prevReceipts, axisDirection);
  
  const currNetVote = computeAxisNetVote(currReceipts, axis);
  const prevNetVote = computeAxisNetVote(prevReceipts, axis);
  
  const currConviction = computeConviction(currNetVote.net, currStats.totalSignals);
  const prevConviction = computeConviction(prevNetVote.net, prevStats.totalSignals);
  
  const parts: string[] = [];
  
  // Agreement delta (percentage points)
  if (currAgreement.pct !== null && prevAgreement.pct !== null) {
    const delta = currAgreement.pct - prevAgreement.pct;
    const sign = delta >= 0 ? '+' : '';
    parts.push(`Agree ${sign}${delta.toFixed(0)}pp`);
  }
  
  // Conviction delta
  if (currConviction.index !== null && prevConviction.index !== null) {
    const delta = currConviction.index - prevConviction.index;
    const sign = delta >= 0 ? '+' : '';
    parts.push(`Conv ${sign}${delta}`);
  }
  
  // Confidence delta (same/up/down)
  const confidenceOrder = ['High', 'Medium', 'Low', 'n/a'];
  const currConfIdx = confidenceOrder.indexOf(currStats.confidence.label);
  const prevConfIdx = confidenceOrder.indexOf(prevStats.confidence.label);
  if (currConfIdx !== -1 && prevConfIdx !== -1 && currConfIdx !== prevConfIdx) {
    if (currConfIdx < prevConfIdx) {
      parts.push('Conf up');
    } else {
      parts.push('Conf down');
    }
  } else if (currConfIdx === prevConfIdx && currConfIdx !== -1) {
    parts.push('Conf same');
  }
  
  // Net vote delta
  if (currNetVote.net !== prevNetVote.net) {
    const delta = currNetVote.net - prevNetVote.net;
    const sign = delta >= 0 ? '+' : '';
    parts.push(`Net ${sign}${delta}`);
  }
  
  if (parts.length === 0) {
    return null;
  }
  
  return `Δ since last: ${parts.join(' • ')}`;
}

/**
 * Compute axis stat deltas as structured tokens for pills mode
 */
export function computeAxisStatDeltaTokens(
  currRow: GhostRegimeRow,
  prevRow: GhostRegimeRow | null | undefined,
  axis: 'risk' | 'inflation'
): Array<{ label: string; delta: number | null; tone: 'pos' | 'neg' | 'flat' | 'na' }> | null {
  if (!prevRow) {
    return null;
  }
  
  const axisDirection = axis === 'risk' 
    ? (currRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off')
    : (currRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation');
  
  const currReceipts = axis === 'risk' ? currRow.risk_receipts : currRow.inflation_receipts;
  const prevReceipts = axis === 'risk' ? prevRow.risk_receipts : prevRow.inflation_receipts;
  
  if (!currReceipts || currReceipts.length === 0 || !prevReceipts || prevReceipts.length === 0) {
    return null;
  }
  
  const currAgreement = computeAxisAgreement(currReceipts, axisDirection);
  const prevAgreement = computeAxisAgreement(prevReceipts, axisDirection);
  
  if (currAgreement.total === 0 || prevAgreement.total === 0) {
    return null;
  }
  
  const currStats = computeAxisStats(currReceipts, axisDirection);
  const prevStats = computeAxisStats(prevReceipts, axisDirection);
  
  const currNetVote = computeAxisNetVote(currReceipts, axis);
  const prevNetVote = computeAxisNetVote(prevReceipts, axis);
  
  const currConviction = computeConviction(currNetVote.net, currStats.totalSignals);
  const prevConviction = computeConviction(prevNetVote.net, prevStats.totalSignals);
  
  const tokens: Array<{ label: string; delta: number | null; tone: 'pos' | 'neg' | 'flat' | 'na' }> = [];
  
  // Agreement delta (percentage points) - normalized format
  if (currAgreement.pct !== null && prevAgreement.pct !== null) {
    const delta = currAgreement.pct - prevAgreement.pct;
    tokens.push({
      label: `Agree: ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}pp`,
      delta,
      tone: getDeltaTone(delta),
    });
  }
  
  // Conviction delta - normalized format
  if (currConviction.index !== null && prevConviction.index !== null) {
    const delta = currConviction.index - prevConviction.index;
    tokens.push({
      label: `Conv: ${delta >= 0 ? '+' : ''}${delta === 0 ? '0' : delta}`,
      delta,
      tone: getDeltaTone(delta),
    });
  }
  
  // Confidence delta (same/up/down) - normalized format
  const confidenceOrder = ['High', 'Medium', 'Low', 'n/a'];
  const currConfIdx = confidenceOrder.indexOf(currStats.confidence.label);
  const prevConfIdx = confidenceOrder.indexOf(prevStats.confidence.label);
  if (currConfIdx !== -1 && prevConfIdx !== -1) {
    if (currConfIdx < prevConfIdx) {
      tokens.push({ 
        label: `Conf: ${prevStats.confidence.label}→${currStats.confidence.label}`, 
        delta: -1, 
        tone: 'pos' 
      });
    } else if (currConfIdx > prevConfIdx) {
      tokens.push({ 
        label: `Conf: ${prevStats.confidence.label}→${currStats.confidence.label}`, 
        delta: 1, 
        tone: 'neg' 
      });
    } else {
      tokens.push({ label: 'Conf: same', delta: 0, tone: 'flat' });
    }
  }
  
  // Net vote delta - normalized format with swing notation when denominators available
  const netDelta = currNetVote.net - prevNetVote.net;
  if (netDelta !== 0) {
    // Prefer swing format if both have denominators
    if (currNetVote.totalSignals > 0 && prevNetVote.totalSignals > 0) {
      tokens.push({
        label: `Net: ${prevNetVote.net}/${prevNetVote.totalSignals}→${currNetVote.net}/${currNetVote.totalSignals}`,
        delta: netDelta,
        tone: getDeltaTone(netDelta),
      });
    } else {
      // Fallback to simple delta
      tokens.push({
        label: `Net: ${prevNetVote.net}→${currNetVote.net}`,
        delta: netDelta,
        tone: getDeltaTone(netDelta),
      });
    }
  } else {
    // Unchanged - only show if we're showing other tokens
    // (Don't spam "same" tokens unless there are other changes)
    if (tokens.length > 0) {
      tokens.push({
        label: 'Net: same',
        delta: 0,
        tone: 'flat',
      });
    }
  }
  
  if (tokens.length === 0) {
    return null;
  }
  
  return tokens;
}

/**
 * Build actionable read line from current regime data
 */
export function buildActionableReadLine(params: {
  regime: string;
  risk_regime: string;
  infl_axis: string;
  regimeConfidenceLabel: string | null;
  regimeConvictionIndex: number | null;
  cashPct: number;
  cashSources: string[];
  btcScale: number;
  flipWatch: string | null | undefined;
}): string | null {
  const parts: string[] = [];
  
  // Start with regime
  const riskLabel = params.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const inflLabel = params.infl_axis;
  parts.push(`${params.regime} (${riskLabel} + ${inflLabel})`);
  
  // Add confidence + conviction
  if (params.regimeConfidenceLabel) {
    parts.push(`Confidence ${params.regimeConfidenceLabel}`);
  }
  if (params.regimeConvictionIndex !== null) {
    parts.push(`Conviction ${params.regimeConvictionIndex}`);
  }
  
  // Add BTC throttling
  if (params.btcScale < 1) {
    const scaleLabel = params.btcScale === 0.5 ? 'half size' : 'off';
    parts.push(`BTC throttled (${scaleLabel})`);
  }
  
  // Add cash from throttling
  if (params.cashPct > 0.01 && params.cashSources.length > 0) {
    parts.push(`Cash from throttling: ${params.cashSources.join(', ')}`);
  }
  
  // Add Flip Watch
  if (params.flipWatch && params.flipWatch !== 'NONE') {
    parts.push(`Flip Watch: ON`);
  }
  
  if (parts.length === 0) {
    return null;
  }
  
  return parts.join(' • ');
}

/**
 * Build copy snapshot text (date + actionable read)
 */
export function buildCopySnapshotText(
  row: GhostRegimeRow,
  actionableRead: string | null
): string | null {
  if (!actionableRead) {
    return null;
  }
  
  const date = row.date || new Date().toISOString().split('T')[0];
  return `${date} • ${actionableRead}`;
}

/**
 * Parse and validate asof query parameter
 */
export function parseAsOfParam(param: string | null): { asof: string | null; error?: string } {
  if (!param) {
    return { asof: null };
  }
  
  // Must match YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return { asof: null, error: 'Invalid as-of date — showing latest.' };
  }
  
  // Validate it's a real calendar date
  const date = new Date(param + 'T00:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const reconstructed = `${year}-${month}-${day}`;
  
  if (reconstructed !== param || isNaN(date.getTime())) {
    return { asof: null, error: 'Invalid as-of date — showing latest.' };
  }
  
  return { asof: param };
}

/**
 * Parse and validate prev query parameter
 */
export function parsePrevParam(param: string | null): { value: string | null; error?: string } {
  if (!param) {
    return { value: null };
  }
  
  // Must match YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return { value: null, error: 'Invalid prev date parameter.' };
  }
  
  // Validate it's a real calendar date
  const date = new Date(param + 'T00:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const reconstructed = `${year}-${month}-${day}`;
  
  if (reconstructed !== param || isNaN(date.getTime())) {
    return { value: null, error: 'Invalid prev date parameter.' };
  }
  
  return { value: param };
}

/**
 * Build shareable URL with asof parameter
 */
export function buildShareUrl(asof: string | null, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  if (!asof) {
    return base;
  }
  return `${base}?asof=${asof}`;
}

/**
 * Build compare URL with asof and prev parameters
 */
export function buildCompareUrl(asof: string, prev: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  return `${base}?asof=${asof}&prev=${prev}`;
}

/**
 * Build compare diff summary text (compact one-liner)
 */
export function buildCompareDiffSummaryText(
  currentRow: GhostRegimeRow,
  prevRow: GhostRegimeRow,
  currentAsOf: string,
  prevAsOf: string
): string | null {
  if (!prevRow || !currentAsOf || !prevAsOf) {
    return null;
  }

  const parts: string[] = [];
  
  // Start with compare dates
  parts.push(`Compare ${prevAsOf} → ${currentAsOf}`);
  
  // Biggest change
  const biggestChange = computeCompareBiggestChange(currentRow, prevRow);
  if (biggestChange) {
    const biggestText = biggestChange.detail
      ? `${biggestChange.headline} (${biggestChange.detail})`
      : biggestChange.headline;
    parts.push(`Biggest: ${biggestText}`);
  }
  
  // Regime
  if (currentRow.regime === prevRow.regime) {
    parts.push(`Regime: same`);
  } else {
    parts.push(`Regime: ${prevRow.regime}→${currentRow.regime}`);
  }
  
  // Risk axis tokens
  const riskTokens = computeAxisStatDeltaTokens(currentRow, prevRow, 'risk');
  if (riskTokens && riskTokens.length > 0) {
    const riskText = riskTokens.map(t => t.label).join(' ');
    parts.push(`Risk: ${riskText}`);
  }
  
  // Inflation axis tokens
  const inflTokens = computeAxisStatDeltaTokens(currentRow, prevRow, 'inflation');
  if (inflTokens && inflTokens.length > 0) {
    const inflText = inflTokens.map(t => t.label).join(' ');
    parts.push(`Infl: ${inflText}`);
  }
  
  if (parts.length <= 1) {
    return null; // Only has the compare dates, not enough data
  }
  
  return parts.join(' | ');
}

/**
 * Filter receipts by search query (case-insensitive substring match)
 */
export function filterReceiptsByQuery(
  receipts: SignalReceipt[],
  query: string
): SignalReceipt[] {
  if (!query.trim()) {
    return receipts;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return receipts.filter(receipt => {
    // Match against label
    if (receipt.label.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Match against key
    if (receipt.key.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Match against note (rule + meta)
    if (receipt.note) {
      const { rule, meta } = splitReceiptNote(receipt.note);
      if (rule && rule.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (meta && meta.toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Get driver rule and meta from receipt
 */
export function getDriverRuleMeta(receipt: SignalReceipt): { rule?: string; meta?: string } {
  if (!receipt.note) {
    return {};
  }
  
  const { rule, meta } = splitReceiptNote(receipt.note);
  return {
    rule: rule || undefined,
    meta: meta || undefined,
  };
}

/**
 * Get regime description for legend
 */
export function getRegimeDescription(regime: RegimeType): string {
  const descriptions: Record<RegimeType, string> = {
    GOLDILOCKS: 'Risk On + Disinflation. Markets are brave and prices are calm.',
    REFLATION: 'Risk On + Inflation. Markets are brave but prices are rising.',
    INFLATION: 'Risk Off + Inflation. Markets are cautious and prices are rising.',
    DEFLATION: 'Risk Off + Disinflation. Markets are cautious and prices are falling.',
  };
  return descriptions[regime] || '';
}

/**
 * Get delta tone for styling
 */
export function getDeltaTone(delta: number | null | undefined): 'pos' | 'neg' | 'flat' | 'na' {
  if (delta === null || delta === undefined) {
    return 'na';
  }
  if (delta > 0) return 'pos';
  if (delta < 0) return 'neg';
  return 'flat';
}

/**
 * Compute the "biggest change" headline for compare panel
 * Returns the most meaningful delta between current and previous snapshot
 */
export function computeCompareBiggestChange(
  currentRow: GhostRegimeRow,
  prevRow: GhostRegimeRow
): CompareBiggestChange | null {
  const tooltip = 'Heuristic: largest movement among regime/conviction/agreement/confidence/net vote. Not advice.';
  
  // 1) Regime change (highest priority)
  if (currentRow.regime !== prevRow.regime) {
    const riskLabelCurr = currentRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
    const inflLabelCurr = currentRow.infl_axis;
    const riskLabelPrev = prevRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
    const inflLabelPrev = prevRow.infl_axis;
    const detail = `${riskLabelPrev} + ${inflLabelPrev} → ${riskLabelCurr} + ${inflLabelCurr}`;
    
    return {
      headline: `Regime flip — ${prevRow.regime} → ${currentRow.regime}`,
      kind: 'regime',
      detail,
      tooltip,
    };
  }

  // 2) Crowded tag toggled
  const riskAxisDirectionCurr = currentRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const riskStatsCurr = computeAxisStats(currentRow.risk_receipts, riskAxisDirectionCurr);
  const riskNetVoteCurr = currentRow.risk_receipts && currentRow.risk_receipts.length > 0
    ? computeAxisNetVote(currentRow.risk_receipts, 'risk').net
    : currentRow.risk_score;
  const riskConvictionCurr = computeConviction(
    riskNetVoteCurr,
    riskStatsCurr.totalSignals || (currentRow.risk_receipts?.length ?? null)
  );
  const riskAgreementCurr = computeAxisAgreement(currentRow.risk_receipts, riskAxisDirectionCurr);
  const riskCrowdedCurr = computeCrowdingTag({
    convictionIndex: riskConvictionCurr.index,
    confidenceLabel: riskStatsCurr.confidence.label,
    agreementPct: riskAgreementCurr.pct,
    coveragePct: riskStatsCurr.totalSignals > 0 ? (riskStatsCurr.nonNeutral / riskStatsCurr.totalSignals) : null,
  });

  const inflAxisCurr = currentRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
  const inflStatsCurr = computeAxisStats(currentRow.inflation_receipts, inflAxisCurr);
  const inflNetVoteCurr = currentRow.inflation_receipts && currentRow.inflation_receipts.length > 0
    ? computeAxisNetVote(currentRow.inflation_receipts, 'inflation').net
    : currentRow.infl_score;
  const inflConvictionCurr = computeConviction(
    inflNetVoteCurr,
    inflStatsCurr.totalSignals || (currentRow.inflation_receipts?.length ?? null)
  );
  const inflAgreementCurr = computeAxisAgreement(currentRow.inflation_receipts, inflAxisCurr);
  const inflCrowdedCurr = computeCrowdingTag({
    convictionIndex: inflConvictionCurr.index,
    confidenceLabel: inflStatsCurr.confidence.label,
    agreementPct: inflAgreementCurr.pct,
    coveragePct: inflStatsCurr.totalSignals > 0 ? (inflStatsCurr.nonNeutral / inflStatsCurr.totalSignals) : null,
  });

  const riskAxisDirectionPrev = prevRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const riskStatsPrev = computeAxisStats(prevRow.risk_receipts, riskAxisDirectionPrev);
  const riskNetVotePrev = prevRow.risk_receipts && prevRow.risk_receipts.length > 0
    ? computeAxisNetVote(prevRow.risk_receipts, 'risk').net
    : prevRow.risk_score;
  const riskConvictionPrev = computeConviction(
    riskNetVotePrev,
    riskStatsPrev.totalSignals || (prevRow.risk_receipts?.length ?? null)
  );
  const riskAgreementPrev = computeAxisAgreement(prevRow.risk_receipts, riskAxisDirectionPrev);
  const riskCrowdedPrev = computeCrowdingTag({
    convictionIndex: riskConvictionPrev.index,
    confidenceLabel: riskStatsPrev.confidence.label,
    agreementPct: riskAgreementPrev.pct,
    coveragePct: riskStatsPrev.totalSignals > 0 ? (riskStatsPrev.nonNeutral / riskStatsPrev.totalSignals) : null,
  });

  const inflAxisPrev = prevRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
  const inflStatsPrev = computeAxisStats(prevRow.inflation_receipts, inflAxisPrev);
  const inflNetVotePrev = prevRow.inflation_receipts && prevRow.inflation_receipts.length > 0
    ? computeAxisNetVote(prevRow.inflation_receipts, 'inflation').net
    : prevRow.infl_score;
  const inflConvictionPrev = computeConviction(
    inflNetVotePrev,
    inflStatsPrev.totalSignals || (prevRow.inflation_receipts?.length ?? null)
  );
  const inflAgreementPrev = computeAxisAgreement(prevRow.inflation_receipts, inflAxisPrev);
  const inflCrowdedPrev = computeCrowdingTag({
    convictionIndex: inflConvictionPrev.index,
    confidenceLabel: inflStatsPrev.confidence.label,
    agreementPct: inflAgreementPrev.pct,
    coveragePct: inflStatsPrev.totalSignals > 0 ? (inflStatsPrev.nonNeutral / inflStatsPrev.totalSignals) : null,
  });

  // Check for crowded toggles
  if (riskCrowdedCurr !== riskCrowdedPrev) {
    return {
      headline: riskCrowdedCurr ? 'Crowded ON (Risk)' : 'Crowded cleared (Risk)',
      kind: 'crowded',
      axis: 'risk',
      tooltip,
    };
  }
  if (inflCrowdedCurr !== inflCrowdedPrev) {
    return {
      headline: inflCrowdedCurr ? 'Crowded ON (Inflation)' : 'Crowded cleared (Inflation)',
      kind: 'crowded',
      axis: 'infl',
      tooltip,
    };
  }

  // 3) Conviction delta (largest absolute, >= 10)
  const riskConvDelta = riskConvictionCurr.index !== null && riskConvictionPrev.index !== null
    ? riskConvictionCurr.index - riskConvictionPrev.index
    : null;
  const inflConvDelta = inflConvictionCurr.index !== null && inflConvictionPrev.index !== null
    ? inflConvictionCurr.index - inflConvictionPrev.index
    : null;

  // Pick the axis with largest absolute delta
  const riskConvAbs = riskConvDelta !== null ? Math.abs(riskConvDelta) : 0;
  const inflConvAbs = inflConvDelta !== null ? Math.abs(inflConvDelta) : 0;
  
  if (riskConvAbs >= 10 || inflConvAbs >= 10) {
    const useRisk = riskConvAbs >= inflConvAbs;
    const delta = useRisk ? riskConvDelta! : inflConvDelta!;
    const axisName = useRisk ? 'Risk' : 'Inflation';
    const axis = useRisk ? 'risk' as CompareAxis : 'infl' as CompareAxis;
    const convictionCurr = useRisk ? riskConvictionCurr : inflConvictionCurr;
    const statsCurr = useRisk ? riskStatsCurr : inflStatsCurr;
    const agreementCurr = useRisk ? riskAgreementCurr : inflAgreementCurr;
    const netVoteCurrObj = useRisk ? computeAxisNetVote(currentRow.risk_receipts, 'risk') : computeAxisNetVote(currentRow.inflation_receipts, 'inflation');
    const netVotePrevObj = useRisk ? computeAxisNetVote(prevRow.risk_receipts, 'risk') : computeAxisNetVote(prevRow.inflation_receipts, 'inflation');
    
    const sign = delta >= 0 ? '+' : '';
    let headline = `${axisName} conviction ${sign}${delta}`;
    // Check if new conviction is extreme and meets crowding criteria
    if (convictionCurr.index !== null && convictionCurr.index >= 76 &&
        statsCurr.confidence.label === 'High' &&
        agreementCurr.pct !== null && agreementCurr.pct >= 80 &&
        statsCurr.totalSignals > 0 && (statsCurr.nonNeutral / statsCurr.totalSignals) >= 0.5) {
      headline += ' (crowding risk ↑)';
    }
    
    // Detail: net vote from→to
    const detail = `${netVotePrevObj.net}/${netVotePrevObj.totalSignals} → ${netVoteCurrObj.net}/${netVoteCurrObj.totalSignals}`;
    
    return {
      headline,
      kind: 'conviction',
      axis,
      detail,
      tooltip,
    };
  }

  // 4) Agreement pp change (>= 15pp, pick largest absolute)
  const riskAgreeDelta = riskAgreementCurr.pct !== null && riskAgreementPrev.pct !== null
    ? riskAgreementCurr.pct - riskAgreementPrev.pct
    : null;
  const inflAgreeDelta = inflAgreementCurr.pct !== null && inflAgreementPrev.pct !== null
    ? inflAgreementCurr.pct - inflAgreementPrev.pct
    : null;

  const riskAgreeAbs = riskAgreeDelta !== null ? Math.abs(riskAgreeDelta) : 0;
  const inflAgreeAbs = inflAgreeDelta !== null ? Math.abs(inflAgreeDelta) : 0;

  if (riskAgreeAbs >= 15 || inflAgreeAbs >= 15) {
    const useRisk = riskAgreeAbs >= inflAgreeAbs;
    const delta = useRisk ? riskAgreeDelta! : inflAgreeDelta!;
    const axisName = useRisk ? 'Risk' : 'Inflation';
    const axis = useRisk ? 'risk' as CompareAxis : 'infl' as CompareAxis;
    const agreementCurr = useRisk ? riskAgreementCurr : inflAgreementCurr;
    const agreementPrev = useRisk ? riskAgreementPrev : inflAgreementPrev;
    const sign = delta >= 0 ? '+' : '';
    
    // Detail: agreement fraction from→to
    const detail = agreementPrev.total > 0 && agreementCurr.total > 0
      ? `${agreementPrev.agree}/${agreementPrev.total} → ${agreementCurr.agree}/${agreementCurr.total}`
      : undefined;
    
    return {
      headline: `${axisName} agreement ${sign}${Math.round(delta)}pp`,
      kind: 'agreement',
      axis,
      detail,
      tooltip,
    };
  }

  // 5) Net vote swing (>= 2, pick largest absolute)
  const riskNetVoteCurrObj = computeAxisNetVote(currentRow.risk_receipts, 'risk');
  const riskNetVotePrevObj = computeAxisNetVote(prevRow.risk_receipts, 'risk');
  const riskNetDelta = riskNetVoteCurrObj.net - riskNetVotePrevObj.net;

  const inflNetVoteCurrObj = computeAxisNetVote(currentRow.inflation_receipts, 'inflation');
  const inflNetVotePrevObj = computeAxisNetVote(prevRow.inflation_receipts, 'inflation');
  const inflNetDelta = inflNetVoteCurrObj.net - inflNetVotePrevObj.net;

  const riskNetAbs = Math.abs(riskNetDelta);
  const inflNetAbs = Math.abs(inflNetDelta);

  if (riskNetAbs >= 2 || inflNetAbs >= 2) {
    const useRisk = riskNetAbs >= inflNetAbs;
    const delta = useRisk ? riskNetDelta : inflNetDelta;
    const axisName = useRisk ? 'Risk' : 'Inflation';
    const axis = useRisk ? 'risk' as CompareAxis : 'infl' as CompareAxis;
    const netVoteCurrObj = useRisk ? riskNetVoteCurrObj : inflNetVoteCurrObj;
    const netVotePrevObj = useRisk ? riskNetVotePrevObj : inflNetVotePrevObj;
    const sign = delta >= 0 ? '+' : '';
    const direction = useRisk 
      ? (delta > 0 ? 'Risk On' : 'Risk Off')
      : (delta > 0 ? 'Inflation' : 'Disinflation');
    
    // Detail: net vote from→to
    const detail = `${netVotePrevObj.net}/${netVotePrevObj.totalSignals} → ${netVoteCurrObj.net}/${netVoteCurrObj.totalSignals}`;
    
    return {
      headline: `${axisName} net vote ${sign}${delta} (${direction})`,
      kind: 'netvote',
      axis,
      detail,
      tooltip,
    };
  }

  // 6) Confidence label change
  if (riskStatsCurr.confidence.label !== riskStatsPrev.confidence.label) {
    return {
      headline: `Risk confidence ${riskStatsPrev.confidence.label}→${riskStatsCurr.confidence.label}`,
      kind: 'confidence',
      axis: 'risk',
      detail: `${riskStatsPrev.confidence.label} → ${riskStatsCurr.confidence.label}`,
      tooltip,
    };
  }
  if (inflStatsCurr.confidence.label !== inflStatsPrev.confidence.label) {
    return {
      headline: `Inflation confidence ${inflStatsPrev.confidence.label}→${inflStatsCurr.confidence.label}`,
      kind: 'confidence',
      axis: 'infl',
      detail: `${inflStatsPrev.confidence.label} → ${inflStatsCurr.confidence.label}`,
      tooltip,
    };
  }

  // 7) Fallback: no material change
  return null;
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

/**
 * Compute agreement for a single row using that row's axis direction
 */
export function computeRowAgreement(
  row: GhostRegimeRow,
  axis: 'risk' | 'inflation'
): {
  agree: number;
  total: number;
  disagree: number;
  pct: number | null;
} {
  if (axis === 'risk') {
    const riskAxisDirection = row.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
    return computeAxisAgreement(row.risk_receipts, riskAxisDirection);
  } else {
    const inflAxis = row.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
    return computeAxisAgreement(row.inflation_receipts, inflAxis);
  }
}

/**
 * Compute agreement series from history rows
 * Returns oldest-first array of agreement data points (for left-to-right visualization)
 */
export function computeAgreementSeries(
  rows: GhostRegimeRow[],
  axis: 'risk' | 'inflation',
  lookback: number = 6
): Array<{
  date: string;
  pct: number;
  agree: number;
  total: number;
  label: string;
}> {
  // Filter to rows with valid receipts and non-zero totals
  const validRows = rows
    .map((row) => {
      const agreement = computeRowAgreement(row, axis);
      if (agreement.total === 0 || agreement.pct === null) {
        return null;
      }
      return {
        row,
        agreement,
      };
    })
    .filter((item): item is { row: GhostRegimeRow; agreement: ReturnType<typeof computeRowAgreement> } => item !== null);

  // Sort by date descending (newest first)
  const sorted = validRows.sort((a, b) => b.row.date.localeCompare(a.row.date));

  // Take up to lookback items (newest)
  const limited = sorted.slice(0, lookback);

  // Reverse to oldest-first for left-to-right visualization
  const oldestFirst = limited.reverse();

  // Format for display
  return oldestFirst.map(({ row, agreement }) => {
    const pct = agreement.pct!; // Safe because we filtered for non-null
    return {
      date: row.date,
      pct,
      agree: agreement.agree,
      total: agreement.total,
      label: `${row.date}: ${agreement.agree}/${agreement.total} (${pct.toFixed(0)}%)`,
    };
  });
}

