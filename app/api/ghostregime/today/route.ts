/**
 * GET /api/ghostregime/today
 * Returns today's GhostRegime data
 */

import { NextResponse } from 'next/server';
import { getGhostRegimeToday } from '@/lib/ghostregime/engine';
import { checkSeedStatus } from '@/lib/ghostregime/seedStatus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isTruthyParam(value: string | null): boolean {
  const v = value?.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugParam = searchParams.get('debug')?.toLowerCase();
  const debug = debugParam === '1' || debugParam === 'true' || debugParam === 'yes';

  const forceParam = searchParams.get('force')?.toLowerCase();
  const force = forceParam === '1' || forceParam === 'true' || forceParam === 'yes';

  const refreshParam = searchParams.get('refresh')?.toLowerCase();
  const scheduledRefresh =
    refreshParam === 'scheduled' || isTruthyParam(searchParams.get('refresh'));

  if (force && scheduledRefresh) {
    return NextResponse.json(
      {
        error: 'BAD_REQUEST',
        message: 'force and refresh=scheduled cannot be used together',
      },
      { status: 400 }
    );
  }

  const needsCronSecret = force || scheduledRefresh;
  if (needsCronSecret) {
    const cronSecret = process.env.GHOSTREGIME_CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'force/scheduled refresh requires GHOSTREGIME_CRON_SECRET to be configured',
        },
        { status: 401 }
      );
    }

    const headerSecret = request.headers.get('x-ghostregime-cron');
    const querySecret = searchParams.get('cron_secret');
    const providedSecret = headerSecret || querySecret;

    if (!providedSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'force/scheduled refresh requires valid cron secret',
        },
        { status: 401 }
      );
    }
  }

  const seedStatus = checkSeedStatus();
  if (!seedStatus.exists || seedStatus.isEmpty) {
    return NextResponse.json(
      {
        error: 'GHOSTREGIME_NOT_SEEDED',
        missing_files: ['data/ghostregime/seed/ghostregime_replay_history.csv'],
      },
      { status: 503 }
    );
  }

  try {
    const row = await getGhostRegimeToday(debug, force, scheduledRefresh);
    return NextResponse.json(row, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/ghostregime/today:', error);

    if (error instanceof Error && error.message === 'GHOSTREGIME_NOT_READY') {
      const errorWithDiagnostics = error as Error & { diagnostics?: Record<string, unknown> };

      return NextResponse.json(
        {
          error: 'GHOSTREGIME_NOT_READY',
          message: 'Insufficient market data to compute regime',
          ...(errorWithDiagnostics.diagnostics || {}),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
