/**
 * Engine scheduled refresh — skips market provider when preflight passes
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  readFileSync,
  readdirSync,
  rmdirSync,
} from 'fs';
import { join } from 'path';
import type { GhostRegimeRow } from '../types';
import { defaultMarketDataProvider } from '../marketData';

const GHOSTREGIME_DIR = '.ghostregime';
const LATEST_PATH = join(GHOSTREGIME_DIR, 'latest.json');

/**
 * Canonical-suite safety: this test must not destroy a developer's pre-existing
 * local `.ghostregime/latest.json`. Preserve exact bytes, restore on the way out,
 * and never delete a pre-existing directory or unrelated files.
 */
function captureLocalLatestState(): {
  dirExisted: boolean;
  latestExisted: boolean;
  latestBytes: Buffer | null;
} {
  const dirExisted = existsSync(GHOSTREGIME_DIR);
  const latestExisted = existsSync(LATEST_PATH);
  return {
    dirExisted,
    latestExisted,
    latestBytes: latestExisted ? readFileSync(LATEST_PATH) : null,
  };
}

function restoreLocalLatestState(saved: {
  dirExisted: boolean;
  latestExisted: boolean;
  latestBytes: Buffer | null;
}): void {
  if (saved.latestExisted) {
    if (!existsSync(GHOSTREGIME_DIR)) {
      mkdirSync(GHOSTREGIME_DIR, { recursive: true });
    }
    assert.ok(saved.latestBytes, 'preserved latest.json bytes must exist when the file existed before the test');
    writeFileSync(LATEST_PATH, saved.latestBytes);
    const restored = readFileSync(LATEST_PATH);
    assert.ok(
      restored.equals(saved.latestBytes),
      'canonical suite must restore pre-existing .ghostregime/latest.json byte-for-byte'
    );
    return;
  }

  if (existsSync(LATEST_PATH)) {
    unlinkSync(LATEST_PATH);
  }
  assert.strictEqual(
    existsSync(LATEST_PATH),
    false,
    'canonical suite must not leave a fixture latest.json when none existed before'
  );

  if (!saved.dirExisted && existsSync(GHOSTREGIME_DIR)) {
    const leftovers = readdirSync(GHOSTREGIME_DIR);
    if (leftovers.length === 0) {
      rmdirSync(GHOSTREGIME_DIR);
    }
  }
  assert.ok(
    saved.dirExisted || !existsSync(GHOSTREGIME_DIR) || readdirSync(GHOSTREGIME_DIR).length > 0,
    'must not delete a pre-existing .ghostregime/ directory'
  );
}

function baseRow(date: string): GhostRegimeRow {
  return {
    date,
    run_date_utc: date,
    regime: 'GOLDILOCKS',
    risk_regime: 'RISK ON',
    risk_score: 1,
    infl_score: 0,
    infl_core_score: 0,
    infl_sat_score: 0,
    infl_total_score_pre_tiebreak: 1,
    risk_axis: 'RiskOn',
    infl_axis: 'Disinflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.5,
    gold_target: 0.2,
    btc_target: 0.05,
    stocks_scale: 1,
    gold_scale: 1,
    btc_scale: 1,
    stocks_actual: 0.5,
    gold_actual: 0.2,
    btc_actual: 0.05,
    cash: 0.2,
    flip_watch_status: 'NONE',
    source: 'computed',
    row_computed_at_utc: `${date}T12:00:00.000Z`,
    row_build_commit: 'abc',
    row_engine_version: 'ghostregime-v1.0.2',
  };
}

describe('getGhostRegimeToday scheduled mode', () => {
  const savedEnv: Record<string, string | undefined> = {};
  let originalGetHistoricalPrices: typeof defaultMarketDataProvider.getHistoricalPrices;
  let fetchCalled = false;
  let savedLocalLatest: ReturnType<typeof captureLocalLatestState> | undefined;

  before(() => {
    savedLocalLatest = captureLocalLatestState();

    savedEnv.GHOSTREGIME_RUNTIME = process.env.GHOSTREGIME_RUNTIME;
    savedEnv.NODE_ENV = process.env.NODE_ENV;
    process.env.GHOSTREGIME_RUNTIME = 'cli';
    process.env.NODE_ENV = 'development';

    originalGetHistoricalPrices = defaultMarketDataProvider.getHistoricalPrices.bind(
      defaultMarketDataProvider
    );
    defaultMarketDataProvider.getHistoricalPrices = (async () => {
      fetchCalled = true;
      throw new Error('getHistoricalPrices should not be called when scheduled preflight passes');
    }) as typeof defaultMarketDataProvider.getHistoricalPrices;

    if (!existsSync(GHOSTREGIME_DIR)) {
      mkdirSync(GHOSTREGIME_DIR, { recursive: true });
    }
    // Friday snapshot — fresh for Monday cron under max_age_days=4
    writeFileSync(LATEST_PATH, JSON.stringify(baseRow('2026-06-12')), 'utf-8');
  });

  after(() => {
    try {
      if (originalGetHistoricalPrices) {
        defaultMarketDataProvider.getHistoricalPrices = originalGetHistoricalPrices;
      }
      if (savedEnv.GHOSTREGIME_RUNTIME === undefined) {
        delete process.env.GHOSTREGIME_RUNTIME;
      } else {
        process.env.GHOSTREGIME_RUNTIME = savedEnv.GHOSTREGIME_RUNTIME;
      }
      if (savedEnv.NODE_ENV === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = savedEnv.NODE_ENV;
      }
    } finally {
      if (savedLocalLatest) {
        restoreLocalLatestState(savedLocalLatest);
      }
    }
  });

  it('captures pre-existing local latest.json so cleanup can restore it exactly', () => {
    assert.ok(savedLocalLatest, 'before() must capture local .ghostregime state before writing a fixture');
    assert.strictEqual(typeof savedLocalLatest.dirExisted, 'boolean');
    assert.strictEqual(typeof savedLocalLatest.latestExisted, 'boolean');
    if (savedLocalLatest.latestExisted) {
      assert.ok(Buffer.isBuffer(savedLocalLatest.latestBytes));
      assert.ok(savedLocalLatest.latestBytes.length >= 0);
    } else {
      assert.strictEqual(savedLocalLatest.latestBytes, null);
    }
  });

  it('serves persisted without market fetch when scheduled preflight passes', async () => {
    fetchCalled = false;
    const { getGhostRegimeToday } = await import('../engine');
    const runDate = new Date('2026-06-15T03:30:00.000Z');
    const RealDate = Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).Date = class extends RealDate {
      constructor(...args: ConstructorParameters<typeof RealDate>) {
        if (args.length === 0) {
          super(runDate.getTime());
        } else {
          super(...args);
        }
      }
      static now() {
        return runDate.getTime();
      }
    };

    try {
      const row = await getGhostRegimeToday(false, false, true);
      assert.strictEqual(fetchCalled, false);
      assert.strictEqual(row.data_source, 'persisted');
      assert.strictEqual(row.serve_metadata?.refresh_attempt, 'scheduled');
      assert.strictEqual(row.serve_metadata?.refresh_outcome, 'scheduled_served_persisted_no_fetch');
      assert.strictEqual(row.date, '2026-06-12');
    } finally {
      global.Date = RealDate;
    }
  });

  it('force=1 still calls market provider (does not use scheduled skip)', async () => {
    fetchCalled = false;
    let forceFetchCalled = false;
    defaultMarketDataProvider.getHistoricalPrices = (async () => {
      forceFetchCalled = true;
      return [];
    }) as typeof defaultMarketDataProvider.getHistoricalPrices;

    const { getGhostRegimeToday } = await import('../engine');
    await getGhostRegimeToday(false, true, false);
    assert.strictEqual(forceFetchCalled, true);
  });
});
