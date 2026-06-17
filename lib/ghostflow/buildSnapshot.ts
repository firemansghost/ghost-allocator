/**
 * GhostFlow v0.7 — merge mock snapshot with validated public artifacts before scoring.
 */

import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { GhostFlowRawSnapshot, GhostFlowSignal } from '@/lib/ghostflow/types';
import {
  ACTIVE_INDEX_FLOW_CARD_CAVEAT,
  buildActiveIndexFlowExplanation,
  computeFlowDifferentialMillionsUsd,
  evaluateActiveIndexArtifactFreshness,
  formatActiveIndexFlowDisplayValue,
  loadActiveIndexFlowArtifact,
  mapFlowDifferentialToNumericValue,
} from './artifacts/activeIndexFlow';
import {
  buildEtfFlowExplanation,
  ETF_FLOW_CARD_CAVEAT,
  evaluateEtfArtifactFreshness,
  formatEtfFlowDisplayValue,
  loadEtfNetIssuanceArtifact,
  mapDomesticEquityIssuanceToNumericValue,
} from './artifacts/etfNetIssuance';
import {
  buildIndexConcentrationExplanation,
  evaluateIndexConcentrationArtifactFreshness,
  formatIndexConcentrationDisplayValue,
  INDEX_CONCENTRATION_CARD_CAVEAT,
  loadIndexConcentrationArtifact,
  mapTop10WeightToNumericValue,
} from './artifacts/indexConcentration';
import {
  buildMarketBreadthExplanation,
  evaluateMarketBreadthArtifactFreshness,
  formatMarketBreadthDisplayValue,
  loadMarketBreadthArtifact,
  mapSp500Above50MaToBreadthWeakness,
  MARKET_BREADTH_CARD_CAVEAT,
} from './artifacts/marketBreadth';
import {
  buildPassiveShareProxyExplanation,
  buildDistanceTo65Explanation,
  deriveDistanceToModelZone,
  evaluatePassiveShareProxyArtifactFreshness,
  formatDistanceToModelZoneDisplay,
  formatPassiveShareProxyDisplayValue,
  loadPassiveShareProxyArtifact,
  mapDistanceToZoneNumericValue,
  mapIndexSharePercentToStructuralProxy,
  PASSIVE_SHARE_PROXY_CARD_CAVEAT,
  DISTANCE_TO_65_CARD_CAVEAT,
  DISTANCE_TO_65_SIGNAL_NAME,
} from './artifacts/passiveShareProxy';
import type {
  ActiveIndexFlowArtifactV1,
  ApplyArtifactOutcome,
  EtfNetIssuanceArtifactV1,
  GhostFlowBuildResult,
  GhostFlowPublicSignalMeta,
  GhostFlowSnapshotMeta,
  IndexConcentrationArtifactV1,
  IndexInclusionEventProxyArtifactV1,
  IndexInclusionEventProxyValidation,
  CapWeightPremiumProxyArtifactV1,
  CapWeightPremiumProxyValidation,
  MarketBreadthArtifactV1,
  PassiveShareProxyArtifactV1,
  LeveredEtfRebalancePressureArtifactV1,
  LeveredEtfRebalancePressureValidation,
  OptionsActivityProxyArtifactV1,
  OptionsActivityProxyValidation,
  RetirementFlowPressureArtifactV1,
  RetirementFlowPressureProxyValidation,
  SystematicFlowProxyArtifactV1,
  VolatilityRegimeArtifactV1,
} from './artifacts/types';
import {
  buildLeveredEtfRebalanceDisplayExplanation,
  evaluateLeveredEtfRebalanceArtifactFreshness,
  formatLeveredEtfRebalanceDisplayValue,
  loadLeveredEtfRebalancePressureArtifact,
  LEVERED_ETF_REBALANCE_DISPLAY_CARD_CAVEAT,
  LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_ID,
  LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_NAME,
} from './artifacts/leveredEtfRebalancePressure';
import {
  buildSystematicFlowDisplayExplanation,
  evaluateSystematicFlowProxyArtifactFreshness,
  formatSystematicFlowDisplayValue,
  loadSystematicFlowProxyArtifact,
  SYSTEMATIC_FLOW_DISPLAY_CARD_CAVEAT,
  SYSTEMATIC_FLOW_DISPLAY_SIGNAL_ID,
  SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME,
} from './artifacts/systematicFlowProxy';
import {
  buildRetirementFlowDisplayExplanation,
  evaluateRetirementFlowPressureArtifactFreshness,
  formatRetirementFlowDisplayValue,
  loadRetirementFlowPressureProxyArtifact,
  RETIREMENT_FLOW_DISPLAY_CARD_CAVEAT,
  RETIREMENT_FLOW_DISPLAY_SIGNAL_ID,
  RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME,
} from './artifacts/retirementFlowPressureProxy';
import {
  buildOptionsActivityDisplayExplanation,
  evaluateOptionsActivityArtifactFreshness,
  formatOptionsActivityCardValue,
  loadOptionsActivityProxyArtifact,
  OPTIONS_ACTIVITY_DISPLAY_CARD_CAVEAT,
  OPTIONS_ACTIVITY_DISPLAY_SIGNAL_ID,
  OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME,
} from './artifacts/optionsActivityProxy';
import {
  buildIndexInclusionEventDisplayExplanation,
  evaluateIndexInclusionEventArtifactFreshness,
  formatIndexInclusionEventCardValue,
  INDEX_INCLUSION_EVENT_DISPLAY_CARD_CAVEAT,
  INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_ID,
  INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME,
  loadIndexInclusionEventProxyArtifact,
} from './artifacts/indexInclusionEventProxy';
import {
  buildCapWeightPremiumDisplayExplanation,
  CAP_WEIGHT_PREMIUM_DISPLAY_CARD_CAVEAT,
  CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_ID,
  CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME,
  evaluateCapWeightPremiumArtifactFreshness,
  formatCapWeightPremiumCardValue,
  loadCapWeightPremiumProxyArtifact,
} from './artifacts/capWeightPremiumProxy';
import {
  buildVolRegimeExplanation,
  formatVolRegimeDisplayValue,
  loadVolatilityRegimeArtifact,
  mapVixCloseToNumericValue,
  VOL_REGIME_CARD_CAVEAT,
} from './artifacts/volatilityRegime';

function cloneSnapshot(base: GhostFlowRawSnapshot): GhostFlowRawSnapshot {
  return {
    ...base,
    passivePressure: { ...base.passivePressure },
    structuralFragility: { ...base.structuralFragility },
    signals: base.signals.map((s) => ({ ...s })),
  };
}

function replaceSignal(signals: GhostFlowSignal[], next: GhostFlowSignal): GhostFlowSignal[] {
  const idx = signals.findIndex((s) => s.id === next.id);
  if (idx === -1) return [...signals, next];
  const copy = [...signals];
  copy[idx] = next;
  return copy;
}

function bumpAsOf(current: string, candidate: string): string {
  return current > candidate ? current : candidate;
}

export function applyVolatilityRegimeArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: VolatilityRegimeArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateDailyArtifactFreshness(artifact.asOf, referenceAsOf, 'Volatility Regime');
  const numericValue = mapVixCloseToNumericValue(artifact.observations.vixClose);
  const vixClose = artifact.observations.vixClose;

  raw.passivePressure.optionsVolatilityAmplifier = numericValue;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'vol-regime',
    name: 'Volatility Regime',
    value: formatVolRegimeDisplayValue(vixClose),
    numericValue,
    explanation: buildVolRegimeExplanation(artifact, numericValue),
    cardCaveat: VOL_REGIME_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Daily (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'vol-regime',
    name: 'Volatility Regime',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicPassiveInputKey: 'optionsVolatilityAmplifier',
  };
}

export function applyEtfNetIssuanceArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: EtfNetIssuanceArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateEtfArtifactFreshness(artifact, referenceAsOf);
  const millions = artifact.observations.domesticEquityNetIssuanceMillionsUsd;
  const numericValue = mapDomesticEquityIssuanceToNumericValue(millions);

  raw.passivePressure.etfFundFlowImpulse = numericValue;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'etf-flow',
    name: 'ETF Net Issuance Pressure',
    value: formatEtfFlowDisplayValue(millions, numericValue),
    numericValue,
    explanation: buildEtfFlowExplanation(artifact, numericValue),
    cardCaveat: ETF_FLOW_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Weekly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'etf-flow',
    name: 'ETF Net Issuance Pressure',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicPassiveInputKey: 'etfFundFlowImpulse',
  };
}

export function applyActiveIndexFlowArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: ActiveIndexFlowArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateActiveIndexArtifactFreshness(artifact, referenceAsOf);
  const active = artifact.observations.activeDomesticEquityNetFlowMillionsUsd;
  const index = artifact.observations.indexDomesticEquityNetFlowMillionsUsd;
  const differential = computeFlowDifferentialMillionsUsd(active, index);
  const numericValue = mapFlowDifferentialToNumericValue(differential);

  raw.structuralFragility.activeShareOffsetProxy = numericValue;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'active-index-flow',
    name: 'Active vs Index Flow Differential',
    value: formatActiveIndexFlowDisplayValue(active, index, differential, numericValue),
    numericValue,
    explanation: buildActiveIndexFlowExplanation(artifact, differential, numericValue),
    cardCaveat: ACTIVE_INDEX_FLOW_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Monthly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'active-index-flow',
    name: 'Active vs Index Flow Differential',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicStructuralInputKey: 'activeShareOffsetProxy',
  };
}

export function applyIndexConcentrationArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: IndexConcentrationArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateIndexConcentrationArtifactFreshness(artifact, referenceAsOf);
  const top10Weight = artifact.observations.sp500Top10IndexWeightPercent;
  const numericValue = mapTop10WeightToNumericValue(top10Weight);

  raw.structuralFragility.indexConcentration = numericValue;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'concentration',
    name: 'Index Concentration',
    value: formatIndexConcentrationDisplayValue(top10Weight, numericValue),
    numericValue,
    explanation: buildIndexConcentrationExplanation(artifact, numericValue),
    cardCaveat: INDEX_CONCENTRATION_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Monthly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'concentration',
    name: 'Index Concentration',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicStructuralInputKey: 'indexConcentration',
  };
}

export function applyPassiveShareProxyArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: PassiveShareProxyArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluatePassiveShareProxyArtifactFreshness(artifact, referenceAsOf);
  const indexSharePercent = artifact.observations.indexAssetSharePercent;
  const structuralProxy = mapIndexSharePercentToStructuralProxy(indexSharePercent);
  const distancePp = deriveDistanceToModelZone(indexSharePercent);
  const modelZoneProximity = mapDistanceToZoneNumericValue(distancePp);

  raw.passiveSharePercent = indexSharePercent;
  raw.structuralFragility.passiveShareProxy = structuralProxy;
  raw.structuralFragility.modelZoneProximity = modelZoneProximity;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'passive-share',
    name: 'ICI Index Share Proxy',
    value: formatPassiveShareProxyDisplayValue(indexSharePercent),
    numericValue: structuralProxy,
    explanation: buildPassiveShareProxyExplanation(indexSharePercent, structuralProxy),
    cardCaveat: PASSIVE_SHARE_PROXY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Monthly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  raw.signals = replaceSignal(raw.signals, {
    id: 'distance-65',
    name: DISTANCE_TO_65_SIGNAL_NAME,
    value: formatDistanceToModelZoneDisplay(distancePp),
    numericValue: mapDistanceToZoneNumericValue(distancePp),
    explanation: buildDistanceTo65Explanation(distancePp),
    cardCaveat: DISTANCE_TO_65_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Derived (ICI Index Share Proxy)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote:
      'Derived from ICI Index Share Proxy, not a separate manual artifact and not a market-wide passive-share estimate.',
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'passive-share',
    name: 'ICI Index Share Proxy',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicStructuralInputKey: 'passiveShareProxy',
  };
}

export function applyMarketBreadthArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: MarketBreadthArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateMarketBreadthArtifactFreshness(artifact, referenceAsOf);
  const strengthPercent = artifact.observations.sp500Above50DayMaPercent;
  const numericValue = mapSp500Above50MaToBreadthWeakness(strengthPercent);

  raw.structuralFragility.breadthWeakness = numericValue;
  raw.asOf = bumpAsOf(raw.asOf, artifact.asOf);

  raw.signals = replaceSignal(raw.signals, {
    id: 'breadth',
    name: 'Market Breadth Participation',
    value: formatMarketBreadthDisplayValue(strengthPercent, numericValue),
    numericValue,
    explanation: buildMarketBreadthExplanation(artifact, numericValue),
    cardCaveat: MARKET_BREADTH_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Daily (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: 'breadth',
    name: 'Market Breadth Participation',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
    publicStructuralInputKey: 'breadthWeakness',
  };
}

/** Display-only CFTC TFF card — does not merge into passive/structural score inputs. */
export function applySystematicFlowProxyDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: SystematicFlowProxyArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateSystematicFlowProxyArtifactFreshness(artifact, referenceAsOf);
  const { basket } = artifact;
  const numericValue = basket.basketScore;

  raw.signals = replaceSignal(raw.signals, {
    id: SYSTEMATIC_FLOW_DISPLAY_SIGNAL_ID,
    name: SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME,
    value: formatSystematicFlowDisplayValue(basket),
    numericValue,
    explanation: buildSystematicFlowDisplayExplanation(artifact),
    cardCaveat: SYSTEMATIC_FLOW_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Weekly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: SYSTEMATIC_FLOW_DISPLAY_SIGNAL_ID,
    name: SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

/** Display-only levered ETF rebalance card — does not merge into passive/structural score inputs. */
export function applyLeveredEtfRebalanceDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: LeveredEtfRebalancePressureArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateLeveredEtfRebalanceArtifactFreshness(artifact, referenceAsOf);
  const { observations } = artifact;
  const numericValue = observations.aggregateRebalancePctOfUniverseAum;

  raw.signals = replaceSignal(raw.signals, {
    id: LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_ID,
    name: LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_NAME,
    value: formatLeveredEtfRebalanceDisplayValue(observations),
    numericValue,
    explanation: buildLeveredEtfRebalanceDisplayExplanation(artifact),
    cardCaveat: LEVERED_ETF_REBALANCE_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Weekly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_ID,
    name: LEVERED_ETF_REBALANCE_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

export function mergeLeveredEtfRebalanceDisplayIfValid(
  raw: GhostFlowRawSnapshot,
  validation: LeveredEtfRebalancePressureValidation,
  referenceAsOf: string
): {
  raw: GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
} {
  if (!validation.ok) {
    return {
      raw,
      warnings: [
        `Levered ETF Rebalance Pressure artifact invalid or missing (${validation.errors.join('; ')}). No display card added.`,
      ],
    };
  }

  const result = applyLeveredEtfRebalanceDisplayArtifact(
    raw,
    validation.artifact,
    referenceAsOf
  );
  const warnings = [...result.warnings];
  if (validation.warnings) warnings.push(...validation.warnings);

  return {
    raw: result.raw,
    warnings,
    publicSignal: result.publicSignal,
  };
}

/** Display-only retirement asset-growth card — does not merge into passive/structural score inputs. */
export function applyRetirementFlowDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: RetirementFlowPressureArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateRetirementFlowPressureArtifactFreshness(artifact, referenceAsOf);
  const { observations } = artifact;
  const numericValue = observations.quarterOverQuarterAssetGrowthPct ?? 0;

  raw.signals = replaceSignal(raw.signals, {
    id: RETIREMENT_FLOW_DISPLAY_SIGNAL_ID,
    name: RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME,
    value: formatRetirementFlowDisplayValue(observations),
    numericValue,
    explanation: buildRetirementFlowDisplayExplanation(artifact),
    cardCaveat: RETIREMENT_FLOW_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Quarterly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: RETIREMENT_FLOW_DISPLAY_SIGNAL_ID,
    name: RETIREMENT_FLOW_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

export function mergeRetirementFlowDisplayIfValid(
  raw: GhostFlowRawSnapshot,
  validation: RetirementFlowPressureProxyValidation,
  referenceAsOf: string
): {
  raw: GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
} {
  if (!validation.ok) {
    return {
      raw,
      warnings: [
        `Retirement Asset Growth Proxy artifact invalid or missing (${validation.errors.join('; ')}). No display card added.`,
      ],
    };
  }

  const result = applyRetirementFlowDisplayArtifact(raw, validation.artifact, referenceAsOf);

  return {
    raw: result.raw,
    warnings: result.warnings,
    publicSignal: result.publicSignal,
  };
}

/** Display-only OCC index options intensity card — does not merge into passive/structural score inputs. */
export function applyOptionsActivityDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: OptionsActivityProxyArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateOptionsActivityArtifactFreshness(artifact, referenceAsOf);
  const { observations } = artifact;
  const numericValue = observations.indexShareOfTotalPct;

  raw.signals = replaceSignal(raw.signals, {
    id: OPTIONS_ACTIVITY_DISPLAY_SIGNAL_ID,
    name: OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME,
    value: formatOptionsActivityCardValue(observations),
    numericValue,
    explanation: buildOptionsActivityDisplayExplanation(artifact),
    cardCaveat: OPTIONS_ACTIVITY_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Daily (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  raw.signals = raw.signals.filter((s) => s.id !== 'odte-options');

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: OPTIONS_ACTIVITY_DISPLAY_SIGNAL_ID,
    name: OPTIONS_ACTIVITY_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

export function mergeOptionsActivityDisplayIfValid(
  raw: GhostFlowRawSnapshot,
  validation: OptionsActivityProxyValidation,
  referenceAsOf: string
): {
  raw: GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
} {
  if (!validation.ok) {
    return {
      raw,
      warnings: [
        `Index Options Intensity Proxy artifact invalid or missing (${validation.errors.join('; ')}). No display card added.`,
      ],
    };
  }

  const result = applyOptionsActivityDisplayArtifact(raw, validation.artifact, referenceAsOf);

  return {
    raw: result.raw,
    warnings: result.warnings,
    publicSignal: result.publicSignal,
  };
}

/** Display-only index inclusion event card — does not merge into passive/structural score inputs. */
export function applyIndexInclusionEventDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: IndexInclusionEventProxyArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateIndexInclusionEventArtifactFreshness(artifact, referenceAsOf);
  const { observations } = artifact;

  raw.signals = replaceSignal(raw.signals, {
    id: INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_ID,
    name: INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME,
    value: formatIndexInclusionEventCardValue(observations),
    numericValue: observations.eventCount,
    explanation: buildIndexInclusionEventDisplayExplanation(artifact),
    cardCaveat: INDEX_INCLUSION_EVENT_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Event-driven (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_ID,
    name: INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

export function mergeIndexInclusionEventDisplayIfValid(
  raw: GhostFlowRawSnapshot,
  validation: IndexInclusionEventProxyValidation,
  referenceAsOf: string
): {
  raw: GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
} {
  if (!validation.ok) {
    return {
      raw,
      warnings: [
        `Index Inclusion Event Proxy artifact invalid or missing (${validation.errors.join('; ')}). No display card added.`,
      ],
    };
  }

  const result = applyIndexInclusionEventDisplayArtifact(
    raw,
    validation.artifact,
    referenceAsOf
  );

  return {
    raw: result.raw,
    warnings: result.warnings,
    publicSignal: result.publicSignal,
  };
}

/** Display-only cap-weight premium card — does not merge into passive/structural score inputs. */
export function applyCapWeightPremiumDisplayArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: CapWeightPremiumProxyArtifactV1,
  referenceAsOf: string
): ApplyArtifactOutcome {
  const freshness = evaluateCapWeightPremiumArtifactFreshness(artifact, referenceAsOf);
  const { observations } = artifact;

  raw.signals = replaceSignal(raw.signals, {
    id: CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_ID,
    name: CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME,
    value: formatCapWeightPremiumCardValue(observations),
    numericValue: observations.spread5YPercentile,
    explanation: buildCapWeightPremiumDisplayExplanation(artifact),
    cardCaveat: CAP_WEIGHT_PREMIUM_DISPLAY_CARD_CAVEAT,
    dataStatus: 'public_proxy',
    updateFrequencyTarget: 'Weekly (manual artifact)',
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    sourceNote: artifact.source.note,
    dataQuality: artifact.dataQuality,
    artifactAsOf: artifact.asOf,
    artifactPublishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  });

  const publicSignal: GhostFlowPublicSignalMeta = {
    signalId: CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_ID,
    name: CAP_WEIGHT_PREMIUM_DISPLAY_SIGNAL_NAME,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    freshnessStatus: freshness.status,
  };

  return {
    raw,
    warnings: freshness.warnings,
    publicSignal,
  };
}

export function mergeCapWeightPremiumDisplayIfValid(
  raw: GhostFlowRawSnapshot,
  validation: CapWeightPremiumProxyValidation,
  referenceAsOf: string
): {
  raw: GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
} {
  if (!validation.ok) {
    return {
      raw,
      warnings: [
        `Cap-Weight Premium Proxy artifact invalid or missing (${validation.errors.join('; ')}). No display card added.`,
      ],
    };
  }

  const result = applyCapWeightPremiumDisplayArtifact(raw, validation.artifact, referenceAsOf);

  return {
    raw: result.raw,
    warnings: result.warnings,
    publicSignal: result.publicSignal,
  };
}

function buildMeta(
  raw: GhostFlowRawSnapshot,
  warnings: string[],
  publicSignals: GhostFlowPublicSignalMeta[],
  publicPassiveInputKeys: GhostFlowSnapshotMeta['publicPassiveInputKeys'],
  publicStructuralInputKeys: GhostFlowSnapshotMeta['publicStructuralInputKeys']
): GhostFlowBuildResult {
  const volSignal = publicSignals.find((s) => s.signalId === 'vol-regime');
  const etfSignal = publicSignals.find((s) => s.signalId === 'etf-flow');
  const activeIndexSignal = publicSignals.find((s) => s.signalId === 'active-index-flow');
  const indexConcentrationSignal = publicSignals.find((s) => s.signalId === 'concentration');
  const passiveShareSignal = publicSignals.find((s) => s.signalId === 'passive-share');
  const breadthSignal = publicSignals.find((s) => s.signalId === 'breadth');

  return {
    raw,
    meta: {
      dataMix: publicSignals.length > 0 ? 'mixed' : 'mock',
      freshnessWarnings: warnings,
      publicSignalCount: publicSignals.length,
      publicSignals,
      publicPassiveInputKeys,
      publicStructuralInputKeys,
      volRegimeSource: volSignal ? 'public' : 'mock_fallback',
      volRegimeAsOf: volSignal?.asOf,
      etfFlowSource: etfSignal ? 'public' : 'mock_fallback',
      etfFlowAsOf: etfSignal?.asOf,
      activeIndexFlowSource: activeIndexSignal ? 'public' : 'mock_fallback',
      activeIndexFlowAsOf: activeIndexSignal?.asOf,
      indexConcentrationSource: indexConcentrationSignal ? 'public' : 'mock_fallback',
      indexConcentrationAsOf: indexConcentrationSignal?.asOf,
      passiveShareProxySource: passiveShareSignal ? 'public' : 'mock_fallback',
      passiveShareProxyAsOf: passiveShareSignal?.asOf,
      breadthSource: breadthSignal ? 'public' : 'mock_fallback',
      breadthAsOf: breadthSignal?.asOf,
    },
  };
}

export interface BuildGhostFlowSnapshotWithArtifactsOptions {
  vol?: VolatilityRegimeArtifactV1;
  etf?: EtfNetIssuanceArtifactV1;
  activeIndex?: ActiveIndexFlowArtifactV1;
  indexConcentration?: IndexConcentrationArtifactV1;
  passiveShare?: PassiveShareProxyArtifactV1;
  breadth?: MarketBreadthArtifactV1;
  referenceAsOf: string;
}

/** Merge fixed artifacts (tests) without reading committed JSON. */
export function buildGhostFlowSnapshotWithArtifacts(
  opts: BuildGhostFlowSnapshotWithArtifactsOptions
): GhostFlowBuildResult {
  let raw = cloneSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
  const warnings: string[] = [];
  const publicSignals: GhostFlowPublicSignalMeta[] = [];
  const publicPassiveInputKeys: GhostFlowSnapshotMeta['publicPassiveInputKeys'] = [];
  const publicStructuralInputKeys: GhostFlowSnapshotMeta['publicStructuralInputKeys'] = [];

  if (opts.vol) {
    const vol = applyVolatilityRegimeArtifact(raw, opts.vol, opts.referenceAsOf);
    raw = vol.raw;
    warnings.push(...vol.warnings);
    if (vol.publicSignal) publicSignals.push(vol.publicSignal);
    if (vol.publicPassiveInputKey) publicPassiveInputKeys.push(vol.publicPassiveInputKey);
  }

  if (opts.etf) {
    const etf = applyEtfNetIssuanceArtifact(raw, opts.etf, opts.referenceAsOf);
    raw = etf.raw;
    warnings.push(...etf.warnings);
    if (etf.publicSignal) publicSignals.push(etf.publicSignal);
    if (etf.publicPassiveInputKey) publicPassiveInputKeys.push(etf.publicPassiveInputKey);
  }

  if (opts.activeIndex) {
    const activeIndex = applyActiveIndexFlowArtifact(raw, opts.activeIndex, opts.referenceAsOf);
    raw = activeIndex.raw;
    warnings.push(...activeIndex.warnings);
    if (activeIndex.publicSignal) publicSignals.push(activeIndex.publicSignal);
    if (activeIndex.publicStructuralInputKey) publicStructuralInputKeys.push(activeIndex.publicStructuralInputKey);
  }

  if (opts.indexConcentration) {
    const indexConcentration = applyIndexConcentrationArtifact(raw, opts.indexConcentration, opts.referenceAsOf);
    raw = indexConcentration.raw;
    warnings.push(...indexConcentration.warnings);
    if (indexConcentration.publicSignal) publicSignals.push(indexConcentration.publicSignal);
    if (indexConcentration.publicStructuralInputKey) publicStructuralInputKeys.push(indexConcentration.publicStructuralInputKey);
  }

  if (opts.passiveShare) {
    const passiveShare = applyPassiveShareProxyArtifact(raw, opts.passiveShare, opts.referenceAsOf);
    raw = passiveShare.raw;
    warnings.push(...passiveShare.warnings);
    if (passiveShare.publicSignal) publicSignals.push(passiveShare.publicSignal);
    if (passiveShare.publicStructuralInputKey) publicStructuralInputKeys.push(passiveShare.publicStructuralInputKey);
  }

  if (opts.breadth) {
    const breadth = applyMarketBreadthArtifact(raw, opts.breadth, opts.referenceAsOf);
    raw = breadth.raw;
    warnings.push(...breadth.warnings);
    if (breadth.publicSignal) publicSignals.push(breadth.publicSignal);
    if (breadth.publicStructuralInputKey) publicStructuralInputKeys.push(breadth.publicStructuralInputKey);
  }

  return buildMeta(raw, warnings, publicSignals, publicPassiveInputKeys, publicStructuralInputKeys);
}

/** @deprecated Use buildGhostFlowSnapshotWithArtifacts */
export function buildGhostFlowSnapshotWithArtifact(
  artifact: VolatilityRegimeArtifactV1,
  referenceAsOf: string
): GhostFlowBuildResult {
  return buildGhostFlowSnapshotWithArtifacts({ vol: artifact, referenceAsOf });
}

export function buildGhostFlowSnapshot(
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): GhostFlowBuildResult {
  let raw = cloneSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
  const warnings: string[] = [];
  const publicSignals: GhostFlowPublicSignalMeta[] = [];
  const publicPassiveInputKeys: GhostFlowSnapshotMeta['publicPassiveInputKeys'] = [];
  const publicStructuralInputKeys: GhostFlowSnapshotMeta['publicStructuralInputKeys'] = [];

  const volValidation = loadVolatilityRegimeArtifact();
  if (volValidation.ok) {
    const vol = applyVolatilityRegimeArtifact(raw, volValidation.artifact, referenceAsOf);
    raw = vol.raw;
    warnings.push(...vol.warnings);
    if (vol.publicSignal) publicSignals.push(vol.publicSignal);
    if (vol.publicPassiveInputKey) publicPassiveInputKeys.push(vol.publicPassiveInputKey);
  } else {
    warnings.push(
      `Volatility Regime artifact invalid or missing (${volValidation.errors.join('; ')}). Using mock fallback for vol-regime signal.`
    );
  }

  const etfValidation = loadEtfNetIssuanceArtifact();
  if (etfValidation.ok) {
    const etf = applyEtfNetIssuanceArtifact(raw, etfValidation.artifact, referenceAsOf);
    raw = etf.raw;
    warnings.push(...etf.warnings);
    if (etf.publicSignal) publicSignals.push(etf.publicSignal);
    if (etf.publicPassiveInputKey) publicPassiveInputKeys.push(etf.publicPassiveInputKey);
  } else {
    warnings.push(
      `ETF Net Issuance artifact invalid or missing (${etfValidation.errors.join('; ')}). Using mock fallback for etf-flow signal.`
    );
  }

  const activeIndexValidation = loadActiveIndexFlowArtifact();
  if (activeIndexValidation.ok) {
    const activeIndex = applyActiveIndexFlowArtifact(raw, activeIndexValidation.artifact, referenceAsOf);
    raw = activeIndex.raw;
    warnings.push(...activeIndex.warnings);
    if (activeIndex.publicSignal) publicSignals.push(activeIndex.publicSignal);
    if (activeIndex.publicStructuralInputKey) publicStructuralInputKeys.push(activeIndex.publicStructuralInputKey);
  } else {
    warnings.push(
      `Active vs Index Flow artifact invalid or missing (${activeIndexValidation.errors.join('; ')}). Using mock fallback for active-index-flow signal.`
    );
  }

  const indexConcentrationValidation = loadIndexConcentrationArtifact();
  if (indexConcentrationValidation.ok) {
    const indexConcentration = applyIndexConcentrationArtifact(
      raw,
      indexConcentrationValidation.artifact,
      referenceAsOf
    );
    raw = indexConcentration.raw;
    warnings.push(...indexConcentration.warnings);
    if (indexConcentrationValidation.warnings) warnings.push(...indexConcentrationValidation.warnings);
    if (indexConcentration.publicSignal) publicSignals.push(indexConcentration.publicSignal);
    if (indexConcentration.publicStructuralInputKey) publicStructuralInputKeys.push(indexConcentration.publicStructuralInputKey);
  } else {
    warnings.push(
      `Index Concentration artifact invalid or missing (${indexConcentrationValidation.errors.join('; ')}). Using mock fallback for concentration signal.`
    );
  }

  const passiveShareValidation = loadPassiveShareProxyArtifact();
  if (passiveShareValidation.ok) {
    const passiveShare = applyPassiveShareProxyArtifact(
      raw,
      passiveShareValidation.artifact,
      referenceAsOf
    );
    raw = passiveShare.raw;
    warnings.push(...passiveShare.warnings);
    if (passiveShareValidation.warnings) warnings.push(...passiveShareValidation.warnings);
    if (passiveShare.publicSignal) publicSignals.push(passiveShare.publicSignal);
    if (passiveShare.publicStructuralInputKey) publicStructuralInputKeys.push(passiveShare.publicStructuralInputKey);
  } else {
    warnings.push(
      `ICI Index Share Proxy artifact invalid or missing (${passiveShareValidation.errors.join('; ')}). Using mock fallback for passive-share signal, passiveShareProxy, passiveSharePercent, and distance-65.`
    );
  }

  const breadthValidation = loadMarketBreadthArtifact();
  if (breadthValidation.ok) {
    const breadth = applyMarketBreadthArtifact(raw, breadthValidation.artifact, referenceAsOf);
    raw = breadth.raw;
    warnings.push(...breadth.warnings);
    if (breadthValidation.warnings) warnings.push(...breadthValidation.warnings);
    if (breadth.publicSignal) publicSignals.push(breadth.publicSignal);
    if (breadth.publicStructuralInputKey) publicStructuralInputKeys.push(breadth.publicStructuralInputKey);
  } else {
    warnings.push(
      `Market Breadth Participation artifact invalid or missing (${breadthValidation.errors.join('; ')}). Using mock fallback for breadth signal and breadthWeakness.`
    );
  }

  const systematicValidation = loadSystematicFlowProxyArtifact();
  if (systematicValidation.ok) {
    const systematicDisplay = applySystematicFlowProxyDisplayArtifact(
      raw,
      systematicValidation.artifact,
      referenceAsOf
    );
    raw = systematicDisplay.raw;
    warnings.push(...systematicDisplay.warnings);
    if (systematicValidation.warnings) warnings.push(...systematicValidation.warnings);
    if (systematicDisplay.publicSignal) publicSignals.push(systematicDisplay.publicSignal);
  } else {
    warnings.push(
      `CFTC TFF Positioning Proxy artifact invalid or missing (${systematicValidation.errors.join('; ')}). Using mock placeholder for systematic-flow card.`
    );
  }

  const leveredValidation = loadLeveredEtfRebalancePressureArtifact();
  const leveredDisplay = mergeLeveredEtfRebalanceDisplayIfValid(
    raw,
    leveredValidation,
    referenceAsOf
  );
  raw = leveredDisplay.raw;
  warnings.push(...leveredDisplay.warnings);
  if (leveredDisplay.publicSignal) publicSignals.push(leveredDisplay.publicSignal);

  const retirementValidation = loadRetirementFlowPressureProxyArtifact();
  const retirementDisplay = mergeRetirementFlowDisplayIfValid(
    raw,
    retirementValidation,
    referenceAsOf
  );
  raw = retirementDisplay.raw;
  warnings.push(...retirementDisplay.warnings);
  if (retirementDisplay.publicSignal) publicSignals.push(retirementDisplay.publicSignal);

  const optionsValidation = loadOptionsActivityProxyArtifact();
  const optionsDisplay = mergeOptionsActivityDisplayIfValid(
    raw,
    optionsValidation,
    referenceAsOf
  );
  raw = optionsDisplay.raw;
  warnings.push(...optionsDisplay.warnings);
  if (optionsDisplay.publicSignal) publicSignals.push(optionsDisplay.publicSignal);

  const indexInclusionValidation = loadIndexInclusionEventProxyArtifact();
  const indexInclusionDisplay = mergeIndexInclusionEventDisplayIfValid(
    raw,
    indexInclusionValidation,
    referenceAsOf
  );
  raw = indexInclusionDisplay.raw;
  warnings.push(...indexInclusionDisplay.warnings);
  if (indexInclusionDisplay.publicSignal) publicSignals.push(indexInclusionDisplay.publicSignal);

  const capWeightValidation = loadCapWeightPremiumProxyArtifact();
  const capWeightDisplay = mergeCapWeightPremiumDisplayIfValid(
    raw,
    capWeightValidation,
    referenceAsOf
  );
  raw = capWeightDisplay.raw;
  warnings.push(...capWeightDisplay.warnings);
  if (capWeightDisplay.publicSignal) publicSignals.push(capWeightDisplay.publicSignal);

  return buildMeta(raw, warnings, publicSignals, publicPassiveInputKeys, publicStructuralInputKeys);
}
