# GhostRegime Operational Runbook

## Overview

GhostRegime is a market regime classifier that runs automatically via GitHub Actions on weekdays. This runbook covers operational procedures, troubleshooting, and manual interventions.

## GhostRegime Data Flow

1. **Seed** — CSV at `data/ghostregime/seed/ghostregime_replay_history.csv` provides bootstrap history for dates **≤ cutover** (default `2025-11-28` UTC). Used for deterministic local behavior and to serve history/today for past dates.
2. **Cutover** — Configurable via `NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC`. Dates **after** cutover are not read from the seed.
3. **Persistence** — For dates after cutover, the engine computes from live market data and writes the latest row to Vercel Blob storage. Reads (today, health, history) use this persisted state when available.

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
- `data_source: "computed_forced"`
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
   - **ETFs (Stooq)**: Check if symbol mapping is correct

**Provider-specific fixes**:
- **AlphaVantage**: Verify `ALPHAVANTAGE_API_KEY` in Vercel env vars
- **CBOE VIX**: Usually reliable, check if CSV format changed
- **Stooq**: Usually reliable, check if symbol IDs changed

### Typical Provider Issues

**AlphaVantage (PDBC)**:
- **Rate limit**: "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day."
- **Fix**: Wait for rate limit reset or upgrade to premium tier
- **Fallback**: System automatically uses DBC (Stooq) as proxy

**CBOE VIX**:
- **CSV format change**: Rare, but check if column names changed
- **Network timeout**: Retry usually works

**Stooq**:
- **Symbol mapping**: Verify `STOOQ_SYMBOL_MAP` in `lib/ghostregime/marketData.ts`
- **Network issues**: Usually resolves quickly

## Environment Variables

### Vercel (production)

| Variable | Purpose |
|----------|---------|
| `GHOSTREGIME_CRON_SECRET` | Secret for force mode; must match the value in GitHub Actions. If missing, force refresh returns 401. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token. Required for persisting latest row and history. If missing, persistence fails and health can stay NOT_READY. |
| `ALPHAVANTAGE_API_KEY` | AlphaVantage API key for PDBC (optional; falls back to DBC via Stooq if unset). |
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














