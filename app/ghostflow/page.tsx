import type { ReactNode } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostFlow: Passive Pressure Gauge - Ghost Allocator',
  description:
    'In-development market-structure dashboard: passive-flow pressure, ETF issuance, concentration, volatility mechanics, systematic-flow proxies, structural fragility. Education only; not live data; not financial advice.',
  path: '/ghostflow',
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassCard className="p-4 sm:p-6" id={id}>
      <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-3 tracking-tight">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3 max-w-3xl">{children}</div>
    </GlassCard>
  );
}

export default function GhostFlowPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-1 sm:px-0">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex text-sm text-amber-400/90 hover:text-amber-300 hover:underline decoration-amber-400/40"
        >
          ← Back to home
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">In development</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
          GhostFlow: Passive Pressure Gauge
        </h1>
        <p className="text-sm font-medium text-zinc-300 max-w-2xl">
          A market-structure dashboard for watching the mechanical bid underneath modern markets.
        </p>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          GhostFlow tracks passive-flow pressure, ETF issuance, passive share proxies, index concentration, volatility
          mechanics, systematic-flow proxies, and structural fragility. It does not predict crashes. It watches whether
          the market is becoming more reflexive, more mechanical, and less anchored to traditional price discovery.
        </p>
      </header>

      <Section id="tracks" title="What GhostFlow tracks">
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Passive share proxy</li>
          <li>ETF and fund-flow pressure</li>
          <li>Index concentration</li>
          <li>Breadth and market participation</li>
          <li>Volatility and options-market pressure</li>
          <li>CTA / vol-control / systematic-flow proxies</li>
          <li>Distance to model stress zones</li>
        </ul>
      </Section>

      <Section id="not" title="What GhostFlow does not claim">
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>It does not predict exact tops or bottoms.</li>
          <li>It does not reproduce proprietary Tier-1 alpha models.</li>
          <li>It does not treat the 65% passive-share zone as a guaranteed crash line.</li>
          <li>It does not provide buy/sell recommendations.</li>
        </ul>
        <p className="text-zinc-300 border-l-2 border-amber-500/35 pl-3 text-zinc-400">
          Think plumbing, not prophecy—pressure in the pipes, not a date for the flood.
        </p>
      </Section>

      <Section id="status" title="Build status">
        <p className="text-zinc-300">
          Static MVP in progress. Public-data methodology first; live feeds later. Nothing on this page is a promise of
          shipping dates or feature parity with a hypothetical v1.0.
        </p>
      </Section>

      <Section id="research" title="Research frame">
        <p className="text-zinc-300">
          GhostFlow is inspired by market-structure research on passive investing, price discovery, and volatility
          instability. The app will separate public-data signals from model-based estimates so you can see what is wired
          to open data versus what is interpretation.
        </p>
      </Section>

      <GlassCard className="p-4 sm:p-6 border-amber-400/25 bg-amber-400/5">
        <h2 className="text-base font-semibold text-zinc-100 mb-2 tracking-tight">Disclaimer</h2>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
          For education and research only. Not financial advice, not tax or legal advice, and not a substitute for your
          own judgment.
        </p>
      </GlassCard>
    </div>
  );
}
