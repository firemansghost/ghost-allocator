/**
 * Model Portfolios Page
 * Implementable templates for Voya-only and Voya+Schwab accounts.
 * Display-only; does not modify builder behavior or lib/modelPortfolios.ts.
 */

import { ModelsPageContent } from './ModelsPageContent';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Model Portfolios - Ghost Allocator',
  description:
    'Starting templates with real OKC Voya funds — Voya Only or Voya + Schwab. Use Builder for a personalized split; models show inside-slice fund and ETF mixes for education only.',
  path: '/models',
});

export default function ModelsPage() {
  return <ModelsPageContent />;
}
