import { isAbsolute, normalize, resolve, sep } from 'node:path';

export type GhostFlowPromoteCandidateCliOptions = {
  envelopePath: string;
  apply: boolean;
};

export type GhostFlowPromoteCandidateCliParseResult =
  | { ok: true; value: GhostFlowPromoteCandidateCliOptions }
  | { ok: false; error: string; code: string };

const REJECTED_FLAGS = new Set([
  '--artifact',
  '--latest',
  '--all',
  '--production-path',
  '--force',
  '--yes',
  '--skip-validation',
]);

/**
 * Resolve an explicit candidate envelope path beneath <repo>/tmp/ghostflow/.
 * Accepts relative or absolute paths when the resolved location stays inside the allowlist.
 */
export function resolvePromotionEnvelopePath(
  repoRoot: string,
  envelopePath: string
): { ok: true; absolutePath: string } | { ok: false; error: string; code: string } {
  if (!envelopePath || envelopePath.trim().length === 0) {
    return {
      ok: false,
      error: 'Missing value for --envelope',
      code: 'promotion_envelope_path_missing',
    };
  }

  if (envelopePath.includes('\0')) {
    return {
      ok: false,
      error: 'Envelope path contains invalid characters',
      code: 'promotion_envelope_path_unsafe',
    };
  }

  const allowedRoot = resolve(repoRoot, 'tmp', 'ghostflow');
  const candidate = isAbsolute(envelopePath)
    ? resolve(envelopePath)
    : resolve(repoRoot, envelopePath);
  const normalized = normalize(candidate);

  if (normalized !== allowedRoot && !normalized.startsWith(`${allowedRoot}${sep}`)) {
    return {
      ok: false,
      error: `Envelope path must resolve beneath ${allowedRoot}`,
      code: 'promotion_envelope_path_unsafe',
    };
  }

  if (!normalized.endsWith('.candidate.json')) {
    return {
      ok: false,
      error: 'Envelope path must end with .candidate.json',
      code: 'promotion_envelope_path_invalid',
    };
  }

  return { ok: true, absolutePath: normalized };
}

export function parsePromoteCandidateCliArgs(
  argv: readonly string[],
  repoRoot: string
): GhostFlowPromoteCandidateCliParseResult {
  let envelopePath: string | undefined;
  let apply = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--apply') {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        return {
          ok: false,
          error: '--apply takes no value',
          code: 'promotion_cli_argument_rejected',
        };
      }
      if (apply) {
        return {
          ok: false,
          error: 'Duplicate --apply is not allowed',
          code: 'promotion_cli_argument_rejected',
        };
      }
      apply = true;
      continue;
    }

    if (REJECTED_FLAGS.has(arg)) {
      return {
        ok: false,
        error: `Argument not supported: ${arg}`,
        code: 'promotion_cli_argument_rejected',
      };
    }

    if (arg === '--envelope') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        return {
          ok: false,
          error: 'Missing value for --envelope',
          code: 'promotion_envelope_path_missing',
        };
      }
      if (envelopePath !== undefined) {
        return {
          ok: false,
          error: 'Only one --envelope selection is allowed',
          code: 'promotion_cli_argument_rejected',
        };
      }
      envelopePath = value;
      i += 1;
      continue;
    }

    return {
      ok: false,
      error: `Unknown argument: ${arg}`,
      code: 'promotion_cli_argument_rejected',
    };
  }

  if (!envelopePath) {
    return {
      ok: false,
      error: 'Missing required --envelope',
      code: 'promotion_envelope_path_missing',
    };
  }

  const resolved = resolvePromotionEnvelopePath(repoRoot, envelopePath);
  if (!resolved.ok) {
    return resolved;
  }

  return {
    ok: true,
    value: { envelopePath: resolved.absolutePath, apply },
  };
}

export function promoteCandidateCliUsage(): string {
  return `Usage:
  npm run ghostflow:promote-candidate -- --envelope <path>
  npm run ghostflow:promote-candidate -- --envelope <path> --apply

Dry-run is the default. --apply writes exactly one registry-owned production artifact.
Envelope path must resolve beneath <repo>/tmp/ghostflow/ and end with .candidate.json.
`;
}
