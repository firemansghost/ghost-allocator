/**
 * Bonds FAQ Component
 * Explains why bonds appear in a "post-60/40" portfolio
 */

export default function BondsFAQ() {
  return (
    <details className="mt-4 pt-4 border-t border-zinc-700 group">
      <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded">
        <h3 className="text-xs font-semibold text-zinc-300 inline-flex items-center gap-2 hover:text-zinc-200 transition-colors">
          <span className="text-xs text-zinc-500 group-open:rotate-90 transition-transform">
            ▶
          </span>
          FAQ: Why are there bonds in a "post-60/40" portfolio?
        </h3>
      </summary>
      <div className="mt-3 space-y-4 text-xs text-zinc-300 leading-relaxed">
        <div>
          <p className="font-semibold text-zinc-200 mb-1">
            Q: I thought "post-60/40" means no bonds. Why are there bonds here?
          </p>
          <p className="text-zinc-400">
            A: "Post-60/40" doesn't mean "ban bonds." It means we don't rely on a big, long-duration bond bucket as the main hedge like the classic 60/40 playbook did. We still use bonds more selectively — mostly for stability, liquidity, and rebalancing fuel — while other sleeves do more of the inflation/regime work.
          </p>
        </div>

        <div>
          <p className="font-semibold text-zinc-200 mb-1">
            Q: Why do I see bonds on both the Voya side and the Schwab side?
          </p>
          <p className="text-zinc-400">
            A: Because the portfolio is built in sleeves across two platforms. The Voya menu often provides the main "ballast" options. The Schwab side may still include short-duration and diversified bond ETFs as tools for liquidity and shock absorption — not as the centerpiece.
          </p>
        </div>

        <div>
          <p className="font-semibold text-zinc-200 mb-1">
            Q: What jobs do the different bond sleeves do?
          </p>
          <p className="text-zinc-400">
            A: They can serve different roles:
          </p>
          <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-zinc-400 ml-2">
            <li>T-Bills / ultra-short: cash-like liquidity and dry powder</li>
            <li>Short Treasuries: "ballast" that can help in risk-off moments</li>
            <li>Core bonds: broad fixed-income exposure for stability (used in smaller size here)</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-zinc-200 mb-1">
            Q: Does this guarantee protection in every crash?
          </p>
          <p className="text-zinc-400">
            A: No. Nothing does. The goal is to avoid putting all your defensive hopes in one place and to keep the "safety sleeve" from becoming the problem when rates move.
          </p>
        </div>

        <p className="text-[10px] text-zinc-500 italic mt-3 pt-2 border-t border-zinc-800">
          This is educational, not advice — it's explaining why the sleeves exist, not predicting the future.
        </p>
      </div>
    </details>
  );
}
