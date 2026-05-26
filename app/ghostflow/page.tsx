import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow research composite preview: six manual public artifacts (VIX, breadth, ETF issuance, active/index flows, concentration, ICI index share) plus four static mock score inputs. Two PLACEHOLDER signal cards are not in the score. Not a market-wide passive-share estimate. Research only, not financial advice, not a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
