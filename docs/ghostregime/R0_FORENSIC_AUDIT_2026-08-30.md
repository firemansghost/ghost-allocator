# GhostRegime R0 Forensic Audit — 2026-08-30

## Purpose

This document preserves the completed **R0 read-only forensic model-impact audit**. It exists so later Cursor/ChatGPT threads can reconstruct the evidence from GitHub rather than chat history.

This is a documentation-only record. It does **not** authorize production model, provider, workflow, UI, allocation, satellite, Flip Watch, VAMS, or test implementation. It does **not** authorize R3. It does **not** begin R1.

How to read this document — every quantitative claim belongs to one of these classes:

| Class | Meaning |
|-------|---------|
| **VERIFIED HISTORICAL** | Stored seed, sample, or persisted production rows (or their receipts) as they exist. |
| **RECONSTRUCTED CURRENT-CODE** | Replay of today's production functions on free/public reconstructed prices. **Not** historical production behavior. |
| **COUNTERFACTUAL** | Same replay or stored votes with one isolated change (C1 sign negation, S1 satellite exclusion). |
| **INFERENCE / NEEDS PRODUCT DECISION** | Interpretation, missing specification, or a later gated choice. |

**Reconstructed 2017–2025 results are not historical production behavior.** Seed-era C1 numbers are a current-code counterfactual study. They cannot be described as what GhostRegime did in production.

Parent architecture audit: [AUDIT_2026-08-30.md](./AUDIT_2026-08-30.md).  
Controlling sequencing decision: `docs/project-ops/DECISIONS.md` entry **2026-08-30 — GhostRegime remediation sequencing**. R0 produced evidence only; it did not add a new DECISIONS entry.

## Baseline

| Item | Value |
|------|--------|
| R0 analysis SHA / current `main` | `019aa383d595c1f775885d1db270c985f8f993d5` |
| Tracked R0 analysis changes | **none** |
| Parent audit checkpoint | PR **#166**, [AUDIT_2026-08-30.md](./AUDIT_2026-08-30.md) |
| Intervening commits since prior local `519092e` | PR #166 only (`5227379` docs commit + `019aa38` merge) |
| GhostRegime code / providers / workflows / tests / data in those commits | **unchanged** |

Temporary analysis artifacts lived under gitignored `tmp/ghostregime-r0/` and are **not** part of this checkpoint.

## Verdict

**IMPROVE IN PLACE remains justified.** R0 did not find a rebuild case.

R0 supports keeping the approved sequence:

```text
R1 — canonical test foundation
R2 — operational containment
R3 — inflation semantics, gated
R4 — Flip Watch product decision
R5 — satellite cleanup
R6 — UI truth
R7 — allocation research later
R8 — redesign only if evidence justifies
```

R0 does **not** authorize R3.  
R0 does **not** choose Flip Watch A/B.  
R0 does **not** remove satellites.  
**60/30/10 remains frozen through R0–R6.**

---

## 1. Evidence Inventory

### Seed — VERIFIED HISTORICAL

```text
2,066 rows
2017-12-29 → 2025-11-28
output history only
no individual underlying TR observations
```

Source: `data/ghostregime/seed/ghostregime_replay_history.csv`.

Also true of the seed:

- columns are aggregate scores, VAMS states, targets/scales/actuals/cash, `flip_watch_status`, `source`
- **no** individual TLT/UUP/PDBC/TIP/IEF returns
- **no** receipts, **no** `risk_axis` / `infl_axis`, **no** tie-break flags
- all 2,066 rows have `flip_watch_status = NONE`
- all 406 INFLATION rows use **gold_target = 0.30** (pre–KISS 8.0 15% rule)

### Sample — VERIFIED HISTORICAL

```text
50 rows
2025-09-22 → 2025-11-28
```

Same output-only schema as seed (last 50 seed-era dates): `data/ghostregime/ghostregime_replay_history.sample.csv`.

### Cutover

Code default: `2025-11-28T00:00:00Z`.

### Post-cutover persisted history — VERIFIED HISTORICAL

Read-only production `GET /api/ghostregime/history` + `/health`. No `/today`, no force-refresh, no Marketstack.

```text
137 raw rows
133 unique dates
2025-12-12 → 2026-08-28
125 / 133 unique dates with inflation receipts
```

Also true of persisted history:

- 3 duplicate dates (append-only rewrites): 2025-12-12, 2025-12-15, 2026-02-23
- **0** rows have `debug_votes` (no stored TR values)
- Flip Watch on unique latest-per-date rows: NONE 113, PENDING_CONFIRMATION 13, STRONG_FLIP 7
- latest persisted row matches the August 30 audit snapshot (INFLATION, core 0, sat +1, PENDING_CONFIRMATION, compute commit `d9473b02…`)

Receipts store **votes + labels + threshold notes**, not underlying return observations. That is enough to re-aggregate C1 on receipt-bearing persisted rows. It is **not** enough to recompute votes from prices.

### Raw / underlying signal history

**Not in the repo.** Seed, sample, and persisted rows do not store TRs.

### Reconstruction prices — RECONSTRUCTED CURRENT-CODE

Free/public sources only. Marketstack was not enabled or called.

```text
2017-08-03 → 2026-08-28
2,280 SPY trading dates
Yahoo chart + CBOE VIX
free/public sources only
no Marketstack
```

Price inventory used for that reconstruction:

| Series | Source | Rows | Span |
|--------|--------|------|------|
| SPY, HYG, IEF, EEM, TLT, UUP, TIP, GLD, PDBC, DBC | Yahoo chart | 2,679 each | 2016-01-04 → 2026-08-28 |
| VIX | Yahoo `^VIX` | 2,680 | 2016-01-04 → 2026-08-28 |
| VIX | CBOE CSV (used in replay) | 2,711 | 2016-01-04 → 2026-08-28 |
| BTC-USD | Yahoo | 3,894 calendar days | 2016-01-01 → 2026-08-30 |

BTC is calendar-daily; ETFs/VIX skip weekends/holidays. Replay used SPY trading dates as the as-of calendar. The 2,280-day window is the set of SPY dates with ≥400 ETF/BTC observations for VAMS.

### Maximum defensible claims

- **Current-code reconstruction (C0/C1/S1):** 2017-08-03 → 2026-08-28, 2,280 SPY dates.
- **Production-adjacent C1 (stored votes):** 125 receipt-bearing persisted dates, 2025-12-12 → 2026-08-28.
- **Historical production impact from seed:** **not defensible** (see parity gate).

---

## 2. Replay Method

C0 reused current production functions, not retyped thresholds:

- `computeOptionBVotes`, `classifyRegime`, `mapToRiskRegime`, `applyStressOverride`
- `processSatellites`, `resolveSatelliteData`, `SATELLITE_CONFIGS`, `DefaultSatelliteDataProvider`
- `computeAllVamsStates`, `computeAllocations`
- `detectFlipWatch` (status only; `shouldApplyFlip` confirmed unused)
- `calculateTR`, `calculateRatioTR`, `getLastNObservations`
- Config: `VOTE_THRESHOLDS`, `STRESS_OVERRIDE`, `TIEBREAK_RULE`, `ALLOCATION_TARGETS`

C1 changed **only** TLT/UUP numeric sign semantics:

```text
C1_core = C0_core − 2×tltVote − 2×uupVote
```

No thresholds, satellites, VAMS, allocations, risk logic, or 60/30/10 changes.

S1 set satellite contribution to 0, then reapplied tie-break. **S1 was diagnostic only**, not a proposal to remove satellites.

This replay is:

- **RECONSTRUCTED CURRENT-CODE** for the 2,280-day window
- **not** historical production behavior for the seed era
- **both**, with caveats, for post-cutover persisted dates: C0 matches 130/133 regimes; 3 risk-axis disagreements remain, including the live 2026-08-28 row

Targeted tests run during R0 (no mutations): `regimeCore.test.ts` pass (5), `allocations.test.ts` pass (4), `flipWatchPressure.test.ts` pass, `vamsProfiles.test.ts` pass. No satellite unit tests exist.

---

## 3. Parity Gate

### Seed overlap — VERIFIED HISTORICAL vs RECONSTRUCTED CURRENT-CODE

```text
1,990 dates
regime match = 769 / 1,990 = 38.6%
```

| Field | Match | Mismatch | Rate |
|-------|------:|---------:|-----:|
| regime | 769 | 1,221 | **38.6%** |
| risk_regime | 1,439 | 551 | 72.3% |
| infl_core_score | 696 | 1,294 | 35.0% |
| infl_sat_score | 671 | 1,319 | 33.7% |
| infl_score | 293 | 1,697 | 14.7% |
| risk_score | 1,226 | 764 | 61.6% |

Likely mismatch classes (**INFERENCE**, not proven):

1. **Different vintage model** — seed INFLATION gold is always 30%; current code uses 15%. Seed `infl_core` values of 3–4 appear on dates C0 cannot produce the same way.
2. **No current satellite/fallback semantics in seed** — seed often has `infl_sat_score = 0` where C0’s PDBC TR21 satellite votes.
3. **Provider/price path** — seed generation process is still TBD (seed README). Yahoo/CBOE reconstruction is not the original compute path.
4. **Flip Watch never recorded** — seed is 100% NONE despite many regime changes.

**Therefore seed-era C1 results cannot be called historical production impact.**

### Post-cutover persisted — VERIFIED HISTORICAL vs RECONSTRUCTED CURRENT-CODE

```text
130 / 133 regime matches = 97.7%
```

| Field | Match | Mismatch | Rate |
|-------|------:|---------:|-----:|
| regime / risk_regime | 130 | 3 | **97.7%** |
| risk_score | 125 | 8 | 94.0% |
| infl_core_score | 114 | 19 | 85.7% |
| infl_sat_score | 131 | 2 | 98.5% |
| gold_vams_state | 133 | 0 | 100% |
| btc_vams_state | 111 | 22 | 83.5% |
| gold_target | 115 | 18 | 86.5% |

The 18 gold-target misses are largely **stored INFLATION rows with gold 0.30** (e.g. 2026-02-05/12) from before the 15% INFLATION gold policy was in the compute that wrote those rows. C0 correctly applies current 15%.

Three regime misses include **2026-08-28**: stored INFLATION / risk −1; C0 reconstructed REFLATION / risk +1. Inflation votes on that day still matched (core 0, sat +1). The miss is the **risk axis**, not C1’s inflation signs.

**Provider/vintage caveat:** C0 used Yahoo chart + CBOE VIX, not the exact historical Stooq / Alpha Vantage mix that produced persisted rows. Reconstruction is close on post-cutover regimes (97.7%) and is **not** identical to production compute.

**Conclusion:** C1 on the long window is a **current-code counterfactual study**. Historical production C1 claims are limited to **receipt-bearing persisted rows**.

---

## 4. Inflation Sign Forensics — C0 vs C1

C1 changes only TLT/UUP numeric sign semantics. No thresholds, satellites, VAMS, allocations, risk logic, or 60/30/10 changes.

### Signal level — RECONSTRUCTED CURRENT-CODE (2,280 days)

| Vote | TLT C0 | TLT C1 | UUP C0 | UUP C1 |
|------|-------:|-------:|-------:|-------:|
| +1 | 813 | 1,136 | 1,092 | 678 |
| 0 | 331 | 331 | 510 | 510 |
| −1 | 1,136 | 813 | 678 | 1,092 |

- TLT and UUP same C0 numeric direction: **626**
- They oppose: **884**

### Core and regime — RECONSTRUCTED CURRENT-CODE + COUNTERFACTUAL

```text
C0 replay days: 2,280
core-score changes: 1,325 / 2,280
final regime changes: 471 / 2,280 = 20.7%
episodes: 118
longest episode: 25 days
median episode: 2 days
```

Additional core detail: core sign changes **968**; core to/from zero **571**; deltas −4 (333), −2 (355), +2 (344), +4 (293).

Axis flips and full-regime flips are the same count because C1 does not change the risk axis:

- Inflation → Disinflation: **286**
- Disinflation → Inflation: **185**

```text
REFLATION → GOLDILOCKS: 159
GOLDILOCKS → REFLATION: 136
INFLATION → DEFLATION: 127
DEFLATION → INFLATION: 49
```

These 2017–2025 reconstructed counts are **not** historical production behavior.

### Persisted-receipt C1 — VERIFIED VOTES + COUNTERFACTUAL

Best production-adjacent evidence:

```text
9 / 125 receipt-bearing dates change regime
8 / 9 are target-equivalent GOLDILOCKS ↔ REFLATION
1 date changes target allocation
```

| Date | Stored | C1 | Target change |
|------|--------|----|---------------|
| 2026-01-05, 01-08, 01-09, 01-12, 01-13, 01-16 | GOLDILOCKS | REFLATION | none (still 60/30/10) |
| 2026-02-26 | GOLDILOCKS | REFLATION | none |
| 2026-02-27 | DEFLATION | INFLATION | gold 30% → 15% |
| 2026-06-12 | GOLDILOCKS | REFLATION | none |

Target-changing date:

```text
2026-02-27
Stored: DEFLATION
C1: INFLATION
Current policy consequence: Gold 30% → 15%
```

### Live 2026-08-28 — VERIFIED HISTORICAL votes + COUNTERFACTUAL

Stored and reconstructed inflation votes: PDBC +1, TIP/IEF −1, TLT −1 (Inflation), UUP +1 (Disinflation), sat +1.

The live inflation axis remains unchanged under the one-day C1 sign normalization:

```text
core 0
satellite +1
final +1
```

**The live regime would not change from this one-day sign correction.** That August 30 audit claim is confirmed.

---

## 5. Allocation Interpretation

**Do not call this a performance backtest.** No Sharpe, return series, or 60/30/10 alternatives were computed. 60/30/10 full-risk baseline was not varied.

This distinction is the main allocation finding:

```text
295 / 471 changed-regime days are GOLDILOCKS ↔ REFLATION
→ same 60/30/10 targets
176 / 471 are INFLATION ↔ DEFLATION
→ gold target 15% ↔ 30%
→ stocks/BTC targets unchanged
```

VAMS-adjusted actual allocations differ on:

```text
168 / 2,280 days
```

Maximum sleeve difference:

```text
Stocks: 0 pp
Gold: 15 pp
BTC: 0 pp
Cash: 15 pp
```

Those long-window allocation counts are **RECONSTRUCTED CURRENT-CODE + COUNTERFACTUAL**, not historical production impact.

### Persisted-receipt allocation — VERIFIED VOTES + COUNTERFACTUAL

- **8 / 9** dates: no target change
- **1** date (`2026-02-27`): gold target 30% → 15% under **current** allocation policy. Stored row was DEFLATION with gold 0.30, so the stored actuals already used 30% gold. A production C1 rewrite of that day would be the first persisted example of an INFLATION 15% gold outcome from sign normalization.

---

## 6. Satellite Forensics

S0 = current satellite behavior. S1 = satellite excluded for analysis only. **S1 was diagnostic only, not a proposal to remove satellites.**

### Current-code reconstruction — RECONSTRUCTED CURRENT-CODE

```text
core-zero days: 530
satellite non-zero: 1,529
satellite changes final inflation axis/regime: 166
PDBC TR63 + PDBC TR21 both active: 1,298
same direction: 1,040
core 0 + satellite non-zero deciding cases: 369
```

Additional C0 detail: core and satellite agree (both non-zero) **794**; they oppose **366**.

Commodity satellite influence is **material**. It decided the live inflation axis (`core 0 / sat +1 / final +1`). PDBC dual-horizon usage (core TR63 + satellite TR21) needs a later design judgment (**INFERENCE / NEEDS PRODUCT DECISION**, R5).

### Fallback semantics — RECONSTRUCTED from source

`resolveSatelliteData` can attach a fallback observation while keeping the **original series name**.

- Freight fallback can consume commodity TR21 while retaining Freight semantics. Freight Pulse fallback **does** match the commodity series name. C0 therefore ingested Freight rows whose **value is PDBC TR21**, scored against Freight’s ±10% thresholds. On 2026-08-28 TR21 ≈ 4.7% < 10%, so Freight vote stayed 0 and did not appear in live receipts.
- Truflation fallback name mismatch currently prevents its intended commodity fallback from resolving: fallback string is `'Commodity Nowcast Basket'` and does **not** match `'Commodity Nowcast Basket (Energy+Metals)'`.
- Live persisted receipts show only the commodity satellite, which matches a zero Freight vote.
- Historical fallback use is **not logged**. Do not invent past fallback events.

Do not decide R5 here.

---

## 7. Stress Override Forensics

Rule from source: `VIX > 30` AND `TR_63(HYG/IEF) ≤ −0.02` forces `risk_regime = RISK OFF` and, if the quadrant was GOLDILOCKS/REFLATION, reclassifies to DEFLATION/INFLATION. `riskAxis` is computed **before** override and not updated.

```text
78 reconstructed trigger days
0 reconstructed RiskOn-axis / RISK-OFF label clashes
0 persisted clashes found
6 stress dates change inflation quadrant under C1
```

Reconstructed trigger clusters: late Dec 2018; Feb–Apr 2020. Seed has **no `risk_axis` field** (2,066 missing).

**Conclusion:** The source path can theoretically create an axis/final-regime disagreement, but R0 found no stored or reconstructed historical example. Keep it as a characterization/test concern, not a production incident.

---

## 8. Flip Watch Forensics

### F0 — actual implementation — VERIFIED + RECONSTRUCTED

- `shouldApplyFlip()` exists but is unused by production regime application
- current regime and allocations apply before Flip Watch status
- persisted PENDING rows: **13**
- **12 / 13** already show the new regime/targets
- `daysSinceLastFlip` uses as-of date versus wall-clock `new Date()`
- historical replay produced values from **−3313** to **0**
- F1 confirmation replay was deliberately **not run**
- existing PLAN / VALIDATION / copy do not define a complete executable confirmation state machine

Production path:

1. Classify regime (plus optional stress override)
2. Compute allocations from that regime immediately
3. Set `flip_watch_status` via `detectFlipWatch`
4. **`shouldApplyFlip()` is never called**

Negative `daysSinceLastFlip` values are `<= 2`, so `detectFlipWatch` labels almost every non-strong regime change `PENDING_CONFIRMATION`. That is unrelated to durable flip history.

Persisted post-cutover detail:

- 22 regime changes vs prior unique date
- the PENDING exception is 2026-02-11 (`PENDING` but still REFLATION vs prior REFLATION)
- live 2026-08-28: INFLATION targets already active (`30 / 15 / 5`) while status is PENDING

Seed Flip Watch is uniformly NONE and cannot be used to reconstruct F0.

### F1 — documented-intent counterfactual: **not run**

PLAN/VALIDATION/copy suggest “2-day confirmation unless `abs(score) >= 2`,” but that is **not an executable specification**. Unresolved (**INFERENCE / NEEDS PRODUCT DECISION**):

1. Which score — risk, inflation total, or max of both?
2. Is day 0 the first changed day, or is confirmation the next session?
3. `shouldApplyFlip` uses `daysPending >= 2` while `detectFlipWatch` uses `daysSinceLastFlip <= 2` — they do not describe the same clock
4. What prior regime state is required, and does a one-day revert reset the clock?
5. Confirmation of risk axis, inflation axis, or final four-regime label?
6. Does delay apply to allocations, displayed regime, or both?

**Do not invent the missing rule.** Current Flip Watch is telemetry/status. Whether to keep it telemetry or implement real confirmation remains the explicit **R4** product gate.

---

## 9. High-Confidence Findings

1. **IMPROVE IN PLACE remains justified.** Core architecture still works; R0 did not find a rebuild case.
2. **TLT/UUP numeric signs are internally inconsistent.** Confirmed in source, tests, and live receipts.
3. **A one-day live correction would not change 2026-08-28.** Core stays 0; satellite still +1. VERIFIED.
4. **Seed is not current-code history.** 38.6% regime match. Do not treat seed as authoritative raw evidence or as a current-code replay.
5. **C1 is not a no-op in current-code reconstruction** (20.7% of days), but most of those days only swap GOLDILOCKS/REFLATION labels and **do not change 60/30/10 targets**.
6. **On persisted receipt history, C1 allocation impact is small:** 1 of 125 dates would change gold 30→15; 8 dates are label-only.
7. **Flip Watch is telemetry.** New regime/targets apply immediately. `shouldApplyFlip` is dead. `daysSinceLastFlip` is not flip history.
8. **The commodity satellite can decide the inflation axis.** It did so on the live day. In C0 it decides 166 days.
9. **PDBC is used twice on purpose or by accident:** core TR63 and satellite TR21. They are often both active and usually same-signed.
10. **Freight fallback can relabel commodity TR21 as Freight.** Not observed as a live non-zero vote on 2026-08-28.
11. **No stored stress-override axis clash** was found. The code still allows one.
12. **60/30/10 was not evaluated and should stay frozen.**

---

## 10. Limitations / Unresolved Questions

- No raw TRs in seed; C1 on 2017–2025 seed dates cannot be called historical production impact.
- C0 used Yahoo/CBOE, not the exact historical Stooq/AlphaVantage mix. Three recent regime misses, including the live risk-axis miss, show reconstruction is not identical to production compute.
- Persisted history only starts 2025-12-12 and has rewrite duplicates.
- Receipts lack TRs; receipt-C1 assumes stored votes are the C0 votes to negate.
- Satellite fallback history is not logged.
- VAMS 400-obs gate shortens the defensible window to 2017-08-03; vote-only history could start earlier but was not used for allocation claims.
- F1 was not simulated.
- R0 did not call `/today` or force-refresh (to avoid provider traffic). Public-read fetch behavior was not re-measured live.
- No portfolio performance, Sharpe, or 60/30/10 alternatives were computed.

---

## 11. Roadmap Implications

R0 supports keeping:

```text
R1 — canonical test foundation
R2 — operational containment
R3 — inflation semantics, gated
R4 — Flip Watch product decision
R5 — satellite cleanup
R6 — UI truth
R7 — allocation research later
R8 — redesign only if evidence justifies
```

- **R0 does not authorize R3.** The sign issue is real, but historical production allocation impact on persisted rows is small, and seed-era impact cannot be proven. R1 should lock characterization and stable invariants before any production sign change.
- **R0 does not choose Flip Watch A vs B.** F1 is still underspecified.
- **R0 does not remove satellites.** S1 only quantified influence.
- **R7/R8** allocation research remains later.
- **60/30/10** stays out of scope through R0–R6 unless Bobby explicitly reopens it.

A later `DECISIONS.md` entry belongs only when Bobby makes a real new choice, such as exact R3 sign treatment / model-version policy, Flip Watch telemetry vs real confirmation, satellite redesign, or allocation redesign.

---

## 12. R1 Handoff Note

R1 should build a **canonical complete GhostRegime test command** and characterization foundation (`npm run test:ghostregime`). That is the next work. This document does not begin R1.

R1 must **not** state or implement that future R2 desired behaviors already pass.

These are known **R2 targets**, not current passing invariants:

- normal public GET performs no provider fetch
- anonymous debug cannot reach paid fallback
- error path performs no duplicate provider fetch

R1 may create or strengthen the test seams needed to characterize those behaviors. It must not:

1. install knowingly failing tests, or
2. encode known undesirable behavior as a permanent product invariant.

R2 will change those behavioral expectations.

Likewise, UI/product-truth defects such as **neutral receipt labels** and **coverage semantics** should not be falsely declared current invariants merely to make R1 green.

R1 should distinguish three classes of tests:

| Class | Meaning | Examples |
|-------|---------|----------|
| **Stable invariants** | Should remain true after later phases | cash/scale/allocation sums; current-code INFLATION gold 15%; seed is output history only (no inferred TRs); C1 core delta `−2 × (tltVote + uupVote)` as a math fixture; live-like `core 0 + sat +1 ⇒ Inflation` and C1 still `0 + sat +1` |
| **Current-behavior characterization** | Documents what the code does today; expected to change in a named later phase | TLT/UUP inverted C0 signs (R3, gated); Flip Watch telemetry / unused `shouldApplyFlip` / wall-clock `daysSinceLastFlip` (R4); Freight/Truflation fallback name mismatch (R5); public-read fetch, unprotected `debug=1`, error-path double fetch (R2); neutral receipts stored/rendered as a side; coverage = non-neutral count (R6) |
| **Deferred desired-behavior tests** | Become authoritative when the corresponding fix is implemented | no public-read provider fetch (R2); anonymous debug cannot reach paid fallback (R2); no error-path duplicate fetch (R2); Neutral receipts render Neutral (R6); coverage = data availability (R6); consistent inflation sign semantics (R3, only after Bobby approval); real Flip Watch confirmation (R4, only if product choice B) |

Do not treat the August 30 audit’s “high-value future tests” list as a requirement that R1 make every desired behavior pass immediately.

---

## 13. Analysis-session provenance

R0 analysis was performed on branch `audit/ghostregime-r0-forensic` at SHA `019aa383d595c1f775885d1db270c985f8f993d5` with **no tracked modifications, no analysis commits, and no analysis PR**. Temporary scripts and JSON lived only under gitignored `tmp/ghostregime-r0/`.

This documentation checkpoint records those findings. It does not re-run the replay and does not commit the temporary analysis artifacts.
