---
# CHECKS

## Verification Steps
1) Install + run:
- npm install
- npm run dev (visit /, /onboarding, /builder after onboarding)

2) Build + lint:
- npm run build
- npm run lint

3) Core functional checks (manual)
- Voya-only:
  - Complete onboarding with platform=voya_only
  - Builder shows "Target Voya mix (set this in Voya)"
  - Enter current Voya holdings summing to 100%
  - "One-time rebalance (optional)" produces reduce/add deltas

- Voya + Schwab:
  - Complete onboarding with platform=voya_and_schwab
  - Builder shows platform split, Schwab lineup, Voya defensive bucket
  - Copy clearly says payroll lands in Voya first; manual sweep cadence

4) Menu integrity
- Current Voya dropdown includes full OKC menu (core + TDF)
- Recommended mixes only reference canonical IDs from lib/voyaFunds.ts

5) SEO sanity
- /robots.txt loads
- /sitemap.xml loads
- /og/default.png loads
- NEXT_PUBLIC_SITE_URL set in production

6) GitHub Actions sanity
- ghostregime-daily workflow YAML validates
- Workflow does not fail on pushes
- Workflow skips cleanly if seed file or secrets missing

## V1.1 verification
- Confirm model portfolios render correctly on /models
- Confirm builder outputs match chosen model definitions
- Confirm GhostRegime pages have improved visual hierarchy and key info is scannable
- Run copy drift check: `npm run check:ghostregime-copy` (ensures Builder education copy stays centralized)

## V7.4 verification
- Run regime legend drift check: `npm run check:ghostregime-legend` (ensures regime descriptions stay centralized in lib/ghostregime/regimeLegend.ts)
- Confirm /ghostregime and /ghostregime/methodology both use canonical regime descriptions
- Confirm methodology page has "Regimes at a glance" section with static 2x2 map

## Known Failure Modes
- Delta calculations look "wrong" if current holdings don't sum to ~100%
- Confusion between "Target mix" (what to set) vs "Ghost sleeves" (concept)
- Workflow failures due to YAML syntax (colons in step names) or secrets in if:
---

