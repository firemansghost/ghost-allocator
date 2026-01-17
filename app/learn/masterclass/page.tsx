import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { MASTERCLASS_ITEMS, MMM_SERIES_URL, type MasterclassCategory } from '@/lib/content/masterclass';

export const metadata: Metadata = buildMetadata({
  title: 'Macro Mayhem Masterclass - Ghost Allocator',
  description: 'A curated learning series breaking down the monetary system from basics to advanced topics.',
  path: '/learn/masterclass',
});

const categoryLabels: Record<MasterclassCategory, string> = {
  Foundations: 'Foundations',
  'Dollar Plumbing': 'Dollar Plumbing',
  'Fed & Liquidity': 'Fed & Liquidity',
  Inflation: 'Inflation',
  'Crypto & Policy': 'Crypto & Policy',
  Other: 'Other',
};

export default function MasterclassPage() {
  // Get "Start Here" items (sorted by startHereOrder)
  const startHereItems = MASTERCLASS_ITEMS.filter((item) => item.startHereOrder !== undefined)
    .sort((a, b) => (a.startHereOrder || 0) - (b.startHereOrder || 0));

  // Group all items by category
  const itemsByCategory = MASTERCLASS_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<MasterclassCategory, typeof MASTERCLASS_ITEMS>
  );

  // Sort categories in display order
  const categoryOrder: MasterclassCategory[] = [
    'Foundations',
    'Dollar Plumbing',
    'Fed & Liquidity',
    'Inflation',
    'Crypto & Policy',
    'Other',
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        {/* Header */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Macro Mayhem Masterclass
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            A curated learning series breaking down the monetary system from basics to advanced topics.
            Deep dives into money, banking, the Fed, and the global dollar system—all in plain language.
          </p>
          <div className="mt-4">
            <a
              href={MMM_SERIES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
            >
              Browse the Masterclass on Substack →
            </a>
          </div>
        </GlassCard>

        {/* Start Here section */}
        {startHereItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-50">Start Here</h2>
            <div className="space-y-3">
              {startHereItems.map((item) => (
                <GlassCard key={item.id} className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                          {item.startHereOrder}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-50">{item.title}</h3>
                        <span className="text-xs text-zinc-500">{item.date}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-3">{item.blurb}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {item.substackUrl ? (
                        <a
                          href={item.substackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[36px]"
                        >
                          Read on Substack →
                        </a>
                      ) : (
                        <a
                          href={MMM_SERIES_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[36px]"
                        >
                          Browse on Substack →
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {/* Category browse section */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-zinc-50">Browse by Category</h2>
          {categoryOrder.map((category) => {
            const items = itemsByCategory[category] || [];
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">
                  {categoryLabels[category]}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <GlassCard key={item.id} className="p-4 sm:p-5">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-zinc-50">{item.title}</h4>
                          <span className="text-xs text-zinc-500 flex-shrink-0">{item.date}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{item.blurb}</p>
                        <div className="pt-2">
                          {item.substackUrl ? (
                            <a
                              href={item.substackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
                            >
                              Read on Substack →
                            </a>
                          ) : (
                            <a
                              href={MMM_SERIES_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
                            >
                              Browse on Substack →
                            </a>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
