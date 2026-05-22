/**
 * GhostFlow v0.3 — merge mock snapshot with validated public artifacts before scoring.
 */

import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { GhostFlowRawSnapshot, GhostFlowSignal } from '@/lib/ghostflow/types';
import {
  buildEtfFlowExplanation,
  evaluateEtfArtifactFreshness,
  formatEtfFlowDisplayValue,
  loadEtfNetIssuanceArtifact,
  mapDomesticEquityIssuanceToNumericValue,
} from './artifacts/etfNetIssuance';
import type {
  ApplyArtifactOutcome,
  EtfNetIssuanceArtifactV1,
  GhostFlowBuildResult,
  GhostFlowPublicSignalMeta,
  GhostFlowSnapshotMeta,
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

function buildMeta(
  raw: GhostFlowRawSnapshot,
  warnings: string[],
  publicSignals: GhostFlowPublicSignalMeta[],
  publicPassiveInputKeys: GhostFlowSnapshotMeta['publicPassiveInputKeys']
): GhostFlowBuildResult {
  const volSignal = publicSignals.find((s) => s.signalId === 'vol-regime');
  const etfSignal = publicSignals.find((s) => s.signalId === 'etf-flow');

  return {
    raw,
    meta: {
      dataMix: publicSignals.length > 0 ? 'mixed' : 'mock',
      freshnessWarnings: warnings,
      publicSignalCount: publicSignals.length,
      publicSignals,
      publicPassiveInputKeys,
      volRegimeSource: volSignal ? 'public' : 'mock_fallback',
      volRegimeAsOf: volSignal?.asOf,
      etfFlowSource: etfSignal ? 'public' : 'mock_fallback',
      etfFlowAsOf: etfSignal?.asOf,
    },
  };
}

export interface BuildGhostFlowSnapshotWithArtifactsOptions {
  vol?: VolatilityRegimeArtifactV1;
  etf?: EtfNetIssuanceArtifactV1;
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

  return buildMeta(raw, warnings, publicSignals, publicPassiveInputKeys);
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

  return buildMeta(raw, warnings, publicSignals, publicPassiveInputKeys);
}
