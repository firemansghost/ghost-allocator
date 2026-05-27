import { GlassCard } from '@/components/GlassCard';

const WATCH_TARGETS = [
  '0DTE / options volume',
  'CTA / vol-control proxy',
  'Levered ETF AUM and rebalance estimates',
  'Retirement-flow pressure',
  'Bond neglect / income replacement lens',
  'HHI or effective-number concentration metric',
];

export function GhostFlowWatchlist() {
  return (
    <section className="space-y-3" aria-labelledby="ghostflow-watch-heading">
      <h2 id="ghostflow-watch-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        What to watch next
      </h2>
      <GlassCard className="p-4 sm:p-6">
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          GhostFlow v0.9b uses six manual public artifacts, one derived score input (model-zone proximity from ICI
          index share), and three static mock score inputs in the research composite, plus two PLACEHOLDER signal cards
          not yet in the score. Future work will replace remaining mock score inputs and
          placeholder cards one at a time, with source labels, freshness checks, and no proprietary assumptions.
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
