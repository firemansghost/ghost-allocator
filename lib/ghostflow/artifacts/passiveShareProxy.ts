/**
 * GhostFlow v0.6 — ICI Index Share Proxy artifact load, validation, and mapping.
 */

import passiveShareProxyArtifactJson from '@/data/ghostflow/artifacts/passiveShareProxy.v1.json';
import { evaluateMonthlyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import { distanceToModelStressZone, passiveShareBand } from '@/lib/ghostflow/scoring';
import type { PassiveShareProxyArtifactV1, PassiveShareProxyValidation } from './types';

const INDEX_SHARE_MIN = 35.0;
const INDEX_SHARE_MAX = 85.0;
const COMPUTED_SHARE_TOLERANCE_PP = 0.1;
const MODEL_STRESS_ZONE_THRESHOLD = 65;

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

export function computeIndexAssetSharePercent(
  activeAssetsMillionsUsd: number,
  indexAssetsMillionsUsd: number
): number {
  const total = activeAssetsMillionsUsd + indexAssetsMillionsUsd;
  return (indexAssetsMillionsUsd / total) * 100;
}

export function mapIndexSharePercentToStructuralProxy(indexAssetSharePercent: number): number {
  return clampInt(indexAssetSharePercent, 0, 100);
}

export function formatIndexSharePercentDisplay(indexAssetSharePercent: number): string {
  const rounded = Math.round(indexAssetSharePercent * 10) / 10;
  return `${rounded.toFixed(1)}%`;
}

export function formatPassiveShareProxyDisplayValue(indexAssetSharePercent: number): string {
  return `ICI fund/ETF index share: ${formatIndexSharePercentDisplay(indexAssetSharePercent)}`;
}

export function formatDistanceToModelZoneDisplay(distancePp: number): string {
  const rounded = Math.round(distancePp * 10) / 10;
  return `${rounded.toFixed(1)} pp`;
}

/** Map distance below 65% zone to 0–100 card status (wider gap → lower numeric). */
export function mapDistanceToZoneNumericValue(distancePp: number): number {
  return clampInt(100 - distancePp * 8, 0, 100);
}

export function passiveShareProxyFreshnessAnchor(artifact: PassiveShareProxyArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

export function buildPassiveShareProxyExplanation(indexAssetSharePercent: number, structuralProxy: number): string {
  const band = passiveShareBand(indexAssetSharePercent);
  return (
    `Index domestic equity mutual fund + ETF assets divided by active + index domestic equity mutual fund + ETF assets ` +
    `(${formatIndexSharePercentDisplay(indexAssetSharePercent)}; ${band.rangeLabel} band). ` +
    `ICI index share structural sub-input ${structuralProxy}/100, not a market-wide passive-share estimate.`
  );
}

export const PASSIVE_SHARE_PROXY_CARD_CAVEAT =
  'ICI index-share data is a public proxy, not a perfect measure of true passive control of market pricing or active price-discovery capital. Not a market-wide passive-share estimate.';

export const DISTANCE_TO_65_CARD_CAVEAT =
  'ICI index-share data is a public proxy, not a perfect measure of true passive control of market pricing. GhostFlow treats the 60–65% area as a model-stress zone, not a precise tripwire or crash countdown. Derived from the ICI Index Share Proxy only.';

export function buildPassiveShareDenominatorWarning(indexAssetSharePercent: number): string {
  const pct = formatIndexSharePercentDisplay(indexAssetSharePercent);
  return (
    `Broader market-structure estimates place passive share closer to the mid-50% range. GhostFlow's ${pct} ICI Index Share Proxy uses a narrower fund/ETF denominator, so the two numbers are not directly comparable.`
  );
}

export function buildDistanceTo65Explanation(distancePp: number): string {
  if (distancePp <= 0) {
    return (
      `ICI Index Share Proxy is at or above the ~${MODEL_STRESS_ZONE_THRESHOLD}% model-stress-zone reference in published passive-flow framing ` +
      `(broader 60–65% zone depending on definition). Proxy context only — pressure gauge, not a crash countdown or forecast.`
    );
  }
  return (
    `${formatDistanceToModelZoneDisplay(distancePp)} below the ~${MODEL_STRESS_ZONE_THRESHOLD}% model-stress-zone reference ` +
    `(60–65% framing in published research), from the ICI Index Share Proxy (narrow fund/ETF denominator). ` +
    `Context only — possible pathways, not predictions; not market-wide passive share.`
  );
}

export const DISTANCE_TO_65_SIGNAL_NAME = 'Distance to Model-Stress Zone';

export function validatePassiveShareProxyArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): PassiveShareProxyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== 'passive-share') errors.push('signalId must be "passive-share".');
  if (raw.seriesDefinition !== 'ici_domestic_equity_index_asset_share_percent') {
    errors.push('seriesDefinition must be ici_domestic_equity_index_asset_share_percent.');
  }
  if (raw.updateFrequency !== 'monthly') errors.push('updateFrequency must be "monthly".');

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD) — asset month-end date.');
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
    const active = raw.observations.activeDomesticEquityAssetsMillionsUsd;
    const index = raw.observations.indexDomesticEquityAssetsMillionsUsd;
    const stored = raw.observations.indexAssetSharePercent;

    if (typeof active !== 'number' || !Number.isFinite(active) || active <= 0) {
      errors.push('observations.activeDomesticEquityAssetsMillionsUsd must be a finite number > 0.');
    }
    if (typeof index !== 'number' || !Number.isFinite(index) || index <= 0) {
      errors.push('observations.indexDomesticEquityAssetsMillionsUsd must be a finite number > 0.');
    }
    if (typeof stored !== 'number' || !Number.isFinite(stored)) {
      errors.push('observations.indexAssetSharePercent must be a finite number.');
    } else if (stored < INDEX_SHARE_MIN || stored > INDEX_SHARE_MAX) {
      errors.push(
        `observations.indexAssetSharePercent must be between ${INDEX_SHARE_MIN} and ${INDEX_SHARE_MAX}.`
      );
    }

    if (
      typeof active === 'number' &&
      Number.isFinite(active) &&
      active > 0 &&
      typeof index === 'number' &&
      Number.isFinite(index) &&
      index > 0 &&
      typeof stored === 'number' &&
      Number.isFinite(stored)
    ) {
      const computed = computeIndexAssetSharePercent(active, index);
      if (Math.abs(computed - stored) > COMPUTED_SHARE_TOLERANCE_PP) {
        errors.push(
          `observations.indexAssetSharePercent (${stored}) must match computed share (${computed.toFixed(2)}) within ${COMPUTED_SHARE_TOLERANCE_PP} pp.`
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    artifact: raw as unknown as PassiveShareProxyArtifactV1,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function loadPassiveShareProxyArtifact(): PassiveShareProxyValidation {
  return validatePassiveShareProxyArtifact(passiveShareProxyArtifactJson);
}

export function evaluatePassiveShareProxyArtifactFreshness(
  artifact: PassiveShareProxyArtifactV1,
  referenceAsOf: string
) {
  return evaluateMonthlyArtifactFreshness(
    passiveShareProxyFreshnessAnchor(artifact),
    referenceAsOf,
    'ICI Index Share Proxy'
  );
}

export function deriveDistanceToModelZone(indexAssetSharePercent: number): number {
  const distance = distanceToModelStressZone(indexAssetSharePercent, MODEL_STRESS_ZONE_THRESHOLD);
  return Math.round(distance * 10) / 10;
}

export const PASSIVE_SHARE_PROXY_ARTIFACT_PATH = 'data/ghostflow/artifacts/passiveShareProxy.v1.json';
