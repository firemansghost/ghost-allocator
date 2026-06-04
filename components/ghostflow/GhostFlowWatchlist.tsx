import { GlassCard } from '@/components/GlassCard';

const WATCH_TARGETS = [
  'OCC index options intensity — display-only; Index/Others column; mapping not final (v1.4e)',
  'CTA / vol-control proxy',
  'Levered ETF rebalance pressure — display-only artifact; mapping not final (v1.1e)',
  'Retirement asset growth — display-only ICI quarterly artifact; mapping not final (v1.2e)',
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
          share), four display-only public artifacts (CFTC TFF, levered ETF rebalance, retirement asset growth, OCC index
          options intensity), and three static mock score inputs in the research composite. Options activity is not 0DTE/GEX
          and not score-fed — VIX remains the scored options/vol input. Retirement-flow pressure stays MOCK 58 (v1.2e
          display-only); levered mapping
          (v1.1e) and score wiring (v1.1f / v1.2f) remain product-gated; CFTC score wiring is separately gated.
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
