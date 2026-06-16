/**
 * Marketstack fallback guard (fail-closed env matrix)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  evaluateMarketstackFallbackAllowed,
  formatMarketstackGuardSkipMessage,
} from '../marketstackGuard';

const GUARD_ENV_KEYS = [
  'DISABLE_MARKETSTACK_FALLBACK',
  'NODE_ENV',
  'VERCEL_ENV',
  'NEXT_PHASE',
  'ALLOW_MARKETSTACK_FALLBACK',
  'MARKETSTACK_ACCESS_KEY',
] as const;

const saved: Partial<Record<(typeof GUARD_ENV_KEYS)[number], string | undefined>> = {};

function saveEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
}

function clearGuardEnv(): void {
  for (const key of GUARD_ENV_KEYS) {
    delete process.env[key];
  }
}

describe('evaluateMarketstackFallbackAllowed', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('denies when key exists but ALLOW is unset (default fail-closed)', () => {
    saveEnv();
    clearGuardEnv();
    process.env.MARKETSTACK_ACCESS_KEY = 'test-key-not-used';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.denyReason, 'marketstack_disabled_by_guard');
  });

  it('allows when ALLOW=true and guard env is clean', () => {
    saveEnv();
    clearGuardEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, true);
    assert.strictEqual(r.denyReason, undefined);
  });

  it('blocks NODE_ENV=test even with ALLOW=true', () => {
    saveEnv();
    clearGuardEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.NODE_ENV = 'test';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.denyReason, 'marketstack_test_disabled');
  });

  it('blocks VERCEL_ENV=preview even with ALLOW=true', () => {
    saveEnv();
    clearGuardEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.VERCEL_ENV = 'preview';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.denyReason, 'marketstack_preview_disabled');
  });

  it('blocks NEXT_PHASE=phase-production-build even with ALLOW=true', () => {
    saveEnv();
    clearGuardEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.NEXT_PHASE = 'phase-production-build';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.denyReason, 'marketstack_build_disabled');
  });

  it('blocks when DISABLE_MARKETSTACK_FALLBACK=true even with ALLOW=true', () => {
    saveEnv();
    clearGuardEnv();
    process.env.ALLOW_MARKETSTACK_FALLBACK = 'true';
    process.env.DISABLE_MARKETSTACK_FALLBACK = 'true';
    const r = evaluateMarketstackFallbackAllowed();
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.denyReason, 'marketstack_disabled_by_guard');
  });
});

describe('formatMarketstackGuardSkipMessage', () => {
  it('does not include secrets or access keys', () => {
    const msg = formatMarketstackGuardSkipMessage('marketstack_disabled_by_guard');
    assert.ok(!msg.includes('access_key'));
    assert.ok(!/sk-[a-z0-9]/i.test(msg));
  });
});
