/**
 * R5B STABLE INVARIANTS — PDBC roles in ghostregime-v1.0.4
 *
 * P1 KEEP: PDBC TR63 core inflation vote at ±2%.
 * P2 REMOVE: Commodity Nowcast / PDBC TR21 is not score-fed.
 * P3 KEEP: PDBC TR21 GTE_ZERO inflation tie-break, with ordinary infl_tiebreak receipts.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint, SatelliteData } from '../types';
import { computeOptionBVotes } from '../regimeCore';
import { computeGhostRegime } from '../engine';
import {
  SATELLITE_CONFIGS,
  ACTIVE_SATELLITE_CONFIGS,
  COMMODITY_NOWCAST_SERIES,
  processSatellites,
  resolveSatelliteData,
  DefaultSatelliteDataProvider,
  isFallbackSemanticallyCompatible,
  type SatelliteConfig,
  type SatelliteDataProvider,
} from '../satellites';
import {
  MARKET_SYMBOLS,
  MODEL_VERSION,
  TIEBREAK_RULE,
  VOTE_THRESHOLDS,
} from '../config';

const ASOF = new Date('2026-08-28T00:00:00Z');
const N = 80;
const COMMODITY = COMMODITY_NOWCAST_SERIES;
const COMMODITY_RECEIPT_KEY = 'satellite_commodity_nowcast_basket_(energy+metals)';
const FREIGHT = 'Freight Pulse (BDI or Freightos)';
const TRUFLATION = 'Truflation YoY';

function series(symbol: string, closes: number[]): MarketDataPoint[] {
  return closes.map((close, i) => {
    const date = new Date(ASOF);
    date.setUTCDate(date.getUTCDate() - (closes.length - 1 - i));
    return { symbol, date, close };
  });
}

function rising(start: number, step: number, n = N): number[] {
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function falling(start: number, step: number, n = N): number[] {
  return Array.from({ length: n }, (_, i) => start - i * step);
}

function flat(value = 100, n = N): number[] {
  return Array(n).fill(value);
}

/** Last `tail` closes move from `start` to `end`; the rest stay at `start`. */
function tailMove(start: number, end: number, tail: number, n = N): number[] {
  const closes = Array(n).fill(start);
  for (let i = 0; i < tail; i++) {
    const t = i / (tail - 1);
    closes[n - tail + i] = start + (end - start) * t;
  }
  return closes;
}

function exactWindow(first: number, last: number, n = 63): number[] {
  const closes = Array(n).fill(first);
  closes[n - 1] = last;
  return closes;
}

function market(over: Partial<Record<string, number[]>>): MarketDataPoint[] {
  const symbols: Record<string, number[]> = {
    [MARKET_SYMBOLS.SPY]: over[MARKET_SYMBOLS.SPY] ?? rising(100, 0.05),
    [MARKET_SYMBOLS.GLD]: over[MARKET_SYMBOLS.GLD] ?? rising(100, 0.02),
    [MARKET_SYMBOLS.HYG]: over[MARKET_SYMBOLS.HYG] ?? rising(80, 0.02),
    [MARKET_SYMBOLS.IEF]: over[MARKET_SYMBOLS.IEF] ?? flat(),
    [MARKET_SYMBOLS.EEM]: over[MARKET_SYMBOLS.EEM] ?? rising(50, 0.05),
    [MARKET_SYMBOLS.PDBC]: over[MARKET_SYMBOLS.PDBC] ?? flat(),
    [MARKET_SYMBOLS.TIP]: over[MARKET_SYMBOLS.TIP] ?? flat(),
    [MARKET_SYMBOLS.TLT]: over[MARKET_SYMBOLS.TLT] ?? flat(90),
    [MARKET_SYMBOLS.UUP]: over[MARKET_SYMBOLS.UUP] ?? flat(25),
    [MARKET_SYMBOLS.VIX]: over[MARKET_SYMBOLS.VIX] ?? flat(18),
    [MARKET_SYMBOLS.BTC_USD]: over[MARKET_SYMBOLS.BTC_USD] ?? rising(20000, 10),
  };
  const out: MarketDataPoint[] = [];
  for (const [symbol, closes] of Object.entries(symbols)) {
    out.push(...series(symbol, closes));
  }
  return out;
}

function commodityPlusOne(): SatelliteData[] {
  return [
    {
      series: COMMODITY,
      value: 0.047,
      observationDate: ASOF,
      age_days: 0,
    },
  ];
}

function config(seriesName: string): SatelliteConfig {
  const found = SATELLITE_CONFIGS.find((c) => c.series === seriesName);
  assert.ok(found, `missing catalog config ${seriesName}`);
  return found;
}

function inflTiebreak(row: { inflation_receipts?: Array<{ key: string }> }) {
  return row.inflation_receipts?.find((r) => r.key === 'infl_tiebreak');
}

function commodityReceipt(row: { inflation_receipts?: Array<{ key: string }> }) {
  return row.inflation_receipts?.find((r) => r.key === COMMODITY_RECEIPT_KEY);
}

describe('R5B — model version', () => {
  it('repository default is ghostregime-v1.0.4 when env override is unset', () => {
    if (process.env.NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION) {
      return;
    }
    assert.strictEqual(MODEL_VERSION, 'ghostregime-v1.0.4');
  });
});

describe('R5B — P1 PDBC TR63 core vote unchanged', () => {
  it('PDBC TR63 >= +2% still votes +1 Inflation', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.PDBC_INFLATION);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.PDBC]: exactWindow(first, last) }),
      ASOF,
      true
    );
    const pdbc = result.debug_votes?.inflation.pdbc;
    const receipt = result.inflation_receipts?.find((r) => r.key === 'pdbc');
    assert.strictEqual(pdbc?.vote, 1);
    assert.ok(String(pdbc?.threshold_hit).includes('Inflation'));
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.strictEqual(VOTE_THRESHOLDS.PDBC_INFLATION, 0.02);
    assert.strictEqual(VOTE_THRESHOLDS.PDBC_DISINFLATION, -0.02);
  });

  it('PDBC TR63 <= -2% still votes -1 Disinflation', () => {
    const first = 100;
    const last = first * (1 + VOTE_THRESHOLDS.PDBC_DISINFLATION);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.PDBC]: exactWindow(first, last) }),
      ASOF,
      true
    );
    const pdbc = result.debug_votes?.inflation.pdbc;
    assert.strictEqual(pdbc?.vote, -1);
    assert.ok(String(pdbc?.threshold_hit).includes('Disinflation'));
  });

  it('PDBC TR63 inside ±2% still votes 0', () => {
    const first = 100;
    const last = first * (1 + 0.019);
    const result = computeOptionBVotes(
      market({ [MARKET_SYMBOLS.PDBC]: exactWindow(first, last) }),
      ASOF,
      true
    );
    assert.strictEqual(result.debug_votes?.inflation.pdbc.vote, 0);
  });
});

describe('R5B — P2 Commodity satellite removed from active scoring', () => {
  it('ACTIVE_SATELLITE_CONFIGS excludes Commodity and keeps the catalog intact', () => {
    assert.ok(SATELLITE_CONFIGS.some((c) => c.series === COMMODITY));
    assert.ok(!ACTIVE_SATELLITE_CONFIGS.some((c) => c.series === COMMODITY));
    assert.strictEqual(ACTIVE_SATELLITE_CONFIGS.length, SATELLITE_CONFIGS.length - 1);
  });

  it('a Commodity TR21 observation that would vote +1 does not score in production', () => {
    const catalogScore = processSatellites(commodityPlusOne(), SATELLITE_CONFIGS, ASOF);
    const activeScore = processSatellites(commodityPlusOne(), ACTIVE_SATELLITE_CONFIGS, ASOF);
    assert.strictEqual(catalogScore, 1, 'catalog/legacy M0 scoring still understands P2');
    assert.strictEqual(activeScore, 0);
  });

  it('ordinary compute with a +1 Commodity observation still has infl_sat_score 0 and no Commodity receipt', async () => {
    const row = await computeGhostRegime(ASOF, market({ [MARKET_SYMBOLS.PDBC]: flat() }), commodityPlusOne());
    assert.strictEqual(row.infl_sat_score, 0);
    assert.strictEqual(commodityReceipt(row), undefined);
    assert.ok(!row.inflation_receipts?.some((r) => r.key === COMMODITY_RECEIPT_KEY));
  });
});

describe('R5B — P3 inflation tie-break retained', () => {
  it('GTE_ZERO remains the default rule', () => {
    assert.strictEqual(TIEBREAK_RULE, 'GTE_ZERO');
  });

  it('positive TR21 with core-zero → +1 Inflation and ordinary infl_tiebreak receipt', async () => {
    const row = await computeGhostRegime(
      ASOF,
      market({ [MARKET_SYMBOLS.PDBC]: tailMove(100, 101.5, 21) }),
      []
    );
    assert.strictEqual(row.infl_core_score, 0);
    assert.strictEqual(row.infl_sat_score, 0);
    assert.strictEqual(row.infl_total_score_pre_tiebreak, 0);
    assert.strictEqual(row.infl_tiebreaker_used, true);
    assert.strictEqual(row.infl_score, 1);
    assert.strictEqual(row.infl_axis, 'Inflation');
    assert.strictEqual(row.debug_votes, undefined);

    const receipt = inflTiebreak(row);
    assert.ok(receipt, 'ordinary non-debug row must include infl_tiebreak');
    assert.strictEqual(receipt?.key, 'infl_tiebreak');
    assert.strictEqual(receipt?.label, 'Inflation tie-breaker (PDBC TR21)');
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.match(String(receipt?.note), /Tie-breaker applied/);
    assert.match(String(receipt?.note), /PDBC TR21/);
    assert.match(String(receipt?.note), /GTE_ZERO/);
  });

  it('negative TR21 with core-zero → -1 Disinflation and ordinary infl_tiebreak receipt', async () => {
    const row = await computeGhostRegime(
      ASOF,
      market({ [MARKET_SYMBOLS.PDBC]: tailMove(100, 98.5, 21) }),
      []
    );
    assert.strictEqual(row.infl_core_score, 0);
    assert.strictEqual(row.infl_sat_score, 0);
    assert.strictEqual(row.infl_total_score_pre_tiebreak, 0);
    assert.strictEqual(row.infl_tiebreaker_used, true);
    assert.strictEqual(row.infl_score, -1);
    assert.strictEqual(row.infl_axis, 'Disinflation');
    assert.strictEqual(row.debug_votes, undefined);

    const receipt = inflTiebreak(row);
    assert.ok(receipt);
    assert.strictEqual(receipt?.vote, -1);
    assert.strictEqual(receipt?.direction, 'Disinflation');
    assert.strictEqual(receipt?.label, 'Inflation tie-breaker (PDBC TR21)');
  });

  it('exact-zero TR21 uses GTE_ZERO → +1 Inflation', async () => {
    const row = await computeGhostRegime(ASOF, market({ [MARKET_SYMBOLS.PDBC]: flat(100) }), []);
    assert.strictEqual(row.infl_total_score_pre_tiebreak, 0);
    assert.strictEqual(row.infl_tiebreaker_used, true);
    assert.strictEqual(row.infl_score, 1);
    assert.strictEqual(row.infl_axis, 'Inflation');
    const receipt = inflTiebreak(row);
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(receipt?.direction, 'Inflation');
  });

  it('does not emit infl_tiebreak when pre-tiebreak total is nonzero', async () => {
    const row = await computeGhostRegime(
      ASOF,
      market({ [MARKET_SYMBOLS.PDBC]: rising(100, 0.2) }),
      []
    );
    assert.notStrictEqual(row.infl_total_score_pre_tiebreak, 0);
    assert.strictEqual(row.infl_tiebreaker_used, false);
    assert.strictEqual(inflTiebreak(row), undefined);
  });

  it('DBC proxy is identified on the ordinary P3 receipt', async () => {
    const runDate = Object.assign(new Date('2026-08-28T12:00:00Z'), {
      _includeDebug: false,
      _proxyUsed: { [MARKET_SYMBOLS.PDBC]: 'DBC' },
    });
    const row = await computeGhostRegime(
      ASOF,
      market({ [MARKET_SYMBOLS.PDBC]: tailMove(100, 101.5, 21) }),
      [],
      null,
      runDate
    );
    assert.strictEqual(row.infl_tiebreaker_used, true);
    assert.strictEqual(row.debug_votes, undefined);
    const receipt = inflTiebreak(row);
    assert.ok(receipt);
    assert.strictEqual(receipt?.label, 'Inflation tie-breaker (DBC TR21)');
    assert.match(String(receipt?.note), /source: DBC TR21/);
    assert.ok(!String(receipt?.note).includes('PDBC TR21'));
  });
});

describe('R5B — live-like 2026-08-28 inflation path', () => {
  it('core 0, TR21 positive, no P2 → P3 +1 Inflation with ordinary receipt', async () => {
    const row = await computeGhostRegime(
      ASOF,
      market({
        [MARKET_SYMBOLS.PDBC]: rising(100, 0.2),
        [MARKET_SYMBOLS.TIP]: falling(100, 0.05),
        [MARKET_SYMBOLS.IEF]: rising(100, 0.02),
        [MARKET_SYMBOLS.TLT]: falling(100, 0.08),
        [MARKET_SYMBOLS.UUP]: rising(100, 0.08),
      }),
      commodityPlusOne()
    );

    assert.strictEqual(row.infl_core_score, 0);
    assert.strictEqual(row.infl_sat_score, 0);
    assert.strictEqual(row.infl_total_score_pre_tiebreak, 0);
    assert.strictEqual(row.infl_tiebreaker_used, true);
    assert.strictEqual(row.infl_score, 1);
    assert.strictEqual(row.infl_axis, 'Inflation');
    assert.strictEqual(row.debug_votes, undefined);
    assert.strictEqual(commodityReceipt(row), undefined);

    const receipt = inflTiebreak(row);
    assert.ok(receipt);
    assert.strictEqual(receipt?.label, 'Inflation tie-breaker (PDBC TR21)');
    assert.strictEqual(receipt?.vote, 1);
    assert.strictEqual(receipt?.direction, 'Inflation');
    assert.match(String(receipt?.note), /PDBC TR21/);
  });
});

describe('R5B — R5A fallback containment remains intact', () => {
  const commodityOnly: SatelliteDataProvider = {
    async getLatestObservation(requested: string) {
      if (requested === COMMODITY) {
        return { value: 0.047, observationDate: ASOF, underlyingSource: 'PDBC', underlyingHorizon: 'TR_21' };
      }
      return null;
    },
  };

  it('Freight cannot consume Commodity/PDBC', async () => {
    const freight = config(FREIGHT);
    assert.strictEqual(isFallbackSemanticallyCompatible(freight, config(COMMODITY)), false);
    const row = await resolveSatelliteData(freight, commodityOnly, [], ASOF);
    assert.strictEqual(row, null);
  });

  it('Truflation cannot consume Commodity by typo repair', async () => {
    const tru = config(TRUFLATION);
    assert.strictEqual(tru.fallback, 'Commodity Nowcast Basket');
    assert.strictEqual(isFallbackSemanticallyCompatible(tru, config(COMMODITY)), false);
    const repaired: SatelliteConfig = { ...tru, fallback: COMMODITY };
    assert.strictEqual(isFallbackSemanticallyCompatible(repaired, config(COMMODITY)), false);
    const row = await resolveSatelliteData(tru, commodityOnly, [], ASOF);
    assert.strictEqual(row, null);
  });

  it('as-of Commodity diagnostic adapter remains available and does not leak into active scoring', async () => {
    const provider = new DefaultSatelliteDataProvider();
    provider.setMarketData(market({ [MARKET_SYMBOLS.PDBC]: rising(100, 0.2) }));
    const obs = await provider.getLatestObservation(COMMODITY, ASOF);
    assert.ok(obs);
    const catalogRow = await resolveSatelliteData(config(COMMODITY), provider, [], ASOF);
    assert.ok(catalogRow);
    const activeScore = processSatellites([catalogRow], ACTIVE_SATELLITE_CONFIGS, ASOF);
    assert.strictEqual(activeScore, 0);
  });
});
