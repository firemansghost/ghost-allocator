/**
 * Fail-closed guard for Marketstack paid fallback.
 * ALLOW_MARKETSTACK_FALLBACK=true is the primary opt-in gate.
 */

export type MarketstackGuardDenyReason =
  | 'marketstack_disabled_by_guard'
  | 'marketstack_key_missing'
  | 'marketstack_preview_disabled'
  | 'marketstack_test_disabled'
  | 'marketstack_build_disabled';

export interface MarketstackGuardResult {
  allowed: boolean;
  denyReason?: MarketstackGuardDenyReason;
}

function readEnv(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const v = env[key];
  return typeof v === 'string' ? v.trim() : undefined;
}

/**
 * Returns whether Marketstack fallback HTTP may run in the current environment.
 * Key presence is checked separately in marketData.ts.
 */
export function evaluateMarketstackFallbackAllowed(
  env: NodeJS.ProcessEnv = process.env
): MarketstackGuardResult {
  if (readEnv(env, 'DISABLE_MARKETSTACK_FALLBACK') === 'true') {
    return { allowed: false, denyReason: 'marketstack_disabled_by_guard' };
  }
  if (readEnv(env, 'NODE_ENV') === 'test') {
    return { allowed: false, denyReason: 'marketstack_test_disabled' };
  }
  if (readEnv(env, 'VERCEL_ENV') === 'preview') {
    return { allowed: false, denyReason: 'marketstack_preview_disabled' };
  }
  if (readEnv(env, 'NEXT_PHASE') === 'phase-production-build') {
    return { allowed: false, denyReason: 'marketstack_build_disabled' };
  }
  if (readEnv(env, 'ALLOW_MARKETSTACK_FALLBACK') !== 'true') {
    return { allowed: false, denyReason: 'marketstack_disabled_by_guard' };
  }
  return { allowed: true };
}

export function formatMarketstackGuardSkipMessage(reason: MarketstackGuardDenyReason): string {
  switch (reason) {
    case 'marketstack_disabled_by_guard':
      return 'Marketstack fallback disabled (set ALLOW_MARKETSTACK_FALLBACK=true to enable)';
    case 'marketstack_key_missing':
      return 'Marketstack fallback skipped (MARKETSTACK_ACCESS_KEY unset)';
    case 'marketstack_preview_disabled':
      return 'Marketstack fallback disabled in Vercel Preview';
    case 'marketstack_test_disabled':
      return 'Marketstack fallback disabled in test environment';
    case 'marketstack_build_disabled':
      return 'Marketstack fallback disabled during Next.js production build';
    default:
      return `Marketstack fallback skipped (${reason})`;
  }
}
