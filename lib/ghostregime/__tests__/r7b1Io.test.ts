import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  auditVixExtraDates,
  parseBtcReturnCsv,
  parseReturnEtfCsv,
  parseSignalCsv,
} from '../../../scripts/ghostregime/research/io';

describe('R7B1 snapshot IO guards', () => {
  it('rejects adjusted-close as the signal value', () => {
    assert.throws(
      () =>
        parseSignalCsv('SPY', [
          { date_key: '2024-01-02', adjusted_close: '100', source: 'x' },
        ]),
      /ADJUSTED_SIGNAL_FORBIDDEN/
    );
  });

  it('rejects raw ETF series missing adjusted_close as primary performance data', () => {
    assert.throws(
      () =>
        parseReturnEtfCsv('BIL', [
          { date_key: '2024-01-02', raw_close: '91.5', source: 'x' },
        ]),
      /RAW_RETURN_FORBIDDEN/
    );
  });

  it('K. accepts a 1-hour stale but non-leaky BTC mark with a warning', () => {
    const parsed = parseBtcReturnCsv([
      {
        session_date: '2017-02-28',
        equity_close_utc: '2017-02-28T21:00:00Z',
        btc_candle_start_utc: '2017-02-28T19:00:00.000Z',
        btc_candle_end_utc: '2017-02-28T20:00:00.000Z',
        close: '1190',
        source: 'coinbase_exchange',
      },
    ]);
    assert.deepStrictEqual(parsed.staleSessions, ['2017-02-28']);
    assert.strictEqual(parsed.warnings[0]?.code, 'BTC_STALE_MARK');
    assert.strictEqual(parsed.rows[0]?.post_close_leak, false);
  });

  it('K. rejects a post-close BTC mark', () => {
    assert.throws(
      () =>
        parseBtcReturnCsv([
          {
            session_date: '2017-02-28',
            equity_close_utc: '2017-02-28T21:00:00Z',
            btc_candle_start_utc: '2017-02-28T21:00:00.000Z',
            btc_candle_end_utc: '2017-02-28T22:00:00.000Z',
            close: '1190',
            source: 'coinbase_exchange',
          },
        ]),
      /BTC_POST_CLOSE_LEAK/
    );
  });

  it('stops on unexpected weekend VIX extras and records weekday extras', () => {
    assert.throws(
      () => auditVixExtraDates(['2024-09-01'], ['2024-09-03']),
      /UNEXPECTED_WEEKEND_VIX/
    );
    const audit = auditVixExtraDates(['2024-09-02', '2024-09-03'], ['2024-09-03']);
    assert.strictEqual(audit.extras.length, 1);
    assert.strictEqual(audit.extras[0].date, '2024-09-02');
    assert.strictEqual(audit.extras[0].classification, 'non_xnys_weekday');
  });

  it('keeps validate-only mode free of performance imports', () => {
    const source = readFileSync('scripts/ghostregime/research/validate-snapshot.ts', 'utf8');
    assert.doesNotMatch(source, /from '\.\/metrics'/);
    assert.doesNotMatch(source, /from '\.\/portfolio'/);
    assert.doesNotMatch(source, /cagr\(|sharpe\(|maxDrawdown|P0_CURRENT/);
  });
});
