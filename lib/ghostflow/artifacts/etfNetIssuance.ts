/**
 * GhostFlow v0.3 — ETF Net Issuance artifact load, validation, and mapping.
 */

import etfNetIssuanceArtifactJson from '@/data/ghostflow/artifacts/etfNetIssuance.v1.json';
import { evaluateWeeklyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type { EtfNetIssuanceArtifactV1, EtfNetIssuanceValidation } from './types';

const ISSUANCE_MIN_MILLIONS = -50000;
const ISSUANCE_MAX_MILLIONS = 80000;

/** Piecewise anchor points: domestic equity weekly net issuance ($M) → 0–100 proxy. */
export const ETF_ISSUANCE_PROXY_ANCHORS: ReadonlyArray<{ millions: number; proxy: number }> = [
  { millions: -10000, proxy: 15 },
  { millions: 0, proxy: 35 },
  { millions: 15000, proxy: 55 },
  { millions: 30000, proxy: 72 },
  { millions: 50000, proxy: 88 },
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

export function mapDomesticEquityIssuanceToNumericValue(millionsUsd: number): number {
  const v = millionsUsd;
  const anchors = ETF_ISSUANCE_PROXY_ANCHORS;
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

export function issuanceBandLabel(millionsUsd: number): string {
  if (millionsUsd <= 0) return 'Outflow / neutral';
  if (millionsUsd < 15000) return 'Moderate inflow';
  if (millionsUsd < 30000) return 'Elevated weekly inflow pressure';
  return 'Elevated weekly inflow pressure';
}

/** Display rounded billions — e.g. 33919 → "$33.9B" */
export function formatIssuanceBillions(millionsUsd: number): string {
  const billions = millionsUsd / 1000;
  const rounded = Math.round(billions * 10) / 10;
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${Math.abs(rounded).toFixed(1)}B`;
}

export function formatEtfFlowDisplayValue(millionsUsd: number, numericValue: number): string {
  return `${formatIssuanceBillions(millionsUsd)} · proxy ${numericValue}/100`;
}

export function etfFreshnessAnchor(artifact: EtfNetIssuanceArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

export function buildEtfFlowExplanation(
  artifact: EtfNetIssuanceArtifactV1,
  numericValue: number
): string {
  const band = issuanceBandLabel(artifact.observations.domesticEquityNetIssuanceMillionsUsd);
  const billions = formatIssuanceBillions(artifact.observations.domesticEquityNetIssuanceMillionsUsd);
  return (
    `ICI weekly domestic equity ETF net issuance ${billions} mapped to ${numericValue}/100 flow-pressure proxy (${band}).`
  );
}

export const ETF_FLOW_CARD_CAVEAT = 'Public proxy only — not passive share or total market flow.';

export function validateEtfNetIssuanceArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): EtfNetIssuanceValidation {
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== 'etf-flow') errors.push('signalId must be "etf-flow".');
  if (raw.seriesDefinition !== 'domestic_equity_etf_estimated_weekly_net_issuance') {
    errors.push('seriesDefinition must be domestic_equity_etf_estimated_weekly_net_issuance.');
  }
  if (raw.updateFrequency !== 'weekly') errors.push('updateFrequency must be "weekly".');

  const asOf = raw.asOf;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD) — week ended date.');
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

  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations object is required.');
  } else {
    const val = raw.observations.domesticEquityNetIssuanceMillionsUsd;
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      errors.push('observations.domesticEquityNetIssuanceMillionsUsd must be a finite number.');
    } else if (val < ISSUANCE_MIN_MILLIONS || val > ISSUANCE_MAX_MILLIONS) {
      errors.push(
        `observations.domesticEquityNetIssuanceMillionsUsd must be between ${ISSUANCE_MIN_MILLIONS} and ${ISSUANCE_MAX_MILLIONS}.`
      );
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, artifact: raw as unknown as EtfNetIssuanceArtifactV1 };
}

export function loadEtfNetIssuanceArtifact(): EtfNetIssuanceValidation {
  return validateEtfNetIssuanceArtifact(etfNetIssuanceArtifactJson);
}

export function evaluateEtfArtifactFreshness(
  artifact: EtfNetIssuanceArtifactV1,
  referenceAsOf: string
) {
  return evaluateWeeklyArtifactFreshness(etfFreshnessAnchor(artifact), referenceAsOf, 'ETF Net Issuance');
}

export const ETF_NET_ISSUANCE_ARTIFACT_PATH = 'data/ghostflow/artifacts/etfNetIssuance.v1.json';
