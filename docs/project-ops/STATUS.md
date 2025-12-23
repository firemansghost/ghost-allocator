---
# STATUS

## Current State
Ghost Allocator V1 is functional and firefighter-friendly: pension-aware onboarding, Voya-only and Voya+Schwab paths, full OKC Voya fund menu, delta "one-time rebalance" guidance, and a black/gold glass UI. SEO basics (metadata helper, robots/sitemap, OG image) are in place. GhostRegime exists as a secondary tool and its scheduled workflow has been "tamed" to skip safely when not configured.

## Blockers
- Verify GitHub Actions are now green (workflow YAML + skip guard + Slack notify logic).
- Confirm production deployment plan (Vercel or Convex) and set NEXT_PUBLIC_SITE_URL.

## Next Actions
1) Run the verification checklist in CHECKS.md and confirm everything passes locally + on GitHub.
2) Deploy to a staging URL (Vercel preferred for speed) and set NEXT_PUBLIC_SITE_URL.
3) After deploy: sanity check builder flow on mobile + desktop, then decide next feature slice (Schwab holdings capture, PWA, perf, accounts).

Last updated: 2025-12-22
---

