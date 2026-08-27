import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateGhostFlowCandidate } from '@/lib/ghostflow/refresh/candidates/generator';
import { sha256HexFromCanonicalJson } from '@/lib/ghostflow/refresh/candidates/canonicalJson';
import { validateProposedProductionArtifact } from '@/lib/ghostflow/refresh/candidates/artifactValidation';
import type { GhostFlowCandidateEnvelope } from '@/lib/ghostflow/refresh/candidates/types';
import { dryRunGhostFlowCandidatePromotion } from '@/lib/ghostflow/refresh/promotion/plan';
import { resolvePromotionRegistryDestination } from '@/lib/ghostflow/refresh/promotion/pathSafety';
import {
  applyGhostFlowCandidatePromotion,
  writeValidatedPromotionPlan,
} from '@/lib/ghostflow/refresh/promotion/writer';
import { fixtureSystematicNormalized } from '../fixtures/candidateMapperFixtures';

const ARTIFACTS = [
  'systematicFlowProxy.v1.json',
  'treasuryFuturesPositioningProxy.v1.json',
  'treasuryLongEndIncomeLens.v1.json',
] as const;

function loadTracked(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/ghostflow/artifacts', name), 'utf8')
  ) as unknown;
}

function assertPathSafety(): void {
  const repoRoot = process.cwd();

  for (const relative of [
    join('data', 'ghostflow', 'artifacts', 'systematicFlowProxy.v1.json'),
    join('data', 'ghostflow', 'artifacts', 'treasuryFuturesPositioningProxy.v1.json'),
    join('data', 'ghostflow', 'artifacts', 'treasuryLongEndIncomeLens.v1.json'),
  ]) {
    const ok = resolvePromotionRegistryDestination({ repoRoot, artifactPath: relative });
    assert.strictEqual(ok.ok, true, relative);
  }

  const traversal = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: join('data', 'ghostflow', 'artifacts', '..', '..', '..', 'outside.json'),
  });
  assert.strictEqual(traversal.ok, false);
  if (!traversal.ok) {
    assert.ok(traversal.issues.some((issue) => issue.code === 'promotion_destination_unsafe'));
  }

  const externalRelative = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: join('..', 'outside.json'),
  });
  assert.strictEqual(externalRelative.ok, false);

  const historySibling = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: join('data', 'ghostflow', 'history', 'foo.json'),
  });
  assert.strictEqual(historySibling.ok, false);

  const docsPath = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: join('docs', 'foo.json'),
  });
  assert.strictEqual(docsPath.ok, false);

  const absoluteExternal = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: resolve(repoRoot, '..', 'outside-absolute.json'),
  });
  assert.strictEqual(absoluteExternal.ok, false);

  const rootAsFile = resolvePromotionRegistryDestination({
    repoRoot,
    artifactPath: join('data', 'ghostflow', 'artifacts'),
  });
  assert.strictEqual(rootAsFile.ok, false);
}

async function buildReadySystematicEnvelope(): Promise<GhostFlowCandidateEnvelope> {
  const normalized = fixtureSystematicNormalized();
  normalized.observationAsOf = '2026-08-18';
  normalized.provenance.observationAsOf = '2026-08-18';
  for (const contract of normalized.fields.scoreContracts) {
    contract.observations.reportDate = '2026-08-18';
  }
  normalized.fields.vixContext.observations.reportDate = '2026-08-18';

  const generated = await generateGhostFlowCandidate({
    artifactId: 'systematicFlowProxy',
    nowIso: '2026-08-26T22:00:00.000Z',
    currentProductionRaw: loadTracked('systematicFlowProxy.v1.json'),
    injectNormalized: normalized,
  });
  assert.strictEqual(generated.ok, true);
  if (!generated.ok || !generated.envelope) throw new Error('unreachable');
  return generated.envelope;
}

async function setupTempRepo(root: string): Promise<{
  envelopePath: string;
  systematicPath: string;
  envelopeBytes: string;
  beforeByName: Record<string, string>;
}> {
  await mkdir(join(root, 'data', 'ghostflow', 'artifacts'), { recursive: true });
  await mkdir(join(root, 'tmp', 'ghostflow', 'candidates'), { recursive: true });

  const beforeByName: Record<string, string> = {};
  for (const name of ARTIFACTS) {
    const bytes = `${JSON.stringify(loadTracked(name), null, 2)}\n`;
    beforeByName[name] = bytes;
    await writeFile(join(root, 'data', 'ghostflow', 'artifacts', name), bytes, 'utf8');
  }

  const envelope = await buildReadySystematicEnvelope();
  const relative = 'data/ghostflow/artifacts/systematicFlowProxy.v1.json';
  const envelopeWithPath: GhostFlowCandidateEnvelope = {
    ...envelope,
    currentProduction: {
      ...envelope.currentProduction,
      artifactPath: relative,
    },
  };
  const envelopePath = join(
    root,
    'tmp',
    'ghostflow',
    'candidates',
    `${envelope.artifactId}.${envelope.normalizedObservation.observationAsOf}.${envelope.candidateIdentity.identityPrefix}.candidate.json`
  );
  const envelopeBytes = `${JSON.stringify(envelopeWithPath, null, 2)}\n`;
  await writeFile(envelopePath, envelopeBytes, 'utf8');

  return {
    envelopePath,
    systematicPath: join(root, relative),
    envelopeBytes,
    beforeByName,
  };
}

async function main(): Promise<void> {
  assertPathSafety();

  const repoRoot = process.cwd();
  const tempRoot = join(repoRoot, 'tmp', 'ghostflow', `promotion-writer-${Date.now()}`);
  await mkdir(tempRoot, { recursive: true });

  try {
    const setup = await setupTempRepo(tempRoot);

    // Dry-run regression: zero production mutation, no temp siblings
    const beforeDry = await readFile(setup.systematicPath, 'utf8');
    const dry = await dryRunGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath: setup.envelopePath,
    });
    assert.strictEqual(dry.ok, true);
    assert.strictEqual(dry.status, 'promotion_dry_run_ok');
    assert.strictEqual(dry.summary.apply, false);
    assert.strictEqual(await readFile(setup.systematicPath, 'utf8'), beforeDry);
    const artifactDirListing = await readdir(join(tempRoot, 'data', 'ghostflow', 'artifacts'));
    assert.ok(artifactDirListing.every((name) => !name.includes('.promotion-')));

    // Successful apply via public API
    const applied = await applyGhostFlowCandidatePromotion({
      repoRoot: tempRoot,
      envelopePath: setup.envelopePath,
    });
    assert.strictEqual(applied.ok, true);
    assert.strictEqual(applied.status, 'promotion_applied');
    assert.strictEqual(applied.exitCode, 0);
    assert.strictEqual(applied.summary.apply, true);

    const afterSelected = await readFile(setup.systematicPath, 'utf8');
    assert.notStrictEqual(afterSelected, setup.beforeByName['systematicFlowProxy.v1.json']);
    const parsed = JSON.parse(afterSelected) as unknown;
    const validated = validateProposedProductionArtifact('systematicFlowProxy', parsed);
    assert.strictEqual(validated.ok, true);
    if (!validated.ok) throw new Error('unreachable');
    assert.strictEqual(
      validated.value.promotionPayloadSha256,
      applied.plan.proposedPromotionPayloadSha256
    );
    assert.strictEqual(validated.value.observationAsOf, applied.plan.candidateObservationAsOf);

    // Exactly one artifact changed
    for (const name of ARTIFACTS) {
      const bytes = await readFile(join(tempRoot, 'data', 'ghostflow', 'artifacts', name), 'utf8');
      if (name === 'systematicFlowProxy.v1.json') {
        assert.notStrictEqual(bytes, setup.beforeByName[name]);
      } else {
        assert.strictEqual(bytes, setup.beforeByName[name]);
      }
    }

    // Envelope unchanged; no leftover temp siblings
    assert.strictEqual(await readFile(setup.envelopePath, 'utf8'), setup.envelopeBytes);
    const afterListing = await readdir(join(tempRoot, 'data', 'ghostflow', 'artifacts'));
    assert.ok(afterListing.every((name) => !name.includes('.promotion-')));
    assert.ok(!afterListing.some((name) => name.endsWith('.bak') || name.endsWith('.backup')));

    // Commit-point stale re-lock: change production after plan, before writer
    const setup2Root = join(tempRoot, 'stale-case');
    await mkdir(setup2Root, { recursive: true });
    const setup2 = await setupTempRepo(setup2Root);
    const dry2 = await dryRunGhostFlowCandidatePromotion({
      repoRoot: setup2Root,
      envelopePath: setup2.envelopePath,
    });
    assert.strictEqual(dry2.ok, true);
    if (!dry2.ok) throw new Error('unreachable');

    const changedCurrent = {
      ...(loadTracked('systematicFlowProxy.v1.json') as object),
      publishedAt: '2099-01-01',
    };
    const changedBytes = `${JSON.stringify(changedCurrent, null, 2)}\n`;
    await writeFile(setup2.systematicPath, changedBytes, 'utf8');
    const staleWrite = await writeValidatedPromotionPlan({
      repoRoot: setup2Root,
      plan: dry2.plan,
    });
    assert.strictEqual(staleWrite.ok, false);
    if (!staleWrite.ok) {
      assert.strictEqual(staleWrite.status, 'promotion_stale_current_production');
      assert.strictEqual(staleWrite.exitCode, 3);
    }
    assert.strictEqual(await readFile(setup2.systematicPath, 'utf8'), changedBytes);
    const staleListing = await readdir(join(setup2Root, 'data', 'ghostflow', 'artifacts'));
    assert.ok(staleListing.every((name) => !name.includes('.promotion-')));

    // Tampered plan proposed payload
    const setup3Root = join(tempRoot, 'tamper-case');
    await mkdir(setup3Root, { recursive: true });
    const setup3 = await setupTempRepo(setup3Root);
    const dry3 = await dryRunGhostFlowCandidatePromotion({
      repoRoot: setup3Root,
      envelopePath: setup3.envelopePath,
    });
    assert.strictEqual(dry3.ok, true);
    if (!dry3.ok) throw new Error('unreachable');
    const tamperedPlan = {
      ...dry3.plan,
      proposedPromotionPayloadSha256: '0'.repeat(64),
    };
    const tampered = await writeValidatedPromotionPlan({
      repoRoot: setup3Root,
      plan: tamperedPlan,
    });
    assert.strictEqual(tampered.ok, false);
    if (!tampered.ok) {
      assert.strictEqual(tampered.exitCode, 5);
    }
    assert.strictEqual(
      await readFile(setup3.systematicPath, 'utf8'),
      setup3.beforeByName['systematicFlowProxy.v1.json']
    );

    // Temp prevalidation failure via writeFile that writes corrupt bytes
    const setup4Root = join(tempRoot, 'temp-fail');
    await mkdir(setup4Root, { recursive: true });
    const setup4 = await setupTempRepo(setup4Root);
    const dry4 = await dryRunGhostFlowCandidatePromotion({
      repoRoot: setup4Root,
      envelopePath: setup4.envelopePath,
    });
    assert.strictEqual(dry4.ok, true);
    if (!dry4.ok) throw new Error('unreachable');
    const tempFail = await writeValidatedPromotionPlan(
      { repoRoot: setup4Root, plan: dry4.plan },
      {
        writeFile: async (path, _data, options) => {
          await writeFile(path, '{ "bad": true }\n', options);
        },
      }
    );
    assert.strictEqual(tempFail.ok, false);
    if (!tempFail.ok) {
      assert.strictEqual(tempFail.exitCode, 5);
    }
    assert.strictEqual(
      await readFile(setup4.systematicPath, 'utf8'),
      setup4.beforeByName['systematicFlowProxy.v1.json']
    );
    const tempFailListing = await readdir(join(setup4Root, 'data', 'ghostflow', 'artifacts'));
    assert.ok(tempFailListing.every((name) => !name.includes('.promotion-')));

    // Rename failure — no unlink(destination) fallback
    const setup5Root = join(tempRoot, 'rename-fail');
    await mkdir(setup5Root, { recursive: true });
    const setup5 = await setupTempRepo(setup5Root);
    const dry5 = await dryRunGhostFlowCandidatePromotion({
      repoRoot: setup5Root,
      envelopePath: setup5.envelopePath,
    });
    assert.strictEqual(dry5.ok, true);
    if (!dry5.ok) throw new Error('unreachable');
    const beforeRename = await readFile(setup5.systematicPath, 'utf8');
    const renameFail = await writeValidatedPromotionPlan(
      { repoRoot: setup5Root, plan: dry5.plan },
      {
        rename: async () => {
          const err = new Error('simulated rename failure') as NodeJS.ErrnoException;
          err.code = 'EPERM';
          throw err;
        },
      }
    );
    assert.strictEqual(renameFail.ok, false);
    if (!renameFail.ok) {
      assert.strictEqual(renameFail.status, 'promotion_write_failed');
      assert.strictEqual(renameFail.exitCode, 1);
    }
    assert.strictEqual(await readFile(setup5.systematicPath, 'utf8'), beforeRename);
    const renameFailListing = await readdir(join(setup5Root, 'data', 'ghostflow', 'artifacts'));
    assert.ok(renameFailListing.every((name) => !name.includes('.promotion-')));

    // Post-write verification failure
    const setup6Root = join(tempRoot, 'post-fail');
    await mkdir(setup6Root, { recursive: true });
    const setup6 = await setupTempRepo(setup6Root);
    const dry6 = await dryRunGhostFlowCandidatePromotion({
      repoRoot: setup6Root,
      envelopePath: setup6.envelopePath,
    });
    assert.strictEqual(dry6.ok, true);
    if (!dry6.ok) throw new Error('unreachable');
    const postFail = await writeValidatedPromotionPlan(
      { repoRoot: setup6Root, plan: dry6.plan },
      {
        readDestinationAfterRename: async () => '{ "corrupt": true }\n',
      }
    );
    assert.strictEqual(postFail.ok, false);
    if (!postFail.ok) {
      assert.strictEqual(postFail.status, 'promotion_post_write_verification_failed');
      assert.strictEqual(postFail.exitCode, 6);
    }

    // Hash sanity for success path payload
    const successHash = sha256HexFromCanonicalJson(validated.value.artifact);
    assert.ok(successHash.ok);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }

  console.log('ghostflow/promotion/writer.test.ts: ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
