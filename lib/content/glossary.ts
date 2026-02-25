/**
 * Glossary Data
 * Definitions of key terms used across GhostRegime, Builder, and Learn.
 * Plain language for first responders. No personal advice.
 */

export type GlossaryCategory =
  | 'Basics'
  | 'Builder & 457'
  | 'Bonds & Rates'
  | 'Equities'
  | 'Macro'
  | 'GhostRegime';

export type GlossaryTerm = {
  id: string;
  term: string;
  category: GlossaryCategory;
  short: string;
  why: string;
  related?: string[];
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  {
    id: 'asset-allocation',
    term: 'Asset allocation',
    category: 'Basics',
    short: 'How you split your money across stocks, bonds, cash, and other assets.',
    why: 'Getting it wrong is the biggest driver of long-term returns—for better or worse.',
    related: ['diversification', 'rebalance'],
  },
  {
    id: 'diversification',
    term: 'Diversification',
    category: 'Basics',
    short: 'Spreading your money across different assets so one bad bet doesn’t sink you.',
    why: 'Reduces the chance that a single blowup wipes out your portfolio.',
    related: ['asset-allocation', 'correlation'],
  },
  {
    id: 'rebalance',
    term: 'Rebalance',
    category: 'Basics',
    short: 'Selling what’s up and buying what’s down to bring your mix back to target.',
    why: 'Keeps your risk profile from drifting into something you didn’t sign up for.',
    related: ['asset-allocation', 'volatility'],
  },
  {
    id: 'drawdown',
    term: 'Drawdown',
    category: 'Basics',
    short: 'How far your portfolio falls from peak to trough during a selloff.',
    why: 'The number that keeps you up at night—and the one you need to stomach for your chosen allocation.',
    related: ['volatility', 'risk-tolerance'],
  },
  {
    id: 'volatility',
    term: 'Volatility',
    category: 'Basics',
    short: 'How much prices swing up and down. Higher volatility = bumpier ride.',
    why: 'More volatility usually means bigger drawdowns—and more chances to panic-sell.',
    related: ['drawdown', 'risk-tolerance'],
  },
  {
    id: 'correlation',
    term: 'Correlation',
    category: 'Basics',
    short: 'How closely two assets move together. Low correlation = better diversification.',
    why: 'When stocks and bonds fall together, your “safe” assets don’t cushion.',
    related: ['diversification'],
  },
  {
    id: 'risk-tolerance',
    term: 'Risk tolerance',
    category: 'Basics',
    short: 'How much loss you can stomach without bailing out at the worst time.',
    why: 'Overestimating it leads to selling low in a crash—the worst mistake you can make.',
    related: ['drawdown', 'sequence-of-returns-risk'],
  },
  {
    id: 'sequence-of-returns-risk',
    term: 'Sequence of returns risk',
    category: 'Basics',
    short: 'The order of gains and losses matters. Early losses can wreck a retirement plan.',
    why: 'A crash near retirement can permanently shrink your nest egg—even if long-term returns look fine.',
    related: ['drawdown', 'risk-tolerance'],
  },
  {
    id: 'liquidity',
    term: 'Liquidity',
    category: 'Basics',
    short: 'How easily you can cash out without moving the price or waiting.',
    why: 'Illiquid assets can trap you when you need money fast.',
    related: ['stable-value'],
  },

  // Builder & 457
  {
    id: '457b',
    term: '457(b)',
    category: 'Builder & 457',
    short: 'A retirement plan for government and some nonprofit workers. Contributions are tax-deferred.',
    why: 'If you have one, it’s usually your best savings vehicle.',
    related: ['governmental-vs-non-governmental-457b', 'contribution-rate'],
  },
  {
    id: 'governmental-vs-non-governmental-457b',
    term: 'Governmental vs non-governmental 457(b)',
    category: 'Builder & 457',
    short: 'Governmental plans are backed by the employer; non-governmental are not. Different rules.',
    why: 'Non-governmental plans can be riskier—your money isn’t always safe if the employer goes under.',
    related: ['457b'],
  },
  {
    id: 'contribution-rate',
    term: 'Contribution rate',
    category: 'Builder & 457',
    short: 'The percentage of your income you put into a retirement plan each paycheck.',
    why: 'The single biggest lever for building wealth—time in market helps, but saving more helps more.',
    related: ['457b'],
  },
  {
    id: 'income-floor',
    term: 'Income floor',
    category: 'Builder & 457',
    short: 'A guaranteed income stream (pension, Social Security) that covers basic expenses.',
    why: 'With a floor, you can afford to take more risk with the rest of your portfolio.',
    related: ['risk-tolerance'],
  },
  {
    id: 'brokeragelink',
    term: 'BrokerageLink (Schwab slice)',
    category: 'Builder & 457',
    short: 'A self-directed brokerage option inside some 457 plans that lets you buy ETFs and stocks.',
    why: 'Expands your fund menu beyond what the plan offers—useful when the default options are limited.',
    related: ['inside-slice-allocation'],
  },
  {
    id: 'inside-slice-allocation',
    term: 'Inside-slice allocation',
    category: 'Builder & 457',
    short: 'Percent of the Voya portion vs percent of the Schwab portion—each slice sums to 100.',
    why: 'The Builder shows what goes in each bucket; your actual split depends on your questionnaire.',
    related: ['brokeragelink'],
  },
  {
    id: 'expense-ratio',
    term: 'Expense ratio',
    category: 'Builder & 457',
    short: 'The annual fee a fund charges, expressed as a percentage of assets.',
    why: 'High fees eat returns over time. Low-cost index funds usually win.',
    related: ['index-fund'],
  },
  {
    id: 'stable-value',
    term: 'Stable value',
    category: 'Builder & 457',
    short: 'A low-risk option in many 457 plans that aims to preserve principal and earn a bit above cash.',
    why: 'Useful for the defensive portion of your portfolio when you want something safer than bonds.',
    related: ['liquidity'],
  },

  // Bonds & Rates
  {
    id: 'duration',
    term: 'Duration',
    category: 'Bonds & Rates',
    short: 'A measure of how sensitive a bond’s price is to interest rate changes. Higher = more sensitive.',
    why: 'When rates rise, long-duration bonds get hit harder.',
    related: ['yield-curve', 'short-duration'],
  },
  {
    id: 'real-yield',
    term: 'Real yield',
    category: 'Bonds & Rates',
    short: 'Nominal yield minus inflation. What you actually earn after inflation.',
    why: 'Negative real yields mean your bonds are losing purchasing power.',
    related: ['nominal-yield'],
  },
  {
    id: 'nominal-yield',
    term: 'Nominal yield',
    category: 'Bonds & Rates',
    short: 'The stated yield on a bond before adjusting for inflation.',
    why: 'Looks good until you subtract inflation—then real returns can be ugly.',
    related: ['real-yield'],
  },
  {
    id: 'yield-curve',
    term: 'Yield curve',
    category: 'Bonds & Rates',
    short: 'A plot of bond yields from short to long maturities. Inverted = short rates above long.',
    why: 'An inverted curve often signals recession risk—and can distort allocation decisions.',
    related: ['duration', 't-bills'],
  },
  {
    id: 'credit-spread',
    term: 'Credit spread',
    category: 'Bonds & Rates',
    short: 'The extra yield you get for taking riskier bonds over Treasuries.',
    why: 'Widening spreads mean the market is nervous about defaults.',
    related: ['core-bonds'],
  },
  {
    id: 't-bills',
    term: 'T-Bills',
    category: 'Bonds & Rates',
    short: 'Short-term U.S. Treasury debt: very low risk, very liquid.',
    why: 'The “cash” portion of many portfolios—safe, but low return.',
    related: ['short-duration', 'yield-curve'],
  },
  {
    id: 'core-bonds',
    term: 'Core bonds (Agg)',
    category: 'Bonds & Rates',
    short: 'Broad bond index (e.g. Bloomberg U.S. Aggregate) covering government and investment-grade corporate bonds.',
    why: 'The default “bond” portion of a 60/40—diversified, but still sensitive to rates.',
    related: ['duration', 'credit-spread'],
  },
  {
    id: 'short-duration',
    term: 'Short duration',
    category: 'Bonds & Rates',
    short: 'Bonds with short maturities—less sensitive to rate changes than long bonds.',
    why: 'When rates rise, short duration keeps you from getting crushed.',
    related: ['duration', 't-bills'],
  },

  // Equities
  {
    id: 'index-fund',
    term: 'Index fund',
    category: 'Equities',
    short: 'A fund that tracks a market index (e.g. S&P 500) instead of trying to beat it.',
    why: 'Low cost, broad diversification, and most active managers fail to beat them over time.',
    related: ['expense-ratio'],
  },
  {
    id: 'value-vs-growth',
    term: 'Value vs growth',
    category: 'Equities',
    short: 'Value: cheap stocks; growth: expensive stocks with high expected earnings.',
    why: 'Different styles perform at different times—diversification across both can help.',
    related: ['quality-factor'],
  },
  {
    id: 'quality-factor',
    term: 'Quality factor',
    category: 'Equities',
    short: 'Stocks with strong profitability, low debt, and stable earnings.',
    why: 'Quality tends to hold up better in downturns—less junk, more resilience.',
    related: ['value-vs-growth'],
  },
  {
    id: 'smallcap-midcap',
    term: 'Small-cap / mid-cap',
    category: 'Equities',
    short: 'Companies smaller than large-cap (S&P 500). More volatile, sometimes higher return.',
    why: 'Adds diversification beyond mega-caps—but expect a bumpier ride.',
    related: ['index-fund'],
  },
  {
    id: 'international-equity',
    term: 'International equity',
    category: 'Equities',
    short: 'Stocks from outside the U.S. Developed and emerging markets.',
    why: 'U.S. won’t always outperform—diversification across regions reduces home-country bias.',
    related: ['diversification'],
  },

  // Macro
  {
    id: 'inflation-disinflation-deflation',
    term: 'Inflation vs disinflation vs deflation',
    category: 'Macro',
    short: 'Inflation: prices rising. Disinflation: inflation slowing. Deflation: prices falling.',
    why: 'Each regime favors different assets—bonds, stocks, and cash behave differently.',
    related: ['real-yield', 'regime'],
  },
  {
    id: 'monetary-debasement',
    term: 'Monetary debasement',
    category: 'Macro',
    short: 'When the central bank prints money so fast that the currency loses value.',
    why: 'Drives inflation and can trash nominal bonds—real assets often hold up better.',
    related: ['inflation-disinflation-deflation', 'qe-qt'],
  },
  {
    id: 'financial-repression',
    term: 'Financial repression',
    category: 'Macro',
    short: 'Policy that keeps rates low (below inflation) so governments can service debt cheaply.',
    why: 'Savers get screwed; borrowers (including governments) win.',
    related: ['real-yield'],
  },
  {
    id: 'dollar-dominance',
    term: 'Dollar dominance',
    category: 'Macro',
    short: 'The U.S. dollar as the world’s reserve currency and primary settlement medium.',
    why: 'Affects global liquidity, trade, and why Fed policy matters everywhere.',
    related: ['eurodollars'],
  },
  {
    id: 'eurodollars',
    term: 'Eurodollars',
    category: 'Macro',
    short: 'U.S. dollars held outside the U.S. in an unregulated, reserveless system.',
    why: 'The real plumbing of global finance—most of the world’s dollar liquidity lives here.',
    related: ['dollar-dominance'],
  },
  {
    id: 'qe-qt',
    term: 'QE / QT',
    category: 'Macro',
    short: 'Quantitative easing: Fed buys bonds to inject liquidity. QT: reverse, selling bonds to drain it.',
    why: 'Massive moves in liquidity that ripple through asset prices and volatility.',
    related: ['monetary-debasement'],
  },

  // GhostRegime
  {
    id: 'regime',
    term: 'Regime (GhostRegime)',
    category: 'GhostRegime',
    short: 'A market regime: GOLDILOCKS, REFLATION, INFLATION, or DEFLATION—based on risk and inflation signals.',
    why: 'Different regimes favor different allocations; GhostRegime helps you tune exposure.',
    related: ['risk-on-risk-off', 'targets-scales-actual'],
  },
  {
    id: 'risk-on-risk-off',
    term: 'Risk On / Risk Off',
    category: 'GhostRegime',
    short: "GhostRegime's shorthand for whether markets are acting brave or scared.",
    why: 'Drives whether you scale up or down equity exposure.',
    related: ['regime', 'targets-scales-actual'],
  },
  {
    id: 'targets-scales-actual',
    term: 'Targets vs Scales vs Actual',
    category: 'GhostRegime',
    short: 'Targets: baseline weights. Scales: how much to take today (full/half/off). Actual: target × scale.',
    why: 'The gap between target and actual often shows up as cash until you rebalance.',
    related: ['regime', 'vams'],
  },
  {
    id: 'vams',
    term: 'VAMS (vol-adjusted max size)',
    category: 'GhostRegime',
    short: 'A rule that scales exposure based on volatility—higher vol = lower exposure.',
    why: 'Reduces the chance you’re overexposed when things get wild.',
    related: ['targets-scales-actual', 'throttle'],
  },
  {
    id: 'throttle',
    term: 'Throttle (BTC throttle)',
    category: 'GhostRegime',
    short: 'A limit on how much exposure to take (e.g. Bitcoin) when signals are uncertain.',
    why: 'Prevents you from going all-in on a volatile asset when the signal is weak.',
    related: ['vams'],
  },
  {
    id: 'receipts',
    term: 'Receipts (signals / rules)',
    category: 'GhostRegime',
    short: 'A record of each signal’s vote and rule—e.g. “SPY trend → Risk On (+1)”.',
    why: 'Shows transparency: what drove the regime and why.',
    related: ['regime', 'risk-on-risk-off'],
  },
];
