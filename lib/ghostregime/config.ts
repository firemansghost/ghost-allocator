/**
 * GhostRegime v1 Configuration
 * Constants, environment variables, and configuration values
 */

// Environment variables
export const MODEL_VERSION =
  process.env.NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION || 'ghostregime-v1.0.1';

export const CUTOVER_DATE_UTC = new Date(
  process.env.NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC || '2025-11-28T00:00:00Z'
);

export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Trading day windows (N observations)
export const TR_21 = 21;
export const TR_63 = 63;
export const TR_126 = 126;
export const TR_252 = 252;

// VAMS thresholds
export const VAMS_THRESHOLD_HIGH = 0.5;
export const VAMS_THRESHOLD_LOW = -0.5;

// VAMS state to scale mapping
export const VAMS_SCALE_MAP: Record<number, number> = {
  2: 1.0,
  0: 0.5,
  [-2]: 0.0,
};

// Option B voting thresholds
export const VOTE_THRESHOLDS = {
  SPY_RISK_ON: 0.02,
  SPY_RISK_OFF: -0.02,
  HYG_IEF_RISK_ON: 0.01,
  HYG_IEF_RISK_OFF: -0.01,
  VIX_RISK_ON: -0.1,
  VIX_RISK_OFF: 0.1,
  EEM_SPY_RISK_ON: 0.01,
  EEM_SPY_RISK_OFF: -0.01,
  PDBC_INFLATION: 0.02,
  PDBC_DISINFLATION: -0.02,
  TIP_IEF_INFLATION: 0.005,
  TIP_IEF_DISINFLATION: -0.005,
  TLT_INFLATION: -0.01,
  TLT_DISINFLATION: 0.01,
  UUP_INFLATION: -0.01,
  UUP_DISINFLATION: 0.01,
};

// Allocation targets
export const ALLOCATION_TARGETS = {
  STOCKS_RISK_ON: 0.6,
  STOCKS_RISK_OFF: 0.3,
  GOLD: 0.3,
  BTC_RISK_ON: 0.1,
  BTC_RISK_OFF: 0.05,
};

// Stress override thresholds
export const STRESS_OVERRIDE = {
  VIX_THRESHOLD: 30,
  HYG_IEF_RATIO_THRESHOLD: -0.02,
};

// Flip watch persistence guard
export const FLIP_WATCH = {
  CONFIRMATION_DAYS: 2,
  STRONG_FLIP_SCORE_THRESHOLD: 2,
};

// Blob storage keys
export const BLOB_KEYS = {
  HISTORY: 'ghostregime/ghostregime_history.jsonl',
  LATEST: 'ghostregime/ghostregime_latest.json',
  META: 'ghostregime/ghostregime_meta.json',
};

// Seed file path
export const SEED_FILE_PATH = 'data/ghostregime/seed/ghostregime_replay_history.csv';

// Market data symbols
export const MARKET_SYMBOLS = {
  SPY: 'SPY',
  GLD: 'GLD',
  HYG: 'HYG',
  IEF: 'IEF',
  EEM: 'EEM',
  PDBC: 'PDBC',
  TLT: 'TLT',
  UUP: 'UUP',
  VIX: 'VIX',
  BTC_USD: 'BTC-USD',
} as const;

// Allocation math tolerance
export const ALLOCATION_TOLERANCE = 1e-6;



