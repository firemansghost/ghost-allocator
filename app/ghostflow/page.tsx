import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow v0.7: six manual public artifacts including StockCharts S&P 500 % above 50-day MA market breadth, grouped with a current-read summary, plus two illustrative mock proxy cards. CBOE VIX, ICI ETF issuance, ICI active/index flows, SSGA SPY top-10 concentration, and ICI fund/ETF index share proxy feed part of the score; remaining inputs are mock. Breadth is a participation proxy, not a crash signal. ICI proxy is not a market-wide passive-share estimate. Research only, not financial advice, not a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
