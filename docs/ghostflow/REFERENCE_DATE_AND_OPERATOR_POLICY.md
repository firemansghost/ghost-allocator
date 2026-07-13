# GhostFlow Reference-Date & Operator Policy — v1.14

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Readiness audit](./CURRENT_DATA_READINESS_AUDIT.md) · [Roadmap](./DATA_ROADMAP.md) · [Operator discipline](./OPERATOR_REFRESH_DISCIPLINE.md) · [Manual checklist](./MANUAL_REFRESH_CHECKLIST.md)

**Related:** [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) · [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) · [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) · [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [MARKET_BREADTH_SOURCE_FEASIBILITY.md](./MARKET_BREADTH_SOURCE_FEASIBILITY.md) · [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md)

This memo is the **canonical operator policy** for when and how GhostFlow may advance its equity dashboard reference date during future refresh execution. It does **not** perform refresh, change artifacts, scores, or runtime.

---

## Current-policy overlay (after PR #133 / 2026-07-13)

```text
Current execution status after PR #133:
- VIX source adapter implemented but unwired
- breadth production source not authorized
- Gate C execution blocked
- GHOSTFLOW_REFERENCE_AS_OF remains 2026-07-01
```

| Item | Current executable posture |
|------|----------------------------|
| Daily Gate C refresh | **Blocked** |
| Breadth StockCharts/Barchart production transcription | **Not approved** |
| Operator packet | Intake design only — [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) |
| Same-session VIX + breadth rule | **Preserved** (unchanged mathematics) |
| Additional Gate C prerequisite | Breadth **source authorization and approved-use evidence** required |

**Both daily observations being numerically available is insufficient.** The breadth observation must come from an authorized source before the Gate C package is eligible for production review or a reference bump.

Sections below retain the original v1.14 policy structure and historical baselines. Where they describe executing a daily breadth refresh, treat those steps as **non-executable under current policy** until authorization is approved and recorded.

---

## 1. Status

| Item | v1.14 posture |
|------|----------------|
| Phase | **v1.14** — reference-date & operator policy |
| Document type | **Docs-only** |
| Policy effective date | Date of v1.14 implementation (not a reference bump) |
| **Dashboard reference** | Remains **2026-05-22** until future **v1.15** execution |
| Refresh performed | **No** |
| Artifact values changed | **No** |
| Score change | **No** — Composite **62** / Passive **58** / Structural **66** |
| Runtime change | **No** |

---

## 2. Current baseline

| Item | Value |
|------|--------|
| **`GHOSTFLOW_REFERENCE_AS_OF`** | **2026-05-22** ([`reference.ts`](../../lib/ghostflow/reference.ts)) |
| **Composite / Passive / Structural** | **62 / 58 / 66** |
| **Band** | *Crowded / Reflexive* |
| **`publicSignalCount`** | **13** (equity) |
| **Score-fed public artifacts** | **6** |
| **Display-only public artifacts** | **7** |
| **Treasury lane** | **2** display-only cards — separate |
| **MOCK Passive inputs** | systematic **62**, retirement **58**, levered ETF **55** |
| **v1.13 audit date** | **2026-06-22** |
| **Active placeholders** | **0** |
| **Score gates** | **Closed** — v1.10e no-score-change policy active |

---

## 3. Reference-date definition

[`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) is the **equity Research Composite reference anchor**. It is:

- The date used for **daily score-fed market artifact alignment** (`vol-regime`, `breadth`)
- The **score snapshot narrative date** — the session through which the dashboard headline scores are framed for freshness evaluation
- The anchor for equity `publicSignals` freshness bands ([`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts)) and the dashboard freshness summary subset (daily vol/breadth, weekly ETF, monthly ICI/SSGA trio)

**What it is not:**

- **Not** a claim that every weekly, monthly, quarterly, display-only, or Treasury artifact is current to that date
- **Not** controlled by the Treasury lane — Treasury `asOf` may differ and does not set equity reference
- **Not** automatically set from Tail Skew `historySummary.latestSourceDate` — source metadata may extend beyond the card observation; card `asOf` follows reference policy
- **Not** a live “today” value — it advances only through explicit operator refresh with bump gates satisfied

---

## 4. Reference-date bump gates

### Target date selection

The operator chooses the **target reference date** as the **last completed US equity trading session** for which both daily score-fed official sources are available — not calendar “today” if markets are closed or sources are unpublished.

### Hard gate (both required)

| Requirement | Detail |
|-------------|--------|
| **`vol-regime`** | `asOf` must equal target date |
| **`breadth`** | `asOf` must equal target date |
| **Breadth source authorization** | Authorized production use + retained evidence required ([BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md)). Numerical availability alone is **not** enough. |
| **Either missing, invalid, misaligned, or unauthorized** | **Do not** bump `GHOSTFLOW_REFERENCE_AS_OF` |
| **All pass** | May edit `GHOSTFLOW_REFERENCE_AS_OF` in a future approved refresh to target date |

### What does not block the bump

| Item | Policy |
|------|--------|
| **Weekly score-fed** (`etf-flow`) | May lag official ICI cadence |
| **Monthly score-fed** (ICI/SSGA trio) | May lag months; own `asOf`, freshness, caveats, and score-impact explanation |
| **Display-only artifacts** | Do **not** block bump; **must** be disclosed if stale vs reference |
| **Treasury lane** | Separate; does **not** block equity reference bump |
| **MOCK inputs** | Unchanged by reference bump; always disclosed |

### Bump flow

```
Choose target (last completed US trading session)
  → Confirm breadth source authorization + approved-use evidence
  → If unauthorized: STOP — do NOT refresh Gate C / do NOT bump
  → Refresh vol-regime to target asOf (authorized path only)
  → Refresh breadth to target asOf (authorized path only)
  → If both asOf == target: bump GHOSTFLOW_REFERENCE_AS_OF
  → Else: do NOT bump; fix daily score-fed alignment first
  → Disclose stale display-only / lagging cadence artifacts
  → Run acceptance gates A–F
```

Under current policy (PR #133 overlay): stop at the authorization check — Gate C execution is blocked.
---

## 5. Artifact cadence classes

| Class | Examples | Refresh expectation | Blocks ref bump? | Validation | Disclosure |
|-------|----------|---------------------|------------------|------------|------------|
| **Daily score-fed** | `vol-regime`, `breadth` | Every US trading session after close | **Yes — both required** | `ghostflow:check` + unit tests | Score may change; include in score-impact report |
| **Weekly score-fed** | `etf-flow` | After ICI weekly ETF net issuance release | No | `ghostflow:check` | Note lag vs reference if >14 calendar days since `publishedAt` |
| **Monthly score-fed** | `passive-share`, `active-index-flow`, `concentration` | After ICI/SSGA monthly release | No | `ghostflow:check` | Caution 36–55d often normal; structural score may change |
| **Daily display-only** | `options-activity-proxy`, `tail-skew-context` | Daily when operator runs daily pass | No | `ghostflow:check` | Stale if >5 trading days vs ref; Tail Skew card `asOf` follows reference |
| **Weekly display-only** | `systematic-flow`, `cap-weight-premium` | Weekly CFTC / study cadence | No | `ghostflow:check` | Display-only; MOCK **62** unchanged |
| **Quarterly display-only** | `retirement-asset-growth` | After ICI Retirement Market release | No | `ghostflow:check` | Caution 46–90d often normal ICI cadence |
| **Event/manual display-only** | `levered-etf-rebalance`, `index-inclusion-events` | On event / operator intake | No | `ghostflow:check` | Event window; `manual_unverified` where applicable |
| **Treasury separate** | `treasury-futures-positioning-proxy`, `treasury-long-end-income-lens` | Weekly CFTC + daily FRED common date | No (equity ref) | `ghostflow:check` | Separate lane; not in composite or `publicSignalCount` |
| **Static MOCK** | systematic **62**, retirement **58**, levered **55** | **No routine refresh** | No | N/A | Permanent v1.10e disclosure — not replaced by display cards |
| **Derived** | `modelZoneProximity`, `distance-65` | Via `passive-share` refresh only | No | Follows passive-share | Do not edit separate JSON; refresh passive-share only |

---

## 6. Refresh acceptance gates (A–F)

| Gate | Requirement |
|------|-------------|
| **A — Source/operator evidence** | Source URL or local file identified; source dates recorded in artifact `source.note`; **source authorization and approved-use evidence** for Gate C daily package; **no** committed CSV/XLS/XLSX; spike outputs remain local/research |
| **B — Artifact validity** | Production JSON updated only through approved runbooks; `npm run ghostflow:check` passes |
| **C — Reference alignment** | Daily score-fed `vol-regime` and `breadth` both have `asOf` = target session **and** breadth source is authorized for GhostFlow production use; **`GHOSTFLOW_REFERENCE_AS_OF` changes only if Gate C passes** |
| **D — Score reproduction** | Recompute Passive, Structural, Composite; delta vs prior baseline; attribute movement to changed score-fed inputs; confirm MOCK **62 / 58 / 55** unchanged |
| **E — Disclosure** | Stale display-only, lagging monthly/quarterly, and MOCK caveats documented; no display-only card implies score contribution |
| **F — Validation suite** | `npm run lint` · `npm run test:ghostflow` · `npm run build` · `npm run ghostflow:check` |

**Gate C controls the reference bump.** Gates A, B, D, E, and F apply to every refresh commit; Gate C is the sole authority for editing [`reference.ts`](../../lib/ghostflow/reference.ts).

Under the PR #133 overlay: Gate C is **not executable** until breadth source authorization is approved — same-session VIX + breadth alone is insufficient.
Score reproduction methodology: [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md). Comparison anchor at v1.15: prior baseline **62 / 58 / 66** at reference **2026-05-22** unless a newer baseline is explicitly established.

---

## 7. Score-impact report format (v1.15 template)

Use this template after score-fed refresh in **v1.15**. **Default location:** PR description body. Persistent `docs/ghostflow/refresh-reports/` files are optional if the product owner requests them later.

```markdown
## GhostFlow Score-Impact Report — [refresh date]

| Item | Prior (ref YYYY-MM-DD) | New | Delta |
|------|------------------------|-----|-------|
| Composite | 62 | ? | ? |
| Passive | 58 | ? | ? |
| Structural | 66 | ? | ? |
| Band | Crowded / Reflexive | ? | ? |

### Score-fed input changes
| Input key | Card | Prior | New | Weight (Passive/Structural) |
| (only rows that changed) |

### Unchanged MOCK inputs
- systematicStrategyPressure: 62
- retirementFlowPressureProxy: 58
- leveredEtfRebalancePressure: 55

### Display-only refreshed (not scored)
- (list card ids refreshed in this pass)

### Reference alignment
- GHOSTFLOW_REFERENCE_AS_OF: prior → new
- vol-regime asOf: ...
- breadth asOf: ...

### Stale / caution artifacts
- (list artifacts lagging reference or in caution band)

### Policy confirmations
- Score gates: remain closed (v1.10e)
- publicSignalCount: 13 (unchanged unless separate product gate changes card set)
```

---

## 8. Stale / caution / fresh policy

Thresholds are defined in [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) and implemented in [`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts). v1.14 does **not** change code or artifact values.

| Cadence class | Fresh | Caution | Stale (investigate) |
|---------------|-------|---------|---------------------|
| **Daily score-fed** (VIX, breadth) | ≤2 trading days | 3–5 trading | >5 trading |
| **Daily display-only** (options, SKEW) | ≤2 trading days | 3–5 trading | >5 trading |
| **Weekly ETF** (score-fed) | ≤7 calendar days | 8–14 | >14 |
| **Monthly ICI/SSGA** | ≤35 calendar | 36–55 | >55 |
| **CFTC systematic / levered** | ≤10 calendar | 11–17 | >17 |
| **Retirement quarterly** | ≤45 calendar | 46–90 (often normal) | >90 |
| **Event/manual** | Per event window | Per policy | Validator fail |
| **Treasury** | No equity freshness band | Separate lane | Validator fail |
| **Static MOCK** | Always disclosed as static score limitation | — | — |

### Tail Skew special case

| Item | Policy |
|------|--------|
| Card observation `asOf` | Follows **reference policy** — align to `GHOSTFLOW_REFERENCE_AS_OF` when bumping reference |
| `historySummary.latestSourceDate` | **Source metadata only** — does not move GhostFlow reference date |
| Score input | **None** — display-only; v1.9e.6 gate closed |
| Stale evaluation | Use card `asOf` / `publishedAt`, not source-tail date alone |

---

## 9. Official v1.15 refresh order

Execution is **v1.15** — not v1.14. Order:

1. Confirm v1.14 policy read ([this memo](./REFERENCE_DATE_AND_OPERATOR_POLICY.md)) **and** the PR #133 current-policy overlay.
2. Choose **target reference date** (last completed US equity trading session).
3. Confirm **breadth source authorization**. If not approved: **stop Gate C / do not bump reference** — operator-packet research may continue separately ([BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md)).
4. Refresh daily score-fed: `vol-regime`, `breadth` (authorized paths only).
5. If both `asOf` align to target **and** breadth is authorized: bump `GHOSTFLOW_REFERENCE_AS_OF` in [`reference.ts`](../../lib/ghostflow/reference.ts).
6. Refresh daily display-only: `options-activity-proxy`, `tail-skew-context` (card `asOf` per reference policy).
7. Refresh weekly score-fed: `etf-flow`.
8. Refresh weekly display-only: `systematic-flow`; Treasury CFTC if part of same operating pass.
9. Refresh monthly score-fed: `passive-share`, `active-index-flow`, `concentration` (+ derived `modelZoneProximity`).
10. Refresh quarterly / event / manual as sources permit: retirement, cap-weight, index inclusion, levered ETF.
11. Refresh Treasury daily lane separately: `treasury-long-end-income-lens`.
12. Run acceptance gates **A–F**.
13. Publish score-impact report (PR body default).

**Commit discipline:** one artifact family per commit when possible; never mix score wiring with refresh; never mix GhostFlow refresh with GhostRegime work.

**Current overlay:** Steps 4–5 for Gate C are **non-executable** until breadth source authorization is approved. Display-only and non–Gate-C cadences may still proceed under their own authorized runbooks.
---

## 10. Non-goals (v1.14)

v1.14 does **not**:

- Refresh artifacts
- Bump `GHOSTFLOW_REFERENCE_AS_OF` (stays **2026-05-22**)
- Change scores (Composite **62** / Passive **58** / Structural **66**)
- Replace or neutralize MOCK inputs
- Add automation, live fetch, cron, or API routes
- Open score gates or add `publicPassiveInputKey` or score mappers
- Modify `scoring.ts`, `buildSnapshot.ts`, `reference.ts`, production artifact JSON, validators, UI, tests, or `package.json`

---

## 11. No-change confirmation

| Area | v1.14 status |
|------|--------------|
| Production artifact JSON | Unchanged |
| [`reference.ts`](../../lib/ghostflow/reference.ts) | Unchanged — **2026-05-22** |
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| Validators / UI / tests / `package.json` | Unchanged |
| `publicPassiveInputKey` | Not added |
| Headline scores | Composite **62** · Passive **58** · Structural **66** |
| `publicSignalCount` | **13** |
| GhostRegime / Marketstack / GhostYield / Models / builder | Untouched |
