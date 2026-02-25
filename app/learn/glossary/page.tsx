import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { GlossaryContent } from './GlossaryContent';

export const metadata: Metadata = buildMetadata({
  title: 'Glossary - Ghost Allocator',
  description:
    'Definitions of key terms used across GhostRegime, Builder, and Learn. Plain language for first responders.',
  path: '/learn/glossary',
});

export default function LearnGlossaryPage() {
  return <GlossaryContent />;
}
