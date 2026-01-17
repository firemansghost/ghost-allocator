/**
 * Tests for Schwab Lineup Logic
 * Ensures gold tilt doesn't cause duplicate gold exposure
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getStandardSchwabLineup } from './schwabLineups';
import { selectModelPortfolio } from './portfolioEngine';
import type { RiskLevel, SchwabLineupStyle, GoldInstrument, BtcInstrument, GoldBtcTilt } from './types';

/**
 * Test helper: Build lineup and extract tickers
 */
function extractTickers(lineup: ReturnType<typeof getStandardSchwabLineup>): string[] {
  const tickers: string[] = [];
  
  for (const item of lineup) {
    if (item.type === 'tilt' && item.ticker) {
      tickers.push(item.ticker);
    }
    if (item.type === 'sleeve' && item.etfs) {
      for (const etf of item.etfs) {
        tickers.push(etf.ticker);
      }
    }
  }
  
  return tickers;
}

/**
 * Test helper: Find Real Assets sleeve
 */
function findRealAssetsSleeve(lineup: ReturnType<typeof getStandardSchwabLineup>) {
  return lineup.find((item) => item.id === 'real_assets' || item.label.toLowerCase().includes('real assets') || item.label.toLowerCase().includes('commodities'));
}

describe('Schwab Lineup Gold Tilt Tests', () => {
  const riskLevel: RiskLevel = 3; // Moderate
  const lineupStyle: SchwabLineupStyle = 'standard';
  const goldInstrument: GoldInstrument = 'gldm';
  const btcInstrument: BtcInstrument = 'fbtc';
  
  const portfolio = selectModelPortfolio(riskLevel);
  const sleeves = portfolio.sleeves;

  it('tilt=None includes GLDM in Real Assets sleeve', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'none'
    );
    
    const tickers = extractTickers(lineup);
    const realAssets = findRealAssetsSleeve(lineup);
    
    // Should have GLDM in Real Assets
    assert(realAssets !== undefined, 'Real Assets sleeve should exist');
    assert(realAssets?.etfs?.some((etf) => etf.ticker === 'GLDM'), 'Real Assets should contain GLDM');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have GLDM somewhere
    assert(tickers.includes('GLDM'), 'Should contain GLDM');
  });

  it('tilt=10% gold / 5% btc: GLDM appears once (in tilt), not in Real Assets', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'gold10_btc5'
    );
    
    const tickers = extractTickers(lineup);
    const realAssets = findRealAssetsSleeve(lineup);
    
    // GLDM should appear exactly once (in tilt)
    const gldmCount = tickers.filter((t) => t === 'GLDM').length;
    assert.strictEqual(gldmCount, 1, 'GLDM should appear exactly once');
    
    // Real Assets should NOT contain GLDM or YGLD
    const realAssetsTickers = realAssets?.etfs?.map((etf) => etf.ticker) || [];
    assert(!realAssetsTickers.includes('GLDM'), 'Real Assets should not contain GLDM');
    assert(!realAssetsTickers.includes('YGLD'), 'Real Assets should not contain YGLD');
    
    // Real Assets label should be "Commodities" when gold tilt is active
    assert.strictEqual(realAssets?.label, 'Commodities', 'Real Assets label should be "Commodities"');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have FBTC in tilt
    const tiltItems = lineup.filter((item) => item.type === 'tilt');
    const goldTilt = tiltItems.find((item) => item.ticker === 'GLDM');
    const btcTilt = tiltItems.find((item) => item.ticker === 'FBTC');
    assert(goldTilt !== undefined, 'Gold tilt should exist');
    assert.strictEqual(goldTilt?.weight, 10, 'Gold tilt should be 10%');
    assert(btcTilt !== undefined, 'BTC tilt should exist');
    assert.strictEqual(btcTilt?.weight, 5, 'BTC tilt should be 5%');
  });

  it('tilt=15% gold / 5% btc: GLDM appears once (in tilt), not in Real Assets', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'gold15_btc5'
    );
    
    const tickers = extractTickers(lineup);
    const realAssets = findRealAssetsSleeve(lineup);
    
    // GLDM should appear exactly once (in tilt)
    const gldmCount = tickers.filter((t) => t === 'GLDM').length;
    assert.strictEqual(gldmCount, 1, 'GLDM should appear exactly once');
    
    // Real Assets should NOT contain GLDM or YGLD
    const realAssetsTickers = realAssets?.etfs?.map((etf) => etf.ticker) || [];
    assert(!realAssetsTickers.includes('GLDM'), 'Real Assets should not contain GLDM');
    assert(!realAssetsTickers.includes('YGLD'), 'Real Assets should not contain YGLD');
    
    // Real Assets label should be "Commodities" when gold tilt is active
    assert.strictEqual(realAssets?.label, 'Commodities', 'Real Assets label should be "Commodities"');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have FBTC in tilt
    const tiltItems = lineup.filter((item) => item.type === 'tilt');
    const goldTilt = tiltItems.find((item) => item.ticker === 'GLDM');
    const btcTilt = tiltItems.find((item) => item.ticker === 'FBTC');
    assert(goldTilt !== undefined, 'Gold tilt should exist');
    assert.strictEqual(goldTilt?.weight, 15, 'Gold tilt should be 15%');
    assert(btcTilt !== undefined, 'BTC tilt should exist');
    assert.strictEqual(btcTilt?.weight, 5, 'BTC tilt should be 5%');
  });

  it('no duplicate tickers in any lineup configuration', () => {
    const tilts: GoldBtcTilt[] = ['none', 'gold10_btc5', 'gold15_btc5'];
    
    for (const tilt of tilts) {
      const lineup = getStandardSchwabLineup(
        sleeves,
        riskLevel,
        lineupStyle,
        goldInstrument,
        btcInstrument,
        tilt
      );
      
      const tickers = extractTickers(lineup);
      const uniqueTickers = new Set(tickers);
      
      // No duplicates
      assert.strictEqual(tickers.length, uniqueTickers.size, `No duplicate tickers for tilt=${tilt}`);
    }
  });

  it('lineup weights sum to ~100%', () => {
    const tilts: GoldBtcTilt[] = ['none', 'gold10_btc5', 'gold15_btc5'];
    
    for (const tilt of tilts) {
      const lineup = getStandardSchwabLineup(
        sleeves,
        riskLevel,
        lineupStyle,
        goldInstrument,
        btcInstrument,
        tilt
      );
      
      const total = lineup.reduce((sum, item) => sum + item.weight, 0);
      
      // Should be close to 100% (allow small floating point differences)
      assert(total > 99.9, `Total should be > 99.9% for tilt=${tilt}, got ${total}`);
      assert(total < 100.1, `Total should be < 100.1% for tilt=${tilt}, got ${total}`);
    }
  });
});
