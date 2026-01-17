'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in dev only
    if (process.env.NODE_ENV === 'development') {
      console.error('Builder error:', error);
    }
  }, [error]);

  const handleCopyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      route: '/builder',
      message: error.message,
      name: error.name,
    };
    const text = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('Debug info copied to clipboard');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-50">
            Something went wrong generating your portfolio
          </h1>
          <p className="text-sm text-zinc-400">
            We encountered an error while building your portfolio. This shouldn't happen, but we've got you covered.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          >
            Back to Build
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/50 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            Try again
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 rounded-md border border-zinc-700 bg-zinc-900/50">
            <p className="text-xs text-zinc-400 mb-2">Debug info (dev only):</p>
            <button
              onClick={handleCopyDebugInfo}
              className="text-xs text-amber-300 hover:text-amber-200 underline"
            >
              Copy debug info
            </button>
            <pre className="mt-2 text-[10px] text-zinc-500 font-mono overflow-auto">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
