import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Finance Basics - Coming Soon - Ghost Allocator',
  description: 'Foundational finance concepts explained in plain language.',
  path: '/learn/basics',
});

export default function LearnBasicsPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Finance Basics</h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Coming soon: Foundational finance concepts explained in plain language for first responders and
            normal humans.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
