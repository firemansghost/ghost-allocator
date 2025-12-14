/**
 * GhostRegime Replay Loader
 * Loads and parses historical CSV data for replay mode
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { parseISO, isBefore, isEqual } from 'date-fns';
import type { GhostRegimeRow } from './types';
import { CUTOVER_DATE_UTC, SEED_FILE_PATH } from './config';
import { checkSeedStatus } from './seedStatus';

export function loadReplayHistory(): GhostRegimeRow[] {
  const seedStatus = checkSeedStatus();

  if (!seedStatus.exists || seedStatus.isEmpty) {
    return [];
  }

  try {
    const seedPath = join(process.cwd(), SEED_FILE_PATH);
    const content = readFileSync(seedPath, 'utf-8');

    // Parse CSV
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    }) as Record<string, any>[];

    // Filter rows where date <= cutover and set source="replay"
    const cutoverDate = CUTOVER_DATE_UTC;
    const replayRows: GhostRegimeRow[] = [];

    for (const record of records) {
      if (!record.date) continue;

      const rowDate = parseISO(record.date);
      if (isBefore(rowDate, cutoverDate) || isEqual(rowDate, cutoverDate)) {
        const row: GhostRegimeRow = {
          date: record.date,
          regime: record.regime,
          risk_regime: record.risk_regime,
          risk_score: record.risk_score ?? 0,
          infl_score: record.infl_score ?? 0,
          infl_core_score: record.infl_core_score ?? 0,
          infl_sat_score: record.infl_sat_score ?? 0,
          stocks_vams_state: record.stocks_vams_state ?? 0,
          gold_vams_state: record.gold_vams_state ?? 0,
          btc_vams_state: record.btc_vams_state ?? 0,
          stocks_target: record.stocks_target ?? 0,
          gold_target: record.gold_target ?? 0,
          btc_target: record.btc_target ?? 0,
          stocks_scale: record.stocks_scale ?? 0.5,
          gold_scale: record.gold_scale ?? 0.5,
          btc_scale: record.btc_scale ?? 0.5,
          stocks_actual: record.stocks_actual ?? 0,
          gold_actual: record.gold_actual ?? 0,
          btc_actual: record.btc_actual ?? 0,
          cash: record.cash ?? 0,
          flip_watch_status: record.flip_watch_status ?? 'NONE',
          source: 'replay',
          stale: record.stale ?? false,
          stale_reason: record.stale_reason,
        };
        replayRows.push(row);
      }
    }

    return replayRows;
  } catch (error) {
    console.error('Error loading replay history:', error);
    return [];
  }
}

