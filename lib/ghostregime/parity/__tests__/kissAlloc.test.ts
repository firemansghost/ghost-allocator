/**
 * Reference Parity Tests
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * These tests lock BTC sizing forever and validate parity against reference workbook.
 * 
 * Opt-in: Only runs when RUN_PARITY_TESTS=1 and reference data exists locally.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  loadKissLatestSnapshotSync,
  loadKissBacktest,
} from '../kissLoaders';
import {
  computeKissAllocations,
  computeKissTargets,
  scaleFromState,
} from '../kissAlloc';

// Tolerance for floating point comparisons
const TOLERANCE = 1e-9;

// Check if parity tests should run
const shouldRunParityTests = (): boolean => {
  if (process.env.RUN_PARITY_TESTS !== '1') {
    return false;
  }
  
  // Check if reference data exists
  const dataDir = process.env.GHOSTREGIME_REFERENCE_DATA_DIR || '.local/reference';
  const snapshotPath = join(process.cwd(), dataDir, 'reference_latest_snapshot.json');
  return existsSync(snapshotPath);
};

describe('Reference Allocation Engine', () => {
  describe('scaleFromState', () => {
    it('should map +2 to 1.0', () => {
      assert.strictEqual(scaleFromState(2), 1.0);
    });
    
    it('should map 0 to 0.5', () => {
      assert.strictEqual(scaleFromState(0), 0.5);
    });
    
    it('should map -2 to 0.0', () => {
      assert.strictEqual(scaleFromState(-2), 0.0);
    });
  });
  
  describe('computeKissTargets', () => {
    it('should return Risk On targets for GOLDILOCKS', () => {
      const targets = computeKissTargets('GOLDILOCKS');
      assert.strictEqual(targets.stocks, 0.6);
      assert.strictEqual(targets.gold, 0.3);
      assert.strictEqual(targets.bitcoin, 0.1);
    });
    
    it('should return Risk On targets for REFLATION', () => {
      const targets = computeKissTargets('REFLATION');
      assert.strictEqual(targets.stocks, 0.6);
      assert.strictEqual(targets.gold, 0.3);
      assert.strictEqual(targets.bitcoin, 0.1);
    });
    
    it('should return Risk Off targets for INFLATION', () => {
      const targets = computeKissTargets('INFLATION');
      assert.strictEqual(targets.stocks, 0.3);
      assert.strictEqual(targets.gold, 0.3);
      assert.strictEqual(targets.bitcoin, 0.05);
    });
    
    it('should return Risk Off targets for DEFLATION', () => {
      const targets = computeKissTargets('DEFLATION');
      assert.strictEqual(targets.stocks, 0.3);
      assert.strictEqual(targets.gold, 0.3);
      assert.strictEqual(targets.bitcoin, 0.05);
    });
  });
  
  describe('computeKissAllocations', () => {
    it('should compute allocations for GOLDILOCKS with all +2 states', () => {
      const result = computeKissAllocations({
        marketRegime: 'GOLDILOCKS',
        stocksState: 2,
        goldState: 2,
        bitcoinState: 2,
      });
      
      assert.strictEqual(result.stocks_target, 0.6);
      assert.strictEqual(result.gold_target, 0.3);
      assert.strictEqual(result.bitcoin_target, 0.1);
      
      assert.strictEqual(result.stocks_scale, 1.0);
      assert.strictEqual(result.gold_scale, 1.0);
      assert.strictEqual(result.bitcoin_scale, 1.0);
      
      assert.strictEqual(result.stocks_actual, 0.6);
      assert.strictEqual(result.gold_actual, 0.3);
      assert.strictEqual(result.bitcoin_actual, 0.1);
      assert.ok(Math.abs(result.cash) < TOLERANCE, `Cash should be ~0, got ${result.cash}`);
    });
    
    it('should compute allocations for GOLDILOCKS with BTC -2 (the known mismatch case)', () => {
      // This is the critical test case: 2026-01-02
      // GOLDILOCKS, ES1=+2, XAU=+2, XBT=-2
      // Expected: BTC actual = 0.0, Cash = 0.1
      const result = computeKissAllocations({
        marketRegime: 'GOLDILOCKS',
        stocksState: 2,
        goldState: 2,
        bitcoinState: -2,
      });
      
      assert.strictEqual(result.stocks_target, 0.6);
      assert.strictEqual(result.gold_target, 0.3);
      assert.strictEqual(result.bitcoin_target, 0.1);
      
      assert.strictEqual(result.stocks_scale, 1.0);
      assert.strictEqual(result.gold_scale, 1.0);
      assert.strictEqual(result.bitcoin_scale, 0.0); // -2 → 0.0
      
      assert.strictEqual(result.stocks_actual, 0.6);
      assert.strictEqual(result.gold_actual, 0.3);
      assert.strictEqual(result.bitcoin_actual, 0.0); // CRITICAL: BTC must be 0.0
      assert.ok(Math.abs(result.cash - 0.1) < TOLERANCE, `Cash should be 0.1, got ${result.cash}`);
    });
    
    it('should compute allocations for INFLATION with all 0 states', () => {
      const result = computeKissAllocations({
        marketRegime: 'INFLATION',
        stocksState: 0,
        goldState: 0,
        bitcoinState: 0,
      });
      
      assert.strictEqual(result.stocks_target, 0.3);
      assert.strictEqual(result.gold_target, 0.3);
      assert.strictEqual(result.bitcoin_target, 0.05);
      
      assert.strictEqual(result.stocks_scale, 0.5);
      assert.strictEqual(result.gold_scale, 0.5);
      assert.strictEqual(result.bitcoin_scale, 0.5);
      
      assert.strictEqual(result.stocks_actual, 0.15);
      assert.strictEqual(result.gold_actual, 0.15);
      assert.strictEqual(result.bitcoin_actual, 0.025);
      assert.ok(Math.abs(result.cash - 0.675) < TOLERANCE, `Cash should be 0.675, got ${result.cash}`);
    });
  });
});

describe('Reference Latest Snapshot Parity', () => {
  it('should match reference snapshot (2026-01-02)', () => {
    if (!shouldRunParityTests()) {
      it.skip('Parity tests disabled. Set RUN_PARITY_TESTS=1 and ensure reference data exists locally.');
      return;
    }
    const snapshot = loadKissLatestSnapshotSync();
    
    // Validate snapshot structure
    assert.strictEqual(snapshot.date, '2026-01-02');
    assert.strictEqual(snapshot.market_regime, 'GOLDILOCKS');
    assert.strictEqual(snapshot.states.es1_state, 2);
    assert.strictEqual(snapshot.states.xau_state, 2);
    assert.strictEqual(snapshot.states.xbt_state, -2);
    
    // Compute allocations using parity engine
    const allocations = computeKissAllocations({
      marketRegime: snapshot.market_regime,
      stocksState: snapshot.states.es1_state,
      goldState: snapshot.states.xau_state,
      bitcoinState: snapshot.states.xbt_state,
    });
    
    // Assert against KISS sheet values
    assert.ok(
      Math.abs(allocations.stocks_actual - snapshot.kiss_sheet.stocks.actual) < TOLERANCE,
      `Stocks actual mismatch: expected ${snapshot.kiss_sheet.stocks.actual}, got ${allocations.stocks_actual}`
    );
    
    assert.ok(
      Math.abs(allocations.gold_actual - snapshot.kiss_sheet.gold.actual) < TOLERANCE,
      `Gold actual mismatch: expected ${snapshot.kiss_sheet.gold.actual}, got ${allocations.gold_actual}`
    );
    
    // CRITICAL: BTC must be 0.0
    assert.ok(
      Math.abs(allocations.bitcoin_actual - snapshot.kiss_sheet.bitcoin.actual) < TOLERANCE,
      `Bitcoin actual mismatch: expected ${snapshot.kiss_sheet.bitcoin.actual}, got ${allocations.bitcoin_actual}`
    );
    assert.strictEqual(allocations.bitcoin_actual, 0.0, 'Bitcoin must be exactly 0.0 when state is -2');
    
    assert.ok(
      Math.abs(allocations.cash - snapshot.kiss_sheet.cash.actual) < TOLERANCE,
      `Cash mismatch: expected ${snapshot.kiss_sheet.cash.actual}, got ${allocations.cash}`
    );
    assert.ok(Math.abs(allocations.cash - 0.1) < TOLERANCE, `Cash should be 0.1, got ${allocations.cash}`);
  });
});

describe('Reference Backtest Parity', () => {
  it('should match all backtest rows within tolerance', () => {
    if (!shouldRunParityTests()) {
      it.skip('Parity tests disabled. Set RUN_PARITY_TESTS=1 and ensure reference data exists locally.');
      return;
    }
    const backtest = loadKissBacktest();
    
    let mismatchCount = 0;
    const mismatches: string[] = [];
    
    for (const row of backtest) {
      const allocations = computeKissAllocations({
        marketRegime: row.market_regime,
        stocksState: row.spy_state,
        goldState: row.gld_state,
        bitcoinState: row.xbt_state,
      });
      
      // Compare against workbook actual exposures
      const stocksMatch = Math.abs(allocations.stocks_actual - row.ae_stocks) < TOLERANCE;
      const goldMatch = Math.abs(allocations.gold_actual - row.ae_gold) < TOLERANCE;
      const btcMatch = Math.abs(allocations.bitcoin_actual - row.ae_btc) < TOLERANCE;
      const cashMatch = Math.abs(allocations.cash - row.ae_cash) < TOLERANCE;
      
      if (!stocksMatch || !goldMatch || !btcMatch || !cashMatch) {
        mismatchCount++;
        mismatches.push(
          `${row.date}: stocks=${!stocksMatch}, gold=${!goldMatch}, btc=${!btcMatch}, cash=${!cashMatch}`
        );
        
        // Only show first 10 mismatches to avoid spam
        if (mismatchCount <= 10) {
          console.error(`Mismatch on ${row.date}:`, {
            computed: {
              stocks: allocations.stocks_actual,
              gold: allocations.gold_actual,
              bitcoin: allocations.bitcoin_actual,
              cash: allocations.cash,
            },
            expected: {
              stocks: row.ae_stocks,
              gold: row.ae_gold,
              bitcoin: row.ae_btc,
              cash: row.ae_cash,
            },
          });
        }
      }
    }
    
    assert.strictEqual(
      mismatchCount,
      0,
      `Found ${mismatchCount} mismatches in backtest. First 10: ${mismatches.slice(0, 10).join('; ')}`
    );
  });
});
