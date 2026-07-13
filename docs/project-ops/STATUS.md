# STATUS

## Current State (GhostFlow — 2026-07-13)
PR **#137** merged the CFTC TFF Treasury adapter on `main` (`12ad053`).
PR **#136** previously merged the shared CFTC Socrata core; PR **#135** the systematic adapter.

**Treasury long-end source authorization audit (docs-only):**
- Canonical memo: [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md)
- Task-start `main` SHA for the audit: `12ad05350f0aeab24d62b809f271a9c1c59bf2ee`
- FRED adapter implementation is **paused** pending source-policy resolution
- `fredgraph.csv` must **not** be promoted without authorization
- FRED API retention, notice, and key-model requirements require resolution **or** source migration
- Direct Board of Governors **H.15** DDP is evaluated as the original-source alternative
- **No** source path, retention policy, breakeven methodology, or registry change is approved by the audit
- **No** production artifact refresh occurred

**Implemented but unwired adapters (unchanged by audit):**
- `cboe-vix-history-csv`
- `cftc-tff-systematic-socrata`
- `cftc-tff-treasury-socrata`
- FRED Treasury long-end remains `spike_available` / unwired

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

Breadth and Gate C remain blocked. VIX adapter remains unwired.

## Recommended next work
1. After Bobby approves the audit recommendation: implement a **direct Board H.15** fixture-driven adapter for `treasuryLongEndIncomeLens` (omit T10YIE pending product decision) — see feasibility memo; do **not** implement FRED API/graph CSV as production transport without clarification
2. Do **not** wire CFTC Treasury/systematic or VIX adapters into production refresh, CLI, or workflows yet
3. Breadth: decide written provider permission **or** licensed SKU investigation (neither approved)

Last updated: 2026-07-13

---

## Archive — CFTC Treasury adapter (2026-07-13)
PR **#136** merged the shared CFTC Socrata source core on `main` (`70b66f7`).
PR **#135** previously merged the CFTC systematic adapter.

**CFTC TFF Treasury adapter implemented** (fixture-driven, unwired):
- Official TFF Futures Only (`gpe5-46if`) via shared Socrata core
- Four standard Treasury contracts required as core; two Ultra contracts optional context
- Adapter normalizes raw CFTC source observations only; derived metrics remain downstream
- Treasury remains display-only / unscored; `mappingStatus` still `not_final` downstream
- No production artifact refresh; adapter not wired to runtime or workflows
- Systematic adapter unchanged and unwired; FRED Treasury remains `spike_available`

## Archive — Shared CFTC Socrata core (2026-07-13)
PR **#135** merged the CFTC TFF systematic adapter on `main` (`96852dc`).
PR **#134** previously merged the breadth operator-packet specification; Gate C remains blocked; no provider approved.

**Shared CFTC Socrata source core extracted** (no behavior change):
- Reusable transport/parsing/query primitives in `cftcTffSocrataCore.ts` / generic query builder
- Systematic adapter consumes the shared core; ID/parser version `1.0.0` and behavior unchanged
- Systematic adapter remains fixture-tested and **unwired**
- Treasury CFTC (`cftc-tff-treasury-socrata`) was still `spike_available` at that point

## Archive — CFTC systematic adapter (2026-07-13)
PR **#134** merged the breadth operator-packet specification on `main` (`c503042`).
PR **#133** established the breadth-source authorization block; Gate C remains blocked; no provider approved.

**CFTC TFF systematic adapter implemented** (fixture-driven, unwired):
- Official CFTC Public Reporting Environment TFF Futures Only (`gpe5-46if`) fetch / parse / normalize
- Normalizes registered ES / NQ / RTY / VIX contract observations only
- Basket calculation and pressure mapping remain downstream
- `systematicFlowProxy` remains display-only; MOCK systematic **62** unchanged
- No production artifact refresh; adapter not wired to runtime or workflows

## Archive — Breadth operator packet (2026-07-13)
PR **#133** merged the breadth-source feasibility decision on `main` (`18ab040`).
PR **#132** previously merged the CBOE VIX CSV adapter (implemented, **unwired**).
Breadth operator-packet runbook completed; intake-only; no provider approved; Gate C blocked.

## Archive — Education / V1 snapshot (2026-01-21)
Ghost Allocator is stable and usable: onboarding + builder flow works, Schwab sleeve logic is clean (Gold and Commodities are always separate), and GhostRegime diagnostics are local-first and usable without production secrets. We are deliberately holding off on BTC parity mismatch investigation for now (watchlist item, not a blocker).

Education section (V1.1) is now live:
- /learn hub exists with guided "Start Here" path and Browse section
- /learn/457 basics page provides generic 457(b) education (first responder friendly)
- /learn/457 now includes "457(b) in 5 Minutes" quick reference section (fast, scannable format)
- /learn/masterclass page integrates Macro Mayhem Masterclass as Level 1: link-out to Substack with curated "Start here" sequence and category browse
- All stub pages created (/learn/457/okc, /learn/basics, /learn/glossary)
- Masterclass data file uses real titles/dates from archive with validation guardrails
- Navigation updated: "Learn" link in top nav, secondary CTA on homepage

## What done looks like

### V1 (Foundation)
- Working onboarding/builder for both platforms (Voya-only, Voya+Schwab)
- Canonical Voya menu (full OKC fund list)
- Schwab sleeves/tilts are explainable and free of duplicate tickers
- Docs/checks exist and are Windows/PowerShell-friendly
- Deployable (builds cleanly)

### V1.1 (Education + trust) ✓ COMPLETE
- /learn hub exists with a guided "Start here" path ✓
- /learn/457 basics page exists with sourced, conservative explanations ✓
- /learn/masterclass index exists with curated sequence + category browse + Substack link-outs ✓
- No UI churn beyond minimal nav/CTA additions needed to surface Learn ✓
- Masterclass data uses real titles/dates from archive (manual list, no parsing) ✓
- Validation guardrails for data integrity (dev-time) ✓
- Fallback links ("Find on Substack") ensure every item has working click path ✓

## Blockers
- None critical.

## Watchlist (not blocking)
- BTC parity mismatch investigation remains on hold unless it resurfaces in a meaningful way.
- Avoid drift between displayed lineup logic and GhostRegime engine logic.

## Next Actions
1) Add per-article Substack URLs to masterclass data file as Bobby provides them
2) Develop OKC-specific 457(b) playbook content when plan documents are available
3) Consider adding Finance Basics and Glossary content (currently stubs)

Last updated: 2026-01-21

---

## Archive
### Snapshot (Last updated: 2025-12-22)
Ghost Allocator V1 is functional and firefighter-friendly: pension-aware onboarding, Voya-only and Voya+Schwab paths, full OKC Voya fund menu, delta "one-time rebalance" guidance, and a black/gold glass UI. SEO basics (metadata helper, robots/sitemap, OG image) are in place. GhostRegime exists as a secondary tool and its scheduled workflow has been "tamed" to skip safely when not configured.

## What done looks like

### V1 (MVP Foundation)
- Working onboarding/builder for both platforms (Voya-only, Voya+Schwab)
- Canonical Voya menu (full OKC fund list)
- Delta logic (one-time rebalance guidance)
- OKC Voya-first copy (payroll lands in Voya, manual Schwab sweeps)
- Docs/checks (project-ops pack, verification checklist)
- Workflows non-noisy (skip guards, safe Slack notify)
- Deployable (builds cleanly, staging-ready)

### V1.1 (Trust & polish)
- Model portfolios locked + reviewed outputs for each risk band/platform path
- GhostRegime UI polish (cards/layout/hierarchy improvements)

## Blockers
- Verify GitHub Actions are now green (workflow YAML + skip guard + Slack notify logic).
- Confirm production deployment plan (Vercel or Convex) and set NEXT_PUBLIC_SITE_URL.

## Next Actions
1) Create model portfolio spec + acceptance criteria (V1.1)
2) Add a review harness page or dev script to snapshot outputs across risk bands (V1.1)
3) GhostRegime UI polish pass (V1.1)
