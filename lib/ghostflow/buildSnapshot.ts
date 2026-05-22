/**
 * GhostFlow v0.2 — merge mock snapshot with validated public artifacts before scoring.
 */

import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { evaluateArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { GhostFlowRawSnapshot, GhostFlowSignal } from '@/lib/ghostflow/types';
import type { GhostFlowBuildResult, GhostFlowSnapshotMeta, VolatilityRegimeArtifactV1 } from './artifacts/types';
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

function mockFallbackResult(raw: GhostFlowRawSnapshot, freshnessWarnings: string[]): GhostFlowBuildResult {
  return {
    raw,
    meta: {
      dataMix: 'mock',
      freshnessWarnings,
      volRegimeSource: 'mock_fallback',
      publicPassiveInputKeys: [],
    },
  };
}

export function applyVolatilityRegimeArtifact(
  raw: GhostFlowRawSnapshot,
  artifact: VolatilityRegimeArtifactV1,
  referenceAsOf: string
): GhostFlowBuildResult {
  const freshnessWarnings: string[] = [];
  const freshness = evaluateArtifactFreshness(artifact.asOf, referenceAsOf);
  freshnessWarnings.push(...freshness.warnings);

  const numericValue = mapVixCloseToNumericValue(artifact.observations.vixClose);
  const vixClose = artifact.observations.vixClose;

  raw.passivePressure.optionsVolatilityAmplifier = numericValue;
  raw.asOf = raw.asOf > artifact.asOf ? raw.asOf : artifact.asOf;

  const volSignal: GhostFlowSignal = {
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
    freshnessStatus: freshness.status,
  };

  raw.signals = replaceSignal(raw.signals, volSignal);

  return {
    raw,
    meta: {
      dataMix: 'mixed',
      freshnessWarnings,
      volRegimeSource: 'public',
      volRegimeAsOf: artifact.asOf,
      publicPassiveInputKeys: ['optionsVolatilityAmplifier'],
    },
  };
}

/** Merge using a fixed artifact (tests) without reading committed JSON. */
export function buildGhostFlowSnapshotWithArtifact(
  artifact: VolatilityRegimeArtifactV1,
  referenceAsOf: string
): GhostFlowBuildResult {
  return applyVolatilityRegimeArtifact(cloneSnapshot(MOCK_GHOSTFLOW_SNAPSHOT), artifact, referenceAsOf);
}

export function buildGhostFlowSnapshot(
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): GhostFlowBuildResult {
  const raw = cloneSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);

  const validation = loadVolatilityRegimeArtifact();
  if (!validation.ok) {
    return mockFallbackResult(raw, [
      `Volatility Regime artifact invalid or missing (${validation.errors.join('; ')}). Using mock fallback for vol-regime signal.`,
    ]);
  }

  return applyVolatilityRegimeArtifact(raw, validation.artifact, referenceAsOf);
}
