/**
 * Drawdown Reality Check Component
 * Educational component showing historical drawdown examples to explain why disciplined risk management matters
 */

export type DrawdownRealityCheckVariant = 'full' | 'compact';

interface DrawdownRealityCheckProps {
  variant?: DrawdownRealityCheckVariant;
}

export default function DrawdownRealityCheck({ variant = 'full' }: DrawdownRealityCheckProps) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
        <li>
          <strong className="text-zinc-200">1929–1932:</strong> U.S. stocks (Dow) fell about{' '}
          <strong className="text-amber-300">89%</strong>, and it took until{' '}
          <strong className="text-amber-300">1954</strong> to regain the 1929 high.
        </li>
        <li>
          <strong className="text-zinc-200">Dot-com (2000–2002):</strong> Nasdaq-100 fell about{' '}
          <strong className="text-amber-300">82%</strong>, and didn't fully recover until{' '}
          <strong className="text-amber-300">2015</strong>.
        </li>
        <li>
          <strong className="text-zinc-200">GFC (2007–2009):</strong> S&P 500 fell about{' '}
          <strong className="text-amber-300">57%</strong> from peak to trough, and cleared the 2007 closing high in{' '}
          <strong className="text-amber-300">2013</strong>.
        </li>
      </ul>
      {variant === 'full' && (
        <p className="text-xs text-amber-300 italic mt-3 pt-3 border-t border-zinc-700">
          That's why GhostRegime exists: not to be 'right' — to keep you from getting wrecked.
        </p>
      )}
    </div>
  );
}
