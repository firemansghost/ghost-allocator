/**
 * GET /api/ghostregime/today
 * Returns today's GhostRegime data
 */

import { NextResponse } from 'next/server';
import { getGhostRegimeToday } from '@/lib/ghostregime/engine';
import { checkSeedStatus } from '@/lib/ghostregime/seedStatus';

export async function GET() {
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
    const row = await getGhostRegimeToday();
    return NextResponse.json(row);
  } catch (error) {
    console.error('Error in /api/ghostregime/today:', error);
    
    // Handle NOT_READY error
    if (error instanceof Error && error.message === 'GHOSTREGIME_NOT_READY') {
      return NextResponse.json(
        {
          error: 'GHOSTREGIME_NOT_READY',
          message: 'Insufficient market data to compute regime',
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

