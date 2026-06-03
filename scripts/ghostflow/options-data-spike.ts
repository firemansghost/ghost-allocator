/**
 * GhostFlow v1.4b — Options / 0DTE source spike (research only).
 *
 * Operator-file based only. No network fetch. No artifact writes.
 *
 * Cboe monthly XLSX: requires Python 3 + openpyxl (`pip install openpyxl`).
 *
 * Usage:
 *   npm run ghostflow:options-data-spike -- \
 *     --cboe-xlsx tmp/options-spike/cboe-2026-04.xlsx \
 *     --cboe-xlsx tmp/options-spike/cboe-2026-05.xlsx \
 *     --occ-daily tmp/options-spike/occ-daily-1.txt \
 *     [--occ-daily tmp/options-spike/occ-daily-2.txt] \
 *     [--occ-contract-date tmp/options-spike/occ-contract-date.txt]
 *
 * Exit codes:
 *   0 — at least one production-ready column lock (typically OCC aggregate / index volume)
 *   1 — missing inputs, parse errors, or no lockable columns
 *   2 — partial Cboe 0DTE hints but no two-file 0DTE column lock
 *
 * Not included in ghostflow:check.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const SEARCH_TERMS = [
  '0dte',
  'zero day',
  'zero-day',
  'same day',
  'same-day',
  'spx',
  's&p 500',
  's&p500',
  'expiry',
  'expiration',
] as const;

const OCC_FIELD_SPECS: Array<{
  lockKey: string;
  patterns: RegExp[];
}> = [
  {
    lockKey: 'totalOptionsContracts',
    patterns: [
      /total\s+(?:industry\s+)?(?:options?\s+)?(?:volume|contracts?)/i,
      /^total\s*contracts?/i,
      /grand\s+total/i,
    ],
  },
  {
    lockKey: 'indexOptionsContracts',
    patterns: [
      /index\s*(?:\/\s*other)?\s*options?/i,
      /index\s+options?/i,
      /class:\s*index/i,
    ],
  },
  {
    lockKey: 'equityOptionsContracts',
    patterns: [/equity\s*options?/i, /class:\s*equity/i],
  },
  {
    lockKey: 'etfOptionsContracts',
    patterns: [/etf\s*options?/i, /exchange\s*traded\s*funds?/i, /class:\s*etf/i],
  },
  {
    lockKey: 'putCallRatio',
    patterns: [/put\s*[\/\s]*call\s*ratio/i, /\bpcr\b/i],
  },
];

interface CboeCellMatch {
  sheet: string;
  row: number;
  col: number;
  value: string;
  term: string;
}

interface CboeWorkbookScan {
  path: string;
  fileType: string;
  sheetNames: string[];
  matches: CboeCellMatch[];
  zeroDteHeaderKeys: string[];
  spxAdvSection: {
    found: boolean;
    label: string | null;
    sampleValues: number[];
    monthColumnHint: string | null;
  };
  error?: string;
}

interface OccFieldHit {
  lockKey: string;
  label: string;
  value: number | null;
  line?: number;
}

interface OccDailyScan {
  path: string;
  fileType: string;
  tradeDate: string | null;
  fields: OccFieldHit[];
  layoutNotes: string[];
  error?: string;
}

interface OccContractDateScan {
  path: string;
  tradeDateCol: string | null;
  expirationCol: string | null;
  sampleRows: number;
  sameDayExpiryVolume: number | null;
  researchOnly: boolean;
  error?: string;
}

interface ParsedArgs {
  cboeXlsx: string[];
  occDaily: string[];
  occContractDate: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const cboeXlsx: string[] = [];
  const occDaily: string[] = [];
  const occContractDate: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cboe-xlsx' && argv[i + 1]) cboeXlsx.push(resolve(argv[++i]!));
    else if (a === '--occ-daily' && argv[i + 1]) occDaily.push(resolve(argv[++i]!));
    else if (a === '--occ-contract-date' && argv[i + 1]) occContractDate.push(resolve(argv[++i]!));
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: npm run ghostflow:options-data-spike -- \\
  --cboe-xlsx <path> [--cboe-xlsx <path2>] \\
  --occ-daily <path> [--occ-daily <path2>] \\
  [--occ-contract-date <path>]`);
      process.exit(0);
    }
  }

  return { cboeXlsx, occDaily, occContractDate };
}

function normalizeHeader(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

const PYTHON_CBOE_SCAN = `
import json, re, sys
try:
    import openpyxl
except ImportError:
    print(json.dumps({"error": "openpyxl not installed; run: pip install openpyxl"}))
    sys.exit(2)

path = sys.argv[1]
terms = [t.lower() for t in sys.argv[2].split("|")]

def norm(s):
    return re.sub(r"\\s+", " ", str(s)).strip()

def is_zero_dte_header(text):
    n = norm(text).lower()
    if "0dte" not in n and "zero day" not in n and "same-day" not in n and "same day" not in n:
        return False
    return bool(re.search(r"0\\s*dte|zero\\s*days?\\s*to\\s*expir|same\\s*-?\\s*day", n, re.I))

def match_term(s):
    sl = norm(s).lower()
    for t in terms:
        if t in sl:
            return t
    return None

wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
out = {
    "path": path,
    "sheetNames": wb.sheetnames,
    "matches": [],
    "zeroDteHeaderKeys": [],
    "spxAdvSection": {"found": False, "label": None, "sampleValues": [], "monthColumnHint": None},
}

for sn in wb.sheetnames:
    sh = wb[sn]
    in_adv = False
    for row in sh.iter_rows(max_row=120, max_col=24):
        cells = []
        for c in row:
            if c.value is None:
                cells.append("")
            else:
                cells.append(norm(c.value))
        if not any(cells):
            continue
        row_text = " | ".join(c for c in cells if c)
        if "adv for select index products" in row_text.lower():
            in_adv = True
            continue
        if in_adv and any("fx rates" in c.lower() for c in cells if c):
            in_adv = False
        for idx, val in enumerate(cells):
            if not val:
                continue
            t = match_term(val)
            if t:
                out["matches"].append({
                    "sheet": sn,
                    "row": row[0].row,
                    "col": row[idx].column,
                    "value": val[:120],
                    "term": t,
                })
            if is_zero_dte_header(val):
                key = norm(val)
                if key not in out["zeroDteHeaderKeys"]:
                    out["zeroDteHeaderKeys"].append(key)
        if in_adv:
            joined = " ".join(cells).lower()
            if "spx" in joined and "option" in joined:
                nums = []
                for v in cells[1:]:
                    try:
                        n = float(v.replace(",", ""))
                        if n > 0:
                            nums.append(n)
                    except Exception:
                        pass
                if nums:
                    out["spxAdvSection"]["found"] = True
                    out["spxAdvSection"]["label"] = next((c for c in cells if c), "SPX options")
                    out["spxAdvSection"]["sampleValues"] = nums[:6]
            if cells[0] and "spx" == cells[0].lower() and len(cells) > 2:
                nums = []
                for v in cells[3:]:
                    try:
                        n = float(v.replace(",", ""))
                        if n > 0:
                            nums.append(n)
                    except Exception:
                        pass
                if nums and not out["spxAdvSection"]["found"]:
                    out["spxAdvSection"]["found"] = True
                    out["spxAdvSection"]["label"] = "SPX (product code row)"
                    out["spxAdvSection"]["sampleValues"] = nums[:6]

wb.close()
print(json.dumps(out))
`;

function scanCboeXlsx(path: string): CboeWorkbookScan {
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!existsSync(path)) {
    return {
      path,
      fileType,
      sheetNames: [],
      matches: [],
      zeroDteHeaderKeys: [],
      spxAdvSection: { found: false, label: null, sampleValues: [], monthColumnHint: null },
      error: `File not found: ${path}`,
    };
  }

  try {
    const termsArg = SEARCH_TERMS.join('|');
    const json = execFileSync('python', ['-c', PYTHON_CBOE_SCAN, path, termsArg], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
    const parsed = JSON.parse(json) as CboeWorkbookScan & { error?: string };
    if (parsed.error) {
      return {
        path,
        fileType,
        sheetNames: [],
        matches: [],
        zeroDteHeaderKeys: [],
        spxAdvSection: { found: false, label: null, sampleValues: [], monthColumnHint: null },
        error: parsed.error,
      };
    }
    return {
      path,
      fileType,
      sheetNames: parsed.sheetNames ?? [],
      matches: parsed.matches ?? [],
      zeroDteHeaderKeys: parsed.zeroDteHeaderKeys ?? [],
      spxAdvSection: parsed.spxAdvSection ?? {
        found: false,
        label: null,
        sampleValues: [],
        monthColumnHint: null,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      path,
      fileType,
      sheetNames: [],
      matches: [],
      zeroDteHeaderKeys: [],
      spxAdvSection: { found: false, label: null, sampleValues: [], monthColumnHint: null },
      error: msg,
    };
  }
}

function parseNumberToken(s: string): number | null {
  const cleaned = s.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractNumberAfterLabel(line: string): number | null {
  const parts = line.split(/[:\t|]/);
  for (let i = parts.length - 1; i >= 0; i--) {
    const n = parseNumberToken(parts[i] ?? '');
    if (n != null && n > 0) return n;
  }
  const tail = line.match(/([\d,]+(?:\.\d+)?)\s*$/);
  if (tail) return parseNumberToken(tail[1] ?? '');
  return null;
}

function scanOccDaily(path: string): OccDailyScan {
  const fileType = 'text/plain (OCC volume download — operator provided)';
  if (!existsSync(path)) {
    return {
      path,
      fileType,
      tradeDate: null,
      fields: [],
      layoutNotes: [],
      error: `File not found: ${path}`,
    };
  }

  try {
    const raw = readFileSync(path, 'utf8');
    const lines = raw.split(/\r?\n/);
    const fields: OccFieldHit[] = [];
    const layoutNotes: string[] = [];
    let tradeDate: string | null = null;

    const dateMatch = raw.match(
      /(?:trade\s*date|business\s*date|report\s*date|as\s*of)\s*[:\s]*(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{8})/i
    );
    if (dateMatch) tradeDate = dateMatch[1] ?? null;

    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      for (const spec of OCC_FIELD_SPECS) {
        if (seen.has(spec.lockKey)) continue;
        if (!spec.patterns.some((p) => p.test(line))) continue;
        const value = extractNumberAfterLabel(line);
        if (value == null) {
          const next = lines[i + 1]?.trim() ?? '';
          const nextVal = extractNumberAfterLabel(next);
          if (nextVal != null) {
            fields.push({ lockKey: spec.lockKey, label: line.slice(0, 80), value: nextVal, line: i + 2 });
            seen.add(spec.lockKey);
            continue;
          }
        }
        if (value != null) {
          fields.push({ lockKey: spec.lockKey, label: line.slice(0, 80), value, line: i + 1 });
          seen.add(spec.lockKey);
        }
      }

      if (/^index\b/i.test(line) && !seen.has('indexOptionsContracts')) {
        const v = extractNumberAfterLabel(line);
        if (v != null) {
          fields.push({ lockKey: 'indexOptionsContracts', label: line.slice(0, 80), value: v, line: i + 1 });
          seen.add('indexOptionsContracts');
        }
      }
    }

    if (fields.length === 0) {
      layoutNotes.push('No labeled aggregate fields matched — confirm Volume Download Record Layout (PDF) on OCC daily volume page.');
    } else {
      layoutNotes.push(`Matched ${fields.length} aggregate field(s) via label heuristics.`);
    }

    return { path, fileType, tradeDate, fields, layoutNotes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      path,
      fileType,
      tradeDate: null,
      fields: [],
      layoutNotes: [],
      error: msg,
    };
  }
}

function scanOccContractDate(path: string): OccContractDateScan {
  if (!existsSync(path)) {
    return {
      path,
      tradeDateCol: null,
      expirationCol: null,
      sampleRows: 0,
      sameDayExpiryVolume: null,
      researchOnly: true,
      error: `File not found: ${path}`,
    };
  }

  try {
    const raw = readFileSync(path, 'utf8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return {
        path,
        tradeDateCol: null,
        expirationCol: null,
        sampleRows: 0,
        sameDayExpiryVolume: null,
        researchOnly: true,
        error: 'Empty file',
      };
    }

    const header = lines[0]!.toLowerCase();
    const delim = header.includes('\t') ? '\t' : header.includes(',') ? ',' : null;
    const cols = delim ? lines[0]!.split(delim).map((c) => c.trim()) : [];

    let tradeDateCol: string | null = null;
    let expirationCol: string | null = null;
    for (const c of cols) {
      const cl = c.toLowerCase();
      if (/trade\s*date|business\s*date/.test(cl)) tradeDateCol = c;
      if (/expir|maturity/.test(cl)) expirationCol = c;
    }

    if (!delim || !tradeDateCol || !expirationCol) {
      return {
        path,
        tradeDateCol,
        expirationCol,
        sampleRows: 0,
        sameDayExpiryVolume: null,
        researchOnly: true,
        error: 'Could not verify trade-date and expiration columns (delimiter/header)',
      };
    }

    const tIdx = cols.indexOf(tradeDateCol);
    const eIdx = cols.indexOf(expirationCol);
    let volIdx = cols.findIndex((c) => /volume|contracts/i.test(c));
    if (volIdx < 0) volIdx = cols.length - 1;

    let sameDay = 0;
    let rows = 0;
    for (let i = 1; i < Math.min(lines.length, 5000); i++) {
      const parts = lines[i]!.split(delim);
      if (parts.length < cols.length) continue;
      rows++;
      const td = (parts[tIdx] ?? '').trim().replace(/\D/g, '');
      const ed = (parts[eIdx] ?? '').trim().replace(/\D/g, '');
      if (td && ed && td === ed) {
        const v = parseNumberToken(parts[volIdx] ?? '');
        if (v != null) sameDay += v;
      }
    }

    return {
      path,
      tradeDateCol,
      expirationCol,
      sampleRows: rows,
      sameDayExpiryVolume: rows > 0 ? sameDay : null,
      researchOnly: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      path,
      tradeDateCol: null,
      expirationCol: null,
      sampleRows: 0,
      sameDayExpiryVolume: null,
      researchOnly: true,
      error: msg,
    };
  }
}

function evaluateOutcomeA(scans: CboeWorkbookScan[]): {
  pass: boolean;
  partial: boolean;
  detail: string;
  stableKeys: string[];
} {
  const ok = scans.filter((s) => !s.error);
  if (ok.length < 2) {
    return {
      pass: false,
      partial: ok.some((s) => s.zeroDteHeaderKeys.length > 0),
      detail: 'Need two readable Cboe XLSX files for 0DTE column stability check.',
      stableKeys: [],
    };
  }

  const keySets = ok.map((s) => new Set(s.zeroDteHeaderKeys.map(normalizeHeader)));
  const intersection = [...keySets[0]!].filter((k) => keySets.every((set) => set.has(k)));
  const pass = intersection.length > 0;
  const partial =
    !pass && ok.some((s) => s.matches.some((m) => m.term === '0dte' || m.value.toLowerCase().includes('0dte')));

  return {
    pass,
    partial,
    detail: pass
      ? `Stable 0DTE header(s) across ${ok.length} workbooks: ${intersection.join('; ')}`
      : 'No stable 0DTE/same-day column headers in two monthly XLSX files.',
    stableKeys: intersection,
  };
}

function evaluateOutcomeB(occScans: OccDailyScan[]): { pass: boolean; detail: string; locked: string[] } {
  const ok = occScans.filter((s) => !s.error && s.fields.length > 0);
  if (ok.length === 0) {
    return { pass: false, detail: 'No OCC daily files with lockable aggregate fields.', locked: [] };
  }

  const required = 'indexOptionsContracts';
  const allHaveIndex = ok.every((s) => s.fields.some((f) => f.lockKey === required));
  if (!allHaveIndex) {
    return {
      pass: false,
      detail: 'OCC files parsed but indexOptionsContracts not found in all samples.',
      locked: ok[0]!.fields.map((f) => f.lockKey),
    };
  }

  const keys = ok[0]!.fields.map((f) => f.lockKey);
  const stable = ok.every(
    (s) =>
      keys.every((k) => s.fields.some((f) => f.lockKey === k)) &&
      s.fields.length >= keys.length - 1
  );

  return {
    pass: stable,
    detail: stable
      ? `OCC aggregate lock: ${keys.join(', ')} (primary: ${required}) across ${ok.length} file(s).`
      : 'OCC field sets differ between files — verify layout consistency.',
    locked: keys,
  };
}

function printCboeScan(scan: CboeWorkbookScan): void {
  console.log(`\n--- Cboe XLSX: ${basename(scan.path)} ---`);
  console.log(`  Path: ${scan.path}`);
  console.log(`  Type: ${scan.fileType}`);
  if (scan.error) {
    console.log(`  ERROR: ${scan.error}`);
    return;
  }
  console.log(`  Sheets: ${scan.sheetNames.join(', ')}`);
  console.log(`  0DTE header keys: ${scan.zeroDteHeaderKeys.length ? scan.zeroDteHeaderKeys.join(' | ') : '(none)'}`);
  if (scan.spxAdvSection.found) {
    console.log(
      `  SPX ADV section: ${scan.spxAdvSection.label} | sample values (thousands contracts): ${scan.spxAdvSection.sampleValues.join(', ')}`
    );
  } else {
    console.log('  SPX ADV section: not found');
  }
  const show = scan.matches.slice(0, 25);
  if (show.length) {
    console.log('  Term matches (first 25):');
    for (const m of show) {
      console.log(`    [${m.sheet}] R${m.row} C${m.col} term=${m.term} value="${m.value}"`);
    }
    if (scan.matches.length > 25) console.log(`    ... +${scan.matches.length - 25} more`);
  }
}

function printOccScan(scan: OccDailyScan): void {
  console.log(`\n--- OCC daily: ${basename(scan.path)} ---`);
  console.log(`  Path: ${scan.path}`);
  console.log(`  Type: ${scan.fileType}`);
  if (scan.error) {
    console.log(`  ERROR: ${scan.error}`);
    return;
  }
  if (scan.tradeDate) console.log(`  Trade date hint: ${scan.tradeDate}`);
  for (const n of scan.layoutNotes) console.log(`  Note: ${n}`);
  if (scan.fields.length === 0) {
    console.log('  Fields: (none matched)');
    return;
  }
  console.log('  Fields:');
  for (const f of scan.fields) {
    console.log(`    ${f.lockKey}: ${f.value ?? 'n/a'}  (label: ${f.label})`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  console.log('GhostFlow v1.4b — Options / 0DTE source spike (research only)');
  console.log('No network fetch. No artifact writes.\n');

  if (args.cboeXlsx.length === 0 && args.occDaily.length === 0) {
    console.error('Provide at least one --cboe-xlsx or --occ-daily file.');
    console.error('See script header for usage.');
    process.exit(1);
  }

  const cboeScans = args.cboeXlsx.map(scanCboeXlsx);
  for (const s of cboeScans) printCboeScan(s);

  const occScans = args.occDaily.map(scanOccDaily);
  for (const s of occScans) printOccScan(s);

  for (const p of args.occContractDate) {
    const cd = scanOccContractDate(p);
    console.log(`\n--- OCC contract-date (research only): ${basename(p)} ---`);
    if (cd.error) console.log(`  ERROR: ${cd.error}`);
    else {
      console.log(`  tradeDateCol: ${cd.tradeDateCol ?? 'n/a'} | expirationCol: ${cd.expirationCol ?? 'n/a'}`);
      console.log(`  sampleRows: ${cd.sampleRows} | sameDayExpiryVolume sum: ${cd.sameDayExpiryVolume ?? 'n/a'}`);
      console.log('  Not used for Outcome B unless columns verified; do not label aggregate as 0DTE.');
    }
  }

  const outcomeA = evaluateOutcomeA(cboeScans);
  const outcomeB = evaluateOutcomeB(occScans);
  const cboeSpxLock = cboeScans.filter((s) => !s.error && s.spxAdvSection.found).length >= 2;

  let outcomeC: 'PASS' | 'FAIL' = 'FAIL';
  if (!outcomeA.pass && !outcomeB.pass) outcomeC = 'PASS';

  console.log('\n=== Outcomes ===');
  console.log(`OUTCOME_A: ${outcomeA.pass ? 'PASS' : 'FAIL'} — ${outcomeA.detail}`);
  console.log(`OUTCOME_B: ${outcomeB.pass ? 'PASS' : 'FAIL'} — ${outcomeB.detail}`);
  console.log(
    `OUTCOME_C: ${outcomeC} — ${outcomeC === 'PASS' ? 'No stable public path for 0DTE or OCC aggregate lock.' : 'At least one public path candidate remains.'}`
  );

  if (cboeSpxLock) {
    console.log(
      '\nCboe supplementary (not Outcome A): SPX options ADV row found in 2+ monthly XLSX — candidate for **Index Options Intensity Proxy** (monthly, display-only). Not 0DTE.'
    );
  }

  console.log('\nMemo: docs/ghostflow/ODTE_OPTIONS_FEASIBILITY.md');

  if (outcomeB.pass) {
    process.exit(0);
  }
  if (outcomeA.partial) {
    process.exit(2);
  }
  process.exit(1);
}

main();

export {};
