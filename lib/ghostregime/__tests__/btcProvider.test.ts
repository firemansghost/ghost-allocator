/**
 * BTC provider capabilities, CoinGecko cap, Stooq challenge, chain thresholds
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BTC_BOOTSTRAP_MIN_ROWS,
  BTC_PROVIDER_CAPABILITIES,
  COINGECKO_PUBLIC_MAX_LOOKBACK_DAYS,
  clampCoinGeckoPublicStart,
  isCoinGeckoPublicLookbackExceeded,
} from '../providerCapabilities';
import { VAMS_MIN_OBSERVATIONS_AT_ASOF } from '../config';
import { isStooqBrowserChallengeBody } from '../marketData';

describe('BTC_PROVIDER_CAPABILITIES', () => {
  it('marks Yahoo bootstrap-capable and CoinGecko public not bootstrap-capable', () => {
    assert.strictEqual(BTC_PROVIDER_CAPABILITIES.yahoo.supportsHistoricalBootstrap, true);
    assert.strictEqual(BTC_PROVIDER_CAPABILITIES.coingecko_public.supportsHistoricalBootstrap, false);
    assert.strictEqual(BTC_PROVIDER_CAPABILITIES.coingecko_public.maxLookbackDays, 360);
    assert.ok(BTC_PROVIDER_CAPABILITIES.yahoo.maxLookbackDays >= 600);
  });

  it('keeps bootstrap min aligned with VAMS gate', () => {
    assert.strictEqual(BTC_BOOTSTRAP_MIN_ROWS, VAMS_MIN_OBSERVATIONS_AT_ASOF);
    assert.strictEqual(BTC_BOOTSTRAP_MIN_ROWS, 400);
  });
});

describe('clampCoinGeckoPublicStart', () => {
  it('clamps requested start to end minus 360 days', () => {
    const end = new Date('2026-06-08T12:00:00Z');
    const requested = new Date('2024-10-16T12:00:00Z');
    const { effectiveStart, lookbackLimited } = clampCoinGeckoPublicStart(requested, end);
    assert.strictEqual(lookbackLimited, true);
    const diffDays = Math.round(
      (end.getTime() - effectiveStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    assert.strictEqual(diffDays, COINGECKO_PUBLIC_MAX_LOOKBACK_DAYS);
  });

  it('does not clamp when requested start is within public window', () => {
    const end = new Date('2026-06-08T12:00:00Z');
    const requested = new Date('2026-01-01T12:00:00Z');
    const { effectiveStart, lookbackLimited } = clampCoinGeckoPublicStart(requested, end);
    assert.strictEqual(lookbackLimited, false);
    assert.strictEqual(effectiveStart.getTime(), requested.getTime());
  });
});

describe('isCoinGeckoPublicLookbackExceeded', () => {
  it('detects error code 10012 / 365-day messages', () => {
    assert.strictEqual(
      isCoinGeckoPublicLookbackExceeded(
        '{"status":{"error_code":10012,"error_message":"exceeds the allowed time range"}}'
      ),
      true
    );
    assert.strictEqual(
      isCoinGeckoPublicLookbackExceeded('historical data within the past 365 days'),
      true
    );
    assert.strictEqual(isCoinGeckoPublicLookbackExceeded('{"prices":[]}'), false);
  });
});

describe('isStooqBrowserChallengeBody', () => {
  it('detects browser verification HTML', () => {
    const sample = `<!DOCTYPE html><html><body>Please enable JavaScript to verify your browser.</body></html>`;
    assert.strictEqual(isStooqBrowserChallengeBody(sample), true);
  });

  it('does not flag normal CSV', () => {
    assert.strictEqual(
      isStooqBrowserChallengeBody('Date,Open,High,Low,Close\n2024-01-02,1,1,1,100'),
      false
    );
  });
});
