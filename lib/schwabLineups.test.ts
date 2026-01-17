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
 * Test helper: Find Gold sleeve
 */
function findGoldSleeve(lineup: ReturnType<typeof getStandardSchwabLineup>) {
  return lineup.find((item) => item.id === 'gold' || item.label.toLowerCase() === 'gold');
}

/**
 * Test helper: Find Commodities sleeve
 */
function findCommoditiesSleeve(lineup: ReturnType<typeof getStandardSchwabLineup>) {
  return lineup.find((item) => item.id === 'commodities' || item.label.toLowerCase() === 'commodities');
}

describe('Schwab Lineup Gold Tilt Tests', () => {
  const riskLevel: RiskLevel = 3; // Moderate
  const lineupStyle: SchwabLineupStyle = 'standard';
  const goldInstrument: GoldInstrument = 'gldm';
  const btcInstrument: BtcInstrument = 'fbtc';
  
  const portfolio = selectModelPortfolio(riskLevel);
  const sleeves = portfolio.sleeves;

  it('tilt=None includes Gold and Commodities as separate sleeves', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'none'
    );
    
    const tickers = extractTickers(lineup);
    const goldSleeve = findGoldSleeve(lineup);
    const commoditiesSleeve = findCommoditiesSleeve(lineup);
    
    // Should have Gold sleeve with GLDM
    assert(goldSleeve !== undefined, 'Gold sleeve should exist');
    assert(goldSleeve?.etfs?.some((etf) => etf.ticker === 'GLDM'), 'Gold sleeve should contain GLDM');
    
    // Should have Commodities sleeve with DBC or HARD
    assert(commoditiesSleeve !== undefined, 'Commodities sleeve should exist');
    const commoditiesTickers = commoditiesSleeve?.etfs?.map((etf) => etf.ticker) || [];
    assert(commoditiesTickers.length > 0, 'Commodities sleeve should have ETFs');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have GLDM in Gold sleeve only
    assert(tickers.includes('GLDM'), 'Should contain GLDM');
    const gldmCount = tickers.filter((t) => t === 'GLDM').length;
    assert.strictEqual(gldmCount, 1, 'GLDM should appear exactly once');
    
    // Should NOT have Real Assets sleeve
    const realAssetsSleeve = lineup.find((item) => item.id === 'real_assets');
    assert(realAssetsSleeve === undefined, 'Real Assets sleeve should not exist');
  });

  it('tilt=10% gold / 5% btc: Gold sleeve weight is 10%, Bitcoin is separate position', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'gold10_btc5'
    );
    
    const tickers = extractTickers(lineup);
    const goldSleeve = findGoldSleeve(lineup);
    const commoditiesSleeve = findCommoditiesSleeve(lineup);
    
    // GLDM should appear exactly once (in Gold sleeve)
    const gldmCount = tickers.filter((t) => t === 'GLDM').length;
    assert.strictEqual(gldmCount, 1, 'GLDM should appear exactly once');
    
    // Gold sleeve should contain GLDM and have weight 10%
    assert(goldSleeve !== undefined, 'Gold sleeve should exist');
    assert(goldSleeve?.etfs?.some((etf) => etf.ticker === 'GLDM'), 'Gold sleeve should contain GLDM');
    assert.strictEqual(goldSleeve?.weight, 10, 'Gold sleeve should be 10%');
    
    // Commodities sleeve should NOT contain GLDM or YGLD
    const commoditiesTickers = commoditiesSleeve?.etfs?.map((etf) => etf.ticker) || [];
    assert(!commoditiesTickers.includes('GLDM'), 'Commodities should not contain GLDM');
    assert(!commoditiesTickers.includes('YGLD'), 'Commodities should not contain YGLD');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have FBTC as tilt position
    const tiltItems = lineup.filter((item) => item.type === 'tilt');
    const btcTilt = tiltItems.find((item) => item.ticker === 'FBTC');
    assert(btcTilt !== undefined, 'BTC tilt should exist');
    assert.strictEqual(btcTilt?.weight, 5, 'BTC tilt should be 5%');
    
    // Should NOT have Real Assets sleeve
    const realAssetsSleeve = lineup.find((item) => item.id === 'real_assets');
    assert(realAssetsSleeve === undefined, 'Real Assets sleeve should not exist');
  });

  it('tilt=15% gold / 5% btc: Gold sleeve weight is 15%, Bitcoin is separate position', () => {
    const lineup = getStandardSchwabLineup(
      sleeves,
      riskLevel,
      lineupStyle,
      goldInstrument,
      btcInstrument,
      'gold15_btc5'
    );
    
    const tickers = extractTickers(lineup);
    const goldSleeve = findGoldSleeve(lineup);
    const commoditiesSleeve = findCommoditiesSleeve(lineup);
    
    // GLDM should appear exactly once (in Gold sleeve)
    const gldmCount = tickers.filter((t) => t === 'GLDM').length;
    assert.strictEqual(gldmCount, 1, 'GLDM should appear exactly once');
    
    // Gold sleeve should contain GLDM and have weight 15%
    assert(goldSleeve !== undefined, 'Gold sleeve should exist');
    assert(goldSleeve?.etfs?.some((etf) => etf.ticker === 'GLDM'), 'Gold sleeve should contain GLDM');
    assert.strictEqual(goldSleeve?.weight, 15, 'Gold sleeve should be 15%');
    
    // Commodities sleeve should NOT contain GLDM or YGLD
    const commoditiesTickers = commoditiesSleeve?.etfs?.map((etf) => etf.ticker) || [];
    assert(!commoditiesTickers.includes('GLDM'), 'Commodities should not contain GLDM');
    assert(!commoditiesTickers.includes('YGLD'), 'Commodities should not contain YGLD');
    
    // Should NOT have GLD anywhere
    assert(!tickers.includes('GLD'), 'Should not contain GLD');
    
    // Should have FBTC as tilt position
    const tiltItems = lineup.filter((item) => item.type === 'tilt');
    const btcTilt = tiltItems.find((item) => item.ticker === 'FBTC');
    assert(btcTilt !== undefined, 'BTC tilt should exist');
    assert.strictEqual(btcTilt?.weight, 5, 'BTC tilt should be 5%');
    
    // Should NOT have Real Assets sleeve
    const realAssetsSleeve = lineup.find((item) => item.id === 'real_assets');
    assert(realAssetsSleeve === undefined, 'Real Assets sleeve should not exist');
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
