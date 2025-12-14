# GhostRegime Validation & Acceptance Tests

## Invariants

### Allocation Math
- ✅ Allocations always sum to 1 within 1e-6 tolerance
- ✅ Scales always in {1, 0.5, 0}
- ✅ Cash is clamped to [0, 1]

### Regime Classification
- ✅ No more than one regime flip per day
- ✅ Regime values are valid enum: GOLDILOCKS, REFLATION, INFLATION, DEFLATION
- ✅ Risk regime matches regime mapping rules

### Flip Watch
- ✅ Flip watch triggers correctly on day 1/2 pending flips
- ✅ Flip watch triggers correctly during chop zone
- ✅ Strong flip (abs(score) >= 2) allows immediate flip
- ✅ Persistence guard enforces 2-day confirmation for non-strong flips

### Stress Override
- ✅ Stress override triggers only when both conditions met:
  - VIX > 30
  - TR_63(HYG/IEF) <= -0.02
- ✅ Stress override forces RiskOff regardless of current risk regime

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

