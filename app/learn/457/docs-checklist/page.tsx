import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: '457 Plan Docs Checklist - Ghost Allocator',
  description: 'A field guide for collecting 457 plan documents: what to obtain, where to look, and what facts to extract.',
  path: '/learn/457/docs-checklist',
});

export default function Learn457DocsChecklistPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <Link
          href="/learn"
          className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1 -mt-2"
        >
          ← Back to Learn
        </Link>

        {/* Header */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            457 Plan Docs Checklist
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            The fastest way to turn &quot;Coming Soon&quot; into an actual plan-specific playbook.
          </p>
          <p className="mt-2 text-xs text-zinc-500 italic">
            Education only. Verify everything with HR or your plan provider.
          </p>
        </GlassCard>

        {/* Where to look first */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Where to look first</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-zinc-200">Plan provider portal</strong> (Voya / MissionSquare / Empower / etc.) → &quot;Plan Documents&quot; or &quot;Disclosures&quot;
            </li>
            <li>
              <strong className="text-zinc-200">HR / benefits intranet</strong>
            </li>
            <li>
              <strong className="text-zinc-200">Payroll / benefits office</strong> — ask for the specific doc names below
            </li>
            <li>
              <strong className="text-zinc-200">Union or association</strong> — if they manage benefits, they may have copies
            </li>
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            <strong className="text-zinc-300">Search terms:</strong> SPD, 404a-5, fee disclosure, stable value, self-directed brokerage, BrokerageLink, distribution form
          </p>
        </GlassCard>

        {/* The actual checklist */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-50">The checklist</h2>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">1. Summary Plan Description (SPD) / Plan Highlights</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: The plan&apos;s rulebook — governmental vs non-governmental, Roth, catch-ups, distributions.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Governmental vs non-governmental 457(b)</li>
              <li>Roth option (yes/no)</li>
              <li>Special 457 catch-up rules (if offered) + constraints — verify current IRS limits</li>
              <li>In-service withdrawal rules (if any)</li>
              <li>Loan availability (if any)</li>
              <li>Distribution rules at separation (timing, options)</li>
              <li>Rollover options allowed</li>
              <li>Beneficiary / death benefit basics</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Distribution rules, Contribution + workflow
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">2. 404a-5 Fee Disclosure (or equivalent plan fee disclosure)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: Shows what you&apos;re actually paying — admin fees, fund expense ratios.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Administrative fees (annual / quarterly / per participant)</li>
              <li>Fund expense ratios (core menu)</li>
              <li>Any additional fees for brokerage / self-directed window</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Voya Menu Reality (fees), Common mistakes
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">3. Core Fund Lineup (fact sheets or lineup PDF)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: The actual menu — what you can buy in the core plan.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Fund names + tickers (if applicable) + expense ratios</li>
              <li>Stable value fund name + restrictions doc reference</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Voya Menu Reality (fund list placeholders)
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">4. Stable Value Fund rules / restrictions (often separate PDF)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: Stable value has gotchas — equity wash, transfer limits.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Equity wash / competing fund restrictions</li>
              <li>Transfer limits or holding periods</li>
              <li>Any special rules (market value adjustment, etc.)</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Voya Menu Reality, Common mistakes
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">5. Self-directed brokerage / BrokerageLink rules (if offered)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: Sweep mechanics, minimums, timing — the stuff that breaks your workflow if you get it wrong.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Eligibility / enrollment steps</li>
              <li>Minimum balance required</li>
              <li>Contribution / sweep mechanics and timing</li>
              <li>Restrictions (what can / can&apos;t be bought)</li>
              <li>Fees for brokerage window</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Schwab Sweep Reality section placeholders
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">6. Distribution / withdrawal forms + rules doc (separation packet)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: How to actually get your money out when you separate.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>How to request distributions</li>
              <li>Required minimum distribution policy (RMDs)</li>
              <li>Partial vs full distributions</li>
              <li>Rollover process / check payable rules</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Distribution rules & pitfalls
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-amber-300">7. Beneficiary / QDRO / divorce procedures (if relevant)</h3>
            <p className="mt-1 text-xs text-zinc-400">Why it matters: Admin gotchas — where beneficiary is set, QDRO process.</p>
            <p className="mt-2 text-xs font-medium text-zinc-300">What to extract:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Where beneficiary is set / changed</li>
              <li>QDRO contact / process</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              → <Link href="/learn/457/okc" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">OKC playbook</Link>: Common mistakes or Admin gotchas
            </p>
          </GlassCard>
        </section>

        {/* What to send / paste */}
        <GlassCard className="p-5 sm:p-6 border-amber-400/30">
          <h2 className="text-lg font-semibold text-zinc-50">What to send / what to paste</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            The exact stuff we need so we can populate the OKC playbook quickly:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            <li>Provider name + portal link</li>
            <li>Core fund lineup PDF</li>
            <li>Fee disclosure PDF</li>
            <li>Stable value restrictions PDF</li>
            <li>Brokerage window guide PDF (if any)</li>
            <li>Distribution rules packet</li>
          </ul>
        </GlassCard>

        {/* Next step CTA */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Next step</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
            Once you have the docs, we&apos;ll fill in the OKC-specific blanks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/learn/457/okc"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
            >
              Open OKC playbook template →
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-md border border-zinc-600 text-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-500 transition min-h-[44px]"
            >
              Build your plan →
            </Link>
          </div>
          <p className="mt-3">
            <Link
              href="/learn"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Back to Learn →
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
