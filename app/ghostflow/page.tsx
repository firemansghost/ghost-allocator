import { GhostFlowDashboard } from '@/components/ghostflow/GhostFlowDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'GhostFlow tracks equity passive-flow pressure and structural fragility with 10 public signal cards in the research composite, plus a separate display-only Treasury Plumbing lane (not scored; not in publicSignalCount). Six score-fed public artifacts, one derived structural input, three mock score inputs, and four display-only equity cards. Includes educational passive-endgame scenarios — possible pathways, not predictions. Research and education only; not financial advice or a crash predictor.',
  path: '/ghostflow',
});

export default function GhostFlowPage() {
  return <GhostFlowDashboard />;
}
