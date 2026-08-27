/**
 * GhostFlow promotion receipt R2 writer — sole write-capable receipt module.
 *
 * Writes ONLY under data/ghostflow/promotion-receipts/.
 * Never mutates production artifacts. Never invokes --apply.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { GhostFlowRefreshIssue } from '../types';
import { resolvePromotionReceiptDestination } from './receiptPathSafety';
import type {
  GhostFlowPromotionReceiptOperationFailure,
  GhostFlowPromotionReceiptOperationResult,
  GhostFlowPromotionReceiptOperationSuccess,
  GhostFlowPromotionReceiptPlan,
  GhostFlowPromotionReceiptStatus,
  GhostFlowPromotionReceiptSummary,
} from './receiptTypes';
import { serializeGhostFlowPromotionReceipt } from './receiptTypes';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function writeFailure(
  status: Exclude<
    GhostFlowPromotionReceiptStatus,
    | 'promotion_receipt_plan_ok'
    | 'promotion_receipt_dry_run_ok'
    | 'promotion_receipt_written'
    | 'promotion_receipt_already_exists'
  >,
  exitCode: number,
  issues: GhostFlowRefreshIssue[],
  plan: GhostFlowPromotionReceiptPlan,
  write: boolean
): GhostFlowPromotionReceiptOperationFailure {
  return {
    ok: false,
    status,
    exitCode,
    issues,
    plan,
    summary: {
      status,
      artifactId: plan.receipt.artifactId,
      candidateIdentitySha256: plan.receipt.candidateIdentitySha256,
      candidateObservationAsOf: plan.receipt.candidateObservationAsOf,
      receiptPath: plan.receiptRelativePath,
      write,
      exitCode,
      issueCodes: issues.map((issue) => issue.code),
    },
  };
}

function writeSuccess(
  status: 'promotion_receipt_written' | 'promotion_receipt_already_exists',
  plan: GhostFlowPromotionReceiptPlan
): GhostFlowPromotionReceiptOperationSuccess {
  const summary: GhostFlowPromotionReceiptSummary = {
    status,
    artifactId: plan.receipt.artifactId,
    candidateIdentitySha256: plan.receipt.candidateIdentitySha256,
    candidateObservationAsOf: plan.receipt.candidateObservationAsOf,
    receiptPath: plan.receiptRelativePath,
    write: true,
    exitCode: 0,
  };
  return {
    ok: true,
    status,
    exitCode: 0,
    plan,
    summary,
    issues: [],
  };
}

export type GhostFlowPromotionReceiptWriterDeps = {
  /** Test seam only — defaults to node:fs/promises.mkdir */
  mkdir?: typeof mkdir;
  /** Test seam only — defaults to node:fs/promises.writeFile */
  writeFile?: typeof writeFile;
  /** Test seam only — defaults to node:fs/promises.readFile */
  readFile?: typeof readFile;
};

/**
 * Write a validated R1 receipt plan with exclusive create / idempotent retry.
 * Re-resolves destination from receipt identity fields before any mutation.
 */
export async function writeValidatedPromotionReceiptPlan(
  input: { repoRoot: string; plan: GhostFlowPromotionReceiptPlan },
  deps?: GhostFlowPromotionReceiptWriterDeps
): Promise<GhostFlowPromotionReceiptOperationResult> {
  const mkdirFn = deps?.mkdir ?? mkdir;
  const writeFileFn = deps?.writeFile ?? writeFile;
  const readFileFn = deps?.readFile ?? readFile;
  const plan = input.plan;
  const receipt = plan.receipt;

  const destination = resolvePromotionReceiptDestination({
    repoRoot: input.repoRoot,
    artifactId: receipt.artifactId,
    observationAsOf: receipt.candidateObservationAsOf,
    identityPrefix: receipt.candidateIdentityPrefix,
  });
  if (!destination.ok) {
    return writeFailure('promotion_receipt_destination_unsafe', 2, destination.issues, plan, true);
  }

  if (
    destination.value.relativePath !== plan.receiptRelativePath ||
    destination.value.absolutePath !== plan.receiptAbsolutePath
  ) {
    return writeFailure(
      'promotion_receipt_write_failed',
      1,
      [
        blockIssue(
          'promotion_receipt_destination_mismatch',
          'Plan receipt paths do not match re-resolved destination from receipt identity'
        ),
      ],
      plan,
      true
    );
  }

  const targetPath = destination.value.absolutePath;
  const plannedBytes = serializeGhostFlowPromotionReceipt(receipt);

  try {
    await mkdirFn(dirname(targetPath), { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return writeFailure(
      'promotion_receipt_write_failed',
      1,
      [
        blockIssue(
          'promotion_receipt_mkdir_failed',
          err.message ?? `Failed to create receipt directory for ${plan.receiptRelativePath}`
        ),
      ],
      plan,
      true
    );
  }

  try {
    await writeFileFn(targetPath, plannedBytes, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'EEXIST') {
      return writeFailure(
        'promotion_receipt_write_failed',
        1,
        [
          blockIssue(
            'promotion_receipt_write_failed',
            err.message ?? `Failed to write receipt: ${plan.receiptRelativePath}`
          ),
        ],
        plan,
        true
      );
    }

    let existingBytes: string;
    try {
      existingBytes = await readFileFn(targetPath, 'utf8');
    } catch (readError) {
      const readErr = readError as NodeJS.ErrnoException;
      return writeFailure(
        'promotion_receipt_write_failed',
        1,
        [
          blockIssue(
            'promotion_receipt_existing_unreadable',
            readErr.message ?? `Failed to read existing receipt: ${plan.receiptRelativePath}`
          ),
        ],
        plan,
        true
      );
    }

    if (existingBytes === plannedBytes) {
      return writeSuccess('promotion_receipt_already_exists', plan);
    }

    return writeFailure(
      'promotion_receipt_collision',
      6,
      [
        blockIssue(
          'promotion_receipt_collision',
          `Existing receipt differs from planned bytes at ${plan.receiptRelativePath}`
        ),
      ],
      plan,
      true
    );
  }

  let readback: string;
  try {
    readback = await readFileFn(targetPath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return writeFailure(
      'promotion_receipt_post_write_verification_failed',
      6,
      [
        blockIssue(
          'promotion_receipt_post_write_unreadable',
          err.message ?? `Failed to read back receipt: ${plan.receiptRelativePath}`
        ),
      ],
      plan,
      true
    );
  }

  if (readback !== plannedBytes) {
    return writeFailure(
      'promotion_receipt_post_write_verification_failed',
      6,
      [
        blockIssue(
          'promotion_receipt_post_write_bytes_mismatch',
          `Receipt readback bytes differ from planned bytes at ${plan.receiptRelativePath}`
        ),
      ],
      plan,
      true
    );
  }

  return writeSuccess('promotion_receipt_written', plan);
}
