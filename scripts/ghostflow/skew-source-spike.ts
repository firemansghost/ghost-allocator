/**
 * GhostFlow v1.9e.1 — Cboe SKEW source spike (research only).
 *
 * Operator-file based only. No network fetch. No artifact writes.
 *
 * Usage:
 *   npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <local-path>
 *   npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <path> [--corr-csv <path>]
 *
 * Exit codes:
 *   0 — SKEW_SOURCE_LOCK PASS
 *   1 — missing file, parse error, or SKEW lock FAIL
 *   2 — SKEW lock PARTIAL
 *
 * Not included in ghostflow:check. Not runtime/dashboard.
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

type SourceLock = 'PASS' | 'PARTIAL' | 'FAIL';
type CorrLock = SourceLock | 'SKIPPED';

interface ParsedRow {
  date: string;
  value: number;
  rawDate: string;
}

interface ColumnDetection {
  dateCol: string;
  valueCol: string;
  dateIdx: number;
  valueIdx: number;
  valueColHeuristic: boolean;
}

interface ParseResult {
  path: string;
  delimiter: string;
  headers: string[];
  rows: ParsedRow[];
  detection: ColumnDetection;
  warnings: string[];
  error?: string;
}

interface LockEvaluation {
  lock: SourceLock;
  reasons: string[];
}

const MIN_ROWS_PASS = 252;
const SKEW_WARN_LOW = 80;
const SKEW_WARN_HIGH = 250;

function parseArgs(argv: string[]): { skewCsv?: string; corrCsv?: string } {
  let skewCsv: string | undefined;
  let corrCsv: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skew-csv' && argv[i + 1]) skewCsv = resolve(argv[++i]!);
    else if (a === '--corr-csv' && argv[i + 1]) corrCsv = resolve(argv[++i]!);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <path> [--corr-csv <path>]`);
      process.exit(0);
    }
  }

  return { skewCsv, corrCsv };
}

function parseCsvRow(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cols.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return tabs > commas ? '\t' : ',';
}

function normalizeHeader(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function parseDateToken(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    const mm = us[1]!.padStart(2, '0');
    const dd = us[2]!.padStart(2, '0');
    return `${us[3]}-${mm}-${dd}`;
  }

  return null;
}

function parseNumberToken(s: string): number | null {
  const cleaned = s.replace(/,/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === 'N/A') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function detectColumns(headers: string[]): ColumnDetection | null {
  const normalized = headers.map(normalizeHeader);
  const lower = normalized.map((h) => h.toLowerCase());

  let dateIdx = lower.findIndex((h) => h === 'date' || h === 'trade date' || h === 'observation date');
  if (dateIdx < 0) dateIdx = lower.findIndex((h) => h.includes('date'));

  let valueIdx = lower.findIndex((h) => h === 'close');
  let valueColHeuristic = false;
  if (valueIdx < 0) {
    valueIdx = lower.findIndex((h) => h === 'skew' || h === 'index' || h === 'value' || h === 'level');
    valueColHeuristic = valueIdx >= 0;
  }
  if (valueIdx < 0) {
    for (let i = headers.length - 1; i >= 0; i--) {
      if (i === dateIdx) continue;
      const h = lower[i] ?? '';
      if (/open|high|low|volume|turnover/.test(h)) continue;
      valueIdx = i;
      valueColHeuristic = true;
      break;
    }
  }

  if (dateIdx < 0 || valueIdx < 0 || dateIdx === valueIdx) return null;

  return {
    dateCol: normalized[dateIdx]!,
    valueCol: normalized[valueIdx]!,
    dateIdx,
    valueIdx,
    valueColHeuristic,
  };
}

function parseIndexCsv(path: string, label: string): ParseResult {
  const base: ParseResult = {
    path,
    delimiter: ',',
    headers: [],
    rows: [],
    detection: { dateCol: '', valueCol: '', dateIdx: -1, valueIdx: -1, valueColHeuristic: false },
    warnings: [],
  };

  if (!existsSync(path)) {
    return { ...base, error: `File not found: ${path}` };
  }

  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...base, error: `Read error: ${msg}` };
  }

  if (!raw.trim()) {
    return { ...base, error: 'File is empty' };
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ...base, error: 'File has no data rows' };
  }

  const delimiter = detectDelimiter(lines[0]!);
  base.delimiter = delimiter === '\t' ? 'tab' : 'comma';
  base.headers = parseCsvRow(lines[0]!, delimiter).map(normalizeHeader);

  const detection = detectColumns(base.headers);
  if (!detection) {
    return { ...base, error: 'Could not detect date and value columns' };
  }
  base.detection = detection;

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]!, delimiter);
    if (cols.every((c) => !c.trim())) continue;

    const rawDate = cols[detection.dateIdx] ?? '';
    const iso = parseDateToken(rawDate);
    const value = parseNumberToken(cols[detection.valueIdx] ?? '');
    if (!iso || value == null) continue;

    rows.push({ date: iso, value, rawDate });
  }

  if (rows.length === 0) {
    return { ...base, error: 'No parseable data rows' };
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  if (detection.valueColHeuristic) {
    base.warnings.push(
      `Value column "${detection.valueCol}" selected via heuristic (Close not found) — treat as PARTIAL until operator confirms.`
    );
  }

  if (label === 'SKEW') {
    const latest = rows[rows.length - 1]!.value;
    if (latest < SKEW_WARN_LOW || latest > SKEW_WARN_HIGH) {
      base.warnings.push(
        `Latest ${label} value ${latest} outside typical range ${SKEW_WARN_LOW}–${SKEW_WARN_HIGH} — verify column mapping (warning only).`
      );
    }
  }

  base.rows = rows;
  return base;
}

function checkMonotonic(rows: ParsedRow[]): { ok: boolean; violations: number } {
  let violations = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]!.date <= rows[i - 1]!.date) violations++;
  }
  const ok = violations === 0;
  return { ok, violations };
}

function evaluateLock(parsed: ParseResult, minRows: number, seriesLabel: string): LockEvaluation {
  const reasons: string[] = [];

  if (parsed.error) {
    return { lock: 'FAIL', reasons: [parsed.error] };
  }

  const { rows, detection, warnings } = parsed;
  const rowCount = rows.length;
  const monotonic = checkMonotonic(rows);

  if (rowCount < minRows) {
    reasons.push(`Only ${rowCount} data rows (need ≥${minRows} for PASS).`);
  }

  if (!monotonic.ok) {
    reasons.push(`Dates not strictly monotonic (${monotonic.violations} violation(s)).`);
  }

  if (detection.valueColHeuristic) {
    reasons.push(`Value column "${detection.valueCol}" not confirmed as Close/index level.`);
  }

  for (const w of warnings) reasons.push(w);

  const latest = rows[rows.length - 1]!;
  if (!Number.isFinite(latest.value)) {
    return { lock: 'FAIL', reasons: [...reasons, 'Latest value is not numeric.'] };
  }

  const hardFail =
    rowCount === 0 ||
    !detection.dateCol ||
    !detection.valueCol ||
    parsed.error != null;

  if (hardFail) {
    return { lock: 'FAIL', reasons };
  }

  const passReady =
    rowCount >= minRows &&
    monotonic.ok &&
    !detection.valueColHeuristic &&
    detection.dateCol.toLowerCase().includes('date');

  if (passReady) {
    return { lock: 'PASS', reasons: [`${seriesLabel}: stable Date + Close columns; ${rowCount} rows; latest ${latest.value}.`] };
  }

  const partialSignals =
    rowCount >= minRows ||
    (rowCount >= 60 && detection.dateCol) ||
    detection.valueColHeuristic ||
    !monotonic.ok;

  if (partialSignals && rowCount > 0) {
    return {
      lock: 'PARTIAL',
      reasons: reasons.length ? reasons : [`${seriesLabel}: parseable but needs operator cleanup before artifact design.`],
    };
  }

  return { lock: 'FAIL', reasons: reasons.length ? reasons : [`${seriesLabel}: insufficient data for source lock.`] };
}

function printReport(
  label: string,
  parsed: ParseResult,
  lock: SourceLock | CorrLock
): void {
  console.log(`\n=== ${label} report ===`);
  console.log(`  file path: ${parsed.path}`);
  if (parsed.error) {
    console.log(`  ERROR: ${parsed.error}`);
    console.log(`  ${label}_SOURCE_LOCK: ${lock}`);
    return;
  }

  console.log(`  detected delimiter: ${parsed.delimiter}`);
  console.log(`  header row: ${parsed.headers.join(' | ')}`);
  console.log(`  date column candidate: ${parsed.detection.dateCol} (index ${parsed.detection.dateIdx})`);
  console.log(
    `  value column candidate: ${parsed.detection.valueCol} (index ${parsed.detection.valueIdx})${parsed.detection.valueColHeuristic ? ' [heuristic]' : ''}`
  );
  console.log(`  row count: ${parsed.rows.length}`);

  const first = parsed.rows[0]!;
  const latest = parsed.rows[parsed.rows.length - 1]!;
  console.log(`  first date: ${first.date} (raw: ${first.rawDate})`);
  console.log(`  latest date: ${latest.date} (raw: ${latest.rawDate})`);
  console.log(`  latest parsed value: ${latest.value}`);

  const sampleFirst = parsed.rows.slice(0, 3);
  const sampleLast = parsed.rows.slice(-3);
  console.log('  first 3 parsed rows:');
  for (const r of sampleFirst) {
    console.log(`    ${r.date}  ${r.value}`);
  }
  console.log('  last 3 parsed rows:');
  for (const r of sampleLast) {
    console.log(`    ${r.date}  ${r.value}`);
  }

  if (parsed.warnings.length) {
    console.log('  warnings:');
    for (const w of parsed.warnings) console.log(`    - ${w}`);
  }

  console.log(`  ${label}_SOURCE_LOCK: ${lock}`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  console.log('GhostFlow v1.9e.1 — Protection Bid source spike (research only)');
  console.log('No network fetch. No artifact writes.\n');

  if (!args.skewCsv) {
    console.error('Required: --skew-csv <local-path>');
    console.error('Usage: npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <path> [--corr-csv <path>]');
    process.exit(1);
  }

  const skewParsed = parseIndexCsv(args.skewCsv, 'SKEW');
  const skewEval = evaluateLock(skewParsed, MIN_ROWS_PASS, 'SKEW');
  printReport('SKEW', skewParsed, skewEval.lock);

  if (skewEval.reasons.length) {
    console.log('\n  SKEW lock notes:');
    for (const r of skewEval.reasons) console.log(`    - ${r}`);
  }

  let corrLock: CorrLock = 'SKIPPED';
  if (args.corrCsv) {
    const corrParsed = parseIndexCsv(args.corrCsv, 'CORR');
    const corrEval = evaluateLock(corrParsed, MIN_ROWS_PASS, 'CORR');
    corrLock = corrEval.lock;
    printReport('CORR', corrParsed, corrLock);
    if (corrEval.reasons.length) {
      console.log('\n  CORR lock notes:');
      for (const r of corrEval.reasons) console.log(`    - ${r}`);
    }
  } else {
    console.log('\nCORR_SOURCE_LOCK: SKIPPED (no --corr-csv provided)');
  }

  console.log('\nMemo: docs/ghostflow/PROTECTION_BID_SOURCE_SPIKE.md');

  if (skewEval.lock === 'PASS') process.exit(0);
  if (skewEval.lock === 'PARTIAL') process.exit(2);
  process.exit(1);
}

main();

export {};
