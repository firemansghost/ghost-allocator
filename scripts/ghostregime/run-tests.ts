/**
 * Canonical GhostRegime deterministic test runner (R1).
 *
 * Discovers every `*.test.ts` under:
 *   - lib/ghostregime/__tests__/
 *   - lib/ghostregime/parity/__tests__/
 *
 * Discovery is a filesystem walk (no shell glob), sorted for a stable order.
 * New files matching `*.test.ts` in those directories are included automatically.
 * A non-test `.ts` file in those directories fails the run so helpers are not
 * silently omitted from the suite.
 *
 * Each file is executed with `tsx` via `process.execPath` (Windows-safe; no
 * cmd.exe glob expansion). The process exits non-zero if any file fails.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';

const require = createRequire(__filename);

const ROOTS = [
  join('lib', 'ghostregime', '__tests__'),
  join('lib', 'ghostregime', 'parity', '__tests__'),
];

function toPosix(rel: string): string {
  return rel.split(sep).join('/');
}

function walkTsFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

function discover(): { tests: string[]; stray: string[] } {
  const tests: string[] = [];
  const stray: string[] = [];
  for (const root of ROOTS) {
    for (const file of walkTsFiles(root)) {
      if (file.endsWith('.test.ts')) {
        tests.push(file);
      } else {
        stray.push(file);
      }
    }
  }
  tests.sort((a, b) => toPosix(relative(process.cwd(), a)).localeCompare(toPosix(relative(process.cwd(), b))));
  return { tests, stray };
}

function resolveTsxCli(): string {
  try {
    return require.resolve('tsx/cli');
  } catch {
    return require.resolve('tsx/dist/cli.mjs');
  }
}

function main(): void {
  const { tests, stray } = discover();

  if (stray.length > 0) {
    console.error('Canonical GhostRegime suite: unexpected non-test .ts files in test directories:');
    for (const file of stray) {
      console.error(`  ${toPosix(relative(process.cwd(), file))}`);
    }
    console.error('Rename to *.test.ts (to include) or move helpers out of these directories.');
    process.exit(1);
  }

  if (tests.length === 0) {
    console.error('Canonical GhostRegime suite: no *.test.ts files discovered.');
    process.exit(1);
  }

  const tsxCli = resolveTsxCli();
  console.log(`GhostRegime canonical suite: ${tests.length} files`);
  for (const file of tests) {
    console.log(`  ${toPosix(relative(process.cwd(), file))}`);
  }

  let failed = 0;
  for (const file of tests) {
    const rel = toPosix(relative(process.cwd(), file));
    console.log(`\n—— ${rel} ——`);
    const result = spawnSync(process.execPath, [tsxCli, file], {
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    });
    if (result.status !== 0) {
      failed += 1;
      console.error(`FAIL ${rel} (exit ${result.status ?? 'null'})`);
    }
  }

  if (failed > 0) {
    console.error(`\nGhostRegime canonical suite: ${failed}/${tests.length} files failed`);
    process.exit(1);
  }

  console.log(`\nGhostRegime canonical suite: ${tests.length} files passed`);
}

main();
