/**
 * GhostFlow v0.2 — Volatility Regime artifact load, validation, and VIX mapping.
 */

import volatilityRegimeArtifactJson from '@/data/ghostflow/artifacts/volatilityRegime.v1.json';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type {
  VolatilityRegimeArtifactV1,
  VolatilityRegimeValidation,
} from './types';

const VIX_MIN = 5;
const VIX_MAX = 90;

/** Piecewise anchor points: VIX close → 0–100 proxy (higher = more vol amplifier pressure). */
export const VIX_PROXY_ANCHORS: ReadonlyArray<{ vix: number; proxy: number }> = [
  { vix: 12, proxy: 15 },
  { vix: 17, proxy: 35 },
  { vix: 22, proxy: 55 },
  { vix: 28, proxy: 72 },
  { vix: 29, proxy: 88 },
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

/**
 * Map CBOE VIX close to 0–100 volatility amplifier proxy.
 * Linear interpolation between documented anchors; clamped 0–100.
 */
export function mapVixCloseToNumericValue(vixClose: number): number {
  const v = vixClose;
  if (v <= VIX_PROXY_ANCHORS[0].vix) return VIX_PROXY_ANCHORS[0].proxy;
  if (v >= VIX_PROXY_ANCHORS[VIX_PROXY_ANCHORS.length - 1].vix) {
    return VIX_PROXY_ANCHORS[VIX_PROXY_ANCHORS.length - 1].proxy;
  }

  for (let i = 0; i < VIX_PROXY_ANCHORS.length - 1; i++) {
    const left = VIX_PROXY_ANCHORS[i];
    const right = VIX_PROXY_ANCHORS[i + 1];
    if (v <= right.vix) {
      const t = (v - left.vix) / (right.vix - left.vix);
      return clampInt(left.proxy + t * (right.proxy - left.proxy), 0, 100);
    }
  }

  return clampInt(VIX_PROXY_ANCHORS[VIX_PROXY_ANCHORS.length - 1].proxy, 0, 100);
}

export function vixBandLabel(vixClose: number): string {
  if (vixClose <= 12) return 'Quiet';
  if (vixClose <= 17) return 'Watch';
  if (vixClose <= 22) return 'Elevated';
  if (vixClose <= 28) return 'Stress';
  return 'Stress';
}

export function formatVolRegimeDisplayValue(vixClose: number): string {
  return `${vixClose.toFixed(2)} (VIX close)`;
}

export function buildVolRegimeExplanation(
  artifact: VolatilityRegimeArtifactV1,
  numericValue: number
): string {
  const band = vixBandLabel(artifact.observations.vixClose);
  return (
    `CBOE VIX close ${artifact.observations.vixClose.toFixed(2)} mapped to a ${numericValue}/100 volatility amplifier (${band}).`
  );
}

export const VOL_REGIME_CARD_CAVEAT =
  'Volatility amplifier proxy — not passive flow and not a crash countdown.';

export function validateVolatilityRegimeArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): VolatilityRegimeValidation {
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== 'vol-regime') {
    errors.push('signalId must be "vol-regime".');
  }

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD).');
  } else if (compareIso(asOf, referenceAsOf) > 0) {
    errors.push(`asOf (${asOf}) cannot be after GHOSTFLOW_REFERENCE_AS_OF (${referenceAsOf}).`);
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

  if (raw.updateFrequency !== 'daily') {
    errors.push('updateFrequency must be "daily".');
  }

  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations object is required.');
  } else {
    const vixClose = raw.observations.vixClose;
    if (typeof vixClose !== 'number' || !Number.isFinite(vixClose)) {
      errors.push('observations.vixClose must be a finite number.');
    } else if (vixClose < VIX_MIN || vixClose > VIX_MAX) {
      errors.push(`observations.vixClose must be between ${VIX_MIN} and ${VIX_MAX}.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, artifact: raw as unknown as VolatilityRegimeArtifactV1 };
}

export function loadVolatilityRegimeArtifact(): VolatilityRegimeValidation {
  return validateVolatilityRegimeArtifact(volatilityRegimeArtifactJson);
}

export const VOLATILITY_REGIME_ARTIFACT_PATH = 'data/ghostflow/artifacts/volatilityRegime.v1.json';
