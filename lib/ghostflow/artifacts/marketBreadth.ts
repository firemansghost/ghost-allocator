/**
 * GhostFlow v0.7 — Market Breadth Participation artifact load, validation, and mapping.
 */

import marketBreadthArtifactJson from '@/data/ghostflow/artifacts/marketBreadth.v1.json';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { MarketBreadthArtifactV1, MarketBreadthValidation } from './types';

const STRENGTH_MIN = 0;
const STRENGTH_MAX = 100;

/** Piecewise anchors: S&P 500 % above 50DMA (strength) → breadth weakness proxy (0–100). */
export const BREADTH_STRENGTH_ANCHORS: ReadonlyArray<{ strength: number; weakness: number }> = [
  { strength: 20, weakness: 92 },
  { strength: 30, weakness: 80 },
  { strength: 40, weakness: 68 },
  { strength: 50, weakness: 52 },
  { strength: 60, weakness: 38 },
  { strength: 75, weakness: 20 },
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

function isWeekday(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d !== 0 && d !== 6;
}

/** Normalize to one decimal place for storage/display consistency. */
export function normalizeBreadthPercent(percent: number): number {
  return Math.round(percent * 10) / 10;
}

export function formatBreadthStrengthDisplay(strengthPercent: number): string {
  return `${normalizeBreadthPercent(strengthPercent).toFixed(1)}%`;
}

/**
 * Map participation strength (% above 50DMA) to breadth weakness proxy.
 * Higher strength → lower weakness (monotonic inverse).
 */
export function mapSp500Above50MaToBreadthWeakness(strengthPercent: number): number {
  const v = normalizeBreadthPercent(strengthPercent);
  const anchors = BREADTH_STRENGTH_ANCHORS;

  if (v <= anchors[0].strength) return anchors[0].weakness;
  if (v >= anchors[anchors.length - 1].strength) return anchors[anchors.length - 1].weakness;

  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i];
    const right = anchors[i + 1];
    if (v <= right.strength) {
      const t = (v - left.strength) / (right.strength - left.strength);
      return clampInt(left.weakness + t * (right.weakness - left.weakness), 0, 100);
    }
  }

  return clampInt(anchors[anchors.length - 1].weakness, 0, 100);
}

export function breadthParticipationBandLabel(strengthPercent: number): string {
  const s = normalizeBreadthPercent(strengthPercent);
  if (s >= 75) return 'Broad participation';
  if (s >= 60) return 'Healthy participation';
  if (s >= 50) return 'Mixed / split market';
  if (s >= 40) return 'Narrow participation';
  if (s >= 30) return 'Weak participation';
  return 'Very narrow participation';
}

export function formatMarketBreadthDisplayValue(
  strengthPercent: number,
  weaknessProxy: number
): string {
  return `${formatBreadthStrengthDisplay(strengthPercent)} above 50-day MA · weakness proxy ${weaknessProxy}/100`;
}

export function buildMarketBreadthExplanation(
  artifact: MarketBreadthArtifactV1,
  weaknessProxy: number
): string {
  const strength = artifact.observations.sp500Above50DayMaPercent;
  const band = breadthParticipationBandLabel(strength);
  return `StockCharts $SPXA50R ${formatBreadthStrengthDisplay(strength)} of S&P 500 names above their 50-day MA mapped to ${weaknessProxy}/100 breadth weakness proxy (${band}).`;
}

export const MARKET_BREADTH_CARD_CAVEAT =
  'Public participation proxy. Measures how many S&P 500 names are above their 50-day MA, not a crash signal. Weak breadth can persist; strong breadth does not guarantee safety.';

export function validateMarketBreadthArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): MarketBreadthValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== 'breadth') errors.push('signalId must be "breadth".');
  if (raw.seriesDefinition !== 'sp500_percent_above_50_day_ma') {
    errors.push('seriesDefinition must be sp500_percent_above_50_day_ma.');
  }
  if (raw.updateFrequency !== 'daily') errors.push('updateFrequency must be "daily".');

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD) — breadth observation date.');
  } else {
    if (compareIso(asOf, referenceAsOf) > 0) {
      errors.push(`asOf (${asOf}) cannot be after GHOSTFLOW_REFERENCE_AS_OF (${referenceAsOf}).`);
    }
    if (!isWeekday(asOf)) {
      warnings.push(`asOf (${asOf}) is a weekend — expected last trading day for daily breadth.`);
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
    const val = raw.observations.sp500Above50DayMaPercent;
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      errors.push('observations.sp500Above50DayMaPercent must be a finite number.');
    } else if (val < STRENGTH_MIN || val > STRENGTH_MAX) {
      errors.push(
        `observations.sp500Above50DayMaPercent must be between ${STRENGTH_MIN} and ${STRENGTH_MAX}.`
      );
    } else {
      const normalized = normalizeBreadthPercent(val);
      if (Math.abs(val - normalized) > 1e-9) {
        warnings.push(
          `observations.sp500Above50DayMaPercent has more than one decimal place (${val}); store one decimal (${normalized}).`
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const artifact = raw as unknown as MarketBreadthArtifactV1;
  artifact.observations.sp500Above50DayMaPercent = normalizeBreadthPercent(
    artifact.observations.sp500Above50DayMaPercent
  );

  return {
    ok: true,
    artifact,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function loadMarketBreadthArtifact(): MarketBreadthValidation {
  return validateMarketBreadthArtifact(marketBreadthArtifactJson);
}

export function evaluateMarketBreadthArtifactFreshness(
  artifact: MarketBreadthArtifactV1,
  referenceAsOf: string
) {
  return evaluateDailyArtifactFreshness(
    artifact.asOf,
    referenceAsOf,
    'Market Breadth Participation'
  );
}

export const MARKET_BREADTH_ARTIFACT_PATH = 'data/ghostflow/artifacts/marketBreadth.v1.json';
