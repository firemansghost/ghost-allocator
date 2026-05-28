import { GlassCard } from '@/components/GlassCard';

const WATCH_TARGETS = [
  '0DTE / options volume',
  'CTA / vol-control proxy',
  'Levered ETF rebalance pressure — display-only artifact; mapping not final (v1.1e)',
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
          GhostFlow uses six public score artifacts, one derived score input (model-zone proximity from ICI index
          share), two display-only public artifacts (CFTC TFF positioning, levered ETF rebalance pressure), and three
          static mock score inputs in the research composite, plus one PLACEHOLDER signal card (0DTE) not yet in the
          score. Mapping for levered ETF rebalance (v1.1e) and score wiring (v1.1f) remain gated; CFTC score wiring is
          separately product-gated.
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
