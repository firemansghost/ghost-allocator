/**
 * Macro Mayhem Masterclass Data
 * Manual list of Masterclass items with real titles and dates from archive.
 * Do NOT parse the archive file at runtime - this is a manually maintained list.
 */

export type MasterclassCategory =
  | 'Foundations'
  | 'Dollar Plumbing'
  | 'Fed & Liquidity'
  | 'Inflation'
  | 'Crypto & Policy'
  | 'Other';

export type MasterclassItem = {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  category: MasterclassCategory;
  startHereOrder?: number; // 1..N for curated sequence
  blurb: string; // 1–2 sentence "why you care"
  substackUrl?: string; // optional; can be missing until provided
};

export const TWIMM_SUBSTACK_HOME = 'https://grayghost.substack.com/';
export const MMM_SERIES_URL =
  'https://grayghost.substack.com/s/special-editions-macro-mayhem-masterclass';

export const MASTERCLASS_ITEMS: MasterclassItem[] = [
  {
    id: 'money-101',
    date: '2024-09-24',
    title: 'Money 101',
    category: 'Foundations',
    startHereOrder: 1,
    blurb:
      "Money is more than paper—it's a tool for settling payments, physical or digital. The system runs entirely on trust; without it, we're back to bartering chickens.",
  },
  {
    id: 'what-is-a-bank',
    date: '2024-10-11',
    title: 'What is a Bank',
    category: 'Foundations',
    startHereOrder: 2,
    blurb:
      'A modern bank is less a vault, more a digital ledger. Bank runs now happen via apps, not queues on the sidewalk.',
  },
  {
    id: 'eurodollars',
    date: '2024-09-27',
    title: 'Eurodollars',
    category: 'Dollar Plumbing',
    startHereOrder: 3,
    blurb:
      "US dollars held outside the US in an unregulated, reserveless system. They provide crucial liquidity for global trade and make the US dollar the world's reserve currency.",
  },
  {
    id: 'inflation-101',
    date: '2024-10-01',
    title: 'Inflation 101',
    category: 'Inflation',
    startHereOrder: 4,
    blurb:
      'Real inflation = too much money chasing the same goods. Fakeflation = temporary price hikes from supply shocks.',
  },
  {
    id: 'fed-files',
    date: '2025-04-25',
    title: 'The Fed Files',
    category: 'Fed & Liquidity',
    startHereOrder: 5,
    blurb:
      'The most powerful, least understood institution in modern economics. Fed tools include rate manipulation, QE/QT, and emergency lending.',
  },
  {
    id: 'dollar-strength-vs-dominance',
    date: '2025-04-20',
    title: 'Dollar Strength vs. Dollar Dominance',
    category: 'Dollar Plumbing',
    startHereOrder: 6,
    blurb:
      'Strength is short-term price moves. Dominance is structural power—the dollar as the global reserve currency.',
  },
  {
    id: 'qe-qt',
    date: '2025-05-10',
    title: 'QE/QT: Laundromat Tokens, Scaffolding & The Money Printing Debate',
    category: 'Fed & Liquidity',
    startHereOrder: 7,
    blurb:
      "QE is technically not money printing—it's an asset swap creating bank reserves. But psychologically and functionally, it behaves like money printing.",
  },
  {
    id: 'triffin-trap-pt1',
    date: '2025-05-21',
    title: 'The Triffin Trap, Pt. 1: Bretton Woods Monetary Time Bomb',
    category: 'Dollar Plumbing',
    startHereOrder: 8,
    blurb:
      'Bretton Woods created a gold-backed dollar system. Robert Triffin predicted the fatal flaw: supplying the world with dollars would drain US gold reserves.',
  },
  {
    id: 'stablecoins',
    date: '2025-06-12',
    title: "Stablecoins: How Crypto Became Washington's Favorite Bad Habit",
    category: 'Crypto & Policy',
    startHereOrder: 9,
    blurb:
      "The most boring thing in crypto has morphed from a quirky market hack into a structural lifeline for Uncle Sam's borrowing habit.",
  },
  {
    id: 'myth-of-fed-independence',
    date: '2025-09-03',
    title: 'The Myth of Fed Independence: A Rap Sheet',
    category: 'Fed & Liquidity',
    startHereOrder: 10,
    blurb:
      "From Truman to Trump, the record is clear: independence is theater. The Fed is dependent on the political calendar, not data.",
  },
  {
    id: 'hedonic-magic',
    date: '2024-10-03',
    title: 'Hedonic Magic',
    category: 'Inflation',
    blurb:
      'Why your million-dollar yacht is "cheaper" than a rowboat. Hedonic quality adjustments are how economists adjust inflation numbers when products improve.',
  },
  {
    id: 'eurodollars-revisited',
    date: '2025-05-05',
    title: 'Eurodollars Revisited: Deeper Down the Rabbit Hole',
    category: 'Dollar Plumbing',
    blurb:
      'Going deeper into the shadowy offshore dollar system. How Eurodollars dictate global events and why understanding this system is critical.',
  },
  {
    id: 'triffin-trap-pt2',
    date: '2025-05-29',
    title: 'The Triffin Trap, Pt. 2: Nixon Bails, Bankers Build a Monster',
    category: 'Dollar Plumbing',
    blurb:
      'Nixon closed the gold window. The dollar became fiat, backed by vibes and Treasury debt.',
  },
  {
    id: 'triffin-trap-pt3',
    date: '2025-06-05',
    title: 'The Triffin Trap, Pt. 3: Still Trapped, Still Screwed',
    category: 'Dollar Plumbing',
    blurb:
      'We replaced gold with vibes, outsourced dollar creation to shadow banks, and now the Fed runs global daycare.',
  },
  {
    id: 'betting-2024-election',
    date: '2024-11-02',
    title: 'Betting the 2024 Election',
    category: 'Other',
    blurb:
      'Data, odds, and surprises from the betting markets. Breaking down election odds, where value exists, and where bets were placed.',
  },
];

/**
 * Validation guardrails for masterclass data integrity
 * Runs in dev mode only to catch errors early
 */
function validateMasterclassData(): void {
  if (process.env.NODE_ENV === 'production') {
    return; // Skip validation in production
  }

  const errors: string[] = [];
  const ids = new Set<string>();
  const startHereOrders = new Set<number>();

  for (const item of MASTERCLASS_ITEMS) {
    // Check unique IDs
    if (ids.has(item.id)) {
      errors.push(`Duplicate ID found: ${item.id}`);
    }
    ids.add(item.id);

    // Check unique startHereOrder values
    if (item.startHereOrder !== undefined) {
      if (startHereOrders.has(item.startHereOrder)) {
        errors.push(`Duplicate startHereOrder found: ${item.startHereOrder} (item: ${item.id})`);
      }
      startHereOrders.add(item.startHereOrder);
    }

    // Check non-empty title and blurb
    if (!item.title || item.title.trim().length === 0) {
      errors.push(`Empty title for item: ${item.id}`);
    }
    if (!item.blurb || item.blurb.trim().length === 0) {
      errors.push(`Empty blurb for item: ${item.id}`);
    }

    // Check blurb is 1-2 sentences max
    const sentences = item.blurb.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 2) {
      errors.push(
        `Blurb for item "${item.id}" has ${sentences.length} sentences (max 2 allowed): "${item.blurb.substring(0, 100)}..."`
      );
    }
  }

  // Check startHereOrder contiguity (warn, not error)
  if (startHereOrders.size > 0) {
    const orders = Array.from(startHereOrders).sort((a, b) => a - b);
    const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
    const missing = expected.filter((n) => !orders.includes(n));
    if (missing.length > 0) {
      console.warn(
        `[Masterclass Validation] Non-contiguous startHereOrder values. Missing: ${missing.join(', ')}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[Masterclass Validation] Data integrity errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

// Run validation on import (dev mode only)
validateMasterclassData();
