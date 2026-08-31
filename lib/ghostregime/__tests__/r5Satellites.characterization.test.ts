/**
 * R5 CHARACTERIZATION — expected to change if R5 later redesigns satellites
 *
 * Diagnostic only. This is not a proposal to remove satellites.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SATELLITE_CONFIGS,
  processSatellites,
  resolveSatelliteData,
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

describe('R5 CHARACTERIZATION — current satellite config and commodity vote', () => {
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

  it('Freight vote stays 0 at live-like TR21 ≈ 4.7% (Freight threshold 10%)', () => {
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

describe('R5 CHARACTERIZATION — fallback name semantics', () => {
  it('Freight fallback name matches the commodity series (can inherit commodity TR21)', () => {
    const freight = config(FREIGHT);
    assert.strictEqual(freight.fallback, COMMODITY);
    assert.ok(SATELLITE_CONFIGS.some((c) => c.series === freight.fallback));
  });

  it('Truflation fallback name does not match the commodity series (intended fallback fails to resolve)', () => {
    const tru = config(TRUFLATION);
    assert.strictEqual(tru.fallback, 'Commodity Nowcast Basket');
    assert.ok(!SATELLITE_CONFIGS.some((c) => c.series === tru.fallback));
  });
});

describe('R5 CHARACTERIZATION — resolveSatelliteData fallback behavior', () => {
  const commodityOnly: SatelliteDataProvider = {
    async getLatestObservation(series: string) {
      if (series === COMMODITY) {
        return { value: 0.047, observationDate: TODAY };
      }
      return null;
    },
  };

  it('Freight keeps Freight series name while consuming the commodity observation', async () => {
    const row = await resolveSatelliteData(config(FREIGHT), commodityOnly, [], TODAY);
    assert.ok(row);
    assert.strictEqual(row.series, FREIGHT);
    assert.strictEqual(row.value, 0.047);
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
