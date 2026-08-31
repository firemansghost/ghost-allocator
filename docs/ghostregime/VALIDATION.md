# GhostRegime Validation & Acceptance Tests

## Canonical deterministic suite (R1)

Authoritative command:

```text
npm run test:ghostregime
```

Implementation: `scripts/ghostregime/run-tests.ts`. It walks `lib/ghostregime/__tests__/` and `lib/ghostregime/parity/__tests__/` for `*.test.ts` in sorted order (no shell glob). That directory walk is the single list of the complete deterministic GhostRegime unit suite.

Project-level `npm test` runs `test:ghostregime` then the existing `test:ghostflow` suite (GhostFlow semantics unchanged).

`npm run verify:ghostregime` is operational verification, not a second test list:

```text
verify:ghostregime → build → lint → test:ghostregime
```

Copy/legend static checks (`check:ghostregime-copy`, `check:ghostregime-legend`, `verify:reference-clean`) and opt-in reference replay (`RUN_PARITY_TESTS=1` rows inside `kissAlloc.test.ts`) stay outside the meaning of “canonical unit suite.” `kissAlloc.test.ts` itself is discovered; its local allocation math always runs; workbook snapshot/backtest cases skip unless `RUN_PARITY_TESTS=1` and local reference files exist.

Live/network/secret-dependent verification is **not** part of `test:ghostregime`. Do not treat production `/today`, paid Marketstack, or blob writes as unit coverage.

### Test classes (do not collapse)

| Class | Meaning |
|-------|---------|
| **Stable invariants** | Should remain true after later phases (`r1Invariants.test.ts` plus existing allocation/regime math). |
| **Current-behavior characterization** | Documents what the code does today; expected to change in a named later phase (`r3*.characterization.test.ts`, `r4*.characterization.test.ts`, `r5*.characterization.test.ts`, `r6*.characterization.test.ts`). |
| **Deferred desired behavior** | Not installed as passing R1 invariants. Become authoritative when the corresponding fix lands. |

Deferred R2 targets (no R1 failing tests; no production change):

- normal public GET performs no provider fetch
- anonymous debug cannot reach paid fallback
- error path performs no duplicate provider fetch

Existing `scheduledRefreshEngine.test.ts` characterizes **scheduled** preflight skip only. Public-read / debug / error-path fetch tests need engine/API seams and wait for R2.

Deferred R6 product-truth (characterized, not desired invariants):

- neutral receipts render Neutral
- coverage means data availability
- VAMS half-size is never described as “off” in product copy
- rounded headline totals remain coherent

R3/R4/R5 remain gated. Characterization tests lock current C0/Flip Watch/satellite behavior so later diffs are obvious. They do not authorize production changes.

## Invariants

### Allocation Math
- Allocations always sum to 1 within 1e-6 tolerance — **stable invariant** (canonical suite)
- Scales always in {1, 0.5, 0} — **stable invariant**
- Cash is clamped to [0, 1] — current engine behavior

### Regime Classification
- Regime values are the four-regime enum: GOLDILOCKS, REFLATION, INFLATION, DEFLATION
- RiskOn + non-positive inflation → GOLDILOCKS; RiskOn + positive inflation → REFLATION; RiskOff + positive inflation → INFLATION; RiskOff + non-positive inflation → DEFLATION (current zero behavior) — **stable invariant**
- Risk regime mapping: GOLDILOCKS/REFLATION → RISK ON; INFLATION/DEFLATION → RISK OFF

### Flip Watch
Current production behavior is **telemetry/status**, not a persistence gate. `shouldApplyFlip()` exists and is tested in isolation; R0 found the engine does not use it to delay regime or allocations.

- Ordinary regime change can return `PENDING_CONFIRMATION` — **R4 characterization**
- Negative `daysSinceLastFlip` satisfies the current `<= confirmationDays` condition — **R4 characterization**
- `STRONG_FLIP` when `max(|risk|,|infl|) >= 2` — **R4 characterization**
- PLAN / older VALIDATION copy that claimed a 2-day confirmation **persistence guard** is **stale** relative to production. Whether to keep telemetry or implement real confirmation is the R4 product gate. Do not treat confirmation as currently enforced.

### Stress Override
- Stress override helper triggers only when both conditions met:
  - VIX > 30
  - TR_63(HYG/IEF) <= -0.02
- Helper forces RISK OFF from RISK ON when triggered — **characterization** of the exported function
- `risk_axis` is not recomputed by this helper. R0 found no stored axis/label clash; keep as a test concern, not a proven production incident.

### VAMS
- ✅ VAMS states are -2, 0, or 2
- ✅ VAMS scores use close-to-close returns (NOT total return)
- ✅ VAMS scales map correctly: 2→1, 0→0.5, -2→0

### Data Windows
- ✅ TR_21/TR_63/TR_126/TR_252 use "N observations" approach
- ✅ ETFs/VIX naturally skip weekends/holidays
- ✅ BTC uses calendar observations

## Parity Checklist for 2025-11-28

Anchor date: 2025-11-28 (e.g., BG7283/BH7283 and A2068 in workbook)

### Replay Mode
- ✅ All rows with date ≤ 2025-11-28 load from seed CSV
- ✅ Source is set to "replay" for all seed rows
- ✅ Regime classifications match workbook BG labels
- ✅ Risk regimes match workbook BH behavior

### Computed Mode
- ✅ All rows with date > 2025-11-28 are computed
- ✅ Source is set to "computed" for all computed rows
- ✅ Computed regime uses Option B voting + satellites
- ✅ VAMS uses BTC-USD driver (not workbook selector)

## Calibration Acceptance

- ✅ Calibration improves disagreement vs BG history by ≥10% vs baseline
- ✅ Threshold adjustments are within reasonable bounds
- ✅ Calibrated thresholds maintain regime classification logic

## Error Handling

- ✅ Missing seed file returns 503 with GHOSTREGIME_NOT_SEEDED error
- ✅ Empty seed file (header-only) returns 503
- ✅ Missing market data returns stale=true with MARKET_DATA_UNAVAILABLE
- ✅ Rate-limited data sources return stale=true gracefully
- ✅ Concurrent writes return stale=true rather than corrupting history
- ✅ GHOSTREGIME_NOT_READY includes diagnostics (asof_date_attempted, missing_core_symbols, core_symbol_status, provider_diagnostics)

## Market Data Provider Validation

- ✅ VIX provider is CBOE (not Stooq, not FRED)
- ✅ `core_symbol_status.VIX.provider === "CBOE"`
- ✅ `core_symbol_status.VIX.obs >= 300` (ideally 400+)
- ✅ `core_symbol_status.VIX.ok === true` on normal trading days
- ✅ All core symbols have sufficient history (>= 400 obs for VAMS symbols)

## As-of Date Validation

- ✅ `date` field equals computed `asof_date` (latest common market close across core instruments)
- ✅ `run_date_utc` field equals server date in UTC
- ✅ `date` is always a trading day (not weekend)
- ✅ On weekends, returns last trading day's data with `stale=true` (if available) or `GHOSTREGIME_NOT_READY`
- ✅ No new rows are persisted with weekend dates

## Storage

- ✅ Blob storage uses correct keys
- ✅ History is append-only (JSONL format)
- ✅ Latest is atomic update
- ✅ Meta includes version and lastUpdated timestamp
- ✅ Local file adapter works in dev mode

## API Endpoints

- ✅ `/api/ghostregime/today` returns today's row or 503 if not seeded
- ✅ `/api/ghostregime/history` returns history with optional date filtering
- ✅ Both endpoints check seed status first
- ✅ Both endpoints handle errors gracefully



