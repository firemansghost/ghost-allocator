/**
 * GhostYield Phase 3 — static illustrative candidates loaded from manual JSON (no live feeds).
 */

import type {
  Confidence,
  GhostYieldCategoryMeta,
  GhostYieldCandidateRaw,
  YieldEnvironmentInputs,
} from './types';
import { scoreCandidates } from './scoring';
import { GHOSTYIELD_REFERENCE_AS_OF } from './reference';
import candidatesManual from '../../data/ghostyield/candidates.manual.json';

export { GHOSTYIELD_REFERENCE_AS_OF };

export const YIELD_SLEEVE_CATEGORIES: GhostYieldCategoryMeta[] = [
  {
    id: 'cash_tbills',
    label: 'Cash / T-Bill Yield',
    blurb:
      'Treasury and cash-like sleeves. Low credit drama, but reinvestment and real-return risk still exist.',
  },
  {
    id: 'credit_income',
    label: 'Credit Income',
    blurb:
      'Corporate loans, high yield, CLO tranches, and similar. Yield often rises when spreads widen — you are paid to hold default and downgrade risk.',
  },
  {
    id: 'preferred_income',
    label: 'Preferred Income',
    blurb:
      'Hybrid securities — higher yields than many bonds, but rate sensitivity and issuer credit still matter. Resets and call features add complexity.',
  },
  {
    id: 'cef_credit',
    label: 'CEF Credit',
    blurb:
      'Closed-end credit funds with structural leverage. NAV quotes, premiums/discounts, and distribution tax character — including return of capital — matter as much as coupons.',
  },
  {
    id: 'special_opportunistic_income',
    label: 'Opportunistic / Special Situations Income',
    blurb:
      'Event-driven, activism-adjacent, or opportunistic credit sleeves — often idiosyncratic. Liquidity, filings, and strategy drift deserve extra skepticism alongside headline yield.',
  },
  {
    id: 'bdc_income',
    label: 'BDC Income',
    blurb:
      'Business development companies lend to private middle-market firms. NAV can swing with credit marks; distributions may include volatile components.',
  },
  {
    id: 'midstream_income',
    label: 'Midstream Income',
    blurb:
      'Energy infrastructure and pipeline-style cash flows. Yield can look rich when commodity volatility rises; equity, balance-sheet, and regulatory risk remain.',
  },
  {
    id: 'natural_resources_income',
    label: 'Natural Resources Income',
    blurb:
      'Oil, gas, and resource-linked equities or funds. Dividends track commodity cycles and corporate policy — not the same risk profile as plain midstream fee streams.',
  },
  {
    id: 'option_income',
    label: 'Option Income',
    blurb:
      'Covered-call and similar strategies trade upside for premium. Distribution stability can look good until the underlying trend shifts.',
  },
  {
    id: 'crypto_yield_coming_soon',
    label: 'Crypto Yield',
    blurb:
      'Staking, lending, and tokenized yield carry protocol, custody, and gap-risk concerns. GhostYield will add this sleeve when there is a defensible static frame — not yet.',
    comingSoon: true,
  },
];

export const GHOSTYIELD_SAMPLE_ENV: YieldEnvironmentInputs = {
  creditStress: 52,
  ratePressure: 48,
  volRegime: 44,
};

type ManualCandidateRow = Record<string, unknown> & {
  ticker: string;
  dataConfidence: Confidence;
  confidence?: Confidence;
};

function normalizeManualRow(row: ManualCandidateRow): GhostYieldCandidateRaw {
  const { confidence: confOpt, dataConfidence, ...rest } = row;
  const confidenceOverride =
    confOpt === 'high' || confOpt === 'medium' || confOpt === 'low' || confOpt === 'illustrative'
      ? confOpt
      : undefined;
  return {
    ...rest,
    dataConfidence,
    confidence: confidenceOverride ?? dataConfidence,
  } as GhostYieldCandidateRaw;
}

export const GHOSTYIELD_RAW_CANDIDATES: GhostYieldCandidateRaw[] = (
  candidatesManual as unknown as ManualCandidateRow[]
).map(normalizeManualRow);

export const GHOSTYIELD_SCORED_CANDIDATES = scoreCandidates(
  GHOSTYIELD_RAW_CANDIDATES,
  GHOSTYIELD_REFERENCE_AS_OF
);
