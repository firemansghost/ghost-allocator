/**
 * GhostFlow v1.7d.1 — FRED Treasury yield verification spike (research only).
 *
 * Verifies six FRED series for treasury-long-end-income-lens production artifact.
 * Not investment advice; not a bond-buying or duration-allocation signal.
 *
 * Does NOT write production artifacts, touch buildSnapshot, scoring, or UI.
 *
 * Usage:
 *   npm run ghostflow:fred-treasury-yields-spike
 *   npm run ghostflow:fred-treasury-yields-spike -- --local-dir tmp/fred
 *   npm run ghostflow:fred-treasury-yields-spike -- --out data/ghostflow/research/fredTreasuryYieldsDiscovery.v1.json
 *
 * Local CSV fallback (operator download from FRED graph CSV):
 *   tmp/fred/DGS30.csv, DFII30.csv, DGS2.csv, DGS5.csv, DGS10.csv, T10YIE.csv
 *
 * Optional API fallback when FRED_API_KEY is set (official api.stlouisfed.org only):
 *   used automatically if live CSV fails; not required for operators with CSV files.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import https from 'node:https';

export {};

const RESEARCH_OUT_PREFIX = 'data/ghostflow/research/';
const FRED_CSV_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';
const USER_AGENT = 'GhostAllocatorResearch/1.0 (GhostFlow FRED verification spike)';
/** Live CSV often times out in CI; short timeout triggers FRED_API_KEY fallback faster. */
const FETCH_TIMEOUT_MS = 20_000;

const SERIES = [
  {
    id: 'DGS30',
    label: 'Market Yield on U.S. Treasury Securities at 30-Year Constant Maturity',
    url: 'https://fred.stlouisfed.org/series/DGS30',
    role: 'primary' as const,
    field: 'thirtyYearNominalYieldPct',
  },
  {
    id: 'DFII30',
    label: 'Market Yield on U.S. Treasury Inflation-Indexed Securities at 30-Year Maturity',
    url: 'https://fred.stlouisfed.org/series/DFII30',
    role: 'primary' as const,
    field: 'thirtyYearTipsRealYieldPct',
  },
  {
    id: 'DGS2',
    label: 'Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity',
    url: 'https://fred.stlouisfed.org/series/DGS2',
    role: 'context' as const,
    field: 'twoYearYieldPct',
  },
  {
    id: 'DGS5',
    label: 'Market Yield on U.S. Treasury Securities at 5-Year Constant Maturity',
    url: 'https://fred.stlouisfed.org/series/DGS5',
    role: 'context' as const,
    field: 'fiveYearYieldPct',
  },
  {
    id: 'DGS10',
    label: 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity',
    url: 'https://fred.stlouisfed.org/series/DGS10',
    role: 'context' as const,
    field: 'tenYearYieldPct',
  },
  {
    id: 'T10YIE',
    label: '10-Year Breakeven Inflation Rate',
    url: 'https://fred.stlouisfed.org/series/T10YIE',
    role: 'context' as const,
    field: 'tenYearBreakevenInflationPct',
  },
] as const;

type SeriesId = (typeof SERIES)[number]['id'];

interface ParsedSeries {
  id: SeriesId;
  label: string;
  url: string;
  role: 'primary' | 'context';
  field: string;
  source: 'live_csv' | 'local_csv' | 'fred_api';
  byDate: Map<string, number>;
  latestDate: string | null;
  latestValue: number | null;
}

interface SpikeResult {
  ok: boolean;
  method: 'live_csv' | 'local_csv' | 'fred_api' | 'failed';
  asOf: string | null;
  publishedAt: string;
  values: Record<string, number>;
  curve2s30sPct: number | null;
  curve5s30sPct: number | null;
  curve10s30sPct: number | null;
  failReason: string | null;
  series: ParsedSeries[];
}

function parseArgs(argv: string[]): {
  localDir: string | null;
  out: string | null;
  fredApiOnly: boolean;
} {
  let localDir: string | null = null;
  let out: string | null = null;
  let fredApiOnly = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--local-dir' && argv[i + 1]) {
      localDir = argv[++i];
    } else if (argv[i] === '--out' && argv[i + 1]) {
      out = argv[++i];
    } else if (argv[i] === '--fred-api') {
      fredApiOnly = true;
    }
  }
  return { localDir, out, fredApiOnly };
}

function validateOutPath(out: string): string {
  const normalized = resolve(out).replace(/\\/g, '/');
  if (!normalized.includes('data/ghostflow/research')) {
    throw new Error(`--out must be under ${RESEARCH_OUT_PREFIX} (gitignored). Got: ${out}`);
  }
  if (normalized.includes('data/ghostflow/artifacts')) {
    throw new Error('--out must not write under data/ghostflow/artifacts/');
  }
  return normalized;
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv,text/plain,*/*' },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location).then(resolvePromise).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolvePromise(data));
      }
    );
    req.on('error', reject);
    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${FETCH_TIMEOUT_MS}ms: ${url}`));
    });
  });
}

function isHtmlResponse(text: string): boolean {
  const t = text.trim().slice(0, 200).toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<title>');
}

function parseFredCsv(text: string, seriesId: string): Map<string, number> {
  if (isHtmlResponse(text)) {
    throw new Error(`Response for ${seriesId} is HTML, not CSV`);
  }
  const lines = text.trim().split(/\r?\n/);
  const byDate = new Map<string, number>();
  for (const line of lines) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(line)) continue;
    const comma = line.indexOf(',');
    if (comma < 0) continue;
    const date = line.slice(0, comma).trim();
    const rawVal = line.slice(comma + 1).trim();
    if (!rawVal || rawVal === '.' || rawVal === 'NaN') continue;
    const val = Number.parseFloat(rawVal);
    if (!Number.isFinite(val)) continue;
    byDate.set(date, val);
  }
  if (byDate.size === 0) {
    throw new Error(`No numeric observations parsed for ${seriesId}`);
  }
  return byDate;
}

function latestNumeric(byDate: Map<string, number>): { date: string; value: number } | null {
  const dates = [...byDate.keys()].sort();
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i];
    const value = byDate.get(date);
    if (value !== undefined && Number.isFinite(value)) {
      return { date, value };
    }
  }
  return null;
}

async function fetchFredApiSeries(seriesId: string, apiKey: string): Promise<Map<string, number>> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    observation_start: '2020-01-01',
  });
  const url = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
  const text = await fetchUrl(url);
  const json = JSON.parse(text) as {
    observations?: Array<{ date?: string; value?: string }>;
    error_message?: string;
  };
  if (json.error_message) {
    throw new Error(json.error_message);
  }
  const byDate = new Map<string, number>();
  for (const obs of json.observations ?? []) {
    if (!obs.date || !obs.value || obs.value === '.') continue;
    const val = Number.parseFloat(obs.value);
    if (!Number.isFinite(val)) continue;
    byDate.set(obs.date, val);
  }
  if (byDate.size === 0) {
    throw new Error(`No numeric API observations for ${seriesId}`);
  }
  return byDate;
}

async function loadSeries(
  meta: (typeof SERIES)[number],
  localDir: string | null,
  method: 'live_csv' | 'local_csv' | 'fred_api'
): Promise<ParsedSeries> {
  let byDate: Map<string, number>;
  let source: ParsedSeries['source'];

  if (method === 'local_csv' && localDir) {
    const path = join(resolve(localDir), `${meta.id}.csv`);
    if (!existsSync(path)) {
      throw new Error(`Missing local CSV: ${path}`);
    }
    const csvText = readFileSync(path, 'utf8');
    byDate = parseFredCsv(csvText, meta.id);
    source = 'local_csv';
  } else if (method === 'fred_api') {
    const apiKey = process.env.FRED_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('FRED_API_KEY not set');
    }
    byDate = await fetchFredApiSeries(meta.id, apiKey);
    source = 'fred_api';
  } else {
    const url = `${FRED_CSV_BASE}${meta.id}`;
    const csvText = await fetchUrl(url);
    byDate = parseFredCsv(csvText, meta.id);
    source = 'live_csv';
  }
  const latest = latestNumeric(byDate);
  return {
    id: meta.id,
    label: meta.label,
    url: meta.url,
    role: meta.role,
    field: meta.field,
    source,
    byDate,
    latestDate: latest?.date ?? null,
    latestValue: latest?.value ?? null,
  };
}

function findCommonAsOf(seriesList: ParsedSeries[]): string | null {
  const dateSets = seriesList.map((s) => new Set(s.byDate.keys()));
  const allDates = [...dateSets[0]];
  for (const d of dateSets.slice(1)) {
    for (const date of [...allDates]) {
      if (!d.has(date)) {
        const idx = allDates.indexOf(date);
        if (idx >= 0) allDates.splice(idx, 1);
      }
    }
  }
  allDates.sort();
  if (allDates.length === 0) return null;
  return allDates[allDates.length - 1];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function loadAllSeries(
  loadMethod: 'live_csv' | 'local_csv' | 'fred_api',
  localDir: string | null
): Promise<{ seriesList: ParsedSeries[]; errors: string[] }> {
  const seriesList: ParsedSeries[] = [];
  const errors: string[] = [];
  for (const meta of SERIES) {
    try {
      const parsed = await loadSeries(meta, localDir, loadMethod);
      seriesList.push(parsed);
      console.log(
        `  ${meta.id}: latest ${parsed.latestDate} = ${parsed.latestValue}% (${parsed.source})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${meta.id}: ${msg}`);
      console.error(`  ${meta.id}: FAIL — ${msg}`);
    }
  }
  return { seriesList, errors };
}

export async function runFredTreasuryYieldsSpike(options?: {
  localDir?: string | null;
  fredApiOnly?: boolean;
}): Promise<SpikeResult> {
  const localDir = options?.localDir ?? null;
  const fredApiOnly = options?.fredApiOnly ?? false;
  const publishedAt = new Date().toISOString().slice(0, 10);
  let loadMethod: SpikeResult['method'] = localDir
    ? 'local_csv'
    : fredApiOnly && process.env.FRED_API_KEY?.trim()
      ? 'fred_api'
      : 'live_csv';

  console.log('GhostFlow v1.7d.1 — FRED Treasury yields verification spike (research only)');
  console.log(
    'Purpose: treasury-long-end-income-lens production gate — not investment advice or bond-buy signal.\n'
  );

  let { seriesList, errors } = await loadAllSeries(loadMethod, localDir);

  if (
    seriesList.length !== SERIES.length &&
    !localDir &&
    !fredApiOnly &&
    process.env.FRED_API_KEY?.trim()
  ) {
    console.log('\nLive CSV failed — retrying via official FRED API (FRED_API_KEY env)...\n');
    loadMethod = 'fred_api';
    ({ seriesList, errors } = await loadAllSeries('fred_api', null));
  }

  console.log(
    `\nMethod: ${
      loadMethod === 'local_csv'
        ? `local CSV (${localDir})`
        : loadMethod === 'fred_api'
          ? 'fred_api (api.stlouisfed.org)'
          : 'live FRED CSV fetch'
    }\n`
  );

  if (seriesList.length !== SERIES.length) {
    return {
      ok: false,
      method: 'failed',
      asOf: null,
      publishedAt,
      values: {},
      curve2s30sPct: null,
      curve5s30sPct: null,
      curve10s30sPct: null,
      failReason: `Series load failed: ${errors.join('; ')}`,
      series: seriesList,
    };
  }

  const asOf = findCommonAsOf(seriesList);
  if (!asOf) {
    return {
      ok: false,
      method: loadMethod,
      asOf: null,
      publishedAt,
      values: {},
      curve2s30sPct: null,
      curve5s30sPct: null,
      curve10s30sPct: null,
      failReason: 'No common date with numeric values across all six series',
      series: seriesList,
    };
  }

  const values: Record<string, number> = {};
  for (const s of seriesList) {
    const v = s.byDate.get(asOf);
    if (v === undefined || !Number.isFinite(v)) {
      return {
        ok: false,
        method: loadMethod,
        asOf,
        publishedAt,
        values: {},
        curve2s30sPct: null,
        curve5s30sPct: null,
        curve10s30sPct: null,
        failReason: `Missing numeric value for ${s.id} on common asOf ${asOf}`,
        series: seriesList,
      };
    }
    values[s.field] = round2(v);
  }

  const dgs30 = values.thirtyYearNominalYieldPct;
  const dgs2 = values.twoYearYieldPct;
  const dgs5 = values.fiveYearYieldPct;
  const dgs10 = values.tenYearYieldPct;

  const curve2s30sPct = round2(dgs30 - dgs2);
  const curve5s30sPct = round2(dgs30 - dgs5);
  const curve10s30sPct = round2(dgs30 - dgs10);

  console.log('\n=== Common asOf (all six series) ===');
  console.log(`  asOf: ${asOf}`);
  console.log(`  DGS30 (30Y nominal): ${values.thirtyYearNominalYieldPct}%`);
  console.log(`  DFII30 (30Y TIPS real): ${values.thirtyYearTipsRealYieldPct}%`);
  console.log(`  DGS2: ${values.twoYearYieldPct}%`);
  console.log(`  DGS5: ${values.fiveYearYieldPct}%`);
  console.log(`  DGS10: ${values.tenYearYieldPct}%`);
  console.log(`  T10YIE (10Y breakeven): ${values.tenYearBreakevenInflationPct}%`);
  console.log(`  curve2s30sPct: ${curve2s30sPct}`);
  console.log(`  curve5s30sPct: ${curve5s30sPct}`);
  console.log(`  curve10s30sPct: ${curve10s30sPct}`);
  console.log('\nVerdict: GREEN — safe to build production artifact JSON');

  return {
    ok: true,
    method: loadMethod,
    asOf,
    publishedAt,
    values,
    curve2s30sPct,
    curve5s30sPct,
    curve10s30sPct,
    failReason: null,
    series: seriesList,
  };
}

async function main(): Promise<void> {
  const { localDir, out, fredApiOnly } = parseArgs(process.argv.slice(2));
  const result = await runFredTreasuryYieldsSpike({ localDir, fredApiOnly });

  if (!result.ok) {
    console.error('\nVerdict: RED — do not create production artifact');
    console.error(`Fail reason: ${result.failReason}`);
    console.error(
      '\nOperator fallback: download CSV from each FRED series page, save as tmp/fred/<ID>.csv, then run:'
    );
    console.error('  npm run ghostflow:fred-treasury-yields-spike -- --local-dir tmp/fred');
    console.error('Or set FRED_API_KEY in the environment and re-run (official api.stlouisfed.org).');
    process.exit(1);
  }

  if (out) {
    const outPath = validateOutPath(out);
    mkdirSync(dirname(outPath), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      method: result.method,
      asOf: result.asOf,
      publishedAt: result.publishedAt,
      values: result.values,
      curve2s30sPct: result.curve2s30sPct,
      curve5s30sPct: result.curve5s30sPct,
      curve10s30sPct: result.curve10s30sPct,
      series: result.series.map((s) => ({
        id: s.id,
        label: s.label,
        url: s.url,
        role: s.role,
        source: s.source,
        latestDate: s.latestDate,
        latestValue: s.latestValue,
      })),
    };
    writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`\nResearch output written (gitignored): ${outPath}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
