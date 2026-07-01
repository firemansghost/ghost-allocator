# Marketstack Operator Refresh Discipline

**GhostRegime ops:** [RUNBOOK](./RUNBOOK.md) · [API Usage Audit](./MARKETSTACK_API_USAGE_AUDIT.md)

M3 operator guide — when and how to enable **emergency** paid Marketstack fallback (after Stooq **and** Yahoo fail), run a controlled refresh, verify results, and shut fallback back off. **Docs only;** enforcement is in the M2 guard (`lib/ghostregime/marketstackGuard.ts`).

---

## Default stance

| Principle | Detail |
|-----------|--------|
| **Default** | Marketstack fallback is **disabled** |
| **Key alone** | `MARKETSTACK_ACCESS_KEY` **does not spend quota** after M2 |
| **Paid unlock** | `ALLOW_MARKETSTACK_FALLBACK=true` is required to spend Marketstack quota |
| **Role** | Marketstack is a **paid emergency fallback**, not the normal data source |
| **Primary source** | **Stooq** remains first for core US ETF symbols (SPY, GLD, EEM, HYG, IEF, TIP, TLT, UUP) |
| **Free fallback** | **Yahoo Finance chart** runs automatically when Stooq fails (no env flag). Expect `resolvedIds` like `yahoo:SPY` in Production after deploy. |

Fallback ETF set and guard behavior are documented in the [API Usage Audit](./MARKETSTACK_API_USAGE_AUDIT.md) (M1/M2).

---

## Environment policy

| Environment | `MARKETSTACK_ACCESS_KEY` | `ALLOW_MARKETSTACK_FALLBACK` | Marketstack spend |
|-------------|--------------------------|------------------------------|-------------------|
| **Preview** | Do not set | Do not set | **Never** |
| **Tests / build** | N/A (hard-blocked by M2) | N/A | **Never** |
| **Local dev** | Optional locally | **Unset by default** | Only if both set intentionally and briefly |
| **Production** | May remain set (credential on file) | **Unset by default** | Only during an approved paid fallback window |
| **Weekday cron (until M4)** | May exist on Production | **Should stay unset** | Cron uses Stooq → Yahoo by default; Marketstack only if both fail **and** ALLOW is set |

**Preview:** Never deploy with `MARKETSTACK_ACCESS_KEY` or `ALLOW_MARKETSTACK_FALLBACK`. M2 also hard-blocks Preview at runtime.

**Production:** Keeping the access key stored avoids re-entering credentials during emergencies; **ALLOW** is the billing switch. Do not leave ALLOW enabled permanently.

**Vercel:** Env var changes apply to **new deployments**. Redeploy Production after changing ALLOW or DISABLE flags.

---

## Safe manual paid recovery checklist

Use only when **both Stooq and Yahoo** have failed for fallback ETF symbols and a paid recovery refresh is worth the cost.

1. **Confirm Stooq and Yahoo failure** — Inspect `provider_diagnostics.stooq_probe`, `yahoo_probe`, `feed_routing`, and `errors` on a stale `today` response or `?debug=1` run. Confirm Stooq failed first and Yahoo did not recover (e.g. `feed_routing` shows `→ Yahoo (chart_failed)` or similar), not unrelated providers (BTC, PDBC, VIX).

2. **Check Marketstack usage/budget** — Review the Marketstack dashboard before spending quota.

3. **Record reason** — Note date, operator, symbols affected, and why paid fallback is justified (task log / incident ticket).

4. **Enable paid unlock** — In **Vercel Production**, set `ALLOW_MARKETSTACK_FALLBACK=true`.

5. **Redeploy Production** — Required so the running deployment receives the new env.

6. **Run one controlled refresh** — Single `force=1` call with cron secret (no loops, no repeated curls):

```bash
curl -H "x-ghostregime-cron: $SECRET" \
  "https://ghost-allocator.vercel.app/api/ghostregime/today?force=1&cb=$(date +%s)"
```

7. **Verify response / diagnostics:**
   - `stale=false` if persist succeeded (or understand `serve_metadata` if not)
   - `provider_diagnostics.yahoo_probe` — should show `chart_ok` for symbols recovered by Yahoo when Stooq failed
   - `provider_diagnostics.marketstack_probe` — `outcome: ok` only for symbols that needed **emergency** fallback after Yahoo; not `guard_blocked`
   - `guard_reason` — should be absent on successful Marketstack rows; if ALLOW was active, failed symbols should not show `marketstack_disabled_by_guard`
   - `feed_routing` — e.g. `Stooq (stooq_browser_challenge) → Yahoo (chart_ok, rows=…)` when Yahoo wins; `Stooq (…) → Yahoo (…) → Marketstack (ok, rows=…)` only when Yahoo also failed
   - `resolvedIds` — prefer `yahoo:SPY` etc. in normal operation; `marketstack:SPY` indicates emergency paid fallback
   - **No secrets** in JSON (`access_key`, raw key values, or full URLs with keys)

8. **Confirm scope** — Only the eight fallback ETFs should use Marketstack. PDBC, BTC-USD, and VIX use other paths.

9. **Disable paid unlock** — Unset or delete `ALLOW_MARKETSTACK_FALLBACK` on Vercel Production.

10. **Redeploy again** — So cron and runtime return to Stooq-only default.

11. **Record completion** — Note outcome, symbols that used Marketstack, and approximate usage impact from the Marketstack dashboard.

---

## Verify no accidental spend

| Check | Expected when fallback is off |
|-------|-------------------------------|
| **ALLOW unset** | If Stooq and Yahoo both fail for a fallback ETF, `marketstack_probe[symbol].outcome` is `guard_blocked` with `guard_reason: marketstack_disabled_by_guard` |
| **Weekday cron** | Marketstack dashboard usage should **not** increase when ALLOW is unset |
| **Build / `verify:ghostregime`** | No Marketstack HTTP (M2 build/test guards) |
| **Preview** | No key, no ALLOW; hard-blocked even if misconfigured |
| **Normal `GET /today`** | Usually serves persisted snapshot — low recompute risk |

**Quick read-only check (no force):**

```bash
curl -s "https://ghost-allocator.vercel.app/api/ghostregime/health" | head -c 2000
```

For provider detail after a refresh attempt, use the controlled `force=1` response or `?debug=1` only when diagnosing (see unsafe commands).

---

## Unsafe commands / avoid

| Avoid | Why |
|-------|-----|
| **Repeated `force=1` curls** | Each run can refetch ~600 calendar days across all symbols |
| **Leaving ALLOW enabled overnight** | Weekday cron inherits ALLOW and can trigger paid fallback storms |
| **`npm run smoke:pages` with ALLOW on server** | Can hit `/api/ghostregime/today` and recompute |
| **Research scripts** (`ghostregime:compare-vams-profiles`, etc.) **with ALLOW enabled** | Local or remote live fetches with paid fallback |
| **Preview with Marketstack key** | Misconfiguration risk; Preview is never a fallback target |
| **`debug=1` during ALLOW window** | Unnecessary full recompute without persistence benefit |
| **Enabling ALLOW before M4 without accepting cron risk** | Daily `force=1` + ALLOW + Stooq failure = repeated billing |

**Safe by default after M2:** `GET /health`, `GET /today` (no force), `verify:ghostregime`, `ghostregime:setup-reference`, `ghostregime:state-parity`.

**Operator-only / use with care:** `force=1`, `debug=1`, GhostRegime research scripts.

---

## Emergency rollback

1. **Unset** `ALLOW_MARKETSTACK_FALLBACK` on Vercel Production (delete the var or clear the value).

2. **Optional hard shutoff** — Set `DISABLE_MARKETSTACK_FALLBACK=true` to block fallback even if ALLOW is set by mistake.

3. **Redeploy Production** — Env changes require a new deployment.

4. **Confirm guard active** — Trigger or inspect a response where Stooq would fail; expect `guard_blocked` / `marketstack_disabled_by_guard` in `marketstack_probe`.

5. **Remove DISABLE when resolved** — If normal guarded behavior should resume (ALLOW still unset by default), clear `DISABLE_MARKETSTACK_FALLBACK` and redeploy.

---

## Local dev rules

- Use **mocked unit tests** by default (`marketstackGuard.test.ts`, `marketDataMarketstackGuard.test.ts`, etc.).
- **Never commit** `.env` or API keys.
- Do **not** set `ALLOW_MARKETSTACK_FALLBACK=true` unless intentionally testing paid fallback with budget awareness.
- Avoid broad **research scripts** (`ghostregime:*` that call `getHistoricalPrices`) while ALLOW is set locally.
- `NODE_ENV=test` hard-blocks Marketstack even with ALLOW — prefer tests over live calls.

---

## Cron posture (M4)

| Item | Current behavior |
|------|------------------|
| **Schedule** | Weekdays — `.github/workflows/ghostregime-daily.yml` calls Production `/api/ghostregime/today?refresh=scheduled` |
| **Fresh snapshot** | Preflight uses health-aligned freshness (`max_age_days = 4`) — Monday cron may serve Friday close without market fetch |
| **ALLOW unset (default)** | Recompute path is Stooq-only; Marketstack blocked by M2 guard |
| **Manual recovery** | Operators use `?force=1` with temporary ALLOW — not the weekday cron |
| **M5 (future)** | Cache/de-dupe for repeated fetches when recompute is needed |

See [API Usage Audit — implementation ladder](./MARKETSTACK_API_USAGE_AUDIT.md#implementation-ladder).

---

## Cross-links

| Document | Purpose |
|----------|---------|
| [RUNBOOK.md](./RUNBOOK.md) | Daily workflow, endpoints, troubleshooting |
| [MARKETSTACK_API_USAGE_AUDIT.md](./MARKETSTACK_API_USAGE_AUDIT.md) | Call paths, M1–M6 ladder, M4 problem statement |
| M2 guard (code) | `lib/ghostregime/marketstackGuard.ts`, `marketData.ts`, `marketstackEod.ts` — fail-closed enforcement |

---

## Guardrails (this document)

- Operator policy only — no implementation changes in M3
- No live Marketstack API calls required to follow this guide
- No secrets in this document
