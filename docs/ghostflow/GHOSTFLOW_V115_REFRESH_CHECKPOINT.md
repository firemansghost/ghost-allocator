# GhostFlow v1.15 Refresh Checkpoint & Source Blocker Register

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Reference date policy](./REFERENCE_DATE_AND_OPERATOR_POLICY.md) · [Manual refresh checklist](./MANUAL_REFRESH_CHECKLIST.md) · [Operator refresh discipline](./OPERATOR_REFRESH_DISCIPLINE.md)

**Checkpoint date:** 2026-07-02  
**Status:** v1.15 operator refresh cycle **complete** except **four source blockers** (see register below).  
**Document type:** Refresh checkpoint / blocker register — **docs only**; no artifact, score, runtime, or code changes in this memo.

---

## Executive summary

GhostFlow **v1.15a.2 through v1.15g** executed the approved operator refresh sequence after [REFERENCE_DATE_AND_OPERATOR_POLICY.md](./REFERENCE_DATE_AND_OPERATOR_POLICY.md). The dashboard reference was bumped to **`2026-07-01`**. Score-fed daily, weekly, and partial monthly refreshes moved the Research Composite from **62 → 55 → 56** (Passive **58 → 45**; Structural **65 → 67**). Display-only and Treasury-lane artifacts were refreshed where verified sources were available.

**Four artifacts remain blocked** by source availability (FRED timeout, manual operator extracts, SSGA PDF lag). Score gates remain **closed**; v1.10e no-score-change policy remains **active**. Equity `publicSignalCount` remains **13**; Treasury lane remains **2** separate display-only cards.

---

## Current score state

| Item | Value |
|------|--------|
| **`GHOSTFLOW_REFERENCE_AS_OF`** | **`2026-07-01`** |
| **Composite** | **56** |
| **Passive Pressure** | **45** |
| **Structural Fragility** | **67** |
| **Band** | *Elevated Flow Pressure* |
| **`publicSignalCount`** | **13** (equity only) |
| **Score-fed public artifacts** | **6** |
| **Display-only public artifacts** | **7** |
| **Treasury lane** | **2** display-only cards (not in `publicSignalCount`) |
| **Score gates** | **Closed** |
| **v1.10e no-score-change policy** | **Active** |

### MOCK score inputs (unchanged)

| Input | Mock value | Scored slot |
|-------|------------|-------------|
| `systematicStrategyPressure` | **62** | Passive 20% |
| `retirementFlowPressureProxy` | **58** | Passive 20% |
| `leveredEtfRebalancePressure` | **55** | Passive 15% |

Display-only artifact refreshes do **not** replace these MOCK values. No `publicPassiveInputKey` was added.

---

## Phase-by-phase summary (v1.15a.2 → v1.15g)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **v1.15a.2** | Gate C source preflight for 2026-07-01 | **Passed** — approved to proceed with score-fed daily refresh |
| **v1.15b** | Daily score-fed refresh | `volatilityRegime` → 2026-07-01 (VIX **16.59**); `marketBreadth` → 2026-07-01 ($SPXA50R **64.0**); reference bumped to **2026-07-01** |
| **v1.15c** | Daily display-only context | `optionsActivityProxy` → 2026-07-01; `tailSkewContext` → 2026-06-18 card / CSV lag noted |
| **v1.15d** | Weekly ETF score-fed | `etfNetIssuance` → week ended **2026-06-24** (domestic equity **−$4.807B**); Composite **62 → 55**; Passive **58 → 45**; Structural **65** unchanged |
| **v1.15e** | Partial monthly score-fed | `passiveShareProxy` → May 2026 ICI (index share **63.9%**); `activeIndexFlow` → May 2026 ICI; `indexConcentration` **blocked**; Composite **55 → 56**; Structural **65 → 67**; Passive **45** unchanged |
| **v1.15f** | Weekly display + Treasury separate | `systematicFlowProxy`, `treasuryFuturesPositioningProxy`, `retirementFlowPressureProxy` (Q1 2026), `indexInclusionEventProxy` (June rebalance) refreshed; scores unchanged |
| **v1.15g** | Blocker cleanup / source watch | **No blockers resolved**; no files changed; `npm run ghostflow:check` passed |

---

## Refreshed artifact inventory (production JSON)

### Score-fed (6) — merge into Research Composite

| Signal id | File | asOf | publishedAt | Key value | Refreshed in |
|-----------|------|------|-------------|-----------|--------------|
| `vol-regime` | `volatilityRegime.v1.json` | 2026-07-01 | 2026-07-01 | VIX **16.59** | v1.15b |
| `breadth` | `marketBreadth.v1.json` | 2026-07-01 | 2026-07-01 | $SPXA50R **64.0%** | v1.15b |
| `etf-flow` | `etfNetIssuance.v1.json` | 2026-06-24 | 2026-06-30 | Domestic equity **−$4,807M** | v1.15d |
| `passive-share` | `passiveShareProxy.v1.json` | 2026-05-31 | 2026-06-30 | Index asset share **63.9%** | v1.15e |
| `active-index-flow` | `activeIndexFlow.v1.json` | 2026-05-31 | 2026-06-30 | Active **−$27,032M** / Index **+$33,209M** | v1.15e |
| `concentration` | `indexConcentration.v1.json` | 2026-03-31 | 2026-04-09 | Top-10 **36.5%** | **Blocked** — not refreshed |

### Display-only equity/public (7)

| Signal id | File | asOf | publishedAt | Key value / note | Refreshed in |
|-----------|------|------|-------------|------------------|--------------|
| `systematic-flow` | `systematicFlowProxy.v1.json` | 2026-06-23 | 2026-06-27 | Basket net short **18.3% OI** · pressure **92** | v1.15f |
| `levered-etf-rebalance` | `leveredEtfRebalancePressure.v1.json` | 2026-05-22 | 2026-05-28 | Session **2026-05-22** | **Blocked** |
| `retirement-asset-growth` | `retirementFlowPressureProxy.v1.json` | 2026-03-31 | 2026-06-18 | **$47.6T** · QoQ **−2.5%** · YoY **+10.4%** (Q1 2026) | v1.15f |
| `options-activity-proxy` | `optionsActivityProxy.v1.json` | 2026-07-01 | 2026-07-01 | Index **5.5M** contracts | v1.15c |
| `index-inclusion-events` | `indexInclusionEventProxy.v1.json` | 2026-06-11 | 2026-07-02 | **14** events · window through **2026-06-22** | v1.15f |
| `cap-weight-premium` | `capWeightPremiumProxy.v1.json` | 2026-05-22 | 2026-06-17 | Study asOf **2026-05-22** | **Blocked** |
| `tail-skew-context` | `tailSkewContext.v1.json` | 2026-06-18 | 2026-07-02 | SKEW **146.72** | v1.15c |

### Treasury separate lane (2) — not in `publicSignalCount`

| Signal id | File | asOf | publishedAt | Key value / note | Refreshed in |
|-----------|------|------|-------------|------------------|--------------|
| `treasury-futures-positioning-proxy` | `treasuryFuturesPositioningProxy.v1.json` | 2026-06-23 | 2026-07-02 | Lev net **−34.7% OI** · net short | v1.15f |
| `treasury-long-end-income-lens` | `treasuryLongEndIncomeLens.v1.json` | 2026-06-02 | 2026-06-04 | 30Y nom **4.97%** · real **2.69%** | **Blocked** |

---

## Score-impact timeline

Baseline before v1.15 (reference **2026-05-22**): Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive*.

| After phase | Composite | Passive | Structural | Band | Score-fed driver |
|-------------|-----------|---------|------------|------|------------------|
| Start (pre-v1.15) | 62 | 58 | 66 | Crowded / Reflexive | — |
| **v1.15b** (daily) | 62 | 58 | 66 | Crowded / Reflexive | VIX + breadth refresh; reference bump only |
| **v1.15d** (weekly ETF) | **55** | **45** | 65 | Elevated Flow Pressure | ETF outflow **−$4.807B** |
| **v1.15e** (monthly partial) | **56** | 45 | **67** | Elevated Flow Pressure | ICI passive share + active/index flows; concentration blocked |
| **v1.15f / v1.15g** | 56 | 45 | 67 | Elevated Flow Pressure | Display/Treasury only — **no score change** |

Display-only and Treasury-lane refreshes (v1.15c, v1.15f) did **not** change Composite / Passive / Structural.

---

## Source blocker register

| # | Artifact | Lane | Current asOf | Blocker | Score impact if resolved |
|---|----------|------|--------------|---------|--------------------------|
| 1 | `treasuryLongEndIncomeLens.v1.json` | Treasury display | 2026-06-02 | FRED live CSV timeout; `FRED_API_KEY` not set; no local CSVs in `tmp/fred/` | **None** — separate lane |
| 2 | `leveredEtfRebalancePressure.v1.json` | Display-only | 2026-05-22 | Full six-row ProShares/Direxion AUM + QQQ/SPY/IWM return operator extract not verified through session ≤ 2026-07-01 | **None** — MOCK **55** unchanged |
| 3 | `capWeightPremiumProxy.v1.json` | Display-only | 2026-05-22 | Fresh SPY/RSP adjusted-close CSVs through 2026-07-01 not available | **None** — display-only |
| 4 | `indexConcentration.v1.json` | **Score-fed** | 2026-03-31 | Canonical US SSGA SPY fact sheet PDF still shows **2026-03-31** holdings | **Yes** — Structural + Composite via existing scoring |

---

## Exact operator actions (per blocker)

### 1. Treasury long-end income lens (FRED)

**Artifact:** `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`  
**Runbook:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · `npm run ghostflow:fred-treasury-yields-spike`

1. Set **`FRED_API_KEY`** in environment and run `npm run ghostflow:fred-treasury-yields-spike`, **or**
2. Download FRED graph CSVs for **DGS30, DFII30, DGS2, DGS5, DGS10, T10YIE** into `tmp/fred/`, then run:
   ```bash
   npm run ghostflow:fred-treasury-yields-spike -- --local-dir tmp/fred
   ```
3. Update artifact only when all six series share a verified common `asOf` (no forward-fill).
4. Run `npm run ghostflow:check`. Treasury lane only — does not affect `publicSignalCount` or Composite.

### 2. Levered ETF rebalance pressure

**Artifact:** `data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`  
**Runbook:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) §3b · [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md)

1. Capture issuer AUM for all six tickers (**TQQQ, SQQQ, UPRO, SPXU, TNA, TZA**) from ProShares/Direxion fund pages.
2. Capture single-session underlying returns for **QQQ, SPY, IWM** for target session ≤ **2026-07-01** (StockAnalysis or approved source).
3. Recompute row-level rebalance estimates and aggregate observations per validator.
4. Set `dataQuality: verified_manual` only after full six-row review.
5. Do **not** wire into scoring; MOCK **55** remains.

### 3. Cap-weight premium proxy

**Artifact:** `data/ghostflow/artifacts/capWeightPremiumProxy.v1.json`  
**Runbook:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · `npm run ghostflow:cap-weight-premium-study`

1. Obtain operator SPY and RSP **adjusted-close** daily CSVs through **2026-07-01**.
2. Run:
   ```bash
   npm run ghostflow:cap-weight-premium-study -- --spy-csv path/to/spy.csv --rsp-csv path/to/rsp.csv
   ```
3. Transcribe verified study output into production JSON (filter `Date <= GHOSTFLOW_REFERENCE_AS_OF`).
4. Display-only — no score wiring.

### 4. Index concentration (score-fed)

**Artifact:** `data/ghostflow/artifacts/indexConcentration.v1.json`  
**Runbook:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · canonical [US SSGA SPY fact sheet PDF](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf)

1. Re-check canonical US PDF for holdings date **newer than 2026-03-31**.
2. If newer month-end holdings are published: extract sum of **Top 10 index weights** (not fund weights if both shown).
3. Set `asOf` = holdings month-end; `publishedAt` = PDF control/footer date.
4. Run `npm run ghostflow:check` and **score-impact report** (Structural + Composite delta required).
5. Do **not** use UCITS fact sheet or live product page as primary production source.

**Watch status (v1.15g):** US PDF still **As of 03/31/2026** — blocker unchanged.

---

## Guardrails preserved (v1.15 cycle)

| Area | Status |
|------|--------|
| GhostRegime / Marketstack product surfaces | Untouched by GhostFlow refresh phases |
| `lib/ghostflow/scoring.ts` | Unchanged in display/Treasury phases |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged in display/Treasury phases |
| `lib/ghostflow/reference.ts` | Bumped **once** in v1.15b to **2026-07-01** per approved policy |
| `mockGhostflowSnapshot.ts` | Unchanged — MOCK **62 / 58 / 55** |
| Score gates | **Closed** — no `publicPassiveInputKey` added |
| v1.10e no-score-change policy | **Active** |
| Validators / UI / package.json | Unchanged except narrow test expectations for refreshed display values (v1.15f) |

---

## Next recommended actions

### GhostFlow

1. **Resolve blockers** in priority order when sources become available:
   - **Score-fed:** `indexConcentration` when SSGA US PDF updates (requires score-impact report).
   - **Treasury:** `treasuryLongEndIncomeLens` when FRED API or local CSVs succeed.
   - **Display-only:** `leveredEtfRebalancePressure`, `capWeightPremiumProxy` on operator manual extract.
2. **Routine cadence** per [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md): daily (vol, breadth, options, tail-skew, Treasury FRED when unblocked); weekly (ETF flow, CFTC systematic, Treasury futures, levered ETF when unblocked); monthly (ICI structural, SSGA concentration); quarterly (retirement).
3. **Do not** open score gates or change MOCK inputs without explicit product approval.

### Cross-product note (GhostRegime — separate lane)

GhostRegime Yahoo ETF fallback investigation confirmed all eight core ETFs on **Yahoo** with **Marketstack not used** on the persisted snapshot. Operator removed **`ALLOW_MARKETSTACK_FALLBACK`** from Vercel Production; manual workflow passed. **Pending:** next **scheduled** GhostRegime Daily Refresh to fully close verification.

### Possible next work (product backlog — not GhostFlow)

- Learn / Education hub
- 457(b) page
- Masterclass index

---

## Validation

At checkpoint authoring: `npm run ghostflow:check` **passed** (all 15 production artifacts validate; equity `publicSignalCount` **13**).

---

## Related docs (may lag v1.15 scores)

These memos may still show pre-v1.15 headline scores (**62 / 58 / 66**) or reference **2026-05-22**. This checkpoint is the **authoritative v1.15 refresh record** for score state and blocker status until those docs are updated in a future docs pass:

- [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md)
- [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md)
- [CURRENT_DATA_READINESS_AUDIT.md](./CURRENT_DATA_READINESS_AUDIT.md)
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)
