/**
 * GhostFlow promotion receipt CLI (R2).
 * Dry-run by default; explicit --write creates one receipt sidecar.
 * Never writes production artifacts.
 */

import {
  parseRecordPromotionReceiptCliArgs,
  recordPromotionReceiptCliUsage,
} from '../../lib/ghostflow/refresh/promotion/receiptCliArgs';
import { recordGhostFlowPromotionReceipt } from '../../lib/ghostflow/refresh/promotion/receiptOperation';

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const parsed = parseRecordPromotionReceiptCliArgs(process.argv.slice(2), repoRoot);
  if (!parsed.ok) {
    console.log(
      JSON.stringify({
        status: 'promotion_receipt_envelope_invalid',
        write: false,
        exitCode: 1,
        issueCodes: [parsed.code],
        error: parsed.error,
      })
    );
    console.error(parsed.error);
    console.error(recordPromotionReceiptCliUsage());
    process.exit(1);
  }

  const result = await recordGhostFlowPromotionReceipt({
    repoRoot,
    envelopePath: parsed.value.envelopePath,
    write: parsed.value.write,
  });
  console.log(JSON.stringify(result.summary));
  process.exit(result.exitCode);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ghostflow:record-promotion-receipt failed: ${message}`);
  process.exit(1);
});
