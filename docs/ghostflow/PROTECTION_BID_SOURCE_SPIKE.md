# Protection Bid Source Spike — GhostFlow v1.9e.1

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md)

**Parent:** [PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md) · [Passive supply backlog](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md)

**Related:** [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (VIX manual extract) · [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) · [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)

Research/operator source spike for a possible future **display-only** Cboe SKEW artifact path. **No artifact, score, UI, runtime, or package changes** in this phase.

---

## Status

| Item | v1.9e.1 posture |
|------|------------------|
| Phase type | **Research / operator source spike** |
| Artifact JSON | **None** |
| UI | **None** |
| Score change | **None** |
| Runtime change | **None** |
| Package change | **None** |
| `publicPassiveInputKey` | **None** |
| **`publicSignalCount`** | **12** (equity) — **unchanged** |
| Research script | [`skew-source-spike.ts`](../../scripts/ghostflow/skew-source-spike.ts) — operator CSV only |

---

## Parent feasibility

[v1.9e feasibility memo](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md):

- Overall lane rating: **YELLOW**
- Primary viable public path: **Cboe SKEW** as a possible future **display-only** card (`Tail Skew Context` / `Cboe SKEW Proxy`)
- Correlation dispersion **deferred** pending source proof
- Score wiring **discouraged / not approved** (v1.9e.6)

---

## Objective

Lock a **repeatable, operator-grade, public Cboe SKEW history path** that could support a future manual artifact refresh workflow (same discipline as VIX in [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md)):

1. Confirm source URL or operator download path
2. Confirm file format (expected CSV)
3. Confirm stable **date** column
4. Confirm stable **SKEW close / index level** column
5. Confirm historical daily rows (≥252 for PASS)
6. Confirm manual refresh viability and attribution needs
7. **Optional:** lightweight implied-correlation source check if a clean public CSV exists

**Not in scope:** artifact design (v1.9e.2), validator, UI, score wiring.

---

## Source candidates

**Do not treat any row as locked until operator script output verifies headers and sample rows.**

| # | Source | Operator path (verify) | Format | Repeatable? | History | Likely columns | Cadence | Burden | License | Rating | Future artifact? |
|---|--------|------------------------|--------|-------------|---------|----------------|---------|--------|---------|--------|------------------|
| **A** | **Cboe CDN daily index history (primary)** | Expected mirror of VIX: `https://cdn.cboe.com/api/global/us_indices/daily_prices/SKEW_History.csv` | CSV | **Likely** (same CDN class as VIX) | Long daily | `Date`, `Open`, `High`, `Low`, `Close` | Daily | Low | Cboe index — manual extract + attribution; do not commit raw CSV | **GREEN–YELLOW** | **Yes** if verified |
| **B** | **Cboe index detail / historical download** | Cboe Global Indices → SKEW → historical data link | CSV or export | Maybe | Long | Same as A if CSV | Daily | Low–medium | Same as A | **YELLOW** | Yes if link stable |
| **C** | **Cboe chart-only / delayed quote UI** | Index quote pages | HTML/chart | No | Limited | N/A | Daily | High | Unclear | **RED** | No |
| **D** | **Third-party mirrors** (Yahoo, Stooq, etc.) | Various | CSV/API | Variable | Long | Ticker-dependent | Daily | Medium | Non-canonical | **RED** | No — out of scope |
| **E** | **Paid/vendor skew** (ORATS, SpotGamma, etc.) | Licensed | Proprietary | Yes (paid) | Long | Vendor | Intraday/daily | N/A public | Licensed | **RED** (public path) | Fallback only |

### Optional implied-correlation candidates (secondary)

| Source | Operator path (verify) | Rating | Notes |
|--------|------------------------|--------|-------|
| Cboe implied correlation indexes (COR1M, COR3M, COR9D) | Expected CDN class: `.../COR1M_History.csv` etc. | **YELLOW–RED** | Verify only if operator has CSV; defer by default |
| Cboe methodology / white papers | Documentation pages | **YELLOW** | Research citations only |
| Paid/vendor dispersion | Licensed APIs | **RED** | Not public path |

---

## Verification log

| Field | SKEW (primary) | Correlation (optional) |
|-------|----------------|------------------------|
| Source URL / description | Expected: Cboe CDN `SKEW_History.csv` (see [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) VIX analogue) | Not inspected |
| Local file path | **Not run** — no operator CSV in repo during v1.9e.1 implementation | N/A |
| Run command | `npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <local-path>` | — |
| Run date | **Pending** | **SKIPPED** |
| Row count | **Pending** | — |
| First date | **Pending** | — |
| Latest date | **Pending** | — |
| Latest value | **Pending** | — |
| Date column | **Pending** (expected `Date`) | — |
| Value column | **Pending** (expected `Close`) | — |
| Source lock result | **PENDING** | **SKIPPED** |
| Notes | Operator must download CSV locally, run script, update this table. **Do not commit CSV.** | Defer unless clean public COR CSV verified |

**Operator steps to complete verification:**

1. Download SKEW history CSV from Cboe (browser) → e.g. `tmp/skew-spike/SKEW_History.csv`
2. Run: `npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv tmp/skew-spike/SKEW_History.csv`
3. Record stdout fields in this log; set lock to PASS / PARTIAL / FAIL
4. Optional: `--corr-csv` if COR1M (or similar) CSV obtained

---

## Script summary

| Item | Detail |
|------|--------|
| Path | [`scripts/ghostflow/skew-source-spike.ts`](../../scripts/ghostflow/skew-source-spike.ts) |
| Invoke | `npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <local-path>` |
| Optional | `--corr-csv <local-path>` |
| Network fetch | **None** |
| File writes | **None** |
| Artifact creation | **None** |
| `ghostflow:check` | **Not included** |
| Runtime / dashboard | **Not included** |
| `package.json` | **Unchanged** |

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | SKEW lock **PASS** |
| `1` | Missing file, parse error, or SKEW lock **FAIL** |
| `2` | SKEW lock **PARTIAL** |

**Stdout fields:** file path, delimiter, headers, date/value column candidates, row count, first/latest date, latest value, first/last 3 parsed rows, `SKEW_SOURCE_LOCK`, `CORR_SOURCE_LOCK` (or SKIPPED).

---

## Lock outcome

| Series | Result | Rationale |
|--------|--------|-----------|
| **SKEW** | **PENDING** | Script shipped; no operator CSV run during v1.9e.1 implementation — **do not claim PASS** |
| **Correlation** | **SKIPPED** | No `--corr-csv` run; implied-correlation public path not verified in this phase |

**v1.9e.2 recommendation:** **Not yet** — complete operator verification first. Proceed to artifact design only on SKEW **PASS**, or clearly acceptable **PARTIAL** with documented operator workaround.

---

## Decision tree

| Condition | Next phase |
|-----------|------------|
| **SKEW PASS** | **v1.9e.2** — artifact design, SKEW-only, display-only default |
| **SKEW PARTIAL** | Operator source checklist / manual cleanup → then v1.9e.2 |
| **SKEW FAIL + correlation PASS** | Separate implied-correlation feasibility/design path — **not** SKEW card |
| **Both FAIL** | Stop lane; document research-only / paid-vendor status |

Score gate **v1.9e.6** remains **discouraged / not approved** regardless of spike outcome.

---

## Guardrails

- No score wiring; no `publicPassiveInputKey`
- No artifact creation (production or example)
- No UI changes
- VIX remains sole score-fed options/vol input — no VIX narrative duplication in score
- No OCC duplicate card under protection-bid label
- No 0DTE / Gamma / GEX / dealer claims without source proof
- `publicSignalCount` remains **12**
- Downloaded CSVs stay local — **never commit** to repo

---

## No-change confirmation

| Item | v1.9e.1 confirmation |
|------|---------------------|
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **Composite** | **62** — unchanged |
| **`publicSignalCount`** | **12** — unchanged |
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | **Unchanged** |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | **Unchanged** |
| Production artifact JSON | **Unchanged** |
| UI / tests / `package.json` | **Unchanged** |
| GhostRegime / Marketstack / GhostYield / Models / builder | **Untouched** |
