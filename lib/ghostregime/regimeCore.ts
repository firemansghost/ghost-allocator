/**
 * GhostRegime Core - Option B Voting Logic
 * Implements the 8-market vote rules for regime classification
 */

import { formatISO } from 'date-fns';
import type { MarketDataPoint, RegimeType, RiskRegime } from './types';
import {
  VOTE_THRESHOLDS,
  STRESS_OVERRIDE,
  MARKET_SYMBOLS,
} from './config';
import {
  getDataForSymbol,
  calculateTR,
  calculateRatioTR,
  getLastNObservations,
  TR_21,
  TR_63,
} from './dataWindows';

export interface VoteResult {
  risk_score: number;
  infl_score: number;
  risk_tiebreaker_used: boolean;
  infl_tiebreaker_used: boolean;
  debug_votes?: {
    risk: {
      spy: { tr_63: number; vote: number; threshold_hit?: string };
      hyg_ief: { tr_63: number; vote: number; threshold_hit?: string };
      vix: { tr_21: number; vote: number; threshold_hit?: string };
      eem_spy: { tr_63: number; vote: number; threshold_hit?: string };
      tiebreak?: { reason: string; input_value?: number; input_sign?: number };
    };
    inflation: {
      pdbc: { tr_63: number; vote: number; threshold_hit?: string; proxy_used?: string };
      tip_ief?: { tr_63: number; vote: number; threshold_hit?: string };
      tlt: { tr_63: number; vote: number; threshold_hit?: string };
      uup: { tr_63: number; vote: number; threshold_hit?: string };
      tiebreak?: { reason: string; input_value?: number; input_sign?: number };
    };
  };
}

/**
 * Compute Option B votes for risk and inflation axes
 * @param marketData Market data points
 * @param asofDate Optional date to compute as-of (filters data to this date)
 * @param includeDebug Whether to include detailed vote breakdown
 * @param proxyUsed Optional map of symbol -> proxy (e.g., PDBC -> DBC)
 */
export function computeOptionBVotes(
  marketData: MarketDataPoint[],
  asofDate?: Date,
  includeDebug: boolean = false,
  proxyUsed?: Record<string, string>
): VoteResult {
  // Risk axis votes
  const spyData = getDataForSymbol(marketData, MARKET_SYMBOLS.SPY);
  const hygData = getDataForSymbol(marketData, MARKET_SYMBOLS.HYG);
  const iefData = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF);
  const vixData = getDataForSymbol(marketData, MARKET_SYMBOLS.VIX);
  const eemData = getDataForSymbol(marketData, MARKET_SYMBOLS.EEM);

  // Filter data to asofDate if provided
  let filteredSpyData = spyData;
  let filteredHygData = hygData;
  let filteredIefData = iefData;
  let filteredVixData = vixData;
  let filteredEemData = eemData;
  
  if (asofDate) {
    filteredSpyData = spyData.filter(d => d.date <= asofDate);
    filteredHygData = hygData.filter(d => d.date <= asofDate);
    filteredIefData = iefData.filter(d => d.date <= asofDate);
    filteredVixData = vixData.filter(d => d.date <= asofDate);
    filteredEemData = eemData.filter(d => d.date <= asofDate);
  }

  // Risk axis vote 1: SPY TR_63
  let riskScore = 0;
  const debugRisk: any = includeDebug ? {} : undefined;
  let spyTR = 0;
  let spyVote = 0;
  let spyThreshold = '';
  
  if (filteredSpyData.length >= TR_63) {
    spyTR = calculateTR(filteredSpyData, TR_63, asofDate);
    if (spyTR >= VOTE_THRESHOLDS.SPY_RISK_ON) {
      riskScore += 1;
      spyVote = 1;
      spyThreshold = `>= ${VOTE_THRESHOLDS.SPY_RISK_ON} (RiskOn)`;
    } else if (spyTR <= VOTE_THRESHOLDS.SPY_RISK_OFF) {
      riskScore -= 1;
      spyVote = -1;
      spyThreshold = `<= ${VOTE_THRESHOLDS.SPY_RISK_OFF} (RiskOff)`;
    }
  }
  if (includeDebug) {
    debugRisk.spy = { tr_63: spyTR, vote: spyVote, threshold_hit: spyThreshold || 'none' };
  }

  // Risk axis vote 2: HYG/IEF ratio TR_63
  let hygIefRatio = 0;
  let hygIefVote = 0;
  let hygIefThreshold = '';
  if (filteredHygData.length >= TR_63 && filteredIefData.length >= TR_63) {
    hygIefRatio = calculateRatioTR(filteredHygData, filteredIefData, TR_63, asofDate);
    if (hygIefRatio >= VOTE_THRESHOLDS.HYG_IEF_RISK_ON) {
      riskScore += 1;
      hygIefVote = 1;
      hygIefThreshold = `>= ${VOTE_THRESHOLDS.HYG_IEF_RISK_ON} (RiskOn)`;
    } else if (hygIefRatio <= VOTE_THRESHOLDS.HYG_IEF_RISK_OFF) {
      riskScore -= 1;
      hygIefVote = -1;
      hygIefThreshold = `<= ${VOTE_THRESHOLDS.HYG_IEF_RISK_OFF} (RiskOff)`;
    }
  }
  if (includeDebug) {
    debugRisk.hyg_ief = { tr_63: hygIefRatio, vote: hygIefVote, threshold_hit: hygIefThreshold || 'none' };
  }

  // Risk axis vote 3: VIX TR_21
  let vixTR = 0;
  let vixVote = 0;
  let vixThreshold = '';
  if (filteredVixData.length >= TR_21) {
    vixTR = calculateTR(filteredVixData, TR_21, asofDate);
    if (vixTR <= VOTE_THRESHOLDS.VIX_RISK_ON) {
      riskScore += 1;
      vixVote = 1;
      vixThreshold = `<= ${VOTE_THRESHOLDS.VIX_RISK_ON} (RiskOn)`;
    } else if (vixTR >= VOTE_THRESHOLDS.VIX_RISK_OFF) {
      riskScore -= 1;
      vixVote = -1;
      vixThreshold = `>= ${VOTE_THRESHOLDS.VIX_RISK_OFF} (RiskOff)`;
    }
  }
  if (includeDebug) {
    debugRisk.vix = { tr_21: vixTR, vote: vixVote, threshold_hit: vixThreshold || 'none' };
  }

  // Risk axis vote 4: EEM/SPY ratio TR_63
  let eemSpyRatio = 0;
  let eemSpyVote = 0;
  let eemSpyThreshold = '';
  if (filteredEemData.length >= TR_63 && filteredSpyData.length >= TR_63) {
    eemSpyRatio = calculateRatioTR(filteredEemData, filteredSpyData, TR_63, asofDate);
    if (eemSpyRatio >= VOTE_THRESHOLDS.EEM_SPY_RISK_ON) {
      riskScore += 1;
      eemSpyVote = 1;
      eemSpyThreshold = `>= ${VOTE_THRESHOLDS.EEM_SPY_RISK_ON} (RiskOn)`;
    } else if (eemSpyRatio <= VOTE_THRESHOLDS.EEM_SPY_RISK_OFF) {
      riskScore -= 1;
      eemSpyVote = -1;
      eemSpyThreshold = `<= ${VOTE_THRESHOLDS.EEM_SPY_RISK_OFF} (RiskOff)`;
    }
  }
  if (includeDebug) {
    debugRisk.eem_spy = { tr_63: eemSpyRatio, vote: eemSpyVote, threshold_hit: eemSpyThreshold || 'none' };
  }

  // Tie-breaker for risk: if risk_score == 0, use sign of TR_21(SPY)
  let riskTiebreakerUsed = false;
  let riskTiebreakDetail: any = undefined;
  if (riskScore === 0 && filteredSpyData.length >= TR_21) {
    // Get window for TR_21 calculation
    const window = getLastNObservations(filteredSpyData, TR_21);
    if (window.length >= 2) {
      const first = window[0];
      const last = window[window.length - 1];
      if (first.close > 0) {
        const spyTR21 = (last.close - first.close) / first.close;
        const isRiskOn = spyTR21 >= 0;
        riskScore = isRiskOn ? 1 : -1;
        riskTiebreakerUsed = true;
        if (includeDebug) {
          riskTiebreakDetail = {
            reason: 'score_zero',
            input_value: spyTR21,
            input_value_display: spyTR21.toFixed(6),
            input_sign: isRiskOn ? 1 : -1,
            series_used: MARKET_SYMBOLS.SPY,
            window: TR_21,
            start_date: formatISO(first.date, { representation: 'date' }),
            end_date: formatISO(last.date, { representation: 'date' }),
            start_close: first.close,
            end_close: last.close,
            computed_from: 'close_to_close',
            tie_rule: 'GTE_ZERO', // Risk tie-break always uses >=0
          };
        }
      }
    }
  } else if (includeDebug) {
    riskTiebreakDetail = { reason: 'not_applicable' };
  }
  if (includeDebug && riskTiebreakDetail) {
    debugRisk.tiebreak = riskTiebreakDetail;
  }

  // Inflation axis votes
  const pdbcData = getDataForSymbol(marketData, MARKET_SYMBOLS.PDBC);
  const tipData = getDataForSymbol(marketData, MARKET_SYMBOLS.TIP);
  const iefDataInfl = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF); // Reuse IEF for TIP/IEF ratio
  const tltData = getDataForSymbol(marketData, MARKET_SYMBOLS.TLT);
  const uupData = getDataForSymbol(marketData, MARKET_SYMBOLS.UUP);

  // Filter data to asofDate if provided
  let filteredPdbcData = pdbcData;
  let filteredTipData = tipData;
  let filteredIefDataInfl = iefDataInfl;
  let filteredTltData = tltData;
  let filteredUupData = uupData;
  
  if (asofDate) {
    filteredPdbcData = pdbcData.filter(d => d.date <= asofDate);
    filteredTipData = tipData.filter(d => d.date <= asofDate);
    filteredIefDataInfl = iefDataInfl.filter(d => d.date <= asofDate);
    filteredTltData = tltData.filter(d => d.date <= asofDate);
    filteredUupData = uupData.filter(d => d.date <= asofDate);
  }

  let inflScore = 0;
  const debugInfl: any = includeDebug ? {} : undefined;
  let pdbcTR = 0;
  let pdbcVote = 0;
  let pdbcThreshold = '';
  
  // Inflation axis vote 1: PDBC TR_63
  if (filteredPdbcData.length >= TR_63) {
    pdbcTR = calculateTR(filteredPdbcData, TR_63, asofDate);
    if (pdbcTR >= VOTE_THRESHOLDS.PDBC_INFLATION) {
      inflScore += 1;
      pdbcVote = 1;
      pdbcThreshold = `>= ${VOTE_THRESHOLDS.PDBC_INFLATION} (Inflation)`;
    } else if (pdbcTR <= VOTE_THRESHOLDS.PDBC_DISINFLATION) {
      inflScore -= 1;
      pdbcVote = -1;
      pdbcThreshold = `<= ${VOTE_THRESHOLDS.PDBC_DISINFLATION} (Disinflation)`;
    }
  }
  if (includeDebug) {
    debugInfl.pdbc = {
      tr_63: pdbcTR,
      vote: pdbcVote,
      threshold_hit: pdbcThreshold || 'none',
      proxy_used: proxyUsed?.[MARKET_SYMBOLS.PDBC],
    };
  }

  // Inflation axis vote 2: TIP/IEF ratio TR_63
  let tipIefRatio = 0;
  let tipIefVote = 0;
  let tipIefThreshold = '';
  if (filteredTipData.length >= TR_63 && filteredIefDataInfl.length >= TR_63) {
    tipIefRatio = calculateRatioTR(filteredTipData, filteredIefDataInfl, TR_63, asofDate);
    if (tipIefRatio >= VOTE_THRESHOLDS.TIP_IEF_INFLATION) {
      inflScore += 1;
      tipIefVote = 1;
      tipIefThreshold = `>= ${VOTE_THRESHOLDS.TIP_IEF_INFLATION} (Inflation)`;
    } else if (tipIefRatio <= VOTE_THRESHOLDS.TIP_IEF_DISINFLATION) {
      inflScore -= 1;
      tipIefVote = -1;
      tipIefThreshold = `<= ${VOTE_THRESHOLDS.TIP_IEF_DISINFLATION} (Disinflation)`;
    }
  }
  if (includeDebug) {
    debugInfl.tip_ief = { tr_63: tipIefRatio, vote: tipIefVote, threshold_hit: tipIefThreshold || 'none' };
  }

  // Inflation axis vote 3: TLT TR_63
  // Spec: TR_63 >= +0.01 → Disinflation (+1), TR_63 <= -0.01 → Inflation (-1)
  let tltTR = 0;
  let tltVote = 0;
  let tltThreshold = '';
  if (filteredTltData.length >= TR_63) {
    tltTR = calculateTR(filteredTltData, TR_63, asofDate);
    if (tltTR >= VOTE_THRESHOLDS.TLT_DISINFLATION_THRESHOLD) {
      inflScore += 1; // Disinflation vote (+1)
      tltVote = 1;
      tltThreshold = `>= ${VOTE_THRESHOLDS.TLT_DISINFLATION_THRESHOLD} (Disinflation)`;
    } else if (tltTR <= VOTE_THRESHOLDS.TLT_INFLATION_THRESHOLD) {
      inflScore -= 1; // Inflation vote (-1)
      tltVote = -1;
      tltThreshold = `<= ${VOTE_THRESHOLDS.TLT_INFLATION_THRESHOLD} (Inflation)`;
    }
  }
  if (includeDebug) {
    debugInfl.tlt = { tr_63: tltTR, vote: tltVote, threshold_hit: tltThreshold || 'none' };
  }

  // Inflation axis vote 4: UUP TR_63
  // Spec: TR_63 >= +0.01 → Disinflation (+1), TR_63 <= -0.01 → Inflation (-1)
  let uupTR = 0;
  let uupVote = 0;
  let uupThreshold = '';
  if (filteredUupData.length >= TR_63) {
    uupTR = calculateTR(filteredUupData, TR_63, asofDate);
    if (uupTR >= VOTE_THRESHOLDS.UUP_DISINFLATION_THRESHOLD) {
      inflScore += 1; // Disinflation vote (+1)
      uupVote = 1;
      uupThreshold = `>= ${VOTE_THRESHOLDS.UUP_DISINFLATION_THRESHOLD} (Disinflation)`;
    } else if (uupTR <= VOTE_THRESHOLDS.UUP_INFLATION_THRESHOLD) {
      inflScore -= 1; // Inflation vote (-1)
      uupVote = -1;
      uupThreshold = `<= ${VOTE_THRESHOLDS.UUP_INFLATION_THRESHOLD} (Inflation)`;
    }
  }
  if (includeDebug) {
    debugInfl.uup = { tr_63: uupTR, vote: uupVote, threshold_hit: uupThreshold || 'none' };
  }

  // Note: Tie-breaker for inflation is applied AFTER satellites in engine
  // We don't apply it here, but we can prepare the detail
  let inflTiebreakDetail: any = undefined;
  if (includeDebug) {
    // We'll set this in the engine after satellites are processed
    inflTiebreakDetail = { reason: 'not_applicable' };
    debugInfl.tiebreak = inflTiebreakDetail;
  }

  return {
    risk_score: riskScore,
    infl_score: inflScore,
    risk_tiebreaker_used: riskTiebreakerUsed,
    infl_tiebreaker_used: false, // Will be set in engine after satellites
    debug_votes: includeDebug ? {
      risk: debugRisk,
      inflation: debugInfl,
    } : undefined,
  };
}

/**
 * Classify regime from risk and inflation scores
 */
export function classifyRegime(
  riskScore: number,
  inflScore: number
): RegimeType {
  const isRiskOn = riskScore > 0;
  const isInflationary = inflScore > 0;

  if (isRiskOn && !isInflationary) {
    return 'GOLDILOCKS';
  } else if (isRiskOn && isInflationary) {
    return 'REFLATION';
  } else if (!isRiskOn && isInflationary) {
    return 'INFLATION';
  } else {
    return 'DEFLATION';
  }
}

/**
 * Map regime to risk regime
 */
export function mapToRiskRegime(regime: RegimeType): RiskRegime {
  if (regime === 'GOLDILOCKS' || regime === 'REFLATION') {
    return 'RISK ON';
  } else {
    return 'RISK OFF';
  }
}

/**
 * Apply stress override
 * Trigger: VIX > 30 AND TR_63(HYG/IEF) <= -0.02 forces RiskOff
 */
export function applyStressOverride(
  vix: number,
  hygIefRatio: number,
  currentRisk: RiskRegime
): RiskRegime {
  if (
    vix > STRESS_OVERRIDE.VIX_THRESHOLD &&
    hygIefRatio <= STRESS_OVERRIDE.HYG_IEF_RATIO_THRESHOLD
  ) {
    return 'RISK OFF';
  }
  return currentRisk;
}

