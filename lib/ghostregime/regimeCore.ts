/**
 * GhostRegime Core - Option B Voting Logic
 * Implements the 8-market vote rules for regime classification
 */

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
  TR_21,
  TR_63,
} from './dataWindows';

export interface VoteResult {
  risk_score: number;
  infl_score: number;
}

/**
 * Compute Option B votes for risk and inflation axes
 */
export function computeOptionBVotes(
  marketData: MarketDataPoint[]
): VoteResult {
  // Risk axis votes
  const spyData = getDataForSymbol(marketData, MARKET_SYMBOLS.SPY);
  const hygData = getDataForSymbol(marketData, MARKET_SYMBOLS.HYG);
  const iefData = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF);
  const vixData = getDataForSymbol(marketData, MARKET_SYMBOLS.VIX);
  const eemData = getDataForSymbol(marketData, MARKET_SYMBOLS.EEM);

  // Risk axis vote 1: SPY TR_63
  let riskScore = 0;
  if (spyData.length >= TR_63) {
    const spyTR = calculateTR(spyData, TR_63);
    if (spyTR >= VOTE_THRESHOLDS.SPY_RISK_ON) {
      riskScore += 1;
    } else if (spyTR <= VOTE_THRESHOLDS.SPY_RISK_OFF) {
      riskScore -= 1;
    }
  }

  // Risk axis vote 2: HYG/IEF ratio TR_63
  if (hygData.length >= TR_63 && iefData.length >= TR_63) {
    const hygIefRatio = calculateRatioTR(hygData, iefData, TR_63);
    if (hygIefRatio >= VOTE_THRESHOLDS.HYG_IEF_RISK_ON) {
      riskScore += 1;
    } else if (hygIefRatio <= VOTE_THRESHOLDS.HYG_IEF_RISK_OFF) {
      riskScore -= 1;
    }
  }

  // Risk axis vote 3: VIX TR_21
  if (vixData.length >= TR_21) {
    const vixTR = calculateTR(vixData, TR_21);
    if (vixTR <= VOTE_THRESHOLDS.VIX_RISK_ON) {
      riskScore += 1;
    } else if (vixTR >= VOTE_THRESHOLDS.VIX_RISK_OFF) {
      riskScore -= 1;
    }
  }

  // Risk axis vote 4: EEM/SPY ratio TR_63
  if (eemData.length >= TR_63 && spyData.length >= TR_63) {
    const eemSpyRatio = calculateRatioTR(eemData, spyData, TR_63);
    if (eemSpyRatio >= VOTE_THRESHOLDS.EEM_SPY_RISK_ON) {
      riskScore += 1;
    } else if (eemSpyRatio <= VOTE_THRESHOLDS.EEM_SPY_RISK_OFF) {
      riskScore -= 1;
    }
  }

  // Tie-breaker for risk: if risk_score == 0, use sign of TR_21(SPY)
  if (riskScore === 0 && spyData.length >= TR_21) {
    const spyTR21 = calculateTR(spyData, TR_21);
    riskScore = spyTR21 >= 0 ? 1 : -1;
  }

  // Inflation axis votes
  const pdbcData = getDataForSymbol(marketData, MARKET_SYMBOLS.PDBC);
  const tltData = getDataForSymbol(marketData, MARKET_SYMBOLS.TLT);
  const uupData = getDataForSymbol(marketData, MARKET_SYMBOLS.UUP);
  // Note: TIP data would be needed for TIP/IEF ratio, but we'll use available data
  // For now, we'll skip TIP/IEF if TIP is not available

  let inflScore = 0;

  // Inflation axis vote 1: PDBC TR_63
  if (pdbcData.length >= TR_63) {
    const pdbcTR = calculateTR(pdbcData, TR_63);
    if (pdbcTR >= VOTE_THRESHOLDS.PDBC_INFLATION) {
      inflScore += 1;
    } else if (pdbcTR <= VOTE_THRESHOLDS.PDBC_DISINFLATION) {
      inflScore -= 1;
    }
  }

  // Inflation axis vote 2: TIP/IEF ratio TR_63
  // Note: TIP may not be available in default provider, so this vote may be skipped
  // In a full implementation, TIP would be fetched separately

  // Inflation axis vote 3: TLT TR_63
  if (tltData.length >= TR_63) {
    const tltTR = calculateTR(tltData, TR_63);
    if (tltTR >= VOTE_THRESHOLDS.TLT_INFLATION) {
      inflScore += 1;
    } else if (tltTR <= VOTE_THRESHOLDS.TLT_DISINFLATION) {
      inflScore -= 1;
    }
  }

  // Inflation axis vote 4: UUP TR_63
  if (uupData.length >= TR_63) {
    const uupTR = calculateTR(uupData, TR_63);
    if (uupTR >= VOTE_THRESHOLDS.UUP_INFLATION) {
      inflScore += 1;
    } else if (uupTR <= VOTE_THRESHOLDS.UUP_DISINFLATION) {
      inflScore -= 1;
    }
  }

  // Tie-breaker for inflation: if infl_score == 0, use sign of TR_21(PDBC)
  if (inflScore === 0 && pdbcData.length >= TR_21) {
    const pdbcTR21 = calculateTR(pdbcData, TR_21);
    inflScore = pdbcTR21 >= 0 ? 1 : -1;
  }

  return { risk_score: riskScore, infl_score: inflScore };
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

