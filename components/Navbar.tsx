'use client';

import Link from 'next/link';
import { siteConfig } from '@/lib/siteConfig';

export function Navbar() {
  return (
    <nav className="border-b border-amber-50/10 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/10 text-[11px] font-bold text-amber-300">
            GA
          </div>
          <span>Ghost Allocator</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/why-60-40-dead"
            className="text-zinc-300 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            Why 60/40?
          </Link>
          <Link
            href="/learn"
            className="text-zinc-300 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            Learn
          </Link>
          <Link
            href="/ghostregime"
            className="text-zinc-300 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            GhostRegime
          </Link>
          <Link
            href="/models"
            className="text-zinc-300 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            Models
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-black shadow-md shadow-amber-400/40 hover:bg-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px] flex items-center"
          >
            Build Portfolio
          </Link>
        </div>
      </div>
    </nav>
  );
}

