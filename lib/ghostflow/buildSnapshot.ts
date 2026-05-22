/**
 * GhostFlow v0.2 — merge mock snapshot with validated public artifacts before scoring.
 */

import { MOCK_GHOSTFLOW_SNAPSHOT } from '@/data/ghostflow/mockGhostflowSnapshot';
import { evaluateArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { GhostFlowRawSnapshot, GhostFlowSignal } from '@/lib/ghostflow/types';
import {
  buildVolRegimeExplanation,
  formatVolRegimeDisplayValue,
  loadVolatilityRegimeArtifact,
  mapVixCloseToNumericValue,
} from './artifacts/volatilityRegime';
import type { GhostFlowBuildResult, GhostFlowSnapshotMeta } from './artifacts/types';

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

export function buildGhostFlowSnapshot(
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): GhostFlowBuildResult {
  const raw = cloneSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);
  const freshnessWarnings: string[] = [];

  const validation = loadVolatilityRegimeArtifact();
  if (!validation.ok) {
    freshnessWarnings.push(
      `Volatility Regime artifact invalid or missing (${validation.errors.join('; ')}). Using mock fallback for vol-regime signal.`
    );
    const meta: GhostFlowSnapshotMeta = {
      dataMix: 'mock',
      freshnessWarnings,
      volRegimeSource: 'mock_fallback',
      publicPassiveInputKeys: [],
    };
    return { raw, meta };
  }

  const artifact = validation.artifact;
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

  const meta: GhostFlowSnapshotMeta = {
    dataMix: 'mixed',
    freshnessWarnings,
    volRegimeSource: 'public',
    volRegimeAsOf: artifact.asOf,
    publicPassiveInputKeys: ['optionsVolatilityAmplifier'],
  };

  return { raw, meta };
}
