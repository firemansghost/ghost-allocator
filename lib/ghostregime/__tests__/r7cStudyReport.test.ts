import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CANDIDATE_IDS } from '../../../scripts/ghostregime/research/study-contract';
import {
  orderedPrimary,
  writeInvalidReceipt,
  writeValidBundle,
} from '../../../scripts/ghostregime/research/study-report';
import type { ScenarioResult } from '../../../scripts/ghostregime/research/study-engine';

function emptyBundle(id: string) {
  return {
    scenario: {
      scenarioId: id,
      family: 'primary' as const,
      candidateId: id,
      benchmarkId: null,
      ablation: 'COMBINED' as const,
      costBps: 0,
      cashPolicy: 'BIL_ADJUSTED' as const,
      noBtcPolicy: 'none' as const,
      rebalanceMode: 'event' as const,
      staticSchedule: 'none' as const,
    },
  };
}

describe('R7C study report guards', () => {
  it('keeps primary tables in P0–P6 order', () => {
    const shuffled = [...CANDIDATE_IDS].reverse().map((id) => emptyBundle(id) as unknown as ScenarioResult);
    const ordered = orderedPrimary(shuffled);
    assert.deepStrictEqual(
      ordered.map((row) => row.scenario.candidateId),
      [...CANDIDATE_IDS]
    );
  });

  it('does not write a VALID receipt when the run is invalid', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r7c-invalid-'));
    try {
      writeInvalidReceipt(dir, { study: 'GhostRegime R7C', status: 'INVALID' });
      const receipt = JSON.parse(readFileSync(join(dir, 'RUN_RECEIPT.json'), 'utf8')) as { status: string };
      assert.strictEqual(receipt.status, 'INVALID');
      assert.ok(!existsSync(join(dir, 'PRIMARY_FULL.csv')));
      assert.ok(!existsSync(join(dir, 'HASHES.sha256')));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes hashes only after a valid bundle', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r7c-valid-'));
    try {
      const written = writeValidBundle({
        dir,
        files: { 'PRIMARY_FULL.csv': 'id\nP0_CURRENT\n' },
        receipt: { study: 'GhostRegime R7C', status: 'VALID' },
      });
      assert.ok(written.receiptSha256);
      const receipt = JSON.parse(readFileSync(join(dir, 'RUN_RECEIPT.json'), 'utf8')) as {
        status: string;
        output_file_hashes: Record<string, string>;
      };
      assert.strictEqual(receipt.status, 'VALID');
      assert.ok(receipt.output_file_hashes['PRIMARY_FULL.csv']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
