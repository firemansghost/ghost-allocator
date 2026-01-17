import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Glossary - Coming Soon - Ghost Allocator',
  description: 'Definitions of key terms and concepts.',
  path: '/learn/glossary',
});

export default function LearnGlossaryPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Glossary</h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Coming soon: Definitions of key terms and concepts used throughout Ghost Allocator and the
            Macro Mayhem Masterclass.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
