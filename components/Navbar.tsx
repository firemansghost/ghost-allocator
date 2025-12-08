'use client';

import Link from 'next/link';
import { siteConfig } from '@/lib/siteConfig';

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-[11px] font-bold text-emerald-300">
            GA
          </div>
          <span>Ghost Allocator</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/why-60-40-dead"
            className="text-slate-300 hover:text-white"
          >
            Why 60/40?
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-slate-950 font-medium hover:bg-emerald-400"
          >
            Build Portfolio
          </Link>
        </div>
      </div>
    </nav>
  );
}

