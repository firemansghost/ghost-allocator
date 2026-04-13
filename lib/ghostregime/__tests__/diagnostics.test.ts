/**
 * Core symbol / history sufficiency diagnostics (stale INSUFFICIENT_HISTORY path)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import { MARKET_SYMBOLS, VAMS_MIN_OBSERVATIONS_AT_ASOF } from '../config';
import {
  checkCoreSymbolStatus,
  formatStaleHistoryHumanSummary,
  GHOSTREGIME_HISTORY_REQUIREMENTS,
} from '../diagnostics';

function dailySeries(symbol: string, numDays: number, start: Date): MarketDataPoint[] {
  return Array.from({ length: numDays }, (_, i) => ({
    symbol,
    date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
    close: 100 + i * 0.01,
    returns: i > 0 ? 0.0001 : 0,
  }));
}

describe('checkCoreSymbolStatus', () => {
  it('flags INSUFFICIENT_HISTORY when VAMS min observations not met at as-of (e.g. SPY)', () => {
    const start = new Date('2024-01-01T12:00:00Z');
    const core = [
      MARKET_SYMBOLS.SPY,
      MARKET_SYMBOLS.HYG,
      MARKET_SYMBOLS.IEF,
      MARKET_SYMBOLS.EEM,
      MARKET_SYMBOLS.PDBC,
      MARKET_SYMBOLS.TIP,
      MARKET_SYMBOLS.TLT,
      MARKET_SYMBOLS.UUP,
      MARKET_SYMBOLS.VIX,
    ];
    const longLen = 450;
    const shortLen = 330;
    let md: MarketDataPoint[] = [];
    for (const sym of core) {
      const len = sym === MARKET_SYMBOLS.SPY ? shortLen : longLen;
      md = md.concat(dailySeries(sym, len, start));
    }
    md = md.concat(dailySeries(MARKET_SYMBOLS.GLD, longLen, start));
    md = md.concat(dailySeries(MARKET_SYMBOLS.BTC_USD, longLen, start));

    const asofDate = new Date(start.getTime() + (shortLen - 1) * 24 * 60 * 60 * 1000);

    const result = checkCoreSymbolStatus(md, asofDate, undefined);
    assert.strictEqual(result.allOk, false);
    assert.ok(result.missingSymbols.includes(MARKET_SYMBOLS.SPY));
    const spy = result.status[MARKET_SYMBOLS.SPY];
    assert.ok(spy?.checks?.vams);
    assert.strictEqual(spy.checks!.vams!.met, false);
    assert.ok((spy.checks!.vams!.have_at_asof ?? 0) < VAMS_MIN_OBSERVATIONS_AT_ASOF);
  });

  it('exports static history_requirements for API responses', () => {
    assert.strictEqual(GHOSTREGIME_HISTORY_REQUIREMENTS.vams_min_observations_at_asof, 400);
    assert.ok(GHOSTREGIME_HISTORY_REQUIREMENTS.fetch_window_calendar_days >= 500);
  });
});

describe('formatStaleHistoryHumanSummary', () => {
  it('includes failing symbol lines for INSUFFICIENT_HISTORY', () => {
    const summary = formatStaleHistoryHumanSummary('INSUFFICIENT_HISTORY', {
      missingSymbols: [MARKET_SYMBOLS.SPY],
      status: {
        [MARKET_SYMBOLS.SPY]: {
          provider: 'Stooq',
          last_date: '2025-01-01',
          obs: 100,
          ok: false,
          checks: {
            vams: { required: 400, met: false, have_at_asof: 330 },
          },
        },
      },
    });
    assert.match(summary, /SPY/);
    assert.match(summary, /VAMS need 400 have 330/);
  });
});
