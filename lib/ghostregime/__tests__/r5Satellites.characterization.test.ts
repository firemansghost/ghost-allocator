/**
 * R5 CHARACTERIZATION — unresolved Commodity / PDBC model behavior (R5B)
 *
 * Diagnostic only. R5A corrected the false Freight alias; do not treat remaining
 * PDBC TR21 Commodity-as-satellite behavior as a desired invariant. That is R5B.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SATELLITE_CONFIGS,
  processSatellites,
  resolveSatelliteData,
  isFallbackSemanticallyCompatible,
  type SatelliteDataProvider,
} from '../satellites';

const TODAY = new Date('2026-08-28T00:00:00Z');

const COMMODITY = 'Commodity Nowcast Basket (Energy+Metals)';
const FREIGHT = 'Freight Pulse (BDI or Freightos)';
const TRUFLATION = 'Truflation YoY';

function config(series: string) {
  const found = SATELLITE_CONFIGS.find((c) => c.series === series);
  assert.ok(found, `missing config ${series}`);
  return found;
}

describe('R5 CHARACTERIZATION — current commodity vote (R5B model, unchanged)', () => {
  it('commodity satellite votes +1 when TR_21 is at/above its inflation threshold', () => {
    const score = processSatellites(
      [
        {
          series: COMMODITY,
          value: 0.02,
          observationDate: TODAY,
          age_days: 0,
        },
      ],
      SATELLITE_CONFIGS,
      TODAY
    );
    assert.strictEqual(score, 1);
  });

  it('commodity satellite votes +1 at live-like TR21 ≈ 4.7% (threshold 2%)', () => {
    const score = processSatellites(
      [
        {
          series: COMMODITY,
          value: 0.047,
          observationDate: TODAY,
          age_days: 0,
        },
      ],
      SATELLITE_CONFIGS,
      TODAY
    );
    assert.strictEqual(score, 1);
  });

  it('Freight vote stays 0 at live-like TR21 ≈ 4.7% if a Freight-labeled row were processed (threshold 10%)', () => {
    const score = processSatellites(
      [
        {
          series: FREIGHT,
          value: 0.047,
          observationDate: TODAY,
          age_days: 0,
        },
      ],
      SATELLITE_CONFIGS,
      TODAY
    );
    assert.strictEqual(score, 0);
  });
});

describe('R5 CHARACTERIZATION — fallback name strings (not repaired in R5A)', () => {
  it('Freight fallback name still points at the commodity series (alias is config debt; R5A rejects it)', () => {
    const freight = config(FREIGHT);
    assert.strictEqual(freight.fallback, COMMODITY);
    assert.ok(SATELLITE_CONFIGS.some((c) => c.series === freight.fallback));
    assert.strictEqual(isFallbackSemanticallyCompatible(freight, config(COMMODITY)), false);
  });

  it('Truflation fallback name does not match the commodity series (string is not repaired)', () => {
    const tru = config(TRUFLATION);
    assert.strictEqual(tru.fallback, 'Commodity Nowcast Basket');
    assert.ok(!SATELLITE_CONFIGS.some((c) => c.series === tru.fallback));
  });
});

describe('R5 CHARACTERIZATION — resolveSatelliteData after R5A containment', () => {
  const commodityOnly: SatelliteDataProvider = {
    async getLatestObservation(series: string) {
      if (series === COMMODITY) {
        return { value: 0.047, observationDate: TODAY };
      }
      return null;
    },
  };

  it('Freight does not consume the commodity observation (false alias rejected)', async () => {
    const row = await resolveSatelliteData(config(FREIGHT), commodityOnly, [], TODAY);
    assert.strictEqual(row, null);
  });

  it('Truflation does not resolve via the mismatched commodity fallback name', async () => {
    const row = await resolveSatelliteData(config(TRUFLATION), commodityOnly, [], TODAY);
    assert.strictEqual(row, null);
  });

  it('commodity primary series still resolves', async () => {
    const row = await resolveSatelliteData(config(COMMODITY), commodityOnly, [], TODAY);
    assert.ok(row);
    assert.strictEqual(row.series, COMMODITY);
    assert.strictEqual(row.value, 0.047);
  });
});
