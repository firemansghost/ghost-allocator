/**
 * 457(b) in 5 Minutes Component
 * Fast, scannable explanation of 457(b) retirement plans
 */

import { GlassCard } from '@/components/GlassCard';

export default function Four57InFiveMinutes() {
  return (
    <div id="in-5-minutes" className="scroll-mt-8">
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">457(b) in 5 Minutes</h2>
        
        <p className="text-sm text-zinc-300 leading-relaxed mb-4">
          A 457(b) is a retirement plan (common for government workers) that lets you invest pre-tax or Roth money for the long haul. It's boring on purpose — boring is how you retire without living on ramen.
        </p>

        {/* The 60-second version */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">The 60-second version</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
            <li>You pick a contribution % from each paycheck.</li>
            <li>Money goes into investments (funds/ETFs depending on your plan).</li>
            <li>You rebalance occasionally and avoid panic-selling like it's a hobby.</li>
            <li>Limits and catch-ups exist, but they change — check your plan/IRS each year.</li>
          </ul>
        </div>

        {/* Governmental vs non-governmental */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Governmental vs non-governmental (this matters)</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
            <li><strong className="text-zinc-200">Governmental 457(b)</strong> (most city/state plans): generally stronger protections and easier portability.</li>
            <li><strong className="text-zinc-200">Non-governmental 457(b)</strong> (some nonprofits): different rules and often higher risk if the employer has issues.</li>
            <li>If you don't know which you have, your plan documents will say.</li>
          </ul>
        </div>

        {/* Withdrawals */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Withdrawals (the part everyone cares about)</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
            <li><strong className="text-zinc-200">Governmental 457(b):</strong> generally no 10% early-withdrawal penalty when you take distributions (unlike many 401(k)/IRA situations).</li>
            <li>But: your plan still has rules on timing, paperwork, and payout options.</li>
            <li>
              <div className="mt-2 p-2 bg-amber-400/10 border border-amber-400/30 rounded">
                <p className="text-xs text-amber-300 font-semibold mb-1">Caution</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Important gotcha: if you roll a 457(b) into an IRA/401(k), you may inherit <em>their</em> withdrawal rules (including penalties).
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Catch-ups */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Catch-ups (aka 'the plan lets you make up for lost time')</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
            <li>Many plans allow catch-up contributions depending on age or proximity to retirement.</li>
            <li>Details vary — don't freestyle this. Confirm in your plan portal.</li>
          </ul>
        </div>

        {/* Common mistakes */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Common mistakes (don't be this guy)</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
            <li>Set it and forget it forever (no rebalance, no review).</li>
            <li>Panic sell after the market drops and 'lock in' the loss.</li>
            <li>Ignore fees and accidentally live in the highest-fee option.</li>
            <li>Roll it to an IRA without understanding rule changes.</li>
          </ul>
        </div>

        {/* Do this next */}
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Do this next (the checklist)</h3>
          <ol className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-decimal">
            <li>Set a contribution rate you can repeat.</li>
            <li>Pick a simple diversified mix (or use the Builder).</li>
            <li>Rebalance on a schedule (e.g., 1–2x/year), not based on vibes.</li>
          </ol>
        </div>

        {/* Optional closing */}
        <p className="text-[10px] text-zinc-500 italic mt-4 pt-3 border-t border-zinc-800">
          Education, not advice. You're still the adult in the room.
        </p>
      </GlassCard>
    </div>
  );
}
