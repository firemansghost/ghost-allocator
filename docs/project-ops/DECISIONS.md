# DECISIONS

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
