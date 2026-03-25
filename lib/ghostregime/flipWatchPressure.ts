/**
 * Axis & sleeve pressure (movement vs thresholds).
 * Distinct from flipWatch.ts (regime-change confirmation). Uses current vs prior persisted row only.
 */

import type { GhostRegimeRow, RegimeType, VamsState } from './types';
import { computeAllocations } from './allocations';

/** Mirror vams.ts band edges; kept local unless shared across modules is required */
const VAMS_BAND_HIGH = 0.5;
const VAMS_BAND_LOW = -0.5;

/** |axis score| at or below this reads as "near balance" in UI copy */
const AXIS_PRESSURE_NEAR_ZERO = 1;

export type AxisPressureDirection = 'up' | 'down' | 'flat' | null;

export type SleeveKey = 'stocks' | 'gold' | 'btc';

export interface AxisPressureLine {
  distanceToZero: number;
  direction: AxisPressureDirection;
  nearBalance: boolean;
}

export interface SleevePressureDetail {
  key: SleeveKey;
  label: string;
  score: number | null;
  distanceToBoundary: number | null;
  direction: AxisPressureDirection;
  state: VamsState;
  nextStateIfFlipped: VamsState | null;
  deltaStocksActual: number | null;
  deltaGoldActual: number | null;
  deltaBtcActual: number | null;
  deltaCash: number | null;
}

export interface ClosestSleevePressure {
  key: SleeveKey;
  label: string;
  distanceToBoundary: number;
  state: VamsState;
  nextStateIfFlipped: VamsState;
  deltaStocksActual: number;
  deltaGoldActual: number;
  deltaBtcActual: number;
  deltaCash: number;
}

export interface RegimeMovementPressureSummary {
  risk: AxisPressureLine;
  inflation: AxisPressureLine;
  closestSleeve: ClosestSleevePressure | null;
  sleeves: SleevePressureDetail[];
}

function axisDirection(current: number, prev: number | null | undefined): AxisPressureDirection {
  if (prev === undefined || prev === null) return null;
  const d = current - prev;
  if (d > 0) return 'up';
  if (d < 0) return 'down';
  return 'flat';
}

/**
 * Distance in score space to the nearest VAMS threshold that would change discrete state.
 * Boundaries: +0.5 / -0.5 (see vamsScoreToState).
 */
export function distanceToNearestVamsBoundary(score: number): number {
  if (score >= VAMS_BAND_HIGH) {
    return score - VAMS_BAND_HIGH;
  }
  if (score <= VAMS_BAND_LOW) {
    return VAMS_BAND_LOW - score;
  }
  return Math.min(VAMS_BAND_HIGH - score, score - VAMS_BAND_LOW);
}

/**
 * Next discrete VAMS state if this sleeve moves across the nearest band (one step).
 */
export function nextVamsStateAfterOneStep(state: VamsState, score: number): VamsState {
  if (state === 2 || state === -2) {
    return 0;
  }
  const distUp = VAMS_BAND_HIGH - score;
  const distDown = score - VAMS_BAND_LOW;
  if (distUp < distDown) {
    return 2;
  }
  if (distDown < distUp) {
    return -2;
  }
  return 2;
}

function getSleeveScore(row: GhostRegimeRow, key: SleeveKey): number | undefined {
  if (key === 'stocks') return row.stocks_vams_score;
  if (key === 'gold') return row.gold_vams_score;
  return row.btc_vams_score;
}

function vamsStatesFromRow(row: GhostRegimeRow): { stocks: VamsState; gold: VamsState; btc: VamsState } {
  return {
    stocks: row.stocks_vams_state,
    gold: row.gold_vams_state,
    btc: row.btc_vams_state,
  };
}

function allocationDeltasForSleeveFlip(
  regime: RegimeType,
  current: { stocks: VamsState; gold: VamsState; btc: VamsState },
  sleeve: SleeveKey,
  nextState: VamsState
): { dStocks: number; dGold: number; dBtc: number; dCash: number } {
  const base = computeAllocations(regime, current);
  const flipped = computeAllocations(regime, { ...current, [sleeve]: nextState });
  return {
    dStocks: flipped.stocks_actual - base.stocks_actual,
    dGold: flipped.gold_actual - base.gold_actual,
    dBtc: flipped.btc_actual - base.btc_actual,
    dCash: flipped.cash - base.cash,
  };
}

function buildSleeveDetail(
  row: GhostRegimeRow,
  prev: GhostRegimeRow | null,
  key: SleeveKey,
  label: string
): SleevePressureDetail {
  const score = getSleeveScore(row, key);
  const prevScore = prev ? getSleeveScore(prev, key) : undefined;
  const state = row[`${key}_vams_state` as keyof GhostRegimeRow] as VamsState;

  if (score === undefined || score === null) {
    return {
      key,
      label,
      score: null,
      distanceToBoundary: null,
      direction: null,
      state,
      nextStateIfFlipped: null,
      deltaStocksActual: null,
      deltaGoldActual: null,
      deltaBtcActual: null,
      deltaCash: null,
    };
  }

  const distanceToBoundary = distanceToNearestVamsBoundary(score);
  const direction =
    prevScore === undefined || prevScore === null ? null : axisDirection(score, prevScore);

  const nextStateIfFlipped = nextVamsStateAfterOneStep(state, score);
  const deltas = allocationDeltasForSleeveFlip(row.regime, vamsStatesFromRow(row), key, nextStateIfFlipped);

  return {
    key,
    label,
    score,
    distanceToBoundary,
    direction,
    state,
    nextStateIfFlipped,
    deltaStocksActual: deltas.dStocks,
    deltaGoldActual: deltas.dGold,
    deltaBtcActual: deltas.dBtc,
    deltaCash: deltas.dCash,
  };
}

function axisLine(current: number, prev: GhostRegimeRow | null, prevField: 'risk_score' | 'infl_score'): AxisPressureLine {
  const p = prev ? prev[prevField] : null;
  const direction = p === undefined || p === null ? null : axisDirection(current, p);
  const distanceToZero = Math.abs(current);
  return {
    distanceToZero,
    direction,
    nearBalance: distanceToZero <= AXIS_PRESSURE_NEAR_ZERO,
  };
}

/**
 * Movement vs thresholds: axis distance-to-zero and direction vs prior row only;
 * sleeve distance in VAMS score space (N/A when scores not persisted on the row).
 */
export function computeRegimeMovementPressure(
  current: GhostRegimeRow,
  prev: GhostRegimeRow | null
): RegimeMovementPressureSummary {
  const risk = axisLine(current.risk_score, prev, 'risk_score');
  const inflation = axisLine(current.infl_score, prev, 'infl_score');

  const sleeves: SleevePressureDetail[] = [
    buildSleeveDetail(current, prev, 'stocks', 'Stocks'),
    buildSleeveDetail(current, prev, 'gold', 'Gold'),
    buildSleeveDetail(current, prev, 'btc', 'Bitcoin'),
  ];

  const withDistance = sleeves.filter(
    (s): s is SleevePressureDetail & { distanceToBoundary: number } =>
      s.distanceToBoundary !== null && s.distanceToBoundary !== undefined
  );

  let closestSleeve: ClosestSleevePressure | null = null;
  if (withDistance.length > 0) {
    const best = withDistance.reduce((a, b) => (a.distanceToBoundary <= b.distanceToBoundary ? a : b));
    if (best.nextStateIfFlipped !== null) {
      closestSleeve = {
        key: best.key,
        label: best.label,
        distanceToBoundary: best.distanceToBoundary,
        state: best.state,
        nextStateIfFlipped: best.nextStateIfFlipped,
        deltaStocksActual: best.deltaStocksActual!,
        deltaGoldActual: best.deltaGoldActual!,
        deltaBtcActual: best.deltaBtcActual!,
        deltaCash: best.deltaCash!,
      };
    }
  }

  return {
    risk,
    inflation,
    closestSleeve,
    sleeves,
  };
}
