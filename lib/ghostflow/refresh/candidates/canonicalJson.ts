import { createHash } from 'node:crypto';
import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function fail(message: string): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue('candidate_canonical_json_invalid', message)] };
}

function canonicalizeValue(value: unknown): GhostFlowStageResult<unknown> {
  if (value === null) {
    return { ok: true, value: null, issues: [] };
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'boolean') {
    return { ok: true, value, issues: [] };
  }

  if (valueType === 'number') {
    if (!Number.isFinite(value as number)) {
      return fail('Non-finite numbers are not supported in canonical JSON');
    }
    return { ok: true, value, issues: [] };
  }

  if (valueType === 'bigint' || valueType === 'function' || valueType === 'symbol') {
    return fail(`Unsupported value type for canonical JSON: ${valueType}`);
  }

  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (let i = 0; i < value.length; i += 1) {
      const item = canonicalizeValue(value[i]);
      if (!item.ok) {
        return item;
      }
      items.push(item.value);
    }
    return { ok: true, value: items, issues: [] };
  }

  if (valueType === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const canonical: Record<string, unknown> = {};
    for (const key of keys) {
      const fieldValue = record[key];
      if (fieldValue === undefined) {
        continue;
      }
      const canonicalField = canonicalizeValue(fieldValue);
      if (!canonicalField.ok) {
        return canonicalField;
      }
      canonical[key] = canonicalField.value;
    }
    return { ok: true, value: canonical, issues: [] };
  }

  return fail(`Unsupported value type for canonical JSON: ${valueType}`);
}

export function canonicalJsonStringify(value: unknown): GhostFlowStageResult<string> {
  const canonical = canonicalizeValue(value);
  if (!canonical.ok) {
    return canonical;
  }
  return { ok: true, value: JSON.stringify(canonical.value), issues: [] };
}

export function sha256HexFromCanonicalJson(value: unknown): GhostFlowStageResult<string> {
  const canonicalJson = canonicalJsonStringify(value);
  if (!canonicalJson.ok) {
    return canonicalJson;
  }
  const digest = createHash('sha256').update(canonicalJson.value, 'utf8').digest('hex');
  return { ok: true, value: digest, issues: [] };
}
