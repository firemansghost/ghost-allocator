import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { GHOSTFLOW_CANDIDATE_ARTIFACT_IDS } from '@/lib/ghostflow/refresh/candidates/types';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import { resolvePromotionRegistryDestination } from '@/lib/ghostflow/refresh/promotion/pathSafety';

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
  const writerPath = join(process.cwd(), 'lib/ghostflow/refresh/promotion/writer.ts');
  const receiptWriterPath = join(
    process.cwd(),
    'lib/ghostflow/refresh/promotion/receiptWriter.ts'
  );
  const pathSafetyPath = join(process.cwd(), 'lib/ghostflow/refresh/promotion/pathSafety.ts');
  const receiptPathSafetyPath = join(
    process.cwd(),
    'lib/ghostflow/refresh/promotion/receiptPathSafety.ts'
  );
  const files = [
    ...listTsFiles(join(process.cwd(), 'lib/ghostflow/refresh/promotion')),
    join(process.cwd(), 'scripts/ghostflow/promote-candidate.ts'),
    join(process.cwd(), 'scripts/ghostflow/record-promotion-receipt.ts'),
  ];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const isWriter = file === writerPath;
    const isReceiptWriter = file === receiptWriterPath;
    const isPathSafety = file === pathSafetyPath || file === receiptPathSafetyPath;

    if (isWriter) {
      assert.ok(source.includes('writeFile'), 'writer.ts must use writeFile');
      assert.ok(source.includes('rename'), 'writer.ts must use rename');
      assert.ok(source.includes('unlink'), 'writer.ts may use unlink for temp cleanup only');
      assert.ok(
        !source.includes('unlink(resolvedDestination)') &&
          !source.includes('unlinkFn(resolvedDestination)') &&
          !/unlink(?:Fn)?\(\s*destination/i.test(source),
        'writer.ts must never unlink the production destination'
      );
      assert.ok(!source.includes('mkdir'), 'writer.ts must not create directories');
      assert.ok(!source.includes('rmSync'), 'writer.ts must not use rmSync');
      assert.ok(
        source.includes('resolvePromotionRegistryDestination'),
        'writer.ts must enforce authorized destination containment'
      );
      assert.ok(
        !source.includes('promotion-receipts'),
        'writer.ts must not write promotion receipts'
      );
    } else if (isReceiptWriter) {
      assert.ok(source.includes('writeFile'), 'receiptWriter.ts must use writeFile');
      assert.ok(source.includes('mkdir'), 'receiptWriter.ts may mkdir under receipt root');
      assert.ok(source.includes("flag: 'wx'") || source.includes('flag: "wx"'), 'receiptWriter.ts must exclusive-create');
      assert.ok(
        source.includes('resolvePromotionReceiptDestination'),
        'receiptWriter.ts must enforce authorized receipt destination containment'
      );
      assert.ok(!source.includes('rename'), 'receiptWriter.ts must not rename');
      assert.ok(!/\bunlink\b/.test(source), 'receiptWriter.ts must not unlink');
      assert.ok(
        !source.includes('applyGhostFlowCandidatePromotion'),
        'receiptWriter.ts must not invoke promotion apply'
      );
      assert.ok(
        !source.includes('data/ghostflow/artifacts'),
        'receiptWriter.ts must not target production artifacts paths'
      );
    } else {
      for (const primitive of WRITE_PRIMITIVES) {
        const re = new RegExp(`\\b${primitive}\\b`);
        assert.ok(
          !re.test(source),
          `${file} must not reference write-capable fs primitive ${primitive}`
        );
      }
      if (source.includes('node:fs') && !isPathSafety) {
        assert.ok(
          /import\s*\{\s*readFile\s*\}\s*from\s*['"]node:fs\/promises['"]/.test(source),
          `${file}: only readFile from node:fs/promises is allowed`
        );
      }
    }

    assert.ok(
      !source.includes('DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP'),
      `${basename(file)} must not import DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP`
    );
    assert.ok(
      !/from ['"][^'"]*operatorRunner['"]/.test(source),
      `${basename(file)} must not import operatorRunner`
    );
    assert.ok(!source.includes('node:http'), `${basename(file)} must not import node:http`);
    assert.ok(!source.includes('node:https'), `${basename(file)} must not import node:https`);
    assert.ok(!source.includes('child_process'), `${basename(file)} must not import child_process`);
    assert.ok(!/\bfetch\s*\(/.test(source), `${basename(file)} must not call fetch(`);
    assert.ok(!source.includes('axios'), `${basename(file)} must not import axios`);
  }

  // Supplemental registry drift guard — runtime containment remains authoritative.
  const repoRoot = process.cwd();
  for (const artifactId of GHOSTFLOW_CANDIDATE_ARTIFACT_IDS) {
    const entry = GHOSTFLOW_REFRESH_REGISTRY.find((item) => item.artifactId === artifactId);
    assert.ok(entry, `registry entry missing for ${artifactId}`);
    const resolved = resolvePromotionRegistryDestination({
      repoRoot,
      artifactPath: entry!.artifactPath,
    });
    assert.strictEqual(resolved.ok, true, `${artifactId} registry path must be promotion-safe`);
  }

  console.log('ghostflow/promotion/architecture.test.ts: ok');
}

main();
