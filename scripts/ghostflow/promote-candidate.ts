/**
 * GhostFlow candidate promotion CLI.
 * Dry-run by default; explicit --apply writes one registry-owned production artifact.
 */

import {
  parsePromoteCandidateCliArgs,
  promoteCandidateCliUsage,
} from '../../lib/ghostflow/refresh/promotion/cliArgs';
import { dryRunGhostFlowCandidatePromotion } from '../../lib/ghostflow/refresh/promotion/plan';
import { applyGhostFlowCandidatePromotion } from '../../lib/ghostflow/refresh/promotion/writer';

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const parsed = parsePromoteCandidateCliArgs(process.argv.slice(2), repoRoot);
  if (!parsed.ok) {
    console.log(
      JSON.stringify({
        status: 'promotion_envelope_invalid',
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

  if (parsed.value.apply) {
    const result = await applyGhostFlowCandidatePromotion({
      repoRoot,
      envelopePath: parsed.value.envelopePath,
    });
    console.log(JSON.stringify(result.summary));
    process.exit(result.exitCode);
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
