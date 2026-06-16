# Marketstack API Usage Audit (Ghost Allocator)

**GhostRegime docs:** [RUNBOOK](./RUNBOOK.md) · [VALIDATION](./VALIDATION.md) · [PLAN](./PLAN.md)

**Status:** Audit only — docs-only memo. No live Marketstack API calls were made during this audit.

---

## Status

| Item | Audit posture |
|------|----------------|
| Document type | Static code / workflow inspection only |
| Live Marketstack API calls | **None** — audit did not call Marketstack |
| `npm run build` | **Not run** |
| Tests (`npm test`, `test:*`) | **Not run** |
| Smoke scripts (`smoke:pages`, `smoke:builder`) | **Not run** |
| Refresh / ETL / operator scripts | **Not run** |
| GitHub workflow execution | **Not run** |
| Deploy commands | **Not run** |
| Code changes | **None** |
| `.env` changes | **None** |
| Secrets logged or committed | **None** |

GhostFlow scoring, artifacts, UI, and runtime were not modified. GhostRegime **implementation** was not changed — only this audit document was created.

---

## Risk context

| Factor | Detail |
|--------|--------|
| **Account limit** | Marketstack Basic plan: **10,000 requests/month** |
| **Current state** | Usage limit was reached; account is generating **overage charges** |
| **User posture** | Some temporary overage during active development is acceptable |
| **Unacceptable pattern** | Repeated builds, deploys, or refreshes paying for the **same unchanged data** |
| **Audit goal** | **Not** to remove Marketstack blindly — to **stop uncontrolled or repeated** fallback calls |

Marketstack is used only in **GhostRegime** as a **paid fallback** when Stooq fails for a constrained ETF symbol set. GhostFlow, GhostYield, Models, and builder do **not** reference Marketstack in this repository.

---

## Call-site inventory

All paths below were found via static search (`marketstack`, `MARKETSTACK`, `api.marketstack.com`). No runtime verification was performed.

### Direct API layer

| File | Module / symbol | Purpose | Trigger | Direct / fallback | Evidence |
|------|-----------------|---------|---------|-------------------|----------|
| [`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts) | `fetchMarketstackEod`, `MARKETSTACK_EOD_URL` | Fetch EOD from `https://api.marketstack.com/v1/eod`; paginate with `limit=1000`, `offset`, 220ms gap | Invoked only when caller passes key + symbol in fallback set | **Direct** | `fetch(url)` at line ~179; requires `access_key` query param |
| [`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts) | `MARKETSTACK_ETF_FALLBACK_SYMBOLS` | Allowlist: SPY, GLD, EEM, HYG, IEF, TIP, TLT, UUP | Gating before fetch | **Direct** (eligibility) | `ReadonlySet` of 8 symbols |
| [`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts) | `parseMarketstackEodBody`, `formatMarketstackFailureHint` | Parse JSON / format errors | Test-time / diagnostics only | **Neither** (no network) | Pure functions |

### Fallback orchestration

| File | Module / symbol | Purpose | Trigger | Direct / fallback | Evidence |
|------|-----------------|---------|---------|-------------------|----------|
| [`lib/ghostregime/marketData.ts`](../../lib/ghostregime/marketData.ts) | `DefaultMarketDataProvider.getHistoricalPrices` | Stooq primary; if Stooq fails **and** symbol ∈ fallback set **and** `MARKETSTACK_ACCESS_KEY` set → `fetchMarketstackEod` | Any code path calling `getHistoricalPrices` on singleton | **Fallback** | Lines ~876–921: Stooq failure branch → Marketstack |
| [`lib/ghostregime/marketData.ts`](../../lib/ghostregime/marketData.ts) | `getLatestPrice` | Delegates to `getHistoricalPrices` (5-day window) | Same as provider | **Fallback** (indirect) | Line ~943 |
| [`lib/ghostregime/marketData.ts`](../../lib/ghostregime/marketData.ts) | `defaultMarketDataProvider` | Singleton used by engine and scripts | Imported widely | **Fallback** (entry point) | Exported singleton line ~952 |

### Engine and API routes

| File | Module / symbol | Purpose | Trigger | Direct / fallback | Evidence |
|------|-----------------|---------|---------|-------------------|----------|
| [`lib/ghostregime/engine.ts`](../../lib/ghostregime/engine.ts) | `getGhostRegimeToday` | Fetches ~**600 calendar days** (`GHOSTREGIME_MARKET_FETCH_CALENDAR_DAYS`) for all `MARKET_SYMBOLS` on recompute | Runtime API, scheduled `force=1`, possible SSR | **Indirect** | Lines ~438–445: `defaultMarketDataProvider.getHistoricalPrices` |
| [`lib/ghostregime/engine.ts`](../../lib/ghostregime/engine.ts) | `getGhostRegimeToday` (error path) | On compute error, may **re-fetch** same window for diagnostics | Runtime when compute throws | **Indirect** | Lines ~774–782 |
| [`app/api/ghostregime/today/route.ts`](../../app/api/ghostregime/today/route.ts) | `GET` handler | `force=1` + cron secret → `getGhostRegimeToday(debug, force)` | Runtime; scheduled job | **Indirect** | `dynamic = 'force-dynamic'`; no build-time fetch in route file |
| [`app/ghostregime/page.tsx`](../../app/ghostregime/page.tsx) | `GhostRegimePage` (Server Component) | Server `fetch` to `/api/ghostregime/health` and `/api/ghostregime/today` (no `force=1`) | Runtime page load; **possible** build-time if prerendered | **Indirect** | `FETCH_OPTIONS = { next: { revalidate: 60 } }` |
| [`app/ghostregime/GhostRegimeClient.tsx`](../../app/ghostregime/GhostRegimeClient.tsx) | Client `fetch` | `/api/ghostregime/health`, `/api/ghostregime/today`, `/history` | Browser runtime | **Indirect** | Client-side only after hydration |

### Diagnostics and types (no network)

| File | Purpose | Trigger |
|------|---------|---------|
| [`lib/ghostregime/diagnostics.ts`](../../lib/ghostregime/diagnostics.ts) | `getProviderName` returns `'Marketstack'` when `resolvedIds[symbol]` starts with `marketstack:` | Post-fetch labeling |
| [`lib/ghostregime/types.ts`](../../lib/ghostregime/types.ts) | `marketstack_probe` on provider diagnostics type | Response metadata |

### Tests (static only — not executed)

| File | Purpose | Live API risk |
|------|---------|---------------|
| [`lib/ghostregime/__tests__/marketstackEod.test.ts`](../../lib/ghostregime/__tests__/marketstackEod.test.ts) | Tests `parseMarketstackEodBody`, symbol set, `formatMarketstackFailureHint` | **Low** — no `fetchMarketstackEod` call; fixture JSON only |

### Documentation (reference only)

| File | Purpose |
|------|---------|
| [`docs/ghostregime/RUNBOOK.md`](./RUNBOOK.md) | Documents Stooq-first, Marketstack fallback, `MARKETSTACK_ACCESS_KEY` on Vercel Production |

### Scheduled workflow

| File | Purpose | Trigger |
|------|---------|---------|
| [`.github/workflows/ghostregime-daily.yml`](../../.github/workflows/ghostregime-daily.yml) | Weekday cron → `curl` Production `/api/ghostregime/today?force=1` | **Scheduled job** (confirmed) |

### Operator / research scripts (not run in audit)

| Script | Calls `getHistoricalPrices` | Marketstack if key + Stooq fail |
|--------|------------------------------|----------------------------------|
| [`scripts/ghostregime/compare-vams-profiles.ts`](../../scripts/ghostregime/compare-vams-profiles.ts) | Yes | **Possible** |
| [`scripts/ghostregime/vams-profile-drift-study.ts`](../../scripts/ghostregime/vams-profile-drift-study.ts) | Yes | **Possible** |
| [`scripts/ghostregime/why-btc-state.ts`](../../scripts/ghostregime/why-btc-state.ts) | Yes | **Possible** |
| [`scripts/ghostregime/btc-mismatch-attribution.ts`](../../scripts/ghostregime/btc-mismatch-attribution.ts) | Yes | **Possible** |
| [`scripts/ghostregime/btc-parameter-scan.ts`](../../scripts/ghostregime/btc-parameter-scan.ts) | Yes | **Possible** |
| [`scripts/ghostregime/setup-reference.ts`](../../scripts/ghostregime/setup-reference.ts) | No | **No** |
| [`scripts/ghostregime/state-parity-report.ts`](../../scripts/ghostregime/state-parity-report.ts) | No (parity compare) | **No** |

---

## Confirmed call path

### Direct Marketstack HTTP

**File:** `lib/ghostregime/marketstackEod.ts`

| Item | Detail |
|------|--------|
| **URL** | `https://api.marketstack.com/v1/eod` |
| **Env** | `MARKETSTACK_ACCESS_KEY` (required for fetch; not committed) |
| **Parameters** | `symbols`, `date_from`, `date_to`, `limit` (1000), `offset`, `sort=ASC`, `access_key` |
| **Pagination** | Loop until short page or `offset >= total`; **220ms** delay between pages |
| **Request cost** | **One HTTP request per page** per symbol per `fetchMarketstackEod` invocation |

### Fallback gate

**File:** `lib/ghostregime/marketData.ts`

1. Resolve symbol → Stooq ID (except VIX, PDBC, BTC-USD special paths).
2. `fetchStooqData` — primary.
3. If Stooq outcome ≠ `csv_ok` or empty **and** `isMarketstackEtfFallbackSymbol(symbol)`:
   - If `MARKETSTACK_ACCESS_KEY` set → `fetchMarketstackEod(symbol, startDate, endDate, msKey)`.
   - Else → skip Marketstack; error notes "fallback skipped: no MARKETSTACK_ACCESS_KEY".

**Fallback universe (8 symbols):** SPY, GLD, EEM, HYG, IEF, TIP, TLT, UUP.

**Not routed through Marketstack:** PDBC (AlphaVantage/DBC), BTC-USD (Yahoo/CoinGecko/Stooq chain), VIX (CBOE).

### Recompute window

**File:** `lib/ghostregime/engine.ts` — `GHOSTREGIME_MARKET_FETCH_CALENDAR_DAYS = 600` ([`config.ts`](../../lib/ghostregime/config.ts)).

On each **full recompute**, the engine requests historical prices for **all** market symbols over ~600 calendar days. Marketstack is invoked **per fallback symbol** only when Stooq fails for that symbol — but a single recompute can still trigger **up to 8** Marketstack series fetches (each potentially multi-page).

---

## Trigger analysis

### A. Runtime user request

| Path | Behavior | Marketstack risk |
|------|----------|------------------|
| `GET /api/ghostregime/today` (no force) | `getGhostRegimeToday` may **serve persisted** snapshot if as-of matches and not stale/outdated | **Low** if blob hit |
| Same route on cache miss / stale / outdated schema | Full provider fetch (~600 days × all symbols) | **Medium–high** if Stooq fails for fallback ETFs |
| `GET /api/ghostregime/today?force=1` (authorized) | **Always** attempts fresh compute (subject to persist gate) | **High** — same full window |
| `GET /api/ghostregime/health` | Reads blob only | **None** |
| `GET /api/ghostregime/history`, `/explain` | Seed + blob history | **None** (no live provider in static path) |
| `/ghostregime` page (SSR) | Fetches health + today **without** `force=1` | **Same as today route** — recompute only if engine decides |
| Client refetch in `GhostRegimeClient` | Same APIs | **Indirect** |

**Classification:** **Runtime — confirmed** indirect path to Marketstack when recompute runs and Stooq fails with key present.

### B. Scheduled job — confirmed high risk

**Workflow:** `.github/workflows/ghostregime-daily.yml`

| Item | Detail |
|------|--------|
| **Schedule** | `30 3 * * 1-5` (weekdays 03:30 UTC) |
| **Trigger** | `workflow_dispatch` also allowed |
| **Action** | `curl` → `https://ghost-allocator.vercel.app/api/ghostregime/today?force=1` with `x-ghostregime-cron` |
| **Push/PR** | **Not** triggered on push (comment in workflow) |
| **Marketstack** | Runs **inside Vercel Production** — `MARKETSTACK_ACCESS_KEY` must be on **Vercel**, not only GitHub secrets |

**Classification:** **Scheduled job — confirmed high risk** when Production has key and Stooq fails for any fallback symbol (forced recompute every weekday).

### C. Build-time / Vercel deploy — possible (not confirmed)

| Factor | Static finding |
|--------|----------------|
| [`next.config.mjs`](../../next.config.mjs) | Empty config — no special build hooks |
| `vercel.json` | **Not present** in repo (dashboard may override) |
| Default Vercel build | Typically `npm run build` → `next build` |
| [`app/ghostregime/page.tsx`](../../app/ghostregime/page.tsx) | Async Server Component calls `fetch(baseUrl + '/api/ghostregime/today')` at render time |
| API routes | `export const dynamic = 'force-dynamic'` on ghostregime API routes |

**Build-time prerender risk:** If Next.js **statically prerenders** `/ghostregime` during `next build`, the server component could attempt HTTP to the app's own API. That would invoke `getGhostRegimeToday` on the **build environment** — Marketstack risk if `MARKETSTACK_ACCESS_KEY` is set on Preview/Production build env and Stooq fails.

**Classification:** **Build-time — possible, not statically proven.** Proof requires a guarded build observation later (after M2 fail-closed guard). Do **not** run `npm run build` without guard to test.

**Deploy note:** Each Vercel **production/preview deployment** runs `next build`. Preview deploys with `MARKETSTACK_ACCESS_KEY` + prerender risk = **billing risk**.

### D. Test-time

| Script / test | Marketstack live call? | Evidence |
|---------------|------------------------|----------|
| `marketstackEod.test.ts` | **No** | Parses fixture JSON only |
| Other `lib/ghostregime/__tests__/*` | **No** in static review | Mock `MarketDataPoint[]`; no provider import for network |
| `npm test` | **Unlikely** direct Marketstack | Does not include `verify:ghostregime` build step |
| `verify:ghostregime` | **Indirect risk** | Runs `npm run build` then tests — build is **possible** Marketstack path; tests themselves unlikely |

**Classification:** **Test-time — low** for unit tests; **possible** via `verify:ghostregime` → `build` chain.

### E. Operator refresh scripts

Scripts calling `defaultMarketDataProvider.getHistoricalPrices` can trigger Marketstack when:

- Operator runs script locally or in CI with `MARKETSTACK_ACCESS_KEY` set, and
- Stooq fails for a fallback symbol.

**Classification:** **Operator refresh — possible** when explicitly run (not part of default CI in repo except manual).

### F. Unknown external config

| Item | Audit note |
|------|------------|
| Vercel Preview vs Production env | `MARKETSTACK_ACCESS_KEY` may differ; RUNBOOK warns Preview can enable fallback |
| External cron / manual `curl` | Same as `force=1` if secret leaked |
| Marketstack dashboard usage | Not inspected in this audit |

---

## Package script and workflow inventory

| Script / workflow | Command (summary) | Likely Marketstack? | Confidence | Evidence |
|-------------------|-------------------|---------------------|------------|----------|
| `build` | `next build` | **Possible** | Medium | May prerender `/ghostregime` → today API |
| `dev` | `next dev` | **Possible** on page/API hit | Medium | Local runtime only |
| `start` | `next start` | **Possible** on traffic | Medium | Production-like runtime |
| `lint` | `eslint .` | **No** | High | Static analysis |
| `test` | regimeCore + ghostflow tests | **No** (tests) | High | No build; mocks |
| `verify:ghostregime` | `build` + lint + ghostregime tests | **Possible** via `build` | Medium | Includes `marketstackEod.test` (no network) |
| `smoke:pages` | HTTP to pages + `/api/ghostregime/today` | **Possible** if server up | Medium | Hits today route; not run in audit |
| `smoke:builder` | Portfolio builder checks | **No** | High | No ghostregime provider |
| `ghostregime:compare-vams-profiles` etc. | tsx scripts with `getHistoricalPrices` | **Yes** if key + Stooq fail | High | Direct provider call |
| `ghostregime:setup-reference` | Copy reference files | **No** | High | Files only |
| `ghostregime:state-parity` | Parity report | **No** | High | No provider fetch |
| `ghostflow:*` | GhostFlow artifacts/spikes | **No** | High | No Marketstack refs |
| `.github/workflows/ghostregime-daily.yml` | curl `force=1` | **Yes** (indirect) | **High** | Confirmed scheduled path |

**Repo workflow count:** **1** (ghostregime-daily only).

---

## Vercel / deploy risk

| Item | Finding |
|------|---------|
| **`vercel.json` in repo** | **Absent** — build/install commands default to Next.js/Vercel project settings |
| **Likely build command** | `npm run build` (from `package.json`) |
| **Preview deployments** | Each preview build may run `next build`; if Preview env includes `MARKETSTACK_ACCESS_KEY`, fallback can charge during build or first SSR |
| **Production** | Daily cron targets Production URL; key required there for fallback per RUNBOOK |
| **Recommended env separation** | **Do not** set `MARKETSTACK_ACCESS_KEY` on **Preview** (or Development) unless explicitly testing fallback; restrict to Production and only when operator-approved |

---

## Recommended containment strategy

### Primary recommendation (combined)

1. **Zero Marketstack calls** during `next build`, Vercel Preview builds, and automated tests unless explicitly gated.
2. **Marketstack fallback = opt-in** via env gate (e.g. `ALLOW_MARKETSTACK_FALLBACK=true`), not merely presence of `MARKETSTACK_ACCESS_KEY`.
3. **Scheduled job:** keep daily refresh but avoid repeated full **600-day × 8-symbol** fallback storms — prefer persisted snapshot when data unchanged; consider shorter diagnostic window or Stooq reliability fixes first.
4. **Preview:** omit `MARKETSTACK_ACCESS_KEY` entirely.
5. **Runtime:** prefer serving **persisted / stale carry-forward** over recomputing on every page view (already partially implemented; `force=1` remains the expensive path).

### Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — Build/preview/test fail-closed** | Block `fetchMarketstackEod` when `NEXT_PHASE=build`, `VERCEL_ENV=preview`, or `CI=true` without explicit override | Stops surprise build/preview bills | Requires code (M2) |
| **B — Operator-refresh-only** | Require `ALLOW_MARKETSTACK_FALLBACK=true` in addition to key | Clear intent per run | Manual discipline |
| **C — Vercel env separation** | No key on Preview; Production only | Fast win, no code | Production cron still bills if Stooq fails |
| **D — Cache / de-dupe** | Cache by `symbol + date_from + date_to` (or as-of) in memory/file | Cuts repeat calls same day | Needs storage policy (M5) |
| **E — Scheduled job containment** | Don't use `force=1` if latest fresh; or bounded fetch; alert on `marketstack_probe` | Reduces weekday repeat cost | Workflow/API changes (M4) |
| **F — Tests / fixtures** | Keep tests on `parseMarketstackEodBody` only; never integration-fetch | Safe CI | Already mostly true |

**Best combination for billing safety:** **A + C + E** immediately; add **B + D** in follow-on phases.

---

## Implementation ladder

| Phase | Deliverable | Type | Status |
|-------|-------------|------|--------|
| **M1** | Marketstack API Usage Audit — this memo | Docs-only | **Done** |
| **M2** | Build / Preview / Test guard — fail-closed `ALLOW_MARKETSTACK_FALLBACK` gate | Code + tests | **Done** |
| **M3** | Operator refresh discipline — when/how to enable fallback safely | Docs-only | **Done** |
| **M4** | Scheduled job containment — `refresh=scheduled` cron, preflight skip | Workflow + API | **Done** |
| **M5** | Cache / de-dupe — symbol + date window (+ as-of) | Code | Future |
| **M6** | Optional monitoring — counters in logs/diagnostics | Code | Future |

**M3 operator guide:** [MARKETSTACK_OPERATOR_REFRESH.md](./MARKETSTACK_OPERATOR_REFRESH.md)

### M4 scheduled refresh spec (implemented)

| Component | Behavior |
|-----------|----------|
| **Cron URL** | `?refresh=scheduled` (replaces blind `?force=1`) |
| **Preflight** | [`scheduledRefresh.ts`](../../lib/ghostregime/scheduledRefresh.ts) — skip fetch when latest fresh per health standard (`max_age_days = 4`) |
| **Manual force** | `?force=1` unchanged for operator recovery |
| **Marketstack** | M2 guard unchanged — no query-param bypass |
| **Outcomes** | `scheduled_served_persisted_no_fetch`, `scheduled_recomputed_and_persisted`, etc. |

### M5 / M6 (future)

| Phase | Scope |
|-------|--------|
| **M5** | Cache/de-dupe Marketstack/Stooq by symbol + date window; optional bounded fetch on recompute |
| **M6** | Usage counters in diagnostics (no extra API calls) |

**Parking lot (not M4):** GhostFlow **v1.9c.2** Event-Based Display Artifact Design remains product-gated pending after Marketstack containment work. Next branch may be M5 or v1.9c.2 depending on product priority.

### M4 problem statement (implemented)

M4 should address scheduled-job containment without removing Marketstack as an operator tool:

| Topic | M4 outcome |
|-------|------------|
| Blind weekday `force=1` | Replaced with `refresh=scheduled` |
| Fresh persisted skip | Preflight before market fetch (health `max_age_days = 4`) |
| Repeated fallback storms | No fetch on fresh days; M5 for cache on recompute |
| Bounded refresh | Deferred to M5 |
| Explicit fallback mode | Manual `force=1` + operator ALLOW unchanged |

Touch points: `.github/workflows/ghostregime-daily.yml`, `/api/ghostregime/today`, `lib/ghostregime/engine.ts`, `lib/ghostregime/scheduledRefresh.ts`.

### M2 guard spec (implemented)

| Component | Behavior |
|-----------|----------|
| **Primary gate** | `ALLOW_MARKETSTACK_FALLBACK=true` required in addition to `MARKETSTACK_ACCESS_KEY` |
| **Hard blocks** | `NODE_ENV=test`, `VERCEL_ENV=preview`, `NEXT_PHASE=phase-production-build`, `DISABLE_MARKETSTACK_FALLBACK=true` |
| **Direct client belt** | [`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts) — `fetchMarketstackEod` returns `guard_blocked` without HTTP |
| **Fallback orchestrator** | [`lib/ghostregime/marketData.ts`](../../lib/ghostregime/marketData.ts) — evaluates guard before calling Marketstack |
| **Guard module** | [`lib/ghostregime/marketstackGuard.ts`](../../lib/ghostregime/marketstackGuard.ts) |
| **Tests** | Mock/stub only — no live HTTP, no real API keys |
| **Workflow** | No change in M2 — deferred to M4 |

**Production rollout:** Keep `ALLOW_MARKETSTACK_FALLBACK` **unset** on Production by default. Enable only during an approved paid fallback window per [MARKETSTACK_OPERATOR_REFRESH.md](./MARKETSTACK_OPERATOR_REFRESH.md); unset after controlled refresh.

---

## Validation (this audit)

### Commands run

| Command | Result |
|---------|--------|
| Static `rg` / codebase search | Yes — no API calls |
| `git diff --name-only` | See below — docs only expected |

### Commands not run

`npm run build`, `npm test`, `verify:ghostregime`, `smoke:*`, `ghostregime:*` research scripts, workflow dispatch, deploy, any live market-data fetch.

### Expected `git diff --name-only`

- `docs/ghostregime/MARKETSTACK_API_USAGE_AUDIT.md` (new)
- Optional: `docs/ghostregime/RUNBOOK.md` (cross-link only)

Must **not** include: `lib/`, `app/`, `scripts/`, `components/`, `data/`, `package.json`, `.env*`, `.github/workflows/*`, `.cursor/`

---

## Related documents

- [RUNBOOK.md](./RUNBOOK.md) — operational Marketstack configuration and daily workflow
- [VALIDATION.md](./VALIDATION.md) — GhostRegime API validation notes
- [GHOSTFLOW docs](../ghostflow/README.md) — separate product lane; no Marketstack usage

---

## Guardrails (audit)

- Feasibility / audit memo only — no implementation
- No live Marketstack API calls during audit
- No secrets in this document
- GhostFlow composite **62 / Passive 58 / Structural 66** and `publicSignalCount` **10** — unchanged (out of scope)
