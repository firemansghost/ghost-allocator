# STATUS

## Current State (GhostFlow — 2026-08-25, H.15 blank-missing parser 1.0.1)
Starting `main` for this work: `f833e7aef8d6c489f5e489a2c90c19ef3a3af31e` (PR **#141** investigation merged).

**Board H.15 CSV parser 1.0.1 blank-as-missing repair:**
- Blank / whitespace-only DDP observation cells now share the existing `ND` missing path
- Live failure class (TCM row 67486 / `RIFLGFCY02_N.B` / `1962-01-02` empty value) repaired
- `FRB_H15_PARSER_VERSION`: `1.0.0` → `1.0.1`
- Adapter ID / source family / locator / package hashes / dual CSV transport **unchanged**
- Fixture regression: `FIXTURE_H15_TCM_BLANK_PREINCEPTION`
- Registry inherits parser version via metadata constant (no semantic registry change)
- **No** SDMX/XML migration; durable Path D recommendation from investigation remains separate
- **No** production / candidate / history writes; DECISIONS unchanged

**Live smoke (report-only, no writes):**
- H.15-only (`2026-08-26T00:08:24.514Z`): `candidate_observation_available` (candidate observation date `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0. Prior `h15_csv_invalid_value` / row 67486 gone.
- Full runner (`2026-08-26T00:08:41.683Z`): all three artifacts `candidate_observation_available` (systematic + Treasury CFTC `2026-08-18`; H.15 `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Design and approve the durable Board release-level SDMX/XML transport migration for `treasuryLongEndIncomeLens` before **2026-11-09** BYP removal
2. Only after transport migration planning is locked, resume human-reviewed candidate-generation design
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — H.15 live-source investigation (2026-08-25)
Starting `main` for this work: `51236fb96b15b73c5da095aa6b8dc7b3410148e0` (PR **#140** merged).

PR **#140** merged the manual **report-only operator runner** on `main`. Live smoke command: `npm run ghostflow:refresh-report`.

**H.15 live-source investigation completed (docs-only):**
- Canonical memo: [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md)
- Live reproduction (`2026-08-25T22:22:19.375Z`): `treasuryLongEndIncomeLens` → `source_failed`, `h15_csv_invalid_value`, **TCM package**, parse stage, **row 67486**
- Exact failure: series `H15/H15/RIFLGFCY02_N.B`, date `1962-01-02`, **blank** value cell (`""`); 3 columns; no quoting
- Classification: **B — parser omission** (blank pre-inception cells are legitimate Board CSV missing representation; parser accepts `ND` only)
- **DDP/BYP exposure:** preformatted TCM package **NOT SPECIFIED** post-November; custom TIPS-30 package **BYP-exposed** (custom-package mechanism; continued arbitrary-package URL support after BYP removal not guaranteed)
- **XML feasibility:** release ZIP `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` contains all five GhostFlow series; SDMX 1.0; `OBS_STATUS` missing semantics
- **Recommended durable transport:** release-level SDMX/XML (Path D) before November BYP removal
- **Smallest next implementation PR:** parser **1.0.1** blank-as-missing CSV fix (interim live unblock); XML migration as follow-up after Bobby review
- **Production unchanged;** no adapter/registry/parser/transport approval in this investigation

CFTC systematic + Treasury adapters returned `candidate_observation_available` (2026-08-18) in prior PR #140 smoke. H.15 remains blocked until parser/transport work is approved and implemented.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Bobby review of H.15 investigation memo; if approved, implement parser **1.0.1** blank-missing fix, then plan SDMX/XML adapter migration before **2026-11-09**
2. After H.15 returns to healthy deterministic live smoke, design human-reviewed candidate generation for report-ready non-score-fed observations
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — Report-only operator runner (2026-08-25)
- `systematicFlowProxy` (`cftc-tff-systematic-socrata`)
- `treasuryFuturesPositioningProxy` (`cftc-tff-treasury-socrata`)
- `treasuryLongEndIncomeLens` (`frb-h15-treasury-yields-csv`)

Runner behavior:
- Reads current production artifacts only for validated date summaries
- Fetches official sources through existing adapters
- Builds the existing GhostFlow refresh report (`report_only`, human review required)
- Writes nothing (no production, candidate, history, score, or reference changes)
- Requires human review; cannot generate candidates or change production

**Live smoke (`npm run ghostflow:refresh-report`, 2026-08-25T21:54:54.950Z):**
- `systematicFlowProxy`: `candidate_observation_available` (candidate observation date 2026-08-18)
- `treasuryFuturesPositioningProxy`: `candidate_observation_available` (candidate observation date 2026-08-18)
- `treasuryLongEndIncomeLens`: `source_failed` — `h15_csv_invalid_value` at source CSV row 67486
- Overall report: `partial_with_blocks`; suggested action: `review_candidates_and_investigate_blocks`; exit code 2

This is expected fail-closed runner behavior. The H.15 adapter defect is separate from runner correctness.

**Source-risk note (Board DDP, announced 2026-07-16):**
On [2026-07-16](https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15), the Federal Reserve Board announced that **Build Your Package (BYP)** is scheduled for removal during the week of **November 9, 2026**, in preparation for eventual retirement of the Data Download Program (DDP). Users are directed toward FRED or release-level XML downloads. The current H.15 adapter depends on (1) a preformatted Treasury Constant Maturities DDP package and (2) a custom single-series DDP package for `RIFLGFCY30_XII_N.B`. Source transport therefore requires re-evaluation before candidate-generation work proceeds. This announcement is not claimed to have caused the live parse failure above.

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

## Recommended next work
1. Investigate the live Board H.15 adapter failure and re-evaluate the DDP transport in light of the July 16 DDP/BYP retirement announcement. Determine whether the safe path is a narrowly scoped parser correction or migration to the Board release-level XML/SDMX source. Do not change sources or methodology without explicit review.
2. After H.15 returns to a healthy deterministic live smoke, design human-reviewed candidate generation for report-ready non-score-fed observations.
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — Board H.15 Treasury adapter (2026-07-13)
PR **#138** merged the Treasury long-end source feasibility audit on `main` (`9cf9fa4`).

**Board H.15 Treasury long-end adapter implemented** (fixture-driven, unwired):
- Canonical source migrated from FRED → Board of Governors H.15 DDP (`frb-h15-treasury-yields-csv` / `1.0.0`)
- Required: 30Y nominal + 30Y inflation-indexed; optional: 2Y / 5Y / 10Y nominal on common date
- **T10YIE omitted**; no derived breakeven
- Display-only / unscored / `human_required`; no production artifact writer or workflow wiring
- DECISIONS records Bobby's 2026-07-13 source migration approval
- No production artifact refresh; historical FRED provenance in committed JSON unchanged

**Implemented but unwired adapters:**
- `cboe-vix-history-csv`
- `cftc-tff-systematic-socrata`
- `cftc-tff-treasury-socrata`
- `frb-h15-treasury-yields-csv`

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

Breadth and Gate C remain blocked. VIX / CFTC adapters remain unwired.

## Recommended next work
1. Do **not** wire H.15 / CFTC / VIX adapters into production refresh, CLI, or workflows yet
2. Breadth: decide written provider permission **or** licensed SKU investigation (neither approved)
3. Optional later: operator runner / human-approved long-end refresh using H.15 (no silent FRED graph CSV)

Last updated: 2026-07-13

---

## Archive — Treasury long-end source audit (2026-07-13)
PR **#137** merged the CFTC TFF Treasury adapter on `main` (`12ad053`).
PR **#136** previously merged the shared CFTC Socrata core; PR **#135** the systematic adapter.

**Treasury long-end source authorization audit (docs-only):**
- Canonical memo: [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md)
- Task-start `main` SHA for the audit: `12ad05350f0aeab24d62b809f271a9c1c59bf2ee`
- Recommended direct Board H.15; FRED graph CSV not for production; FRED API retention issues
- **No** source approved by the audit alone; no registry/artifact change in that PR

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
