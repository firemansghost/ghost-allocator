import { resolvePromotionEnvelopePath } from './cliArgs';

export type GhostFlowRecordPromotionReceiptCliOptions = {
  envelopePath: string;
  write: boolean;
};

export type GhostFlowRecordPromotionReceiptCliParseResult =
  | { ok: true; value: GhostFlowRecordPromotionReceiptCliOptions }
  | { ok: false; error: string; code: string };

const REJECTED_FLAGS = new Set([
  '--artifact',
  '--latest',
  '--all',
  '--production-path',
  '--force',
  '--yes',
  '--skip-validation',
  '--apply',
]);

/**
 * Parse receipt CLI argv. Dry-run is default; writes require explicit --write.
 * Reuses the same explicit envelope path allowlist as promotion.
 */
export function parseRecordPromotionReceiptCliArgs(
  argv: readonly string[],
  repoRoot: string
): GhostFlowRecordPromotionReceiptCliParseResult {
  let envelopePath: string | undefined;
  let write = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--write') {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        return {
          ok: false,
          error: '--write takes no value',
          code: 'promotion_receipt_cli_argument_rejected',
        };
      }
      if (write) {
        return {
          ok: false,
          error: 'Duplicate --write is not allowed',
          code: 'promotion_receipt_cli_argument_rejected',
        };
      }
      write = true;
      continue;
    }

    if (REJECTED_FLAGS.has(arg)) {
      return {
        ok: false,
        error: `Argument not supported: ${arg}`,
        code: 'promotion_receipt_cli_argument_rejected',
      };
    }

    if (arg === '--envelope') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return {
          ok: false,
          error: 'Missing value for --envelope',
          code: 'promotion_receipt_envelope_path_missing',
        };
      }
      if (envelopePath !== undefined) {
        return {
          ok: false,
          error: 'Only one --envelope selection is allowed',
          code: 'promotion_receipt_cli_argument_rejected',
        };
      }
      envelopePath = value;
      i += 1;
      continue;
    }

    return {
      ok: false,
      error: `Unknown argument: ${arg}`,
      code: 'promotion_receipt_cli_argument_rejected',
    };
  }

  if (!envelopePath) {
    return {
      ok: false,
      error: 'Missing required --envelope',
      code: 'promotion_receipt_envelope_path_missing',
    };
  }

  const resolved = resolvePromotionEnvelopePath(repoRoot, envelopePath);
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      code:
        resolved.code === 'promotion_envelope_path_missing'
          ? 'promotion_receipt_envelope_path_missing'
          : resolved.code === 'promotion_envelope_path_invalid'
            ? 'promotion_receipt_envelope_path_invalid'
            : 'promotion_receipt_envelope_path_unsafe',
    };
  }

  return {
    ok: true,
    value: { envelopePath: resolved.absolutePath, write },
  };
}

export function recordPromotionReceiptCliUsage(): string {
  return `Usage:
  npm run ghostflow:record-promotion-receipt -- --envelope <path>
  npm run ghostflow:record-promotion-receipt -- --envelope <path> --write

Dry-run is the default. --write creates one promotion-receipt sidecar under
data/ghostflow/promotion-receipts/. Never writes production artifacts.
Envelope path must resolve beneath <repo>/tmp/ghostflow/ and end with .candidate.json.
`;
}
