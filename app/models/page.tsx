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
    'Implementable templates using real OKC Voya funds. Conservative, Moderate, and Aggressive models for Voya-only and Voya+Schwab accounts.',
  path: '/models',
});

export default function ModelsPage() {
  return <ModelsPageContent />;
}
