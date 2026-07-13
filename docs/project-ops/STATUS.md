# STATUS

## Current State (GhostFlow — 2026-07-13)
PR **#132** merged the official CBOE VIX History CSV adapter on `main` (`83780ac`).
GhostFlow Phase 1 foundation (PRs #128–#131) plus VIX adapter (#132) are in place:
- production score baseline fixture
- typed 15-artifact refresh registry
- offline report model + fixture-driven planner
- Gate C atomicity and provenance/timestamp validation
- CBOE VIX adapter (`cboe-vix-history-csv` / `1.0.0`) **implemented**, fixture-tested, **unwired** (no CLI/workflow/candidate/artifact writer/runtime)

**Breadth source feasibility audit completed** (`docs/ghostflow/MARKET_BREADTH_SOURCE_FEASIBILITY.md`):
- StockCharts `$SPXA50R` **HTML automation: RED / blocked** (Usage Limitations forbid programmatic/automated access without prior approval; page is JS-dependent)
- **Recommended path:** design a typed **manual operator-packet** intake mechanism, but keep **production breadth refresh blocked** until source authorization is resolved
- StockCharts **manual transcription is not production-approved** under this audit (operator research / workflow design only; PERMISSION_REQUIRED for publication or production refresh)
- Do **not** implement `stockcharts-spxa50r-html`

Gate C remains incomplete. Breadth production refresh remains blocked pending source authorization.
No production refresh occurred.
Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

## Recommended next work
1. Docs-only `marketBreadth` operator-packet intake design + evidence checklist (not for production use until source authorization)
2. Resolve source authorization (written StockCharts permission or exact licensed provider SKU) — Bobby approval required before purchasing or requesting access; Bobby approval alone does not create data rights
3. Do **not** start a Gate C production refresh or HTML scraper

Last updated: 2026-07-13

---

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
