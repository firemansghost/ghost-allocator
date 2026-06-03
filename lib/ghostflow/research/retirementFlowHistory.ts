/**
 * GhostFlow v1.2e-calibration — ICI Table 1 quarterly retirement asset history (research only).
 */

import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import { buildGhostFlowSnapshot } from '@/lib/ghostflow/buildSnapshot';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import {
  computeGhostFlowScore,
  computePassivePressureScore,
  computeStructuralFragilityScore,
  ghostFlowBand,
  ghostFlowBandLabel,
} from '@/lib/ghostflow/scoring';
import type { GhostFlowBand } from '@/lib/ghostflow/types';
import {
  distributionP90,
  pctAtOrAbove,
  percentileRank,
  summarizeDistribution,
  type DistributionSummary,
} from '@/lib/ghostflow/research/distribution';

export const QUARTERLY_PERIOD_RE = /^\d{4}:Q[1-4]$/;

export const DEFAULT_SINCE_QUARTER = '2007:Q1';

export const CURRENT_QUARTER_LABEL = '2025:Q4';

/** Production artifact Q4 2025 reference (for study cross-check). */
export const ARTIFACT_Q4_2025 = {
  totalTrillions: 49.1,
  iraTrillions: 19.2,
  dcTrillions: 14.2,
  qoqPct: 2.1,
  yoyPct: 11.2,
} as const;

export interface Table1ComponentRow {
  period: string;
  iraBillions: number | null;
  dcBillions: number | null;
  privateDbBillions: number | null;
  stateLocalDbBillions: number | null;
  federalDbBillions: number | null;
  annuitiesBillions: number | null;
}

export interface QuarterlyObservation {
  period: string;
  totalBillions: number;
  iraBillions: number;
  dcBillions: number;
  iraSharePct: number;
  dcSharePct: number;
  qoqTotalGrowthPct: number | null;
  yoyTotalGrowthPct: number | null;
}

export interface ParseTable1Result {
  allRowsRead: number;
  skippedRows: string[];
  quarterly: QuarterlyObservation[];
  since: string;
}

export interface MappingComparisonRow {
  mapping: string;
  latestScore: number;
  pctQuartersGte70: number;
  pctQuartersGte80: number;
  pctQuartersGte90: number;
  medianScore: number;
  p90Score: number;
}

export interface ScorePreviewRow {
  label: string;
  retirementR: number;
  passivePressure: number;
  composite: number;
  band: GhostFlowBand;
  bandLabel: string;
}

const PYTHON_TABLE1_EXTRACT = `
import json, sys, xlrd
path = sys.argv[1]
sh = xlrd.open_workbook(path).sheet_by_name("Table 1")
out = []
for r in range(sh.nrows):
    period = str(sh.cell_value(r, 0)).strip()
    if not period:
        continue
    def num(c):
        v = sh.cell_value(r, c)
        if v == "" or (isinstance(v, str) and str(v).strip().lower() == "e"):
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None
    ira = num(1)
    dc = num(3)
    priv = num(4)
    st = num(5)
    fed = num(6)
    ann = num(7)
    if ira is None and dc is None:
        continue
    out.append({
        "period": period,
        "iraBillions": ira,
        "dcBillions": dc,
        "privateDbBillions": priv,
        "stateLocalDbBillions": st,
        "federalDbBillions": fed,
        "annuitiesBillions": ann,
    })
print(json.dumps(out))
`;

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isQuarterlyPeriod(period: string): boolean {
  return QUARTERLY_PERIOD_RE.test(period.trim());
}

export function compareQuarterPeriods(a: string, b: string): number {
  const ma = a.match(/^(\d{4}):Q([1-4])$/);
  const mb = b.match(/^(\d{4}):Q([1-4])$/);
  if (!ma || !mb) return a.localeCompare(b);
  const ya = Number(ma[1]);
  const yb = Number(mb[1]);
  if (ya !== yb) return ya - yb;
  return Number(ma[2]) - Number(mb[2]);
}

export function sumTotalBillions(row: Table1ComponentRow): number | null {
  const parts = [
    row.iraBillions,
    row.dcBillions,
    row.privateDbBillions,
    row.stateLocalDbBillions,
    row.federalDbBillions,
    row.annuitiesBillions,
  ];
  let sum = 0;
  let any = false;
  for (const p of parts) {
    if (isFiniteNumber(p)) {
      sum += p;
      any = true;
    }
  }
  return any ? sum : null;
}

export function computeQoQGrowthPct(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return ((current - prior) / prior) * 100;
}

export function computeYoYGrowthPct(current: number, priorYear: number): number | null {
  if (priorYear <= 0) return null;
  return ((current - priorYear) / priorYear) * 100;
}

function rowFromCsvRecord(rec: Record<string, string>): Table1ComponentRow | null {
  const period = (rec.period ?? '').trim();
  if (!period) return null;
  const parseNum = (k: string): number | null => {
    const v = rec[k]?.trim();
    if (!v || v.toLowerCase() === 'e') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    period,
    iraBillions: parseNum('iraBillions'),
    dcBillions: parseNum('dcBillions'),
    privateDbBillions: parseNum('privateDbBillions'),
    stateLocalDbBillions: parseNum('stateLocalDbBillions'),
    federalDbBillions: parseNum('federalDbBillions'),
    annuitiesBillions: parseNum('annuitiesBillions'),
  };
}

export function parseTable1Csv(csvText: string): Table1ComponentRow[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  const rows: Table1ComponentRow[] = [];
  for (const rec of records) {
    const row = rowFromCsvRecord(rec);
    if (row) rows.push(row);
  }
  return rows;
}

export function loadTable1RowsFromXls(xlsPath: string): Table1ComponentRow[] {
  const json = execFileSync('python', ['-c', PYTHON_TABLE1_EXTRACT, xlsPath], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const parsed = JSON.parse(json) as Table1ComponentRow[];
  return parsed.map((r) => ({
    period: String(r.period).trim(),
    iraBillions: isFiniteNumber(r.iraBillions) ? r.iraBillions : null,
    dcBillions: isFiniteNumber(r.dcBillions) ? r.dcBillions : null,
    privateDbBillions: isFiniteNumber(r.privateDbBillions) ? r.privateDbBillions : null,
    stateLocalDbBillions: isFiniteNumber(r.stateLocalDbBillions)
      ? r.stateLocalDbBillions
      : null,
    federalDbBillions: isFiniteNumber(r.federalDbBillions) ? r.federalDbBillions : null,
    annuitiesBillions: isFiniteNumber(r.annuitiesBillions) ? r.annuitiesBillions : null,
  }));
}

export function buildQuarterlySeries(
  rows: readonly Table1ComponentRow[],
  since: string = DEFAULT_SINCE_QUARTER
): ParseTable1Result {
  const skippedRows: string[] = [];
  const quarterlyRaw: Array<{ period: string; totalBillions: number; ira: number; dc: number }> =
    [];

  for (const row of rows) {
    const period = row.period.trim();
    if (!isQuarterlyPeriod(period)) {
      if (period && !period.startsWith('Table') && !period.includes('Billions')) {
        skippedRows.push(period);
      }
      continue;
    }
    if (compareQuarterPeriods(period, since) < 0) {
      skippedRows.push(period);
      continue;
    }
    const total = sumTotalBillions(row);
    if (total === null || !isFiniteNumber(row.iraBillions) || !isFiniteNumber(row.dcBillions)) {
      skippedRows.push(period);
      continue;
    }
    quarterlyRaw.push({
      period,
      totalBillions: total,
      ira: row.iraBillions,
      dc: row.dcBillions,
    });
  }

  quarterlyRaw.sort((a, b) => compareQuarterPeriods(a.period, b.period));

  const byPeriod = new Map(quarterlyRaw.map((q) => [q.period, q]));

  const quarterly: QuarterlyObservation[] = quarterlyRaw.map((q, i) => {
    const prev = quarterlyRaw[i - 1];
    const m = q.period.match(/^(\d{4}):Q([1-4])$/);
    const priorYearKey =
      m != null ? `${Number(m[1]) - 1}:Q${m[2]}` : null;
    const priorYear = priorYearKey != null ? byPeriod.get(priorYearKey) : undefined;

    const qoq =
      prev != null ? computeQoQGrowthPct(q.totalBillions, prev.totalBillions) : null;
    const yoy =
      priorYear != null
        ? computeYoYGrowthPct(q.totalBillions, priorYear.totalBillions)
        : null;

    return {
      period: q.period,
      totalBillions: q.totalBillions,
      iraBillions: q.ira,
      dcBillions: q.dc,
      iraSharePct: (100 * q.ira) / q.totalBillions,
      dcSharePct: (100 * q.dc) / q.totalBillions,
      qoqTotalGrowthPct: qoq,
      yoyTotalGrowthPct: yoy,
    };
  });

  return {
    allRowsRead: rows.length,
    skippedRows,
    quarterly,
    since,
  };
}

export function mappingPercentile(value: number, history: readonly number[]): number {
  const sorted = [...history].sort((a, b) => a - b);
  return clampInt(percentileRank(sorted, value), 0, 100);
}

export function mappingBlendedQoQYoY(
  qoqPct: number,
  yoyPct: number,
  historyQoQ: readonly number[],
  historyYoY: readonly number[],
  qoqWeight = 0.6
): number {
  const q = mappingPercentile(qoqPct, historyQoQ);
  const y = mappingPercentile(yoyPct, historyYoY);
  return clampInt(qoqWeight * q + (1 - qoqWeight) * y, 0, 100);
}

export function mappingCapped(score: number, cap = 75): number {
  return Math.min(cap, clampInt(score, 0, 100));
}

/** Conservative QoQ growth bands (research preview only). */
export function mappingManualBandsQoQ(qoqPct: number): number {
  if (qoqPct < 0) return 35;
  if (qoqPct < 1) return 45;
  if (qoqPct < 2) return 52;
  if (qoqPct < 3) return 58;
  if (qoqPct < 4) return 65;
  if (qoqPct < 6) return 72;
  return 80;
}

export function buildRetirementMappingComparison(
  quarterly: readonly QuarterlyObservation[],
  latest: QuarterlyObservation
): MappingComparisonRow[] {
  const qoqHist = quarterly
    .map((q) => q.qoqTotalGrowthPct)
    .filter((v): v is number => v != null);
  const yoyHist = quarterly
    .map((q) => q.yoyTotalGrowthPct)
    .filter((v): v is number => v != null);

  const latestQoQ = latest.qoqTotalGrowthPct ?? 0;
  const latestYoY = latest.yoyTotalGrowthPct ?? 0;

  const scoresQoQ = quarterly.map((q) =>
    q.qoqTotalGrowthPct != null ? mappingPercentile(q.qoqTotalGrowthPct, qoqHist) : 0
  );
  const scoresYoY = quarterly.map((q) =>
    q.yoyTotalGrowthPct != null ? mappingPercentile(q.yoyTotalGrowthPct, yoyHist) : 0
  );
  const scoresBlend = quarterly.map((q) =>
    q.qoqTotalGrowthPct != null && q.yoyTotalGrowthPct != null
      ? mappingBlendedQoQYoY(q.qoqTotalGrowthPct, q.yoyTotalGrowthPct, qoqHist, yoyHist)
      : 0
  );
  const scoresCappedQoQ = scoresQoQ.map((s) => mappingCapped(s, 75));
  const scoresBands = quarterly.map((q) =>
    q.qoqTotalGrowthPct != null ? mappingManualBandsQoQ(q.qoqTotalGrowthPct) : 0
  );

  const row = (
    mapping: string,
    latestScore: number,
    scores: readonly number[]
  ): MappingComparisonRow => ({
    mapping,
    latestScore,
    pctQuartersGte70: pctAtOrAbove(scores, 70),
    pctQuartersGte80: pctAtOrAbove(scores, 80),
    pctQuartersGte90: pctAtOrAbove(scores, 90),
    medianScore: summarizeDistribution(scores).median,
    p90Score: distributionP90(scores),
  });

  return [
    row(
      'QoQ growth percentile',
      mappingPercentile(latestQoQ, qoqHist),
      scoresQoQ
    ),
    row(
      'YoY growth percentile',
      mappingPercentile(latestYoY, yoyHist),
      scoresYoY
    ),
    row(
      'Blended 60% QoQ + 40% YoY percentile',
      mappingBlendedQoQYoY(latestQoQ, latestYoY, qoqHist, yoyHist),
      scoresBlend
    ),
    row('Capped QoQ percentile (cap 75)', mappingCapped(mappingPercentile(latestQoQ, qoqHist), 75), scoresCappedQoQ),
    row('Manual bands on QoQ %', mappingManualBandsQoQ(latestQoQ), scoresBands),
  ];
}

const SCORE_PREVIEW_BASE = buildGhostFlowSnapshot(GHOSTFLOW_REFERENCE_AS_OF);
export const MOCK_RETIREMENT_SCORE = SCORE_PREVIEW_BASE.raw.passivePressure.retirementFlowPressureProxy;

/** Passive constant C when retirement R=0 (peers fixed at current snapshot). */
export function passiveBaselineWithoutRetirement(): number {
  return (
    computePassivePressureScore({
      ...SCORE_PREVIEW_BASE.raw.passivePressure,
      retirementFlowPressureProxy: 0,
    })
  );
}

export function previewScoreWithRetirement(retirementR: number): ScorePreviewRow {
  const passiveInputs = {
    ...SCORE_PREVIEW_BASE.raw.passivePressure,
    retirementFlowPressureProxy: clampInt(retirementR, 0, 100),
  };
  const passivePressure = computePassivePressureScore(passiveInputs);
  const structuralFragility = computeStructuralFragilityScore(
    SCORE_PREVIEW_BASE.raw.structuralFragility
  );
  const composite = computeGhostFlowScore(passivePressure, structuralFragility);
  const band = ghostFlowBand(composite);
  return {
    label: `R=${clampInt(retirementR, 0, 100)}`,
    retirementR: clampInt(retirementR, 0, 100),
    passivePressure,
    composite,
    band,
    bandLabel: ghostFlowBandLabel(band),
  };
}

export function buildRetirementScoreImpactPreview(
  mappingRows: readonly MappingComparisonRow[],
  retirementCandidates: readonly number[] = [0, 25, 40, 50, 58, 60, 70, 80, 90, 100]
): ScorePreviewRow[] {
  const mockRow = previewScoreWithRetirement(MOCK_RETIREMENT_SCORE);
  const rows: ScorePreviewRow[] = [
    { ...mockRow, label: `MOCK R=${MOCK_RETIREMENT_SCORE} (current)` },
  ];

  const seen = new Set<number>([MOCK_RETIREMENT_SCORE]);
  for (const r of retirementCandidates) {
    if (seen.has(r)) continue;
    seen.add(r);
    rows.push(previewScoreWithRetirement(r));
  }

  for (const m of mappingRows) {
    if (seen.has(m.latestScore)) continue;
    seen.add(m.latestScore);
    rows.push({
      ...previewScoreWithRetirement(m.latestScore),
      label: `${m.mapping} → R=${m.latestScore}`,
    });
  }

  return rows;
}

export function findLatestQuarter(
  quarterly: readonly QuarterlyObservation[],
  label: string = CURRENT_QUARTER_LABEL
): QuarterlyObservation | undefined {
  return quarterly.find((q) => q.period === label);
}

export function distributionOfGrowth(
  quarterly: readonly QuarterlyObservation[],
  field: 'qoqTotalGrowthPct' | 'yoyTotalGrowthPct'
): DistributionSummary {
  const values = quarterly.map((q) => q[field]).filter((v): v is number => v != null);
  return summarizeDistribution(values);
}
