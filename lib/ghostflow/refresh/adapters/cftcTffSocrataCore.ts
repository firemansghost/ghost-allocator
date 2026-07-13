/**
 * CFTC TFF Socrata — shared source-family primitives.
 * Transport, decoding, hashing, and cell parsing only.
 * No artifact adapters, registry, scoring, or network at import.
 */

import { createHash } from 'crypto';
import { isValidCalendarDate } from '../dateValidation';

export interface CftcTffFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  bytes: Uint8Array;
}

export type CftcTffFetchClient = (url: string) => Promise<CftcTffFetchResponse>;

export interface CftcTffIntegerParseOptions {
  allowNegative: boolean;
  requirePositive: boolean;
}

/** GET-only unauthenticated Socrata client. Does not run on import. */
export async function defaultCftcTffFetchClient(
  url: string
): Promise<CftcTffFetchResponse> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
    cache: 'no-store',
  });
  const buffer = new Uint8Array(await response.arrayBuffer());
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type') ?? undefined,
    bytes: buffer,
  };
}

/** Exact-byte SHA-256 as lowercase 64-character hex. */
export function cftcTffSha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Fatal UTF-8 decode.
 * Returns the decoded text, or null on decode failure (caller maps to issues).
 */
export function decodeCftcTffUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Accept application/json or text/json (optional charset).
 * Missing or blank content type remains accepted.
 */
export function isCftcTffJsonContentType(contentType: string | undefined): boolean {
  if (contentType === undefined || contentType.trim() === '') return true;
  const primary = contentType.split(';')[0]!.trim().toLowerCase();
  return primary === 'application/json' || primary === 'text/json';
}

export function isCftcTffPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cftcTffCellAsTrimmedString(raw: unknown): string | null {
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return null;
}

/**
 * Convert observed Socrata report_date_as_yyyy_mm_dd to YYYY-MM-DD.
 * Accepts only: `YYYY-MM-DDT00:00:00.000` (after trim).
 */
export function parseCftcTffReportDateCell(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T00:00:00\.000$/.exec(raw.trim());
  if (!match) return null;
  const reportDate = match[1]!;
  return isValidCalendarDate(reportDate) ? reportDate : null;
}

export function parseCftcTffIntegerCell(
  raw: unknown,
  opts: CftcTffIntegerParseOptions
): number | null {
  const text = cftcTffCellAsTrimmedString(raw);
  if (text === null || text === '') return null;
  if (opts.allowNegative) {
    if (!/^-?\d+$/.test(text)) return null;
  } else if (!/^\d+$/.test(text)) {
    return null;
  }
  const n = Number(text);
  if (!Number.isInteger(n) || !Number.isFinite(n)) return null;
  if (opts.requirePositive && n <= 0) return null;
  if (!opts.allowNegative && n < 0) return null;
  return n;
}

export function parseCftcTffPercentCell(raw: unknown): number | null {
  const text = cftcTffCellAsTrimmedString(raw);
  if (text === null || text === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}
