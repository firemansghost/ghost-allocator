/**
 * GhostFlow v1.1e-calibration — fixed-current-AUM return-sensitivity study (research only).
 *
 * Not true historical AUM calibration. No score wiring. No production artifact writes.
 *
 * Usage:
 *   npm run ghostflow:levered-etf-rebalance-history-study
 *   npm run ghostflow:levered-etf-rebalance-history-study -- --returns-csv path/to/returns.csv
 *   npm run ghostflow:levered-etf-rebalance-history-study -- --since 2015-01-01
 *   npm run ghostflow:levered-etf-rebalance-history-study -- --out data/ghostflow/research/leveredEtfSessions.v1.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import productionArtifact from '@/data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json';
import type { LeveredEtfRebalancePressureArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import {
  AGGREGATE_NOTIONAL_TOLERANCE_MILLIONS,
  AGGREGATE_PCT_TOLERANCE,
  PRODUCTION_ARTIFACT_CROSS_CHECK_DATE,
  alignSessions,
  aumMapFromProductionRows,
  buildLeveredMappingComparison,
  buildScoreImpactPreview,
  directionMix,
  fixedCurrentAumResolver,
  percentileRank,
  summarizeDistribution,
  topSessionsByPctOfAum,
  type DailyProxyReturns,
  type LeveredAumMode,
} from '@/lib/ghostflow/research/leveredEtfRebalanceHistory';

export {};

const STOOQ_PROXY_IDS: Record<'QQQ' | 'SPY' | 'IWM', string> = {
  QQQ: 'qqq.us',
  SPY: 'spy.us',
  IWM: 'iwm.us',
};

const DEFAULT_SINCE = '2010-02-11';

function parseArgs(argv: string[]): {
  since: string;
  returnsCsv?: string;
  aumMode: LeveredAumMode;
  aumCsv?: string;
  linearK: number;
  out?: string;
} {
  let since = DEFAULT_SINCE;
  let returnsCsv: string | undefined;
  let aumMode: LeveredAumMode = 'fixed-current';
  let aumCsv: string | undefined;
  let linearK = 20;
  let out: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since' && argv[i + 1]) since = argv[++i]!;
    else if (a === '--returns-csv' && argv[i + 1]) returnsCsv = argv[++i];
    else if (a === '--aum-mode' && argv[i + 1]) {
      const m = argv[++i]!;
      if (m === 'fixed-current' || m === 'csv-checkpoints') aumMode = m;
    } else if (a === '--aum-csv' && argv[i + 1]) aumCsv = argv[++i];
    else if (a === '--linear-k' && argv[i + 1]) linearK = Number(argv[++i]) || 20;
    else if (a === '--out' && argv[i + 1]) out = argv[++i];
  }

  return { since, returnsCsv, aumMode, aumCsv, linearK, out };
}

function isStooqApiKeyGateBody(text: string): boolean {
  const head = text.slice(0, 400).toLowerCase();
  return head.includes('apikey') && (head.includes('get your') || head.includes('captcha'));
}

function parseStooqDailyCsv(text: string): Array<{ date: string; close: number }> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0]!.toLowerCase();
  const dateIdx = header.split(',').findIndex((c) => c.trim() === 'date');
  const closeIdx = header.split(',').findIndex((c) => c.trim() === 'close');
  if (dateIdx < 0 || closeIdx < 0) return [];

  const rows: Array<{ date: string; close: number }> = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',');
    const dateRaw = parts[dateIdx]?.trim();
    const close = Number(parts[closeIdx]);
    if (!dateRaw || !Number.isFinite(close)) continue;
    const date = dateRaw.length >= 10 ? dateRaw.slice(0, 10) : dateRaw;
    rows.push({ date, close });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function closesToDailyReturnPct(closes: Array<{ date: string; close: number }>): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]!.close;
    const curr = closes[i]!.close;
    if (prev <= 0) continue;
    const pct = ((curr - prev) / prev) * 100;
    out.set(closes[i]!.date, Math.round(pct * 100) / 100);
  }
  return out;
}

function buildStooqUrl(stooqId: string, since: string, until: string): string {
  const d1 = since.replace(/-/g, '');
  const d2 = until.replace(/-/g, '');
  const base = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqId)}&d1=${d1}&d2=${d2}&i=d`;
  const apiKey = process.env.STOOQ_API_KEY?.trim();
  return apiKey ? `${base}&apikey=${encodeURIComponent(apiKey)}` : base;
}

async function fetchStooqCsv(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/csv,text/plain,*/*' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchProxyReturnsFromStooq(since: string): Promise<DailyProxyReturns[]> {
  const until = new Date().toISOString().slice(0, 10);
  const maps: Record<'QQQ' | 'SPY' | 'IWM', Map<string, number>> = {
    QQQ: new Map(),
    SPY: new Map(),
    IWM: new Map(),
  };

  for (const proxy of ['QQQ', 'SPY', 'IWM'] as const) {
    const url = buildStooqUrl(STOOQ_PROXY_IDS[proxy], since, until);
    const text = await fetchStooqCsv(url);
    if (isStooqApiKeyGateBody(text)) {
      throw new Error(
        'STOOQ_API_KEY gate — set env STOOQ_API_KEY or rerun with --returns-csv <path>'
      );
    }
    const closes = parseStooqDailyCsv(text);
    if (closes.length < 2) {
      throw new Error(`Stooq returned insufficient rows for ${proxy}`);
    }
    maps[proxy] = closesToDailyReturnPct(closes);
  }

  const dates = new Set<string>();
  for (const m of Object.values(maps)) {
    for (const d of m.keys()) dates.add(d);
  }

  const series: DailyProxyReturns[] = [];
  for (const date of [...dates].sort()) {
    if (date < since) continue;
    const qqq = maps.QQQ.get(date);
    const spy = maps.SPY.get(date);
    const iwm = maps.IWM.get(date);
    if (qqq === undefined || spy === undefined || iwm === undefined) continue;
    series.push({ date, qqqPct: qqq, spyPct: spy, iwmPct: iwm });
  }
  return series;
}

function parseReturnsCsv(text: string): DailyProxyReturns[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim());
  const dateIdx = header.findIndex((h) => h === 'date');
  const qqqIdx = header.findIndex((h) => h === 'qqqpct' || h === 'qqq_pct' || h === 'qqq');
  const spyIdx = header.findIndex((h) => h === 'spypct' || h === 'spy_pct' || h === 'spy');
  const iwmIdx = header.findIndex((h) => h === 'iwmpct' || h === 'iwm_pct' || h === 'iwm');
  if (dateIdx < 0 || qqqIdx < 0 || spyIdx < 0 || iwmIdx < 0) {
    throw new Error('returns CSV must have columns: date, qqqPct, spyPct, iwmPct (or qqq/spy/iwm)');
  }

  const rows: DailyProxyReturns[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',');
    const date = parts[dateIdx]!.trim().slice(0, 10);
    const qqqPct = Number(parts[qqqIdx]);
    const spyPct = Number(parts[spyIdx]);
    const iwmPct = Number(parts[iwmIdx]);
    if (!date || !Number.isFinite(qqqPct) || !Number.isFinite(spyPct) || !Number.isFinite(iwmPct)) {
      continue;
    }
    rows.push({ date, qqqPct, spyPct, iwmPct });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function printDistribution(label: string, values: number[]): void {
  const s = summarizeDistribution(values);
  console.log(
    `  ${label}: min ${s.min} | p25 ${s.p25} | median ${s.median} | p75 ${s.p75} | max ${s.max} | mean ${s.mean}`
  );
}

function printSessionLine(s: {
  date: string;
  observations: {
    aggregateRebalancePctOfUniverseAum: number;
    aggregateEstimatedRebalanceNotionalMillionsUsd: number;
    aggregateAbsRebalanceNotionalMillionsUsd: number;
    dominantDirection: string;
  };
}): void {
  const o = s.observations;
  const net = Math.round(o.aggregateEstimatedRebalanceNotionalMillionsUsd * 100) / 100;
  const abs = Math.round(o.aggregateAbsRebalanceNotionalMillionsUsd * 100) / 100;
  console.log(
    `    ${s.date} | ${o.aggregateRebalancePctOfUniverseAum}% AUM | net ${net}M | abs ${abs}M | ${o.dominantDirection}`
  );
}

async function runStudy(): Promise<void> {
  const { since, returnsCsv, aumMode, aumCsv, linearK, out } = parseArgs(process.argv.slice(2));

  console.log('GhostFlow v1.1e-calibration — levered ETF rebalance return-sensitivity study');
  console.log('Mode: fixed-current-AUM return-sensitivity (NOT true historical AUM calibration)');
  console.log('Research-only — no score wiring, no production artifact mutation');
  console.log('');

  if (aumMode === 'csv-checkpoints') {
    console.warn(
      'Warning: --aum-mode csv-checkpoints is experimental; MVP uses fixed-current-AUM only.'
    );
    if (!aumCsv) {
      console.error('csv-checkpoints requires --aum-csv (not implemented in this run).');
      process.exitCode = 1;
      return;
    }
  }

  const artifact = productionArtifact as LeveredEtfRebalancePressureArtifactV1;
  const aumMap = aumMapFromProductionRows(artifact.etfRows);
  const aumResolver = fixedCurrentAumResolver(aumMap);

  let dailySeries: DailyProxyReturns[];
  let returnSource: string;

  if (returnsCsv) {
    const text = readFileSync(resolve(process.cwd(), returnsCsv), 'utf8');
    dailySeries = parseReturnsCsv(text);
    returnSource = `CSV: ${returnsCsv}`;
  } else {
    try {
      dailySeries = await fetchProxyReturnsFromStooq(since);
      returnSource = `Stooq (QQQ/SPY/IWM daily close-to-close %), since ${since}`;
    } catch (err) {
      console.error('\n--- Return fetch failed ---');
      console.error(err instanceof Error ? err.message : err);
      console.error(
        '\nRerun with a reproducible returns file:\n  npm run ghostflow:levered-etf-rebalance-history-study -- --returns-csv <path>'
      );
      process.exitCode = 1;
      return;
    }
  }

  const filtered = dailySeries.filter((d) => d.date >= since);
  console.log(`Return source: ${returnSource}`);
  console.log(`AUM mode: fixed-current (production artifact snapshot, not time-varying)`);
  console.log(`Since filter: ${since}`);
  console.log(`Proxy return rows loaded: ${filtered.length}`);
  console.log('');

  const alignment = alignSessions(filtered, aumResolver);
  const { aligned, skippedSessions, totalDatesSeen } = alignment;

  if (aligned.length === 0) {
    console.error('No aligned sessions — cannot produce calibration summary.');
    process.exitCode = 1;
    return;
  }

  const latest = aligned[aligned.length - 1]!;
  const pcts = aligned.map((s) => s.observations.aggregateRebalancePctOfUniverseAum);
  const absNotional = aligned.map((s) => s.observations.aggregateAbsRebalanceNotionalMillionsUsd);
  const sortedPcts = [...pcts].sort((a, b) => a - b);
  const currentPctRank = percentileRank(sortedPcts, latest.observations.aggregateRebalancePctOfUniverseAum);

  console.log('--- Alignment ---');
  console.log(`  Date range: ${aligned[0]!.date} → ${latest.date}`);
  console.log(`  Dates seen (returns): ${totalDatesSeen}`);
  console.log(`  Aligned sessions (N): ${aligned.length}`);
  console.log(`  Skipped sessions: ${skippedSessions.length}`);
  console.log('');

  console.log('--- Latest session ---');
  printSessionLine(latest);
  console.log(`  Current %AUM percentile (fixed-AUM history): ${currentPctRank}th`);
  console.log('');

  const prod = artifact.observations;
  const prodDate = PRODUCTION_ARTIFACT_CROSS_CHECK_DATE;
  const studyWeek = aligned.find((s) => s.date === prodDate);
  console.log(`--- Production artifact cross-check (${prodDate}) ---`);
  console.log(
    `  Expected (artifact): ${prod.aggregateRebalancePctOfUniverseAum}% AUM | abs ${prod.aggregateAbsRebalanceNotionalMillionsUsd}M | ${prod.dominantDirection}`
  );
  if (studyWeek) {
    printSessionLine(studyWeek);
    const pctDelta = Math.abs(
      studyWeek.observations.aggregateRebalancePctOfUniverseAum - prod.aggregateRebalancePctOfUniverseAum
    );
    const absDelta = Math.abs(
      studyWeek.observations.aggregateAbsRebalanceNotionalMillionsUsd -
        prod.aggregateAbsRebalanceNotionalMillionsUsd
    );
    const pctOk = pctDelta <= AGGREGATE_PCT_TOLERANCE;
    const absOk = absDelta <= AGGREGATE_NOTIONAL_TOLERANCE_MILLIONS;
    console.log(`  Match within tolerance: pct ${pctOk ? 'yes' : 'no'} | abs notional ${absOk ? 'yes' : 'no'}`);
  } else {
    console.log(`  (${prodDate} not in aligned series — use returns that include production session)`);
  }
  console.log('');

  console.log('--- Distributions (fixed-current-AUM return-sensitivity) ---');
  printDistribution('aggregateRebalancePctOfUniverseAum (%)', pcts);
  printDistribution('aggregateAbsRebalanceNotionalMillionsUsd', absNotional);
  console.log('');

  const mix = directionMix(aligned.map((s) => s.observations.dominantDirection));
  console.log('--- Direction mix ---');
  console.log(
    `  buy_underlying: ${mix.buy_underlying}% | sell_underlying: ${mix.sell_underlying}% | mixed: ${mix.mixed}% | flat: ${mix.flat}%`
  );
  console.log('');

  console.log('--- Top 5 sessions by % of universe AUM ---');
  for (const s of topSessionsByPctOfAum(aligned, 5, 'high')) printSessionLine(s);
  console.log('');

  console.log('--- Bottom 5 sessions by % of universe AUM ---');
  for (const s of topSessionsByPctOfAum(aligned, 5, 'low')) printSessionLine(s);
  console.log('');

  const mappingRows = buildLeveredMappingComparison(aligned, latest, linearK);
  console.log('--- Mapping comparison (fixed-AUM history) ---');
  console.log('  mapping | latest | %sess>=70 | %sess>=80 | %sess>=90 | median | p90');
  for (const m of mappingRows) {
    console.log(
      `  ${m.mapping} | ${m.latestScore} | ${m.pctSessionsGte70}% | ${m.pctSessionsGte80}% | ${m.pctSessionsGte90}% | ${m.medianScore} | ${m.p90Score}`
    );
  }
  console.log('');

  const scoreRows = buildScoreImpactPreview(mappingRows);
  console.log('--- Score-impact preview vs MOCK 55 (peers fixed, not score wiring) ---');
  for (const r of scoreRows) {
    console.log(
      `  ${r.label}: Passive ${r.passivePressure} | Composite ${r.composite} | ${r.bandLabel}`
    );
  }
  console.log('');

  console.log('--- Caveat ---');
  console.log(
    '  This is a fixed-current-AUM return-sensitivity study — NOT true historical AUM calibration.'
  );
  console.log('  AUM is frozen at the production artifact snapshot; only index returns vary by session.');
  console.log('  Do not use these percentiles alone to approve v1.1f score wiring.');
  console.log('');

  if (out) {
    const path = resolve(process.cwd(), out);
    writeFileSync(
      path,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          studyType: 'fixed-current-aum-return-sensitivity',
          since,
          returnSource,
          dateRange: { start: aligned[0]!.date, end: latest.date },
          alignedSessionCount: aligned.length,
          skippedSessionCount: skippedSessions.length,
          currentPctPercentile: currentPctRank,
          sessions: aligned.map((s) => ({ date: s.date, observations: s.observations })),
          mappingComparison: mappingRows,
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`Wrote operator-local research JSON: ${path}`);
  }

  console.log(
    'Study complete. Populate docs/ghostflow/LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md from this output.'
  );
}

runStudy().catch((err) => {
  console.error('\n--- History study failed ---');
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
