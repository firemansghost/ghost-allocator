/**
 * GhostFlow v0.9c — CFTC TFF/COT feasibility spike (research only).
 *
 * Fetches a small sample from the CFTC Public Reporting Environment (Socrata SODA API).
 * Does NOT write artifacts, touch buildSnapshot, or change scoring/UI.
 *
 * Usage:
 *   npx tsx scripts/ghostflow/cftc-tff-spike.ts
 *   npm run ghostflow:cftc-tff-spike
 *
 * Network required. No secrets.
 */

const TFF_FUTURES_ONLY_DATASET_ID = 'gpe5-46if';
const PRE_BASE = 'https://publicreporting.cftc.gov';
const RESOURCE_URL = `${PRE_BASE}/resource/${TFF_FUTURES_ONLY_DATASET_ID}.json`;
const METADATA_URL = `${PRE_BASE}/api/views/${TFF_FUTURES_ONLY_DATASET_ID}.json`;

/** Primary liquid contracts for GhostFlow equity-mechanical proxy research. */
const PRIMARY_CONTRACT_CODES = ['13874A', '209742', '239742', '1170E1'] as const;

const SEARCH_TERMS = [
  'S&P 500',
  'E-MINI S&P 500',
  'NASDAQ-100',
  'E-MINI NASDAQ',
  'NASDAQ MINI',
  'RUSSELL 2000',
  'E-MINI RUSSELL',
  'RUSSELL E-MINI',
  'VIX',
] as const;

type TffRow = Record<string, string | undefined>;

function formatReportDate(raw: string | undefined): string {
  if (!raw) return '(missing)';
  return raw.slice(0, 10);
}

/** Fetch with timeout (AbortController — broader Node/runtime support than AbortSignal.timeout). */
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
  const res = await fetchWithTimeout(
    url,
    { headers: { Accept: 'application/json' } },
    60_000
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label}: HTTP ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

function buildDistinctContractsUrl(): string {
  const clauses = SEARCH_TERMS.map(
    (t) => `upper(contract_market_name) like '%${t.toUpperCase().replace(/'/g, "''")}%'`
  );
  const where = encodeURIComponent(clauses.join(' OR '));
  const select = encodeURIComponent(
    'distinct contract_market_name, cftc_contract_market_code, commodity_name, market_and_exchange_names'
  );
  return `${RESOURCE_URL}?$select=${select}&$where=${where}&$limit=50000`;
}

function buildSampleUrl(codes: readonly string[]): string {
  const codeList = codes.map((c) => `'${c}'`).join(',');
  const where = encodeURIComponent(
    `cftc_contract_market_code in (${codeList}) AND futonly_or_combined = 'FutOnly'`
  );
  const select = encodeURIComponent(
    [
      'report_date_as_yyyy_mm_dd',
      'yyyy_report_week_ww',
      'contract_market_name',
      'cftc_contract_market_code',
      'market_and_exchange_names',
      'open_interest_all',
      'lev_money_positions_long',
      'lev_money_positions_short',
      'lev_money_positions_spread',
      'change_in_lev_money_long',
      'change_in_lev_money_short',
      'change_in_lev_money_spread',
      'pct_of_oi_lev_money_long',
      'pct_of_oi_lev_money_short',
      'pct_of_oi_lev_money_spread',
    ].join(',')
  );
  return `${RESOURCE_URL}?$select=${select}&$where=${where}&$order=${encodeURIComponent('report_date_as_yyyy_mm_dd DESC')}&$limit=500`;
}

function netExposure(row: TffRow): number | null {
  const lng = Number(row.lev_money_positions_long);
  const sht = Number(row.lev_money_positions_short);
  if (!Number.isFinite(lng) || !Number.isFinite(sht)) return null;
  return lng - sht;
}

function netPctOi(row: TffRow): string | null {
  const oi = Number(row.open_interest_all);
  const net = netExposure(row);
  if (!Number.isFinite(oi) || oi <= 0 || net === null) return null;
  return ((net / oi) * 100).toFixed(1);
}

function printDiagnostics(err: unknown): void {
  console.error('\n--- Spike failed (soft exit) ---');
  if (err instanceof Error) {
    console.error(err.message);
    if (err.cause) console.error('Cause:', err.cause);
  } else {
    console.error(String(err));
  }
  console.error('\nTroubleshooting:');
  console.error('- Confirm outbound HTTPS to publicreporting.cftc.gov');
  console.error('- Retry later if CFTC PRE is rate-limiting or down');
  console.error('- See docs/ghostflow/CFTC_TFF_FEASIBILITY.md for manual PRE export fallback');
  process.exitCode = 1;
}

async function runCftcTffSpike(): Promise<void> {
  console.log('GhostFlow v0.9c — CFTC TFF feasibility spike');
  console.log('Dataset: Traders in Financial Futures (TFF) — Futures Only');
  console.log(`Endpoint: ${RESOURCE_URL}`);
  console.log(`Metadata: ${METADATA_URL}\n`);

  let columns: string[] = [];
  try {
    const meta = await fetchJson<{ columns?: Array<{ fieldName?: string; name?: string }> }>(
      METADATA_URL,
      'Metadata'
    );
    columns = (meta.columns ?? []).map((c) => c.fieldName ?? c.name ?? '').filter(Boolean);
    console.log(`Field count: ${columns.length}`);
    console.log('Leveraged-funds / OI fields present:');
    const highlights = columns.filter((f) =>
      /lev_money|open_interest|report_date|contract_market|cftc_contract|change_in_lev|pct_of_oi_lev/i.test(f)
    );
    for (const f of highlights) console.log(`  - ${f}`);
    console.log('');
  } catch (err) {
    console.warn('Metadata fetch failed; continuing with resource query only.');
    console.warn(err instanceof Error ? err.message : err);
    console.log('');
  }

  let contracts: TffRow[] = [];
  try {
    const distinctUrl = buildDistinctContractsUrl();
    console.log('Searching candidate contracts (name filter)…');
    contracts = await fetchJson<TffRow[]>(distinctUrl, 'Contract search');
    console.log(`Distinct name/code rows returned: ${contracts.length}\n`);
    console.log('Matching contract_market_name | cftc_contract_market_code | commodity_name');
    const seen = new Set<string>();
    for (const row of contracts) {
      const key = `${row.contract_market_name}|${row.cftc_contract_market_code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(
        `  ${row.contract_market_name} | ${row.cftc_contract_market_code} | ${row.commodity_name ?? ''}`
      );
    }
    console.log('');
  } catch (err) {
    printDiagnostics(err);
    return;
  }

  try {
    const sampleUrl = buildSampleUrl(PRIMARY_CONTRACT_CODES);
    console.log('Latest rows for primary codes:', PRIMARY_CONTRACT_CODES.join(', '));
    console.log('(E-MINI S&P 500, NASDAQ MINI, RUSSELL E-MINI, VIX FUTURES)\n');
    const rows = await fetchJson<TffRow[]>(sampleUrl, 'Sample series');

    const byContract = new Map<string, TffRow[]>();
    for (const row of rows) {
      const code = row.cftc_contract_market_code ?? 'unknown';
      if (!byContract.has(code)) byContract.set(code, []);
      byContract.get(code)!.push(row);
    }

    for (const code of PRIMARY_CONTRACT_CODES) {
      const series = byContract.get(code) ?? [];
      const name = series[0]?.contract_market_name ?? code;
      console.log(`--- ${name} (${code}) ---`);
      if (series.length === 0) {
        console.log('  (no rows — check code or futonly_or_combined filter)\n');
        continue;
      }
      const dates = [...new Set(series.map((r) => formatReportDate(r.report_date_as_yyyy_mm_dd)))].slice(0, 3);
      console.log(`  Latest report dates: ${dates.join(', ')}`);
      for (const row of series.slice(0, 3)) {
        const net = netExposure(row);
        const netPct = netPctOi(row);
        console.log(
          `  ${formatReportDate(row.report_date_as_yyyy_mm_dd)} week ${row.yyyy_report_week_ww ?? '?'} | ` +
            `OI ${row.open_interest_all} | lev long ${row.lev_money_positions_long} short ${row.lev_money_positions_short} ` +
            `spread ${row.lev_money_positions_spread} | Δlong ${row.change_in_lev_money_long} Δshort ${row.change_in_lev_money_short} | ` +
            `net ${net ?? 'n/a'} (${netPct ?? 'n/a'}% OI) | pct OI L/S/spread ${row.pct_of_oi_lev_money_long}/${row.pct_of_oi_lev_money_short}/${row.pct_of_oi_lev_money_spread} | ` +
            `Δspread ${row.change_in_lev_money_spread}`
        );
      }
      console.log('');
    }

    console.log('Spike complete. Full memo: docs/ghostflow/CFTC_TFF_FEASIBILITY.md');
  } catch (err) {
    printDiagnostics(err);
  }
}

runCftcTffSpike().catch(printDiagnostics);

export {};
