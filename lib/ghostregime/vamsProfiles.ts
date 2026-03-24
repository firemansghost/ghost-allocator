/**
 * VAMS symbol profiles for production vs Level-2 diagnostics (VT / GLDM / FBTC).
 * Production engine behavior stays on SPY / GLD / BTC-USD via computeAllVamsStates in vams.ts.
 */

import type { MarketDataPoint, VamsState } from './types';
import { computeVamsScore, vamsScoreToState, vamsStateToScale } from './vams';

/** Production sleeve momentum (same symbols as computeAllVamsStates with default BTC). */
export const VAMS_PROFILE_PRODUCTION = {
  stocks: 'SPY',
  gold: 'GLD',
  btc: 'BTC-USD',
} as const;

/**
 * Alternate tickers closer to common deck names — diagnostic only, not a guarantee of any external engine.
 */
export const VAMS_PROFILE_CLOSER_PARITY = {
  stocks: 'VT',
  gold: 'GLDM',
  btc: 'FBTC',
} as const;

export type VamsProfile = {
  stocks: string;
  gold: string;
  btc: string;
};

export interface SleeveVamsEvaluation {
  symbol: string;
  score: number;
  state: VamsState;
  scale: number;
}

export type VamsProfileResult = {
  stocks: SleeveVamsEvaluation;
  gold: SleeveVamsEvaluation;
  btc: SleeveVamsEvaluation;
};

export function evaluateVamsProfile(
  marketData: MarketDataPoint[],
  profile: VamsProfile,
  asofDate?: Date
): VamsProfileResult {
  const sleeves = ['stocks', 'gold', 'btc'] as const;
  const result = {} as Record<(typeof sleeves)[number], SleeveVamsEvaluation>;
  for (const key of sleeves) {
    const symbol = profile[key];
    const score = computeVamsScore(marketData, symbol, asofDate);
    const state = vamsScoreToState(score);
    const scale = vamsStateToScale(state);
    result[key] = { symbol, score, state, scale };
  }
  return result as VamsProfileResult;
}

export interface SleeveDivergence {
  statesEqual: boolean;
  scoreDelta: number;
}

export type VamsProfilesComparison = {
  asofDate: string | null;
  production: VamsProfileResult;
  closerParity: VamsProfileResult;
  divergence: {
    stocks: SleeveDivergence;
    gold: SleeveDivergence;
    btc: SleeveDivergence;
  };
};

export function compareVamsProfiles(
  marketData: MarketDataPoint[],
  asofDate?: Date
): VamsProfilesComparison {
  const production = evaluateVamsProfile(marketData, VAMS_PROFILE_PRODUCTION, asofDate);
  const closerParity = evaluateVamsProfile(marketData, VAMS_PROFILE_CLOSER_PARITY, asofDate);
  const sleeves = ['stocks', 'gold', 'btc'] as const;
  const divergence = {
    stocks: {
      statesEqual: production.stocks.state === closerParity.stocks.state,
      scoreDelta: production.stocks.score - closerParity.stocks.score,
    },
    gold: {
      statesEqual: production.gold.state === closerParity.gold.state,
      scoreDelta: production.gold.score - closerParity.gold.score,
    },
    btc: {
      statesEqual: production.btc.state === closerParity.btc.state,
      scoreDelta: production.btc.score - closerParity.btc.score,
    },
  };
  const asof =
    asofDate && !Number.isNaN(asofDate.getTime())
      ? asofDate.toISOString().slice(0, 10)
      : null;
  return { asofDate: asof, production, closerParity, divergence };
}
