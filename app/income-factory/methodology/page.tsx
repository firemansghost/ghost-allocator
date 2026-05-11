import type { ReactNode } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'GhostYield Methodology - Ghost Allocator',
  description:
    'How GhostYield works: Risk Score and Fit Score bands, Data QA vs investment risk, yield display order, NAV and premium/discount, CEF and BDC metrics, score drivers, and manual snapshot limitations.',
  path: '/income-factory/methodology',
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

export default function GhostYieldMethodologyPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto px-1 sm:px-0">
      <nav aria-label="Breadcrumb">
        <Link
          href="/income-factory"
          className="inline-flex text-sm text-amber-400/90 hover:text-amber-300 hover:underline decoration-amber-400/40"
        >
          ← Back to GhostYield
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">GhostYield Methodology</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Plain-English reference for the GhostYield yield-sleeve dashboard. This page describes the current v0.1 model;
          it does not change how scores are calculated.
        </p>
      </header>

      <Section id="what" title="What GhostYield is">
        <p className="text-zinc-300">
          GhostYield is a{' '}
          <strong className="text-zinc-200 font-medium">yield sleeve research dashboard</strong> for comparing
          income-producing funds that might sit around an existing portfolio. It helps you line up yield{' '}
          <em>sources</em>, NAV behavior, payout quality, and data quality—not just the headline number.
        </p>
        <p>
          It is <strong className="text-zinc-300">not</strong> a full portfolio builder and <strong className="text-zinc-300">not</strong> a
          recommendation engine. It does not know your goals, tax picture, or the rest of your holdings.
        </p>
      </Section>

      <Section id="not" title="What GhostYield is not">
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Not buy/sell advice or a timing signal</li>
          <li>Not personalized financial, legal, or tax advice</li>
          <li>Not a promise that high yield equals high total return</li>
          <li>Not live market data or a data feed product</li>
          <li>Not a substitute for sponsor documents, SEC filings, tax research, or your own due diligence</li>
        </ul>
      </Section>

      <Section id="three-ideas" title="The three big ideas">
        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
          <li>
            <strong className="text-zinc-200">Yield source matters.</strong> The same percentage can mean bonds, options
            overwrite, leverage, return of capital, or something else entirely.
          </li>
          <li>
            <strong className="text-zinc-200">NAV behavior matters.</strong> For wrappers with a NAV, the path of net
            asset value is part of the honesty check on distributions.
          </li>
          <li>
            <strong className="text-zinc-200">Data quality matters.</strong> A row can be &ldquo;interesting&rdquo; and
            still have stale or incomplete fields—and vice versa.
          </li>
        </ol>
        <p className="text-zinc-200 border-l-2 border-amber-500/35 pl-3 italic text-zinc-300">
          Yield is not magic. It is usually compensation for some kind of risk.
        </p>
      </Section>

      <Section id="risk-score" title="Risk Score">
        <p>
          <strong className="text-zinc-200">Risk Score</strong> runs from <strong className="text-zinc-200">0–100</strong>.
          Higher means the model sees <strong className="text-zinc-200">riskier sleeve characteristics</strong> for that
          row—not a prediction of the future, and not the same as Data QA.
        </p>
        <p>The model considers factors such as:</p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300">
          <li>Headline yield / distribution level (where keyed)</li>
          <li>Sleeve type and structural complexity</li>
          <li>NAV trend versus distributions</li>
          <li>Leverage (including structured BDC debt/equity and CEF effective leverage where present)</li>
          <li>Premium or discount to NAV where applicable</li>
          <li>Payout quality label from the snapshot</li>
          <li>Expense burden (including CEF expense ratio total when structured)</li>
          <li>Data confidence and source complexity cues</li>
          <li>Missing NAV, stale lineage, or other snapshot penalties</li>
          <li>Optional <code className="text-amber-400/90 text-xs">cefMetrics</code> and{' '}
            <code className="text-amber-400/90 text-xs">bdcMetrics</code> when present on a row</li>
        </ul>
        <p className="text-zinc-300">
          <strong className="text-zinc-200">Bands:</strong> 0–24 Low · 25–49 Moderate · 50–69 Elevated · 70–84 High ·
          85–100 Extreme
        </p>
        <p>
          Risk Score is <strong className="text-zinc-200">not a forecast</strong>. Think of it as a structured warning
          system: a way to sort sleeves by how much structural and payout stress the current GhostYield rules associate
          with the row.
        </p>
      </Section>

      <Section id="fit-score" title="Fit Score">
        <p>
          <strong className="text-zinc-200">Fit Score</strong> runs from <strong className="text-zinc-200">0–100</strong>.
          Higher means a <strong className="text-zinc-200">cleaner fit as a satellite yield sleeve</strong> under this
          model—not &ldquo;you should buy this.&rdquo;
        </p>
        <p>The model nudges fit up or down based on things like:</p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300">
          <li>Clarity / simplicity of the yield story (within the row text)</li>
          <li>Whether headline yield sits in a &ldquo;reasonable&rdquo; band versus extreme carry</li>
          <li>Stronger distribution quality labels</li>
          <li>Stable or positive NAV trend where NAV is available</li>
          <li>Discount/premium context for sleeves that price off NAV</li>
          <li>Expense ratio and data confidence</li>
          <li>Sleeve role (e.g. cash-like ballast vs more complex sleeves)</li>
          <li>BDC dividend coverage and first-lien tilt when structured metrics exist</li>
          <li>
            CEF discount—only when payout quality is not weak and NAV trend is not badly deteriorating (per model rules)
          </li>
        </ul>
        <p className="text-zinc-300">
          <strong className="text-zinc-200">Bands:</strong> 85–100 Strong Fit · 70–84 Good Fit · 50–69 Watchlist Fit ·
          below 50 Weak Fit
        </p>
        <p>
          <strong className="text-zinc-200">High fit does not mean &ldquo;buy.&rdquo;</strong> It means the row has a
          cleaner profile under the current GhostYield rules and cited snapshot—not a verdict on your personal situation.
        </p>
      </Section>

      <Section id="data-qa" title="Data QA / source and data quality">
        <p>
          <strong className="text-zinc-200">Data QA is not investment risk.</strong> It describes how complete and fresh
          the <em>manual row</em> is: lineage dates, missing fields, illustrative rows, and similar flags.
        </p>
        <p>It reflects things like:</p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300">
          <li>How complete the keyed fields are for that ticker in the snapshot</li>
          <li>How fresh NAV and distribution as-of dates are versus the dashboard reference date</li>
          <li>Whether a source URL and source label are present</li>
          <li>Whether values are tied to cited sources (fields stay null when not verifiable)</li>
        </ul>
        <p className="text-zinc-200 border-l-2 border-zinc-600 pl-3">
          Fresh data does not mean a safe investment. Data gaps do not mean a bad fund.
        </p>
        <p>
          Use Data QA together with Risk Score—they answer different questions. One is snapshot hygiene; the other is
          modeled sleeve stress.
        </p>
      </Section>

      <Section id="yield-display" title="How the Yield column picks a number">
        <p>The screener uses the best available <strong className="text-zinc-200">sourced</strong> metric, in order:</p>
        <ol className="list-decimal list-inside space-y-1 text-zinc-300">
          <li>
            <strong className="text-zinc-200">currentYield</strong> when set
          </li>
          <li>
            else <strong className="text-zinc-200">distributionRate</strong>
          </li>
          <li>
            else <strong className="text-zinc-200">secYield</strong>
          </li>
        </ol>
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>
            Current yield is usually tied to <strong className="text-zinc-200">market price</strong> where the source supports
            it.
          </li>
          <li>
            Distribution rate may follow <strong className="text-zinc-200">fund or issuer definitions</strong>; read the
            row&apos;s source notes carefully.
          </li>
          <li>
            SEC yield can be more standardized for many ETFs/funds but may not exist for every CEF or listed BDC row.
          </li>
          <li>
            For listed BDCs, NAV-based distribution rates appear in the model with clear labeling in the detail panel when
            applicable.
          </li>
        </ul>
      </Section>

      <Section id="nav" title="NAV and premium / discount">
        <p>
          Where a fund has a meaningful NAV, GhostYield treats NAV as part of the{' '}
          <strong className="text-zinc-200">honesty check</strong> on high yield.
        </p>
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Market price can move because sentiment and flows are noisy.</li>
          <li>NAV summarizes the underlying portfolio value on a per-share basis (per sponsor or filing definitions).</li>
          <li>Premium or discount shows whether the listed price is above or below last keyed NAV.</li>
          <li>
            A <strong className="text-zinc-200">discount is not automatically a bargain</strong>; it can reflect real
            problems or tax complexity.
          </li>
          <li>
            A <strong className="text-zinc-200">premium is not automatically &ldquo;bad,&rdquo;</strong> but it raises
            squeeze and mean-reversion risk in the model.
          </li>
        </ul>
      </Section>

      <Section id="cef-metrics" title="CEF-specific metrics">
        <p>
          Some closed-end rows include structured <code className="text-amber-400/90 text-xs">cefMetrics</code>, for
          example:
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300">
          <li>Effective leverage</li>
          <li>Premium / discount (mirrored alongside generic fields)</li>
          <li>Distribution rate and frequency context</li>
          <li>Total expense ratio (structured)</li>
          <li>Coverage ratio, UNII per share</li>
          <li>Managed distribution policy, return-of-capital note (when sourced)</li>
        </ul>
        <p>
          CEFs can combine <strong className="text-zinc-200">leverage</strong> and{' '}
          <strong className="text-zinc-200">managed distribution policies</strong>, so headline yield without context can
          mislead. The detail panel groups these fields under CEF-specific metrics.
        </p>
      </Section>

      <Section id="bdc-metrics" title="BDC-specific metrics">
        <p>
          Listed BDC rows may include structured <code className="text-amber-400/90 text-xs">bdcMetrics</code>, for
          example:
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300">
          <li>NAV per share and dividend amounts</li>
          <li>NII per share and dividend coverage</li>
          <li>Debt / equity</li>
          <li>Non-accruals</li>
          <li>First-lien exposure and portfolio yield at fair value (when sourced)</li>
          <li>Management structure notes</li>
        </ul>
        <p>
          BDCs are <strong className="text-zinc-200">operating lending companies</strong>, not generic ETFs. Dividend
          coverage and credit-quality metrics belong in the conversation alongside headline yield.
        </p>
      </Section>

      <Section id="score-drivers" title="Score drivers">
        <p>
          The candidate detail panel lists <strong className="text-zinc-200">Score drivers</strong>: short explanations
          of the largest contributors to Risk Score and Fit Score for that row under the current rules.
        </p>
        <p className="text-zinc-200 border-l-2 border-amber-500/35 pl-3">
          These drivers explain the model score. They are not buy/sell signals.
        </p>
      </Section>

      <Section id="manual-snapshot" title="Manual research snapshot">
        <p>
          GhostYield v0.1 ships with manually maintained rows in{' '}
          <code className="text-amber-400/90 text-xs">data/ghostyield/candidates.manual.json</code>.
        </p>
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Live price feeds and automated scraping are not part of this release.</li>
          <li>Automated source validation is not running; humans key what the citation supports.</li>
          <li>Unverified values stay null rather than guessed.</li>
          <li>
            Each row&apos;s <code className="text-amber-400/90 text-xs">sourceUrl</code> and{' '}
            <code className="text-amber-400/90 text-xs">sourceLabel</code> explain provenance.
          </li>
          <li>
            Some CEF figures cite CEF Connect–style summaries as <strong className="text-zinc-200">interim secondary</strong>{' '}
            context; always confirm against the fund&apos;s own materials.
          </li>
        </ul>
      </Section>

      <Section id="limitations" title="Limitations">
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Data can go stale the day after it is keyed.</li>
          <li>Sponsor sites change, paywalls happen, and not every field is always available.</li>
          <li>Tax character, ROC breakdown, and full fund coverage usually require documents beyond this page.</li>
          <li>Scores are only as good as the cited snapshot and the current rule set.</li>
          <li>
            The dashboard does not know your full portfolio, tax rate, liquidity needs, time horizon, or risk tolerance.
          </li>
        </ul>
      </Section>

      <GlassCard className="p-4 sm:p-6 border-amber-500/25 bg-amber-950/10">
        <h2 className="text-base font-semibold text-zinc-100 mb-3">Final note</h2>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
          GhostYield is built to <strong className="text-zinc-200">slow down the yield chase</strong>. It helps separate
          income opportunity from yield-trap theater, but it does not replace your judgment—or your homework.
        </p>
        <p className="mt-6">
          <Link
            href="/income-factory"
            className="text-sm text-amber-400/90 hover:text-amber-300 hover:underline decoration-amber-400/40"
          >
            ← Back to GhostYield
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
