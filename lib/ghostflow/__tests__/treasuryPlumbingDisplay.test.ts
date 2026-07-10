/**
 * GhostFlow v1.7e — Treasury Plumbing display-only lane tests.
 */

import assert from 'assert';
import { buildGhostFlowSnapshot } from '../buildSnapshot';
import { loadTreasuryFuturesPositioningProxyArtifact } from '../artifacts/treasuryFuturesPositioningProxy';
import { loadTreasuryLongEndIncomeLensArtifact } from '../artifacts/treasuryLongEndIncomeLens';
import {
  buildTreasuryFuturesDisplayCard,
  buildTreasuryLongEndDisplayCard,
  buildTreasuryPlumbingDisplay,
  buildTreasuryPlumbingDisplayFromValidations,
} from '../treasuryPlumbingDisplay';

const SCORE_FIELD_PATTERN = /mappedPressureScore|pressureScore|candidatePressureScore/;

function assertNoScoreFieldsInJson(obj: unknown, path = 'root'): void {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      assertNoScoreFieldsInJson(obj[i], `${path}[${i}]`);
    }
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    assert.ok(!SCORE_FIELD_PATTERN.test(key), `unexpected score field at ${path}.${key}`);
    assertNoScoreFieldsInJson(value, `${path}.${key}`);
  }
}

const display = buildTreasuryPlumbingDisplay();

assert.strictEqual(display.sectionTitle, 'Treasury Plumbing');
assert.strictEqual(display.cards.length, 2);

for (const card of display.cards) {
  assert.strictEqual(card.badge, 'DISPLAY ONLY');
}

const futuresCard = display.cards.find((c) => c.id === 'treasury-futures-positioning-proxy')!;
const incomeCard = display.cards.find((c) => c.id === 'treasury-long-end-income-lens')!;

assert.strictEqual(futuresCard.status, 'ok');
assert.strictEqual(incomeCard.status, 'ok');

assert.ok(futuresCard.primaryValue.includes('34.6'));
assert.ok(futuresCard.primaryValue.toLowerCase().includes('net short'));

assert.ok(incomeCard.primaryValue.includes('4.97'));
assert.ok(incomeCard.primaryValue.includes('2.78'));
assert.ok(incomeCard.primaryValue.includes('0.49'));

assertNoScoreFieldsInJson(display);

const futuresProd = loadTreasuryFuturesPositioningProxyArtifact();
const incomeProd = loadTreasuryLongEndIncomeLensArtifact();
assert.ok(futuresProd.ok);
assert.ok(incomeProd.ok);

const invalidFutures = buildTreasuryFuturesDisplayCard({
  ok: false,
  errors: ['synthetic validation failure for test'],
});
assert.strictEqual(invalidFutures.status, 'unavailable');

const stillOkIncome = buildTreasuryLongEndDisplayCard(incomeProd);
assert.strictEqual(stillOkIncome.status, 'ok');

const mixed = buildTreasuryPlumbingDisplayFromValidations(
  { ok: false, errors: ['futures invalid'] },
  incomeProd
);
assert.strictEqual(mixed.cards[0].status, 'unavailable');
assert.strictEqual(mixed.cards[1].status, 'ok');

const { raw, meta } = buildGhostFlowSnapshot();
assert.strictEqual(meta.publicSignalCount, 13);
assert.ok(!raw.signals.some((s) => s.id === 'treasury-futures-positioning-proxy'));
assert.ok(!raw.signals.some((s) => s.id === 'treasury-long-end-income-lens'));

console.log('ghostflow/treasuryPlumbingDisplay.test.ts: ok');
