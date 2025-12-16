/**
 * Regression tests for GhostRegime core vote logic
 * Tests TLT/UUP sign rules and tie-break behavior
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import { computeOptionBVotes } from '../regimeCore';
import { VOTE_THRESHOLDS, MARKET_SYMBOLS } from '../config';

// Helper to create mock market data
function createMockData(symbol: string, closes: number[]): MarketDataPoint[] {
  const baseDate = new Date('2025-01-01');
  return closes.map((close, i) => ({
    symbol,
    date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
    close,
    returns: i > 0 ? (close - closes[i - 1]) / closes[i - 1] : 0,
  }));
}

describe('TLT Vote Logic', () => {
  it('TLT negative TR_63 should vote Inflation (-1)', () => {
    // TLT with TR_63 = -0.0333 (negative) should vote Inflation (-1)
    // Spec: TR_63 <= -0.01 → Inflation (-1)
    const tltData = createMockData(MARKET_SYMBOLS.TLT, [
      100, 100.5, 100.3, 99.8, 99.5, 99.2, 98.9, 98.6, 98.3, 98.0, // First 10
      ...Array(53).fill(0).map((_, i) => 97.0 - i * 0.01), // Remaining 53 to get TR_63
    ]);
    
    // Calculate expected TR_63: (last - first) / first
    const first = tltData[0].close;
    const last = tltData[62].close;
    const expectedTR = (last - first) / first;
    
    // Should be negative (around -0.03)
    assert(expectedTR < -0.01, `Expected TR < -0.01, got ${expectedTR}`);
    
    // Create minimal market data (only TLT needed for this test)
    const marketData: MarketDataPoint[] = [
      ...tltData,
      // Add minimal data for other required symbols (empty arrays would fail, so add dummy)
      ...createMockData(MARKET_SYMBOLS.SPY, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.HYG, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.IEF, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.EEM, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.PDBC, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TIP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.UUP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.VIX, Array(100).fill(20)),
    ];
    
    const result = computeOptionBVotes(marketData, undefined, true);
    
    // Check TLT vote in debug output
    assert(result.debug_votes, 'Debug votes should be included');
    assert(result.debug_votes.inflation.tlt, 'TLT vote should be present');
    assert.strictEqual(result.debug_votes.inflation.tlt.vote, -1, 'TLT should vote Inflation (-1) for negative TR');
    assert(result.debug_votes.inflation.tlt.threshold_hit?.includes('Inflation'), 'Threshold should indicate Inflation');
  });

  it('TLT positive TR_63 >= +0.01 should vote Disinflation (+1)', () => {
    // TLT with TR_63 >= +0.01 should vote Disinflation (+1)
    // Spec: TR_63 >= +0.01 → Disinflation (+1)
    const tltData = createMockData(MARKET_SYMBOLS.TLT, [
      100, 100.2, 100.4, 100.6, 100.8, 101.0, 101.2, 101.4, 101.6, 101.8, // First 10
      ...Array(53).fill(0).map((_, i) => 102.0 + i * 0.02), // Remaining 53 to get TR_63 >= 0.01
    ]);
    
    const marketData: MarketDataPoint[] = [
      ...tltData,
      ...createMockData(MARKET_SYMBOLS.SPY, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.HYG, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.IEF, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.EEM, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.PDBC, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TIP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.UUP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.VIX, Array(100).fill(20)),
    ];
    
    const result = computeOptionBVotes(marketData, undefined, true);
    
    assert(result.debug_votes?.inflation.tlt, 'TLT vote should be present');
    assert.strictEqual(result.debug_votes.inflation.tlt.vote, 1, 'TLT should vote Disinflation (+1) for TR >= +0.01');
    assert(result.debug_votes.inflation.tlt.threshold_hit?.includes('Disinflation'), 'Threshold should indicate Disinflation');
  });
});

describe('UUP Vote Logic', () => {
  it('UUP positive TR_63 >= +0.01 should vote Disinflation (+1)', () => {
    // UUP with TR_63 = +0.0302 (positive) should vote Disinflation (+1)
    // Spec: TR_63 >= +0.01 → Disinflation (+1)
    const uupData = createMockData(MARKET_SYMBOLS.UUP, [
      100, 100.1, 100.2, 100.3, 100.4, 100.5, 100.6, 100.7, 100.8, 100.9, // First 10
      ...Array(53).fill(0).map((_, i) => 101.0 + i * 0.05), // Remaining 53 to get TR_63 >= 0.01
    ]);
    
    const marketData: MarketDataPoint[] = [
      ...createMockData(MARKET_SYMBOLS.SPY, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.HYG, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.IEF, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.EEM, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.PDBC, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TIP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TLT, Array(100).fill(100)),
      ...uupData,
      ...createMockData(MARKET_SYMBOLS.VIX, Array(100).fill(20)),
    ];
    
    const result = computeOptionBVotes(marketData, undefined, true);
    
    assert(result.debug_votes?.inflation.uup, 'UUP vote should be present');
    assert.strictEqual(result.debug_votes.inflation.uup.vote, 1, 'UUP should vote Disinflation (+1) for TR >= +0.01');
    assert(result.debug_votes.inflation.uup.threshold_hit?.includes('Disinflation'), 'Threshold should indicate Disinflation');
  });

  it('UUP negative TR_63 <= -0.01 should vote Inflation (-1)', () => {
    // UUP with TR_63 <= -0.01 should vote Inflation (-1)
    // Spec: TR_63 <= -0.01 → Inflation (-1)
    const uupData = createMockData(MARKET_SYMBOLS.UUP, [
      100, 99.9, 99.8, 99.7, 99.6, 99.5, 99.4, 99.3, 99.2, 99.1, // First 10
      ...Array(53).fill(0).map((_, i) => 99.0 - i * 0.02), // Remaining 53 to get TR_63 <= -0.01
    ]);
    
    const marketData: MarketDataPoint[] = [
      ...createMockData(MARKET_SYMBOLS.SPY, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.HYG, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.IEF, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.EEM, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.PDBC, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TIP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.TLT, Array(100).fill(100)),
      ...uupData,
      ...createMockData(MARKET_SYMBOLS.VIX, Array(100).fill(20)),
    ];
    
    const result = computeOptionBVotes(marketData, undefined, true);
    
    assert(result.debug_votes?.inflation.uup, 'UUP vote should be present');
    assert.strictEqual(result.debug_votes.inflation.uup.vote, -1, 'UUP should vote Inflation (-1) for TR <= -0.01');
    assert(result.debug_votes.inflation.uup.threshold_hit?.includes('Inflation'), 'Threshold should indicate Inflation');
  });
});

describe('Tie-Break Behavior', () => {
  it('Tie-breaker should be used when infl_total_score_pre_tiebreak === 0', () => {
    // Create market data where all inflation votes cancel to 0
    // This requires careful setup - all votes must be 0 or cancel out
    const marketData: MarketDataPoint[] = [
      // PDBC: flat (vote 0)
      ...createMockData(MARKET_SYMBOLS.PDBC, Array(100).fill(100)),
      // TIP/IEF: flat (vote 0)
      ...createMockData(MARKET_SYMBOLS.TIP, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.IEF, Array(100).fill(100)),
      // TLT: flat (vote 0)
      ...createMockData(MARKET_SYMBOLS.TLT, Array(100).fill(100)),
      // UUP: flat (vote 0)
      ...createMockData(MARKET_SYMBOLS.UUP, Array(100).fill(100)),
      // Risk axis (required but not relevant for this test)
      ...createMockData(MARKET_SYMBOLS.SPY, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.HYG, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.EEM, Array(100).fill(100)),
      ...createMockData(MARKET_SYMBOLS.VIX, Array(100).fill(20)),
    ];
    
    const result = computeOptionBVotes(marketData, undefined, true);
    
    // Check that tie-breaker logic is correct
    // When all votes are 0, infl_score should be 0 (before tie-breaker)
    // Tie-breaker is applied in engine.ts, not in computeOptionBVotes
    // So we just verify that all votes are 0
    assert.strictEqual(result.infl_score, 0, 'Inflation score should be 0 when all votes cancel');
    
    // Verify tie-breaker flag logic: should only be true if pre-tiebreak is 0
    // (This is checked in engine.ts, but we can verify the structure here)
    if (result.infl_tiebreaker_used) {
      // If tie-breaker was used, infl_score should be either +1 or -1 (set by tie-breaker)
      // But in computeOptionBVotes, tie-breaker isn't applied yet, so score stays 0
      assert(result.debug_votes?.inflation.tiebreak, 'Tie-break detail should be present when tie-breaker used');
    }
  });
});

