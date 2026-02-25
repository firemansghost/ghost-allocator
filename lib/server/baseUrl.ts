/**
 * Resolve base URL for server-side fetch using request headers.
 * Prefers x-forwarded-host / x-forwarded-proto (proxies, Vercel).
 * No new env vars; falls back to NEXT_PUBLIC_SITE_URL or localhost.
 */

import { headers } from 'next/headers';

export async function getServerBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
