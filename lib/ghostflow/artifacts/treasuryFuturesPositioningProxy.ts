/**
 * GhostFlow v1.7b/d — Treasury futures positioning proxy artifact.
 * Pure validation and compute helpers; production loader for v1.7d candidate JSON.
 * No buildSnapshot merge or score wiring.
 */

import treasuryFuturesPositioningProxyArtifactJson from '@/data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json';
import type {
  TreasuryFuturesContractRole,
  TreasuryFuturesContractRowV1,
  TreasuryFuturesDirection,
  TreasuryFuturesPositioningArtifactV1,
  TreasuryFuturesPositioningObservationsV1,
  TreasuryFuturesPositioningValidation,
} from './types';

export const TREASURY_FUTURES_POSITIONING_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.example.json';

export const TREASURY_FUTURES_POSITIONING_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json';

export const TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID =
  'treasury-futures-positioning-proxy' as const;

export const TFF_FUTURES_ONLY_DATASET_ID = 'gpe5-46if' as const;

export const TREASURY_FUTURES_OBSERVATION_TYPE =
  'cftc_tff_treasury_futures_positioning_snapshot' as const;

export const TREASURY_FUTURES_SERIES_DEFINITION =
  'cftc_tff_futures_only_treasury_leveraged_funds_basket_v1' as const;

export const TREASURY_TIER1_CORE_CODES = ['042601', '044601', '043602', '020601'] as const;

export const TREASURY_FLAT_THRESHOLD_PCT_OI = 1.0;

export const NET_CONTRACTS_TOLERANCE = 2;

export const PCT_OI_TOLERANCE = 0.15;

export const TREASURY_FUTURES_DISPLAY_SIGNAL_NAME =
  'Treasury Futures Positioning Proxy' as const;

export const TREASURY_FUTURES_DISPLAY_CARD_CAVEAT =
  'Display-only CFTC TFF Treasury futures positioning proxy; not cash-futures basis, repo, or CTD; not in the Research Composite.';

const FORBIDDEN_SCORE_KEYS = [
  'mappedPressureScore',
  'candidatePressureScore',
  'basketScore',
  'pressureScore',
  'displayScore',
] as const;

const FORBIDDEN_BASIS_OVERCLAIM_KEYS = [
  'basisTradeMeasured',
  'cashFuturesBasis',
  'repoSpecialness',
  'ctd',
  'financingTerms',
] as const;

export type TreasuryFuturesValidationMode = 'example' | 'production';

export interface TreasuryFuturesValidateOptions {
  mode?: TreasuryFuturesValidationMode;
}

function normalizeValidateOptions(
  options?: TreasuryFuturesValidateOptions
): { mode: TreasuryFuturesValidationMode } {
  return { mode: options?.mode ?? 'example' };
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

function hasPopulatedValue(v: unknown): boolean {
  return v !== null && v !== undefined;
}

export function computeNet(long: number, short: number): number {
  return long - short;
}

export function computeGross(long: number, short: number): number {
  return long + short;
}

export function computePctOfOpenInterest(value: number, openInterest: number): number | null {
  if (!Number.isFinite(openInterest) || openInterest <= 0) return null;
  return (100 * value) / openInterest;
}

export function computeLeveragedVsAssetManagerSpread(levNet: number, assetManagerNet: number): number {
  return levNet - assetManagerNet;
}

export function classifyDirection(
  netPctOi: number,
  threshold = TREASURY_FLAT_THRESHOLD_PCT_OI
): TreasuryFuturesDirection {
  if (Math.abs(netPctOi) < threshold) return 'flat';
  return netPctOi > 0 ? 'net_long' : 'net_short';
}

export function computeBasketWeightedNetPctOi(rows: TreasuryFuturesContractRowV1[]): number | null {
  const agg = rows.filter((r) => r.usedInAggregate);
  if (agg.length === 0) return null;
  let netSum = 0;
  let oiSum = 0;
  for (const r of agg) {
    netSum += r.levMoneyNet;
    oiSum += r.openInterestAll;
  }
  return computePctOfOpenInterest(netSum, oiSum);
}

export function computeBasketGrossPctOi(rows: TreasuryFuturesContractRowV1[]): number | null {
  const agg = rows.filter((r) => r.usedInAggregate);
  if (agg.length === 0) return null;
  let grossSum = 0;
  let oiSum = 0;
  for (const r of agg) {
    grossSum += r.levMoneyGross;
    oiSum += r.openInterestAll;
  }
  return computePctOfOpenInterest(grossSum, oiSum);
}

export function computeBasketMetricsFromRows(
  rows: TreasuryFuturesContractRowV1[]
): TreasuryFuturesPositioningObservationsV1 {
  const agg = rows.filter((r) => r.usedInAggregate);
  let basketOpenInterestAll = 0;
  let basketLevMoneyNet = 0;
  let basketLevMoneyGross = 0;
  let basketAssetManagerNet = 0;
  let basketWowDeltaNet = 0;

  for (const r of agg) {
    basketOpenInterestAll += r.openInterestAll;
    basketLevMoneyNet += r.levMoneyNet;
    basketLevMoneyGross += r.levMoneyGross;
    basketAssetManagerNet += r.assetManagerNet;
    if (r.levMoneyWowDeltaNet !== undefined) {
      basketWowDeltaNet += r.levMoneyWowDeltaNet;
    }
  }

  const basketLevMoneyNetPctOi =
    Math.round((computePctOfOpenInterest(basketLevMoneyNet, basketOpenInterestAll) ?? 0) * 10) / 10;
  const basketLevMoneyGrossPctOi =
    Math.round((computePctOfOpenInterest(basketLevMoneyGross, basketOpenInterestAll) ?? 0) * 10) / 10;
  const basketAssetManagerNetPctOi =
    Math.round((computePctOfOpenInterest(basketAssetManagerNet, basketOpenInterestAll) ?? 0) * 10) / 10;

  return {
    reportWeek: agg[0]?.reportWeek ?? '',
    basketContractCount: agg.length,
    basketOpenInterestAll,
    basketLevMoneyNet,
    basketLevMoneyNetPctOi,
    basketLevMoneyGrossPctOi,
    basketAssetManagerNetPctOi,
    basketLevVsAssetManagerSpread: basketLevMoneyNet - basketAssetManagerNet,
    basketDirection: classifyDirection(basketLevMoneyNetPctOi),
    basketWowDeltaNet: agg.every((r) => r.levMoneyWowDeltaNet !== undefined)
      ? basketWowDeltaNet
      : undefined,
    mappingStatus: 'not_final',
  };
}

function scanForForbiddenKeys(obj: unknown, label: string, errors: string[]): void {
  if (!isPlainObject(obj)) return;
  for (const key of Object.keys(obj)) {
    if ((FORBIDDEN_SCORE_KEYS as readonly string[]).includes(key)) {
      errors.push(`${label} must not include ${key}.`);
    }
    if ((FORBIDDEN_BASIS_OVERCLAIM_KEYS as readonly string[]).includes(key)) {
      errors.push(`${label} must not include ${key} (basis-trade overclaim).`);
    }
    const val = obj[key];
    if (isPlainObject(val)) scanForForbiddenKeys(val, `${label}.${key}`, errors);
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        scanForForbiddenKeys(val[i], `${label}[${i}]`, errors);
      }
    }
  }
}

function requireNonNegativeInt(name: string, v: unknown, errors: string[]): v is number {
  if (!isFiniteNumber(v) || v < 0 || !Number.isInteger(v)) {
    errors.push(`${name} must be a finite non-negative integer.`);
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

function reconcilePct(stated: number, expected: number | null): boolean {
  if (expected === null) return false;
  return Math.abs(stated - expected) <= PCT_OI_TOLERANCE;
}

function parseContractRow(raw: unknown, errors: string[]): TreasuryFuturesContractRowV1 | null {
  if (!isPlainObject(raw)) {
    errors.push('Each contract row must be an object.');
    return null;
  }

  const code = raw.cftcContractMarketCode;
  const name = raw.contractMarketName;
  const tenor = raw.tenor;
  const role = raw.role;
  if (typeof code !== 'string' || !code.trim()) {
    errors.push('contract.cftcContractMarketCode is required.');
  }
  if (typeof name !== 'string' || !name.trim()) {
    errors.push(`contract ${code}: contractMarketName is required.`);
  }
  const validTenors = ['2Y', '5Y', '10Y', '30Y', 'ultra_10Y', 'ultra_30Y'];
  if (typeof tenor !== 'string' || !validTenors.includes(tenor)) {
    errors.push(`contract ${code}: tenor must be one of ${validTenors.join(', ')}.`);
  }
  const validRoles: TreasuryFuturesContractRole[] = [
    'core',
    'optional_context',
    'funding_context',
    'deferred',
  ];
  if (typeof role !== 'string' || !validRoles.includes(role as TreasuryFuturesContractRole)) {
    errors.push(`contract ${code}: role invalid.`);
  }

  const reportDate = raw.reportDate;
  const reportWeek = raw.reportWeek;
  if (typeof reportDate !== 'string' || !parseIsoDate(reportDate)) {
    errors.push(`contract ${code}: reportDate must be ISO YYYY-MM-DD.`);
  }
  if (typeof reportWeek !== 'string' || !reportWeek.trim()) {
    errors.push(`contract ${code}: reportWeek required.`);
  }

  const includeInBasket = raw.includeInBasket;
  const usedInAggregate = raw.usedInAggregate;
  if (typeof includeInBasket !== 'boolean') {
    errors.push(`contract ${code}: includeInBasket must be boolean.`);
  }
  if (typeof usedInAggregate !== 'boolean') {
    errors.push(`contract ${code}: usedInAggregate must be boolean.`);
  }

  if (role === 'funding_context' && usedInAggregate === true) {
    errors.push(`contract ${code}: funding_context cannot be usedInAggregate.`);
  }
  if (role === 'optional_context' && usedInAggregate === true) {
    errors.push(`contract ${code}: optional_context cannot be usedInAggregate.`);
  }
  if (includeInBasket === false && usedInAggregate === true) {
    errors.push(`contract ${code}: includeInBasket false cannot pair with usedInAggregate true.`);
  }
  if (role === 'core' && includeInBasket !== true) {
    errors.push(`contract ${code}: core role requires includeInBasket true.`);
  }

  const oi = raw.openInterestAll;
  const lng = raw.levMoneyLong;
  const sht = raw.levMoneyShort;
  const spd = raw.levMoneySpread;
  requireNonNegativeInt(`contract ${code} openInterestAll`, oi, errors);
  requireNonNegativeInt(`contract ${code} levMoneyLong`, lng, errors);
  requireNonNegativeInt(`contract ${code} levMoneyShort`, sht, errors);
  requireNonNegativeInt(`contract ${code} levMoneySpread`, spd, errors);

  const levNet = raw.levMoneyNet;
  const levGross = raw.levMoneyGross;
  const levNetPctOi = raw.levMoneyNetPctOi;
  const levGrossPctOi = raw.levMoneyGrossPctOi;
  requireFinite(`contract ${code} levMoneyNet`, levNet, errors);
  requireFinite(`contract ${code} levMoneyGross`, levGross, errors);
  requireFinite(`contract ${code} levMoneyNetPctOi`, levNetPctOi, errors);
  requireFinite(`contract ${code} levMoneyGrossPctOi`, levGrossPctOi, errors);

  if (isFiniteNumber(lng) && isFiniteNumber(sht) && isFiniteNumber(levNet)) {
    const expectedNet = computeNet(lng, sht);
    if (Math.abs(levNet - expectedNet) > NET_CONTRACTS_TOLERANCE) {
      errors.push(`contract ${code}: levMoneyNet must equal long − short (±${NET_CONTRACTS_TOLERANCE}).`);
    }
  }
  if (isFiniteNumber(lng) && isFiniteNumber(sht) && isFiniteNumber(levGross)) {
    const expectedGross = computeGross(lng, sht);
    if (Math.abs(levGross - expectedGross) > NET_CONTRACTS_TOLERANCE) {
      errors.push(`contract ${code}: levMoneyGross must equal long + short (±${NET_CONTRACTS_TOLERANCE}).`);
    }
  }
  if (isFiniteNumber(levNet) && isFiniteNumber(oi) && isFiniteNumber(levNetPctOi)) {
    if (!reconcilePct(levNetPctOi, computePctOfOpenInterest(levNet, oi))) {
      errors.push(`contract ${code}: levMoneyNetPctOi does not reconcile with net/OI.`);
    }
  }
  if (isFiniteNumber(levGross) && isFiniteNumber(oi) && isFiniteNumber(levGrossPctOi)) {
    if (!reconcilePct(levGrossPctOi, computePctOfOpenInterest(levGross, oi))) {
      errors.push(`contract ${code}: levMoneyGrossPctOi does not reconcile with gross/OI.`);
    }
  }

  const direction = raw.direction;
  const validDir: TreasuryFuturesDirection[] = ['net_long', 'net_short', 'flat'];
  if (typeof direction !== 'string' || !validDir.includes(direction as TreasuryFuturesDirection)) {
    errors.push(`contract ${code}: direction invalid.`);
  } else if (isFiniteNumber(levNetPctOi)) {
    const expectedDir = classifyDirection(levNetPctOi);
    if (direction !== expectedDir) {
      errors.push(`contract ${code}: direction must match levMoneyNetPctOi threshold.`);
    }
  }

  const amLng = raw.assetManagerLong;
  const amSht = raw.assetManagerShort;
  const amSpd = raw.assetManagerSpread;
  const amNet = raw.assetManagerNet;
  const amNetPctOi = raw.assetManagerNetPctOi;
  const levVsAm = raw.levVsAssetManagerSpread;

  if (role === 'core') {
    requireNonNegativeInt(`contract ${code} assetManagerLong`, amLng, errors);
    requireNonNegativeInt(`contract ${code} assetManagerShort`, amSht, errors);
    requireNonNegativeInt(`contract ${code} assetManagerSpread`, amSpd, errors);
    requireFinite(`contract ${code} assetManagerNet`, amNet, errors);
    requireFinite(`contract ${code} assetManagerNetPctOi`, amNetPctOi, errors);
    requireFinite(`contract ${code} levVsAssetManagerSpread`, levVsAm, errors);
  }

  if (isFiniteNumber(amLng) && isFiniteNumber(amSht) && isFiniteNumber(amNet)) {
    if (Math.abs(amNet - computeNet(amLng, amSht)) > NET_CONTRACTS_TOLERANCE) {
      errors.push(`contract ${code}: assetManagerNet must equal long − short.`);
    }
  }
  if (isFiniteNumber(amNet) && isFiniteNumber(oi) && isFiniteNumber(amNetPctOi)) {
    if (!reconcilePct(amNetPctOi, computePctOfOpenInterest(amNet, oi))) {
      errors.push(`contract ${code}: assetManagerNetPctOi does not reconcile.`);
    }
  }
  if (isFiniteNumber(levNet) && isFiniteNumber(amNet) && isFiniteNumber(levVsAm)) {
    if (Math.abs(levVsAm - computeLeveragedVsAssetManagerSpread(levNet, amNet)) > NET_CONTRACTS_TOLERANCE) {
      errors.push(`contract ${code}: levVsAssetManagerSpread must equal levMoneyNet − assetManagerNet.`);
    }
  }

  const changeLong = raw.changeLevMoneyLong;
  const changeShort = raw.changeLevMoneyShort;
  const wow = raw.levMoneyWowDeltaNet;
  if (changeLong !== undefined && changeShort !== undefined && wow !== undefined) {
    requireFinite(`contract ${code} changeLevMoneyLong`, changeLong, errors);
    requireFinite(`contract ${code} changeLevMoneyShort`, changeShort, errors);
    requireFinite(`contract ${code} levMoneyWowDeltaNet`, wow, errors);
    if (isFiniteNumber(changeLong) && isFiniteNumber(changeShort) && isFiniteNumber(wow)) {
      if (Math.abs(wow - (changeLong - changeShort)) > NET_CONTRACTS_TOLERANCE) {
        errors.push(`contract ${code}: levMoneyWowDeltaNet must equal changeLong − changeShort.`);
      }
    }
  }

  if (errors.some((e) => e.includes(String(code)))) {
    return null;
  }

  return raw as unknown as TreasuryFuturesContractRowV1;
}

export function validateTreasuryFuturesPositioningProxyArtifact(
  raw: unknown,
  options?: TreasuryFuturesValidateOptions
): TreasuryFuturesPositioningValidation {
  const { mode } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  scanForForbiddenKeys(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') errors.push('artifactVersion must be "1".');
  if (raw.signalId !== TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'weekly') {
    errors.push('updateFrequency must be "weekly".');
  }
  if (raw.observationType !== TREASURY_FUTURES_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${TREASURY_FUTURES_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== TREASURY_FUTURES_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${TREASURY_FUTURES_SERIES_DEFINITION}".`);
  }
  if (raw.datasetId !== TFF_FUTURES_ONLY_DATASET_ID) {
    errors.push(`datasetId must be "${TFF_FUTURES_ONLY_DATASET_ID}".`);
  }
  if (raw.dataQuality !== 'verified_manual' && raw.dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }
  if (raw.mappingStatus !== 'not_final') {
    errors.push('mappingStatus must be "not_final".');
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

  if (!isPlainObject(raw.source)) {
    errors.push('source must be an object.');
  } else {
    if (typeof raw.source.name !== 'string' || !raw.source.name.trim()) {
      errors.push('source.name is required.');
    }
    if (typeof raw.source.url !== 'string' || !raw.source.url.trim()) {
      errors.push('source.url is required.');
    }
  }

  if (!Array.isArray(raw.caveats) || raw.caveats.length === 0) {
    errors.push('caveats must be a non-empty array.');
  }

  if (!Array.isArray(raw.contracts)) {
    errors.push('contracts must be an array.');
    return { ok: false, errors };
  }

  const contracts: TreasuryFuturesContractRowV1[] = [];
  const seenCodes = new Set<string>();
  for (const item of raw.contracts) {
    const row = parseContractRow(item, errors);
    if (!row) continue;
    if (seenCodes.has(row.cftcContractMarketCode)) {
      errors.push(`Duplicate contract code ${row.cftcContractMarketCode}.`);
    }
    seenCodes.add(row.cftcContractMarketCode);
    if (typeof asOf === 'string' && row.reportDate !== asOf) {
      errors.push(`contract ${row.cftcContractMarketCode}: reportDate must equal artifact asOf.`);
    }
    contracts.push(row);
  }

  if (mode === 'example') {
    for (const required of TREASURY_TIER1_CORE_CODES) {
      const core = contracts.find(
        (c) => c.cftcContractMarketCode === required && c.role === 'core' && c.usedInAggregate
      );
      if (!core) {
        errors.push(`Example must include core aggregate contract ${required}.`);
      }
    }
  }

  if (!isPlainObject(raw.observations)) {
    errors.push('observations must be an object.');
    return { ok: false, errors };
  }

  const obs = raw.observations;
  if (obs.mappingStatus !== 'not_final') {
    errors.push('observations.mappingStatus must be "not_final".');
  }

  const expectedBasket = computeBasketMetricsFromRows(contracts);
  const checkObs = (field: keyof TreasuryFuturesPositioningObservationsV1, tol?: number) => {
    const stated = obs[field];
    const expected = expectedBasket[field];
    if (stated === undefined && expected === undefined) return;
    if (!isFiniteNumber(stated) || !isFiniteNumber(expected)) return;
    const t = tol ?? (field.includes('Pct') ? PCT_OI_TOLERANCE : NET_CONTRACTS_TOLERANCE);
    if (Math.abs(stated - expected) > t) {
      errors.push(`observations.${field} does not reconcile with aggregate rows.`);
    }
  };

  checkObs('basketContractCount', 0);
  checkObs('basketOpenInterestAll', 0);
  checkObs('basketLevMoneyNet', 0);
  checkObs('basketLevMoneyNetPctOi');
  checkObs('basketLevMoneyGrossPctOi');
  checkObs('basketAssetManagerNetPctOi');
  checkObs('basketLevVsAssetManagerSpread', 0);

  if (typeof obs.basketDirection === 'string' && obs.basketDirection !== expectedBasket.basketDirection) {
    errors.push('observations.basketDirection does not reconcile.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as TreasuryFuturesPositioningArtifactV1,
  };
}

export function loadTreasuryFuturesPositioningProxyArtifact(): TreasuryFuturesPositioningValidation {
  return validateTreasuryFuturesPositioningProxyArtifact(
    treasuryFuturesPositioningProxyArtifactJson,
    { mode: 'production' }
  );
}
