'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { useClipboardCopy } from '@/lib/builder/useClipboardCopy';
import {
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@/lib/content/glossary';

const CATEGORIES: (GlossaryCategory | 'All')[] = [
  'All',
  'Basics',
  'Builder & 457',
  'Bonds & Rates',
  'Equities',
  'Macro',
  'GhostRegime',
];

function searchMatches(term: GlossaryTerm, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    term.term.toLowerCase().includes(q) ||
    term.short.toLowerCase().includes(q) ||
    term.why.toLowerCase().includes(q)
  );
}

function categoryMatches(term: GlossaryTerm, category: GlossaryCategory | 'All'): boolean {
  if (category === 'All') return true;
  return term.category === category;
}

export function GlossaryContent() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All');

  const filtered = useMemo(() => {
    return GLOSSARY_TERMS.filter(
      (t) => searchMatches(t, search) && categoryMatches(t, category)
    );
  }, [search, category]);

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Glossary</h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Definitions of key terms used across GhostRegime, Builder, and Learn. Plain language for
            first responders—no jargon, no fluff.
          </p>
        </GlassCard>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            aria-label="Search glossary terms"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  category === cat
                    ? 'bg-amber-400 text-black'
                    : 'border border-zinc-600 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Term cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <GlassCard className="p-6 text-center text-zinc-400 text-sm">
              No terms match your search. Try a different query or category.
            </GlassCard>
          ) : (
            filtered.map((term) => (
              <TermCard key={term.id} term={term} />
            ))
          )}
        </div>

        {/* Next step CTA */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Next step</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
            Now use this stuff in the real app — build a plan and sanity-check it with GhostRegime.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
            >
              Build your plan →
            </Link>
            <Link
              href="/ghostregime"
              className="inline-flex items-center rounded-md border border-zinc-600 text-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-500 transition min-h-[44px]"
            >
              Check GhostRegime →
            </Link>
          </div>
          <p className="mt-3">
            <Link
              href="/learn/457"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Learn 457 basics →
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

function TermCard({ term }: { term: GlossaryTerm }) {
  const [copied, copyLink] = useClipboardCopy();
  const termIds = new Set(GLOSSARY_TERMS.map((t) => t.id));
  const relatedTerms = (term.related || []).filter((id) => termIds.has(id));

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/learn/glossary#${term.id}`;
    await copyLink(url);
  };

  return (
    <GlassCard id={term.id} className="p-5 sm:p-6 scroll-mt-24">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-50">{term.term}</h2>
            <span className="rounded-full bg-zinc-700/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              {term.category}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{term.short}</p>
          <p className="mt-2 text-xs text-zinc-400 italic">
            Why it matters: {term.why}
          </p>
          {relatedTerms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {relatedTerms.map((id) => {
                const related = GLOSSARY_TERMS.find((t) => t.id === id);
                if (!related) return null;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="inline-flex items-center rounded-md border border-zinc-600 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-amber-300 hover:border-amber-400/60 hover:bg-zinc-700/60 transition"
                  >
                    {related.term}
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={handleCopyLink}
          className="flex-shrink-0 p-2 rounded-lg border border-zinc-600 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition"
          aria-label={copied ? 'Link copied' : 'Copy link to this term'}
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? (
            <span className="text-[10px] text-amber-400">✓</span>
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </GlassCard>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
