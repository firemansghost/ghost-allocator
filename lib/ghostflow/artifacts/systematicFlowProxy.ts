/**
 * GhostFlow v0.9d+ — CFTC TFF leveraged-funds positioning proxy.
 * Pure validation/mapping helpers. Production load available; no buildSnapshot merge yet.
 */

import systematicFlowProxyArtifactJson from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.json';
import { calendarDaysAfter } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type {
  ArtifactFreshnessResult,
  GhostFlowArtifactFreshnessStatus,
  SystematicFlowProxyArtifactV1,
  SystematicFlowProxyBasket,
  SystematicFlowProxyBasketDirection,
  SystematicFlowProxyContractObservation,
  SystematicFlowProxyScoreContract,
  SystematicFlowProxyValidation,
  SystematicFlowProxyVixContext,
} from './types';

/** Example path only until production artifact ships. */
export const SYSTEMATIC_FLOW_PROXY_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/systematicFlowProxy.v1.example.json';

export const SYSTEMATIC_FLOW_PROXY_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/systematicFlowProxy.v1.json';

export const SYSTEMATIC_FLOW_PROXY_SIGNAL_ID = 'systematic-flow-proxy' as const;

export const TFF_FUTURES_ONLY_DATASET_ID = 'gpe5-46if' as const;

export const MVP_SCORE_CONTRACT_CODES = ['13874A', '209742', '239742'] as const;

export const VIX_CONTEXT_CONTRACT_CODE = '1170E1' as const;

export const BASKET_FLAT_THRESHOLD_PCT_OI = 1.0;

export const BASKET_NET_CONTRACTS_TOLERANCE = 2;

export const BASKET_NET_PCT_OI_TOLERANCE = 0.15;

export const BASKET_SCORE_TOLERANCE = 1;

const FRESHNESS_FRESH_DAYS = 10;
const FRESHNESS_CAUTION_DAYS = 17;

export const SYSTEMATIC_FLOW_PROXY_CARD_CAVEAT =
  'Leveraged-funds futures positioning proxy (CFTC TFF), not CTA/vol-control/systematic flow or measured market flow.';

/** GhostFlow dashboard card id (display-only v0.9f; distinct from artifact signalId). */
export const SYSTEMATIC_FLOW_DISPLAY_SIGNAL_ID = 'systematic-flow' as const;

export const SYSTEMATIC_FLOW_DISPLAY_SIGNAL_NAME =
  'CFTC Leveraged-Funds Positioning Proxy' as const;

export const SYSTEMATIC_FLOW_DISPLAY_CARD_CAVEAT =
  'Display-only CFTC TFF positioning proxy; not included in the Research Composite.';

export function formatBasketDirectionLabel(
  direction: SystematicFlowProxyBasketDirection
): string {
  switch (direction) {
    case 'net_long':
      return 'Net long';
    case 'net_short':
      return 'Net short';
    case 'flat':
      return 'Flat';
  }
}

export function formatSystematicFlowDisplayValue(basket: SystematicFlowProxyBasket): string {
  const pct = Math.abs(basket.basketNetPctOi).toFixed(1);
  return `${formatBasketDirectionLabel(basket.basketDirection)} ${pct}% OI · pressure ${basket.basketScore}`;
}

export function buildSystematicFlowDisplayExplanation(artifact: SystematicFlowProxyArtifactV1): string {
  const { basket } = artifact;
  const direction = formatBasketDirectionLabel(basket.basketDirection).toLowerCase();
  const pct = Math.abs(basket.basketNetPctOi).toFixed(1);
  return (
    `CFTC TFF leveraged-funds futures positioning proxy: ES/NQ/RTY basket is ${direction} ` +
    `(${pct}% of combined open interest, mapped pressure ${basket.basketScore}). ` +
    `Positioning is not measured market flow and is not a CTA, vol-control, or risk-parity read. ` +
    `Display-only — not wired into the Research Composite.`
  );
}

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

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function requireNonNegative(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v)) {
    errors.push(`${name} must be a finite number.`);
    return false;
  }
  if (v < 0) {
    errors.push(`${name} must be non-negative.`);
    return false;
  }
  return true;
}

function requireFinite(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v)) {
    errors.push(`${name} must be a finite number.`);
    return false;
  }
  return true;
}

export function computeNetContracts(leveragedFundsLong: number, leveragedFundsShort: number): number {
  return leveragedFundsLong - leveragedFundsShort;
}

export function computeNetPctOi(netContracts: number, openInterestAll: number): number | null {
  if (!Number.isFinite(openInterestAll) || openInterestAll <= 0) return null;
  return (100 * netContracts) / openInterestAll;
}

export function computeDeltaNetContracts(changeLong: number, changeShort: number): number {
  return changeLong - changeShort;
}

export function resolveBasketDirection(basketNetPctOi: number): SystematicFlowProxyBasketDirection {
  if (Math.abs(basketNetPctOi) < BASKET_FLAT_THRESHOLD_PCT_OI) return 'flat';
  return basketNetPctOi > 0 ? 'net_long' : 'net_short';
}

export function mapBasketNetPctOiToPressureScore(basketNetPctOi: number): number {
  return clampInt(Math.abs(basketNetPctOi) * 5, 0, 100);
}

export function computeBasketMetrics(
  contracts: SystematicFlowProxyScoreContract[]
): SystematicFlowProxyBasket {
  let basketNetContracts = 0;
  let basketOpenInterestAll = 0;
  let basketWeeklyDeltaNetContracts = 0;

  for (const c of contracts) {
    const o = c.observations;
    const net = computeNetContracts(o.leveragedFundsLong, o.leveragedFundsShort);
    basketNetContracts += net;
    basketOpenInterestAll += o.openInterestAll;
    basketWeeklyDeltaNetContracts += computeDeltaNetContracts(o.changeLong, o.changeShort);
  }

  const basketNetPctOi = computeNetPctOi(basketNetContracts, basketOpenInterestAll) ?? 0;
  const roundedPct = Math.round(basketNetPctOi * 10) / 10;
  const basketAbsNetPctOi = Math.abs(roundedPct);

  return {
    basketNetContracts,
    basketOpenInterestAll,
    basketNetPctOi: roundedPct,
    basketAbsNetPctOi,
    basketDirection: resolveBasketDirection(roundedPct),
    basketWeeklyDeltaNetContracts,
    basketScore: mapBasketNetPctOiToPressureScore(roundedPct),
  };
}

function parseContractObservation(
  raw: unknown,
  prefix: string,
  errors: string[]
): SystematicFlowProxyContractObservation | null {
  if (!isPlainObject(raw)) {
    errors.push(`${prefix} observations must be an object.`);
    return null;
  }
  const reportDate = raw.reportDate;
  const reportWeek = raw.reportWeek;
  if (typeof reportDate !== 'string' || !parseIsoDate(reportDate)) {
    errors.push(`${prefix} reportDate must be ISO YYYY-MM-DD.`);
  }
  if (typeof reportWeek !== 'string' || !reportWeek.trim()) {
    errors.push(`${prefix} reportWeek must be a non-empty string.`);
  }

  const oi = raw.openInterestAll;
  const lng = raw.leveragedFundsLong;
  const sht = raw.leveragedFundsShort;
  const spd = raw.leveragedFundsSpread;
  const chL = raw.changeLong;
  const chS = raw.changeShort;
  const chSp = raw.changeSpread;
  const pL = raw.pctOiLong;
  const pS = raw.pctOiShort;
  const pSp = raw.pctOiSpread;

  requireNonNegative(`${prefix} openInterestAll`, oi, errors);
  requireNonNegative(`${prefix} leveragedFundsLong`, lng, errors);
  requireNonNegative(`${prefix} leveragedFundsShort`, sht, errors);
  requireNonNegative(`${prefix} leveragedFundsSpread`, spd, errors);
  requireFinite(`${prefix} changeLong`, chL, errors);
  requireFinite(`${prefix} changeShort`, chS, errors);
  requireFinite(`${prefix} changeSpread`, chSp, errors);
  requireFinite(`${prefix} pctOiLong`, pL, errors);
  requireFinite(`${prefix} pctOiShort`, pS, errors);
  requireFinite(`${prefix} pctOiSpread`, pSp, errors);

  if (errors.some((e) => e.startsWith(prefix))) return null;

  return {
    reportDate: reportDate as string,
    reportWeek: reportWeek as string,
    openInterestAll: oi as number,
    leveragedFundsLong: lng as number,
    leveragedFundsShort: sht as number,
    leveragedFundsSpread: spd as number,
    changeLong: chL as number,
    changeShort: chS as number,
    changeSpread: chSp as number,
    pctOiLong: pL as number,
    pctOiShort: pS as number,
    pctOiSpread: pSp as number,
  };
}

function parseScoreContract(
  raw: unknown,
  errors: string[]
): SystematicFlowProxyScoreContract | null {
  if (!isPlainObject(raw)) {
    errors.push('Each score contract must be an object.');
    return null;
  }
  const code = raw.cftcContractMarketCode;
  const name = raw.contractMarketName;
  if (typeof code !== 'string' || !code.trim()) {
    errors.push('cftcContractMarketCode must be a non-empty string.');
  }
  if (typeof name !== 'string' || !name.trim()) {
    errors.push('contractMarketName must be a non-empty string.');
  }
  if (raw.usedInScore !== true) {
    errors.push(`Contract ${String(code)} must have usedInScore true.`);
  }
  const obs = parseContractObservation(raw.observations, `Contract ${String(code)}`, errors);
  if (!obs) return null;
  return {
    cftcContractMarketCode: code as string,
    contractMarketName: name as string,
    usedInScore: true,
    observations: obs,
  };
}

function parseVixContext(raw: unknown, errors: string[]): SystematicFlowProxyVixContext | undefined {
  if (raw === undefined) return undefined;
  if (!isPlainObject(raw)) {
    errors.push('vixContext must be an object when present.');
    return undefined;
  }
  if (raw.usedInScore !== false) {
    errors.push('vixContext.usedInScore must be false.');
  }
  const code = raw.cftcContractMarketCode;
  if (code !== VIX_CONTEXT_CONTRACT_CODE) {
    errors.push(`vixContext.cftcContractMarketCode must be ${VIX_CONTEXT_CONTRACT_CODE}.`);
  }
  const obs = parseContractObservation(raw.observations, 'vixContext', errors);
  if (!obs) return undefined;
  return {
    cftcContractMarketCode: VIX_CONTEXT_CONTRACT_CODE,
    contractMarketName:
      typeof raw.contractMarketName === 'string' ? raw.contractMarketName : 'VIX FUTURES',
    usedInScore: false,
    observations: obs,
  };
}

function reconcileBasket(
  stored: SystematicFlowProxyBasket,
  computed: SystematicFlowProxyBasket,
  errors: string[]
): void {
  if (Math.abs(stored.basketNetContracts - computed.basketNetContracts) > BASKET_NET_CONTRACTS_TOLERANCE) {
    errors.push(
      `basket.basketNetContracts ${stored.basketNetContracts} does not match computed ${computed.basketNetContracts}.`
    );
  }
  if (stored.basketOpenInterestAll !== computed.basketOpenInterestAll) {
    errors.push(
      `basket.basketOpenInterestAll ${stored.basketOpenInterestAll} does not match computed ${computed.basketOpenInterestAll}.`
    );
  }
  if (Math.abs(stored.basketNetPctOi - computed.basketNetPctOi) > BASKET_NET_PCT_OI_TOLERANCE) {
    errors.push(
      `basket.basketNetPctOi ${stored.basketNetPctOi} does not match computed ${computed.basketNetPctOi}.`
    );
  }
  if (Math.abs(stored.basketAbsNetPctOi - computed.basketAbsNetPctOi) > BASKET_NET_PCT_OI_TOLERANCE) {
    errors.push(`basket.basketAbsNetPctOi does not match |basketNetPctOi|.`);
  }
  if (stored.basketDirection !== computed.basketDirection) {
    errors.push(
      `basket.basketDirection ${stored.basketDirection} does not match computed ${computed.basketDirection}.`
    );
  }
  if (Math.abs(stored.basketScore - computed.basketScore) > BASKET_SCORE_TOLERANCE) {
    errors.push(`basket.basketScore ${stored.basketScore} does not match computed ${computed.basketScore}.`);
  }
  if (
    stored.basketWeeklyDeltaNetContracts !== undefined &&
    computed.basketWeeklyDeltaNetContracts !== undefined &&
    stored.basketWeeklyDeltaNetContracts !== computed.basketWeeklyDeltaNetContracts
  ) {
    errors.push(
      `basket.basketWeeklyDeltaNetContracts ${stored.basketWeeklyDeltaNetContracts} does not match computed ${computed.basketWeeklyDeltaNetContracts}.`
    );
  }
}

function enforceReportAlignment(
  asOf: string,
  scoreContracts: SystematicFlowProxyScoreContract[],
  vixContext: SystematicFlowProxyVixContext | undefined,
  errors: string[]
): void {
  if (scoreContracts.length === 0) return;

  const expectedWeek = scoreContracts[0]!.observations.reportWeek;

  for (const contract of scoreContracts) {
    const { cftcContractMarketCode, usedInScore, observations } = contract;
    if (usedInScore !== true) {
      errors.push(`Contract ${cftcContractMarketCode} must have usedInScore true.`);
    }
    if (observations.reportDate !== asOf) {
      errors.push(
        `Contract ${cftcContractMarketCode} reportDate ${observations.reportDate} must equal artifact asOf ${asOf}.`
      );
    }
    if (observations.reportWeek !== expectedWeek) {
      errors.push(
        `Contract ${cftcContractMarketCode} reportWeek "${observations.reportWeek}" must match shared reportWeek "${expectedWeek}".`
      );
    }
  }

  if (vixContext) {
    if (vixContext.usedInScore !== false) {
      errors.push('vixContext.usedInScore must be false.');
    }
    if (vixContext.observations.reportDate !== asOf) {
      errors.push(
        `vixContext reportDate ${vixContext.observations.reportDate} must equal artifact asOf ${asOf}.`
      );
    }
    if (vixContext.observations.reportWeek !== expectedWeek) {
      errors.push(
        `vixContext reportWeek "${vixContext.observations.reportWeek}" must match shared reportWeek "${expectedWeek}".`
      );
    }
  }
}

export function systematicFlowProxyFreshnessAnchor(artifact: SystematicFlowProxyArtifactV1): string {
  return artifact.publishedAt ?? artifact.asOf;
}

function statusFromCftcFreshnessDays(days: number): GhostFlowArtifactFreshnessStatus {
  if (days <= FRESHNESS_FRESH_DAYS) return 'fresh';
  if (days <= FRESHNESS_CAUTION_DAYS) return 'caution';
  return 'stale';
}

export function evaluateSystematicFlowProxyArtifactFreshness(
  artifact: SystematicFlowProxyArtifactV1,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): ArtifactFreshnessResult {
  const anchor = systematicFlowProxyFreshnessAnchor(artifact);
  const ageDays = calendarDaysAfter(anchor, referenceAsOf);
  const status = statusFromCftcFreshnessDays(ageDays);
  const warnings: string[] = [];
  const label = 'CFTC TFF Positioning Proxy';

  if (status === 'caution') {
    warnings.push(
      `${label} artifact is ${ageDays} calendar days since release (caution: ${FRESHNESS_FRESH_DAYS + 1}–${FRESHNESS_CAUTION_DAYS} days).`
    );
  } else if (status === 'stale') {
    warnings.push(
      `${label} artifact is ${ageDays} calendar days since release (stale: >${FRESHNESS_CAUTION_DAYS} days). Refresh recommended.`
    );
  }

  return { status, ageDays, warnings };
}

export function validateSystematicFlowProxyArtifact(
  raw: unknown,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): SystematicFlowProxyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== SYSTEMATIC_FLOW_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${SYSTEMATIC_FLOW_PROXY_SIGNAL_ID}".`);
  }
  if (raw.updateFrequency !== 'weekly') errors.push('updateFrequency must be "weekly".');
  if (raw.seriesDefinition !== 'cftc_tff_futures_only_leveraged_funds_equity_basket') {
    errors.push('seriesDefinition must be "cftc_tff_futures_only_leveraged_funds_equity_basket".');
  }
  if (raw.datasetId !== TFF_FUTURES_ONLY_DATASET_ID) {
    errors.push(`datasetId must be "${TFF_FUTURES_ONLY_DATASET_ID}".`);
  }

  const asOf = raw.asOf;
  const publishedAt = raw.publishedAt;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be ISO YYYY-MM-DD.');
  }
  if (typeof publishedAt !== 'string' || !parseIsoDate(publishedAt)) {
    errors.push('publishedAt must be ISO YYYY-MM-DD.');
  } else if (typeof asOf === 'string' && parseIsoDate(asOf) && compareIso(publishedAt, asOf) < 0) {
    errors.push('publishedAt cannot be before asOf.');
  }

  if (!isPlainObject(raw.source) || typeof raw.source.name !== 'string' || !raw.source.name.trim()) {
    errors.push('source.name is required.');
  }

  if (!Array.isArray(raw.scoreContracts)) {
    errors.push('scoreContracts must be an array.');
    return { ok: false, errors };
  }

  const scoreContracts: SystematicFlowProxyScoreContract[] = [];
  for (const item of raw.scoreContracts) {
    const parsed = parseScoreContract(item, errors);
    if (parsed) scoreContracts.push(parsed);
  }

  const codes = scoreContracts.map((c) => c.cftcContractMarketCode);
  for (const required of MVP_SCORE_CONTRACT_CODES) {
    if (!codes.includes(required)) {
      errors.push(`Missing required MVP contract ${required}.`);
    }
  }
  const seen = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) errors.push(`Duplicate score contract ${code}.`);
    seen.add(code);
  }

  const vixContext = parseVixContext(raw.vixContext, errors);

  if (!isPlainObject(raw.basket)) {
    errors.push('basket must be an object.');
    return { ok: false, errors };
  }

  if (errors.length > 0 || scoreContracts.length < MVP_SCORE_CONTRACT_CODES.length) {
    return { ok: false, errors };
  }

  if (typeof asOf === 'string' && parseIsoDate(asOf)) {
    enforceReportAlignment(asOf, scoreContracts, vixContext, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const computed = computeBasketMetrics(scoreContracts);
  const stored: SystematicFlowProxyBasket = {
    basketNetContracts: raw.basket.basketNetContracts as number,
    basketOpenInterestAll: raw.basket.basketOpenInterestAll as number,
    basketNetPctOi: raw.basket.basketNetPctOi as number,
    basketAbsNetPctOi: raw.basket.basketAbsNetPctOi as number,
    basketDirection: raw.basket.basketDirection as SystematicFlowProxyBasketDirection,
    basketWeeklyDeltaNetContracts: raw.basket.basketWeeklyDeltaNetContracts as number | undefined,
    basketScore: raw.basket.basketScore as number,
  };

  if (!isFiniteNumber(stored.basketNetContracts)) errors.push('basket.basketNetContracts must be finite.');
  if (!requireNonNegative('basket.basketOpenInterestAll', stored.basketOpenInterestAll, errors)) {
    /* logged */
  }
  if (!isFiniteNumber(stored.basketNetPctOi)) errors.push('basket.basketNetPctOi must be finite.');
  if (!isFiniteNumber(stored.basketAbsNetPctOi)) errors.push('basket.basketAbsNetPctOi must be finite.');
  if (
    stored.basketDirection !== 'net_long' &&
    stored.basketDirection !== 'net_short' &&
    stored.basketDirection !== 'flat'
  ) {
    errors.push('basket.basketDirection must be net_long, net_short, or flat.');
  }
  if (!isFiniteNumber(stored.basketScore) || stored.basketScore < 0 || stored.basketScore > 100) {
    errors.push('basket.basketScore must be 0–100.');
  }
  if (
    stored.basketWeeklyDeltaNetContracts !== undefined &&
    !isFiniteNumber(stored.basketWeeklyDeltaNetContracts)
  ) {
    errors.push('basket.basketWeeklyDeltaNetContracts must be finite when present.');
  }

  reconcileBasket(stored, computed, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const artifact: SystematicFlowProxyArtifactV1 = {
    artifactVersion: '1',
    signalId: SYSTEMATIC_FLOW_PROXY_SIGNAL_ID,
    designOnly: raw.designOnly === true ? true : undefined,
    asOf: asOf as string,
    publishedAt: publishedAt as string,
    source: raw.source as SystematicFlowProxyArtifactV1['source'],
    seriesDefinition: 'cftc_tff_futures_only_leveraged_funds_equity_basket',
    updateFrequency: 'weekly',
    dataQuality:
      raw.dataQuality === 'verified_manual' || raw.dataQuality === 'manual_unverified'
        ? raw.dataQuality
        : 'manual_unverified',
    datasetId: TFF_FUTURES_ONLY_DATASET_ID,
    scoreContracts,
    vixContext,
    basket: stored,
  };

  const freshness = evaluateSystematicFlowProxyArtifactFreshness(artifact, referenceAsOf);
  warnings.push(...freshness.warnings);

  return { ok: true, artifact, warnings: warnings.length > 0 ? warnings : undefined };
}

export function loadSystematicFlowProxyArtifact(): SystematicFlowProxyValidation {
  return validateSystematicFlowProxyArtifact(
    systematicFlowProxyArtifactJson,
    GHOSTFLOW_REFERENCE_AS_OF
  );
}
