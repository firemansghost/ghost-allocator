# TASK LOG

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
