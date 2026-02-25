/**
 * GhostRegime Main Page (Server)
 * Fetches health + today server-side for immediate first paint, then hydrates client.
 */

import { Suspense } from 'react';
import { GhostRegimeClient, type HealthStatus } from './GhostRegimeClient';
import { getServerBaseUrl } from '@/lib/server/baseUrl';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';

export const metadata: Metadata = buildMetadata({
  title: 'GhostRegime - Ghost Allocator',
  description:
    'Market regime classification and allocation system. Rules-based signals for adjusting portfolio exposure.',
  path: '/ghostregime',
});

const FETCH_OPTIONS = { next: { revalidate: 60 } } as RequestInit;

export default async function GhostRegimePage() {
  const baseUrl = await getServerBaseUrl();

  let initialHealth: HealthStatus | null = null;
  let initialToday: GhostRegimeRow | null = null;
  let initialNotSeeded = false;
  let initialError: string | null = null;

  try {
    const [healthRes, todayRes] = await Promise.all([
      fetch(`${baseUrl}/api/ghostregime/health`, FETCH_OPTIONS),
      fetch(`${baseUrl}/api/ghostregime/today`, FETCH_OPTIONS),
    ]);

    if (healthRes.ok) {
      initialHealth = await healthRes.json();
    }

    if (todayRes.status === 503) {
      const json = await todayRes.json();
      if (json.error === 'GHOSTREGIME_NOT_SEEDED') {
        initialNotSeeded = true;
      } else if (json.error === 'GHOSTREGIME_NOT_READY') {
        initialError = 'Insufficient market data to compute regime. Please try again later.';
      } else {
        initialError = json.message || 'Unknown error';
      }
    } else if (todayRes.ok) {
      initialToday = await todayRes.json();
    } else {
      initialError = `HTTP ${todayRes.status}`;
    }
  } catch (err) {
    initialError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
            <p className="text-sm text-zinc-300">Loading...</p>
          </header>
        </div>
      }
    >
      <GhostRegimeClient
        initialHealth={initialHealth}
        initialToday={initialToday}
        initialNotSeeded={initialNotSeeded}
        initialError={initialError}
      />
    </Suspense>
  );
}
