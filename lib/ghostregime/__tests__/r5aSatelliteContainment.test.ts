/**
 * R5A STABLE INVARIANTS — satellite fallback containment and provenance
 *
 * Behavior-neutral: scores, regimes, and allocations must not change on the
 * reconstructed comparison window. R5B Commodity/PDBC model is not authorized.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint } from '../types';
import {
  SATELLITE_CONFIGS,
  processSatellites,
  resolveSatelliteData,
  DefaultSatelliteDataProvider,
  isFallbackSemanticallyCompatible,
  satelliteReceiptPresentation,
  COMMODITY_NOWCAST_SERIES,
  COMMODITY_PDBC_RECEIPT_LABEL,
  type SatelliteConfig,
  type SatelliteDataProvider,
} from '../satellites';
import { calculateTR, TR_21 } from '../dataWindows';
import { MARKET_SYMBOLS } from '../config';

const TODAY = new Date('2026-08-28T00:00:00Z');

const COMMODITY = COMMODITY_NOWCAST_SERIES;
const FREIGHT = 'Freight Pulse (BDI or Freightos)';
const TRUFLATION = 'Truflation YoY';
const CLEVELAND = 'Cleveland Fed Inflation Nowcast YoY';
const ISM_MFG = 'ISM Manufacturing Prices Paid';
const ISM_SVC = 'ISM Services Prices Paid';
const NFIB = 'NFIB Price Plans';

const STUB_SERIES = [CLEVELAND, TRUFLATION, ISM_MFG, ISM_SVC, NFIB, FREIGHT];

function config(series: string): SatelliteConfig {
  const found = SATELLITE_CONFIGS.find((c) => c.series === series);
  assert.ok(found, `missing config ${series}`);
  return found;
}

function utcDay(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function pdbcPoints(closes: number[], start: Date): MarketDataPoint[] {
  return closes.map((close, i) => {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    return { symbol: MARKET_SYMBOLS.PDBC, date, close };
  });
}

const commodityOnly: SatelliteDataProvider = {
  async getLatestObservation(series: string) {
    if (series === COMMODITY) {
      return {
        value: 0.047,
        observationDate: TODAY,
        underlyingSource: 'PDBC',
        underlyingHorizon: 'TR_21',
      };
    }
    return null;
  },
};

describe('R5A — Commodity primary still resolves from PDBC', () => {
  it('DefaultSatelliteDataProvider derives Commodity from PDBC TR21', async () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 0.2);
    const points = pdbcPoints(closes, utcDay(2026, 6, 1));
    const asof = points[points.length - 1].date;
    const provider = new DefaultSatelliteDataProvider();
    provider.setMarketData(points);

    const row = await resolveSatelliteData(config(COMMODITY), provider, points, asof);
    assert.ok(row);
    assert.strictEqual(row.series, COMMODITY);
    assert.strictEqual(row.fallbackUsed, false);
    assert.strictEqual(row.underlyingSource, 'PDBC');
    assert.strictEqual(row.underlyingHorizon, 'TR_21');
    assert.strictEqual(row.value, calculateTR(points, TR_21, asof));
  });

  it('Commodity score at current ±2% thresholds is unchanged', () => {
    const scoreAtThreshold = processSatellites(
      [{ series: COMMODITY, value: 0.02, observationDate: TODAY, age_days: 0 }],
      SATELLITE_CONFIGS,
      TODAY
    );
    const scoreLiveLike = processSatellites(
      [{ series: COMMODITY, value: 0.047, observationDate: TODAY, age_days: 0 }],
      SATELLITE_CONFIGS,
      TODAY
    );
    assert.strictEqual(scoreAtThreshold, 1);
    assert.strictEqual(scoreLiveLike, 1);
  });
});

describe('R5A — semantic fallback containment', () => {
  it('Freight → Commodity is rejected', async () => {
    assert.strictEqual(
      isFallbackSemanticallyCompatible(config(FREIGHT), config(COMMODITY)),
      false
    );
    const row = await resolveSatelliteData(config(FREIGHT), commodityOnly, [], TODAY);
    assert.strictEqual(row, null);
  });

  it('Truflation cannot consume Commodity as a semantic fallback', async () => {
    assert.strictEqual(
      isFallbackSemanticallyCompatible(config(TRUFLATION), config(COMMODITY)),
      false
    );
    const mismatchedName = await resolveSatelliteData(config(TRUFLATION), commodityOnly, [], TODAY);
    assert.strictEqual(mismatchedName, null);

    const repairedName: SatelliteConfig = { ...config(TRUFLATION), fallback: COMMODITY };
    const evenIfNameMatched = await resolveSatelliteData(repairedName, commodityOnly, [], TODAY);
    assert.strictEqual(evenIfNameMatched, null);
  });

  it('mismatched level thresholds are rejected (ISM Services → NFIB, NFIB → ISM Mfg)', async () => {
    assert.strictEqual(isFallbackSemanticallyCompatible(config(ISM_SVC), config(NFIB)), false);
    assert.strictEqual(isFallbackSemanticallyCompatible(config(NFIB), config(ISM_MFG)), false);

    const nfibOnly: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === NFIB) {
          return { value: 35, observationDate: TODAY };
        }
        return null;
      },
    };
    const ismMfgOnly: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === ISM_MFG) {
          return { value: 60, observationDate: TODAY };
        }
        return null;
      },
    };

    assert.strictEqual(await resolveSatelliteData(config(ISM_SVC), nfibOnly, [], TODAY), null);
    assert.strictEqual(await resolveSatelliteData(config(NFIB), ismMfgOnly, [], TODAY), null);
  });

  it('semantically compatible fallbacks can resolve (one-hop)', async () => {
    assert.strictEqual(isFallbackSemanticallyCompatible(config(ISM_MFG), config(ISM_SVC)), true);
    assert.strictEqual(isFallbackSemanticallyCompatible(config(CLEVELAND), config(TRUFLATION)), true);

    const servicesOnly: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === ISM_SVC) {
          return { value: 58, observationDate: TODAY, underlyingSource: 'ISM_SERVICES' };
        }
        return null;
      },
    };
    const truOnly: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === TRUFLATION) {
          return { value: 0.08, observationDate: TODAY, underlyingSource: 'TRUFLATION' };
        }
        return null;
      },
    };

    const ismRow = await resolveSatelliteData(config(ISM_MFG), servicesOnly, [], TODAY);
    assert.ok(ismRow);
    assert.strictEqual(ismRow.series, ISM_MFG);
    assert.strictEqual(ismRow.resolvedSeries, ISM_SVC);
    assert.strictEqual(ismRow.fallbackUsed, true);
    assert.strictEqual(ismRow.value, 58);

    const clevelandRow = await resolveSatelliteData(config(CLEVELAND), truOnly, [], TODAY);
    assert.ok(clevelandRow);
    assert.strictEqual(clevelandRow.series, CLEVELAND);
    assert.strictEqual(clevelandRow.resolvedSeries, TRUFLATION);
    assert.strictEqual(clevelandRow.fallbackUsed, true);
  });

  it('fallback resolution is one-hop (does not walk the fallback chain)', async () => {
    const commodityAsSecondHop: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === COMMODITY) {
          return {
            value: 0.047,
            observationDate: TODAY,
            underlyingSource: 'PDBC',
            underlyingHorizon: 'TR_21',
          };
        }
        return null;
      },
    };
    // ISM Services → NFIB is incompatible; must not continue to NFIB → ISM Mfg or elsewhere.
    const services = await resolveSatelliteData(config(ISM_SVC), commodityAsSecondHop, [], TODAY);
    assert.strictEqual(services, null);
    const nfib = await resolveSatelliteData(config(NFIB), commodityAsSecondHop, [], TODAY);
    assert.strictEqual(nfib, null);
  });
});

describe('R5A — truthful provenance', () => {
  it('Commodity provenance identifies PDBC TR21', async () => {
    const row = await resolveSatelliteData(config(COMMODITY), commodityOnly, [], TODAY);
    assert.ok(row);
    assert.strictEqual(row.underlyingSource, 'PDBC');
    assert.strictEqual(row.underlyingHorizon, 'TR_21');
    assert.strictEqual(row.fallbackUsed, false);

    const presentation = satelliteReceiptPresentation(config(COMMODITY), row);
    assert.strictEqual(presentation.label, COMMODITY_PDBC_RECEIPT_LABEL);
    assert.match(presentation.note, /source: PDBC TR21/);
    assert.doesNotMatch(presentation.label, /Energy\+Metals/);
  });

  it('fallback provenance records the actual source', async () => {
    const servicesOnly: SatelliteDataProvider = {
      async getLatestObservation(series: string) {
        if (series === ISM_SVC) {
          return { value: 58, observationDate: TODAY, underlyingSource: 'ISM_SERVICES' };
        }
        return null;
      },
    };
    const row = await resolveSatelliteData(config(ISM_MFG), servicesOnly, [], TODAY);
    assert.ok(row);
    assert.strictEqual(row.fallbackUsed, true);
    assert.strictEqual(row.resolvedSeries, ISM_SVC);
    assert.strictEqual(row.underlyingSource, 'ISM_SERVICES');

    const presentation = satelliteReceiptPresentation(config(ISM_MFG), row);
    assert.match(presentation.label, /via ISM Services Prices Paid/);
    assert.match(presentation.note, /fallback used: ISM Services Prices Paid/);
    assert.match(presentation.note, /source: ISM_SERVICES/);
  });

  it('receipt key stays on the requested Commodity lane', () => {
    const key = `satellite_${COMMODITY.replace(/\s+/g, '_').toLowerCase()}`;
    assert.strictEqual(key, 'satellite_commodity_nowcast_basket_(energy+metals)');
  });
});

describe('R5A — PDBC Commodity as-of safety', () => {
  it('historical as-of ignores future PDBC rows', async () => {
    const historyCloses = Array.from({ length: 30 }, () => 100);
    const history = pdbcPoints(historyCloses, utcDay(2026, 6, 1));
    const asof = history[history.length - 1].date;

    const future: MarketDataPoint = {
      symbol: MARKET_SYMBOLS.PDBC,
      date: utcDay(2026, 8, 15),
      close: 400,
    };
    const withFuture = [...history, future];

    const providerWithFuture = new DefaultSatelliteDataProvider();
    providerWithFuture.setMarketData(withFuture);
    const providerHistoryOnly = new DefaultSatelliteDataProvider();
    providerHistoryOnly.setMarketData(history);

    const withFutureObs = await providerWithFuture.getLatestObservation(COMMODITY, asof);
    const historyOnlyObs = await providerHistoryOnly.getLatestObservation(COMMODITY, asof);

    assert.ok(withFutureObs);
    assert.ok(historyOnlyObs);
    assert.strictEqual(withFutureObs.value, historyOnlyObs.value);
    assert.strictEqual(withFutureObs.value, 0);
    assert.strictEqual(withFutureObs.observationDate.getTime(), asof.getTime());
  });

  it('same/latest as-of still produces the current expected Commodity value', async () => {
    const closes = Array.from({ length: 25 }, (_, i) => 50 + i);
    const points = pdbcPoints(closes, utcDay(2026, 6, 1));
    const last = points[points.length - 1].date;
    const expected = calculateTR(points, TR_21, last);

    const provider = new DefaultSatelliteDataProvider();
    provider.setMarketData(points);

    const withAsOf = await provider.getLatestObservation(COMMODITY, last);
    const withoutAsOf = await provider.getLatestObservation(COMMODITY);
    assert.ok(withAsOf);
    assert.ok(withoutAsOf);
    assert.strictEqual(withAsOf.value, expected);
    assert.strictEqual(withoutAsOf.value, expected);
    assert.strictEqual(withAsOf.value, withoutAsOf.value);
  });
});

describe('R5A — score neutrality and stub providers', () => {
  it('Freight rejection does not change satellite score when Commodity already supplies it', async () => {
    const resolved: Awaited<ReturnType<typeof resolveSatelliteData>>[] = [];
    for (const cfg of SATELLITE_CONFIGS) {
      resolved.push(await resolveSatelliteData(cfg, commodityOnly, [], TODAY));
    }
    const satelliteData = resolved.filter((row): row is NonNullable<typeof row> => row != null);

    assert.strictEqual(satelliteData.length, 1);
    assert.strictEqual(satelliteData[0].series, COMMODITY);
    assert.ok(!satelliteData.some((row) => row.series === FREIGHT));

    const score = processSatellites(satelliteData, SATELLITE_CONFIGS, TODAY);
    const commodityOnlyScore = processSatellites(
      [{ series: COMMODITY, value: 0.047, observationDate: TODAY, age_days: 0 }],
      SATELLITE_CONFIGS,
      TODAY
    );
    assert.strictEqual(score, 1);
    assert.strictEqual(score, commodityOnlyScore);
  });

  it('default provider does not resolve Cleveland / Truflation / ISM / NFIB / Freight', async () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 0.15);
    const points = pdbcPoints(closes, utcDay(2026, 6, 1));
    const asof = points[points.length - 1].date;
    const provider = new DefaultSatelliteDataProvider();
    provider.setMarketData(points);

    for (const series of STUB_SERIES) {
      const obs = await provider.getLatestObservation(series, asof);
      assert.strictEqual(obs, null, `${series} should remain unresolved`);
      const row = await resolveSatelliteData(config(series), provider, points, asof);
      assert.strictEqual(row, null, `${series} resolve should be null`);
    }

    const commodity = await provider.getLatestObservation(COMMODITY, asof);
    assert.ok(commodity);
  });
});
