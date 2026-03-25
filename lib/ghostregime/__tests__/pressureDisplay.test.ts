/**
 * Display-only Pressure Watch formatters (flip-line copy, flip-impact filtering).
 */

import assert from 'assert';
import {
  formatInflationAxisFlipLine,
  formatNextFlipImpactLine,
  formatRiskAxisFlipLine,
  formatSleeveThresholdDistanceLine,
  nonZeroFlipImpactParts,
} from '../pressureDisplay';

const NEGL = 'Next flip impact: negligible at current targets';

assert.strictEqual(formatRiskAxisFlipLine(0.5, 0.5), '0.50 from flip to Risk Off');
assert.strictEqual(formatRiskAxisFlipLine(-0.3, 0.3), '0.30 from flip to Risk On');
assert.strictEqual(formatRiskAxisFlipLine(0, 0), 'On the flip line');

assert.strictEqual(formatInflationAxisFlipLine(0.2, 0.2), '0.20 from flip to Disinflation');
assert.strictEqual(formatInflationAxisFlipLine(-0.4, 0.4), '0.40 from flip to Inflation');
assert.strictEqual(formatInflationAxisFlipLine(0, 0), 'On the flip line');

assert.deepStrictEqual(
  nonZeroFlipImpactParts({ stocks: 0, gold: 0, btc: 0, cash: 0 }),
  []
);
assert.deepStrictEqual(
  nonZeroFlipImpactParts({ stocks: 0.01, gold: 0, btc: 0, cash: -0.01 }).map((p) => p.key),
  ['stocks', 'cash']
);

assert.strictEqual(
  formatNextFlipImpactLine({ stocks: 0, gold: 0, btc: 0, cash: 0 }, NEGL),
  NEGL
);
assert.ok(
  formatNextFlipImpactLine({ stocks: 0.025, gold: 0, btc: 0, cash: -0.025 }, NEGL).includes('Stocks +2.5%')
);
assert.ok(
  formatNextFlipImpactLine({ stocks: 0.025, gold: 0, btc: 0, cash: -0.025 }, NEGL).includes('Cash -2.5%')
);

assert.ok(formatSleeveThresholdDistanceLine(2, 0, 0.08).includes('from neutral'));
assert.ok(formatSleeveThresholdDistanceLine(0, 2, 0.12).includes('from bullish'));

console.log('pressureDisplay.test.ts: ok');
