# DECISIONS

## 2026-03-24 — GhostRegime product positioning (copy): KISS-aligned targets, independent proxy-VAMS signals
Choice:
- **User-facing stance** is standardized: **KISS-style regime targets** + **independently computed proxy-VAMS sleeve signals** (SPY / GLD / BTC-USD). Durable copy lives in `lib/ghostregime/productPositioning.ts`.
- Do **not** imply exact daily sleeve-state parity with any external model unless proven and explicitly documented.

Why:
- Audits and drift work showed symbol swaps alone do not establish external label parity; clarity beats implied “sameness.”

Consequences:
- GhostRegime / methodology / glossary / related surfaces should pull from the positioning file when updating hero or SEO copy.

---

## 2026-03-24 — GhostRegime sleeve states: surrogate VAMS, not guaranteed 42-published labels
Choice:
- **Production** sleeve states come from **surrogate VAMS** on **SPY**, **GLD**, and **BTC-USD** (see `lib/ghostregime/vams.ts`), not from ingesting 42 Macro’s published VT / GLDM / FBTC state labels.
- **Allocation** targets follow KISS 8.0-style top-down rules (after the INFLATION gold fix); **signal layer** parity with 42 is explicitly **not** claimed unless instruments and thresholds match.

Why:
- Repo evidence: parity harness documents state math is **not** reverse-engineered from 42 (`docs/ghostregime/PARITY_REFERENCE.md`); instrument mismatch (SPY vs VT, GLD vs GLDM, spot vs FBTC) **explains** divergent bullish/neutral/bearish vs deck labels.
- Prevents marketing/UX confusion: we should not imply “same sleeve states as 42” without Level 2 or 3 parity.

Consequences:
- Methodology and product copy should describe **proxy-based** VAMS honestly; optional future work: tighter symbol parity (Level 2) or published-state ingest (Level 3). See `docs/ghostregime/VAMS_KISS_SIGNAL_AUDIT.md`.
- **User-facing stance:** KISS-aligned **targets**; **proxy** VAMS on **SPY / GLD / BTC-USD**; the Level-2 CLI compare (**VT / GLDM / FBTC** vs production) is **diagnostic only**, not a claim of matching any vendor’s internal daily states.

---

## 2026-03-24 — GhostRegime KISS 8.0: INFLATION uses 15% gold target (not 30%)
Choice:
- Top-down gold sleeve target in **INFLATION** is **15%**; all other regimes keep **30%** gold (risk-on and DEFLATION).
- Production (`computeAllocations`) and parity harness (`computeKissTargets`) use the same split.

Why:
- Aligns with current 42 Macro KISS 8.0 workbook/slide rules (INFLATION is the special case for a lower gold cap).
- Fixes inflated gold actuals when VAMS is bullish or neutral under INFLATION (previously used 30% × scale).

Consequences:
- Opt-in parity backtests (`RUN_PARITY_TESTS=1`) may need reference CSV/JSON regenerated from an 8.0 workbook if rows still encode old INFLATION gold.

---

## 2026-01-21 — Removed convex equity; merged into core equity
Choice:
- Removed convex_equity sleeve from model portfolios and builder entirely.
- Reallocated 100% of convex_equity weight into core_equity across all risk models (r1–r5).
- Removed convex_equity from sleeve definitions, types, Schwab lineups, and Simplify ETFs.

Why:
- Options-overlay ETFs are too complex for normal Voya users.
- Simplifies both /models display and builder output; no display-only merging needed.

---

## 2026-01-21 — Models page is implementable templates (platform-specific)
Choice:
- /models shows implementable templates using real OKC Voya funds, not engine sleeve allocations.
- Platform-first: Voya-only and Voya+Schwab tabs with Conservative / Moderate / Aggressive per tab.

Why:
- Normal Voya users need actionable fund lists, not abstract sleeve weights.
- Reduces confusion; aligns with builder output (Voya slice + Schwab slice).

---

## 2026-01-21 — Convex Equity omitted from models display (superseded by full removal)
Choice:
- Initially: display-only merge of convex_equity into core_equity on /models.
- Superseded by: full removal of convex_equity from model portfolios and builder (see above).

---

## 2026-01-21 — GhostRegime is posture/education overlay (not builder allocation driver) for now
Choice:
- Builder remains stable; GhostRegime provides risk posture and education only.
- Any future opt-in overlay (e.g. contribution guidance) would be contributions-only, not daily allocation churn.

Why:
- Avoids drift between builder logic and GhostRegime; matches 457 behavior reality (payroll lands in Voya, manual sweeps).
- Avoids daily allocation churn and keeps user experience predictable.

---

## 2026-01-21 — Seed CSV remains committed as bootstrap artifact
Choice:
- Keep the seed CSV committed in the repo for determinism and local-first behavior.
- Document cutover semantics and what breaks if the seed is missing (see data/ghostregime/seed/README.md and RUNBOOK).

Why:
- Avoids secrets dependency for local/CLI use; keeps CLI and diagnostics reliable without Blob tokens.
- Prevents docs drift by having a single documented source of truth for seed location and behavior.

---

## 2026-01-17 — Education hub implementation: manual data, validation, fallback links
Choice:
- Masterclass data file uses manual list (no runtime parsing of archive file).
- Triffin Trap series categorized as "Dollar Plumbing" (not "Other").
- Items without substackUrl show "Find on Substack" fallback link (never disabled buttons).
- Dev-time validation guardrails for data integrity (unique IDs, valid startHereOrder, non-empty fields).

Why:
- Manual list is most reliable and maintainable; parsing adds complexity and failure modes.
- "Other" should be reserved for truly miscellaneous items, not a catch-all.
- Every item must have a working click path; fallback to series page ensures usability.
- Validation catches errors early in development without risking production crashes.

Consequences / follow-ups:
- Data file is manually maintained; updates require editing the array.
- Validation runs on import in dev mode only (gated on NODE_ENV).
- Fallback links ensure good UX even before per-article URLs are provided.

---

## 2026-01-17 — Education hub + Masterclass integration approach (guided path, Level 1 link-out)
Choice:
- Add an Education area (/learn) with a guided "Start here" path.
- Integrate Macro Mayhem Masterclass as Level 1: link out to Substack (no content migration yet).
- Add a 457(b) basics page first (generic, first-responder friendly). Add an OKC-specific stub later when plan docs are available.

Why:
- Education improves trust + onboarding and reduces user confusion before they hit the builder.
- Level 1 avoids a migration/time-sink while preserving Substack as the canonical home for MMM.
- Guided path reduces "what do I click" paralysis for normal humans.

Alternatives considered:
- Level 2 (host MMM content in-app as MD/MDX) — deferred until after Learn hub ships and structure proves useful.
- Free-form library only (no guided path) — rejected; too easy to become a link dump.

Consequences / follow-ups:
- Add /learn to top nav + add a homepage secondary CTA ("Learn 457 Basics").
- Build /learn/masterclass with "Start here" ordering, categories, and brief blurbs.
- Create a lightweight data file for MMM entries; allow "Link pending" until URLs are provided.

---

## 2025-12-01 — No options; ETF "options-like" exposure via ETFs only
Choice: Avoid options strategies; if we need convexity/managed futures/etc, use ETFs/funds.
Why: Target users won't use options; ETFs are simpler and implementable.

## 2025-12-05 — No accounts/login in V1
Choice: V1 is compute + display; persistence via localStorage only.
Why: Reduce scope; validate usefulness before Supabase.

## 2025-12-08 — Voya + Schwab design: Schwab = growth bucket, Voya = defensive + inflation bucket
Choice: For combo users, Voya implementation avoids duplicating equity funds when Schwab exists.
Why: Reduces redundancy and makes the split feel intentional.

## 2025-12-09 — OKC 457 reality must be explicit
Choice: UI copy states payroll contributions land in Voya first; Schwab requires manual sweeps.
Why: Prevents incorrect expectations and improves real-world usability.

## 2025-12-12 — Canonical OKC Voya fund list is a single source of truth
Choice: All dropdowns and mixes reference lib/voyaFunds.ts canonical IDs.
Why: Prevents drift, enables validation, supports future expansions.

## 2025-12-15 — Builder UX optimized for action, not reading
Choice: "Start here" strip + Action Plan first; details collapsed by default.
Why: Firefighters want a checklist, not a whitepaper.

## 2025-12-22 — Define V1 vs V1.1 scope
Choice: V1 is MVP Foundation; V1.1 is model portfolio validation + GhostRegime visual polish.
Why: Keeps a stable shipping milestone while allowing iterative refinement.
Alternatives: "V1 never ends" (rejected)
---
