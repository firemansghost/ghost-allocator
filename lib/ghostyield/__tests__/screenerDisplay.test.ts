/**
 * Display-copy characterization for GhostYield screener labels/tooltips.
 * Does not assert scoring math.
 */

import assert from 'node:assert/strict';
import {
  DATA_QA_COLUMN_TOOLTIP,
  FRESHNESS_STATUS_LABEL,
  fitScoreTooltip,
  freshnessBadgeTitle,
  riskScoreTooltip,
} from '../screenerDisplay';

assert.equal(FRESHNESS_STATUS_LABEL.fresh, 'Fresh in snapshot');
assert.equal(FRESHNESS_STATUS_LABEL.caution, 'Data Caution');
assert.equal(FRESHNESS_STATUS_LABEL.stale, 'Stale Data');
assert.equal(FRESHNESS_STATUS_LABEL.missing, 'Data Gaps');
assert.equal(FRESHNESS_STATUS_LABEL.illustrative, 'Sample Data');

assert.match(DATA_QA_COLUMN_TOOLTIP, /snapshot reference date/i);
assert.match(DATA_QA_COLUMN_TOOLTIP, /not today/i);
assert.match(DATA_QA_COLUMN_TOOLTIP, /Risk and Fit formulas also include/i);
assert.doesNotMatch(DATA_QA_COLUMN_TOOLTIP, /Separate from Data QA/i);

assert.match(freshnessBadgeTitle('fresh'), /Fresh in snapshot/);
assert.match(freshnessBadgeTitle('fresh'), /not today/i);

assert.match(riskScoreTooltip(56), /selected data-confidence, freshness, and missing-data adjustments/i);
assert.doesNotMatch(riskScoreTooltip(56), /Separate from Data QA/i);

assert.match(fitScoreTooltip(100), /selected confidence and freshness adjustments/i);
assert.doesNotMatch(fitScoreTooltip(100), /not data QA/i);
assert.match(fitScoreTooltip(100), /not a recommendation/i);

console.log('ghostyield/screenerDisplay.test.ts: ok');
