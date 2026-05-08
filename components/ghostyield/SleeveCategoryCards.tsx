'use client';

import { GlassCard } from '@/components/GlassCard';
import type { GhostYieldCategoryMeta } from '@/lib/ghostyield/types';

export function SleeveCategoryCards({ categories }: { categories: GhostYieldCategoryMeta[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((c) => (
        <GlassCard
          key={c.id}
          className={`p-3 sm:p-4 ${c.comingSoon ? 'border-amber-500/25 bg-amber-950/20' : ''}`}
        >
          <h3 className="text-sm font-semibold text-zinc-100">{c.label}</h3>
          {c.comingSoon ? (
            <p className="mt-2 text-xs font-medium text-amber-300/90 uppercase tracking-wide">
              Coming soon
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{c.blurb}</p>
        </GlassCard>
      ))}
    </div>
  );
}
