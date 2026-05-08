import { GhostYieldDashboard } from '@/components/ghostyield/GhostYieldDashboard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostYield: Yield Sleeve Risk Dashboard',
  description:
    'GhostYield — research dashboard for yield sleeves: sources of income, NAV behavior, distribution quality, and caution flags. Not financial advice; static sample data in Phase 1.',
  path: '/income-factory',
});

export default function IncomeFactoryPage() {
  return <GhostYieldDashboard />;
}
