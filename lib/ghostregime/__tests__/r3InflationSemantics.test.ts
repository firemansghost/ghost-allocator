/**
 * R3 — authorized C1 inflation vote semantics
 *
 * Inflation core uses one scalar convention:
 *   +1 = inflationary
 *   -1 = disinflationary
 *
 * PDBC / TIP/IEF signs are unchanged.
 * TLT / UUP numeric signs are normalized; economic labels and thresholds are unchanged.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import { classifyRegime, computeOptionBVotes } from '../regimeCore';
import { MARKET_SYMBOLS, MODEL_VERSION, VOTE_THRESHOLDS } from '../config';

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

/** Exact TR_63 = (last − first) / first on a 63-observation window. */
function exactWindow(first: number, last: number, n = 63): number[] {
  const closes = Array(n).fill(first);
  closes[n - 1] = last;
  return closes;
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

describe('R3 C1 — PDBC / TIP unchanged', () => {
  it('PDBC rising above threshold → vote +1, Inflation, infl_score +1', () => {
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
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });

  it('TIP/IEF inflationary ratio → vote +1, Inflation, infl_score +1', () => {
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
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });
});

describe('R3 C1 — TLT numeric sign normalized', () => {
  it('rising TLT → vote -1, Disinflation, infl_score -1', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: rising(100, 0.08) }),
      undefined,
      true
    );
    const tlt = result.debug_votes?.inflation.tlt;
    const receipt = result.inflation_receipts.find((r) => r.key === 'tlt');
    assert.strictEqual(tlt?.vote, -1);
    assert.ok(String(tlt?.threshold_hit).includes('Disinflation'));
    assert.strictEqual(receipt?.direction, 'Disinflation');
    assert.strictEqual(receipt?.vote, -1);
    assert.strictEqual(result.infl_score, -1);
  });

  it('falling TLT → vote +1, Inflation, infl_score +1', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: falling(100, 0.08) }),
      undefined,
      true
    );
    const tlt = result.debug_votes?.inflation.tlt;
    const receipt = result.inflation_receipts.find((r) => r.key === 'tlt');
    assert.strictEqual(tlt?.vote, 1);
    assert.ok(String(tlt?.threshold_hit).includes('Inflation'));
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });
});

describe('R3 C1 — UUP numeric sign normalized', () => {
  it('rising UUP → vote -1, Disinflation, infl_score -1', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.UUP]: rising(100, 0.08) }),
      undefined,
      true
    );
    const uup = result.debug_votes?.inflation.uup;
    const receipt = result.inflation_receipts.find((r) => r.key === 'uup');
    assert.strictEqual(uup?.vote, -1);
    assert.ok(String(uup?.threshold_hit).includes('Disinflation'));
    assert.strictEqual(receipt?.direction, 'Disinflation');
    assert.strictEqual(receipt?.vote, -1);
    assert.strictEqual(result.infl_score, -1);
  });

  it('falling UUP → vote +1, Inflation, infl_score +1', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.UUP]: falling(100, 0.08) }),
      undefined,
      true
    );
    const uup = result.debug_votes?.inflation.uup;
    const receipt = result.inflation_receipts.find((r) => r.key === 'uup');
    assert.strictEqual(uup?.vote, 1);
    assert.ok(String(uup?.threshold_hit).includes('Inflation'));
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });
});

describe('R3 C1 — threshold boundaries (unchanged magnitudes)', () => {
  it('TLT TR_63 == +0.01 → Disinflation vote -1', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.TLT_DISINFLATION_THRESHOLD);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: exactWindow(first, last) }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.tlt.tr_63, 0.01);
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, -1);
    assert.strictEqual(result.infl_score, -1);
  });

  it('TLT TR_63 == -0.01 → Inflation vote +1', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.TLT_INFLATION_THRESHOLD);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: exactWindow(first, last) }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.tlt.tr_63, -0.01);
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });

  it('UUP TR_63 == +0.01 → Disinflation vote -1', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.UUP_DISINFLATION_THRESHOLD);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.UUP]: exactWindow(first, last) }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.uup.tr_63, 0.01);
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, -1);
    assert.strictEqual(result.infl_score, -1);
  });

  it('UUP TR_63 == -0.01 → Inflation vote +1', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.UUP_INFLATION_THRESHOLD);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.UUP]: exactWindow(first, last) }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.uup.tr_63, -0.01);
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, 1);
    assert.strictEqual(result.infl_score, 1);
  });
});

describe('R3 C1 — aggregate scalar convention', () => {
  it('TLT Disinflation −1 + UUP neutral 0 → infl_core_score −1', () => {
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.TLT]: rising(100, 0.08) }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, -1);
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, 0);
    assert.strictEqual(result.infl_score, -1);
  });

  it('TLT Inflation +1 + UUP Inflation +1 → infl_core_score +2', () => {
    const result = computeOptionBVotes(
      market({
        [MARKET_SYMBOLS.TLT]: falling(100, 0.08),
        [MARKET_SYMBOLS.UUP]: falling(100, 0.08),
      }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, 1);
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, 1);
    assert.strictEqual(result.infl_score, 2);
  });

  it('TLT −1 + UUP +1 → net 0 (tie-break unchanged)', () => {
    const result = computeOptionBVotes(
      market({
        [MARKET_SYMBOLS.TLT]: rising(100, 0.08),
        [MARKET_SYMBOLS.UUP]: falling(100, 0.08),
      }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, -1);
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, 1);
    assert.strictEqual(result.infl_score, 0);
    assert.strictEqual(result.infl_tiebreaker_used, false);
  });
});

describe('R3 C1 — live-like 2026-08-28 inflation fixture', () => {
  it('PDBC +1, TIP/IEF −1, TLT C1 +1, UUP C1 −1 → core 0; sat +1 → final +1 inflationary', () => {
    const result = computeOptionBVotes(
      market({
        [MARKET_SYMBOLS.PDBC]: rising(100, 0.2),
        [MARKET_SYMBOLS.TIP]: falling(100, 0.05),
        [MARKET_SYMBOLS.IEF]: rising(100, 0.02),
        [MARKET_SYMBOLS.TLT]: falling(100, 0.08),
        [MARKET_SYMBOLS.UUP]: rising(100, 0.08),
      }),
      undefined,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.pdbc.vote, 1);
    assert.strictEqual(result.debug_votes?.inflation.tip_ief?.vote, -1);
    assert.strictEqual(result.debug_votes?.inflation.tlt.vote, 1, 'falling TLT is C1 Inflation +1 (was C0 −1)');
    assert.strictEqual(result.debug_votes?.inflation.uup.vote, -1, 'rising UUP is C1 Disinflation −1 (was C0 +1)');
    assert.strictEqual(result.infl_score, 0, 'core remains 0 under C1, matching R0 live-day finding');
    const satellite = 1;
    const finalInfl = result.infl_score + satellite;
    assert.strictEqual(finalInfl, 1);
    assert.strictEqual(classifyRegime(-1, finalInfl), 'INFLATION');
  });
});

describe('R3 model version default', () => {
  it('repository default is ghostregime-v1.0.3 when env override is unset', () => {
    if (process.env.NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION) {
      return;
    }
    assert.strictEqual(MODEL_VERSION, 'ghostregime-v1.0.3');
  });
});
