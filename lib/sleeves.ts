import type { Sleeve, ExampleETF, ModelPortfolio, RiskLevel } from './types';

export const sleeveDefinitions: Record<string, Omit<Sleeve, 'weight'>> = {
  core_equity: {
    id: 'core_equity',
    name: 'Core Equity (Value & Quality)',
    description: 'Broad market equity exposure with a focus on value and quality factors. Provides foundational growth potential while maintaining some defensive characteristics.',
  },
  convex_equity: {
    id: 'convex_equity',
    name: 'Convex Equity (Options-Overlay ETFs)',
    description: 'Equity ETFs that embed options strategies to provide downside protection and enhanced risk-adjusted returns. No direct options trading required.',
  },
  real_assets: {
    id: 'real_assets',
    name: 'Real Assets',
    description: 'Gold, commodities, and resource equities that provide inflation protection and diversification away from financial assets.',
  },
  t_bills: {
    id: 't_bills',
    name: 'T-Bills / Short Duration',
    description: 'Short-term Treasury bills and similar instruments providing liquidity and stability with minimal interest rate risk.',
  },
  core_bonds: {
    id: 'core_bonds',
    name: 'Core Bonds',
    description: 'Traditional bond exposure for income and diversification, though with reduced weight compared to classic 60/40 portfolios.',
  },
  managed_futures: {
    id: 'managed_futures',
    name: 'Managed Futures / Trend Following',
    description: 'Systematic trend-following strategies that can profit in both rising and falling markets, providing true diversification.',
  },
  rate_hedge: {
    id: 'rate_hedge',
    name: 'Rate Hedge / Crisis Protection',
    description: 'ETFs designed to hedge against rising rates and market crises, acting as portfolio "brakes" during volatile periods.',
  },
  cash: {
    id: 'cash',
    name: 'Cash',
    description: 'Cash reserves for liquidity and optionality, allowing you to take advantage of opportunities during market dislocations.',
  },
};

export const exampleETFs: ExampleETF[] = [
  {
    ticker: 'SPYV',
    name: 'SPDR Portfolio S&P 500 Value ETF',
    description: 'Large-cap value equity exposure',
    sleeveId: 'core_equity',
  },
  {
    ticker: 'QUAL',
    name: 'iShares MSCI USA Quality Factor ETF',
    description: 'Quality-focused equity exposure',
    sleeveId: 'core_equity',
  },
  {
    ticker: 'SPYC',
    name: 'Simplify US Equity PLUS Convexity ETF',
    description: 'S&P 500 exposure with built-in options overlay for downside protection',
    sleeveId: 'convex_equity',
  },
  {
    ticker: 'GLD',
    name: 'SPDR Gold Trust',
    description: 'Physical gold exposure for inflation protection',
    sleeveId: 'real_assets',
  },
  {
    ticker: 'DBC',
    name: 'Invesco DB Commodity Index Tracking Fund',
    description: 'Broad commodity exposure',
    sleeveId: 'real_assets',
  },
  {
    ticker: 'SHV',
    name: 'iShares Short Treasury Bond ETF',
    description: 'Short-term Treasury bills',
    sleeveId: 't_bills',
  },
  {
    ticker: 'BIL',
    name: 'SPDR Bloomberg 1-3 Month T-Bill ETF',
    description: 'Ultra-short Treasury bills',
    sleeveId: 't_bills',
  },
  {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    description: 'Broad bond market exposure',
    sleeveId: 'core_bonds',
  },
  {
    ticker: 'DBMF',
    name: 'iMGP DBi Managed Futures Strategy ETF',
    description: 'Managed futures / trend-following strategy',
    sleeveId: 'managed_futures',
  },
  {
    ticker: 'KMLM',
    name: 'KFA Mount Lucas Managed Futures Index Strategy ETF',
    description: 'Systematic trend-following',
    sleeveId: 'managed_futures',
  },
  {
    ticker: 'SHY',
    name: 'iShares 1-3 Year Treasury Bond ETF',
    description: 'Short-duration Treasury bonds as rate hedge',
    sleeveId: 'rate_hedge',
  },
];

export const modelPortfolios: ModelPortfolio[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk, higher allocation to defensive assets and cash. Suitable for those near retirement or with low risk tolerance.',
    riskLevel: 1,
    sleeves: [
      { ...sleeveDefinitions.core_equity, weight: 0.20 },
      { ...sleeveDefinitions.convex_equity, weight: 0.10 },
      { ...sleeveDefinitions.real_assets, weight: 0.15 },
      { ...sleeveDefinitions.t_bills, weight: 0.20 },
      { ...sleeveDefinitions.core_bonds, weight: 0.15 },
      { ...sleeveDefinitions.managed_futures, weight: 0.10 },
      { ...sleeveDefinitions.rate_hedge, weight: 0.05 },
      { ...sleeveDefinitions.cash, weight: 0.05 },
    ],
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced allocation across asset classes. Designed for investors with medium-term horizons and moderate risk tolerance.',
    riskLevel: 3,
    sleeves: [
      { ...sleeveDefinitions.core_equity, weight: 0.30 },
      { ...sleeveDefinitions.convex_equity, weight: 0.15 },
      { ...sleeveDefinitions.real_assets, weight: 0.15 },
      { ...sleeveDefinitions.t_bills, weight: 0.10 },
      { ...sleeveDefinitions.core_bonds, weight: 0.10 },
      { ...sleeveDefinitions.managed_futures, weight: 0.12 },
      { ...sleeveDefinitions.rate_hedge, weight: 0.05 },
      { ...sleeveDefinitions.cash, weight: 0.03 },
    ],
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher equity allocation with strategic use of convexity and real assets. For investors with longer horizons and higher risk tolerance.',
    riskLevel: 5,
    sleeves: [
      { ...sleeveDefinitions.core_equity, weight: 0.35 },
      { ...sleeveDefinitions.convex_equity, weight: 0.20 },
      { ...sleeveDefinitions.real_assets, weight: 0.15 },
      { ...sleeveDefinitions.t_bills, weight: 0.05 },
      { ...sleeveDefinitions.core_bonds, weight: 0.05 },
      { ...sleeveDefinitions.managed_futures, weight: 0.15 },
      { ...sleeveDefinitions.rate_hedge, weight: 0.03 },
      { ...sleeveDefinitions.cash, weight: 0.02 },
    ],
  },
  {
    id: 'retirement',
    name: 'Retirement / Capital Preservation',
    description: 'Designed for retirees focused on capital preservation with income generation. Higher allocation to defensive assets and income-producing sleeves.',
    riskLevel: 2,
    sleeves: [
      { ...sleeveDefinitions.core_equity, weight: 0.15 },
      { ...sleeveDefinitions.convex_equity, weight: 0.10 },
      { ...sleeveDefinitions.real_assets, weight: 0.15 },
      { ...sleeveDefinitions.t_bills, weight: 0.25 },
      { ...sleeveDefinitions.core_bonds, weight: 0.20 },
      { ...sleeveDefinitions.managed_futures, weight: 0.08 },
      { ...sleeveDefinitions.rate_hedge, weight: 0.05 },
      { ...sleeveDefinitions.cash, weight: 0.07 },
    ],
  },
];







