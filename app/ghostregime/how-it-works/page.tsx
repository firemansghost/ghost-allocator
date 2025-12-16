/**
 * GhostRegime How It Works Page
 * Explains what GhostRegime is and how it works in beginner-friendly language
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">How GhostRegime Works</h1>
        <p className="text-sm text-zinc-300">
          Rules-based trend signals for portfolio exposure
        </p>
      </header>

      {/* What GhostRegime Is */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What GhostRegime Is</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime is a systematic, long-only system that uses rules-based trend signals to adjust 
            portfolio exposure. It's designed for low turnover and works automatically in the background.
          </p>
          <p>
            Think of it as a "real-time read of conditions" that helps you avoid the worst of bear markets 
            and catch most of bull markets. We're trying to be roughly right, not perfectly wrong.
          </p>
        </div>
      </GlassCard>

      {/* What It Is NOT */}
      <GlassCard className="p-6 border-red-400/30 bg-red-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What GhostRegime Is NOT</h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Not day trading — signals update daily, but you don't need to act every day</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Not predicting exact tops or bottoms — we aim for "near top / near bottom"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>Not a crystal ball — it's a systematic approach based on market conditions</span>
          </li>
        </ul>
      </GlassCard>

      {/* Two-Step Exposure Model */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Two-Step Exposure Model</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-amber-300 mb-2">1. Top-Down Overlay (Target Allocation)</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Based on Risk On/Off signals, stocks and BTC scale up or down. When Risk is On, 
              exposure increases. When Risk is Off, exposure decreases. This sets your target allocation.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-amber-300 mb-2">2. Bottom-Up VAMS (Actual Exposure)</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              VAMS (Volatility-Adjusted Momentum Score) can reduce your actual exposure to 100%, 50%, or 0% 
              of the target based on volatility. When volatility is high, exposure scales down automatically. 
              This protects you from the worst drawdowns.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Rebalancing Philosophy */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Rebalancing Philosophy</h2>
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          There's no single right answer for when to rebalance. We offer two simple options:
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
            <h3 className="text-xs font-semibold text-amber-300 mb-1">Option 1: Rebalance on Signal Change</h3>
            <p className="text-[11px] text-zinc-300">
              When the regime changes (e.g., Risk On → Risk Off), rebalance to match the new targets.
            </p>
          </div>
          <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
            <h3 className="text-xs font-semibold text-amber-300 mb-1">Option 2: Rebalance Monthly</h3>
            <p className="text-[11px] text-zinc-300">
              Check monthly and rebalance if targets have changed significantly (e.g., more than 5% difference).
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Key Promise */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <p className="text-sm text-zinc-200 leading-relaxed">
          <span className="font-semibold text-amber-300">Remember:</span>{' '}
          We're not trying to nail the exact top or bottom. We're trying to avoid the worst of bear markets 
          and catch most of bull markets through rules-based trend signals.
        </p>
      </GlassCard>

      {/* Disclaimer */}
      <GlassCard className="p-4 border-zinc-700 bg-zinc-900/40">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">Educational purposes only.</strong> All allocations and signals 
          are illustrations, not recommendations. Consult with a financial advisor before making investment decisions.
        </p>
      </GlassCard>

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/ghostregime"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          ← Back to GhostRegime
        </Link>
      </div>
    </div>
  );
}

