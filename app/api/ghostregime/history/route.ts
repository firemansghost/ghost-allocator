/**
 * GET /api/ghostregime/history
 * Returns GhostRegime history with optional date filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseISO } from 'date-fns';
import { getGhostRegimeHistory } from '@/lib/ghostregime/engine';
import { checkSeedStatus } from '@/lib/ghostregime/seedStatus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Check seed status first
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
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? parseISO(startDateStr) : undefined;
    const endDate = endDateStr ? parseISO(endDateStr) : undefined;

    const history = await getGhostRegimeHistory(startDate, endDate);
    return NextResponse.json(history, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/ghostregime/history:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

