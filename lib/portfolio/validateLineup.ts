/**
 * Portfolio Lineup Validation
 * Guardrails to prevent duplicate tickers and other logic errors
 */

export interface LineupItem {
  type: 'sleeve' | 'tilt';
  id: string;
  label: string;
  ticker?: string;
  weight: number;
  etfs?: Array<{ ticker: string }>;
}

/**
 * Validate that no duplicate tickers exist in the lineup
 * Throws in dev, logs warning in prod
 */
export function validateNoDuplicateTickers(lineup: LineupItem[]): void {
  const tickerCounts = new Map<string, Array<{ source: string; weight: number }>>();

  for (const item of lineup) {
    // Check tilt ticker
    if (item.type === 'tilt' && item.ticker) {
      const existing = tickerCounts.get(item.ticker) || [];
      existing.push({ source: `tilt:${item.label}`, weight: item.weight });
      tickerCounts.set(item.ticker, existing);
    }

    // Check sleeve ETF tickers
    if (item.type === 'sleeve' && item.etfs) {
      for (const etf of item.etfs) {
        if (etf.ticker) {
          const existing = tickerCounts.get(etf.ticker) || [];
          existing.push({ source: `sleeve:${item.label}`, weight: item.weight });
          tickerCounts.set(etf.ticker, existing);
        }
      }
    }
  }

  // Find duplicates
  const duplicates: Array<{ ticker: string; sources: Array<{ source: string; weight: number }> }> = [];
  for (const [ticker, sources] of tickerCounts.entries()) {
    if (sources.length > 1) {
      duplicates.push({ ticker, sources });
    }
  }

  if (duplicates.length > 0) {
    const message = `Duplicate tickers found in lineup:\n${duplicates
      .map(
        (d) =>
          `  ${d.ticker} appears in: ${d.sources.map((s) => `${s.source} (${s.weight}%)`).join(', ')}`
      )
      .join('\n')}`;

    if (process.env.NODE_ENV === 'development') {
      throw new Error(message);
    } else {
      console.error('[Portfolio Validation]', message);
    }
  }
}

/**
 * Validate that weights sum to approximately 100%
 */
export function validateWeightSum(lineup: LineupItem[], tolerance = 0.1): void {
  const total = lineup.reduce((sum, item) => sum + item.weight, 0);
  const diff = Math.abs(total - 100);

  if (diff > tolerance) {
    const message = `Lineup weights sum to ${total.toFixed(2)}%, expected ~100% (diff: ${diff.toFixed(2)}%)`;

    if (process.env.NODE_ENV === 'development') {
      throw new Error(message);
    } else {
      console.warn('[Portfolio Validation]', message);
    }
  }
}
