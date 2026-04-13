/**
 * Regression: "latest" vs explicit historical view is determined only by URL params,
 * not client memory. GhostRegimeClient treats !asof && !prev as latest and must reset row state.
 */
import assert from 'node:assert';
import test from 'node:test';
import { parseAsOfParam, parsePrevParam } from '../ui';

function isExplicitHistoricalGhostRegimeUrl(asofParam: string | null, prevParam: string | null) {
  const { asof } = parseAsOfParam(asofParam);
  const { value: prev } = parsePrevParam(prevParam);
  return !!(asof || prev);
}

test('latest view: no asof and no prev', () => {
  assert.strictEqual(isExplicitHistoricalGhostRegimeUrl(null, null), false);
});

test('historical view: asof present', () => {
  assert.strictEqual(isExplicitHistoricalGhostRegimeUrl('2026-03-26', null), true);
});

test('compare/prev-only URL still opts into history path', () => {
  assert.strictEqual(isExplicitHistoricalGhostRegimeUrl(null, '2026-03-20'), true);
});
