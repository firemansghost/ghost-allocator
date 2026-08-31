/**
 * R2 operational containment — now current invariants, not deferred desired behavior.
 *
 * Public read is persisted-only. Anonymous debug is 401 before compute.
 * A failed compute may call getHistoricalPrices at most once at the engine level.
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
    assert.ok(saved.latestBytes, 'preserved latest.json bytes required when file existed');
    writeFileSync(LATEST_PATH, saved.latestBytes);
    assert.ok(readFileSync(LATEST_PATH).equals(saved.latestBytes));
    return;
  }
  if (existsSync(LATEST_PATH)) {
    unlinkSync(LATEST_PATH);
  }
  if (!saved.dirExisted && existsSync(GHOSTREGIME_DIR) && readdirSync(GHOSTREGIME_DIR).length === 0) {
    rmdirSync(GHOSTREGIME_DIR);
  }
}

function baseRow(date: string): GhostRegimeRow {
  return {
    date,
    run_date_utc: date,
    regime: 'INFLATION',
    risk_regime: 'RISK OFF',
    risk_score: -1,
    infl_score: 1,
    infl_core_score: 0,
    infl_sat_score: 1,
    infl_total_score_pre_tiebreak: 0,
    risk_axis: 'RiskOff',
    infl_axis: 'Inflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 2,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.3,
    gold_target: 0.15,
    btc_target: 0.05,
    stocks_scale: 1,
    gold_scale: 0.5,
    btc_scale: 0.5,
    stocks_actual: 0.3,
    gold_actual: 0.075,
    btc_actual: 0.025,
    cash: 0.6,
    flip_watch_status: 'PENDING_CONFIRMATION',
    source: 'computed',
    row_computed_at_utc: `${date}T12:00:00.000Z`,
    row_build_commit: 'persist-commit-abc',
    row_engine_version: 'ghostregime-v1.0.2',
  };
}

function writeFixture(row: GhostRegimeRow): void {
  if (!existsSync(GHOSTREGIME_DIR)) {
    mkdirSync(GHOSTREGIME_DIR, { recursive: true });
  }
  writeFileSync(LATEST_PATH, JSON.stringify(row), 'utf-8');
}

function removeFixtureLatest(): void {
  if (existsSync(LATEST_PATH)) {
    unlinkSync(LATEST_PATH);
  }
}

describe('R2 operational containment', () => {
  const savedEnv: Record<string, string | undefined> = {};
  let originalGetHistoricalPrices: typeof defaultMarketDataProvider.getHistoricalPrices;
  let fetchCount = 0;
  let savedLocalLatest: ReturnType<typeof captureLocalLatestState> | undefined;
  const TEST_CRON = 'r2-test-cron-secret-not-production';

  function restoreEnv(): void {
    for (const key of Object.keys(savedEnv)) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  }

  before(() => {
    savedLocalLatest = captureLocalLatestState();
    for (const key of ['GHOSTREGIME_RUNTIME', 'NODE_ENV', 'GHOSTREGIME_CRON_SECRET']) {
      savedEnv[key] = process.env[key];
    }
    process.env.GHOSTREGIME_RUNTIME = 'cli';
    process.env.NODE_ENV = 'development';
    process.env.GHOSTREGIME_CRON_SECRET = TEST_CRON;

    originalGetHistoricalPrices = defaultMarketDataProvider.getHistoricalPrices.bind(
      defaultMarketDataProvider
    );
    defaultMarketDataProvider.getHistoricalPrices = (async () => {
      fetchCount += 1;
      throw new Error('R2_TEST_PROVIDER_BLOCKED');
    }) as typeof defaultMarketDataProvider.getHistoricalPrices;
  });

  after(() => {
    try {
      if (originalGetHistoricalPrices) {
        defaultMarketDataProvider.getHistoricalPrices = originalGetHistoricalPrices;
      }
      restoreEnv();
    } finally {
      if (savedLocalLatest) {
        restoreLocalLatestState(savedLocalLatest);
      }
    }
  });

  it('captures pre-existing local latest.json before writing fixtures', () => {
    assert.ok(savedLocalLatest);
    assert.strictEqual(typeof savedLocalLatest.dirExisted, 'boolean');
    assert.strictEqual(typeof savedLocalLatest.latestExisted, 'boolean');
  });

  it('ordinary public read serves persisted latest with zero provider orchestration calls', async () => {
    const fixture = baseRow('2026-08-28');
    writeFixture(fixture);
    fetchCount = 0;
    const { getGhostRegimeToday } = await import('../engine');
    const row = await getGhostRegimeToday(false, false, false);

    assert.strictEqual(fetchCount, 0);
    assert.strictEqual(row.data_source, 'persisted');
    assert.strictEqual(row.regime, 'INFLATION');
    assert.strictEqual(row.gold_target, 0.15);
    assert.strictEqual(row.stocks_actual, 0.3);
    assert.strictEqual(row.row_computed_at_utc, '2026-08-28T12:00:00.000Z');
    assert.strictEqual(row.row_build_commit, 'persist-commit-abc');
    assert.strictEqual(row.row_engine_version, 'ghostregime-v1.0.2');
    assert.strictEqual(row.serve_metadata?.refresh_attempt, 'read');
    assert.strictEqual(row.serve_metadata?.refresh_outcome, 'served_persisted_snapshot');
    assert.strictEqual(row.serve_metadata?.persisted_snapshot_preserved, true);
  });

  it('ordinary public read with no persisted latest is NOT_READY and does not fetch or persist', async () => {
    removeFixtureLatest();
    const existedBefore = existsSync(LATEST_PATH);
    fetchCount = 0;
    const { getGhostRegimeToday } = await import('../engine');
    await assert.rejects(
      () => getGhostRegimeToday(false, false, false),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'GHOSTREGIME_NOT_READY');
        const diagnostics = (err as Error & { diagnostics?: { stale_reason?: string } }).diagnostics;
        assert.strictEqual(diagnostics?.stale_reason, 'NO_PERSISTED_SNAPSHOT');
        return true;
      }
    );
    assert.strictEqual(fetchCount, 0);
    assert.strictEqual(existsSync(LATEST_PATH), existedBefore);
  });

  it('force compute error path calls getHistoricalPrices once, not twice', async () => {
    writeFixture(baseRow('2026-08-28'));
    fetchCount = 0;
    const { getGhostRegimeToday } = await import('../engine');
    const row = await getGhostRegimeToday(false, true, false);
    assert.strictEqual(fetchCount, 1);
    assert.strictEqual(row.stale, true);
    assert.strictEqual(row.stale_reason, 'R2_TEST_PROVIDER_BLOCKED');
    assert.strictEqual(row.serve_metadata?.refresh_outcome, 'error_carry_forward_with_diagnostics');
    assert.strictEqual(row.serve_metadata?.persisted_snapshot_preserved, true);
    assert.strictEqual(row.regime, 'INFLATION');
  });
});

describe('R2 debug authorization at the today route', () => {
  const savedEnv: Record<string, string | undefined> = {};
  let originalGetHistoricalPrices: typeof defaultMarketDataProvider.getHistoricalPrices;
  let fetchCount = 0;
  let savedLocalLatest: ReturnType<typeof captureLocalLatestState> | undefined;
  const TEST_CRON = 'r2-test-cron-secret-not-production';

  before(() => {
    savedLocalLatest = captureLocalLatestState();
    for (const key of ['GHOSTREGIME_RUNTIME', 'NODE_ENV', 'GHOSTREGIME_CRON_SECRET']) {
      savedEnv[key] = process.env[key];
    }
    process.env.GHOSTREGIME_RUNTIME = 'cli';
    process.env.NODE_ENV = 'development';
    process.env.GHOSTREGIME_CRON_SECRET = TEST_CRON;
    originalGetHistoricalPrices = defaultMarketDataProvider.getHistoricalPrices.bind(
      defaultMarketDataProvider
    );
    defaultMarketDataProvider.getHistoricalPrices = (async () => {
      fetchCount += 1;
      throw new Error('R2_TEST_PROVIDER_BLOCKED');
    }) as typeof defaultMarketDataProvider.getHistoricalPrices;
    writeFixture(baseRow('2026-08-28'));
  });

  after(() => {
    try {
      if (originalGetHistoricalPrices) {
        defaultMarketDataProvider.getHistoricalPrices = originalGetHistoricalPrices;
      }
      for (const key of Object.keys(savedEnv)) {
        if (savedEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = savedEnv[key];
        }
      }
    } finally {
      if (savedLocalLatest) {
        restoreLocalLatestState(savedLocalLatest);
      }
    }
  });

  it('anonymous debug=1 returns 401 and does not enter the provider path', async () => {
    fetchCount = 0;
    const { GET } = await import('../../../app/api/ghostregime/today/route');
    const res = await GET(new Request('http://localhost/api/ghostregime/today?debug=1'));
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as { error?: string };
    assert.strictEqual(body.error, 'UNAUTHORIZED');
    assert.strictEqual(fetchCount, 0);
  });

  it('anonymous debug=true and debug=yes are also 401', async () => {
    fetchCount = 0;
    const { GET } = await import('../../../app/api/ghostregime/today/route');
    for (const q of ['debug=true', 'debug=yes']) {
      const res = await GET(new Request(`http://localhost/api/ghostregime/today?${q}`));
      assert.strictEqual(res.status, 401, q);
    }
    assert.strictEqual(fetchCount, 0);
  });

  it('debug without a configured cron secret returns 401', async () => {
    delete process.env.GHOSTREGIME_CRON_SECRET;
    fetchCount = 0;
    const { GET } = await import('../../../app/api/ghostregime/today/route');
    const res = await GET(
      new Request('http://localhost/api/ghostregime/today?debug=1', {
        headers: { 'x-ghostregime-cron': TEST_CRON },
      })
    );
    assert.strictEqual(res.status, 401);
    assert.strictEqual(fetchCount, 0);
    process.env.GHOSTREGIME_CRON_SECRET = TEST_CRON;
  });

  it('authorized debug reaches compute and does not persist a new latest', async () => {
    process.env.GHOSTREGIME_CRON_SECRET = TEST_CRON;
    const beforeBytes = readFileSync(LATEST_PATH);
    fetchCount = 0;
    const { GET } = await import('../../../app/api/ghostregime/today/route');
    const res = await GET(
      new Request('http://localhost/api/ghostregime/today?debug=1', {
        headers: { 'x-ghostregime-cron': TEST_CRON },
      })
    );
    assert.notStrictEqual(res.status, 401);
    assert.ok(res.status === 200 || res.status === 503);
    assert.strictEqual(fetchCount, 1);
    assert.ok(readFileSync(LATEST_PATH).equals(beforeBytes), 'debug must not persist');
  });
});
