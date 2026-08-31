/**
 * R3 CHARACTERIZATION — expected to change only after explicit R3 authorization
 *
 * Documents current C0 inflation vote semantics, including the TLT/UUP
 * numeric-vs-label inconsistency. Do not "fix" these assertions to preferred
 * future semantics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import { computeOptionBVotes } from '../regimeCore';
import { MARKET_SYMBOLS } from '../config';

function createMockData(symbol: string, closes: number[]): MarketDataPoint[] {
  const baseDate = new Date('2025-01-01');
  return closes.map((close, i) => ({
    symbol,
    date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
    close,
    returns: i > 0 ? (close - closes[i - 1]) / closes[i - 1] : 0,
  }));
}

function rising(start: number, step: number, n = 80): number[] {
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function falling(start: number, step: number, n = 80): number[] {
  return Array.from({ length: n }, (_, i) => start - i * step);
}

function flat(n = 80): number[] {
  return Array(n).fill(100);
}

function market(over: Partial<Record<string, number[]>>): MarketDataPoint[] {
  const symbols: Record<string, string> = {
    [MARKET_SYMBOLS.SPY]: MARKET_SYMBOLS.SPY,
    [MARKET_SYMBOLS.HYG]: MARKET_SYMBOLS.HYG,
    [MARKET_SYMBOLS.IEF]: MARKET_SYMBOLS.IEF,
    [MARKET_SYMBOLS.EEM]: MARKET_SYMBOLS.EEM,
    [MARKET_SYMBOLS.PDBC]: MARKET_SYMBOLS.PDBC,
    [MARKET_SYMBOLS.TIP]: MARKET_SYMBOLS.TIP,
    [MARKET_SYMBOLS.TLT]: MARKET_SYMBOLS.TLT,
    [MARKET_SYMBOLS.UUP]: MARKET_SYMBOLS.UUP,
    [MARKET_SYMBOLS.VIX]: MARKET_SYMBOLS.VIX,
  };
  const out: MarketDataPoint[] = [];
  for (const symbol of Object.values(symbols)) {
    const closes = over[symbol] ?? (symbol === MARKET_SYMBOLS.VIX ? Array(80).fill(20) : flat());
    out.push(...createMockData(symbol, closes));
  }
  return out;
}

describe('R3 CHARACTERIZATION — current C0 inflation vote labels vs scalar', () => {
  it('PDBC +1 → label Inflation and adds +1 to the inflation scalar', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.PDBC]: rising(100, 0.2) }),
      undefined,
      true
    );
    const pdbc = result.debug_votes?.inflation.pdbc;
    const receipt = result.inflation_receipts.find((r) => r.key === 'pdbc');
    assert.strictEqual(pdbc?.vote, 1);
    assert.ok(String(pdbc?.threshold_hit).includes('Inflation'));
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.strictEqual(result.infl_score, 1);
  });

  it('TIP/IEF +1 → label Inflation and adds +1 to the inflation scalar', () => {
    const result = computeOptionBVotes(
      market({
        [MARKET_SYMBOLS.TIP]: rising(100, 0.05),
        [MARKET_SYMBOLS.IEF]: falling(100, 0.02),
      }),
      undefined,
      true
    );
    const tip = result.debug_votes?.inflation.tip_ief;
    const receipt = result.inflation_receipts.find((r) => r.key === 'tip_ief');
    assert.strictEqual(tip?.vote, 1);
    assert.ok(String(tip?.threshold_hit).includes('Inflation'));
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.strictEqual(result.infl_score, 1);
  });

  it('TLT +1 → label Disinflation while the numeric vote still adds +1 to the common scalar', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: rising(100, 0.08) }),
      undefined,
      true
    );
    const tlt = result.debug_votes?.inflation.tlt;
    const receipt = result.inflation_receipts.find((r) => r.key === 'tlt');
    assert.strictEqual(tlt?.vote, 1);
    assert.ok(String(tlt?.threshold_hit).includes('Disinflation'));
    assert.strictEqual(receipt?.direction, 'Disinflation');
    assert.strictEqual(result.infl_score, 1, 'current C0: TLT Disinflation vote is +1 on the scalar');
  });

  it('UUP +1 → label Disinflation while the numeric vote still adds +1 to the common scalar', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.UUP]: rising(100, 0.08) }),
      undefined,
      true
    );
    const uup = result.debug_votes?.inflation.uup;
    const receipt = result.inflation_receipts.find((r) => r.key === 'uup');
    assert.strictEqual(uup?.vote, 1);
    assert.ok(String(uup?.threshold_hit).includes('Disinflation'));
    assert.strictEqual(receipt?.direction, 'Disinflation');
    assert.strictEqual(result.infl_score, 1, 'current C0: UUP Disinflation vote is +1 on the scalar');
  });
});
