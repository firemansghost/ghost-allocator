# GhostRegime Operational Runbook

## Overview

GhostRegime is a market regime classifier that runs automatically via GitHub Actions on weekdays. This runbook covers operational procedures, troubleshooting, and manual interventions.

## GhostRegime Data Flow

1. **Seed** — CSV at `data/ghostregime/seed/ghostregime_replay_history.csv` provides bootstrap history for dates **≤ cutover** (default `2025-11-28` UTC). Used for deterministic local behavior and to serve history/today for past dates.
2. **Cutover** — Configurable via `NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC`. Dates **after** cutover are not read from the seed.
3. **Persistence** — For dates after cutover, the engine computes from live market data and writes the latest row to Vercel Blob storage. Reads (today, health, history) use this persisted state when available.

### Resilience (last-known-good)

- **Failed refresh does not overwrite blob “latest”** — The engine only calls `writeLatest` / `appendToHistory` when a new row is **valid** (`isValidPersistableSnapshot`) and **not stale** and **not debug**. Provider failures that return a **stale** response **never** write; the previous blob snapshot remains.
- **API honesty** — Stale responses include `serve_metadata` (e.g. `refresh_outcome`, `persisted_snapshot_preserved`, `market_snapshot_lag_days`, `refresh_error_summary`) so operators and the UI can see carry-forward vs a fresh compute.
- **Cold start** — If there is no persisted latest and live data is insufficient, the API returns **503** `GHOSTREGIME_NOT_READY` (no fake latest). The replay seed does not replace blob latest for post-cutover dates.

If the seed is missing or empty, `/api/ghostregime/today`, `/explain`, and `/history` return `503` with `GHOSTREGIME_NOT_SEEDED`. If no latest row has ever been persisted, `/api/ghostregime/health` returns `503 NOT_READY`.

## Daily Workflow

### Automatic Execution

**Schedule**: Every weekday at **3:30 AM UTC** (after US market close).
- **Cron**: `30 3 * * 1-5` (Monday–Friday)
- **Workflow**: `.github/workflows/ghostregime-daily.yml`
- **Actions**:
  1. Guard: skip if seed file missing/empty or `GHOSTREGIME_CRON_SECRET` unset
  2. Force refresh GhostRegime (`?force=1` with cron secret)
  3. Check health endpoint
  4. (Optional) Send Slack notification on failure

### Pre-push verification (local)

One command runs build, lint, and a focused set of GhostRegime unit tests (persist gate, diagnostics, Stooq parsing, URL/latest UX, Marketstack helpers, flip pressure, serve metadata):

```bash
npm run verify:ghostregime
```

### Marketstack fallback (optional, opt-in)

**Operator discipline (M3):** [MARKETSTACK_OPERATOR_REFRESH.md](./MARKETSTACK_OPERATOR_REFRESH.md) — when to enable paid fallback, controlled refresh checklist, verification, and rollback.

For **core US ETF symbols** (SPY, GLD, EEM, HYG, IEF, TIP, TLT, UUP), Stooq remains the **first** data source. If Stooq fails (gate, empty CSV, parse error, etc.), the engine may request **one** Marketstack EOD series per symbol **only for those tickers**, and only when **both** of the following are set in the deployment environment:

1. `MARKETSTACK_ACCESS_KEY` — Marketstack dashboard access key (do not commit)
2. `ALLOW_MARKETSTACK_FALLBACK=true` — explicit opt-in to spend paid Marketstack quota (**temporary only** — unset after a controlled refresh)

**M2 guard (fail-closed):** The presence of `MARKETSTACK_ACCESS_KEY` alone is **not** enough to trigger Marketstack calls. Fallback is also blocked during tests (`NODE_ENV=test`), Vercel Preview (`VERCEL_ENV=preview`), and Next.js production builds (`NEXT_PHASE=phase-production-build`). Optional kill switch: `DISABLE_MARKETSTACK_FALLBACK=true`.

**ALLOW is not permanent.** Enable `ALLOW_MARKETSTACK_FALLBACK=true` only for an approved paid fallback window, run **one** controlled `force=1` refresh, verify diagnostics, then **unset ALLOW** and redeploy. Do not leave ALLOW enabled for the weekday cron (Stooq-only default until M4).

**Preview:** Do not set `MARKETSTACK_ACCESS_KEY` or `ALLOW_MARKETSTACK_FALLBACK` on Preview deployments.

**Unsafe without discipline:** repeated `force=1`, `debug=1` during ALLOW windows, smoke/research scripts with ALLOW enabled, leaving ALLOW on overnight. See the [operator refresh doc](./MARKETSTACK_OPERATOR_REFRESH.md#unsafe-commands--avoid).

**Emergency rollback:** Unset `ALLOW_MARKETSTACK_FALLBACK`; optionally set `DISABLE_MARKETSTACK_FALLBACK=true`; redeploy Production. Details in [operator refresh — rollback](./MARKETSTACK_OPERATOR_REFRESH.md#emergency-rollback).

**PDBC** and **BTC-USD** keep their existing AlphaVantage/DBC and Stooq→CoinGecko paths — they are not routed through Marketstack.

**Usage audit:** [MARKETSTACK_API_USAGE_AUDIT.md](./MARKETSTACK_API_USAGE_AUDIT.md) — call paths, trigger classification, and billing containment (M2 guard implemented).

#### Vercel environment guidance

| Environment | `MARKETSTACK_ACCESS_KEY` | `ALLOW_MARKETSTACK_FALLBACK` |
|-------------|--------------------------|------------------------------|
| **Preview** | Do not set | Do not set |
| **Development** (Vercel) | Do not set | Do not set |
| **Production** | May remain set | **Unset by default**; `true` only during approved fallback window, then unset |
| **Local dev** | Optional for manual tests | Unset by default; `true` only with budget awareness |

**After M2/M3:** The weekday daily cron remains **Stooq-only** while `ALLOW_MARKETSTACK_FALLBACK` is unset. Redeploy Production after any env change.

**Where to configure Marketstack (scheduled refresh):** The GitHub Actions daily workflow only **calls the live Vercel API** (`?force=1`). Market data is fetched **inside that deployment**, so keys and flags must be set in **Vercel Production** — putting credentials only in GitHub Actions secrets does **not** unlock Marketstack for production refresh.

### Manual Execution

**Via GitHub Actions UI**:
1. Go to: `https://github.com/firemansghost/ghost-allocator/actions`
2. Select "GhostRegime Daily Refresh" workflow
3. Click "Run workflow" → "Run workflow"

**Via API** (requires secret). Use the **root domain** as base URL (not a path like `/ghostregime`):
```bash
curl -H "x-ghostregime-cron: YOUR_SECRET" \
  "https://ghost-allocator.vercel.app/api/ghostregime/today?force=1&cb=$(date +%s)"
```
**Base URL**: Always use the site root (e.g. `https://ghost-allocator.vercel.app`). API paths are `/api/ghostregime/today`, `/api/ghostregime/health`, etc. Do not use `https://.../ghostregime` as the base.

## Endpoints Reference

### `/api/ghostregime/today`
**Normal usage** (read-only):
```bash
curl https://ghost-allocator.vercel.app/api/ghostregime/today
```
- Returns persisted latest row
- `data_source: "persisted"`
- No authentication required

**Force refresh** (requires secret):
```bash
curl -H "x-ghostregime-cron: YOUR_SECRET" \
  "https://ghost-allocator.vercel.app/api/ghostregime/today?force=1&cb=$(date +%s)"
```
- Recomputes fresh from market data
- Persists if `stale=false`
- `data_source: "computed_forced"` (persisted) vs `"computed_forced_unpersisted"` (compute succeeded but blob write was skipped — see `serve_metadata.persist_rejected_reason`)
- Returns `401` if secret missing/invalid

**Debug mode** (no persistence):
```bash
curl "https://ghost-allocator.vercel.app/api/ghostregime/today?debug=1"
```
- Recomputes fresh with debug breakdown
- `data_source: "computed_debug"`
- Includes `debug_votes` object
- Never persists

### `/api/ghostregime/health`
**Health check**:
```bash
curl https://ghost-allocator.vercel.app/api/ghostregime/health
```

**Response codes**:
- `200 OK` - Latest row exists (may be `status: "WARN"` if stale/old)
- `503 NOT_READY` - No persisted latest row

**Response fields**:
- `ok: true/false` - Service health
- `status: "OK" | "WARN" | "NOT_READY"` - Status level
- `latest` - Full persisted row
- `freshness` - Age in days, max_age_days (4), is_fresh flag
- `warnings` - Array of warning messages (if any)

## Common Failure Modes (Check First)

1. **503 NOT_READY or NOT_SEEDED**
   - **NOT_SEEDED**: Seed file missing or empty at `data/ghostregime/seed/ghostregime_replay_history.csv`. Add or restore the file and redeploy.
   - **NOT_READY**: No persisted latest row (e.g. Blob not configured, or force refresh never succeeded). Set `BLOB_READ_WRITE_TOKEN` and run a manual force refresh.

2. **401 Unauthorized on force refresh**
   - `GHOSTREGIME_CRON_SECRET` missing or mismatch between Vercel and GitHub Actions. Set in both and ensure values match.

3. **Stale data (MISSING_CORE_SERIES, INSUFFICIENT_HISTORY, etc.)**
   - Check provider status (AlphaVantage, CBOE VIX, Stooq). See “Workflow Fails with Stale Data” and “Missing Core Symbols” below.

4. **Workflow skipped**
   - Seed file missing/empty or `GHOSTREGIME_CRON_SECRET` unset in GitHub Actions. Fix guard conditions and re-run.

## Troubleshooting

### Workflow Fails with 401 Unauthorized

**Symptom**: `❌ API error: UNAUTHORIZED - force mode requires valid cron secret`

**Cause**: `GHOSTREGIME_CRON_SECRET` not set or incorrect in GitHub Actions secrets

**Fix**:
1. Go to: `https://github.com/firemansghost/ghost-allocator/settings/secrets/actions`
2. Verify `GHOSTREGIME_CRON_SECRET` exists and matches Vercel env var
3. If missing, add it with the same value as `GHOSTREGIME_CRON_SECRET` in Vercel

### Workflow Fails with Stale Data

**Symptom**: `❌ Stale=true: <reason>`

**Common reasons**:
- `MISSING_CORE_SERIES` - One or more core symbols failed to fetch
- `INSUFFICIENT_HISTORY` - Not enough observations for required windows
- `INSUFFICIENT_HISTORY_VAMS` - VAMS symbols (SPY, GLD, BTC) need >= 400 obs
- `MISSING_TIEBREAK_INPUT` - PDBC data insufficient for tie-break calculation

**Diagnosis**:
1. Check workflow logs for `missing_core_symbols` array
2. Check `core_symbol_status` for provider errors
3. Verify market data providers are operational:
   - **Stooq**: `https://stooq.com/q/d/l/?s=spy.us&d1=...&d2=...&i=d`
   - **CBOE VIX**: `https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv`
   - **AlphaVantage**: Check rate limits (free tier: 5 calls/min, 500/day)

**Fix**:
- If provider is down: Wait for provider recovery (usually resolves within hours)
- If rate-limited: Wait for rate limit reset (AlphaVantage: daily limit resets at midnight UTC)
- If insufficient history: Check if fetch window is large enough (should be >= 600 calendar days for VAMS)

### Health Check Shows WARN

**Symptom**: `⚠️ Health WARN - Latest: 2025-12-10, Age: 6 days`

**Causes**:
- Weekend/holiday (expected - no new data)
- Workflow failed to run
- Market data providers unavailable

**Action**:
- If weekend/holiday: Normal, no action needed
- If weekday: Check workflow logs for failures
- If persistent: Check provider status and Vercel deployment

### Missing Core Symbols

**Symptom**: `missing_core_symbols: ["VIX", "PDBC"]`

**Diagnosis**:
1. Check `core_symbol_status` in workflow logs or health response
2. Look for provider-specific errors:
   - **VIX (CBOE)**: Check if CSV URL is accessible
   - **PDBC (AlphaVantage)**: Check rate limits, API key validity
   - **ETFs (Stooq)**: Check if symbol mapping is correct; check `provider_diagnostics.stooq_probe` for HTTP/body/outcome

**Provider-specific fixes**:
- **AlphaVantage**: Verify `ALPHAVANTAGE_API_KEY` in Vercel env vars
- **CBOE VIX**: Usually reliable, check if CSV format changed
- **Stooq**: Stooq may return **API-key / captcha instructions** (plaintext) instead of CSV when `STOOQ_API_KEY` is not set. Obtain a key via [Stooq get_apikey](https://stooq.com/q/d/?s=spy.us&get_apikey), then set `STOOQ_API_KEY` in Vercel. Responses are classified as `stooq_apikey_gate` in `stooq_probe`, not as “empty history” without explanation.
- **BTC-USD**: **Yahoo Finance chart** is the primary bootstrap provider (600+ calendar days). Fallback order: **Yahoo → Stooq `btcusd` → CoinGecko public (recent-only)**. ETFs still use Stooq first (optional Marketstack fallback).

### Typical Provider Issues

**AlphaVantage (PDBC)**:
- **Rate limit**: "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day."
- **Fix**: Wait for rate limit reset or upgrade to premium tier
- **Fallback**: System automatically uses DBC (Stooq) as proxy

**CBOE VIX**:
- **CSV format change**: Rare, but check if column names changed
- **Network timeout**: Retry usually works

**Stooq**:
- **API key required**: Plaintext body starting with “Get your apikey” means CSV was not returned — configure `STOOQ_API_KEY`.
- **Browser / JS challenge**: HTML bodies mentioning JavaScript or browser verification are classified as `stooq_browser_challenge`. **Do not rely on Stooq for BTC bootstrap** — Yahoo is primary for `BTC-USD`.
- **Symbol mapping**: Verify `STOOQ_SYMBOL_MAP` in `lib/ghostregime/marketData.ts`
- **Diagnostics**: `provider_diagnostics.stooq_probe[symbol].body_preview` shows the first ~500 chars of the response; `outcome` distinguishes `stooq_apikey_gate`, `stooq_browser_challenge`, `non_csv_unexpected`, `csv_ok`, etc.

**BTC-USD refresh (VAMS bootstrap)**:
- **Provider order**: Yahoo Finance chart → Stooq `btcusd` (optional) → CoinGecko public (recent-only gap-fill).
- **VAMS requirement unchanged**: `vams_min_observations_at_asof` = **400** at market as-of. Do not lower this gate.
- **CoinGecko public**: Cannot bootstrap 400+ observations — public tier is capped to ~**360 calendar days** (`coingecko_public_lookback_limited` / `coingecko_public_lookback_exceeded` in `provider_diagnostics.btc_probe`). Not bootstrap-capable.
- **Failed refresh**: Blob **latest is preserved** when `stale=true` or history is insufficient (`serve_metadata.persisted_snapshot_preserved: true`). This is intentional.
- **Deploy before CI passes**: The daily GitHub workflow calls **Vercel Production** (`?force=1`). Code and env changes must be **deployed to Vercel Production** before the workflow will see the fix.
- **Slack**: `SLACK_WEBHOOK_URL` is optional; missing webhook does **not** cause refresh failure.

## Environment Variables

### Vercel (production)

| Variable | Purpose |
|----------|---------|
| `GHOSTREGIME_CRON_SECRET` | Secret for force mode; must match the value in GitHub Actions. If missing, force refresh returns 401. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token. Required for persisting latest row and history. If missing, persistence fails and health can stay NOT_READY. |
| `ALPHAVANTAGE_API_KEY` | AlphaVantage API key for PDBC (optional; falls back to DBC via Stooq if unset). |
| `STOOQ_API_KEY` | Stooq CSV download API key (required when Stooq serves the captcha/API-key gate instead of CSV for `/q/d/l/`). Append to requests server-side; do not expose as `NEXT_PUBLIC_*`. |
| `MARKETSTACK_ACCESS_KEY` | Optional paid Marketstack fallback for core ETF symbols when Stooq fails. Required in Vercel Production for the live API used by the daily workflow. GitHub Actions secrets alone do not provide this env var to the deployed Vercel function. After adding/changing this env var, redeploy Production. |
| `NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC` | (Optional) Cutover date for seed vs persistence; default `2025-11-28T00:00:00Z`. |

Seed presence is not an env var: the app expects the seed file at `data/ghostregime/seed/ghostregime_replay_history.csv` in the repo. If missing or empty, today/explain/history return 503 NOT_SEEDED and the daily workflow skips.

### GitHub Actions

| Variable | Purpose |
|----------|---------|
| `GHOSTREGIME_CRON_SECRET` | Must match Vercel; used in `x-ghostregime-cron` header for force refresh. If unset, workflow skips. |
| `SLACK_WEBHOOK_URL` | (Optional) Failure notifications. |

## Manual Interventions

### Force Refresh After Provider Recovery

If a provider was down and is now back:
```bash
# Check health first
curl https://ghost-allocator.vercel.app/api/ghostregime/health

# Force refresh (requires secret)
curl -H "x-ghostregime-cron: YOUR_SECRET" \
  "https://ghost-allocator.vercel.app/api/ghostregime/today?force=1&cb=$(date +%s)"
```

### Verify Latest Row

```bash
# Check health
curl https://ghost-allocator.vercel.app/api/ghostregime/health | jq '.latest'

# Check specific fields
curl https://ghost-allocator.vercel.app/api/ghostregime/health | jq '.latest.date, .latest.regime, .latest.stale'
```

### Debug Regime Calculation

```bash
# Get debug breakdown
curl "https://ghost-allocator.vercel.app/api/ghostregime/today?debug=1" | jq '.debug_votes'
```

## Monitoring

### GitHub Actions Logs
- Location: `https://github.com/firemansghost/ghost-allocator/actions`
- Check workflow summary for:
  - Force refresh success/failure
  - Health check status
  - Missing core symbols
  - Provider errors

### Vercel Function Logs
- Location: Vercel Dashboard → Your Project → Functions
- Check for:
  - API errors
  - Provider fetch failures
  - Persistence errors

### Health Endpoint
- Monitor: `https://ghost-allocator.vercel.app/api/ghostregime/health`
- Alert on: `ok: false` or persistent `status: "WARN"` on weekdays

## Emergency Procedures

### System Not Ready (503)

**If health returns `NOT_READY`** (no persisted latest row):
1. Confirm seed file exists and is non-empty: `data/ghostregime/seed/ghostregime_replay_history.csv` (see `data/ghostregime/seed/README.md`).
2. Confirm `BLOB_READ_WRITE_TOKEN` is set in Vercel.
3. Run a manual force refresh (with valid `GHOSTREGIME_CRON_SECRET`). After a successful force, health should return 200.

**If today/explain/history return 503 with `GHOSTREGIME_NOT_SEEDED`**:
1. Add or restore the seed CSV at `data/ghostregime/seed/ghostregime_replay_history.csv` and redeploy.

### Persistent Stale Data

**If stale persists for multiple days**:
1. Check all provider statuses
2. Verify environment variables are set
3. Check Vercel deployment status
4. Review function logs for errors
5. Consider manual force refresh after provider recovery

### Data Corruption

**If history or latest appears corrupted**:
1. Check Blob storage directly (Vercel Dashboard)
2. Verify model version matches (`ghostregime-v1.0.2`)
3. If needed, bump model version to start fresh (in `lib/ghostregime/config.ts`)

## Quick Reference

**Force refresh**:
```bash
curl -H "x-ghostregime-cron: SECRET" \
  "https://ghost-allocator.vercel.app/api/ghostregime/today?force=1"
```

**Check health**:
```bash
curl https://ghost-allocator.vercel.app/api/ghostregime/health
```

**Debug mode**:
```bash
curl "https://ghost-allocator.vercel.app/api/ghostregime/today?debug=1"
```

**Normal read**:
```bash
curl https://ghost-allocator.vercel.app/api/ghostregime/today
```














