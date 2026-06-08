/**
 * GhostFlow v1.7e — Treasury Plumbing display-only lane (separate from Research Composite).
 * Pure display data builder; no React, no buildSnapshot, no score wiring.
 */

import {
  loadTreasuryFuturesPositioningProxyArtifact,
  TREASURY_FUTURES_DISPLAY_SIGNAL_NAME,
  TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID,
} from './artifacts/treasuryFuturesPositioningProxy';
import {
  formatYieldPct,
  loadTreasuryLongEndIncomeLensArtifact,
  TREASURY_LONG_END_DISPLAY_SIGNAL_NAME,
  TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID,
} from './artifacts/treasuryLongEndIncomeLens';
import type {
  TreasuryFuturesDirection,
  TreasuryFuturesPositioningArtifactV1,
  TreasuryFuturesPositioningObservationsV1,
  TreasuryFuturesPositioningValidation,
  TreasuryLongEndIncomeLensArtifactV1,
  TreasuryLongEndIncomeLensObservationsV1,
  TreasuryLongEndIncomeLensValidation,
} from './artifacts/types';

export type TreasuryPlumbingCardId =
  | 'treasury-futures-positioning-proxy'
  | 'treasury-long-end-income-lens';

export type TreasuryPlumbingCardStatus = 'ok' | 'unavailable';

export interface TreasuryPlumbingDetailRow {
  label: string;
  value: string;
}

export interface TreasuryPlumbingDisplayCard {
  id: TreasuryPlumbingCardId;
  title: string;
  badge: 'DISPLAY ONLY';
  statusLabel: string;
  primaryValue: string;
  explanation: string;
  caveat: string;
  status: TreasuryPlumbingCardStatus;
  detailRows: TreasuryPlumbingDetailRow[];
  asOf?: string;
  publishedAt?: string;
  dataQuality?: string;
  sourceName?: string;
  sourceUrl?: string;
  validationErrors?: string[];
}

export interface TreasuryPlumbingDisplayData {
  sectionTitle: 'Treasury Plumbing';
  sectionSubtitle: string;
  sectionIntro: string;
  microCaveats: string[];
  cards: TreasuryPlumbingDisplayCard[];
}

const SECTION_SUBTITLE =
  'Display-only Treasury market plumbing context. Separate from the GhostFlow Research Composite.';

const SECTION_INTRO =
  "GhostFlow's main score tracks equity passive-flow pressure and structural fragility. Treasury Plumbing is a separate display-only lane for rates-market context. These cards are not included in the Research Composite, do not change the score, and are not trading recommendations.";

const MICRO_CAVEATS = [
  'Separate from Research Composite',
  'Display-only',
  'No score impact',
  'No investment advice',
] as const;

const FUTURES_CAVEAT =
  'Public CFTC futures-positioning proxy only; not full basis-trade measurement.';

const INCOME_CAVEAT =
  'Not investment advice; not a bond-buying or duration-allocation signal.';

function dataQualityLabel(q: string | undefined): string {
  switch (q) {
    case 'verified_manual':
      return 'Verified manual';
    case 'manual_unverified':
      return 'Manual (unverified)';
    case 'mock_fallback':
      return 'Mock fallback';
    default:
      return '—';
  }
}

export function formatTreasuryBasketDirectionLabel(direction: TreasuryFuturesDirection): string {
  switch (direction) {
    case 'net_long':
      return 'Leveraged funds net long';
    case 'net_short':
      return 'Leveraged funds net short';
    case 'flat':
      return 'Leveraged funds flat';
  }
}

export function formatTreasuryFuturesPrimaryValue(
  observations: TreasuryFuturesPositioningObservationsV1
): string {
  const pct = Math.abs(observations.basketLevMoneyNetPctOi).toFixed(1);
  return `${formatTreasuryBasketDirectionLabel(observations.basketDirection)} ${pct}% OI`;
}

function formatCurveSpreadPp(value: number | undefined): string {
  if (value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} pp`;
}

export function formatTreasuryLongEndPrimaryValue(
  observations: TreasuryLongEndIncomeLensObservationsV1
): string {
  const nominal = formatYieldPct(observations.thirtyYearNominalYieldPct);
  const real = formatYieldPct(observations.thirtyYearTipsRealYieldPct);
  const spread = formatCurveSpreadPp(observations.curve10s30sPct);
  return `30Y ${nominal} · Real ${real} · 10s30s ${spread}`;
}

function formatOptionalYield(value: number | undefined): string {
  return value === undefined ? '—' : formatYieldPct(value);
}

function buildFuturesExplanation(artifact: TreasuryFuturesPositioningArtifactV1): string {
  const o = artifact.observations;
  const direction = formatTreasuryBasketDirectionLabel(o.basketDirection).toLowerCase();
  const pct = Math.abs(o.basketLevMoneyNetPctOi).toFixed(1);
  return (
    `CFTC TFF Futures Only Treasury basket (${o.basketContractCount} core contracts): leveraged funds ${direction} ` +
    `(${pct}% of combined open interest, gross ${o.basketLevMoneyGrossPctOi.toFixed(1)}% OI). ` +
    `Public positioning proxy only — not cash-futures basis, repo, or CTD. Display-only; not in the Research Composite.`
  );
}

function buildIncomeExplanation(artifact: TreasuryLongEndIncomeLensArtifactV1): string {
  const o = artifact.observations;
  return (
    `FRED long-end Treasury snapshot: 30Y nominal ${formatYieldPct(o.thirtyYearNominalYieldPct)}, ` +
    `30Y TIPS real ${formatYieldPct(o.thirtyYearTipsRealYieldPct)}, ` +
    `10Y breakeven ${formatOptionalYield(o.tenYearBreakevenInflationPct)}. ` +
    `Curve spreads 2s30s ${formatCurveSpreadPp(o.curve2s30sPct)}, 5s30s ${formatCurveSpreadPp(o.curve5s30sPct)}, ` +
    `10s30s ${formatCurveSpreadPp(o.curve10s30sPct)}. Display-only context; not scored.`
  );
}

export function buildTreasuryFuturesDisplayCard(
  validation: TreasuryFuturesPositioningValidation
): TreasuryPlumbingDisplayCard {
  const base = {
    id: TREASURY_FUTURES_POSITIONING_PROXY_SIGNAL_ID,
    title: TREASURY_FUTURES_DISPLAY_SIGNAL_NAME,
    badge: 'DISPLAY ONLY' as const,
    statusLabel: 'Public proxy · Weekly · Not scored',
    caveat: FUTURES_CAVEAT,
  };

  if (!validation.ok) {
    return {
      ...base,
      primaryValue: '—',
      explanation: 'Production artifact could not be validated for display.',
      status: 'unavailable',
      detailRows: [],
      validationErrors: validation.errors,
    };
  }

  const artifact = validation.artifact;
  const o = artifact.observations;

  const detailRows: TreasuryPlumbingDetailRow[] = [
    { label: 'Basket direction', value: formatTreasuryBasketDirectionLabel(o.basketDirection) },
    {
      label: 'Basket lev net % OI',
      value: `${o.basketLevMoneyNetPctOi.toFixed(1)}%`,
    },
    { label: 'Basket gross % OI', value: `${o.basketLevMoneyGrossPctOi.toFixed(1)}%` },
    { label: 'Core contracts', value: String(o.basketContractCount) },
    { label: 'As of', value: artifact.asOf },
    { label: 'Data quality', value: dataQualityLabel(artifact.dataQuality) },
  ];

  if (artifact.publishedAt) {
    detailRows.splice(detailRows.length - 1, 0, {
      label: 'Published',
      value: artifact.publishedAt,
    });
  }

  return {
    ...base,
    primaryValue: formatTreasuryFuturesPrimaryValue(o),
    explanation: buildFuturesExplanation(artifact),
    status: 'ok',
    detailRows,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    dataQuality: artifact.dataQuality,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
  };
}

export function buildTreasuryLongEndDisplayCard(
  validation: TreasuryLongEndIncomeLensValidation
): TreasuryPlumbingDisplayCard {
  const base = {
    id: TREASURY_LONG_END_INCOME_LENS_SIGNAL_ID,
    title: TREASURY_LONG_END_DISPLAY_SIGNAL_NAME,
    badge: 'DISPLAY ONLY' as const,
    statusLabel: 'Verified FRED · Daily · Not scored',
    caveat: INCOME_CAVEAT,
  };

  if (!validation.ok) {
    return {
      ...base,
      primaryValue: '—',
      explanation: 'Production artifact could not be validated for display.',
      status: 'unavailable',
      detailRows: [],
      validationErrors: validation.errors,
    };
  }

  const artifact = validation.artifact;
  const o = artifact.observations;

  const detailRows: TreasuryPlumbingDetailRow[] = [
    { label: '30Y nominal', value: formatYieldPct(o.thirtyYearNominalYieldPct) },
    { label: '30Y TIPS real', value: formatYieldPct(o.thirtyYearTipsRealYieldPct) },
    { label: '2s30s', value: formatCurveSpreadPp(o.curve2s30sPct) },
    { label: '5s30s', value: formatCurveSpreadPp(o.curve5s30sPct) },
    { label: '10s30s', value: formatCurveSpreadPp(o.curve10s30sPct) },
    { label: '10Y breakeven', value: formatOptionalYield(o.tenYearBreakevenInflationPct) },
    { label: 'As of', value: artifact.asOf },
    { label: 'Data quality', value: dataQualityLabel(artifact.dataQuality) },
  ];

  if (artifact.publishedAt) {
    detailRows.splice(detailRows.length - 1, 0, {
      label: 'Published',
      value: artifact.publishedAt,
    });
  }

  return {
    ...base,
    primaryValue: formatTreasuryLongEndPrimaryValue(o),
    explanation: buildIncomeExplanation(artifact),
    status: 'ok',
    detailRows,
    asOf: artifact.asOf,
    publishedAt: artifact.publishedAt,
    dataQuality: artifact.dataQuality,
    sourceName: artifact.source.name,
    sourceUrl: artifact.source.url,
  };
}

export function buildTreasuryPlumbingDisplayFromValidations(
  futuresValidation: TreasuryFuturesPositioningValidation,
  incomeValidation: TreasuryLongEndIncomeLensValidation
): TreasuryPlumbingDisplayData {
  return {
    sectionTitle: 'Treasury Plumbing',
    sectionSubtitle: SECTION_SUBTITLE,
    sectionIntro: SECTION_INTRO,
    microCaveats: [...MICRO_CAVEATS],
    cards: [
      buildTreasuryFuturesDisplayCard(futuresValidation),
      buildTreasuryLongEndDisplayCard(incomeValidation),
    ],
  };
}

export function buildTreasuryPlumbingDisplay(): TreasuryPlumbingDisplayData {
  return buildTreasuryPlumbingDisplayFromValidations(
    loadTreasuryFuturesPositioningProxyArtifact(),
    loadTreasuryLongEndIncomeLensArtifact()
  );
}
