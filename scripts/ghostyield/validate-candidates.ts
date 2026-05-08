/**
 * Validates data/ghostyield/candidates.manual.json against JSON Schema + GhostYield rules.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { GHOSTYIELD_REFERENCE_AS_OF } from '../../lib/ghostyield/reference';

const root = process.cwd();
const manualPath = join(root, 'data/ghostyield/candidates.manual.json');
const schemaPath = join(root, 'data/ghostyield/candidates.schema.json');

const HIGH_YIELD_RISK_CUE =
  /high|elevated|stretched|unsustainable|speculat|leverage|roc|decay/i;
const ILLUSTRATIVE_LABEL_OK = /sample|illustrative|placeholder|manual/i;

const DIST_CAUTION_DAYS = 45;
const DIST_STALE_DAYS = 90;
const QUARTERLY_STALE_DAYS = 120;
const NAV_STALE_TRADING_DAYS = 5;

const CEF_PREMIUM_SLEEVES = new Set([
  'cef_credit',
  'midstream_income',
  'opportunistic_credit',
  'special_situations_income',
  'natural_resources_income',
]);

type Row = Record<string, unknown>;

function parseUtcDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function calendarDaysBetween(fromIso: string, toIso: string): number {
  const a = parseUtcDay(fromIso);
  const b = parseUtcDay(toIso);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function tradingDaysAfter(fromIso: string, toIso: string): number {
  const end = parseUtcDay(toIso);
  let cur = parseUtcDay(fromIso);
  cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
  let n = 0;
  while (cur.getTime() <= end.getTime()) {
    const wd = cur.getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
  }
  return n;
}

function navAsOfIso(row: Row): string | undefined {
  if (typeof row.navDataAsOf === 'string') return row.navDataAsOf;
  if (row.nav != null && typeof row.dataAsOf === 'string') return row.dataAsOf;
  return undefined;
}

function canInferPremiumDiscount(row: Row): boolean {
  const mp = row.marketPrice;
  const nav = row.nav;
  return typeof mp === 'number' && typeof nav === 'number' && nav !== 0;
}

function isCefStructure(row: Row): boolean {
  return typeof row.structureLabel === 'string' && /\bCEF\b/i.test(row.structureLabel);
}

function staleWarningsForRow(row: Row, ref: string): string[] {
  const warnings: string[] = [];
  const navAsOf = navAsOfIso(row);
  if (navAsOf) {
    const td = tradingDaysAfter(navAsOf, ref);
    if (td > NAV_STALE_TRADING_DAYS) {
      warnings.push(
        `NAV as-of is older than ${NAV_STALE_TRADING_DAYS} trading days vs reference ${ref}`
      );
    }
  }
  if (typeof row.distributionDataAsOf === 'string') {
    const cd = calendarDaysBetween(row.distributionDataAsOf, ref);
    if (cd > DIST_STALE_DAYS) {
      warnings.push(`Distribution as-of is older than ${DIST_STALE_DAYS} calendar days vs reference`);
    } else if (cd > DIST_CAUTION_DAYS) {
      warnings.push(`Distribution as-of is older than ${DIST_CAUTION_DAYS} calendar days vs reference`);
    }
  }
  if (typeof row.quarterlyFundamentalDataAsOf === 'string') {
    if (calendarDaysBetween(row.quarterlyFundamentalDataAsOf, ref) > QUARTERLY_STALE_DAYS) {
      warnings.push(`Quarterly fundamentals as-of is older than ${QUARTERLY_STALE_DAYS} days vs reference`);
    }
  }
  return warnings;
}

function main(): void {
  const dataText = readFileSync(manualPath, 'utf8');
  const schemaText = readFileSync(schemaPath, 'utf8');
  let rows: Row[];
  try {
    rows = JSON.parse(dataText) as Row[];
  } catch (e) {
    console.error('Failed to parse candidates.manual.json:', e);
    process.exit(1);
  }

  const schema = JSON.parse(schemaText) as object;
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(rows)) {
    console.error('JSON Schema validation failed:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }

  const failures: string[] = [];
  const warnings: string[] = [];
  const tickersSeen = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ticker = row.ticker;
    const t = typeof ticker === 'string' ? ticker : '';
    const prefix = `[${t || `#${i}`}]`;

    if (!/^[A-Z]+$/.test(t)) {
      failures.push(`${prefix} ticker must be uppercase A–Z`);
    }

    const prev = tickersSeen.get(t);
    if (prev !== undefined) {
      failures.push(`${prefix} duplicate ticker (also row index ${prev})`);
    } else {
      tickersSeen.set(t, i);
    }

    const cy = row.currentYield;
    if (typeof cy === 'number' && cy > 0.2) {
      const risks = row.mainRisks;
      const riskText = Array.isArray(risks) ? risks.join(' ') : '';
      if (!HIGH_YIELD_RISK_CUE.test(riskText)) {
        failures.push(
          `${prefix} currentYield > 20% requires a high-yield risk cue in mainRisks (e.g. credit, leverage, decay)`
        );
      }
    }

    if (row.dataConfidence === 'illustrative') {
      const label = row.sourceLabel;
      if (typeof label !== 'string' || !ILLUSTRATIVE_LABEL_OK.test(label)) {
        failures.push(
          `${prefix} dataConfidence illustrative requires sourceLabel to mention sample/illustrative/placeholder/manual`
        );
      }
    }

    const url = row.sourceUrl;
    if (url == null || (typeof url === 'string' && url.trim() === '')) {
      warnings.push(`${prefix} sourceUrl is null or empty`);
    }

    if (isCefStructure(row) && row.nav == null) {
      warnings.push(`${prefix} CEF structure with no nav (intentional test row?)`);
    }

    if (
      isCefStructure(row) &&
      typeof row.sleeveType === 'string' &&
      CEF_PREMIUM_SLEEVES.has(row.sleeveType) &&
      row.premiumDiscount == null &&
      !canInferPremiumDiscount(row)
    ) {
      warnings.push(
        `${prefix} CEF + sleeve ${row.sleeveType}: premiumDiscount missing and cannot infer from marketPrice vs nav`
      );
    }

    for (const w of staleWarningsForRow(row, GHOSTYIELD_REFERENCE_AS_OF)) {
      warnings.push(`${prefix} ${w}`);
    }
  }

  if (failures.length > 0) {
    console.error('GhostYield candidate validation failed:\n');
    for (const f of failures) console.error(`  FAIL: ${f}`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('GhostYield candidate validation warnings:\n');
    for (const w of warnings) console.warn(`  WARN: ${w}`);
  }

  console.log(`OK: ${rows.length} candidates (schema + rules). Reference: ${GHOSTYIELD_REFERENCE_AS_OF}`);
}

main();
