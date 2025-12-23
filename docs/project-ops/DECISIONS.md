---
# DECISIONS

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
---

