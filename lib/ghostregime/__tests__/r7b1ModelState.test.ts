import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import type { MarketDataPoint } from '../types';
import { MARKET_SYMBOLS, MODEL_VERSION } from '../config';
import { computeGhostRegime } from '../engine';
import {
  applyInflationPdbcTieBreak,
  compareAllocationRelevantState,
  computeResearchModelState,
  resolveResearchSatellites,
  runPostCutoverParity,
} from '../../../scripts/ghostregime/research/model-state';
import { loadResearchSnapshot } from '../../../scripts/ghostregime/research/io';
import {
  CUTOVER_DATE,
  RESEARCH_END,
} from '../../../scripts/ghostregime/research/study-contract';

const ASOF = new Date('2026-08-28T00:00:00Z');
const N = 80;
const SNAPSHOT = '.local/ghostregime-r7/r7b0-20260902-210842Z';

function series(symbol: string, closes: number[]): MarketDataPoint[] {
  return closes.map((close, i) => {
    const date = new Date(ASOF);
    date.setUTCDate(date.getUTCDate() - (closes.length - 1 - i));
    return { symbol, date, close, returns: 0 };
  });
}

function rising(start: number, step: number, n = N): number[] {
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function flat(value = 100, n = N): number[] {
  return Array(n).fill(value);
}

function market(): MarketDataPoint[] {
  const symbols: Record<string, number[]> = {
    [MARKET_SYMBOLS.SPY]: rising(100, 0.05),
    [MARKET_SYMBOLS.GLD]: rising(100, 0.02),
    [MARKET_SYMBOLS.HYG]: rising(80, 0.02),
    [MARKET_SYMBOLS.IEF]: flat(),
    [MARKET_SYMBOLS.EEM]: rising(50, 0.05),
    [MARKET_SYMBOLS.PDBC]: flat(),
    [MARKET_SYMBOLS.TIP]: flat(),
    [MARKET_SYMBOLS.TLT]: flat(90),
    [MARKET_SYMBOLS.UUP]: flat(25),
    [MARKET_SYMBOLS.VIX]: flat(18),
    [MARKET_SYMBOLS.BTC_USD]: rising(20000, 10),
  };
  const out: MarketDataPoint[] = [];
  for (const [symbol, closes] of Object.entries(symbols)) {
    out.push(...series(symbol, closes));
  }
  return out;
}

describe('R7B1 research model-state adapter', () => {
  it('matches production computeGhostRegime on a post-cutover synthetic panel', async () => {
    const md = market();
    const sats = await resolveResearchSatellites(md, ASOF);
    const research = await computeResearchModelState(md, ASOF, { satelliteData: sats });
    const production = await computeGhostRegime(ASOF, md, sats, null);
    assert.strictEqual(research.infl_sat_score, 0);
    assert.strictEqual(production.infl_sat_score, 0);
    assert.deepStrictEqual(compareAllocationRelevantState(research, production), []);
  });

  it('fails closed on missing PDBC for the inflation tie-break', () => {
    const md = market().filter((row) => row.symbol !== MARKET_SYMBOLS.PDBC);
    assert.throws(() => applyInflationPdbcTieBreak(md, ASOF, 0), /MISSING_TIEBREAK_INPUT/);
  });

  it('does not rely on a production cutover bypass', () => {
    assert.strictEqual(MODEL_VERSION, 'ghostregime-v1.0.4');
    assert.ok(ASOF.toISOString().slice(0, 10) > CUTOVER_DATE);
  });
});

describe('R7B1 frozen-panel post-cutover parity', { skip: !existsSync(SNAPSHOT) }, () => {
  it('has zero allocation-relevant mismatches on the private snapshot', async () => {
    const snapshot = loadResearchSnapshot(SNAPSHOT);
    const spyDates = snapshot.signalRows.filter((row) => row.symbol === 'SPY').map((row) => row.date_key);
    const parity = await runPostCutoverParity({
      marketData: snapshot.signalMarketData,
      spyDates,
      cutover: CUTOVER_DATE,
      end: RESEARCH_END,
    });
    assert.ok(parity.dates_tested > 0, 'expected post-cutover dates');
    assert.strictEqual(parity.nonzero_infl_sat_score_dates, 0);
    assert.strictEqual(parity.total_mismatches, 0, JSON.stringify(parity.first_mismatch));
    for (const [field, count] of Object.entries(parity.mismatch_counts)) {
      assert.strictEqual(count, 0, field);
    }
  });
});
