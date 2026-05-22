/**
 * GhostFlow v0.5 — merge mock snapshot with validated public artifacts before scoring.
 */

import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { GhostFlowRawSnapshot, GhostFlowSignal } from '@/lib/ghostflow/types';
import {
  buildActiveIndexFlowExplanation,
  computeFlowDifferentialMillionsUsd,
  evaluateActiveIndexArtifactFreshness,
  formatActiveIndexFlowDisplayValue,
  loadActiveIndexFlowArtifact,
  mapFlowDifferentialToNumericValue,
} from './artifacts/activeIndexFlow';
import {
  buildEtfFlowExplanation,
  evaluateEtfArtifactFreshness,
  formatEtfFlowDisplayValue,
  loadEtfNetIssuanceArtifact,
  mapDomesticEquityIssuanceToNumericValue,
} from './artifacts/etfNetIssuance';
import {
  buildIndexConcentrationExplanation,
  evaluateIndexConcentrationArtifactFreshness,
  formatIndexConcentrationDisplayValue,
  loadIndexConcentrationArtifact,
  mapTop10WeightToNumericValue,
} from './artifacts/indexConcentration';
import type {
  ActiveIndexFlowArtifactV1,
  ApplyArtifactOutcome,
  EtfNetIssuanceArtifactV1,
  GhostFlowBuildResult,
  GhostFlowPublicSignalMeta,
  GhostFlowSnapshotMeta,
  IndexConcentrationArtifactV1,
  VolatilityRegimeArtifactV1,
} from './artifacts/types';
import {
  buildVolRegimeExplanation,
  formatVolRegimeDisplayValue,
  loadVolatilityRegimeArtifact,
  mapVixCloseToNumericValue,
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
    },
  };
}

export interface BuildGhostFlowSnapshotWithArtifactsOptions {
  vol?: VolatilityRegimeArtifactV1;
  etf?: EtfNetIssuanceArtifactV1;
  activeIndex?: ActiveIndexFlowArtifactV1;
  indexConcentration?: IndexConcentrationArtifactV1;
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

  return buildMeta(raw, warnings, publicSignals, publicPassiveInputKeys, publicStructuralInputKeys);
}
