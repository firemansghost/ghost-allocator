import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WRITE_PRIMITIVES = [
  'writeFile',
  'writeFileSync',
  'rename',
  'renameSync',
  'unlink',
  'unlinkSync',
  'rm',
  'rmSync',
  'mkdir',
  'mkdirSync',
  'appendFile',
  'appendFileSync',
] as const;

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function main(): void {
  const files = [
    ...listTsFiles(join(process.cwd(), 'lib/ghostflow/refresh/promotion')),
    join(process.cwd(), 'scripts/ghostflow/promote-candidate.ts'),
  ];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    for (const primitive of WRITE_PRIMITIVES) {
      const re = new RegExp(`\\b${primitive}\\b`);
      assert.ok(!re.test(source), `${file} must not reference write-capable fs primitive ${primitive}`);
    }

    assert.ok(
      !source.includes('DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP'),
      `${file} must not import DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP`
    );
    assert.ok(
      !/from ['"][^'"]*operatorRunner['"]/.test(source),
      `${file} must not import operatorRunner`
    );
    assert.ok(!source.includes('node:http'), `${file} must not import node:http`);
    assert.ok(!source.includes('node:https'), `${file} must not import node:https`);

    if (source.includes('node:fs')) {
      assert.ok(
        /import\s*\{\s*readFile\s*\}\s*from\s*['"]node:fs\/promises['"]/.test(source),
        `${file}: only readFile from node:fs/promises is allowed`
      );
    }
  }

  console.log('ghostflow/promotion/architecture.test.ts: ok');
}

main();
