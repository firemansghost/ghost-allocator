/**
 * GET /api/ghostregime/health
 * Health monitoring endpoint for GhostRegime
 * Returns health status, latest row, and freshness information
 */

import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/ghostregime/persistence';
import { MODEL_VERSION } from '@/lib/ghostregime/config';
import { formatISO, parseISO, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthResponse {
  ok: boolean;
  status: 'OK' | 'WARN' | 'NOT_READY';
  service: 'ghostregime';
  checked_at_utc: string;
  engine_version: string;
  build_commit: string;
  latest?: any; // GhostRegimeRow
  freshness?: {
    latest_date: string;
    age_days: number;
    max_age_days: number;
    is_fresh: boolean;
  };
  error?: string;
  message?: string;
}

export async function GET(request: Request) {
  const checkedAt = new Date();
  const buildCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_COMMIT || 'unknown';

  try {
    const storage = getStorageAdapter();
    const latest = await storage.readLatest();

    if (!latest) {
      // No persisted latest row - system not ready
      const response: HealthResponse = {
        ok: false,
        status: 'NOT_READY',
        service: 'ghostregime',
        checked_at_utc: formatISO(checkedAt),
        engine_version: MODEL_VERSION,
        build_commit: buildCommit,
        error: 'GHOSTREGIME_NOT_READY',
        message: 'No persisted latest row available yet',
      };

      return NextResponse.json(response, {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Calculate freshness
    const latestDate = parseISO(latest.date);
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const latestDateUtc = new Date(latestDate);
    latestDateUtc.setUTCHours(0, 0, 0, 0);
    
    const ageDays = differenceInDays(todayUtc, latestDateUtc);
    const maxAgeDays = 4;
    const isFresh = ageDays <= maxAgeDays;
    const status: 'OK' | 'WARN' = isFresh ? 'OK' : 'WARN';

    const response: HealthResponse = {
      ok: true,
      status,
      service: 'ghostregime',
      checked_at_utc: formatISO(checkedAt),
      engine_version: MODEL_VERSION,
      build_commit: buildCommit,
      latest,
      freshness: {
        latest_date: latest.date,
        age_days: ageDays,
        max_age_days: maxAgeDays,
        is_fresh: isFresh,
      },
    };

    // Return 200 even if WARN (service is up, just data is old)
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/ghostregime/health:', error);
    
    const response: HealthResponse = {
      ok: false,
      status: 'NOT_READY',
      service: 'ghostregime',
      checked_at_utc: formatISO(checkedAt),
      engine_version: MODEL_VERSION,
      build_commit: buildCommit,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}

