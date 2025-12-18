/**
 * GhostRegime Methodology Page
 * Documentation stub for Option B voting, VAMS, satellites, etc.
 */

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">GhostRegime Methodology</h1>
        <p className="text-sm text-zinc-300">
          Documentation for regime classification and allocation system
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-xl border border-amber-50/15 bg-neutral-900/60 backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">Coming Soon</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Detailed methodology documentation will be available here, including:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300 list-disc list-inside">
            <li>Option B voting rules and thresholds</li>
            <li>VAMS calculation methodology</li>
            <li>Satellite processing and decay formulas</li>
            <li>Allocation target logic</li>
            <li>Flip watch and persistence guard</li>
            <li>Stress override conditions</li>
          </ul>
        </div>
      </div>

      <div className="pt-4">
        <a
          href="/ghostregime"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          ← Back to GhostRegime
        </a>
      </div>
    </div>
  );
}




