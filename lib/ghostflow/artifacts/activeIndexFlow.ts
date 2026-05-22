/**
 * GhostFlow v0.4 — Active vs Index Flow artifact load, validation, and mapping.
 */

import activeIndexFlowArtifactJson from '@/data/ghostflow/artifacts/activeIndexFlow.v1.json';
import { evaluateMonthlyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { ActiveIndexFlowArtifactV1, ActiveIndexFlowValidation } from './types';

const FLOW_MIN_MILLIONS = -100000;
const FLOW_MAX_MILLIONS = 150000;

/** Piecewise anchor points: flow differential ($M) → 0–100 proxy. */
export const ACTIVE_INDEX_DIFFERENTIAL_ANCHORS: ReadonlyArray<{ millions: number; proxy: number }> = [
  { millions: 0, proxy: 20 },
  { millions: 20000, proxy: 45 },
  { millions: 50000, proxy: 70 },
  { millions: 80000, proxy: 85 },
];

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseIsoDate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));
}

function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

function isLastDayOfMonth(iso: string): boolean {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d === lastDay;
}

export function computeFlowDifferentialMillionsUsd(
  activeMillionsUsd: number,
  indexMillionsUsd: number
): number {
  return indexMillionsUsd - activeMillionsUsd;
}

export function mapFlowDifferentialToNumericValue(differentialMillionsUsd: number): number {
  const v = differentialMillionsUsd;
  const anchors = ACTIVE_INDEX_DIFFERENTIAL_ANCHORS;
  if (v <= anchors[0].millions) return anchors[0].proxy;

  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i];
    const right = anchors[i + 1];
    if (v <= right.millions) {
      const t = (v - left.millions) / (right.millions - left.millions);
      return clampInt(left.proxy + t * (right.proxy - left.proxy), 0, 100);
    }
  }

  return clampInt(anchors[anchors.length - 1].proxy, 0, 100);
}

export function flowDifferentialBandLabel(differentialMillionsUsd: number): string {
  if (differentialMillionsUsd <= 0) return 'Active tilt / balanced';
  if (differentialMillionsUsd < 20000) return 'Modest index-flow tilt';
  if (differentialMillionsUsd < 50000) return 'Elevated index-flow tilt';
  return 'Strong index-flow tilt';
}

/** Display rounded billions — e.g. -22251 → "-$22.3B", 31463 → "+$31.5B" */
export function formatFlowBillions(millionsUsd: number, showSign = false): string {
  const billions = millionsUsd / 1000;
  const rounded = Math.round(billions * 10) / 10;
  const sign = showSign ? (rounded >= 0 ? '+' : '-') : rounded < 0 ? '-' : '';
  return `${sign}$${Math.abs(rounded).toFixed(1)}B`;
}

export function formatActiveIndexFlowDisplayValue(
  activeMillionsUsd: number,
  indexMillionsUsd: number,
  differentialMillionsUsd: number,
  numericValue: number
): string {
  return (
    `Active ${formatFlowBillions(activeMillionsUsd)} · Index ${formatFlowBillions(indexMillionsUsd, true)} · ` +
    `diff ${formatFlowBillions(differentialMillionsUsd, true)} · proxy ${numericValue}/100`
  );
}

export function activeIndexFreshnessAnchor(artifact: ActiveIndexFlowArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

export function buildActiveIndexFlowExplanation(
  artifact: ActiveIndexFlowArtifactV1,
  differentialMillionsUsd: number,
  numericValue: number
): string {
  const band = flowDifferentialBandLabel(differentialMillionsUsd);
  return (
    `ICI monthly domestic-equity flow differential ${formatFlowBillions(differentialMillionsUsd, true)} mapped to ${numericValue}/100 flow-tilt proxy (${band}).`
  );
}

export const ACTIVE_INDEX_FLOW_CARD_CAVEAT =
  'Public proxy only — not passive share or active ownership.';

export function validateActiveIndexFlowArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): ActiveIndexFlowValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== 'active-index-flow') errors.push('signalId must be "active-index-flow".');
  if (raw.seriesDefinition !== 'domestic_equity_active_index_monthly_net_flows') {
    errors.push('seriesDefinition must be domestic_equity_active_index_monthly_net_flows.');
  }
  if (raw.updateFrequency !== 'monthly') errors.push('updateFrequency must be "monthly".');

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD) — month ended date.');
  } else {
    if (compareIso(asOf, referenceAsOf) > 0) {
      errors.push(`asOf (${asOf}) cannot be after GHOSTFLOW_REFERENCE_AS_OF (${referenceAsOf}).`);
    }
    if (!isLastDayOfMonth(asOf)) {
      warnings.push(`asOf (${asOf}) is not the last calendar day of the month — expected month-end date.`);
    }
  }

  if (raw.publishedAt != null) {
    if (typeof raw.publishedAt !== 'string' || !parseIsoDate(raw.publishedAt)) {
      errors.push('publishedAt must be a valid ISO date when present.');
    } else if (typeof asOf === 'string' && parseIsoDate(asOf) && compareIso(raw.publishedAt, asOf) < 0) {
      errors.push('publishedAt cannot be before asOf.');
    }
  }

  if (!isPlainObject(raw.source) || typeof raw.source.name !== 'string' || raw.source.name.length === 0) {
    errors.push('source.name is required.');
  }

  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations object is required.');
  } else {
    for (const key of ['activeDomesticEquityNetFlowMillionsUsd', 'indexDomesticEquityNetFlowMillionsUsd'] as const) {
      const val = raw.observations[key];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(`observations.${key} must be a finite number.`);
      } else if (val < FLOW_MIN_MILLIONS || val > FLOW_MAX_MILLIONS) {
        errors.push(
          `observations.${key} must be between ${FLOW_MIN_MILLIONS} and ${FLOW_MAX_MILLIONS}.`
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    artifact: raw as unknown as ActiveIndexFlowArtifactV1,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function loadActiveIndexFlowArtifact(): ActiveIndexFlowValidation {
  return validateActiveIndexFlowArtifact(activeIndexFlowArtifactJson);
}

export function evaluateActiveIndexArtifactFreshness(
  artifact: ActiveIndexFlowArtifactV1,
  referenceAsOf: string
) {
  return evaluateMonthlyArtifactFreshness(
    activeIndexFreshnessAnchor(artifact),
    referenceAsOf,
    'Active vs Index Flow'
  );
}

export const ACTIVE_INDEX_FLOW_ARTIFACT_PATH = 'data/ghostflow/artifacts/activeIndexFlow.v1.json';
