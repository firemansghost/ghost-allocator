# CHECKS

## Verification Steps (Windows/PowerShell friendly)

### 1) Install + run (local sanity)
- npm install
- npm run dev
  - Visit: /, /onboarding, /builder, /ghostregime
  - Basic click-through: no crashes / console spam

### 2) Build + lint/typecheck
- npm run build
- npm run lint

### 3) Core functional checks (manual)

#### Voya-only path
- Complete onboarding with platform=voya_only
- Builder shows "Target Voya mix (set this in Voya)"
- Enter current Voya holdings summing to 100%
- "One-time rebalance (optional)" produces reduce/add deltas

#### Voya + Schwab path
- Complete onboarding with platform=voya_and_schwab
- Builder shows platform split, Schwab lineup, Voya defensive bucket
- Copy clearly says payroll lands in Voya first; manual sweep cadence

### 4) Menu integrity
- Current Voya dropdown includes full OKC menu (core + TDF)
- Recommended mixes only reference canonical IDs from lib/voyaFunds.ts

### 5) Lineup guardrails (automated)
- npm run test:lineups
  - No duplicate tickers
  - Weights sum ~100%
  - Schwab sleeve logic stays consistent (Gold + Commodities separate)

### 6) Reference data hygiene (automated)
- npm run check:no-reference-data
  - Ensures no reference files are tracked in git

### 7) GhostRegime diagnostics (optional, for parity investigations)
- npm run ghostregime:setup-reference
- npm run ghostregime:why-btc-state -- --date YYYY-MM-DD --source api --base-url https://ghost-allocator.vercel.app
  NOTE: base-url must be root domain (NOT /ghostregime).

### 8) SEO sanity (manual)
- /robots.txt loads
- /sitemap.xml loads
- /og/default.png loads
- NEXT_PUBLIC_SITE_URL set in production

### 9) GitHub Actions sanity (manual)
- ghostregime-daily workflow YAML validates
- Workflow does not fail on pushes
- Workflow skips cleanly if seed file or secrets missing

---

## V1.1 verification (future)
- Confirm model portfolios render correctly on /models
- Confirm builder outputs match chosen model definitions
- Confirm GhostRegime pages have improved visual hierarchy and key info is scannable
- Run copy drift check: `npm run check:ghostregime-copy` (ensures Builder education copy stays centralized)

---

## V7.4 verification (legacy)
- Run regime legend drift check: `npm run check:ghostregime-legend` (ensures regime descriptions stay centralized in lib/ghostregime/regimeLegend.ts)
- Confirm /ghostregime and /ghostregime/methodology both use canonical regime descriptions
- Confirm methodology page has "Regimes at a glance" section with static 2x2 map

---

## V7.6.1 verification (legacy)
- Run parity naming check: `npm run check:parity-names` (ensures no vendor naming in UI/docs)
- Run reference data check: `npm run check:no-reference-data` (ensures no reference data files are tracked)
- Verify `git ls-files data/kiss docs/KISS public/data/kiss` returns nothing

---

## Post-purge verification (only after a history purge)
After running the git history purge (see `docs/ghostregime/HISTORY_PURGE_WINDOWS.md`), verify that reference data is completely removed:

```powershell
# Run all reference data checks
npm run verify:reference-clean
