/**
 * GhostFlow operator helper — Marketstack EOD → CSV export (research only).
 * Not wired into production artifacts, buildSnapshot, or GhostRegime fallback.
 */

export const MARKETSTACK_EOD_URL = 'https://api.marketstack.com/v1/eod';
export const MARKETSTACK_PAGE_LIMIT = 1000;
export const MARKETSTACK_PAGINATION_GAP_MS = 220;

export const CLOSE_ONLY_CAVEAT =
  'Marketstack EOD close only — not adjusted close. Prefer Yahoo/manual Adj Close CSVs for production-quality cap-weight study.';

export interface MarketstackEodExportArgs {
  symbols: string[];
  dateFrom: string;
  dateTo: string;
  outDir: string;
  dryRun: boolean;
  allowMarketstack: boolean;
}

export interface MarketstackEodRow {
  date: string;
  close: number;
}

export interface EstimateApiCallsResult {
  calendarDays: number;
  estimatedTradingDays: number;
  callsPerSymbol: Record<string, number>;
  totalCalls: number;
}

export interface DryRunPlan {
  symbols: string[];
  dateFrom: string;
  dateTo: string;
  outDir: string;
  csvPaths: Record<string, string>;
  metaPaths: Record<string, string>;
  estimate: EstimateApiCallsResult;
  caveat: string;
}

export interface FetchSymbolResult {
  symbol: string;
  rows: MarketstackEodRow[];
  pagesFetched: number;
  apiCalls: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateIsoDate(label: string, value: string): void {
  if (!ISO_DATE_RE.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD (got ${value})`);
  }
  const d = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${label} is not a valid date: ${value}`);
  }
}

export function parseSymbolsArg(raw: string): string[] {
  const symbols = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (symbols.length === 0) {
    throw new Error('At least one symbol required');
  }
  for (const sym of symbols) {
    if (!/^[A-Z][A-Z0-9.\-]{0,11}$/.test(sym)) {
      throw new Error(`Invalid symbol: ${sym}`);
    }
  }
  return symbols;
}

export function parseExportArgs(argv: string[], defaultDateTo: string): MarketstackEodExportArgs {
  let symbols = ['SPY', 'RSP'];
  let dateFrom: string | undefined;
  let dateTo = defaultDateTo;
  let outDir = 'tmp/ghostflow/marketstack';
  let dryRun = false;
  let allowMarketstack = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--symbols' && argv[i + 1]) {
      symbols = parseSymbolsArg(argv[++i]!);
    } else if (a === '--date-from' && argv[i + 1]) {
      dateFrom = argv[++i]!;
    } else if (a === '--date-to' && argv[i + 1]) {
      dateTo = argv[++i]!;
    } else if (a === '--out-dir' && argv[i + 1]) {
      outDir = argv[++i]!;
    } else if (a === '--dry-run') {
      dryRun = true;
    } else if (a === '--allow-marketstack') {
      allowMarketstack = true;
    } else if (a === '--source' && argv[i + 1]) {
      const src = argv[++i]!.toLowerCase();
      if (src === 'marketstack') allowMarketstack = true;
      else throw new Error(`Unsupported --source ${src} (only marketstack)`);
    }
  }

  if (!dateFrom) {
    throw new Error('Required: --date-from YYYY-MM-DD');
  }

  validateIsoDate('date-from', dateFrom);
  validateIsoDate('date-to', dateTo);

  if (dateFrom > dateTo) {
    throw new Error(`date-from (${dateFrom}) must be <= date-to (${dateTo})`);
  }

  return { symbols, dateFrom, dateTo, outDir, dryRun, allowMarketstack };
}

export function calendarDaysInclusive(dateFrom: string, dateTo: string): number {
  const a = new Date(`${dateFrom}T12:00:00.000Z`);
  const b = new Date(`${dateTo}T12:00:00.000Z`);
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/** Rough trading-day estimate for API pagination budgeting. */
export function estimateTradingDays(calendarDays: number): number {
  return Math.max(1, Math.round(calendarDays * (252 / 365)));
}

export function estimateApiCallsPerSymbol(estimatedTradingDays: number): number {
  return Math.max(1, Math.ceil(estimatedTradingDays / MARKETSTACK_PAGE_LIMIT));
}

export function estimateTotalApiCalls(
  symbols: string[],
  dateFrom: string,
  dateTo: string
): EstimateApiCallsResult {
  const calendarDays = calendarDaysInclusive(dateFrom, dateTo);
  const estimatedTradingDays = estimateTradingDays(calendarDays);
  const callsPerSymbol: Record<string, number> = {};
  let totalCalls = 0;
  for (const sym of symbols) {
    const calls = estimateApiCallsPerSymbol(estimatedTradingDays);
    callsPerSymbol[sym] = calls;
    totalCalls += calls;
  }
  return { calendarDays, estimatedTradingDays, callsPerSymbol, totalCalls };
}

export function buildMarketstackEodUrl(params: {
  accessKey: string;
  symbol: string;
  dateFrom: string;
  dateTo: string;
  offset: number;
  redactKey?: boolean;
}): string {
  const q = new URLSearchParams({
    access_key: params.redactKey ? '<redacted>' : params.accessKey,
    symbols: params.symbol,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    limit: String(MARKETSTACK_PAGE_LIMIT),
    offset: String(params.offset),
    sort: 'ASC',
  });
  return `${MARKETSTACK_EOD_URL}?${q.toString()}`;
}

interface RawMarketstackRow {
  close?: number;
  date?: string;
  symbol?: string;
}

/** Parse one Marketstack EOD JSON page (or merged payload). */
export function parseMarketstackEodJson(
  json: unknown,
  dateFrom: string,
  dateTo: string
): { rows: MarketstackEodRow[]; apiError?: string } {
  if (!json || typeof json !== 'object') {
    return { rows: [] };
  }
  const o = json as Record<string, unknown>;
  const err = o.error as Record<string, unknown> | undefined;
  if (err && typeof err === 'object') {
    const msg =
      typeof err.message === 'string'
        ? err.message
        : typeof err.code === 'string'
          ? String(err.code)
          : 'unknown_api_error';
    return { rows: [], apiError: msg };
  }

  const data = o.data;
  if (!Array.isArray(data)) {
    return { rows: [] };
  }

  const byDay = new Map<string, number>();
  for (const row of data as RawMarketstackRow[]) {
    if (typeof row.close !== 'number' || !Number.isFinite(row.close) || !row.date) continue;
    const day = row.date.slice(0, 10);
    if (day < dateFrom || day > dateTo) continue;
    byDay.set(day, row.close);
  }

  const rows = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, close]) => ({ date, close }));

  return { rows };
}

export function mergeEodRows(pages: MarketstackEodRow[][]): MarketstackEodRow[] {
  const byDay = new Map<string, number>();
  for (const page of pages) {
    for (const row of page) {
      byDay.set(row.date, row.close);
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, close]) => ({ date, close }));
}

export function rowsToCsv(rows: MarketstackEodRow[]): string {
  const lines = ['Date,Close'];
  for (const r of rows) {
    lines.push(`${r.date},${r.close}`);
  }
  return lines.join('\n') + '\n';
}

export function buildProvenanceSidecar(input: {
  symbol: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  apiCalls: number;
  pagesFetched: number;
  rowCount: number;
  csvFileName: string;
}): Record<string, unknown> {
  return {
    source: 'Marketstack EOD',
    endpoint: MARKETSTACK_EOD_URL,
    symbol: input.symbol,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    generatedAt: input.generatedAt,
    apiCalls: input.apiCalls,
    pagesFetched: input.pagesFetched,
    rowCount: input.rowCount,
    csvFileName: input.csvFileName,
    priceColumn: 'Close',
    adjustedClose: false,
    caveat: CLOSE_ONLY_CAVEAT,
    ghostflowHelper: 'ghostflow:marketstack-eod-csv-export',
    notProductionArtifact: true,
  };
}

export function buildDryRunPlan(
  args: MarketstackEodExportArgs,
  csvFileName: (symbol: string) => string,
  metaFileName: (symbol: string) => string
): DryRunPlan {
  const estimate = estimateTotalApiCalls(args.symbols, args.dateFrom, args.dateTo);
  const csvPaths: Record<string, string> = {};
  const metaPaths: Record<string, string> = {};
  for (const sym of args.symbols) {
    csvPaths[sym] = csvFileName(sym);
    metaPaths[sym] = metaFileName(sym);
  }
  return {
    symbols: args.symbols,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    outDir: args.outDir,
    csvPaths,
    metaPaths,
    estimate,
    caveat: CLOSE_ONLY_CAVEAT,
  };
}

export interface FetchPageResult {
  rows: MarketstackEodRow[];
  pagesFetched: number;
  apiCalls: number;
  apiError?: string;
  httpStatus?: number;
}

/** Fetch all EOD pages for one symbol (GhostFlow operator opt-in only). */
export async function fetchMarketstackEodPages(
  symbol: string,
  dateFrom: string,
  dateTo: string,
  accessKey: string,
  fetchImpl: typeof fetch = fetch,
  sleepMs: (ms: number) => Promise<void> = (ms) =>
    new Promise((r) => setTimeout(r, ms))
): Promise<FetchPageResult> {
  const pageRows: MarketstackEodRow[][] = [];
  let offset = 0;
  let pagesFetched = 0;
  let apiCalls = 0;
  let lastHttpStatus = 0;
  let lastApiError: string | undefined;

  for (;;) {
    const url = buildMarketstackEodUrl({
      accessKey,
      symbol,
      dateFrom,
      dateTo,
      offset,
      redactKey: false,
    });

    apiCalls += 1;
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ghost-allocator/ghostflow-marketstack-export',
      },
    });
    lastHttpStatus = response.status;
    const text = await response.text();

    if (!response.ok) {
      return {
        rows: [],
        pagesFetched,
        apiCalls,
        apiError: `HTTP ${response.status}: ${text.slice(0, 200)}`,
        httpStatus: lastHttpStatus,
      };
    }

    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return {
        rows: [],
        pagesFetched,
        apiCalls,
        apiError: 'Invalid JSON response',
        httpStatus: lastHttpStatus,
      };
    }

    const parsed = parseMarketstackEodJson(json, dateFrom, dateTo);
    if (parsed.apiError) {
      return {
        rows: [],
        pagesFetched,
        apiCalls,
        apiError: parsed.apiError,
        httpStatus: lastHttpStatus,
      };
    }

    pageRows.push(parsed.rows);
    pagesFetched += 1;

    const o = json as Record<string, unknown>;
    const dataArr = o.data;
    const batchLen = Array.isArray(dataArr) ? dataArr.length : 0;

    if (batchLen === 0) break;
    if (batchLen < MARKETSTACK_PAGE_LIMIT) break;

    const pag = o.pagination as Record<string, unknown> | undefined;
    const total = typeof pag?.total === 'number' ? (pag.total as number) : null;
    offset += batchLen;
    if (total !== null && offset >= total) break;

    await sleepMs(MARKETSTACK_PAGINATION_GAP_MS);
  }

  const rows = mergeEodRows(pageRows);
  if (rows.length === 0 && lastApiError) {
    return { rows, pagesFetched, apiCalls, apiError: lastApiError, httpStatus: lastHttpStatus };
  }

  return { rows, pagesFetched, apiCalls };
}
