/**
 * Display-copy tests for GhostYield screener labels/tooltips after evidence-gate activation.
 */

import assert from 'node:assert/strict';
import {
  DATA_QA_COLUMN_TOOLTIP,
  EVIDENCE_GATE_LABEL,
  FRESHNESS_STATUS_LABEL,
  fitScoreTooltip,
  freshnessBadgeTitle,
  riskScoreTooltip,
} from '../screenerDisplay';

assert.equal(FRESHNESS_STATUS_LABEL.fresh, 'Fresh in snapshot');
assert.equal(EVIDENCE_GATE_LABEL.clear, 'Clear');
assert.equal(EVIDENCE_GATE_LABEL.qualified, 'Qualified');
assert.equal(EVIDENCE_GATE_LABEL.insufficient, 'Insufficient');

assert.match(DATA_QA_COLUMN_TOOLTIP, /snapshot reference date/i);
assert.match(DATA_QA_COLUMN_TOOLTIP, /Evidence/i);
assert.doesNotMatch(DATA_QA_COLUMN_TOOLTIP, /formulas also include selected confidence/i);

assert.match(freshnessBadgeTitle('fresh'), /Fresh in snapshot/);

assert.match(riskScoreTooltip(28), /Economic sleeve\/investment factors only/i);
assert.match(riskScoreTooltip(28, 'insufficient'), /Evidence: Insufficient/i);
assert.doesNotMatch(riskScoreTooltip(28), /data-confidence, freshness, and missing-data adjustments/i);

assert.match(fitScoreTooltip(100, 'insufficient'), /withheld/i);
assert.match(fitScoreTooltip(100, 'clear'), /Economic fit factors only/i);
assert.match(fitScoreTooltip(100, 'clear'), /not a recommendation/i);
assert.doesNotMatch(fitScoreTooltip(100, 'clear'), /selected confidence and freshness adjustments/i);

console.log('ghostyield/screenerDisplay.test.ts: ok');
