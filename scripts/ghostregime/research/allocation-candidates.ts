/**
 * Preregistered R7 candidate / ablation / benchmark sleeves.
 * Does not run a study. Uses production VAMS scale mapping and residual-cash math.
 */

import { computeAllocations } from '../../../lib/ghostregime/allocations';
import { ALLOCATION_TARGETS, ALLOCATION_TOLERANCE } from '../../../lib/ghostregime/config';
import { vamsStateToScale } from '../../../lib/ghostregime/vams';
import type { AllocationOutput, RegimeType, VamsState } from '../../../lib/ghostregime/types';
import {
  CANDIDATE_IDS,
  RESEARCH_ASSET_IDS,
} from './study-contract';
import type {
  AblationId,
  CandidateDefinition,
  CandidateId,
  SleeveTargets,
  Weights,
} from './types';

export const CANDIDATE_DEFINITIONS: Record<CandidateId, CandidateDefinition> = {
  P0_CURRENT: {
    id: 'P0_CURRENT',
    riskOn: { stocks: 0.6, gold: 0.3, btc: 0.1 },
    inflation: { stocks: 0.3, gold: 0.15, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
  },
  P1_LESS_BTC: {
    id: 'P1_LESS_BTC',
    riskOn: { stocks: 0.6, gold: 0.35, btc: 0.05 },
    inflation: { stocks: 0.3, gold: 0.2, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.35, btc: 0.05 },
  },
  P2_MORE_EQUITY: {
    id: 'P2_MORE_EQUITY',
    riskOn: { stocks: 0.7, gold: 0.25, btc: 0.05 },
    inflation: { stocks: 0.3, gold: 0.15, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
  },
  P3_MORE_GOLD_RO: {
    id: 'P3_MORE_GOLD_RO',
    riskOn: { stocks: 0.55, gold: 0.35, btc: 0.1 },
    inflation: { stocks: 0.3, gold: 0.15, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
  },
  P4_INFL_GOLD_30: {
    id: 'P4_INFL_GOLD_30',
    riskOn: { stocks: 0.6, gold: 0.3, btc: 0.1 },
    inflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
  },
  P5_DEEPER_OFF: {
    id: 'P5_DEEPER_OFF',
    riskOn: { stocks: 0.6, gold: 0.3, btc: 0.1 },
    inflation: { stocks: 0.2, gold: 0.15, btc: 0.05 },
    deflation: { stocks: 0.2, gold: 0.3, btc: 0.05 },
  },
  P6_HOUSE_601525: {
    id: 'P6_HOUSE_601525',
    riskOn: { stocks: 0.6, gold: 0.25, btc: 0.15 },
    inflation: { stocks: 0.3, gold: 0.15, btc: 0.05 },
    deflation: { stocks: 0.3, gold: 0.3, btc: 0.05 },
  },
};

export const STATIC_601030_WEIGHTS: Weights = {
  [RESEARCH_ASSET_IDS.SPY]: 0.6,
  [RESEARCH_ASSET_IDS.GLD]: 0.3,
  [RESEARCH_ASSET_IDS.BTC]: 0.1,
  [RESEARCH_ASSET_IDS.BIL]: 0,
};

export const STATIC_6040_WEIGHTS: Weights = {
  [RESEARCH_ASSET_IDS.SPY]: 0.6,
  [RESEARCH_ASSET_IDS.IEF]: 0.4,
};

export const SPY_100_WEIGHTS: Weights = {
  [RESEARCH_ASSET_IDS.SPY]: 1,
};

const UNIT_SCALES = { stocks: 1, gold: 1, btc: 1 };

export function assertP0MatchesProductionTargets(): void {
  const p0 = CANDIDATE_DEFINITIONS.P0_CURRENT;
  if (p0.riskOn.stocks !== ALLOCATION_TARGETS.STOCKS_RISK_ON) {
    throw new Error('P0_CURRENT risk-on stocks drifted from ALLOCATION_TARGETS');
  }
  if (p0.riskOn.gold !== ALLOCATION_TARGETS.GOLD) {
    throw new Error('P0_CURRENT risk-on gold drifted from ALLOCATION_TARGETS');
  }
  if (p0.riskOn.btc !== ALLOCATION_TARGETS.BTC_RISK_ON) {
    throw new Error('P0_CURRENT risk-on BTC drifted from ALLOCATION_TARGETS');
  }
  if (p0.inflation.stocks !== ALLOCATION_TARGETS.STOCKS_RISK_OFF) {
    throw new Error('P0_CURRENT inflation stocks drifted from ALLOCATION_TARGETS');
  }
  if (p0.inflation.gold !== ALLOCATION_TARGETS.GOLD_INFLATION) {
    throw new Error('P0_CURRENT inflation gold drifted from ALLOCATION_TARGETS');
  }
  if (p0.inflation.btc !== ALLOCATION_TARGETS.BTC_RISK_OFF) {
    throw new Error('P0_CURRENT inflation BTC drifted from ALLOCATION_TARGETS');
  }
  if (p0.deflation.stocks !== ALLOCATION_TARGETS.STOCKS_RISK_OFF) {
    throw new Error('P0_CURRENT deflation stocks drifted from ALLOCATION_TARGETS');
  }
  if (p0.deflation.gold !== ALLOCATION_TARGETS.GOLD) {
    throw new Error('P0_CURRENT deflation gold drifted from ALLOCATION_TARGETS');
  }
  if (p0.deflation.btc !== ALLOCATION_TARGETS.BTC_RISK_OFF) {
    throw new Error('P0_CURRENT deflation BTC drifted from ALLOCATION_TARGETS');
  }
}

export function sleeveTargetsForRegime(
  candidateId: CandidateId,
  regime: RegimeType
): SleeveTargets {
  const def = CANDIDATE_DEFINITIONS[candidateId];
  if (regime === 'INFLATION') return def.inflation;
  if (regime === 'DEFLATION') return def.deflation;
  return def.riskOn;
}

export function productionVamsScales(states: {
  stocks: VamsState;
  gold: VamsState;
  btc: VamsState;
}): { stocks: number; gold: number; btc: number } {
  return {
    stocks: vamsStateToScale(states.stocks),
    gold: vamsStateToScale(states.gold),
    btc: vamsStateToScale(states.btc),
  };
}

/**
 * Residual-cash sleeve math matching production computeAllocations.
 * Used for candidate / ablation variants. P0 + COMBINED delegates to production.
 */
export function applyTargetsAndScales(
  stocksTarget: number,
  goldTarget: number,
  btcTarget: number,
  scales: { stocks: number; gold: number; btc: number }
): AllocationOutput {
  let stocksActual = stocksTarget * scales.stocks;
  let goldActual = goldTarget * scales.gold;
  let btcActual = btcTarget * scales.btc;
  let cash = 1 - stocksActual - goldActual - btcActual;
  cash = Math.max(0, Math.min(1, cash));

  const total = stocksActual + goldActual + btcActual + cash;
  const diff = 1 - total;
  if (Math.abs(diff) > ALLOCATION_TOLERANCE) {
    if (Math.abs(diff) < 0.01) {
      cash += diff;
    } else {
      const scale = 1 / total;
      stocksActual *= scale;
      goldActual *= scale;
      btcActual *= scale;
      cash = 1 - stocksActual - goldActual - btcActual;
    }
  }

  cash = Math.max(0, Math.min(1, cash));
  const finalTotal = stocksActual + goldActual + btcActual + cash;
  if (Math.abs(finalTotal - 1) > ALLOCATION_TOLERANCE) {
    cash = 1 - stocksActual - goldActual - btcActual;
    cash = Math.max(0, Math.min(1, cash));
  }

  return {
    stocks_target: stocksTarget,
    gold_target: goldTarget,
    btc_target: btcTarget,
    stocks_scale: scales.stocks,
    gold_scale: scales.gold,
    btc_scale: scales.btc,
    stocks_actual: stocksActual,
    gold_actual: goldActual,
    btc_actual: btcActual,
    cash,
  };
}

export function computeCandidateAllocations(
  candidateId: CandidateId,
  regime: RegimeType,
  vamsStates: { stocks: VamsState; gold: VamsState; btc: VamsState },
  ablation: AblationId = 'COMBINED'
): AllocationOutput {
  if (ablation === 'SPY_100') {
    return applyTargetsAndScales(1, 0, 0, UNIT_SCALES);
  }
  if (ablation === 'STATIC_601030' || ablation === 'VAMS_ONLY') {
    const scales = ablation === 'VAMS_ONLY' ? productionVamsScales(vamsStates) : UNIT_SCALES;
    return applyTargetsAndScales(0.6, 0.3, 0.1, scales);
  }

  const sleeves = sleeveTargetsForRegime(candidateId, regime);
  const scales = ablation === 'REGIME_ONLY' ? UNIT_SCALES : productionVamsScales(vamsStates);

  if (candidateId === 'P0_CURRENT' && ablation === 'COMBINED') {
    return computeAllocations(regime, vamsStates);
  }

  return applyTargetsAndScales(sleeves.stocks, sleeves.gold, sleeves.btc, scales);
}

export function ghostRegimeActualsToWeights(allocation: AllocationOutput): Weights {
  return {
    [RESEARCH_ASSET_IDS.SPY]: allocation.stocks_actual,
    [RESEARCH_ASSET_IDS.GLD]: allocation.gold_actual,
    [RESEARCH_ASSET_IDS.BTC]: allocation.btc_actual,
    [RESEARCH_ASSET_IDS.BIL]: allocation.cash,
  };
}

export function assertCandidateFamilyFrozen(): void {
  assertP0MatchesProductionTargets();
  if (CANDIDATE_IDS.length !== 7) {
    throw new Error('Candidate family must remain exactly P0–P6');
  }
  if (CANDIDATE_IDS.some((id) => /BTC_ZERO|NO_BTC|ZERO_BTC/i.test(id))) {
    throw new Error('No-BTC is not a primary ranking candidate');
  }
}
