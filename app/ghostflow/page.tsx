import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow research composite preview: six score-fed public artifacts, one derived structural input, three mock score inputs, and four display-only public cards (10 public signals when artifacts validate; zero placeholder cards). Includes educational passive-endgame scenarios — possible pathways, not predictions. ICI index share is a public proxy; model-stress zones are not tripwires. Research and education only; not financial advice or a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
