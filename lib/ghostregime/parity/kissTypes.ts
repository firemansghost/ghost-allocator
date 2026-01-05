/**
 * KISS (42 Macro) Parity Types
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * This module defines types for the 42 Macro KISS reference model.
 * KISS = external reference truth source for allocation validation.
 * GhostRegime = our product/module.
 */

export type KissRegime = 'GOLDILOCKS' | 'REFLATION' | 'INFLATION' | 'DEFLATION';
export type KissRiskRegime = 'RISK ON' | 'RISK OFF';
export type KissState = -2 | 0 | 2; // +2 (Bullish), 0 (Neutral), -2 (Bearish)

/**
 * KISS latest snapshot (from JSON file)
 */
export interface KissLatestSnapshot {
  date: string; // YYYY-MM-DD
  market_regime: KissRegime;
  risk_regime: KissRiskRegime;
  states: {
    stocks_proxy: string; // "ES1"
    es1_state: KissState;
    gold_proxy: string; // "XAU"
    xau_state: KissState;
    btc_proxy: string; // "XBT"
    xbt_state: KissState;
  };
  kiss_sheet: {
    cash: {
      ticker: string;
      target: string | number;
      actual: number;
    };
    stocks: {
      ticker: string;
      target: number;
      actual: number;
    };
    gold: {
      ticker: string;
      target: number;
      actual: number;
    };
    bitcoin: {
      ticker: string;
      target: number;
      actual: number;
    };
  };
}

/**
 * KISS backtest row (from CSV file)
 */
export interface KissBacktestRow {
  date: string; // YYYY-MM-DD
  market_regime: KissRegime;
  risk_regime: KissRiskRegime;
  spy_state: KissState;
  gld_state: KissState;
  xbt_state: KissState;
  // Target allocations
  ta_stocks: number;
  ta_gold: number;
  ta_btc: number;
  // Actual exposures (from workbook)
  ae_cash: number;
  ae_stocks: number;
  ae_gold: number;
  ae_btc: number;
}

/**
 * KISS states row (from CSV file)
 */
export interface KissStatesRow {
  date: string; // YYYY-MM-DD
  market_regime: KissRegime;
  ES1_state: KissState | null; // Can be empty in early dates
  XAU_state: KissState | null;
  XBT_state: KissState | null;
}

/**
 * KISS allocation output (computed by parity engine)
 */
export interface KissAllocationOutput {
  stocks_target: number;
  gold_target: number;
  bitcoin_target: number;
  stocks_scale: number;
  gold_scale: number;
  bitcoin_scale: number;
  stocks_actual: number;
  gold_actual: number;
  bitcoin_actual: number;
  cash: number;
}
