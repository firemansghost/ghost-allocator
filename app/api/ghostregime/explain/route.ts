/**
 * GET /api/ghostregime/explain
 * Returns debug vote breakdown for a specific date
 */

import { NextResponse } from 'next/server';
import { parseISO } from 'date-fns';
import { getGhostRegimeHistory } from '@/lib/ghostregime/engine';
import { checkSeedStatus } from '@/lib/ghostregime/seedStatus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    
    if (!dateStr) {
      return NextResponse.json(
        {
          error: 'MISSING_DATE_PARAMETER',
          message: 'date parameter is required (YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    // Parse date
    let targetDate: Date;
    try {
      targetDate = parseISO(dateStr);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'INVALID_DATE_FORMAT',
          message: 'date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    // Get history and find the row for this date
    const history = await getGhostRegimeHistory();
    const row = history.find((r) => r.date === dateStr);

    if (!row) {
      return NextResponse.json(
        {
          error: 'DATE_NOT_FOUND',
          message: `No data found for date ${dateStr}`,
          available_dates: history.slice(0, 10).map((r) => r.date), // Show first 10 available dates
        },
        { status: 404 }
      );
    }

    // Return the row with debug votes (if available)
    return NextResponse.json(row, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/ghostregime/explain:', error);
    
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

