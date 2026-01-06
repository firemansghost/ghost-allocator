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

## V7.6.1 verification
- Run parity naming check: `npm run check:parity-names` (ensures no vendor naming in UI/docs)
- Run reference data check: `npm run check:no-reference-data` (ensures no reference data files are tracked)
- Verify `git ls-files data/kiss docs/KISS public/data/kiss` returns nothing

## Post-purge verification
After running the git history purge (see `docs/ghostregime/HISTORY_PURGE_WINDOWS.md`), verify that reference data is completely removed:

```powershell
# Run all reference data checks
npm run verify:reference-clean
```

This runs three checks:
1. `check:no-reference-data` - Verifies no reference files in tracked working tree
2. `check:no-reference-history` - Verifies no reference files in git history
3. `check:parity-names` - Verifies no vendor naming in UI/docs

**What "fail" means:**
- If `check:no-reference-history` fails: History still contains reference data. Run the history purge runbook.
- If `check:no-reference-data` fails: Working tree contains tracked reference files. Remove them and commit.
- If `check:parity-names` fails: Vendor naming found in UI/docs. Update to neutral language.

**Note:** History checks are opt-in and not CI-gated. They should be run manually after a history purge to verify success.

## Known Failure Modes
- Delta calculations look "wrong" if current holdings don't sum to ~100%
- Confusion between "Target mix" (what to set) vs "Ghost sleeves" (concept)
- Workflow failures due to YAML syntax (colons in step names) or secrets in if:
---

