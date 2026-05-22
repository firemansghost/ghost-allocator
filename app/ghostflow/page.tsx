import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow v0.4 mixed preview: manual CBOE VIX, ICI domestic equity ETF net issuance, and ICI domestic-equity active/index flow differential public artifacts plus static mock inputs for remaining passive-flow and structural fragility signals. Plumbing monitor — not live feeds, not financial advice, not a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
