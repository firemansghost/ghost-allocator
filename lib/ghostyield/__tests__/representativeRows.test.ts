/**
 * CHARACTERIZATION: representative committed rows and their semantic edge conditions.
 * Not a full 20-row snapshot freeze.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';

function row(ticker: string) {
  const c = GHOSTYIELD_SCORED_CANDIDATES.find((x) => x.ticker === ticker);
  assert.ok(c, `${ticker} must exist`);
  return c;
}

// SGOV — high-confidence / complete
{
  const c = row('SGOV');
  assert.equal(c.dataConfidence, 'high');
  assert.equal(c.freshness.status, 'fresh');
  assert.equal(c.freshness.applyScoringPenalty, false);
  assert.notEqual(c.nav, null);
  assert.equal(c.fitScore, 100);
}

// HYG — caution (missing distribution source fields on otherwise usable row)
{
  const c = row('HYG');
  assert.equal(c.freshness.status, 'caution');
  assert.equal(c.freshness.applyScoringPenalty, true);
}

// ARDC — CEF with structured cefMetrics
{
  const c = row('ARDC');
  assert.equal(c.structureLabel, 'CEF');
  assert.ok(c.cefMetrics);
  assert.notEqual(c.cefMetrics?.effectiveLeverage, null);
  assert.equal(c.freshness.status, 'fresh');
}

// ARCC — listed BDC with stale lineage vs static reference
{
  const c = row('ARCC');
  assert.equal(c.sleeveType, 'bdc_income');
  assert.ok(c.bdcMetrics);
  assert.equal(c.freshness.status, 'stale');
  assert.equal(c.freshness.applyScoringPenalty, true);
}

// KIO — stale NAV lineage / high structural risk
{
  const c = row('KIO');
  assert.equal(c.structureLabel, 'CEF');
  assert.equal(c.freshness.status, 'stale');
  assert.equal(c.riskScore, 100);
}

// JEPI — missing NAV with extreme Fit (see dedicated characterization file)
{
  const c = row('JEPI');
  assert.equal(c.nav, null);
  assert.equal(c.freshness.status, 'missing');
  assert.equal(c.fitScore, 100);
}

// JAAA — missing NAV; stale distribution/quarterly lineage still present in warnings
// Status precedence remains `missing` even while stale lineage warnings coexist.
{
  const c = row('JAAA');
  assert.equal(c.nav, null);
  assert.equal(c.freshness.status, 'missing');
  assert.ok(c.freshness.warnings.some((w) => /Missing NAV/i.test(w)));
  assert.ok(c.freshness.warnings.some((w) => /90 days \(stale\)/i.test(w)));
  assert.ok(c.freshness.warnings.some((w) => /Quarterly fundamentals/i.test(w)));
  assert.ok(c.fitScore >= 85);
}

console.log('ghostyield/representativeRows.test.ts: ok');
