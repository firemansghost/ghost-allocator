/**
 * T / T+1 / T+2 execution queue, inception, and rebalance schedulers.
 */

import { NUMERIC_TOLERANCE } from './study-contract';
import {
  applyIntervalReturn,
  applyNavPath,
  maxAbsWeightDelta,
  rebalanceToTarget,
} from './portfolio';
import type { DateKey, Weights } from './types';

export type RebalanceMode = 'event' | 'scheduled' | 'none';

export function firstEligibleSessionOnOrAfter(
  sessions: DateKey[],
  boundary: DateKey
): DateKey | null {
  for (const session of sessions) {
    if (session >= boundary) return session;
  }
  return null;
}

export function firstSessionOfEachYear(sessions: DateKey[]): DateKey[] {
  const out: DateKey[] = [];
  let prevYear: string | null = null;
  for (const session of sessions) {
    const year = session.slice(0, 4);
    if (year !== prevYear) {
      out.push(session);
      prevYear = year;
    }
  }
  return out;
}

export function firstSessionOfEachMonth(sessions: DateKey[]): DateKey[] {
  const out: DateKey[] = [];
  let prevMonth: string | null = null;
  for (const session of sessions) {
    const month = session.slice(0, 7);
    if (month !== prevMonth) {
      out.push(session);
      prevMonth = month;
    }
  }
  return out;
}

export function publishedTargetChanged(
  next: Weights,
  lastExecuted: Weights | null,
  tolerance = NUMERIC_TOLERANCE
): boolean {
  if (lastExecuted == null) return true;
  return maxAbsWeightDelta(next, lastExecuted) > tolerance;
}

export interface ExecutionStep {
  session: DateKey;
  inception: boolean;
  /** Pre-cost interval return: Σ held_i × asset_return_i */
  marketReturn: number;
  /** After-cost interval return: (1 + marketReturn) × (1 - costFraction) - 1 */
  netPortfolioReturn: number;
  pretrade: Weights;
  held: Weights;
  executedPublishedTarget: Weights | null;
  pendingPublishedTarget: Weights | null;
  rebalanced: boolean;
  grossTwoSided: number;
  oneWayTurnover: number;
  costFraction: number;
  navAfterMarket: number;
  nav: number;
}

export interface ExecutionState {
  held: Weights | null;
  lastExecutedPublishedTarget: Weights | null;
  pendingPublishedTarget: Weights | null;
  nav: number;
}

export function initialExecutionState(): ExecutionState {
  return {
    held: null,
    lastExecutedPublishedTarget: null,
    pendingPublishedTarget: null,
    nav: 1,
  };
}

/**
 * After session T close: store A_T as the next pending published target.
 * A_T does not earn T → T+1.
 */
export function queuePublishedTarget(state: ExecutionState, publishedTarget: Weights): void {
  state.pendingPublishedTarget = { ...publishedTarget };
}

export function stepSessionClose(args: {
  state: ExecutionState;
  session: DateKey;
  intervalReturns?: Weights;
  rebalanceMode: RebalanceMode;
  scheduled?: boolean;
  costBps: number;
  tolerance?: number;
}): ExecutionStep {
  const { state, session, intervalReturns, rebalanceMode, scheduled, costBps } = args;
  const tolerance = args.tolerance ?? NUMERIC_TOLERANCE;
  const pending = state.pendingPublishedTarget;

  if (state.held == null) {
    if (pending == null) {
      throw new Error(`INCEPTION_REQUIRES_PENDING_TARGET: ${session}`);
    }
    const established = rebalanceToTarget({}, pending, costBps, { inception: true });
    state.held = established.held;
    state.lastExecutedPublishedTarget = { ...pending };
    state.nav = 1;
    return {
      session,
      inception: true,
      marketReturn: 0,
      netPortfolioReturn: 0,
      pretrade: { ...established.held },
      held: { ...state.held },
      executedPublishedTarget: { ...state.lastExecutedPublishedTarget },
      pendingPublishedTarget: state.pendingPublishedTarget ? { ...state.pendingPublishedTarget } : null,
      rebalanced: false,
      grossTwoSided: 0,
      oneWayTurnover: 0,
      costFraction: 0,
      navAfterMarket: state.nav,
      nav: state.nav,
    };
  }

  if (!intervalReturns) {
    throw new Error(`MISSING_INTERVAL_RETURNS: ${session}`);
  }

  const { marketReturn, pretrade } = applyIntervalReturn(state.held, intervalReturns);
  const eventRebalance =
    rebalanceMode === 'event' && publishedTargetChanged(pending ?? {}, state.lastExecutedPublishedTarget, tolerance);
  const scheduledRebalance = rebalanceMode === 'scheduled' && Boolean(scheduled) && pending != null;
  const shouldRebalance = Boolean(pending) && (eventRebalance || scheduledRebalance);

  const trade = shouldRebalance
    ? rebalanceToTarget(pretrade, pending as Weights, costBps)
    : rebalanceToTarget(pretrade, pending ?? pretrade, costBps, { skip: true });

  const navBefore = state.nav;
  const { navAfterMarket, navAfterCost, netPortfolioReturn } = applyNavPath(
    navBefore,
    marketReturn,
    trade.costFraction
  );
  state.nav = navAfterCost;
  state.held = trade.held;
  if (trade.rebalanced && pending) {
    state.lastExecutedPublishedTarget = { ...pending };
  }

  return {
    session,
    inception: false,
    marketReturn,
    netPortfolioReturn,
    pretrade,
    held: { ...state.held },
    executedPublishedTarget: state.lastExecutedPublishedTarget
      ? { ...state.lastExecutedPublishedTarget }
      : null,
    pendingPublishedTarget: pending ? { ...pending } : null,
    rebalanced: trade.rebalanced,
    grossTwoSided: trade.grossTwoSided,
    oneWayTurnover: trade.oneWayTurnover,
    costFraction: trade.costFraction,
    navAfterMarket,
    nav: state.nav,
  };
}

export interface ReplaySessionInput {
  session: DateKey;
  /** Published target computed after this session's close (A_T). */
  publishedTargetAfterClose: Weights;
  /** Asset returns over the interval ending at this session (T-1 → T). Unused at inception. */
  intervalReturns?: Weights;
  scheduled?: boolean;
}

/**
 * Synthetic replay helper. Not for the real R7B0 panel in R7B1.
 */
export function replaySyntheticExecution(args: {
  sessions: ReplaySessionInput[];
  rebalanceMode: RebalanceMode;
  costBps?: number;
  tolerance?: number;
}): ExecutionStep[] {
  const state = initialExecutionState();
  const out: ExecutionStep[] = [];
  const costBps = args.costBps ?? 0;

  for (let i = 0; i < args.sessions.length; i += 1) {
    const row = args.sessions[i];
    if (i === 0) {
      queuePublishedTarget(state, row.publishedTargetAfterClose);
      continue;
    }
    const step = stepSessionClose({
      state,
      session: row.session,
      intervalReturns: row.intervalReturns,
      rebalanceMode: args.rebalanceMode,
      scheduled: row.scheduled,
      costBps,
      tolerance: args.tolerance,
    });
    out.push(step);
    queuePublishedTarget(state, row.publishedTargetAfterClose);
  }

  return out;
}
