import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow v0.6.3: five manual public artifacts grouped with a current-read summary, plus illustrative mock proxy cards. CBOE VIX, ICI ETF issuance, ICI active/index flows, SSGA SPY top-10 concentration, and ICI fund/ETF index share proxy feed part of the score; remaining inputs are mock. ICI proxy is not a market-wide passive-share estimate. Research only, not financial advice, not a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
