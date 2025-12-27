/**
 * GhostRegime Education Helpers
 * Pure functions for formatting and computing GhostRegime education content
 */

import type { GhostRegimeScaleData, ScaledLineupItem } from '@/lib/houseScaling';
import type { HouseModelSpec } from '@/lib/houseModels';

/**
 * Default rebalance threshold percentage
 * Used to determine when deltas are significant enough to warrant rebalancing
 */
export const DEFAULT_REBALANCE_THRESHOLD_PCT = 3;

/**
 * Format a scale value to human-readable text
 */
export function formatScale(scale: number): string {
  if (scale === 1) return 'full size';
  if (scale === 0.5) return 'half size';
  if (scale === 0) return 'off';
  return `${(scale * 100).toFixed(0)}%`;
}

/**
 * Generate "so what?" explanation lines from scale data
 */
export function getSoWhatLines(scaleData: GhostRegimeScaleData): string[] {
  const lines: string[] = [];

  if (scaleData.stocks_scale < 1) {
    const size = scaleData.stocks_scale === 0.5 ? 'half' : `${(scaleData.stocks_scale * 100).toFixed(0)}%`;
    lines.push(
      `Stocks scale is ${scaleData.stocks_scale.toFixed(2)} → your stock sleeve is running at ${size} size right now.`
    );
  }

  if (scaleData.gold_scale < 1) {
    const size = scaleData.gold_scale === 0.5 ? 'half' : `${(scaleData.gold_scale * 100).toFixed(0)}%`;
    lines.push(
      `Gold scale is ${scaleData.gold_scale.toFixed(2)} → your gold sleeve is running at ${size} size right now.`
    );
  }

  if (scaleData.btc_scale < 1) {
    const size = scaleData.btc_scale === 0.5 ? 'half' : `${(scaleData.btc_scale * 100).toFixed(0)}%`;
    lines.push(
      `BTC scale is ${scaleData.btc_scale.toFixed(2)} → your Bitcoin sleeve is running at ${size} size right now.`
    );
  }

  return lines;
}

/**
 * History row type for change summary
 */
export interface GhostRegimeHistoryRow {
  date: string;
  regime: string;
  risk_regime: string;
  stocks_scale: number;
  gold_scale: number;
  btc_scale: number;
}

/**
 * Summarize changes between two GhostRegime history rows
 * Returns array of change strings, or null if no changes
 */
export function summarizeLastChange(
  current: GhostRegimeHistoryRow,
  previous: GhostRegimeHistoryRow
): string[] | null {
  const changes: string[] = [];

  if (current.regime !== previous.regime) {
    changes.push(`Regime: ${previous.regime} → ${current.regime}`);
  }

  if (current.risk_regime !== previous.risk_regime) {
    changes.push(`Risk: ${previous.risk_regime} → ${current.risk_regime}`);
  }

  if (Math.abs(current.stocks_scale - previous.stocks_scale) > 0.01) {
    changes.push(
      `Stocks scale: ${previous.stocks_scale.toFixed(2)} → ${current.stocks_scale.toFixed(2)}`
    );
  }

  if (Math.abs(current.gold_scale - previous.gold_scale) > 0.01) {
    changes.push(
      `Gold scale: ${previous.gold_scale.toFixed(2)} → ${current.gold_scale.toFixed(2)}`
    );
  }

  if (Math.abs(current.btc_scale - previous.btc_scale) > 0.01) {
    changes.push(
      `BTC scale: ${previous.btc_scale.toFixed(2)} → ${current.btc_scale.toFixed(2)}`
    );
  }

  return changes.length > 0 ? changes : null;
}

/**
 * Rebalance action item
 */
export interface RebalanceAction {
  ticker: string;
  label: string;
  delta: number; // Positive = overweight (trim), negative = underweight (add)
}

/**
 * Rebalance actions result
 */
export interface RebalanceActions {
  trims: RebalanceAction[]; // Overweight items to trim
  adds: RebalanceAction[]; // Underweight items to add
  hasCash: boolean; // Whether cash exists in lineup
  notes: string[]; // Optional notes
}

/**
 * Compute rebalance actions from scaled lineup
 * Filters to significant deltas (>= thresholdPct)
 */
export function computeRebalanceActions(
  scaledLineup: ScaledLineupItem[],
  thresholdPct: number = DEFAULT_REBALANCE_THRESHOLD_PCT
): RebalanceActions {
  // Calculate deltas (exclude cash)
  const deltas = scaledLineup
    .filter((item) => !item.isCash)
    .map((item) => ({
      ticker: item.ticker,
      label: item.label,
      delta: item.actualPct - item.targetPct,
    }));

  // Filter to significant deltas
  const significantDeltas = deltas.filter((d) => Math.abs(d.delta) >= thresholdPct);

  const trims = significantDeltas.filter((d) => d.delta > 0);
  const adds = significantDeltas.filter((d) => d.delta < 0);
  const hasCash = scaledLineup.some((item) => item.isCash);

  return {
    trims,
    adds,
    hasCash,
    notes: [],
  };
}

/**
 * Get target percentages from house model
 */
export function getHouseModelTargets(houseModel: HouseModelSpec): {
  stocksTarget: number;
  goldTarget: number;
  btcTarget: number;
} {
  const stocksTarget = houseModel.allocations.find((a) => a.id === 'spym')?.pct ?? 60;
  const goldTarget = houseModel.allocations.find((a) => a.id === 'gldm')?.pct ?? 30;
  const btcTarget = houseModel.allocations.find((a) => a.id === 'fbtc')?.pct ?? 10;

  return { stocksTarget, goldTarget, btcTarget };
}

