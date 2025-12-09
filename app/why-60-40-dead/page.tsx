import Link from 'next/link';

export default function Why6040Page() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-8 pb-8">
        <header className="space-y-2 pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Is the 60/40 Portfolio Dead?
          </h1>
          <p className="text-sm text-slate-300">
            Why the classic 60% stocks / 40% bonds playbook might not cut it in a stagflationary,
            high-volatility world.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">What is 60/40?</h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            The 60/40 portfolio is a classic investment strategy: 60% stocks and 40% bonds. It became
            the default recommendation for millions of investors because it offered a simple balance
            between growth (stocks) and stability (bonds).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Why it worked (1982–2021)</h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            For nearly four decades, 60/40 delivered strong returns with manageable risk. Several
            tailwinds made this possible:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            <li>
              <span className="font-semibold">Falling interest rates:</span> From the early 1980s
              through 2020, bond prices rose as rates fell, providing both income and capital appreciation.
            </li>
            <li>
              <span className="font-semibold">Globalization:</span> Expanding global trade and
              manufacturing efficiency kept inflation low and corporate profits high.
            </li>
            <li>
              <span className="font-semibold">Central bank backstops:</span> When markets wobbled,
              central banks stepped in with rate cuts and quantitative easing, supporting both stocks
              and bonds.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Why the regime changed</h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            The environment that made 60/40 successful has shifted:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            <li>
              <span className="font-semibold">Inflation returned:</span> After decades of low inflation,
              prices began rising, eroding purchasing power and forcing central banks to raise rates.
            </li>
            <li>
              <span className="font-semibold">Higher interest rates:</span> Rising rates mean falling
              bond prices, turning bonds from a safe haven into a source of losses.
            </li>
            <li>
              <span className="font-semibold">Deglobalization:</span> Trade tensions and supply chain
              disruptions have reversed some of the deflationary forces that helped 60/40.
            </li>
            <li>
              <span className="font-semibold">2022 wake-up call:</span> Both stocks and bonds dropped
              simultaneously, something that wasn&apos;t supposed to happen in a 60/40 portfolio.
            </li>
          </ul>
        </section>

        <section className="space-y-3 border-l border-emerald-500/40 pl-4">
          <h2 className="text-lg font-semibold">Problems with 60/40 now</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Bonds aren&apos;t the same &quot;safe&quot; diversifier
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                In a stagflationary or high-inflation regime, bonds can lose value just like stocks.
                The negative correlation that made 60/40 work has broken down.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <h3 className="text-sm font-semibold text-slate-50">Weak diversification</h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                When inflation spikes or central banks tighten policy, stocks and bonds can move together
                (positive correlation), eliminating the diversification benefit.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <h3 className="text-sm font-semibold text-slate-50">Sequence-of-returns risk for retirees</h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Retirees drawing down their portfolios are especially vulnerable when both asset classes
                fall at once, as happened in 2022.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">A high-level alternative</h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Modern portfolio construction needs more sleeves than just stocks and bonds:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            <li>
              <span className="font-semibold">Value &amp; quality equity:</span> Focus on companies
              with strong fundamentals and reasonable valuations.
            </li>
            <li>
              <span className="font-semibold">Real assets:</span> Gold, commodities, and resource
              equities provide inflation protection and diversification away from financial assets.
            </li>
            <li>
              <span className="font-semibold">T-Bills / short duration:</span> Cash and short-term
              Treasuries for liquidity and stability with minimal interest rate risk.
            </li>
            <li>
              <span className="font-semibold">Managed futures / trend-following:</span> Systematic
              strategies that can profit in both rising and falling markets.
            </li>
            <li>
              <span className="font-semibold">Crisis / rate-hedge ETFs:</span> ETFs that act as
              &quot;brakes&quot; during volatile periods, often using embedded options strategies
              (no direct options trading required).
            </li>
          </ul>
        </section>

        <div className="pb-4 pt-2">
          <Link
            href="/onboarding"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline"
          >
            See your modern allocation
          </Link>
        </div>
      </div>
    </div>
  );
}
