import { GlassCard } from '@/components/GlassCard';

const WATCH_TARGETS = [
  'ICI active / index fund flows',
  'ICI ETF net issuance',
  'ETF creation / redemption data',
  'CBOE / OCC options volume',
  'VIX and volatility term structure',
  'S&P 500 concentration metrics',
  'Market breadth (advance/decline, % above MAs)',
  'Levered ETF AUM and rebalance estimates',
  'CTA / vol-control systematic-flow proxies',
];

export function GhostFlowWatchlist() {
  return (
    <section className="space-y-3" aria-labelledby="ghostflow-watch-heading">
      <h2 id="ghostflow-watch-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        What to watch next (future live-data targets)
      </h2>
      <GlassCard className="p-4 sm:p-6">
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          v0.1 uses mock proxies only. These are the first public-data candidates for a future refresh pipeline — wired
          one signal at a time, with source labels and no proprietary assumptions.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm text-zinc-300">
          {WATCH_TARGETS.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-amber-500/70 shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </section>
  );
}
