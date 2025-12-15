/**
 * GET /api/ghostregime/today
 * Returns today's GhostRegime data
 */

import { NextResponse } from 'next/server';
import { getGhostRegimeToday } from '@/lib/ghostregime/engine';
import { checkSeedStatus } from '@/lib/ghostregime/seedStatus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Check for debug parameter (accepts: debug=1, debug=true, debug=yes)
  const { searchParams } = new URL(request.url);
  const debugParam = searchParams.get('debug')?.toLowerCase();
  const debug = debugParam === '1' || debugParam === 'true' || debugParam === 'yes';
  
  // Check for force parameter (accepts: force=1, force=true, force=yes)
  const forceParam = searchParams.get('force')?.toLowerCase();
  const force = forceParam === '1' || forceParam === 'true' || forceParam === 'yes';

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
    const row = await getGhostRegimeToday(debug, force);
    return NextResponse.json(row, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/ghostregime/today:', error);
    
    // Handle NOT_READY error with diagnostics
    if (error instanceof Error && error.message === 'GHOSTREGIME_NOT_READY') {
      const errorWithDiagnostics = error as Error & {
        diagnostics?: {
          asof_date_attempted: string | null;
          missing_core_symbols: string[];
          core_symbol_status: Record<string, any>;
          provider_diagnostics?: {
            resolvedIds: Record<string, string>;
            errors: Record<string, string>;
            proxies: Record<string, string>;
          };
        };
      };
      
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

