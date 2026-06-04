/**
 * GhostFlow v1.7a.1 — Treasury CFTC PRE/TFF contract-discovery spike (research only).
 *
 * Discovers Treasury futures in CFTC Traders in Financial Futures (TFF) PRE data for a
 * future Treasury Basis Trade Stress display-only proxy. Does NOT measure the full
 * cash-futures basis trade, repo specialness, CTD, or financing terms.
 *
 * Does NOT write production artifacts, touch buildSnapshot, scoring, or UI.
 *
 * Usage:
 *   npm run ghostflow:treasury-cftc-pre-spike
 *   npm run ghostflow:treasury-cftc-pre-spike -- --search TREASURY
 *   npm run ghostflow:treasury-cftc-pre-spike -- --dataset yw9f-hn96 --search TREASURY
 *   npm run ghostflow:treasury-cftc-pre-spike -- --out data/ghostflow/research/treasuryCftcDiscovery.v1.json
 *
 * Network required. No secrets.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_DATASET_ID = 'gpe5-46if';
const TFF_FUTURES_OPTIONS_COMBINED_ID = 'yw9f-hn96';
const PRE_BASE = 'https://publicreporting.cftc.gov';
const RESEARCH_OUT_PREFIX = 'data/ghostflow/research/';
const FLAT_THRESHOLD_PP = 1.0;
const RECENT_REPORT_DAYS = 21;

const DEFAULT_SEARCH_TERMS = [
  'TREASURY',
  'U.S. TREASURY',
  'T-NOTE',
  'T-NOTES',
  'T-BOND',
  'T-BONDS',
  'UST',
  '2-YEAR',
  '3-YEAR',
  '5-YEAR',
  '10-YEAR',
  'ULTRA',
  '30-YEAR',
  'BOND',
] as const;

/** Tier 1 hypothesis labels — codes filled after discovery. */
const TIER1_NAME_PATTERNS: Array<{ label: string; match: RegExp }> = [
  { label: '2Y Treasury note', match: /UST\s*2Y|2-?YEAR.*(NOTE|T-NOTES)/i },
  { label: '5Y Treasury note', match: /UST\s*5Y|5-?YEAR.*(NOTE|T-NOTES)/i },
  { label: '10Y Treasury note', match: /UST\s*10Y|10-?YEAR.*(NOTE|T-NOTES)/i },
  { label: 'Ultra 10Y Treasury note', match: /ULTRA\s*UST\s*10Y/i },
  { label: 'Treasury bond / 30Y', match: /UST\s*BOND|U\.?S\.?\s*T\s*BOND|TREASURY BOND/i },
  { label: 'Ultra Treasury bond', match: /ULTRA\s*(UST|US\s*T)\s*BOND/i },
];

const FUNDING_CONTEXT_PATTERNS = [
  /^SOFR$/i,
  /SOFR/i,
  /FED FUNDS/i,
  /FEDERAL FUNDS/i,
  /EURODOLLAR/i,
  /EURO DOLLAR/i,
];

const LEV_FIELDS = [
  'lev_money_positions_long',
  'lev_money_positions_short',
  'lev_money_positions_spread',
  'change_in_lev_money_long',
  'change_in_lev_money_short',
  'change_in_lev_money_spread',
  'pct_of_oi_lev_money_long',
  'pct_of_oi_lev_money_short',
  'pct_of_oi_lev_money_spread',
] as const;

const ASSET_MGR_FIELDS = [
  'asset_mgr_positions_long',
  'asset_mgr_positions_short',
  'asset_mgr_positions_spread',
  'change_in_asset_mgr_long',
  'change_in_asset_mgr_short',
  'change_in_asset_mgr_spread',
  'pct_of_oi_asset_mgr_long',
  'pct_of_oi_asset_mgr_short',
  'pct_of_oi_asset_mgr_spread',
] as const;

const SAMPLE_SELECT = [
  'report_date_as_yyyy_mm_dd',
  'yyyy_report_week_ww',
  'contract_market_name',
  'cftc_contract_market_code',
  'commodity_name',
  'market_and_exchange_names',
  'futonly_or_combined',
  'open_interest_all',
  ...LEV_FIELDS,
  ...ASSET_MGR_FIELDS,
].join(',');

type TffRow = Record<string, string | undefined>;
type Direction = 'net_long' | 'net_short' | 'flat';

interface ContractDiscovery {
  contractMarketName: string;
  cftcContractMarketCode: string;
  commodityName: string;
  marketAndExchangeNames: string;
}

interface ContractMetrics {
  discovery: ContractDiscovery;
  latestReportDate: string;
  reportWeek: string;
  openInterest: number | null;
  levLong: number | null;
  levShort: number | null;
  levSpread: number | null;
  levNet: number | null;
  levNetPctOi: number | null;
  levGross: number | null;
  levGrossPctOi: number | null;
  wowDeltaNet: number | null;
  direction: Direction | null;
  assetMgrLong: number | null;
  assetMgrShort: number | null;
  assetMgrSpread: number | null;
  assetMgrNet: number | null;
  assetMgrNetPctOi: number | null;
  levVsAmSpread: number | null;
  missingLevFields: string[];
  missingAssetMgrFields: string[];
  tier1Label: string | null;
  isFundingContext: boolean;
  duplicateWarning: string | null;
}

interface SpikeArgs {
  asOf?: string;
  limit: number;
  datasetId: string;
  searchTerms: string[];
  out?: string;
}

function parseArgs(argv: string[]): SpikeArgs {
  let asOf: string | undefined;
  let limit = 3;
  let datasetId = DEFAULT_DATASET_ID;
  let out: string | undefined;
  const searchTerms: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--as-of' && argv[i + 1]) {
      asOf = argv[++i];
    } else if (a === '--limit' && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[++i], 10) || 3);
    } else if (a === '--dataset' && argv[i + 1]) {
      datasetId = argv[++i];
    } else if (a === '--out' && argv[i + 1]) {
      out = argv[++i];
    } else if (a === '--search' && argv[i + 1]) {
      const raw = argv[++i];
      for (const part of raw.split(',')) {
        const t = part.trim();
        if (t) searchTerms.push(t);
      }
    }
  }

  return {
    asOf,
    limit,
    datasetId,
    searchTerms: searchTerms.length > 0 ? searchTerms : [...DEFAULT_SEARCH_TERMS],
    out,
  };
}

function resourceUrl(datasetId: string): string {
  return `${PRE_BASE}/resource/${datasetId}.json`;
}

function metadataUrl(datasetId: string): string {
  return `${PRE_BASE}/api/views/${datasetId}.json`;
}

function formatReportDate(raw: string | undefined): string {
  if (!raw) return '';
  return raw.slice(0, 10);
}

function num(row: TffRow, key: string): number | null {
  const v = row[key];
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function escapeSoqlString(s: string): string {
  return s.toUpperCase().replace(/'/g, "''");
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 60_000);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label}: HTTP ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

function buildDistinctContractsUrl(datasetId: string, searchTerms: string[]): string {
  const clauses = searchTerms.flatMap((t) => {
    const e = escapeSoqlString(t);
    return [
      `upper(contract_market_name) like '%${e}%'`,
      `upper(commodity_name) like '%${e}%'`,
    ];
  });
  const where = encodeURIComponent(clauses.join(' OR '));
  const select = encodeURIComponent(
    'distinct contract_market_name, cftc_contract_market_code, commodity_name, market_and_exchange_names'
  );
  return `${resourceUrl(datasetId)}?$select=${select}&$where=${where}&$limit=50000`;
}

function buildSampleUrl(datasetId: string, codes: string[], asOf: string | undefined, limit: number): string {
  const codeList = codes.map((c) => `'${c.replace(/'/g, "''")}'`).join(',');
  let where = `cftc_contract_market_code in (${codeList})`;
  if (datasetId === DEFAULT_DATASET_ID) {
    where += ` AND futonly_or_combined = 'FutOnly'`;
  }
  if (asOf) {
    where += ` AND report_date_as_yyyy_mm_dd <= '${asOf}'`;
  }
  const select = encodeURIComponent(SAMPLE_SELECT);
  const order = encodeURIComponent('report_date_as_yyyy_mm_dd DESC');
  const rowLimit = Math.min(50_000, Math.max(500, codes.length * limit * 4));
  return `${resourceUrl(datasetId)}?$select=${select}&$where=${encodeURIComponent(where)}&$order=${order}&$limit=${rowLimit}`;
}

function isFundingContext(name: string): boolean {
  const upper = name.toUpperCase();
  return FUNDING_CONTEXT_PATTERNS.some((p) => p.test(upper));
}

function isExcludedNonTreasuryFuture(name: string, commodity: string): boolean {
  const combined = `${name} ${commodity}`.toUpperCase();
  if (/ERIS|SWAP|REPO|DTCC|MICRO 10 YEAR YIELD|INTEREST RATE SWAP/i.test(combined)) {
    return true;
  }
  return false;
}

function isTreasuryCandidate(name: string, commodity = ''): boolean {
  if (isFundingContext(name)) return false;
  if (isExcludedNonTreasuryFuture(name, commodity)) return false;
  const upper = `${name} ${commodity}`.toUpperCase();
  if (/^UST\s|\bUST\s|\bUST\d|ULTRA UST|UST BOND|UST \d/i.test(name)) return true;
  if (/T-NOTES?|T-BONDS?/i.test(commodity) || /T-NOTES?|T-BONDS?/i.test(name)) return true;
  return (
    (upper.includes('TREASURY') && !upper.includes('REPO')) ||
    /\d-?YEAR.*(NOTE|BOND)/i.test(name)
  );
}

function tier1LabelForName(name: string): string | null {
  for (const { label, match } of TIER1_NAME_PATTERNS) {
    if (match.test(name)) return label;
  }
  return null;
}

function duplicateWarningForName(name: string): string | null {
  const upper = name.toUpperCase();
  if (upper.includes('ULTRA') && (upper.includes('10') || upper.includes('BOND'))) {
    return 'Ultra variant — avoid double-counting OI with standard 10Y/30Y in a basket';
  }
  if (upper.includes('MICRO')) {
    return 'Micro contract — exclude from Tier 1 unless methodology widens';
  }
  return null;
}

function directionFromNetPctOi(netPctOi: number | null): Direction | null {
  if (netPctOi === null) return null;
  if (Math.abs(netPctOi) < FLAT_THRESHOLD_PP) return 'flat';
  return netPctOi < 0 ? 'net_short' : 'net_long';
}

function missingFields(row: TffRow, fields: readonly string[]): string[] {
  return fields.filter((f) => num(row, f) === null && row[f] === undefined);
}

function computeMetrics(row: TffRow, discovery: ContractDiscovery): ContractMetrics {
  const levLong = num(row, 'lev_money_positions_long');
  const levShort = num(row, 'lev_money_positions_short');
  const levSpread = num(row, 'lev_money_positions_spread');
  const oi = num(row, 'open_interest_all');
  const changeLong = num(row, 'change_in_lev_money_long');
  const changeShort = num(row, 'change_in_lev_money_short');

  const levNet =
    levLong !== null && levShort !== null ? levLong - levShort : null;
  const levGross =
    levLong !== null && levShort !== null ? levLong + levShort : null;
  const levNetPctOi =
    levNet !== null && oi !== null && oi > 0 ? (100 * levNet) / oi : null;
  const levGrossPctOi =
    levGross !== null && oi !== null && oi > 0 ? (100 * levGross) / oi : null;
  const wowDeltaNet =
    changeLong !== null && changeShort !== null ? changeLong - changeShort : null;

  const amLong = num(row, 'asset_mgr_positions_long');
  const amShort = num(row, 'asset_mgr_positions_short');
  const amSpread = num(row, 'asset_mgr_positions_spread');
  const amNet = amLong !== null && amShort !== null ? amLong - amShort : null;
  const amNetPctOi = amNet !== null && oi !== null && oi > 0 ? (100 * amNet) / oi : null;
  const levVsAmSpread = levNet !== null && amNet !== null ? levNet - amNet : null;

  const name = discovery.contractMarketName;
  return {
    discovery,
    latestReportDate: formatReportDate(row.report_date_as_yyyy_mm_dd),
    reportWeek: row.yyyy_report_week_ww ?? '',
    openInterest: oi,
    levLong,
    levShort,
    levSpread,
    levNet,
    levNetPctOi,
    levGross,
    levGrossPctOi,
    wowDeltaNet,
    direction: directionFromNetPctOi(levNetPctOi),
    assetMgrLong: amLong,
    assetMgrShort: amShort,
    assetMgrSpread: amSpread,
    assetMgrNet: amNet,
    assetMgrNetPctOi: amNetPctOi,
    levVsAmSpread,
    missingLevFields: missingFields(row, LEV_FIELDS),
    missingAssetMgrFields: missingFields(row, ASSET_MGR_FIELDS),
    tier1Label: tier1LabelForName(name),
    isFundingContext: isFundingContext(name),
    duplicateWarning: duplicateWarningForName(name),
  };
}

function hasFullLevFields(m: ContractMetrics): boolean {
  return (
    m.levLong !== null &&
    m.levShort !== null &&
    m.openInterest !== null &&
    m.openInterest > 0 &&
    m.levNet !== null
  );
}

function daysSinceReport(dateIso: string): number | null {
  if (!dateIso) return null;
  const d = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function isRecentReport(dateIso: string): boolean {
  const days = daysSinceReport(dateIso);
  return days !== null && days <= RECENT_REPORT_DAYS;
}

function validateOutPath(out: string): string {
  const normalized = resolve(out).replace(/\\/g, '/');
  const prefix = resolve(RESEARCH_OUT_PREFIX).replace(/\\/g, '/');
  if (!normalized.includes('data/ghostflow/research')) {
    throw new Error(`--out must be under ${RESEARCH_OUT_PREFIX} (gitignored). Got: ${out}`);
  }
  if (normalized.includes('data/ghostflow/artifacts')) {
    throw new Error('--out must not write under data/ghostflow/artifacts/');
  }
  return normalized;
}

function printDisclaimer(): void {
  console.log(
    'Disclaimer: This is a public positioning proxy only. It does not measure the full ' +
      'cash-futures basis trade, repo specialness, CTD behavior, or financing terms.\n'
  );
}

function printMetadata(columns: string[]): void {
  console.log(`Field count: ${columns.length}`);
  const groups: Array<{ label: string; re: RegExp }> = [
    { label: 'report_date', re: /report_date/i },
    { label: 'contract_market / cftc_contract', re: /contract_market|cftc_contract/i },
    { label: 'open_interest', re: /open_interest/i },
    { label: 'lev_money', re: /lev_money/i },
    { label: 'asset_mgr', re: /asset_mgr/i },
  ];
  for (const { label, re } of groups) {
    const hits = columns.filter((f) => re.test(f));
    console.log(`${label}: ${hits.length} column(s)`);
    if (hits.length === 0) console.warn(`  WARNING: no columns matching ${label}`);
    else for (const f of hits.slice(0, 12)) console.log(`  - ${f}`);
    if (hits.length > 12) console.log(`  ... and ${hits.length - 12} more`);
  }
  const missingLev = LEV_FIELDS.filter((f) => !columns.includes(f));
  const missingAm = ASSET_MGR_FIELDS.filter((f) => !columns.includes(f));
  if (missingLev.length > 0) {
    console.warn('\nWARNING: Expected leveraged-funds columns missing from metadata:');
    for (const f of missingLev) console.warn(`  - ${f}`);
  }
  if (missingAm.length > 0) {
    console.warn('\nNOTE: Some asset-manager columns missing from metadata (may still exist in rows):');
    for (const f of missingAm) console.warn(`  - ${f}`);
  }
  console.log('');
}

function printContractMetrics(m: ContractMetrics, limit: number): void {
  const d = m.discovery;
  console.log(`--- ${d.contractMarketName} (${d.cftcContractMarketCode}) ---`);
  if (m.tier1Label) console.log(`  Tier 1 hypothesis: ${m.tier1Label}`);
  if (m.isFundingContext) console.log('  Bucket: FUNDING CONTEXT (not default basis-stress basket)');
  if (m.duplicateWarning) console.log(`  Duplicate warning: ${m.duplicateWarning}`);
  console.log(`  Latest report: ${m.latestReportDate} (week ${m.reportWeek || '?'})`);
  console.log(`  OI: ${m.openInterest ?? 'n/a'}`);
  console.log(
    `  Lev funds: long ${m.levLong ?? 'n/a'} | short ${m.levShort ?? 'n/a'} | spread ${m.levSpread ?? 'n/a'}`
  );
  console.log(
    `  Lev net: ${m.levNet ?? 'n/a'} (${m.levNetPctOi !== null ? m.levNetPctOi.toFixed(1) : 'n/a'}% OI) | ` +
      `gross ${m.levGross ?? 'n/a'} (${m.levGrossPctOi !== null ? m.levGrossPctOi.toFixed(1) : 'n/a'}% OI)`
  );
  console.log(`  WoW Δnet (change long − short): ${m.wowDeltaNet ?? 'n/a'}`);
  console.log(`  Direction: ${m.direction ?? 'n/a'} (flat threshold |net % OI| < ${FLAT_THRESHOLD_PP} pp)`);
  if (m.assetMgrLong !== null || m.assetMgrShort !== null) {
    console.log(
      `  Asset mgr: long ${m.assetMgrLong ?? 'n/a'} | short ${m.assetMgrShort ?? 'n/a'} | spread ${m.assetMgrSpread ?? 'n/a'}`
    );
    console.log(
      `  AM net: ${m.assetMgrNet ?? 'n/a'} (${m.assetMgrNetPctOi !== null ? m.assetMgrNetPctOi.toFixed(1) : 'n/a'}% OI) | ` +
        `lev − AM spread: ${m.levVsAmSpread ?? 'n/a'}`
    );
  } else {
    console.log('  Asset mgr: (no numeric fields on latest row)');
  }
  if (m.missingLevFields.length > 0) {
    console.warn(`  Missing lev fields on row: ${m.missingLevFields.join(', ')}`);
  }
  if (m.missingAssetMgrFields.length === ASSET_MGR_FIELDS.length) {
    console.warn('  Asset-manager fields absent on latest row.');
  }
  console.log(`  (showing latest of up to ${limit} rows requested)\n`);
}

type Verdict = 'GREEN' | 'YELLOW' | 'RED';

function computeVerdict(
  tier1Metrics: ContractMetrics[],
  treasuryCount: number
): { verdict: Verdict; reasons: string[] } {
  const reasons: string[] = [];
  if (treasuryCount === 0) {
    return {
      verdict: 'RED',
      reasons: ['No usable Treasury rows in TFF Futures Only search.'],
    };
  }

  const tier1Ready = tier1Metrics.filter(
    (m) => hasFullLevFields(m) && isRecentReport(m.latestReportDate)
  );
  const tier1Partial = tier1Metrics.filter((m) => hasFullLevFields(m));

  if (tier1Ready.length >= 3) {
    reasons.push(
      `${tier1Ready.length} Tier-1 candidate(s) with full lev fields and report within ${RECENT_REPORT_DAYS} days.`
    );
    const anyMissingAm = tier1Ready.some((m) => m.assetMgrNet === null);
    if (anyMissingAm) reasons.push('Some Tier-1 rows lack asset-manager fields (display context only).');
    return { verdict: 'GREEN', reasons };
  }

  if (tier1Partial.length >= 1 || treasuryCount > 0) {
    if (tier1Ready.length < 3 && tier1Partial.length >= 1) {
      reasons.push(
        `Only ${tier1Ready.length} Tier-1 contract(s) recent+complete; ${tier1Partial.length} with full lev fields overall.`
      );
    }
    if (tier1Metrics.some((m) => m.duplicateWarning)) {
      reasons.push('Ultra vs standard duplicate-counting risk — pick one listing per tenor for v1.7b.');
    }
    reasons.push('Partial coverage — proceed to v1.7b artifact design with documented caveats.');
    return { verdict: 'YELLOW', reasons };
  }

  return {
    verdict: 'RED',
    reasons: ['Treasury name matches found but no rows with complete leveraged-funds fields.'],
  };
}

function printDiagnostics(err: unknown): void {
  console.error('\n--- Treasury CFTC spike failed ---');
  if (err instanceof Error) console.error(err.message);
  else console.error(String(err));
  console.error('\nTroubleshooting:');
  console.error('- Confirm HTTPS to publicreporting.cftc.gov');
  console.error(`- Retry with --dataset ${TFF_FUTURES_OPTIONS_COMBINED_ID} if FutOnly has gaps`);
  console.error('- See docs/ghostflow/TREASURY_PLUMBING_FEASIBILITY.md');
  process.exitCode = 1;
}

async function runTreasuryCftcPreSpike(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const resource = resourceUrl(args.datasetId);
  const metadata = metadataUrl(args.datasetId);

  console.log('GhostFlow v1.7a.1 — Treasury CFTC PRE contract-discovery spike');
  console.log('Purpose: future Treasury Basis Trade Stress display-only proxy (research only)');
  printDisclaimer();
  console.log(`Dataset: ${args.datasetId}`);
  console.log(`Endpoint: ${resource}`);
  console.log(`Metadata: ${metadata}`);
  console.log(`Search terms: ${args.searchTerms.join(', ')}`);
  if (args.asOf) console.log(`As-of cap: ${args.asOf}`);
  console.log(`Per-contract row limit: ${args.limit}\n`);

  let columns: string[] = [];
  try {
    const meta = await fetchJson<{ columns?: Array<{ fieldName?: string; name?: string }> }>(
      metadata,
      'Metadata'
    );
    columns = (meta.columns ?? []).map((c) => c.fieldName ?? c.name ?? '').filter(Boolean);
    printMetadata(columns);
  } catch (err) {
    console.warn('Metadata fetch failed; continuing with resource query only.');
    console.warn(err instanceof Error ? err.message : err);
    console.log('');
  }

  let distinctRows: TffRow[] = [];
  try {
    const url = buildDistinctContractsUrl(args.datasetId, args.searchTerms);
    console.log('Contract discovery (distinct name/code)…');
    distinctRows = await fetchJson<TffRow[]>(url, 'Contract search');
  } catch (err) {
    printDiagnostics(err);
    return;
  }

  const seen = new Set<string>();
  const discoveries: ContractDiscovery[] = [];
  const fundingDiscoveries: ContractDiscovery[] = [];
  const otherDiscoveries: ContractDiscovery[] = [];

  for (const row of distinctRows) {
    const name = row.contract_market_name ?? '';
    const code = row.cftc_contract_market_code ?? '';
    const key = `${name}|${code}`;
    if (!name || !code || seen.has(key)) continue;
    seen.add(key);
    const d: ContractDiscovery = {
      contractMarketName: name,
      cftcContractMarketCode: code,
      commodityName: row.commodity_name ?? '',
      marketAndExchangeNames: row.market_and_exchange_names ?? '',
    };
    if (isFundingContext(name)) fundingDiscoveries.push(d);
    else if (isTreasuryCandidate(name, d.commodityName)) discoveries.push(d);
    else otherDiscoveries.push(d);
  }

  console.log(`Distinct rows from API: ${distinctRows.length}`);
  console.log(`Treasury candidates: ${discoveries.length}`);
  console.log(`Funding context: ${fundingDiscoveries.length}`);
  console.log(`Other matches: ${otherDiscoveries.length}\n`);

  console.log('=== Treasury candidates (name | code | commodity) ===');
  for (const d of discoveries.sort((a, b) => a.contractMarketName.localeCompare(b.contractMarketName))) {
    console.log(`  ${d.contractMarketName} | ${d.cftcContractMarketCode} | ${d.commodityName}`);
  }
  console.log('');

  if (otherDiscoveries.length > 0) {
    console.log('=== Other search matches (excluded from Treasury basket) ===');
    for (const d of otherDiscoveries.slice(0, 25)) {
      console.log(`  ${d.contractMarketName} | ${d.cftcContractMarketCode} | ${d.commodityName}`);
    }
    if (otherDiscoveries.length > 25) {
      console.log(`  ... and ${otherDiscoveries.length - 25} more`);
    }
    console.log('');
  }

  if (fundingDiscoveries.length > 0) {
    console.log('=== Funding context (not default basis-stress basket) ===');
    for (const d of fundingDiscoveries) {
      console.log(`  ${d.contractMarketName} | ${d.cftcContractMarketCode}`);
    }
    console.log('');
  }

  if (discoveries.length === 0) {
    const { verdict, reasons } = computeVerdict([], 0);
    console.log(`Feasibility verdict: ${verdict}`);
    for (const r of reasons) console.log(`  - ${r}`);
    console.log('\nIf RED on gpe5-46if, try:');
    console.log(`  npm run ghostflow:treasury-cftc-pre-spike -- --dataset ${TFF_FUTURES_OPTIONS_COMBINED_ID} --search TREASURY`);
    console.log('Legacy COT financial futures: separate future decision only.');
    printDisclaimer();
    return;
  }

  const codes = discoveries.map((d) => d.cftcContractMarketCode);
  let sampleRows: TffRow[] = [];
  try {
    const sampleUrl = buildSampleUrl(args.datasetId, codes, args.asOf, args.limit);
    console.log('Fetching latest rows per discovered code…\n');
    sampleRows = await fetchJson<TffRow[]>(sampleUrl, 'Sample series');
  } catch (err) {
    printDiagnostics(err);
    return;
  }

  const latestByCode = new Map<string, TffRow>();
  for (const row of sampleRows) {
    const code = row.cftc_contract_market_code ?? '';
    if (!code || latestByCode.has(code)) continue;
    latestByCode.set(code, row);
  }

  const allMetrics: ContractMetrics[] = [];
  for (const d of discoveries) {
    const row = latestByCode.get(d.cftcContractMarketCode);
    if (!row) {
      console.log(`--- ${d.contractMarketName} (${d.cftcContractMarketCode}) ---`);
      console.log('  (no sample row — check futonly_or_combined or dataset)\n');
      continue;
    }
    const m = computeMetrics(row, d);
    allMetrics.push(m);
    printContractMetrics(m, args.limit);
  }

  const tier1Metrics = allMetrics.filter((m) => m.tier1Label !== null);
  const recommendedTier1 = tier1Metrics
    .filter((m) => hasFullLevFields(m))
    .map(
      (m) =>
        `${m.tier1Label}: ${m.discovery.contractMarketName} (${m.discovery.cftcContractMarketCode}) — ${m.latestReportDate}`
    );
  const deferred = discoveries
    .filter((d) => !tier1Metrics.some((m) => m.discovery.cftcContractMarketCode === d.cftcContractMarketCode))
    .map((d) => `${d.contractMarketName} (${d.cftcContractMarketCode})`);

  const globalLatest = allMetrics
    .map((m) => m.latestReportDate)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  console.log('=== Recommended Tier 1 basket (from discovery — codes confirmed at run time) ===');
  if (recommendedTier1.length === 0) console.log('  (none with full lev fields yet)');
  else for (const line of recommendedTier1) console.log(`  ${line}`);
  console.log('');

  if (deferred.length > 0) {
    console.log('=== Deferred / non-Tier-1 Treasury listings ===');
    for (const line of deferred) console.log(`  ${line}`);
    console.log('');
  }

  const { verdict, reasons } = computeVerdict(tier1Metrics, discoveries.length);
  console.log(`Global latest report date (among sampled): ${globalLatest ?? 'n/a'}`);
  console.log(`\nFeasibility verdict: ${verdict}`);
  for (const r of reasons) console.log(`  - ${r}`);
  if (verdict === 'RED' || verdict === 'YELLOW') {
    console.log('\nNext steps if partial:');
    console.log(`  npm run ghostflow:treasury-cftc-pre-spike -- --dataset ${TFF_FUTURES_OPTIONS_COMBINED_ID} --search TREASURY`);
  }
  console.log('\nv1.7b gate: proceed to Treasury Basis Trade artifact design only if verdict is GREEN or YELLOW with documented Tier-1 codes.');
  printDisclaimer();

  if (args.out) {
    const outPath = validateOutPath(args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      datasetId: args.datasetId,
      searchTerms: args.searchTerms,
      globalLatestReportDate: globalLatest,
      verdict,
      verdictReasons: reasons,
      treasuryCandidates: discoveries,
      fundingContext: fundingDiscoveries,
      metrics: allMetrics.map((m) => ({
        ...m,
        discovery: m.discovery,
      })),
      recommendedTier1,
      deferred,
    };
    writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`\nResearch output written (gitignored): ${outPath}`);
  }

  console.log('\nSpike complete. See docs/ghostflow/TREASURY_PLUMBING_FEASIBILITY.md');
}

runTreasuryCftcPreSpike().catch(printDiagnostics);

export {};
