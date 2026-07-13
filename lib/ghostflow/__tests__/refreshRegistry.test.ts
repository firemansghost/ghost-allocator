/**
 * GhostFlow refresh registry — inventory and contract invariants.
 */

import assert from 'assert';
import {
  CBOE_VIX_ADAPTER_ID,
  CBOE_VIX_PARSER_VERSION,
  CBOE_VIX_SOURCE_FAMILY_ID,
  CBOE_VIX_SOURCE_LOCATOR,
  CBOE_VIX_SOURCE_NAME,
} from '../refresh/adapters/cboeVixHistoryCsvMeta';
import {
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SOURCE_NAME,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
} from '../refresh/adapters/cftcTffSocrataMeta';
import {
  CFTC_TFF_TREASURY_ADAPTER_ID,
  CFTC_TFF_TREASURY_PARSER_VERSION,
  CFTC_TFF_TREASURY_SOURCE_LOCATOR,
  CFTC_TFF_TREASURY_SOURCE_NAME,
} from '../refresh/adapters/cftcTffTreasurySocrataMeta';
import {
  FRB_H15_ADAPTER_ID,
  FRB_H15_PARSER_VERSION,
  FRB_H15_SOURCE_FAMILY_ID,
  FRB_H15_SOURCE_LOCATOR,
  FRB_H15_SOURCE_NAME,
} from '../refresh/adapters/frbH15TreasuryYieldsMeta';
import {
  assertGhostFlowRefreshRegistryValid,
  GATE_C_ARTIFACT_IDS,
  GATE_C_CANDIDATE_GROUP_ID,
  GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS,
  GHOSTFLOW_REFRESH_REGISTRY,
  validateGhostFlowRefreshRegistry,
} from '../refresh/registry';
import type {
  GhostFlowDisplayOnlyRegistryEntry,
  GhostFlowRefreshRegistryEntry,
  GhostFlowScoreFedRegistryEntry,
  GhostFlowSourceAdapter,
  GhostFlowTreasuryRegistryEntry,
} from '../refresh/types';

const EXPECTED_SCORE_FED = [
  'volatilityRegime',
  'marketBreadth',
  'etfNetIssuance',
  'passiveShareProxy',
  'activeIndexFlow',
  'indexConcentration',
] as const;

const EXPECTED_DISPLAY = [
  'systematicFlowProxy',
  'leveredEtfRebalancePressure',
  'retirementFlowPressureProxy',
  'optionsActivityProxy',
  'indexInclusionEventProxy',
  'capWeightPremiumProxy',
  'tailSkewContext',
] as const;

const EXPECTED_TREASURY = [
  'treasuryFuturesPositioningProxy',
  'treasuryLongEndIncomeLens',
] as const;

const EXPECTED_ALL = [
  ...EXPECTED_SCORE_FED,
  ...EXPECTED_DISPLAY,
  ...EXPECTED_TREASURY,
] as const;

const MOCK_SCORE_INPUTS = [
  'systematicStrategyPressure',
  'retirementFlowPressureProxy',
  'leveredEtfRebalancePressure',
] as const;

/** Exact cadence + freshness policy mappings (authoritative operating metadata). */
const EXPECTED_CADENCE_FRESHNESS = {
  volatilityRegime: {
    cadence: 'daily_trading',
    freshnessPolicyId: 'daily_trading_v1',
  },
  marketBreadth: {
    cadence: 'daily_trading',
    freshnessPolicyId: 'daily_trading_v1',
  },
  etfNetIssuance: {
    cadence: 'weekly',
    freshnessPolicyId: 'weekly_calendar_v1',
  },
  passiveShareProxy: {
    cadence: 'monthly',
    freshnessPolicyId: 'monthly_calendar_v1',
  },
  activeIndexFlow: {
    cadence: 'monthly',
    freshnessPolicyId: 'monthly_calendar_v1',
  },
  indexConcentration: {
    cadence: 'monthly',
    freshnessPolicyId: 'monthly_calendar_v1',
  },
  systematicFlowProxy: {
    cadence: 'weekly',
    freshnessPolicyId: 'cftc_weekly_release_v1',
  },
  leveredEtfRebalancePressure: {
    cadence: 'weekly',
    freshnessPolicyId: 'levered_etf_release_v1',
  },
  retirementFlowPressureProxy: {
    cadence: 'quarterly',
    freshnessPolicyId: 'retirement_quarterly_release_v1',
  },
  optionsActivityProxy: {
    cadence: 'daily_trading',
    freshnessPolicyId: 'daily_trading_v1',
  },
  indexInclusionEventProxy: {
    cadence: 'event',
    freshnessPolicyId: 'monthly_calendar_v1',
  },
  capWeightPremiumProxy: {
    cadence: 'weekly',
    freshnessPolicyId: 'weekly_calendar_v1',
  },
  tailSkewContext: {
    cadence: 'daily_trading',
    freshnessPolicyId: 'daily_trading_v1',
  },
  treasuryFuturesPositioningProxy: {
    cadence: 'weekly',
    freshnessPolicyId: 'weekly_calendar_v1',
  },
  treasuryLongEndIncomeLens: {
    cadence: 'daily_trading',
    freshnessPolicyId: 'daily_trading_v1',
  },
} as const;

assertGhostFlowRefreshRegistryValid();

const issues = validateGhostFlowRefreshRegistry();
assert.deepStrictEqual(issues, []);

const ids = GHOSTFLOW_REFRESH_REGISTRY.map((e) => e.artifactId);
assert.deepStrictEqual([...ids].sort(), [...EXPECTED_ALL].sort());
assert.strictEqual(GHOSTFLOW_REFRESH_REGISTRY.length, 15);

const paths = GHOSTFLOW_REFRESH_REGISTRY.map((e) => e.artifactPath);
assert.strictEqual(new Set(ids).size, ids.length);
assert.strictEqual(new Set(paths).size, paths.length);

const scoreFed = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e): e is GhostFlowScoreFedRegistryEntry => e.lane === 'score_fed_equity'
);
const displayOnly = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e): e is GhostFlowDisplayOnlyRegistryEntry => e.lane === 'display_only_equity'
);
const treasury = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e): e is GhostFlowTreasuryRegistryEntry => e.lane === 'treasury_display'
);

assert.strictEqual(scoreFed.length, 6);
assert.strictEqual(displayOnly.length, 7);
assert.strictEqual(treasury.length, 2);
assert.deepStrictEqual(
  scoreFed.map((e) => e.artifactId).sort(),
  [...EXPECTED_SCORE_FED].sort()
);
assert.deepStrictEqual(
  displayOnly.map((e) => e.artifactId).sort(),
  [...EXPECTED_DISPLAY].sort()
);
assert.deepStrictEqual(
  treasury.map((e) => e.artifactId).sort(),
  [...EXPECTED_TREASURY].sort()
);

// Gate C atomicity
const gateC = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e) => e.candidateGroupId === GATE_C_CANDIDATE_GROUP_ID
);
assert.strictEqual(gateC.length, 2);
assert.deepStrictEqual(
  gateC.map((e) => e.artifactId).sort(),
  [...GATE_C_ARTIFACT_IDS].sort()
);
for (const entry of gateC) {
  assert.strictEqual(entry.acceptanceUnit, 'candidate_group');
  assert.strictEqual(entry.referenceDateRole, 'gate_c_required');
  assert.strictEqual(entry.lane, 'score_fed_equity');
  assert.strictEqual(entry.failureSeverity, 'blocking_score_fed');
}

// Unrelated score-fed failures remain isolated
const nonGateCScoreFed = scoreFed.filter(
  (e) => e.candidateGroupId !== GATE_C_CANDIDATE_GROUP_ID
);
assert.strictEqual(nonGateCScoreFed.length, 4);
for (const entry of nonGateCScoreFed) {
  assert.strictEqual(entry.acceptanceUnit, 'artifact');
  assert.ok(entry.candidateGroupId.trim().length > 0);
  assert.notStrictEqual(entry.candidateGroupId, GATE_C_CANDIDATE_GROUP_ID);
}
assert.strictEqual(
  new Set(nonGateCScoreFed.map((e) => e.candidateGroupId)).size,
  nonGateCScoreFed.length
);

// Score-fed vs display/Treasury firewall
for (const entry of scoreFed) {
  assert.ok(entry.scoreInputs.length >= 1);
  assert.strictEqual(entry.failureSeverity, 'blocking_score_fed');
}
for (const entry of displayOnly) {
  assert.ok(!('scoreInputs' in entry));
  assert.strictEqual(entry.failureSeverity, 'nonfatal_display');
}
for (const entry of treasury) {
  assert.ok(!('scoreInputs' in entry));
  assert.strictEqual(entry.failureSeverity, 'nonfatal_treasury');
}

// Passive-share documents direct + derived inputs
const passiveShare = scoreFed.find((e) => e.artifactId === 'passiveShareProxy');
assert.ok(passiveShare);
assert.deepStrictEqual(passiveShare.scoreInputs, [
  {
    axis: 'structural',
    key: 'passiveShareProxy',
    relationship: 'direct',
  },
  {
    axis: 'structural',
    key: 'modelZoneProximity',
    relationship: 'derived',
  },
]);

// MOCK score slots and derived distance-65 absent from registry inventory
assert.ok(!ids.includes('systematicStrategyPressure' as never));
assert.ok(!ids.includes('distance-65' as never));
assert.ok(!ids.includes('modelZoneProximity' as never));
for (const entry of scoreFed) {
  for (const input of entry.scoreInputs) {
    if (input.axis === 'passive') {
      assert.ok(
        !(MOCK_SCORE_INPUTS as readonly string[]).includes(input.key),
        `registry must not treat MOCK slot ${input.key} as a score-fed source input`
      );
    }
  }
}

// Human approval for all
for (const entry of GHOSTFLOW_REFRESH_REGISTRY) {
  assert.strictEqual(entry.approvalPolicy, 'human_required');
}

// No Marketstack in production registry
const serialized = JSON.stringify(GHOSTFLOW_REFRESH_REGISTRY).toLowerCase();
assert.ok(!serialized.includes('marketstack'));

// Negative: validator inspects the passed registry, not only the global constant
const marketstackPoisoned: GhostFlowRefreshRegistryEntry[] = [
  {
    ...GHOSTFLOW_REFRESH_REGISTRY[0],
    canonicalSource: {
      ...GHOSTFLOW_REFRESH_REGISTRY[0].canonicalSource,
      sourceName: 'Marketstack EOD export',
      sourceLocator: 'https://api.marketstack.com/v1/eod',
    },
  },
];
const poisonedIssues = validateGhostFlowRefreshRegistry(marketstackPoisoned);
assert.ok(
  poisonedIssues.some((i) => i.code === 'marketstack_reference'),
  'custom registry containing Marketstack must fail validation'
);
assert.deepStrictEqual(validateGhostFlowRefreshRegistry(), []);

// Readiness classifications
const byId = Object.fromEntries(
  GHOSTFLOW_REFRESH_REGISTRY.map((e) => [e.artifactId, e])
) as Record<(typeof EXPECTED_ALL)[number], (typeof GHOSTFLOW_REFRESH_REGISTRY)[number]>;

assert.strictEqual(byId.volatilityRegime.automationReadiness, 'green');
assert.strictEqual(byId.systematicFlowProxy.automationReadiness, 'green');
assert.strictEqual(byId.treasuryFuturesPositioningProxy.automationReadiness, 'green');
assert.strictEqual(byId.treasuryLongEndIncomeLens.automationReadiness, 'green');

assert.strictEqual(byId.marketBreadth.automationReadiness, 'yellow');
assert.strictEqual(byId.etfNetIssuance.automationReadiness, 'yellow');
assert.strictEqual(byId.passiveShareProxy.automationReadiness, 'yellow');
assert.strictEqual(byId.activeIndexFlow.automationReadiness, 'yellow');
assert.strictEqual(byId.indexConcentration.automationReadiness, 'yellow');
assert.strictEqual(byId.optionsActivityProxy.automationReadiness, 'yellow');
assert.strictEqual(byId.capWeightPremiumProxy.automationReadiness, 'yellow');
assert.strictEqual(byId.tailSkewContext.automationReadiness, 'yellow');

assert.strictEqual(byId.leveredEtfRebalancePressure.automationReadiness, 'red');
assert.strictEqual(byId.indexInclusionEventProxy.automationReadiness, 'red');
assert.strictEqual(byId.retirementFlowPressureProxy.automationReadiness, 'red');

// Authentication classifications
assert.deepStrictEqual(byId.volatilityRegime.authentication, { kind: 'none' });
assert.deepStrictEqual(byId.treasuryLongEndIncomeLens.authentication, {
  kind: 'none',
});
assert.deepStrictEqual(byId.leveredEtfRebalancePressure.authentication, {
  kind: 'manual_operator',
});
assert.deepStrictEqual(byId.indexInclusionEventProxy.authentication, {
  kind: 'manual_operator',
});
assert.deepStrictEqual(byId.capWeightPremiumProxy.authentication, {
  kind: 'manual_operator',
});

// Adapter implementation-status rules — VIX + CFTC systematic + CFTC Treasury + H.15
for (const entry of GHOSTFLOW_REFRESH_REGISTRY) {
  if (entry.artifactId === 'volatilityRegime') {
    assert.strictEqual(entry.adapter.implementationStatus, 'implemented');
    assert.strictEqual(entry.adapter.adapterId, CBOE_VIX_ADAPTER_ID);
    if (entry.adapter.implementationStatus === 'implemented') {
      assert.strictEqual(entry.adapter.parserVersion, CBOE_VIX_PARSER_VERSION);
    }
    assert.strictEqual(entry.canonicalSource.sourceFamilyId, CBOE_VIX_SOURCE_FAMILY_ID);
    assert.strictEqual(entry.canonicalSource.sourceName, CBOE_VIX_SOURCE_NAME);
    assert.strictEqual(entry.canonicalSource.sourceLocator, CBOE_VIX_SOURCE_LOCATOR);
    assert.strictEqual(entry.candidateGroupId, GATE_C_CANDIDATE_GROUP_ID);
    assert.strictEqual(entry.acceptanceUnit, 'candidate_group');
    assert.strictEqual(entry.referenceDateRole, 'gate_c_required');
    assert.strictEqual(entry.failureSeverity, 'blocking_score_fed');
    continue;
  }
  if (entry.artifactId === 'systematicFlowProxy') {
    assert.strictEqual(entry.adapter.implementationStatus, 'implemented');
    assert.strictEqual(entry.adapter.adapterId, CFTC_TFF_SYSTEMATIC_ADAPTER_ID);
    if (entry.adapter.implementationStatus === 'implemented') {
      assert.strictEqual(
        entry.adapter.parserVersion,
        CFTC_TFF_SYSTEMATIC_PARSER_VERSION
      );
    }
    assert.strictEqual(entry.canonicalSource.sourceFamilyId, CFTC_TFF_SOURCE_FAMILY_ID);
    assert.strictEqual(entry.canonicalSource.sourceName, CFTC_TFF_SOURCE_NAME);
    assert.strictEqual(
      entry.canonicalSource.sourceLocator,
      CFTC_TFF_DATASET_PAGE_LOCATOR
    );
    assert.strictEqual(entry.lane, 'display_only_equity');
    assert.strictEqual(entry.automationReadiness, 'green');
    assert.strictEqual(entry.failureSeverity, 'nonfatal_display');
    assert.strictEqual(entry.referenceDateRole, 'lagging_allowed');
    assert.deepStrictEqual(entry.authentication, { kind: 'none' });
    assert.strictEqual(entry.approvalPolicy, 'human_required');
    continue;
  }
  if (entry.artifactId === 'treasuryFuturesPositioningProxy') {
    assert.strictEqual(entry.adapter.implementationStatus, 'implemented');
    assert.strictEqual(entry.adapter.adapterId, CFTC_TFF_TREASURY_ADAPTER_ID);
    if (entry.adapter.implementationStatus === 'implemented') {
      assert.strictEqual(
        entry.adapter.parserVersion,
        CFTC_TFF_TREASURY_PARSER_VERSION
      );
    }
    assert.strictEqual(entry.canonicalSource.sourceFamilyId, CFTC_TFF_SOURCE_FAMILY_ID);
    assert.strictEqual(
      entry.canonicalSource.sourceName,
      CFTC_TFF_TREASURY_SOURCE_NAME
    );
    assert.strictEqual(
      entry.canonicalSource.sourceLocator,
      CFTC_TFF_TREASURY_SOURCE_LOCATOR
    );
    assert.strictEqual(entry.lane, 'treasury_display');
    assert.strictEqual(entry.automationReadiness, 'green');
    assert.strictEqual(entry.failureSeverity, 'nonfatal_treasury');
    assert.strictEqual(entry.referenceDateRole, 'lagging_allowed');
    assert.deepStrictEqual(entry.authentication, { kind: 'none' });
    assert.strictEqual(entry.approvalPolicy, 'human_required');
    continue;
  }
  if (entry.artifactId === 'treasuryLongEndIncomeLens') {
    assert.strictEqual(entry.adapter.implementationStatus, 'implemented');
    assert.strictEqual(entry.adapter.adapterId, FRB_H15_ADAPTER_ID);
    if (entry.adapter.implementationStatus === 'implemented') {
      assert.strictEqual(entry.adapter.parserVersion, FRB_H15_PARSER_VERSION);
    }
    assert.strictEqual(entry.canonicalSource.sourceFamilyId, FRB_H15_SOURCE_FAMILY_ID);
    assert.strictEqual(entry.canonicalSource.sourceName, FRB_H15_SOURCE_NAME);
    assert.strictEqual(entry.canonicalSource.sourceLocator, FRB_H15_SOURCE_LOCATOR);
    assert.strictEqual(entry.lane, 'treasury_display');
    assert.strictEqual(entry.automationReadiness, 'green');
    assert.strictEqual(entry.failureSeverity, 'nonfatal_treasury');
    assert.strictEqual(entry.referenceDateRole, 'lagging_allowed');
    assert.deepStrictEqual(entry.authentication, { kind: 'none' });
    assert.strictEqual(entry.approvalPolicy, 'human_required');
    assert.strictEqual(entry.candidateGroupId, 'frb_h15_treasury_long_end');
    continue;
  }
  assert.ok(
    entry.adapter.implementationStatus === 'planned' ||
      entry.adapter.implementationStatus === 'spike_available'
  );
  assert.ok(!('parserVersion' in entry.adapter));
}

assert.strictEqual(
  byId.treasuryLongEndIncomeLens.adapter.implementationStatus,
  'implemented'
);
if (byId.treasuryLongEndIncomeLens.adapter.implementationStatus === 'implemented') {
  assert.strictEqual(byId.treasuryLongEndIncomeLens.adapter.parserVersion, '1.0.0');
}
assert.strictEqual(
  byId.treasuryLongEndIncomeLens.canonicalSource.sourceFamilyId,
  'frb_h15_treasury_yields'
);
assert.strictEqual(
  byId.treasuryLongEndIncomeLens.adapter.adapterId,
  'frb-h15-treasury-yields-csv'
);

assert.deepStrictEqual([...GATE_C_ARTIFACT_IDS].sort(), [
  'marketBreadth',
  'volatilityRegime',
]);

const spikeIds = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e) => e.adapter.implementationStatus === 'spike_available'
).map((e) => e.artifactId)
  .sort();
assert.deepStrictEqual(spikeIds, [
  'capWeightPremiumProxy',
  'leveredEtfRebalancePressure',
  'optionsActivityProxy',
  'retirementFlowPressureProxy',
  'tailSkewContext',
]);

const implementedIds = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e) => e.adapter.implementationStatus === 'implemented'
)
  .map((e) => e.artifactId)
  .sort();
assert.deepStrictEqual(implementedIds, [
  'systematicFlowProxy',
  'treasuryFuturesPositioningProxy',
  'treasuryLongEndIncomeLens',
  'volatilityRegime',
]);

const plannedIds = GHOSTFLOW_REFRESH_REGISTRY.filter(
  (e) => e.adapter.implementationStatus === 'planned'
).map((e) => e.artifactId)
  .sort();
assert.deepStrictEqual(plannedIds, [
  'activeIndexFlow',
  'etfNetIssuance',
  'indexConcentration',
  'indexInclusionEventProxy',
  'marketBreadth',
  'passiveShareProxy',
]);

// Exact cadence + freshnessPolicyId mappings for all 15
for (const entry of GHOSTFLOW_REFRESH_REGISTRY) {
  const expected =
    EXPECTED_CADENCE_FRESHNESS[entry.artifactId as keyof typeof EXPECTED_CADENCE_FRESHNESS];
  assert.ok(expected, `missing expected mapping for ${entry.artifactId}`);
  assert.strictEqual(
    entry.cadence,
    expected.cadence,
    `${entry.artifactId} cadence`
  );
  assert.strictEqual(
    entry.freshnessPolicyId,
    expected.freshnessPolicyId,
    `${entry.artifactId} freshnessPolicyId`
  );
}

assert.ok(!serialized.includes('freshmax'));
assert.ok(!serialized.includes('staleafter'));
assert.ok(!/"freshMaxDays"/.test(JSON.stringify(GHOSTFLOW_REFRESH_REGISTRY)));
assert.ok(!/"staleAfterDays"/.test(JSON.stringify(GHOSTFLOW_REFRESH_REGISTRY)));

// History policy: accepted normalized observations only — no raw-source commit policy
for (const entry of GHOSTFLOW_REFRESH_REGISTRY) {
  assert.strictEqual(entry.historyPolicy, 'accepted_normalized_observation');
}
assert.ok(!serialized.includes('raw_source'));
assert.ok(!serialized.includes('commit_raw'));
assert.ok(!serialized.includes('raw_history'));
assert.ok(!serialized.includes('research_append_optional'));
assert.ok(!serialized.includes('operator_study_only'));

// Retirement locator is stable (not a quarterly release URL)
assert.strictEqual(
  byId.retirementFlowPressureProxy.canonicalSource.sourceLocator,
  'https://www.ici.org/research/statistics/quarterly-retirement-market-data'
);
assert.ok(
  !byId.retirementFlowPressureProxy.canonicalSource.sourceLocator.includes('ret_26_q1')
);

// Durable provenance excludes local-path / secret fields
for (const key of GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS) {
  assert.ok(!/path|tmp|workspace|body|apiKey|token|cookie/i.test(key));
}

// Adapter contract: implemented instances require parserVersion; metadata envelopes exist
type _AdapterRequiresParserVersion = GhostFlowSourceAdapter<
  unknown,
  unknown,
  unknown
>['parserVersion'];
const _parserVersionCheck: _AdapterRequiresParserVersion = '1.0.0';
assert.strictEqual(typeof _parserVersionCheck, 'string');

console.log('ghostflow/refreshRegistry.test.ts: ok');
