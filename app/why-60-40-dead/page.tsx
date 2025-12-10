import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';

export default function Why6040Page() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        {/* Intro card */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Is the 60/40 Portfolio Dead?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            The classic 60% stocks / 40% bonds playbook was built for a world of falling interest
            rates, globalization, and tame inflation. That world has changed.
          </p>
        </GlassCard>

        {/* Old vs new regime */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">From tailwinds to turbulence</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            For roughly four decades, 60/40 rode a powerful set of macro tailwinds. Today, many of
            those forces are running in reverse.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                1982–2021: Old regime
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-200 leading-relaxed">
                <li><span className="font-semibold">Falling rates:</span> bond prices rose for decades as yields dropped.</li>
                <li><span className="font-semibold">Globalization:</span> cheap labor and efficient supply chains kept inflation low.</li>
                <li><span className="font-semibold">Central bank backstops:</span> rate cuts and QE rescued both stocks and bonds.</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                2022 and beyond: New regime
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-200 leading-relaxed">
                <li><span className="font-semibold">Inflation returned:</span> prices rose, forcing central banks to hike aggressively.</li>
                <li><span className="font-semibold">Higher yields:</span> rising rates pushed bond prices down instead of up.</li>
                <li><span className="font-semibold">Deglobalization & conflict:</span> supply shocks and geopolitical tension added friction and volatility.</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Problems now */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-50">Why 60/40 struggles in this regime</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-4 sm:p-5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Problem 1
              </p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-50">
                Bonds aren&apos;t the same &quot;safe&quot; diversifier
              </h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                In a stagflationary or high-inflation regime, bonds can lose value at the same time
                as stocks. The negative correlation that made 60/40 work can break down.
              </p>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Problem 2
              </p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-50">Weak diversification</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                When inflation spikes or central banks tighten policy, stocks and bonds can move
                together (positive correlation), eliminating the diversification benefit.
              </p>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Problem 3
              </p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-50">
                Sequence-of-returns risk for retirees
              </h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Retirees drawing down their portfolios are especially vulnerable when both asset
                classes fall at once, as they did in 2022.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* New playbook */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">A new playbook for a choppier world</h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Modern portfolios need more than just &quot;stocks and bonds.&quot; Think in sleeves: value and
            quality equity, real assets, T–Bills and short duration, managed futures, and crisis /
            rate-hedge ETFs that act as brakes during volatility.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-200 leading-relaxed">
            <li><span className="font-semibold">Value & quality equity:</span> focus on strong balance sheets and reasonable valuations.</li>
            <li><span className="font-semibold">Real assets:</span> gold, commodities, and resource equities for inflation protection.</li>
            <li><span className="font-semibold">T–Bills / short duration:</span> liquidity with limited interest-rate risk.</li>
            <li><span className="font-semibold">Managed futures / trend-following:</span> can profit in both rising and falling markets.</li>
            <li><span className="font-semibold">Crisis / rate-hedge ETFs:</span> behave like brakes without you having to trade options directly.</li>
          </ul>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Ghost Allocator takes this sleeve-based approach and maps it onto the actual funds and ETFs available in plans like OKCFD&apos;s Voya 457 and Schwab BrokerageLink.
          </p>
          <div className="mt-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40"
            >
              See your modern allocation
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
