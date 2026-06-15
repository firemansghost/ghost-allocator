/**
 * GhostFlow v1.9b.1 — SPY vs RSP cap-weight premium study (research only, no I/O).
 */

import { percentileRank } from '@/lib/ghostflow/research/distribution';

export interface PriceRow {
  date: string;
  price: number;
}

export type PriceColumnUsed = 'adjusted' | 'close';

export interface ParsePriceCsvResult {
  rows: PriceRow[];
  priceColumnUsed: PriceColumnUsed;
  duplicatesDropped: number;
  skippedRows: number;
}

export interface AlignedPriceRow {
  date: string;
  spy: number;
  rsp: number;
}

export interface AlignPriceSeriesResult {
  aligned: AlignedPriceRow[];
  skippedSpy: number;
  skippedRsp: number;
}

export interface RollingWindowMetric {
  windowDays: number;
  label: string;
  totalReturnSpreadPct: number | null;
  annualizedSpreadPct: number | null;
  latestSpreadPercentile: number | null;
}

export interface DrawdownSummary {
  maxDrawdownPct: number;
  currentDrawdownPct: number;
}

export interface CapWeightPremiumStudySummary {
  studyVersion: string;
  researchOnly: true;
  generatedAt: string;
  spyCsvPath: string;
  rspCsvPath: string;
  alignedCount: number;
  overlapStart: string;
  overlapEnd: string;
  latestDate: string;
  latestSpy: number;
  latestRsp: number;
  latestRatio: number;
  latestRatioPercentile: number;
  rollingWindows: RollingWindowMetric[];
  spyDrawdown: DrawdownSummary;
  rspDrawdown: DrawdownSummary;
  drawdownDivergencePct: number;
  priceColumnUsed: { spy: PriceColumnUsed; rsp: PriceColumnUsed };
  warnings: string[];
}

export const DEFAULT_SINCE = '2003-04-24';

export const DEFAULT_WINDOWS = [21, 63, 126, 252, 756, 1260] as const;

const WINDOW_LABELS: Record<number, string> = {
  21: '1M',
  63: '3M',
  126: '6M',
  252: '1Y',
  756: '3Y',
  1260: '5Y',
};

const ADJ_CLOSE_HEADERS = ['adj close', 'adjclose', 'adjustedclose'];
const CLOSE_HEADERS = ['close'];
const DATE_HEADERS = ['date'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findColumnIndex(headers: string[], candidates: readonly string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.indexOf(c);
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length < 10) return null;
  const iso = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

export function parsePriceCsv(text: string, _label?: string): ParsePriceCsvResult {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headerParts = lines[0]!.split(',').map((h) => h.trim());
  const dateIdx = findColumnIndex(headerParts, DATE_HEADERS);
  if (dateIdx < 0) {
    throw new Error('CSV must include a date column (date or Date)');
  }

  let priceIdx = findColumnIndex(headerParts, ADJ_CLOSE_HEADERS);
  let priceColumnUsed: PriceColumnUsed = 'adjusted';
  if (priceIdx < 0) {
    priceIdx = findColumnIndex(headerParts, CLOSE_HEADERS);
    priceColumnUsed = 'close';
  }
  if (priceIdx < 0) {
    throw new Error('CSV must include Adj Close or Close price column');
  }

  const byDate = new Map<string, number>();
  let skippedRows = 0;
  let duplicatesDropped = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',');
    const dateRaw = parts[dateIdx]?.trim();
    const price = Number(parts[priceIdx]?.trim());
    const date = dateRaw ? normalizeDate(dateRaw) : null;

    if (!date || !Number.isFinite(price)) {
      skippedRows++;
      continue;
    }
    if (price <= 0) {
      throw new Error(`Non-positive price on ${date}: ${price}`);
    }

    const existing = byDate.get(date);
    if (existing === undefined) {
      byDate.set(date, price);
    } else if (existing === price) {
      duplicatesDropped++;
    } else {
      throw new Error(`Conflicting prices for duplicate date ${date}: ${existing} vs ${price}`);
    }
  }

  if (byDate.size === 0) {
    throw new Error('No valid price rows parsed from CSV');
  }

  const rows = [...byDate.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { rows, priceColumnUsed, duplicatesDropped, skippedRows };
}

export function alignPriceSeries(
  spyRows: readonly PriceRow[],
  rspRows: readonly PriceRow[],
  since?: string
): AlignPriceSeriesResult {
  const rspByDate = new Map(rspRows.map((r) => [r.date, r.price]));
  const aligned: AlignedPriceRow[] = [];
  let skippedSpy = 0;

  for (const spy of spyRows) {
    const rspPrice = rspByDate.get(spy.date);
    if (rspPrice === undefined) {
      skippedSpy++;
      continue;
    }
    if (since && spy.date < since) continue;
    aligned.push({ date: spy.date, spy: spy.price, rsp: rspPrice });
  }

  const alignedDates = new Set(aligned.map((r) => r.date));
  const skippedRsp = rspRows.filter((r) => !alignedDates.has(r.date)).length;

  return { aligned, skippedSpy, skippedRsp };
}

/** Total return percent: (end/start - 1) * 100 */
export function computeReturn(startPrice: number, endPrice: number): number {
  if (startPrice <= 0) return NaN;
  return Math.round(((endPrice / startPrice - 1) * 100) * 100) / 100;
}

export function computeRatioSeries(aligned: readonly AlignedPriceRow[]): number[] {
  return aligned.map((r) => (r.rsp > 0 ? Math.round((r.spy / r.rsp) * 10000) / 10000 : NaN));
}

export interface RollingSpreadHistory {
  spreads: number[];
  latest: number | null;
}

/** Rolling total-return spread SPY − RSP at each end index with full window. */
export function computeRollingReturnSpread(
  aligned: readonly AlignedPriceRow[],
  windowDays: number
): RollingSpreadHistory {
  const spreads: number[] = [];
  if (aligned.length < windowDays + 1) {
    return { spreads, latest: null };
  }

  for (let i = windowDays; i < aligned.length; i++) {
    const start = aligned[i - windowDays]!;
    const end = aligned[i]!;
    const spyRet = computeReturn(start.spy, end.spy);
    const rspRet = computeReturn(start.rsp, end.rsp);
    if (!Number.isFinite(spyRet) || !Number.isFinite(rspRet)) continue;
    spreads.push(Math.round((spyRet - rspRet) * 100) / 100);
  }

  const latest = spreads.length > 0 ? spreads[spreads.length - 1]! : null;
  return { spreads, latest };
}

/** Annualized spread from window total returns (compound). */
export function computeRollingAnnualizedSpread(
  aligned: readonly AlignedPriceRow[],
  windowDays: number
): number | null {
  if (windowDays < 252 || aligned.length < windowDays + 1) return null;

  const start = aligned[aligned.length - 1 - windowDays]!;
  const end = aligned[aligned.length - 1]!;
  const spyTotal = end.spy / start.spy - 1;
  const rspTotal = end.rsp / start.rsp - 1;
  if (!Number.isFinite(spyTotal) || !Number.isFinite(rspTotal)) return null;

  const annSpy = Math.pow(1 + spyTotal, 252 / windowDays) - 1;
  const annRsp = Math.pow(1 + rspTotal, 252 / windowDays) - 1;
  return Math.round((annSpy - annRsp) * 10000) / 100;
}

export interface DrawdownPoint {
  date: string;
  drawdownPct: number;
}

export function computeDrawdownSeries(prices: readonly number[]): DrawdownPoint[] {
  const out: DrawdownPoint[] = [];
  let peak = prices[0] ?? 0;

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i]!;
    if (p > peak) peak = p;
    const dd = peak > 0 ? ((p - peak) / peak) * 100 : 0;
    out.push({ date: '', drawdownPct: Math.round(dd * 100) / 100 });
  }
  return out;
}

export function summarizeDrawdown(prices: readonly number[]): DrawdownSummary {
  if (prices.length === 0) {
    return { maxDrawdownPct: 0, currentDrawdownPct: 0 };
  }
  const series = computeDrawdownSeries(prices);
  const values = series.map((d) => d.drawdownPct);
  const maxDrawdownPct = Math.min(...values);
  const currentDrawdownPct = values[values.length - 1]!;
  return { maxDrawdownPct, currentDrawdownPct };
}

export function windowLabel(windowDays: number): string {
  return WINDOW_LABELS[windowDays] ?? `${windowDays}d`;
}

export interface SummarizeCapWeightPremiumStudyInput {
  aligned: AlignedPriceRow[];
  windows: number[];
  spyCsvPath: string;
  rspCsvPath: string;
  spyPriceColumn: PriceColumnUsed;
  rspPriceColumn: PriceColumnUsed;
}

export function summarizeCapWeightPremiumStudy(
  input: SummarizeCapWeightPremiumStudyInput
): CapWeightPremiumStudySummary {
  const { aligned, windows, spyCsvPath, rspCsvPath, spyPriceColumn, rspPriceColumn } = input;
  const warnings: string[] = [];

  if (spyPriceColumn === 'close' || rspPriceColumn === 'close') {
    warnings.push(
      'One or both series use Close only (not Adj Close). Dividend effects may bias SPY vs RSP spread.'
    );
  }

  const ratios = computeRatioSeries(aligned);
  const latest = aligned[aligned.length - 1]!;
  const latestRatio = ratios[ratios.length - 1] ?? NaN;
  const sortedRatios = [...ratios].filter(Number.isFinite).sort((a, b) => a - b);
  const latestRatioPercentile = Number.isFinite(latestRatio)
    ? percentileRank(sortedRatios, latestRatio)
    : 0;

  const rollingWindows: RollingWindowMetric[] = [];
  for (const windowDays of windows) {
    const { spreads, latest: latestSpread } = computeRollingReturnSpread(aligned, windowDays);
    const sortedSpreads = [...spreads].sort((a, b) => a - b);
    const latestSpreadPercentile =
      latestSpread != null && sortedSpreads.length > 0
        ? percentileRank(sortedSpreads, latestSpread)
        : null;

    if (latestSpread == null) {
      warnings.push(`Insufficient aligned rows for ${windowLabel(windowDays)} (${windowDays} trading days) window`);
    }

    rollingWindows.push({
      windowDays,
      label: windowLabel(windowDays),
      totalReturnSpreadPct: latestSpread,
      annualizedSpreadPct: computeRollingAnnualizedSpread(aligned, windowDays),
      latestSpreadPercentile,
    });
  }

  const spyPrices = aligned.map((r) => r.spy);
  const rspPrices = aligned.map((r) => r.rsp);
  const spyDrawdown = summarizeDrawdown(spyPrices);
  const rspDrawdown = summarizeDrawdown(rspPrices);
  const drawdownDivergencePct =
    Math.round((spyDrawdown.currentDrawdownPct - rspDrawdown.currentDrawdownPct) * 100) / 100;

  return {
    studyVersion: '1.9b.1',
    researchOnly: true,
    generatedAt: new Date().toISOString(),
    spyCsvPath,
    rspCsvPath,
    alignedCount: aligned.length,
    overlapStart: aligned[0]?.date ?? '',
    overlapEnd: latest.date,
    latestDate: latest.date,
    latestSpy: latest.spy,
    latestRsp: latest.rsp,
    latestRatio,
    latestRatioPercentile,
    rollingWindows,
    spyDrawdown,
    rspDrawdown,
    drawdownDivergencePct,
    priceColumnUsed: { spy: spyPriceColumn, rsp: rspPriceColumn },
    warnings,
  };
}

export function minAlignedRequired(windows: readonly number[]): number {
  if (windows.length === 0) return 2;
  return Math.max(...windows) + 1;
}
