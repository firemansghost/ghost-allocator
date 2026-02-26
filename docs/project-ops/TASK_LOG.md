# TASK LOG

## 2026-01-21 — Learn hub: added Monitor with GhostRegime card
Completed:
- app/learn/page.tsx: new Browse card "Monitor with GhostRegime" (weekly weather report, targets vs actual, fewer train wrecks) with Open GhostRegime → link
- Placed after Glossary, before Masterclass

Verification: npm run build, npm run lint; manual: /learn shows new card, link works

---

## 2026-01-21 — Monitor with GhostRegime messaging
Completed:
- app/learn/basics/page.tsx: added GhostRegime bullet to Implementation rules Do this next (check weekly, adjust contributions first)
- app/page.tsx: Step 3 title "Review + Monitor", body mentions GhostRegime weekly weather report, Open GhostRegime link, "Alerts are coming. For now: check GhostRegime weekly."
- app/learn/page.tsx: Why Rules Beat Vibes card — added "Use GhostRegime as a weekly posture check."

Verification: npm run build, npm run lint; manual: Basics bullet, homepage Step 3, Learn hub card

---

## 2026-01-21 — Learn Browse reorder + Basics sticky TOC + Next step CTA
Completed:
- app/learn/page.tsx: reordered Browse cards (457 Playbook, 457 in 5 min, Finance Basics, Glossary, Masterclass, Why Rules Beat Vibes)
- app/learn/basics/page.tsx: sticky TOC on desktop (md:sticky md:top-24), 2-col layout; Next step CTA GlassCard with Build your plan, View templates, 457 in 5 minutes links

Verification: npm run build, npm run lint; manual: Browse order, TOC sticky on desktop, CTA links

---

## 2026-01-21 — Learn Basics v1
Completed:
- app/learn/basics/page.tsx: replaced stub with 5 modules (behavior, fees, diversification, drawdowns, implementation)
- Hero intro + mini-TOC with jump links
- GlassCard modules with anchor ids; cross-links to Glossary, Builder, 457, Models
- app/learn/page.tsx: Finance Basics card active (Browse basics →)
- app/sitemap.ts: added /learn/basics

Verification: npm run build, npm run lint; manual: TOC anchors, mobile layout, cross-links

---

## 2026-01-21 — Builder clarity: slice totals + inside-slice explainer
Completed:
- Voya+Schwab: "These are inside-slice allocations. Your overall split is X% Voya / Y% Schwab." above Voya table
- Schwab: "Schwab slice allocations (percent of your Schwab portion)." above Schwab lineup
- Total (Voya slice) row for Voya+Schwab path
- Total (Voya) row for Voya-only path
- Schwab total row unchanged (already present)

Verification:
- npm run build
- npm run lint
- Manual: Voya-only shows Total (Voya); Voya+Schwab shows explainer, Total (Voya slice), Total (Schwab slice)

---

## 2026-01-21 — Glossary v1
Completed:
- lib/content/glossary.ts: types + GLOSSARY_TERMS (~35 entries); categories: Basics, Builder & 457, Bonds & Rates, Equities, Macro, GhostRegime
- app/learn/glossary/page.tsx: server shell + client GlossaryContent with search, category filter, GlassCards
- app/learn/page.tsx: Glossary card — active link "Browse glossary →", updated copy
- components/GlassCard.tsx: optional id prop for anchor links
- Copy-link button on each term card (window.location.origin + /learn/glossary#term-id)

Verification:
- npm run build
- npm run lint
- Manual: /learn/glossary loads, search filters terms, category filter works, mobile stacks, anchor links work

---

## 2026-01-21 — Agreement delta tests; fix improved/worsened arrow
Completed:
- lib/ghostregime/__tests__/agreementDelta.test.ts: tests for IMPROVED, WORSENED, UNCHANGED (exact + threshold)
- Fixed WORSENED arrow: was curr→prev (wrong); now prev→curr (chronological) for both improved and worsened
- package.json: test:ghostregime-ui script

Verification:
- npm run test:ghostregime-ui passes
- npm run build, npm run lint

---

## 2026-01-21 — Copy summary button on GhostRegime
Completed:
- Added "Copy summary" button to toolbar; copies concise text summary to clipboard
- Summary: GhostRegime — date (UTC) — status; Regime | Risk; Targets; Scales; Actual
- buildShareSummary in lib/ghostregime/ui.ts; fallback to execCommand if clipboard API unavailable
- "Copied" feedback for ~1.5s

Verification:
- npm run build
- npm run lint

---

## 2026-01-21 — GhostRegime copy + clarity polish (UI-only)
Completed:
- Removed redundant freshness: toolbar no longer shows "As of … Fresh"/"Stale data"; FreshnessBadge is sole indicator
- Agreement change wording: "unchanged"/"improved"/"worsened" with correct X → Y format (was "about the same")
- Agreement/Coverage tooltips: added ⓘ with "How many available signals vote the same way today" and "Signals available / signals expected (some can be missing)"
- Use This Signal card: posture guidance ("use as posture check", "consider applying to new contributions before big rebalance"); Build portfolio + View templates links; removed Coming Soon button
- Targets/Scales/Actual: reformatted to 3-line block (Targets, Scales, Actual)

Changed:
- GhostRegimeToolbar: removed isStaleOrOld, healthStatus props; removed formatDate
- lib/ghostregime/ui.ts: computeAgreementDelta line format; buildTodaySnapshotBlocks; formatAgreementBadge tooltip
- lib/ghostregime/ghostregimePageCopy.ts: agreement/coverage tooltips; trend constants

Verification:
- npm run build
- npm run lint

---

## 2026-01-21 — Smoke pages script (routes + GhostRegime APIs)
Completed:
- scripts/smoke-pages.ts: fetches key routes (200) and GhostRegime APIs (200 or 503 with NOT_READY/NOT_SEEDED)
- Args: --base-url (default localhost:3000), --timeout-ms (default 10000)
- Does not start server; assumes user/CI starts it
- package.json: smoke:pages script
- CHECKS.md: 5c) Smoke pages section

Verification:
- npm run build
- npm run lint
- With dev server: npm run smoke:pages -- --base-url http://localhost:3000

---

## 2026-01-21 — Freshness Badge for GhostRegime
Completed:
- components/ghostregime/FreshnessBadge.tsx: reusable badge showing "Last updated: YYYY-MM-DD (UTC)" + status pill (OK=green, WARN=amber, NOT_READY=red)
- GhostRegimeClient: badge rendered in hero strip (all states: success, notSeeded, loading, error) when health data available
- Server page: parse health JSON even on 503 so NOT_READY status is passed for badge display

Changed:
- /ghostregime shows update freshness immediately (SSR-first) to reassure users data updates

Verification:
- npm run build
- npm run lint

---

## 2026-01-21 — Builder smoke test (guardrails)
Completed:
- Added scripts/smoke-builder.ts: validates model portfolio weights, Schwab lineup sanity, Voya fund ID integrity
- npm run smoke:builder: runs without secrets or network; Windows/CI friendly
- Checks: sleeve weights sum ~100%, no negatives, no duplicate sleeve IDs; Schwab lineups (standard + simplify) weights ~100%, no duplicate tickers (standard only); Voya mixes reference valid fund IDs, weights ~100%

Changed:
- package.json: smoke:builder script
- docs/project-ops/CHECKS.md: added Builder smoke test under Verification Steps

Verification:
- npm run build passes
- npm run lint passes
- npm run smoke:builder passes

---

## 2026-01-21 — SSR initial GhostRegime snapshot
Completed:
- Server fetches health + today at request time; passes to GhostRegimeClient for immediate first paint
- Created lib/server/baseUrl.ts (headers-based base URL for server fetch)
- app/ghostregime/page.tsx: server component; fetches with revalidate 60; handles NOT_READY/NOT_SEEDED
- app/ghostregime/GhostRegimeClient.tsx: client component with initialHealth, initialToday, initialNotSeeded, initialError props
- Client skips fetch when SSR data present and no asof/prev params; asof/prev logic unchanged

Changed:
- /ghostregime no longer shows "Loading..." as sole first paint; content renders from SSR data
- Metadata exported from server page

Verification:
- npm run build passes
- npm run lint passes

---

## 2026-01-21 — Migrate from next lint to ESLint CLI (Next.js 16)
Completed:
- Next.js 16 removed `next lint`; migrated to `eslint .` using ESLint 9 flat config
- Added eslint.config.mjs using eslint-config-next-flat (FlatCompat with eslint-config-next had circular structure issues)
- Scripts: `lint` = `eslint .`, `lint:fix` = `eslint . --fix`
- Removed .eslintrc.json; fixed 2 lint errors in scripts (unused vars)

Changed:
- package.json: lint scripts, devDependencies (eslint, @eslint/js, eslint-config-next, eslint-config-next-flat)
- eslint.config.mjs: flat config with ignores, js.configs.recommended, next preset

Verification:
- npm run lint passes
- npm run build passes

---

## 2026-01-21 — Cash sleeve guidance: add optional SGOV/BIL suggestion
Completed:
- Cash sleeve in Schwab lineup now shows two options: Option A (default) leave as cash; Option B park in ultra-short Treasury ETF (SGOV/BIL)
- Added note on ETF vs insured bank cash

Changed:
- app/builder/page.tsx: Cash fallback copy only (UI/copy)

---

## 2026-01-21 — Fix Cash sleeve dropped from Schwab lineup display
Completed:
- Schwab lineup rendering no longer skips sleeves with no ETFs (e.g. Cash)
- Sleeves with no ETFs now show: Cash → Options block (Option A: leave as cash; Option B: SGOV/BIL); others → "No example ETF listed for this sleeve."
- Added Total (Schwab slice) row at bottom of lineup; optional rounding note when diff from 100% is small

Changed:
- app/builder/page.tsx: render all lineup items; fallback copy for empty ETFs; total row

Verification:
- npm run build passes
- Cash sleeve visible; total shows ~100%

---

## 2026-01-21 — Remove convex equity from model portfolios and builder
Completed:
- lib/modelPortfolios.ts: removed convex_equity sleeve; merged weight into core_equity for all r1–r5
- lib/types.ts: removed convex_equity from SleeveId
- lib/sleeves.ts: removed convex_equity definition and SPYC example ETF
- lib/schwabLineups.ts: removed convex_equity from SIMPLIFY_ETFS, selectConvexEquityEtf, and lineup logic
- app/models/ModelsPageContent.tsx: removed display-only merge; now uses selectModelPortfolio + getStandardSchwabLineup directly
- app/builder/page.tsx: removed "convexity" from risk 4 description
- components/QuestionnaireForm.tsx: "Simplify mode (alts/hedges)" and removed "options overlays" from copy

Changed:
- No convex/options-overlay sleeve anywhere in builder or /models output
- Weights sum ~100%; no duplicate tickers; lineup tests pass

Verification:
- npm run test:lineups passes
- npm run build passes
- npm run check:no-reference-data passes

---

## 2026-01-21 — /models now shows implementable Voya-only and Voya+Schwab templates
Completed:
- Rewrote /models to show implementable templates using real OKC Voya funds (lib/voya.ts)
- Platform-first UI: tabs for "Voya Only" and "Voya + Schwab"
- Voya-only: 3 models (Conservative / Moderate / Aggressive) with fund name, allocation %, role
- Voya+Schwab: 3 models with both Voya slice and Schwab slice tables
- Schwab slice display omits Convex Equity; weight merged into Core Equity for display only
- CTAs: Build my portfolio (/onboarding), Learn (/learn)
- Removed old r1–r5 sleeve-based view

Changed:
- /models is now implementable templates (platform-specific), not engine sleeve reference
- Convex Equity does not appear on /models; builder unchanged (removal deferred to separate PR)
- lib/modelPortfolios.ts unchanged; display-only logic in app/models

Verification:
- npm run build passes
- No changes to builder output or GhostRegime

---

## 2026-01-21 — /models now renders read-only templates from lib/modelPortfolios.ts
Completed:
- Rewrote app/models/page.tsx to pull from MODEL_PORTFOLIOS (lib/modelPortfolios.ts) instead of MODEL_TEMPLATES
- Page shows intro explaining reference templates; education/risk framing disclaimer; CTAs to Build my portfolio (/onboarding) and Learn (/learn)
- Each risk model (r1–r5) rendered in collapsible details; first model open by default
- Sleeve allocation table per model: sleeve name (from sleeveDefinitions), weight %, total row
- Weights sorted by descending value for scannability; total displayed as X.X%
- Removed "Coming Soon" and "What You'll Be Able To Do Soon" content

Changed:
- /models is now a read-only receipt of actual model portfolio sleeve allocations
- No allocation or builder logic changes; UI + formatting only

Verification:
- npm run build passes
- No changes to builder output or GhostRegime

---

## 2026-01-21 — Decision log update (GhostRegime posture, seed artifact)
Completed:
- Appended two entries to docs/project-ops/DECISIONS.md dated 2026-01-21: (1) GhostRegime as posture/education overlay only, not builder allocation driver; possible future opt-in overlay is contributions-only; (2) Seed CSV remains committed as bootstrap artifact; document cutover and what breaks if missing.

Changed:
- DECISIONS.md now records posture and seed artifact decisions for future maintainers.

Verification:
- Docs-only; no code changes.

---

## 2026-01-21 — GhostRegime seed and runbook docs cleanup (docs-only)
Completed:
- Updated data/ghostregime/seed/README.md: removed "seed will be provided later" language; documented seed location, purpose (bootstrap history, deterministic local behavior), cutover relationship (seed used for dates ≤ cutover, persistence after), what breaks if missing (503 NOT_SEEDED / NOT_READY), validation checks, and refresh/update steps (TBD but explicit)
- Updated docs/ghostregime/RUNBOOK.md: added "GhostRegime data flow" section (Seed → Cutover → Persistence); confirmed scheduled workflow cadence (3:30 AM UTC Mon–Fri); documented required env vars and what they control (seed presence, blob token, cron secret, cutover); clarified base URL (root domain, not /ghostregime); added "Common failure modes (check first)" and tightened 503 / NOT_SEEDED vs NOT_READY procedures

Changed:
- Seed README is now the single place for seed location, cutover semantics, and refresh process
- RUNBOOK env vars and failure modes are aligned with actual API and workflow behavior

Verification:
- No code or API behavior changes; markdown only

---

## 2026-01-21 — Add "457(b) in 5 Minutes" quick reference
Completed:
- Created components/learn/457InFiveMinutes.tsx reusable component with scannable format
- Added prominent "457(b) in 5 Minutes" section to /learn/457 page (positioned after header, before longer sections)
- Added Browse card to /learn hub linking to /learn/457#in-5-minutes anchor
- Component includes: 60-second version, governmental vs non-governmental differences, withdrawal rules (with rollover caution callout), catch-ups, common mistakes, and actionable checklist
- Uses existing styling patterns (GlassCard, typography, spacing) for consistency
- Anchor target (#in-5-minutes) enables direct linking from Browse card

Changed:
- /learn/457 page now has fast, scannable quick reference at top
- /learn Browse section expanded with new "457 in 5 Minutes" card

Discovered:
- Scannable format (headings + bullets) works well for time-constrained users
- Anchor linking provides smooth navigation from hub to specific section

---

## 2026-01-17 — Education hub implementation (V1.1 complete)
Completed:
- Created /learn hub page with "Start Here" (3 primary cards) and Browse section (4 cards)
- Added "Learn" link to top navigation between "Why 60/40?" and "GhostRegime"
- Added secondary homepage CTA "Learn 457 Basics" linking to /learn/457
- Built /learn/457 basics page with 6 sections: What is 457(b), Contributions, Withdrawals, Rollovers, Common Mistakes, OKC Playbook callout
- Created stub pages: /learn/457/okc, /learn/basics, /learn/glossary (all show "Coming soon")
- Built /learn/masterclass page with "Start Here" sequence (10 items) and category browse
- Created lib/content/masterclass.ts with real titles/dates from archive (15 items total)
- Implemented validation guardrails: unique IDs, unique startHereOrder, non-empty title/blurb (dev-time only)
- Fallback link behavior: items without substackUrl show "Find on Substack" → MMM_SERIES_URL (always works)
- Updated sitemap.ts with all /learn routes
- Updated project-ops docs: STATUS/HANDOFF snapshots, DECISIONS/TASK_LOG append

Changed:
- Navigation now includes Learn section
- Homepage has secondary CTA for education
- Masterclass categorized: Triffin Trap series moved to "Dollar Plumbing" (not "Other")

Discovered:
- Archive file structure made manual extraction straightforward
- Fallback links provide better UX than disabled buttons
- Validation catches data issues early without production risk

---

## 2026-01-17 — Project ops refresh + education track kickoff
Completed:
- Refocused near-term priorities: defer BTC parity mismatch investigation (watchlist only)
- Established Education plan: /learn guided hub + 457(b) basics + MMM Masterclass Level 1 link-out to Substack
- Updated project-ops approach: STATUS/HANDOFF are "current snapshot + Archive"; DECISIONS/TASK_LOG are append-only

Changed:
- Next-session priority now emphasizes additive education pages + minimal nav/CTA tweaks (avoid UI churn)

Discovered:
- Existing project-ops docs were stale (Dec 2025) and needed a snapshot update without losing historical context

---

## 2025-12-19 — Builder UX clarity pass
Completed:
- Start Here strip + jump links
- Action plan re-ordered and tightened
- One-time rebalance delta output
- Optional sections collapsed by default
Changed:
- Copy to reflect OKC 457 Voya-first workflow
Discovered:
- Too much information on one page without clear hierarchy was confusing

## 2025-12-22 — Repo hygiene + menu completeness
Completed:
- SEO basics: metadata helper, robots/sitemap, OG image
- Tamed GhostRegime scheduled workflow to skip when not configured
- Canonical full OKC Voya fund menu wired into dropdown + mixes
Changed:
- Docs improved (root README + docs index) and operator pack added
Discovered:
- GitHub Actions expressions cannot reference secrets.* inside if: conditions
---
