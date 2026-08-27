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
  formatTreasuryFuturesPrimaryValue,
  formatTreasuryLongEndPrimaryValue,
} from '../treasuryPlumbingDisplay';
import { validateTreasuryLongEndIncomeLensArtifact } from '../artifacts/treasuryLongEndIncomeLens';
import {
  TREASURY_LONG_END_BOARD_CAVEATS,
  TREASURY_LONG_END_BOARD_RELEASE_URL,
  TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
  TREASURY_LONG_END_BOARD_SOURCE_NAME,
  TREASURY_LONG_END_BOARD_SOURCE_NOTE,
  TREASURY_LONG_END_BOARD_SOURCE_SERIES,
} from '../artifacts/treasuryLongEndIncomeLens';
import { PRODUCTION_SCORE_BASELINE } from './fixtures/productionScoreBaseline';

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

assertNoScoreFieldsInJson(display);

const futuresProd = loadTreasuryFuturesPositioningProxyArtifact();
const incomeProd = loadTreasuryLongEndIncomeLensArtifact();
assert.ok(futuresProd.ok);
assert.ok(incomeProd.ok);
if (!futuresProd.ok) throw new Error('unreachable');
if (!incomeProd.ok) throw new Error('unreachable');

assert.strictEqual(
  futuresCard.primaryValue,
  formatTreasuryFuturesPrimaryValue(futuresProd.artifact.observations)
);
assert.ok(futuresCard.primaryValue.toLowerCase().includes('net short'));
assert.strictEqual(futuresCard.dataQuality, 'verified_automated');
assert.strictEqual(futuresCard.publishedAt, undefined);

assert.strictEqual(
  incomeCard.primaryValue,
  formatTreasuryLongEndPrimaryValue(incomeProd.artifact.observations)
);
assert.ok(incomeCard.statusLabel.includes('Board H.15'));
assert.ok(!incomeCard.statusLabel.includes('FRED'));
assert.ok(incomeCard.explanation.includes('Board H.15'));
assert.ok(!incomeCard.explanation.includes('FRED'));
assert.ok(!incomeCard.explanation.toLowerCase().includes('breakeven'));
assert.ok(!incomeCard.detailRows.some((r) => r.label === '10Y breakeven'));
assert.ok(
  incomeCard.detailRows.some((r) => r.label === 'Data quality' && r.value === 'Verified automated')
);
assert.strictEqual(incomeCard.publishedAt, undefined);
assert.strictEqual(incomeCard.sourceUrl, TREASURY_LONG_END_BOARD_RELEASE_URL);

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
assert.strictEqual(meta.publicSignalCount, PRODUCTION_SCORE_BASELINE.publicSignalCount);
assert.ok(!raw.signals.some((s) => s.id === 'treasury-futures-positioning-proxy'));
assert.ok(!raw.signals.some((s) => s.id === 'treasury-long-end-income-lens'));

const boardFixture = {
  artifactVersion: '1',
  signalId: 'treasury-long-end-income-lens',
  asOf: '2026-08-24',
  source: {
    name: TREASURY_LONG_END_BOARD_SOURCE_NAME,
    url: TREASURY_LONG_END_BOARD_RELEASE_URL,
    note: TREASURY_LONG_END_BOARD_SOURCE_NOTE,
    series: TREASURY_LONG_END_BOARD_SOURCE_SERIES.map((spec) => ({
      id: spec.id,
      label: spec.label,
      url: TREASURY_LONG_END_BOARD_RELEASE_URL,
      role: spec.role,
    })),
  },
  observationType: 'treasury_long_end_income_snapshot',
  seriesDefinition: TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
  updateFrequency: 'daily',
  dataQuality: 'verified_automated',
  mappingStatus: 'not_final',
  caveats: [...TREASURY_LONG_END_BOARD_CAVEATS],
  observations: {
    thirtyYearNominalYieldPct: 4.97,
    thirtyYearTipsRealYieldPct: 2.78,
    twoYearYieldPct: 4.17,
    fiveYearYieldPct: 4.24,
    tenYearYieldPct: 4.48,
    curve2s30sPct: 0.8,
    curve5s30sPct: 0.73,
    curve10s30sPct: 0.49,
    nominalYieldPercentile: null,
    realYieldPercentile: null,
    mappingStatus: 'not_final',
  },
};

const boardValidation = validateTreasuryLongEndIncomeLensArtifact(boardFixture, {
  mode: 'production',
});
assert.ok(boardValidation.ok, boardValidation.ok ? '' : boardValidation.errors.join('; '));

const boardCard = buildTreasuryLongEndDisplayCard(boardValidation);
assert.ok(boardCard.statusLabel.includes('Board H.15'));
assert.ok(!boardCard.explanation.includes('FRED'));
assert.ok(!boardCard.explanation.toLowerCase().includes('breakeven'));
assert.ok(!boardCard.detailRows.some((r) => r.label === '10Y breakeven'));
assert.ok(boardCard.detailRows.some((r) => r.label === 'Data quality' && r.value === 'Verified automated'));
assert.strictEqual(boardCard.publishedAt, undefined);

console.log('ghostflow/treasuryPlumbingDisplay.test.ts: ok');
