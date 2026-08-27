/**
 * GhostFlow candidate promotion CLI — C1 dry-run only.
 * Validates and plans promotion; never writes production artifacts.
 * --apply is intentionally unavailable until C2.
 */

import { dryRunGhostFlowCandidatePromotion } from '../../lib/ghostflow/refresh/promotion/plan';
import {
  parsePromoteCandidateCliArgs,
  promoteCandidateCliUsage,
} from '../../lib/ghostflow/refresh/promotion/cliArgs';

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const parsed = parsePromoteCandidateCliArgs(process.argv.slice(2), repoRoot);
  if (!parsed.ok) {
    console.log(
      JSON.stringify({
        status:
          parsed.code === 'promotion_apply_not_available'
            ? 'promotion_apply_not_available'
            : 'promotion_envelope_invalid',
        apply: false,
        exitCode: 1,
        issueCodes: [parsed.code],
        error: parsed.error,
      })
    );
    console.error(parsed.error);
    console.error(promoteCandidateCliUsage());
    process.exit(1);
  }

  const result = await dryRunGhostFlowCandidatePromotion({
    repoRoot,
    envelopePath: parsed.value.envelopePath,
  });

  console.log(JSON.stringify(result.summary));
  process.exit(result.exitCode);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ghostflow:promote-candidate failed: ${message}`);
  process.exit(1);
});
