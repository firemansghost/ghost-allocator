# Cap-Weight Premium Calibration Study (GhostFlow v1.9b.1a)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** Research / calibration results memo only — docs-only; real operator-run output; no score, artifact, UI, or runtime changes.  
**Run date:** 2026-06-15 (via `npm run ghostflow:cap-weight-premium-study`)  
**Related:** [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) · [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) · [`cap-weight-premium-study.ts`](../scripts/ghostflow/cap-weight-premium-study.ts) · [`capWeightPremiumHistory.ts`](../lib/ghostflow/research/capWeightPremiumHistory.ts)

GhostRegime, GhostYield, Models, and builder are out of scope. This study does **not** change the Research Composite.

---

## Status

| Item | v1.9b.1a posture |
|------|------------------|
| Document type | Calibration / results memo from real operator run |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Artifact JSON | **None** — no production or example artifacts |
| UI / components | **None** |
| Runtime / live fetching | **None** — Yahoo used for operator research input only |
| CSV / JSON committed | **None** — local temp files only (`tmp/ghostflow/cap-weight-premium/`) |
| `publicSignalCount` | **10** (equity) — unchanged |
| Treasury lane | **2** separate display-only cards — unchanged |
| **v1.9b.2** artifact design | **Done** — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md); display-only default; docs-only |
| **v1.9b.3** example JSON + validator | **Future** — separately approved |

---

## Source / run details

| Item | Value |
|------|--------|
| **Source** | Yahoo Finance v8 chart API (`query1.finance.yahoo.com/v8/finance/chart/`) — operator download only; **not** a production runtime feed |
| **Stooq note** | Direct Stooq CSV fetch failed (browser verification gate); Yahoo used for this run |
| **Local CSV paths** | `tmp/ghostflow/cap-weight-premium/SPY.yahoo.csv`, `RSP.yahoo.csv` — **not committed** |
| **Local JSON path** | `tmp/ghostflow/cap-weight-premium/capWeightPremiumStudy.local.json` — **not committed** |
| **Command** | See below |
| **Exit code** | **0** |
| **SPY price column** | **adjusted** (`Adj Close` from Yahoo `adjclose`) |
| **RSP price column** | **adjusted** |
| **SPY rows parsed** | 5,823 (2003-04-24 → 2026-06-15) |
| **RSP rows parsed** | 5,818 (2003-05-01 → 2026-06-15) |
| **Overlap** | 2003-05-01 → 2026-06-15 |
| **Aligned observations** | **5,818** (5 SPY-only days before RSP inception dropped) |
| **Latest date** | 2026-06-15 |
| **Script warnings** | **none** (`warnings: []`) |

```bash
npm run ghostflow:cap-weight-premium-study -- \
  --spy-csv tmp/ghostflow/cap-weight-premium/SPY.yahoo.csv \
  --rsp-csv tmp/ghostflow/cap-weight-premium/RSP.yahoo.csv \
  --since 2003-04-24 \
  --windows 21,63,126,252,756,1260 \
  --out tmp/ghostflow/cap-weight-premium/capWeightPremiumStudy.local.json
```

**Operator discipline:** CSVs and JSON were generated locally for research review only. Do not commit downloaded price files or study JSON unless separately product-approved.

---

## Key results

### Latest snapshot (2026-06-15)

| Metric | Value |
|--------|--------|
| Latest SPY (adj) | 754.83 |
| Latest RSP (adj) | 212.88 |
| **SPY/RSP ratio** | **3.5458** |
| **Ratio percentile vs history** | **98.8** |

### Rolling cap-weight premium (SPY total return − RSP)

| Window | Spread | Annualized spread | Spread percentile |
|--------|--------|-------------------|-------------------|
| 21d / 1M | **-3.64%** | n/a | 1.9 |
| 63d / 3M | **+3.47%** | n/a | 91.3 |
| 126d / 6M | **-0.08%** | n/a | 49.0 |
| 252d / 1Y | **+5.89%** | **+5.88%** | 86.4 |
| 756d / 3Y | **+28.86%** | **+6.81%** | 96.5 |
| 1260d / 5Y | **+39.51%** | **+5.15%** | 99.6 |

### Drawdown summary

| Series | Max drawdown | Current drawdown |
|--------|--------------|------------------|
| **SPY** | -55.19% | -0.62% |
| **RSP** | -59.92% | 0% |
| **Divergence** (SPY current DD − RSP current DD) | — | **-0.62%** |

---

## Interpretation

### Longer horizons — strong positive cap-weight premium

- **1Y:** +5.89% spread, **86.4th** percentile — cap-weighted S&P 500 proxy outperformed equal-weight over the past year.
- **3Y:** +28.86% cumulative spread (**+6.81%** annualized), **96.5th** percentile.
- **5Y:** +39.51% cumulative spread (**+5.15%** annualized), **99.6th** percentile.
- **Ratio percentile 98.8** — current SPY/RSP relationship is near the top of the ~23-year aligned history.

This is consistent with a **persistent size-weight tilt** in cap-weighted versus equal-weighted S&P 500 exposure over multi-year horizons — useful as **market-structure context**, not as proof of passive-flow causality.

### Short horizons — mixed / regime-dependent

- **1M:** -3.64% spread, **1.9th** percentile — equal-weight recently outperformed; cap-weight premium can **reverse** over short windows.
- **6M:** -0.08% spread, **49.0th** percentile — near neutral.

The lens is **regime-dependent**. It is not a one-way “cap-weight always wins” signal and must not be framed as a trading or allocation recommendation.

### What this is / is not

| Is | Is not |
|----|--------|
| Context for size-weighted market structure | Causal proof that passive flows caused outperformance |
| Companion to existing `concentration` card | Replacement for `concentration` or score merge |
| Candidate for future **display-only** context | AI-bubble or narrative-only score |
| Research input for v1.9b.2 planning | Investment advice or trading signal |

---

## Relationship to existing GhostFlow signals

| Signal | Role | Relationship to cap-weight premium |
|--------|------|-----------------------------------|
| **`concentration`** (score-fed) | Top-10 index weight **%** — “how concentrated?” | **Level** companion; different question than return spread |
| **`breadth`** (score-fed) | Participation / % above 50-day MA | May help contextualize short-horizon equal-weight leadership |
| **`passive-share`** (score-fed) | ICI index asset share | Different construct; avoid double-count **narrative** in copy only |

**Boundaries:**

- Do **not** reuse signal id `concentration`.
- Do **not** merge into `indexConcentration` or `buildSnapshot`.
- No score wiring approved.
- `publicSignalCount` **10** unchanged.

---

## Calibration / artifact-design implication

| Question | Answer |
|----------|--------|
| Is real output usable? | **Yes** — exit **0**, adjusted close, ~5,818 aligned days |
| Does SPY/RSP path remain viable? | **Yes** — with operator-CSV discipline and source caveats |
| Worth planning v1.9b.2? | **Done** — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) |
| Score mapper selected? | **No** — no 0–100 mapping approved |
| Display-only default? | **Yes** |

**Possible future display-only card fields** — specified in [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) (**Done, v1.9b.2**):

- Headline: 5Y spread percentile (**99.6**) — labeled **5Y premium percentile**, not a score
- SPY/RSP ratio (**3.5458**) and ratio percentile (**98.8**)
- 1M spread (**-3.64%**, 1.9th percentile) for short-horizon reversal context
- 1Y / 3Y / 5Y rolling spreads and percentiles
- Required copy: *Long-horizon cap-weight premium elevated; short horizons regime-dependent.*
- Caveat: *SPY/RSP proxy; measures weighting-rule return effect, not passive-flow causality; not a trading signal.*
- Badge: **DISPLAY ONLY**

**v1.9b.3+ remains separately approved.** No production artifact JSON, example JSON, UI card, or `publicSignalCount` change in v1.9b.2.

---

## Caveats

1. **SPY vs RSP does not isolate causality** — spread reflects sector tilts, earnings dominance, momentum, valuation, and ETF mechanics, not only passive indexing.
2. **ETF structure** — RSP quarterly equal-weight rebalance, expense ratio, tracking drift vs S&P 500 Equal Weight Index.
3. **Adjusted close** — better than raw close, but not identical to official index total-return series comparison.
4. **Yahoo operator data** — acceptable for this calibration run; **not** approved as dashboard runtime feed.
5. **Stooq** — direct automated CSV blocked by verification gate; manual Stooq download remains optional cross-check before v1.9b.4 production artifact.
6. **Not investment advice** — research and education only.

Script caveats echoed: proxy not causal proof; adj-close discipline matters; RSP rebalance/fees add noise; companion to `concentration`; display-only by default.

---

## Recommendation

1. **v1.9b.1a complete** — real operator run documented; path validated for research.
2. **v1.9b.2 complete** — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md); display-only artifact design memo; no JSON/UI/score.
3. **Do not score** this lens; do not wire into `buildSnapshot`; do not alter `publicSignalCount` without separate product approval.
4. **v1.9b.3** example JSON + validator — **future and separately approved**.
5. **Optional:** second-source cross-check (manually downloaded Stooq or fund-provider adjusted series) before v1.9b.4 production artifact.
6. **v1.9c** (passive supply / float absorption) remains on the roadmap in parallel if product prioritizes supply-side research.

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · equity `publicSignalCount` **10** · Treasury **2** display-only cards · MOCK **62 / 58 / 55**.
