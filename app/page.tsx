import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="flex flex-col items-center text-center pt-8 sm:pt-12 pb-4">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Build a modern portfolio for a post-60/40 world.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ETF-based portfolio building. No options trading required. Designed for choppy,
            inflationary, high-volatility markets — especially if you&apos;ve got a pension and a 457.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition"
          >
            Build My Portfolio
          </Link>
          <Link
            href="/why-60-40-dead"
            className="text-sm font-medium text-slate-300 hover:text-white underline-offset-4 hover:underline"
          >
            Why 60/40 Might Be Dead
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <p className="text-xs font-semibold text-emerald-400">Step 1</p>
            <h3 className="mt-2 text-sm font-semibold text-slate-50">Answer a few questions</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Tell us about your situation, risk tolerance, and whether you have a pension or other income floor.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <p className="text-xs font-semibold text-emerald-400">Step 2</p>
            <h3 className="mt-2 text-sm font-semibold text-slate-50">Get your allocation</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Ghost Allocator designs a Cem-inspired, ETF-only allocation tailored to your risk band and regime.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <p className="text-xs font-semibold text-emerald-400">Step 3</p>
            <h3 className="mt-2 text-sm font-semibold text-slate-50">See example ETFs</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Review sleeves and example ETFs you could use in a full brokerage account. No options chains required.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

