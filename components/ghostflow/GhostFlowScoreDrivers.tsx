import { GlassCard } from '@/components/GlassCard';

export function GhostFlowScoreDrivers() {
  return (
    <section className="space-y-3" aria-labelledby="ghostflow-drivers-heading">
      <h2 id="ghostflow-drivers-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        What would move this score?
      </h2>
      <GlassCard className="p-4 sm:p-6 space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed max-w-4xl">
          The research composite rises when mechanical pressure and structural fragility proxies move higher, and cools
          when they ease. This is sensitivity context for the preview model—not a forecast, allocation signal, or crash
          prediction.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 text-sm leading-relaxed">
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90 mb-2">
              Would push the composite higher
            </h3>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Public measured / manual artifacts
            </p>
            <ul className="space-y-1 text-zinc-300 text-xs list-disc list-inside">
              <li>Stronger domestic equity ETF net issuance (ICI weekly)</li>
              <li>Higher VIX close → higher volatility amplifier proxy (CBOE daily)</li>
              <li>Weaker breadth participation → higher breadth weakness proxy (StockCharts daily)</li>
              <li>Higher top-10 index concentration (SSGA SPY monthly)</li>
              <li>Higher ICI fund/ETF index-share proxy (monthly assets)</li>
              <li>More index-tilted active/index flow differential (ICI monthly flows)</li>
            </ul>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Static mock assumptions in the composite today
            </p>
            <ul className="space-y-1 text-zinc-400 text-xs list-disc list-inside">
              <li>Higher systematic strategy pressure placeholder</li>
              <li>Higher retirement-flow pressure placeholder</li>
              <li>Higher levered ETF rebalance pressure placeholder</li>
              <li>Higher model-zone proximity placeholder</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-700/50 bg-neutral-950/40 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-300 mb-2">
              Would cool the composite down
            </h3>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Public measured / manual artifacts
            </p>
            <ul className="space-y-1 text-zinc-300 text-xs list-disc list-inside">
              <li>Softer or negative domestic equity ETF issuance</li>
              <li>Lower VIX → lower volatility amplifier proxy</li>
              <li>Broader participation → lower breadth weakness proxy</li>
              <li>Lower index concentration</li>
              <li>Lower ICI index-share proxy reading</li>
              <li>Active flows outpacing index flows in the monthly differential</li>
            </ul>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Static mock assumptions in the composite today
            </p>
            <ul className="space-y-1 text-zinc-400 text-xs list-disc list-inside">
              <li>Lower systematic, retirement-flow, levered-ETF, or model-zone placeholders</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-amber-300/85 leading-relaxed border-t border-zinc-800/80 pt-3">
          Because this is a research preview, several inputs are static mock assumptions. In a live version, measured
          systematic-flow, retirement-flow, and levered-ETF data would replace those placeholders.
        </p>
      </GlassCard>
    </section>
  );
}
