/**
 * GhostFlow v0.5 — Index Concentration artifact load, validation, and mapping.
 */

import indexConcentrationArtifactJson from '@/data/ghostflow/artifacts/indexConcentration.v1.json';
import { evaluateMonthlyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { IndexConcentrationArtifactV1, IndexConcentrationValidation } from './types';

const TOP10_WEIGHT_MIN = 15.0;
const TOP10_WEIGHT_MAX = 50.0;

/** Piecewise anchor points: S&P 500 top-10 index weight (%) → 0–100 proxy. */
export const INDEX_CONCENTRATION_ANCHORS: ReadonlyArray<{ percent: number; proxy: number }> = [
  { percent: 22, proxy: 20 },
  { percent: 28, proxy: 40 },
  { percent: 33, proxy: 58 },
  { percent: 37, proxy: 72 },
  { percent: 40, proxy: 85 },
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

export function mapTop10WeightToNumericValue(top10WeightPercent: number): number {
  const v = top10WeightPercent;
  const anchors = INDEX_CONCENTRATION_ANCHORS;
  if (v <= anchors[0].percent) return anchors[0].proxy;

  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i];
    const right = anchors[i + 1];
    if (v <= right.percent) {
      const t = (v - left.percent) / (right.percent - left.percent);
      return clampInt(left.proxy + t * (right.proxy - left.proxy), 0, 100);
    }
  }

  return clampInt(anchors[anchors.length - 1].proxy, 0, 100);
}

export function top10ConcentrationBandLabel(top10WeightPercent: number): string {
  if (top10WeightPercent <= 22) return 'Broad / lower concentration';
  if (top10WeightPercent < 28) return 'Moderate';
  if (top10WeightPercent < 33) return 'Elevated';
  if (top10WeightPercent < 37) return 'Top-heavy';
  return 'Highly concentrated';
}

export function formatTop10WeightDisplay(top10WeightPercent: number): string {
  const rounded = Math.round(top10WeightPercent * 10) / 10;
  return `${rounded.toFixed(1)}%`;
}

export function formatIndexConcentrationDisplayValue(
  top10WeightPercent: number,
  numericValue: number
): string {
  return `Top 10 index weight ${formatTop10WeightDisplay(top10WeightPercent)} · proxy ${numericValue}/100`;
}

export function indexConcentrationFreshnessAnchor(artifact: IndexConcentrationArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

export function buildIndexConcentrationExplanation(
  artifact: IndexConcentrationArtifactV1,
  numericValue: number
): string {
  const pct = artifact.observations.sp500Top10IndexWeightPercent;
  const band = top10ConcentrationBandLabel(pct);
  return (
    `S&P 500 top-10 index weight sum for as-of ${artifact.asOf}: ${formatTop10WeightDisplay(pct)} ` +
    `(largest 10 constituent index weights from SSGA SPY monthly fact sheet). ` +
    `Mapped to a ${numericValue}/100 structural fragility proxy (${band}). ` +
    `Public proxy only — not passive share, not ownership share, not proof passive flows caused concentration, ` +
    `and not a crash countdown. Cap-weight concentration can reflect earnings dominance, momentum, valuation, ` +
    `passive flows, or all of the above. Useful fragility context, not a verdict.`
  );
}

export function validateIndexConcentrationArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): IndexConcentrationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== 'concentration') errors.push('signalId must be "concentration".');
  if (raw.seriesDefinition !== 'sp500_index_top10_weight_percent') {
    errors.push('seriesDefinition must be sp500_index_top10_weight_percent.');
  }
  if (raw.updateFrequency !== 'monthly') errors.push('updateFrequency must be "monthly".');

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD) — index holdings as-of date.');
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
    const val = raw.observations.sp500Top10IndexWeightPercent;
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      errors.push('observations.sp500Top10IndexWeightPercent must be a finite number.');
    } else if (val < TOP10_WEIGHT_MIN || val > TOP10_WEIGHT_MAX) {
      errors.push(
        `observations.sp500Top10IndexWeightPercent must be between ${TOP10_WEIGHT_MIN} and ${TOP10_WEIGHT_MAX}.`
      );
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    artifact: raw as unknown as IndexConcentrationArtifactV1,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function loadIndexConcentrationArtifact(): IndexConcentrationValidation {
  return validateIndexConcentrationArtifact(indexConcentrationArtifactJson);
}

export function evaluateIndexConcentrationArtifactFreshness(
  artifact: IndexConcentrationArtifactV1,
  referenceAsOf: string
) {
  return evaluateMonthlyArtifactFreshness(
    indexConcentrationFreshnessAnchor(artifact),
    referenceAsOf,
    'Index Concentration'
  );
}

export const INDEX_CONCENTRATION_ARTIFACT_PATH = 'data/ghostflow/artifacts/indexConcentration.v1.json';
