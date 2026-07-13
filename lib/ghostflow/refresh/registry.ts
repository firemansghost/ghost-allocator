/**
 * GhostFlow refresh registry — machine-readable inventory of source-backed artifacts.
 * Documents source→model relationships; does not wire scoring or refresh production data.
 */

import {
  GATE_C_ARTIFACT_IDS,
  GATE_C_CANDIDATE_GROUP_ID,
  GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS,
  type GhostFlowRefreshRegistryEntry,
} from './types';
import {
  CBOE_VIX_ADAPTER_ID,
  CBOE_VIX_ARTIFACT_ID,
  CBOE_VIX_PARSER_VERSION,
  CBOE_VIX_SOURCE_FAMILY_ID,
  CBOE_VIX_SOURCE_LOCATOR,
  CBOE_VIX_SOURCE_NAME,
} from './adapters/cboeVixHistoryCsvMeta';
import {
  CFTC_TFF_DATASET_PAGE_LOCATOR,
  CFTC_TFF_SOURCE_FAMILY_ID,
  CFTC_TFF_SOURCE_NAME,
  CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
  CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
  CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
} from './adapters/cftcTffSocrataMeta';

export {
  GATE_C_ARTIFACT_IDS,
  GATE_C_CANDIDATE_GROUP_ID,
  GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS,
} from './types';

export const GHOSTFLOW_REFRESH_REGISTRY = [
  // --- Score-fed equity (6) ---
  {
    artifactId: CBOE_VIX_ARTIFACT_ID,
    artifactPath: 'data/ghostflow/artifacts/volatilityRegime.v1.json',
    lane: 'score_fed_equity',
    cadence: 'daily_trading',
    candidateGroupId: GATE_C_CANDIDATE_GROUP_ID,
    acceptanceUnit: 'candidate_group',
    canonicalSource: {
      sourceFamilyId: CBOE_VIX_SOURCE_FAMILY_ID,
      sourceName: CBOE_VIX_SOURCE_NAME,
      sourceLocator: CBOE_VIX_SOURCE_LOCATOR,
    },
    sourceFormat: 'csv',
    adapter: {
      adapterId: CBOE_VIX_ADAPTER_ID,
      implementationStatus: 'implemented',
      parserVersion: CBOE_VIX_PARSER_VERSION,
    },
    freshnessPolicyId: 'daily_trading_v1',
    referenceDateRole: 'gate_c_required',
    automationReadiness: 'green',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
      {
        axis: 'passive',
        key: 'optionsVolatilityAmplifier',
        relationship: 'direct',
      },
    ],
  },
  {
    artifactId: 'marketBreadth',
    artifactPath: 'data/ghostflow/artifacts/marketBreadth.v1.json',
    lane: 'score_fed_equity',
    cadence: 'daily_trading',
    candidateGroupId: GATE_C_CANDIDATE_GROUP_ID,
    acceptanceUnit: 'candidate_group',
    canonicalSource: {
      sourceFamilyId: 'stockcharts_spxa50r',
      sourceName: 'StockCharts S&P 500 % Above 50-Day SMA ($SPXA50R)',
      sourceLocator:
        'https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R',
    },
    sourceFormat: 'html',
    adapter: {
      adapterId: 'stockcharts-spxa50r-html',
      implementationStatus: 'planned',
    },
    freshnessPolicyId: 'daily_trading_v1',
    referenceDateRole: 'gate_c_required',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
      {
        axis: 'structural',
        key: 'breadthWeakness',
        relationship: 'direct',
      },
    ],
  },
  {
    artifactId: 'etfNetIssuance',
    artifactPath: 'data/ghostflow/artifacts/etfNetIssuance.v1.json',
    lane: 'score_fed_equity',
    cadence: 'weekly',
    candidateGroupId: 'etf_net_issuance_weekly',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'ici_etf_net_issuance',
      sourceName: 'ICI Estimated ETF Net Issuance',
      sourceLocator: 'https://www.ici.org/research/stats/etf_flows',
    },
    sourceFormat: 'html',
    adapter: {
      adapterId: 'ici-etf-flows-html',
      implementationStatus: 'planned',
    },
    freshnessPolicyId: 'weekly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
      {
        axis: 'passive',
        key: 'etfFundFlowImpulse',
        relationship: 'direct',
      },
    ],
  },
  {
    artifactId: 'passiveShareProxy',
    artifactPath: 'data/ghostflow/artifacts/passiveShareProxy.v1.json',
    lane: 'score_fed_equity',
    cadence: 'monthly',
    candidateGroupId: 'ici_monthly_passive_share',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'ici_active_index_monthly',
      sourceName: 'ICI Active and Index Investing',
      sourceLocator: 'https://www.ici.org/research/stats/combined_active_index',
    },
    sourceFormat: 'html',
    adapter: {
      adapterId: 'ici-active-index-passive-share-html',
      implementationStatus: 'planned',
    },
    freshnessPolicyId: 'monthly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
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
    ],
  },
  {
    artifactId: 'activeIndexFlow',
    artifactPath: 'data/ghostflow/artifacts/activeIndexFlow.v1.json',
    lane: 'score_fed_equity',
    cadence: 'monthly',
    candidateGroupId: 'ici_monthly_active_index_flow',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'ici_active_index_monthly',
      sourceName: 'ICI Active and Index Investing',
      sourceLocator: 'https://www.ici.org/research/stats/combined_active_index',
    },
    sourceFormat: 'html',
    adapter: {
      adapterId: 'ici-active-index-flow-html',
      implementationStatus: 'planned',
    },
    freshnessPolicyId: 'monthly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
      {
        axis: 'structural',
        key: 'activeShareOffsetProxy',
        relationship: 'direct',
      },
    ],
  },
  {
    artifactId: 'indexConcentration',
    artifactPath: 'data/ghostflow/artifacts/indexConcentration.v1.json',
    lane: 'score_fed_equity',
    cadence: 'monthly',
    candidateGroupId: 'ssga_spy_concentration',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'ssga_spy_factsheet_pdf',
      sourceName: 'SSGA SPY US Monthly Fact Sheet',
      sourceLocator:
        'https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf',
    },
    sourceFormat: 'pdf',
    adapter: {
      adapterId: 'ssga-spy-factsheet-pdf',
      implementationStatus: 'planned',
    },
    freshnessPolicyId: 'monthly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'blocking_score_fed',
    historyPolicy: 'accepted_normalized_observation',
    scoreInputs: [
      {
        axis: 'structural',
        key: 'indexConcentration',
        relationship: 'direct',
      },
    ],
  },

  // --- Display-only equity (7) ---
  {
    artifactId: CFTC_TFF_SYSTEMATIC_ARTIFACT_ID,
    artifactPath: 'data/ghostflow/artifacts/systematicFlowProxy.v1.json',
    lane: 'display_only_equity',
    cadence: 'weekly',
    candidateGroupId: 'cftc_tff_systematic_display',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: CFTC_TFF_SOURCE_FAMILY_ID,
      sourceName: CFTC_TFF_SOURCE_NAME,
      sourceLocator: CFTC_TFF_DATASET_PAGE_LOCATOR,
    },
    sourceFormat: 'json_api',
    adapter: {
      adapterId: CFTC_TFF_SYSTEMATIC_ADAPTER_ID,
      implementationStatus: 'implemented',
      parserVersion: CFTC_TFF_SYSTEMATIC_PARSER_VERSION,
    },
    freshnessPolicyId: 'cftc_weekly_release_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'green',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'leveredEtfRebalancePressure',
    artifactPath: 'data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json',
    lane: 'display_only_equity',
    cadence: 'weekly',
    candidateGroupId: 'levered_etf_issuer_packet',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'levered_etf_issuer_operator_packet',
      sourceName:
        'ProShares + StockAnalysis fund pages; StockAnalysis index proxy daily returns',
      sourceLocator: 'operator_packet:levered-etf-aum-and-returns',
    },
    sourceFormat: 'operator_packet',
    adapter: {
      adapterId: 'levered-etf-rebalance-operator-packet',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/levered-etf-rebalance-history-study.ts',
    },
    freshnessPolicyId: 'levered_etf_release_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'red',
    approvalPolicy: 'human_required',
    authentication: { kind: 'manual_operator' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'retirementFlowPressureProxy',
    artifactPath: 'data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json',
    lane: 'display_only_equity',
    cadence: 'quarterly',
    candidateGroupId: 'ici_retirement_market_quarterly',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'ici_retirement_market_table1',
      sourceName: 'ICI — The US Retirement Market (Table 1)',
      sourceLocator:
        'https://www.ici.org/research/statistics/quarterly-retirement-market-data',
    },
    sourceFormat: 'spreadsheet',
    adapter: {
      adapterId: 'ici-retirement-table1-spreadsheet',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/retirement-flow-history-study.ts',
    },
    freshnessPolicyId: 'retirement_quarterly_release_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'red',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'optionsActivityProxy',
    artifactPath: 'data/ghostflow/artifacts/optionsActivityProxy.v1.json',
    lane: 'display_only_equity',
    cadence: 'daily_trading',
    candidateGroupId: 'occ_daily_volume_display',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'occ_daily_volume_statistics',
      sourceName: 'OCC Daily Volume Statistics — marketdata.theocc.com',
      sourceLocator:
        'https://marketdata.theocc.com/daily-volume-statistics?format=csv',
    },
    sourceFormat: 'csv',
    adapter: {
      adapterId: 'occ-daily-volume-csv',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/options-data-spike.ts',
    },
    freshnessPolicyId: 'daily_trading_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'indexInclusionEventProxy',
    artifactPath: 'data/ghostflow/artifacts/indexInclusionEventProxy.v1.json',
    lane: 'display_only_equity',
    cadence: 'event',
    candidateGroupId: 'index_inclusion_operator_intake',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'index_inclusion_operator_intake',
      sourceName: 'Nasdaq Investor Relations (index change announcements)',
      sourceLocator: 'operator_packet:index-inclusion-event-intake',
    },
    sourceFormat: 'operator_packet',
    adapter: {
      adapterId: 'index-inclusion-operator-intake',
      implementationStatus: 'planned',
    },
    // Event cadence; freshness uses shared monthly calendar evaluator semantics.
    freshnessPolicyId: 'monthly_calendar_v1',
    referenceDateRole: 'none',
    automationReadiness: 'red',
    approvalPolicy: 'human_required',
    authentication: { kind: 'manual_operator' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'capWeightPremiumProxy',
    artifactPath: 'data/ghostflow/artifacts/capWeightPremiumProxy.v1.json',
    lane: 'display_only_equity',
    cadence: 'weekly',
    candidateGroupId: 'cap_weight_premium_operator_study',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'spy_rsp_operator_study',
      sourceName: 'SPY + RSP adjusted-close CSV (operator study)',
      sourceLocator: 'operator_packet:spy-rsp-adjusted-close-study',
    },
    sourceFormat: 'derived_study',
    adapter: {
      adapterId: 'cap-weight-premium-operator-study',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/cap-weight-premium-study.ts',
    },
    freshnessPolicyId: 'weekly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'manual_operator' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'tailSkewContext',
    artifactPath: 'data/ghostflow/artifacts/tailSkewContext.v1.json',
    lane: 'display_only_equity',
    cadence: 'daily_trading',
    candidateGroupId: 'cboe_skew_display',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'cboe_skew_official_csv',
      sourceName: 'CBOE SKEW Index History',
      sourceLocator:
        'https://cdn.cboe.com/api/global/us_indices/daily_prices/SKEW_History.csv',
    },
    sourceFormat: 'csv',
    adapter: {
      adapterId: 'cboe-skew-history-csv',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/skew-source-spike.ts',
    },
    freshnessPolicyId: 'daily_trading_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'yellow',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'nonfatal_display',
    historyPolicy: 'accepted_normalized_observation',
  },

  // --- Treasury display (2) ---
  {
    artifactId: 'treasuryFuturesPositioningProxy',
    artifactPath: 'data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json',
    lane: 'treasury_display',
    cadence: 'weekly',
    candidateGroupId: 'cftc_tff_treasury_display',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'cftc_tff_socrata',
      sourceName:
        'CFTC Public Reporting Environment — TFF Futures Only (Treasury)',
      sourceLocator:
        'https://publicreporting.cftc.gov/Commitments-of-Traders/TFF-Futures-Only/gpe5-46if/about_data',
    },
    sourceFormat: 'json_api',
    adapter: {
      adapterId: 'cftc-tff-treasury-socrata',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/treasury-cftc-pre-spike.ts',
    },
    freshnessPolicyId: 'weekly_calendar_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'green',
    approvalPolicy: 'human_required',
    authentication: { kind: 'none' },
    failureSeverity: 'nonfatal_treasury',
    historyPolicy: 'accepted_normalized_observation',
  },
  {
    artifactId: 'treasuryLongEndIncomeLens',
    artifactPath: 'data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json',
    lane: 'treasury_display',
    cadence: 'daily_trading',
    candidateGroupId: 'fred_treasury_long_end',
    acceptanceUnit: 'artifact',
    canonicalSource: {
      sourceFamilyId: 'fred_treasury_yields',
      sourceName:
        'FRED — U.S. Treasury constant maturity, TIPS, and breakeven inflation',
      sourceLocator: 'https://fred.stlouisfed.org/',
    },
    sourceFormat: 'csv',
    adapter: {
      adapterId: 'fred-treasury-yields-csv',
      implementationStatus: 'spike_available',
      spikeScriptPath: 'scripts/ghostflow/fred-treasury-yields-spike.ts',
    },
    freshnessPolicyId: 'daily_trading_v1',
    referenceDateRole: 'lagging_allowed',
    automationReadiness: 'green',
    approvalPolicy: 'human_required',
    authentication: {
      kind: 'optional_env',
      envName: 'FRED_API_KEY',
    },
    failureSeverity: 'nonfatal_treasury',
    historyPolicy: 'accepted_normalized_observation',
  },
] as const satisfies readonly GhostFlowRefreshRegistryEntry[];

export type GhostFlowRegisteredArtifactId =
  (typeof GHOSTFLOW_REFRESH_REGISTRY)[number]['artifactId'];

export interface GhostFlowRefreshRegistryValidationIssue {
  code: string;
  message: string;
}

const FORBIDDEN_PROVENANCE_PATH_KEYS = [
  'localPath',
  'tmpPath',
  'workspacePath',
  'filePath',
  'absolutePath',
  'rawBody',
  'apiKey',
  'token',
  'cookie',
] as const;

function registrySerializedHaystack(
  registry: readonly GhostFlowRefreshRegistryEntry[]
): string {
  return JSON.stringify(registry).toLowerCase();
}

/**
 * Pure registry invariants for the future refresh planner.
 * Does not fetch, score, or write artifacts.
 */
export function validateGhostFlowRefreshRegistry(
  registry: readonly GhostFlowRefreshRegistryEntry[] = GHOSTFLOW_REFRESH_REGISTRY
): GhostFlowRefreshRegistryValidationIssue[] {
  const issues: GhostFlowRefreshRegistryValidationIssue[] = [];

  const artifactIds = new Set<string>();
  const artifactPaths = new Set<string>();

  for (const entry of registry) {
    if (!entry.artifactId.trim()) {
      issues.push({
        code: 'empty_artifact_id',
        message: 'Registry entry has an empty artifactId',
      });
    }
    if (artifactIds.has(entry.artifactId)) {
      issues.push({
        code: 'duplicate_artifact_id',
        message: `Duplicate artifactId: ${entry.artifactId}`,
      });
    }
    artifactIds.add(entry.artifactId);

    if (!entry.artifactPath.trim()) {
      issues.push({
        code: 'empty_artifact_path',
        message: `Empty artifactPath for ${entry.artifactId}`,
      });
    }
    if (artifactPaths.has(entry.artifactPath)) {
      issues.push({
        code: 'duplicate_artifact_path',
        message: `Duplicate artifactPath: ${entry.artifactPath}`,
      });
    }
    artifactPaths.add(entry.artifactPath);

    if (!entry.candidateGroupId.trim()) {
      issues.push({
        code: 'empty_candidate_group',
        message: `Empty candidateGroupId for ${entry.artifactId}`,
      });
    }

    if (entry.approvalPolicy !== 'human_required') {
      issues.push({
        code: 'approval_not_human',
        message: `${entry.artifactId} must require human approval`,
      });
    }

    if (entry.lane === 'score_fed_equity') {
      if (entry.scoreInputs.length < 1) {
        issues.push({
          code: 'score_fed_missing_inputs',
          message: `${entry.artifactId} must declare at least one score input`,
        });
      }
    } else if ('scoreInputs' in entry) {
      issues.push({
        code: 'non_score_fed_has_inputs',
        message: `${entry.artifactId} must not declare scoreInputs`,
      });
    }

    // Lane/severity pairs are enforced by the entry union; also assert at runtime.
    const expectedSeverity =
      entry.lane === 'score_fed_equity'
        ? 'blocking_score_fed'
        : entry.lane === 'display_only_equity'
          ? 'nonfatal_display'
          : 'nonfatal_treasury';
    if ((entry.failureSeverity as string) !== expectedSeverity) {
      issues.push({
        code: 'lane_severity_mismatch',
        message: `${entry.artifactId} lane ${entry.lane} requires ${expectedSeverity}`,
      });
    }

    const adapter = entry.adapter;
    if (adapter.implementationStatus === 'implemented') {
      if (!adapter.parserVersion.trim()) {
        issues.push({
          code: 'implemented_missing_parser_version',
          message: `${entry.artifactId} implemented adapter requires parserVersion`,
        });
      }
    } else if ('parserVersion' in adapter) {
      issues.push({
        code: 'planned_adapter_has_parser_version',
        message: `${entry.artifactId} planned/spike adapter must not claim parserVersion`,
      });
    }
  }

  const gateC = registry.filter((e) => e.candidateGroupId === GATE_C_CANDIDATE_GROUP_ID);
  const gateCIds = gateC.map((e) => e.artifactId).sort();
  const expectedGateC = [...GATE_C_ARTIFACT_IDS].sort();
  if (gateC.length !== 2 || gateCIds.join(',') !== expectedGateC.join(',')) {
    issues.push({
      code: 'gate_c_membership',
      message: `Gate C group must contain exactly ${expectedGateC.join(' and ')}`,
    });
  }
  for (const entry of gateC) {
    if (entry.acceptanceUnit !== 'candidate_group') {
      issues.push({
        code: 'gate_c_acceptance_unit',
        message: `${entry.artifactId} must use acceptanceUnit candidate_group`,
      });
    }
    if (entry.referenceDateRole !== 'gate_c_required') {
      issues.push({
        code: 'gate_c_reference_role',
        message: `${entry.artifactId} must use referenceDateRole gate_c_required`,
      });
    }
    if (entry.lane !== 'score_fed_equity') {
      issues.push({
        code: 'gate_c_lane',
        message: `${entry.artifactId} must be score_fed_equity`,
      });
    }
  }

  const haystack = registrySerializedHaystack(registry);
  if (haystack.includes('marketstack')) {
    issues.push({
      code: 'marketstack_reference',
      message: 'Registry must not reference Marketstack',
    });
  }

  for (const key of FORBIDDEN_PROVENANCE_PATH_KEYS) {
    if ((GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS as readonly string[]).includes(key)) {
      issues.push({
        code: 'durable_provenance_forbidden_field',
        message: `Durable provenance must not include field ${key}`,
      });
    }
  }

  const pathLike = GHOSTFLOW_DURABLE_PROVENANCE_FIELD_KEYS.filter((k) =>
    /path|tmp|workspace|body|key|token|cookie/i.test(k)
  );
  if (pathLike.length > 0) {
    issues.push({
      code: 'durable_provenance_path_like_fields',
      message: `Durable provenance has path-like fields: ${pathLike.join(', ')}`,
    });
  }

  return issues;
}

export function assertGhostFlowRefreshRegistryValid(
  registry: readonly GhostFlowRefreshRegistryEntry[] = GHOSTFLOW_REFRESH_REGISTRY
): void {
  const issues = validateGhostFlowRefreshRegistry(registry);
  if (issues.length > 0) {
    throw new Error(
      `GhostFlow refresh registry invalid:\n${issues
        .map((i) => `- [${i.code}] ${i.message}`)
        .join('\n')}`
    );
  }
}
