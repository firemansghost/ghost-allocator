import { GlassCard } from '@/components/GlassCard';

const WATCH_TARGETS = [
  'OCC index options intensity — display-only; Index/Others column; mapping not final (v1.4e)',
  'Index inclusion event proxy — display-only; Nasdaq-100 component changes; mapping not final (v1.9c.4)',
  'Cap-weight premium proxy — display-only; SPY/RSP spread/ratio; mapping not final (v1.9b.4)',
  'CTA / vol-control proxy',
  'Levered ETF rebalance pressure — display-only artifact; mapping not final (v1.1e)',
  'Retirement asset growth — display-only ICI quarterly artifact; mapping not final (v1.2e)',
  'Treasury Plumbing — shipped v1.7e as separate display-only lane (2 production cards); v1.7f kept unscored (no mapper/status bands); future: optional v1.7f-calibration / v1.7f.1 percentiles; v1.7g score gate not approved',
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
          share), six display-only public artifacts (CFTC TFF, levered ETF rebalance, retirement asset growth, OCC index
          options intensity, index inclusion event proxy, cap-weight premium proxy), and three static mock score inputs in the equity research composite ({`publicSignalCount`}{' '}
          12). Treasury Plumbing is a separate display-only lane — not in the equity signal grid or{' '}
          {`publicSignalCount`}. Options activity is not 0DTE/GEX and not score-fed — VIX remains the scored options/vol
          input. Retirement-flow pressure stays MOCK 58 (v1.2e display-only); levered mapping (v1.1e) and score wiring
          (v1.1f / v1.2f) remain product-gated; CFTC score wiring is separately gated.
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
