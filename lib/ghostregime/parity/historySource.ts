/**
 * History Source Loader for Diagnostics
 * 
 * Provides unified access to GhostRegime history from:
 * - Local persistence (replay + computed)
 * - API endpoint (deployed app)
 * - Auto (local first, fallback to API)
 */

import type { GhostRegimeRow } from '../types';
import { getGhostRegimeHistory } from '../engine';
import { parseISO, subDays } from 'date-fns';

export type HistorySource = 'local' | 'api' | 'auto';

export interface HistorySourceOptions {
  source: HistorySource;
  baseUrl?: string; // Required for 'api' or 'auto' fallback
  lookbackDays?: number; // Default: 120
  startDate?: Date;
  endDate?: Date;
}

/**
 * Load GhostRegime history from the specified source
 */
export async function loadGhostRegimeHistoryForDiagnostics(
  options: HistorySourceOptions
): Promise<GhostRegimeRow[]> {
  const { source, baseUrl, lookbackDays = 120, startDate, endDate } = options;

  if (source === 'local') {
    return await getGhostRegimeHistory(startDate, endDate);
  }

  if (source === 'api') {
    if (!baseUrl) {
      throw new Error('baseUrl is required when source=api');
    }
    return await loadHistoryFromApi(baseUrl, lookbackDays, startDate, endDate);
  }

  if (source === 'auto') {
    // Try local first
    const localHistory = await getGhostRegimeHistory(startDate, endDate);
    
    // If we have a date range request and local doesn't cover it, try API
    if (startDate || endDate) {
      const requestedStart = startDate || subDays(endDate || new Date(), lookbackDays);
      const requestedEnd = endDate || new Date();
      
      const localStart = localHistory.length > 0 
        ? parseISO(localHistory[0].date)
        : null;
      const localEnd = localHistory.length > 0
        ? parseISO(localHistory[localHistory.length - 1].date)
        : null;
      
      const needsApi = !localStart || !localEnd ||
        localStart > requestedStart ||
        localEnd < requestedEnd;
      
      if (needsApi && baseUrl) {
        try {
          const apiHistory = await loadHistoryFromApi(baseUrl, lookbackDays, startDate, endDate);
          // Merge and dedupe by date
          const merged = new Map<string, GhostRegimeRow>();
          for (const row of localHistory) {
            merged.set(row.date, row);
          }
          for (const row of apiHistory) {
            merged.set(row.date, row);
          }
          return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
          console.warn('API history load failed, using local only:', error);
          return localHistory;
        }
      }
    }
    
    // If local is empty and we have baseUrl, try API
    if (localHistory.length === 0 && baseUrl) {
      try {
        return await loadHistoryFromApi(baseUrl, lookbackDays, startDate, endDate);
      } catch (error) {
        console.warn('API history load failed:', error);
        return [];
      }
    }
    
    return localHistory;
  }

  throw new Error(`Unknown history source: ${source}`);
}

/**
 * Load history from API endpoint
 */
async function loadHistoryFromApi(
  baseUrl: string,
  lookbackDays: number,
  startDate?: Date,
  endDate?: Date
): Promise<GhostRegimeRow[]> {
  // Build query params
  const params = new URLSearchParams();
  if (startDate) {
    params.set('startDate', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    params.set('endDate', endDate.toISOString().split('T')[0]);
  } else if (!startDate) {
    // If no dates specified, use lookbackDays
    const end = new Date();
    const start = subDays(end, lookbackDays);
    params.set('startDate', start.toISOString().split('T')[0]);
    params.set('endDate', end.toISOString().split('T')[0]);
  }

  const url = `${baseUrl}/api/ghostregime/history?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('API returned invalid format (expected array)');
    }

    return data as GhostRegimeRow[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load history from API: ${error.message}`);
    }
    throw error;
  }
}
