/**
 * Board H.15 Treasury yields adapter fixtures (synthetic serieslist CSV; no live downloads).
 */

export const ADAPTER_TEST_NOW_ISO = '2026-07-06T18:00:00.000Z';

function seriesMeta(uniqueId: string, seriesName: string, description: string): string {
  return [
    `${uniqueId},"Series Description:","${description}"`,
    `${uniqueId},"Unit:","Percent:_Per_Year"`,
    `${uniqueId},"Multiplier:","1"`,
    `${uniqueId},"Currency:","NA"`,
    `${uniqueId},"Series Name:","${seriesName}"`,
  ].join('\n');
}

function seriesObs(uniqueId: string, rows: Array<[string, string]>): string {
  return rows.map(([d, v]) => `${uniqueId},${d},${v}`).join('\n');
}

/** Minimal TCM-like package with required + optional nominals (extra maturities omitted). */
export const FIXTURE_H15_TCM_VALID = [
  seriesMeta(
    'H15/H15/RIFLGFCY02_N.B',
    'RIFLGFCY02_N.B',
    'Market yield on U.S. Treasury securities at 2-year constant maturity, quoted on investment basis'
  ),
  seriesObs('H15/H15/RIFLGFCY02_N.B', [
    ['2026-06-30', '4.10'],
    ['2026-07-01', '4.17'],
    ['2026-07-02', 'ND'],
    ['2026-07-03', '4.15'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY05_N.B',
    'RIFLGFCY05_N.B',
    'Market yield on U.S. Treasury securities at 5-year constant maturity, quoted on investment basis'
  ),
  seriesObs('H15/H15/RIFLGFCY05_N.B', [
    ['2026-06-30', '4.20'],
    ['2026-07-01', '4.24'],
    ['2026-07-03', '4.22'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY10_N.B',
    'RIFLGFCY10_N.B',
    'Market yield on U.S. Treasury securities at 10-year constant maturity, quoted on investment basis'
  ),
  seriesObs('H15/H15/RIFLGFCY10_N.B', [
    ['2026-06-30', '4.40'],
    ['2026-07-01', '4.48'],
    ['2026-07-03', '4.45'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY30_N.B',
    'RIFLGFCY30_N.B',
    'Market yield on U.S. Treasury securities at 30-year constant maturity, quoted on investment basis'
  ),
  seriesObs('H15/H15/RIFLGFCY30_N.B', [
    ['2026-06-30', '4.90'],
    ['2026-07-01', '4.97'],
    ['2026-07-03', '4.95'],
  ]),
].join('\n');

export const FIXTURE_H15_TIPS30_VALID = [
  seriesMeta(
    'H15/H15/RIFLGFCY30_XII_N.B',
    'RIFLGFCY30_XII_N.B',
    'Market yield on U.S. Treasury securities at 30-year constant maturity, quoted on investment basis, inflation-indexed'
  ),
  seriesObs('H15/H15/RIFLGFCY30_XII_N.B', [
    ['2026-06-30', '2.70'],
    ['2026-07-01', '2.78'],
    ['2026-07-02', 'ND'],
    ['2026-07-03', '2.79'],
  ]),
].join('\n');

/** Optional 2Y missing on shared required date 2026-07-01. */
export const FIXTURE_H15_TCM_OPTIONAL_GAP = [
  seriesMeta(
    'H15/H15/RIFLGFCY02_N.B',
    'RIFLGFCY02_N.B',
    '2-year'
  ),
  seriesObs('H15/H15/RIFLGFCY02_N.B', [
    ['2026-06-30', '4.10'],
    ['2026-07-01', 'ND'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY05_N.B',
    'RIFLGFCY05_N.B',
    '5-year'
  ),
  seriesObs('H15/H15/RIFLGFCY05_N.B', [
    ['2026-07-01', '4.24'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY10_N.B',
    'RIFLGFCY10_N.B',
    '10-year'
  ),
  seriesObs('H15/H15/RIFLGFCY10_N.B', [
    ['2026-07-01', '4.48'],
  ]),
  seriesMeta(
    'H15/H15/RIFLGFCY30_N.B',
    'RIFLGFCY30_N.B',
    '30-year'
  ),
  seriesObs('H15/H15/RIFLGFCY30_N.B', [
    ['2026-07-01', '4.97'],
  ]),
].join('\n');

export const FIXTURE_H15_TIPS30_MATCHING = [
  seriesMeta(
    'H15/H15/RIFLGFCY30_XII_N.B',
    'RIFLGFCY30_XII_N.B',
    '30-year tips'
  ),
  seriesObs('H15/H15/RIFLGFCY30_XII_N.B', [['2026-07-01', '2.78']]),
].join('\n');

export const FIXTURE_H15_TCM_NO_COMMON = [
  seriesMeta('H15/H15/RIFLGFCY30_N.B', 'RIFLGFCY30_N.B', '30-year'),
  seriesObs('H15/H15/RIFLGFCY30_N.B', [['2026-07-01', '4.97']]),
].join('\n');

export const FIXTURE_H15_TIPS30_NO_COMMON = [
  seriesMeta('H15/H15/RIFLGFCY30_XII_N.B', 'RIFLGFCY30_XII_N.B', 'tips'),
  seriesObs('H15/H15/RIFLGFCY30_XII_N.B', [['2026-07-03', '2.79']]),
].join('\n');

export const FIXTURE_H15_TCM_FUTURE = [
  seriesMeta('H15/H15/RIFLGFCY30_N.B', 'RIFLGFCY30_N.B', '30-year'),
  seriesObs('H15/H15/RIFLGFCY30_N.B', [
    ['2026-07-01', '4.97'],
    ['2026-07-10', '5.06'],
  ]),
].join('\n');

export const FIXTURE_H15_TIPS30_FUTURE = [
  seriesMeta('H15/H15/RIFLGFCY30_XII_N.B', 'RIFLGFCY30_XII_N.B', 'tips'),
  seriesObs('H15/H15/RIFLGFCY30_XII_N.B', [
    ['2026-07-01', '2.78'],
    ['2026-07-10', '2.86'],
  ]),
].join('\n');

export const FIXTURE_H15_TCM_INVALID_DATE = [
  seriesMeta('H15/H15/RIFLGFCY30_N.B', 'RIFLGFCY30_N.B', '30-year'),
  'H15/H15/RIFLGFCY30_N.B,2026-13-01,4.97',
].join('\n');

export const FIXTURE_H15_TIPS30_ONLY = FIXTURE_H15_TIPS30_MATCHING;

export const FIXTURE_H15_TCM_BAD_VALUE = [
  seriesMeta('H15/H15/RIFLGFCY30_N.B', 'RIFLGFCY30_N.B', '30-year'),
  'H15/H15/RIFLGFCY30_N.B,2026-07-01,abc',
].join('\n');
