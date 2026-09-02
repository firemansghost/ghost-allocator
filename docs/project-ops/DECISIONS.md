# DECISIONS

## 2026-09-02 — GhostRegime R7 allocation study preregistered before outcomes
Choice:
- The R7 allocation-research sequence through **R7B1** is complete and preregistered **before any real candidate outcomes have been viewed**.
- Frozen private snapshot: **`r7b0-20260902-210842Z`**. Manifest SHA-256: `bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00`. Research window `2016-01-01` → `2026-09-01`. Snapshot remains gitignored / uncommitted.
- Two-panel design is frozen: **SIGNAL** = production-compatible raw closes / VIX index; **RETURN** = adjusted / total-return ETF series plus session-aligned BTC. Return data never feeds GhostRegime signals. Raw signal data is never the primary ETF performance series.
- Execution is the one-session lag: after close T compute `A_T`; T → T+1 previously executed holdings earn the return; execute pending `A_T` at close T+1 if required; `A_T` first earns T+1 → T+2. No same-close executable result.
- Portfolio is self-financing. Dynamic strategies rebalance only when the published target changes beyond `ALLOCATION_TOLERANCE`. Drift alone does not trigger a rebalance. Inception is initial establishment, not a rebalance: turnover 0, cost 0, `rebalanced = false`.
- Every economically held asset requires an explicit finite interval return `>= -100%`. Missing held-asset returns are errors, not zero fills.
- Primary cash / risk-free is **BIL adjusted return**. Raw BIL is prohibited as the primary cash-return series. Required later sensitivity: `ZERO_CASH_ZERO_RF`.
- Performance metrics for a selected cost scenario use **after-cost `netPortfolioReturn`**, not pre-cost `marketReturn`. Primary cost is **0 bps**. Frozen future sensitivities: **5 bps** and **10 bps**. No extra cash transaction leg.
- Primary static benchmarks: `STATIC_601030` (SPY 60 / GLD 30 / BTC 10), `STATIC_6040` (SPY 60 / IEF 40), `SPY_100`. Primary static rebalance is the first eligible XNYS session of each calendar year. Monthly first-session rebalance is a frozen sensitivity. `SPY_100` has no scheduled rebalance.
- Primary candidate family is frozen as **P0–P6** only: `P0_CURRENT` (RO 60/30/10, Infl 30/15/5, Defl 30/30/5), `P1_LESS_BTC` (60/35/5, 30/20/5, 30/35/5), `P2_MORE_EQUITY` (70/25/5, 30/15/5, 30/30/5), `P3_MORE_GOLD_RO` (55/35/10, 30/15/5, 30/30/5), `P4_INFL_GOLD_30` (60/30/10, 30/30/5, 30/30/5), `P5_DEEPER_OFF` (60/30/10, 20/15/5, 20/30/5), `P6_HOUSE_601525` (60/25/15, 30/15/5, 30/30/5). No additional primary candidates may be added after results are viewed. **No-BTC remains a required sensitivity / attribution analysis, not an eighth primary candidate.**
- Frozen ablations: `STATIC_601030`, `REGIME_ONLY`, `VAMS_ONLY`, `COMBINED`, `SPY_100`.
- Calendar holdout is frozen: **`2024-09-01` → `2026-09-01`**. First eligible XNYS performance session: **`2024-09-03`**. Do not move this boundary after seeing outcomes. Walk-forward / endpoint checks are robustness tests, not candidate-selection tools.
- Production **60/30/10 remains live policy**. This preregistration does **not** change allocations, `MODEL_VERSION`, or GhostRegime runtime.

Why:
- Candidate evaluation must be genuinely prospective relative to a frozen study contract. Viewing real-panel CAGR / drawdown / Sharpe / rankings before locking the contract would invite hindsight-tuning.
- Signal semantics (votes, VAMS, published targets) are not the same as investable performance returns. Mixing raw closes into performance, or adjusted closes into votes, would leak or misstate both.
- Fail-closed missing-return handling and after-cost net returns prevent silent zero-fills and cost-blind rankings.
- The one-session lag and event-driven rebalance prevent lookahead and daily implicit rebalancing that the model does not actually do.

Consequences:
- **R7C is the first authorized real frozen-panel outcome run.** As of PR **#185** merge, no real candidate CAGR, drawdown, Sharpe, Sortino, ranking, or winner has been viewed.
- **R7C does not authorize a production allocation change.**
- **R7D remains the product/model decision gate.**
- Production **60/30/10** remains unchanged until an explicit later decision.
- No `MODEL_VERSION` change. Repository default remains `ghostregime-v1.0.4`.
- No GhostRegime refresh, no Blob write, no provider fetch, and no GhostFlow change are authorized by this checkpoint.

---

## 2026-09-02 — GhostRegime R6 product gate: GO WITH CHANGES — Option B
Choice:
- Bobby approved the R6 UI-truth audit recommendation: **GO WITH CHANGES — Option B (Evidence / Resolution Separation)**.
- Approved sequence: **R6A** factual display correctness → **R6B** evidence / resolution separation → **R6C** educational copy / posture.
- This decision authorizes R6A implementation. R6B and R6C product direction is approved, but their implementation remains separately gated and is not yet authorized.

Locked product decisions:
- Procedural `risk_tiebreak` and `infl_tiebreak` remain the final axis-resolution mechanisms. In R6B they will not be treated as independent evidence in Agreement / Participation / Confidence / Conviction / Crowded / Primary Driver / Top Drivers / Compare. R6A does not change those formulas.
- The existing Coverage formula (non-neutral / receipt count) will be treated as **Participation** in R6B. Do not invent an Availability denominator from the satellite catalog or tie-breaks.
- Allocation card **Exposure** is the primary default. The global 60/30/10 comparison is a secondary research toggle only (label: Vs 60/30/10), not VAMS brake utilization.
- Displayed allocation mixes use one-decimal-only-when-needed formatting. Underlying model values are not altered and mass is not shifted across sleeves.
- Preferred future R6C vocabulary is **Model mix / Model read / How to use this**. R6A does not change Hold now / Actionable read / What to do now copy except where a tooltip was factually false (half labeled as off).
- R6 does **not** authorize model-math, `MODEL_VERSION`, Blob namespace, persisted-row rewrite, force refresh, provider, workflow, VAMS, allocation-formula, 60/30/10, or GhostFlow changes. Expected model remains `ghostregime-v1.0.4`.

Why:
- Live v1.0.4 display contradicted stored scales (BTC half shown as off), independent `toFixed(0)` could read 101%, primary-driver thresholds used 0–1 units against 0–100 agreement, and `% of Max` as the default conflated a regime starting-point cut with a full brake.
- Option B is the approved destination because, after R5B, ordinary tie-break receipts make Inflation look like a fifth evidence vote. That semantics change is R6B, not R6A.

Consequences:
- R6A is display-only. Persisted `receipt.direction` on vote=0 may still store a side; user display must show Neutral.
- STATUS.md and HANDOFF.md wait for merged / live R6A verification. They are not updated by the R6A PR.

---

## 2026-08-31 — GhostRegime R5B removes duplicate PDBC TR21 satellite role
Choice:
- Bobby explicitly authorized **R5B**.
- **P1 retained**: PDBC TR63 remains the core inflation vote at ±2%.
- **P2 removed**: PDBC TR21 Commodity Nowcast is no longer an active score-fed satellite in production v1.0.4. The satellite catalog and R5A Commodity diagnostic adapter remain for characterization / provenance; they are not production-scored.
- **P3 retained**: PDBC TR21 remains the zero-score inflation tie-break (`TIEBREAK_RULE = GTE_ZERO`). Horizon, sign rule, proxy behavior, and stale/fail-closed handling are unchanged.
- Ordinary persisted receipts must include truthful `infl_tiebreak` provenance whenever P3 actually runs. Receipt generation must not depend on debug mode. Authorized DBC proxy must be identified as DBC.
- Repository default `MODEL_VERSION` becomes `ghostregime-v1.0.4`. Persistence already prefixes Blob keys with `MODEL_VERSION`, so v1.0.4 is a new namespace. The old `ghostregime-v1.0.3` namespace is left untouched. Do not copy historical latest across versions.
- R4 Flip Watch logic is unchanged. R6 UI formulas are unchanged. VAMS is unchanged. Allocation formulas are unchanged. 60/30/10 is unchanged. Provider routing is unchanged. GhostFlow is unchanged.
- Remaining satellite sources (Cleveland, Truflation, ISM, NFIB, real Freight) remain stubs. Do not fake a P2 replacement.

Why:
- PDBC TR21 was used twice: as the only live satellite vote (P2) and as the inflation tie-break (P3). The unique P2 effect was self-tie reinforcement — P2 created a core+sat zero that P3 then resolved with the same TR21 sign.
- PDBC is a broad commodity-futures ETF, not an inflation nowcast and not Energy+Metals-only. The duplicate role was not independently informative.

Evidence (reconstructed current-code window 2017-08-03 through 2026-08-28, n = 2,280; not a performance claim):
- P2 unique inflation-axis / regime effect = **113** dates.
- **71** GOLDILOCKS ↔ REFLATION label-only differences; **42** allocation-changing INFLATION ↔ DEFLATION differences.
- Maximum gold-target effect **15** percentage points; stocks/BTC target effect **0**.
- Unique effect was self-tie reinforcement (113 / 223 M0 P3 uses).
- P2 removal recommendation survived external-reference, time-stability, threshold, Flip Watch, and UI-collateral review.

Consequences:
- Production `infl_sat_score = 0` under the current default provider until a separately authorized real satellite exists.
- P3 becomes the resolver for core-zero dates; ordinary `infl_tiebreak` receipts close the previously debug-gated provenance gap.
- Future production deploy of v1.0.4 starts from an empty Blob namespace and may report `NOT_READY` until an authorized first refresh. That rollout is a separate operator event.
- R6 displayed values may move because **input receipts** changed. R6 formulas were not changed.

---

## 2026-08-31 — GhostRegime R5A satellite correctness/provenance containment authorized
Choice:
- Bobby explicitly authorized **R5A only** — behavior-neutral satellite correctness / provenance containment.
- False source aliasing is correctness debt, not a model feature. A fallback observation may not masquerade as a semantically different lane.
- R5A must be score / regime / allocation neutral on the defensible reconstructed comparison window.
- PDBC TR21 as the live Commodity satellite remains unchanged pending **R5B**. R5A does not decide whether that proxy belongs in the model.
- No `MODEL_VERSION` bump. Repository default remains `ghostregime-v1.0.3`. No new Blob namespace. No forced refresh. Historical Blob rows are not rewritten.
- No new real satellite sources, credentials, or provider routing. Cleveland / Truflation / ISM / NFIB / real Freight remain stubs.
- R6 remains separate and is **not** authorized by this decision.

Why:
- Production is not a true seven-satellite system. The only live derived source is Commodity, which is PDBC TR21.
- Freight could consume that same PDBC TR21 observation while keeping Freight identity and Freight thresholds. Persisted history contains false Freight receipts from that alias.
- Repairing Truflation’s fallback string would be semantically unsafe (PDBC TR21 scored as Truflation δ7d YoY pp).
- Reconstructed S1 (genuine Commodity only, no Freight alias) produced zero score / axis / regime / allocation differences vs S0 on 2,280 dates. Receipt/provenance impact is real; the `[-1,+1]` cap hid duplicate Freight score impact.

Consequences:
- Fallback resolution is one-hop and requires semantic compatibility. Invalid aliases are rejected.
- New compute receipts disclose actual source (Commodity proxy (PDBC TR21)). Historical rows stay as written.
- PDBC-derived Commodity calculation is as-of safe.
- R5B — Commodity/PDBC model decision — remains separately gated and is **not** authorized.

---

## 2026-08-31 — GhostRegime Flip Watch remains telemetry (R4 Option A)
Choice:
- Bobby explicitly authorized **R4 Option A — KEEP TELEMETRY, FIX TRUTH/LOGIC**.
- Flip Watch remains transition telemetry. It does not confirm, delay, suppress, or approve regime changes.
- The classified regime and allocations apply immediately. There is no confirmation gate.
- New compute emits only `NONE` / `REGIME_CHANGE` / `STRONG_FLIP`.
- Comparison is against the prior unique persisted trading snapshot (`row.date < current as-of`), not blindly `latest.regime` and not wall-clock `new Date()`.
- `STRONG_FLIP_SCORE_THRESHOLD = 2` remains intensity telemetry only, not an approval bypass.
- Legacy persisted `BREWING` / `PENDING_CONFIRMATION` remain readable. New compute does not emit them. Historical rows and seed CSV are not rewritten.
- No model-version bump. Repository default remains `ghostregime-v1.0.3`. `row_build_commit` provides rollout provenance.
- 60/30/10, VAMS, satellites, R5, and R6 are unchanged.

Why:
- Production already applied the new regime and allocations immediately. `shouldApplyFlip()` was unused.
- Old user-facing waiting / confirmation / whipsaw-prevention claims were false.
- R4 audit reconstructed current-code F1A (2,280 dates): one-extra-close gating would have delayed more durable flips than head fakes prevented. That evidence supports telemetry, not a new hard state machine. Those figures are not a performance claim.

Evidence (from R4 audit; reconstructed vs persisted distinguished):
- Reconstructed current-code F1A: head fakes prevented 30 vs durable flips delayed 49; allocation fakes prevented 19 vs allocation flips delayed 26.
- Production-adjacent persisted evidence: 133 unique dates, 22 regime changes, 13 PENDING rows; 12 / 13 PENDING rows already used the new regime / targets.

Consequences:
- Public copy, methodology, PLAN, VALIDATION, types, and UI now describe Flip Watch as telemetry.
- Ordinary public `GET /api/ghostregime/today` remains persisted-only (R2). Flip Watch history lookup is compute-path only.
- R5 satellite cleanup remains separately gated and is **not** authorized by this decision.

---

## 2026-08-30 — GhostRegime inflation vote sign convention (R3 C1)
Choice:
- Inflation core uses one scalar convention: **+1 = inflationary**, **−1 = disinflationary**.
- PDBC and TIP/IEF numeric signs, thresholds, and economic labels are unchanged.
- TLT and UUP economic interpretation and thresholds are unchanged (rising strongly → Disinflation; falling strongly → Inflation).
- TLT/UUP numeric votes are normalized to the common convention: rising TLT/UUP → **−1**; falling TLT/UUP → **+1**.
- Prospective only. Historical rows, seed, and persisted receipts are not rewritten. They remain evidence of the model version that created them.
- Repository default `MODEL_VERSION` becomes `ghostregime-v1.0.3`. `NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION` may still override that default at deploy time; live effective version must be verified after rollout.

Why:
- C0 mixed two opposite semantic conventions into one scalar: PDBC/TIP treated +1 as Inflation, while TLT/UUP treated +1 as Disinflation and still added that +1 to the same score.
- R0 measured the impact before this authorization. The long-window counts are **reconstructed current-code**, not historical production behavior.

Evidence (from R0; reconstructed vs persisted distinguished):
- Reconstructed current-code: **471 / 2,280** regime labels changed; **168 / 2,280** VAMS-adjusted allocations differed.
- Production-adjacent persisted receipts: **9 / 125** regime labels changed; **8** target-equivalent; **1** target-changing date (`2026-02-27`).
- Live-like 2026-08-28 remained inflationary under C1 (`core 0 / sat +1 / final +1`).

Consequences:
- Prospective model correction only; no history rewrite or seed regeneration.
- Model-version boundary required. Because R2 public reads are persisted-only, rollout needs one authenticated force refresh after the new deployment is live.
- Thresholds, risk votes, inflation/risk tie-breaks, satellites, Flip Watch, VAMS, allocations, and 60/30/10 are unchanged.
- R4 Flip Watch, R5 satellites, and R6 UI truth remain separately gated.

---

## 2026-08-30 — GhostRegime read/compute separation (R2)
Choice:
- Ordinary public `GET /api/ghostregime/today` is a persisted-state reader. It does not call market providers, does not persist, and fail-closes with `GHOSTREGIME_NOT_READY` when no persisted latest exists.
- `force=1`, `refresh=scheduled`, and `debug=1` remain compute-capable privileged modes.
- Debug uses the existing GhostRegime cron-secret authorization boundary (`GHOSTREGIME_CRON_SECRET` via `x-ghostregime-cron` or `cron_secret`). Anonymous debug is 401 before the engine/provider path.
- Error carry-forward uses first-attempt diagnostics only. The engine does not perform a second orchestration-level `getHistoricalPrices()` call to rebuild error messages.
- Provider routing and the Marketstack ALLOW guard are unchanged. This decision does not alter regime math, VAMS, allocations, Flip Watch, or satellites.

Why:
- Public reads were entering the Stooq → Yahoo → Marketstack chain even when only persisted state was needed.
- Unauthenticated `debug=1` could reach the same compute path, including paid fallback when the existing guard allowed it.
- The outer compute catch re-fetched markets after a failure, duplicating traffic and describing a second attempt.

Consequences:
- Refreshing belongs to authenticated scheduled/force/debug paths.
- Ordinary public GET cannot spend provider quota or paid fallback.
- R3 inflation semantics, R4 Flip Watch, R5 satellites, and R6 UI truth remain separately gated.
- 60/30/10 remains frozen.

---

## 2026-08-30 — GhostRegime remediation sequencing
Choice:
- GhostRegime will be **improved in place**, not rebuilt. The four-regime concept, fail-closed posture, persisted-state architecture, provider fallback strategy, and VAMS concept remain unless later forensic evidence supports a targeted change.
- Correctness, semantics, operational containment, tests, and UI truthfulness come **before** investment-universe or allocation redesign.
- Full-risk baseline **60/30/10** remains unchanged during remediation. INFLATION gold 15% is existing policy and is not reopened by this decision. Independent allocation research is deferred to R7; any production redesign is R8 and requires a separate Bobby product decision.
- First substantive phase is **R0** — read-only forensic characterization / historical replay. No production model changes in R0.
- Methodology changes remain separately gated: no inflation-sign production change before R0 review; no real Flip Watch confirmation implementation without a separate decision; no satellite score expansion; no VAMS formula/threshold change; no regime threshold change; no new sleeve; no GhostFlow / Builder / Model Portfolio work mixed into GhostRegime remediation.
- Canonical record: [AUDIT_2026-08-30.md](../ghostregime/AUDIT_2026-08-30.md). Roadmap R0→R8 in that document is the approved sequence, not blanket authorization to implement every item immediately.

Why:
- Operational architecture has valuable working safeguards (persist gate, last-known-good, scheduled freshness preflight, Yahoo ETF fallback, Marketstack ALLOW fail-closed).
- The August 30 audit found important correctness, product-truth, operations, and test-coverage issues, but no evidence requiring wholesale replacement.
- Changing portfolio policy while model semantics are unresolved would contaminate comparison and replay work.
- Durable sequencing prevents unrelated changes (signs, Flip Watch, satellites, providers, UI, allocations) from being mixed together.

Consequences:
- The audit document is the roadmap and reference for future GhostRegime threads.
- No inflation-sign correction yet.
- No Flip Watch methodology change yet (telemetry vs real confirmation remains an open product gate).
- No VAMS change.
- No allocation change.
- No satellite score expansion.
- R0 comes next.
- Allocation research is deferred to R7.
- This decision does **not** create additional DECISIONS entries for unresolved questions (Flip Watch Option A vs B, satellite complete-vs-remove, exact sign-correction treatment). Those wait for R0 evidence and later explicit choices.

---

## 2026-08-27 — GhostFlow Phase 1 promotion receipt policy
Choice:
- **Selected next architecture milestone:** Phase 1 **verified promotion receipt** (Git-tracked sidecar). Policy and design are authorized now; **implementation is not included** in this decision-record PR and requires later coding PR(s).
- **Terminology:** Call the artifact a **promotion receipt** or **verified promotion receipt**. Do **not** call the local receipt “accepted provenance,” “accepted history,” or a “human approval record.” The receipt proves that a reviewed candidate is consistent with the **verified current production state** after a successful local `--apply`. It does **not** prove organizational acceptance. **Human-reviewed Git merge** of the production JSON + receipt remains the acceptance boundary.
- **`--apply` remains single-write:** `ghostflow:promote-candidate -- --apply` continues to replace exactly **one** registry-owned production artifact and must **not** also write a receipt. Rationale: if production rename succeeds and a subsequent receipt write fails, `--apply` would enter a partial-success state; the old envelope then correctly becomes stale against newly promoted production, so re-running `--apply` is **not** a valid receipt-recovery path.
- **Separate post-apply receipt command:** Future CLI (proposed: `npm run ghostflow:record-promotion-receipt -- --envelope <exact path>` with optional `--write`; dry-run/validation default unless write is explicit) records the receipt. Requirements: explicit envelope path only; no latest/scan/artifact-only selectors; no network; no production write; no Git operations; deterministic/non-interactive; independently retryable after receipt-write failure.
- **Post-apply reconciliation (not newer-date gate):** Receipt command must integrity-validate the envelope (`ready_for_review`), replay the **current** mapper, require mapped hash = envelope `promotionPayloadSha256`, require **current** production hash and `observationAsOf` exactly equal the candidate promotion hash/`asOf`, reconcile `sourcePublishedAt` when present, and record `envelope.currentProduction` as prior fingerprint. It must **not** require `candidateAsOf > currentAsOf` (expected equality after successful apply).
- **Deterministic receipt bytes:** Phase 1 receipts must be deterministically derived from reviewed envelope + prior fingerprint + verified promoted production. **No** wall-clock `appliedAt` / `recordedAt` fields in receipt bytes. Git commit/PR/merge history supplies temporal context.
- **Path / idempotency:** Contained under `data/ghostflow/promotion-receipts/<artifactId>/<observationAsOf>.<identityPrefix>.receipt.json`. Missing → write; identical exists → idempotent success; different exists → **fail closed** (no overwrite, no auto-rename).
- **Prospective only:** No automatic historical backfill of the three already-merged promotions. Do not fabricate missing `contentSha256` / adapter / parser from production JSON alone. Future backfill requires a separate decision with independently sufficient evidence (e.g. original envelopes).
- **Unchanged gates:** Same-date / `revision_review_required` promotion remains blocked; normal promotion still requires newer `asOf`; no automatic promotion, candidate PRs, workflow automation, Systematic v1.0c, breadth/Gate C, or VIX score wiring.
- **No production schema change** to carry receipt provenance inside artifact JSON.

Why:
- After three successful human promotion cycles, the largest reversible audit gap is loss of reviewed envelope provenance (especially source `contentSha256`) once `tmp/` envelopes are discarded and production JSON is overwritten.
- Separating receipt write from `--apply` preserves the proven single-write promotion semantics and gives an independently retryable recovery path.
- Deterministic, Git-tracked sidecars keep human approval external while creating durable transition evidence for future same-date policy design (still blocked until receipts exist prospectively).

Consequences:
- Design memo: [PROMOTION_RECEIPT_PHASE1_DESIGN.md](../ghostflow/PROMOTION_RECEIPT_PHASE1_DESIGN.md).
- Next coding work: implement receipt types/builder/path safety (R1) then explicit receipt CLI/writer (R2) per that memo — **not** in this PR.
- This decision **supersedes** the 2026-08-26 promotion-policy line that deferred all “history / accepted provenance / promotion receipt” writes only insofar as it now **authorizes future Phase 1 promotion-receipt implementation**. It does **not** authorize full accepted-normalized observation history stores, backfill, same-date promotion, or automation.
- Until an artifact has a durable Phase 1 receipt establishing accepted source provenance for a promote cycle, future same-date revision policy cannot rely on receipt history for that artifact.

---

## 2026-08-26 — GhostFlow candidate promotion policy
Choice:
- **Eligible candidate status:** Initial promotion supports **only** `ready_for_review`. Do **not** promote `revision_review_required`. Same-date mapped-payload revisions remain blocked pending a later explicit policy decision. Do not reinterpret `revision_review_required` as `ready_for_review`.
- **Explicit envelope selection:** Promotion requires an explicit candidate-envelope path (`--envelope <path>`). No latest-candidate lookup, artifact-only selection, automatic directory scanning, or auto-selection by date/hash prefix. The human-reviewed envelope path is the selected promotion unit.
- **Dry-run default:** Promotion is dry-run by default. Writes require explicit `--apply`. Without `--apply`, the command performs all validation and reconciliation but writes nothing. No interactive confirmation prompt. CLI remains deterministic/non-interactive.
- **Envelope revalidation:** Before promotion, independently verify the selected envelope (parse; supported `candidateVersion` / `artifactSchemaVersion` / `generationMode`; `humanReviewRequired === true`; `status === ready_for_review`; candidate-enabled artifact ID; internal identity/provenance reconciliation; identity hash and prefix; proposedArtifact hash). Reuse PR **#148** integrity helpers where appropriate. Do not trust TypeScript typing alone.
- **Remap under current code:** Promotion must re-run the **current** PR A candidate mapper using `envelope.normalizedObservation` + the current `GHOSTFLOW_REFRESH_REGISTRY` entry. The newly mapped production artifact must pass current mapper provenance gates, pass the current production validator, and canonical-hash exactly to the envelope `proposedArtifact` promotion hash. If current code/registry/mapping semantics no longer produce the reviewed payload: **fail closed**; regenerate a new candidate. No silent promotion of envelopes generated under stale mapping semantics. No compatibility migrations inside promotion.
- **No network during promotion:** Promotion must not fetch CFTC, fetch Board H.15, run adapters against live sources, or update normalized observations. Promotion operates only on the explicitly reviewed envelope. Fresh data requires regenerating the candidate first.
- **Current-production optimistic lock:** Before any production write, resolve the production artifact path from `GHOSTFLOW_REFRESH_REGISTRY`, load and production-validate current production, canonically fingerprint it, and require reconciliation with `envelope.currentProduction` (`artifactId`, `artifactPath`, `observationAsOf`, `promotionPayloadSha256` at minimum). If current production changed after candidate generation: fail closed as stale. Do not overwrite newer production with an older reviewed candidate. Do not trust the envelope to choose its production destination — the registry owns the destination path.
- **Newer-date required:** Initial promotion requires candidate `observationAsOf` **>** current production `observationAsOf`. Equal and older dates are blocked. No same-date promotion in initial PR C. Status is evidence, not authority — enforce the date gate independently.
- **Exact production payload:** Promotion writes only the exact current-mapper / current-validator-approved proposed production artifact whose canonical hash matches the reviewed envelope. No field edits, publication-date regeneration, observation derivation, score changes, provenance additions, or history fields during promotion.
- **Production write scope:** Promotion may write exactly **one** registry-owned production artifact (`data/ghostflow/artifacts/<approved artifact>.v1.json`) for the selected candidate-enabled artifact. No `GHOSTFLOW_REFERENCE_AS_OF`, score, MOCK, `publicSignalCount`, or other-artifact changes. One candidate promotion is one artifact write.
- **Fail-closed atomic write:** Use a fail-closed replacement strategy (validated candidate bytes → temporary sibling → validate/read/hash temp → fail-safe replace of registry target → read-back + production validator + canonical hash equality). No partial production file. No persistent backup clutter. No silent overwrite on validation failure.
- **No history / accepted provenance yet:** Initial PR C writes **no** accepted normalized history, promotion receipt, source-content hash history, provenance database, or audit artifact outside the production JSON. Byte-only same-date revision detection therefore remains unavailable — intentional.
- **No Git automation:** Promotion command performs no git checkout/branch/add/commit/push, no PR creation, no GitHub API mutation, no workflow dispatch. Human workflow remains: generate → inspect → dry-run → `--apply` → validate → inspect git diff → human-reviewed production-artifact PR.
- **PR C implements mechanism only:** PR C must **not** promote currently generated local candidate envelopes. After PR C merges, actual production refreshes occur in separate human-reviewed data PRs (prefer one coherent artifact refresh per PR).
- **Still blocked:** `revision_review_required` promotion; same-date production replacement policy; accepted-history / provenance receipts; automatic promotion; automatic candidate PR creation; workflow promotion; VIX; `marketBreadth` / Gate C; any scoring / reference / MOCK / `publicSignalCount` changes.

Why:
- PR **#148** delivered local candidate generation; production promotion requires an explicit, fail-closed human gate before any registry-owned artifact write.
- Remap + optimistic lock + newer-date gate prevent promoting stale mapping semantics or overwriting production that moved after review.
- Dry-run default and explicit `--apply` keep the first production-writer capability inspectable without interactive prompts.
- Deferring history/provenance and same-date revision keeps PR C narrowly scoped to one artifact write.

Consequences:
- Impact inventory: [PROMOTION_POLICY_IMPACT.md](../ghostflow/PROMOTION_POLICY_IMPACT.md).
- Next coding work: implement promotion mechanism per that memo (**C1 dry-run/validation**, then **C2 `--apply` writer** recommended).
- This decision authorizes **future** promotion-mechanism implementation only. It does **not** authorize promoting current local candidates, changing production JSON in the mechanism PR, history writes, Git automation, workflows, scores, MOCK values, `publicSignalCount`, reference-date changes, VIX, breadth, or Gate C.
- Older design-memo language that treated `revision_review_required` as promotable or used `--dry-run` as the write flag is superseded by this decision for initial PR C.
- **Update (2026-08-27):** Phase 1 **promotion receipt** sidecars are separately authorized for **future** implementation by the decision *2026-08-27 — GhostFlow Phase 1 promotion receipt policy*. That later decision does **not** reopen same-date promotion, automation, or full observation-history stores.

---

## 2026-08-26 — GhostFlow candidate production-mapping policy
Choice:
- **Long-End `seriesDefinition`:** New Board H.15 candidates for `treasuryLongEndIncomeLens` use `frb_h15_treasury_long_end_income_lens_v1`. Do not retain `fred_treasury_long_end_income_lens_v1` merely for validator continuity. The semantic series definition describes the Board H.15 **product contract**, not its transport encoding. Do not put `sdmx` into the semantic identifier.
- **Long-End Board H.15 production source contract (new candidates):**
  - Required primary: `RIFLGFCY30_N.B`, `RIFLGFCY30_XII_N.B`
  - Optional context: `RIFLGFCY02_N.B`, `RIFLGFCY05_N.B`, `RIFLGFCY10_N.B`
  - Forbidden in new Board-native candidates: `T10YIE`, `tenYearBreakevenInflationPct`, derived breakeven
  - Canonical release source URL: `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
  - The existing committed FRED production artifact remains valid during the transition until a future human-approved candidate is promoted.
  - Production validation may temporarily support **both** (1) legacy FRED production shape and (2) new Board-native production shape, but must enforce internal consistency per branch. No FRED/Board hybrid artifacts. A Board-native artifact must not contain FRED-only series metadata, `T10YIE`, or breakeven observation fields. A legacy artifact must continue validating until actually replaced through the future promotion workflow.
- **`dataQuality`:** Introduce `verified_automated` for deterministic source-adapter-produced candidates that pass the applicable production validator. Do not label automated candidates `verified_manual`. Existing values (`verified_manual`, `manual_unverified`) remain valid for existing/manual artifacts. Prefer the narrowest type/validator changes for the three candidate-enabled artifacts: `systematicFlowProxy`, `treasuryFuturesPositioningProxy`, `treasuryLongEndIncomeLens`.
- **`publishedAt`:** For those three artifacts, `publishedAt` is **optional** for automated candidate production shapes. Mapper rule: if normalized durable provenance contains a defensible `sourcePublishedAt`, map it to production `publishedAt`; if absent, omit `publishedAt`. Do **not** substitute `retrievedAt`, generation time, report date + N days, generic Friday-after-Tuesday logic, inferred holiday calendars, or guessed release dates. No mapper may fabricate `publishedAt`. Freshness behavior must fall back to artifact `asOf` or another already-defined deterministic anchor when `publishedAt` is omitted (no freshness semantic change in the decision-record PR).
- **Authorization boundary:** This decision authorizes **future** type changes, validator changes, source-contract truth changes, display-copy truth changes where required, and pure candidate mapper implementation. It does **not** authorize candidate generator implementation, filesystem candidate writer, production artifact writes, production artifact promotion, history writes, automatic PR creation, workflows, scores, MOCK values, `publicSignalCount`, reference-date changes, VIX / breadth / Gate C changes. Promotion remains separately blocked.
- **No production JSON changes** are authorized by this decision-record PR.

Why:
- [CANDIDATE_GENERATION_DESIGN.md](../ghostflow/CANDIDATE_GENERATION_DESIGN.md) blocked PR A on mapping-policy decisions (Long-End `seriesDefinition` / Board source block, `dataQuality`, `publishedAt`).
- Board H.15 transport and product contract are already decided (PR **#143–#144**); candidate mappers must emit Board-native **production semantics**, not FRED legacy identifiers, while preserving fail-closed validation of the committed FRED production artifact until promotion.
- CFTC and H.15 adapters do not currently emit defensible `sourcePublishedAt`; omitting `publishedAt` is honest and freshness can anchor on `asOf`.
- `verified_automated` distinguishes adapter-validated candidates from manual curation without mislabeling automation as `verified_manual`.

Consequences:
- Impact inventory: [CANDIDATE_MAPPING_POLICY_IMPACT.md](../ghostflow/CANDIDATE_MAPPING_POLICY_IMPACT.md).
- Next coding PR (**PR A**): narrow type/validator updates + pure mappers + tests — **ONE PR** recommended (no separate schema PR required).
- Display copy for Board-native Long-End may branch on `seriesDefinition` in PR A; legacy FRED production display remains until promotion replaces the artifact.
- Generator (PR B) and promotion (PR C) remain blocked pending separate work and DECISIONS entries.

---

## 2026-08-26 — Treasury Long-End H.15 transport → Board release-level SDMX/XML
Choice:
- Migrate `treasuryLongEndIncomeLens` **transport** from the current dual Board H.15 DDP CSV packages (preformatted Treasury Constant Maturities + custom single-series TIPS-30 package) to the Federal Reserve Board **release-level H.15 SDMX/XML ZIP**:
  - `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- Preserve the existing Treasury Long-End **product contract**:
  - Required: 30Y nominal (`RIFLGFCY30_N.B`) and 30Y inflation-indexed real (`RIFLGFCY30_XII_N.B`)
  - Optional context: 2Y / 5Y / 10Y nominal when present on the required common date
  - **No `T10YIE`**
  - **No derived breakeven**
  - Display-only, unscored, `human_required`
  - No production artifact writer and no workflow automation in the transport migration itself
- Source family remains Board H.15 (`frb_h15_treasury_yields`); this decision changes **transport / adapter / sourceFormat / sourceLocator**, not the underlying Board observation series or Long-End methodology.
- Implementation must use a new SDMX/XML adapter identity and parser version (do not silently reinterpret the CSV adapter as XML).
- Dual-DDP CSV remains interim until the SDMX/XML adapter is implemented, fixture-tested, registry-cut over, and human-reviewed live smoke is healthy.
- This decision does **not** authorize candidate generation, production artifact refresh, score/MOCK/`GHOSTFLOW_REFERENCE_AS_OF` changes, VIX, breadth, or Gate C work.

Why:
- [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md) verified all five GhostFlow series in the release ZIP and classified release-level SDMX/XML as the durable Path D transport.
- Board announcement (2026-07-16): Build Your Package (BYP) removal during the week of **2026-11-09**; the custom TIPS-30 DDP leg is BYP-exposed and post-removal arbitrary-package URL support is not guaranteed.
- Board directs BYP users toward FRED or release-level XML; GhostFlow stays on direct Board H.15 (not FRED) while exiting BYP dependence.
- Preformatted TCM post-November lifetime remains **NOT SPECIFIED**; a single release ZIP avoids dual-package reconciliation and BYP exposure.

Consequences:
- Next implementation PR may add the SDMX/XML adapter, update registry `adapterId` / `sourceFormat` / `sourceLocator`, and retire the dual-CSV path after cutover validation.
- Product semantics (required/optional series, no T10YIE, no breakeven, display-only / unscored / human-reviewed / unwired) stay locked unless a later DECISIONS entry changes them.
- Provenance should hash the exact downloaded ZIP bytes as the durable content digest (per investigation recommendation).
- Production artifacts, scores, MOCK inputs, `publicSignalCount`, and `GHOSTFLOW_REFERENCE_AS_OF` remain unchanged until a separate human-approved refresh path exists.

---

## 2026-08-25 — GhostFlow implemented display/Treasury adapters become operator-reportable
Choice:
- Permit a manual report-only operator runner for the explicitly approved implemented non-score-fed adapters:
  - systematicFlowProxy
  - treasuryFuturesPositioningProxy
  - treasuryLongEndIncomeLens
- The runner may fetch, parse, normalize, compare observation dates, and produce review reports.
- The runner may not write production artifacts, generate durable candidates, update history, change scores, change GHOSTFLOW_REFERENCE_AS_OF, open PRs, or run from a workflow.
- VIX remains excluded because Gate C remains atomic with marketBreadth.
- Adding another artifact to the operator allowlist requires an explicit code change and review; registry status alone must not silently widen runner scope.

Why:
- The source adapters are now fixture-tested and implemented.
- Operators need a controlled way to see whether official sources contain newer valid observations before candidate-generation automation exists.
- Keeping reporting separate from writing preserves the human approval boundary and fail-closed behavior.

Consequences:
- Source observations can be inspected through one manual command.
- Production remains unchanged until a separate candidate-generation and approval path is explicitly implemented.
- Gate C and breadth remain blocked and untouched.

---

## 2026-07-13 — Treasury Long-End Income Lens canonical source → Board H.15
Choice:
- Migrate `treasuryLongEndIncomeLens` canonical production source from FRED to the **Board of Governors H.15 Data Download Program**.
- Use direct H.15 observations for **30-year nominal** (`RIFLGFCY30_N.B`) and **30-year inflation-indexed real** (`RIFLGFCY30_XII_N.B`) yields.
- Include **2-year / 5-year / 10-year nominal** yields as optional context when present on the required common date.
- **Omit `T10YIE`** for now. Do **not** derive or substitute a breakeven-inflation value without a separate product and methodology decision.
- Adapter posture: fixture-driven, display-only, unscored, `human_required`, **unwired** from production workflows, and **incapable** of writing production artifacts.
- Do **not** promote `fredgraph.csv` or the authenticated FRED API as the production transport for this artifact.
- Research spike `scripts/ghostflow/fred-treasury-yields-spike.ts` remains research-only quarantine.

Why:
- [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md) found FRED graph CSV unauthorized for production automation and FRED API store/cache/archive terms in conflict with committed normalized artifacts and retained history without written clarification.
- Underlying constant-maturity yields originate on Board H.15; Board website disclaimer treats Board-published information as public domain with citation.

Consequences:
- Registry source family / adapter ID move to `frb_h15_treasury_yields` / `frb-h15-treasury-yields-csv`.
- Existing production artifact JSON may still record historical FRED provenance until a separate human-approved refresh; this decision does not refresh values, scores, MOCK inputs, or `GHOSTFLOW_REFERENCE_AS_OF`.
- Breakeven context requires a later DECISIONS entry before Path A (FRED T10YIE) or Path B (derived H.15 spread).

---

## 2026-03-24 — GhostRegime UI: axis & sleeve pressure vs regime-change Flip Watch
Choice:
- **Axis & sleeve pressure** (distance to 0 and to VAMS ±0.5 bands, direction vs **prior persisted trading row only**) is **separate** from **`flip_watch_status`** (regime-change confirmation). UI uses teal styling and copy under “Axis & sleeve pressure”; regime-change Flip Watch stays amber and unchanged.
- **Optional** `stocks_vams_score` / `gold_vams_score` / `btc_vams_score` on persisted rows; **no inference** from state alone — missing scores show **N/A** for sleeve distance.

Why:
- Avoids conflating daily “how close to a flip” with the existing Flip Watch product.

Consequences:
- Logic unchanged; `lib/ghostregime/flipWatchPressure.ts` is display-only.

---

## 2026-03-24 — GhostRegime product positioning (copy): KISS-aligned targets, independent proxy-VAMS signals
Choice:
- **User-facing stance** is standardized: **KISS-style regime targets** + **independently computed proxy-VAMS sleeve signals** (SPY / GLD / BTC-USD). Durable copy lives in `lib/ghostregime/productPositioning.ts`.
- Do **not** imply exact daily sleeve-state parity with any external model unless proven and explicitly documented.

Why:
- Audits and drift work showed symbol swaps alone do not establish external label parity; clarity beats implied “sameness.”

Consequences:
- GhostRegime / methodology / glossary / related surfaces should pull from the positioning file when updating hero or SEO copy.

---

## 2026-03-24 — GhostRegime sleeve states: surrogate VAMS, not guaranteed 42-published labels
Choice:
- **Production** sleeve states come from **surrogate VAMS** on **SPY**, **GLD**, and **BTC-USD** (see `lib/ghostregime/vams.ts`), not from ingesting 42 Macro’s published VT / GLDM / FBTC state labels.
- **Allocation** targets follow KISS 8.0-style top-down rules (after the INFLATION gold fix); **signal layer** parity with 42 is explicitly **not** claimed unless instruments and thresholds match.

Why:
- Repo evidence: parity harness documents state math is **not** reverse-engineered from 42 (`docs/ghostregime/PARITY_REFERENCE.md`); instrument mismatch (SPY vs VT, GLD vs GLDM, spot vs FBTC) **explains** divergent bullish/neutral/bearish vs deck labels.
- Prevents marketing/UX confusion: we should not imply “same sleeve states as 42” without Level 2 or 3 parity.

Consequences:
- Methodology and product copy should describe **proxy-based** VAMS honestly; optional future work: tighter symbol parity (Level 2) or published-state ingest (Level 3). See `docs/ghostregime/VAMS_KISS_SIGNAL_AUDIT.md`.
- **User-facing stance:** KISS-aligned **targets**; **proxy** VAMS on **SPY / GLD / BTC-USD**; the Level-2 CLI compare (**VT / GLDM / FBTC** vs production) is **diagnostic only**, not a claim of matching any vendor’s internal daily states.

---

## 2026-03-24 — GhostRegime KISS 8.0: INFLATION uses 15% gold target (not 30%)
Choice:
- Top-down gold sleeve target in **INFLATION** is **15%**; all other regimes keep **30%** gold (risk-on and DEFLATION).
- Production (`computeAllocations`) and parity harness (`computeKissTargets`) use the same split.

Why:
- Aligns with current 42 Macro KISS 8.0 workbook/slide rules (INFLATION is the special case for a lower gold cap).
- Fixes inflated gold actuals when VAMS is bullish or neutral under INFLATION (previously used 30% × scale).

Consequences:
- Opt-in parity backtests (`RUN_PARITY_TESTS=1`) may need reference CSV/JSON regenerated from an 8.0 workbook if rows still encode old INFLATION gold.

---

## 2026-01-21 — Removed convex equity; merged into core equity
Choice:
- Removed convex_equity sleeve from model portfolios and builder entirely.
- Reallocated 100% of convex_equity weight into core_equity across all risk models (r1–r5).
- Removed convex_equity from sleeve definitions, types, Schwab lineups, and Simplify ETFs.

Why:
- Options-overlay ETFs are too complex for normal Voya users.
- Simplifies both /models display and builder output; no display-only merging needed.

---

## 2026-01-21 — Models page is implementable templates (platform-specific)
Choice:
- /models shows implementable templates using real OKC Voya funds, not engine sleeve allocations.
- Platform-first: Voya-only and Voya+Schwab tabs with Conservative / Moderate / Aggressive per tab.

Why:
- Normal Voya users need actionable fund lists, not abstract sleeve weights.
- Reduces confusion; aligns with builder output (Voya slice + Schwab slice).

---

## 2026-01-21 — Convex Equity omitted from models display (superseded by full removal)
Choice:
- Initially: display-only merge of convex_equity into core_equity on /models.
- Superseded by: full removal of convex_equity from model portfolios and builder (see above).

---

## 2026-01-21 — GhostRegime is posture/education overlay (not builder allocation driver) for now
Choice:
- Builder remains stable; GhostRegime provides risk posture and education only.
- Any future opt-in overlay (e.g. contribution guidance) would be contributions-only, not daily allocation churn.

Why:
- Avoids drift between builder logic and GhostRegime; matches 457 behavior reality (payroll lands in Voya, manual sweeps).
- Avoids daily allocation churn and keeps user experience predictable.

---

## 2026-01-21 — Seed CSV remains committed as bootstrap artifact
Choice:
- Keep the seed CSV committed in the repo for determinism and local-first behavior.
- Document cutover semantics and what breaks if the seed is missing (see data/ghostregime/seed/README.md and RUNBOOK).

Why:
- Avoids secrets dependency for local/CLI use; keeps CLI and diagnostics reliable without Blob tokens.
- Prevents docs drift by having a single documented source of truth for seed location and behavior.

---

## 2026-01-17 — Education hub implementation: manual data, validation, fallback links
Choice:
- Masterclass data file uses manual list (no runtime parsing of archive file).
- Triffin Trap series categorized as "Dollar Plumbing" (not "Other").
- Items without substackUrl show "Find on Substack" fallback link (never disabled buttons).
- Dev-time validation guardrails for data integrity (unique IDs, valid startHereOrder, non-empty fields).

Why:
- Manual list is most reliable and maintainable; parsing adds complexity and failure modes.
- "Other" should be reserved for truly miscellaneous items, not a catch-all.
- Every item must have a working click path; fallback to series page ensures usability.
- Validation catches errors early in development without risking production crashes.

Consequences / follow-ups:
- Data file is manually maintained; updates require editing the array.
- Validation runs on import in dev mode only (gated on NODE_ENV).
- Fallback links ensure good UX even before per-article URLs are provided.

---

## 2026-01-17 — Education hub + Masterclass integration approach (guided path, Level 1 link-out)
Choice:
- Add an Education area (/learn) with a guided "Start here" path.
- Integrate Macro Mayhem Masterclass as Level 1: link out to Substack (no content migration yet).
- Add a 457(b) basics page first (generic, first-responder friendly). Add an OKC-specific stub later when plan docs are available.

Why:
- Education improves trust + onboarding and reduces user confusion before they hit the builder.
- Level 1 avoids a migration/time-sink while preserving Substack as the canonical home for MMM.
- Guided path reduces "what do I click" paralysis for normal humans.

Alternatives considered:
- Level 2 (host MMM content in-app as MD/MDX) — deferred until after Learn hub ships and structure proves useful.
- Free-form library only (no guided path) — rejected; too easy to become a link dump.

Consequences / follow-ups:
- Add /learn to top nav + add a homepage secondary CTA ("Learn 457 Basics").
- Build /learn/masterclass with "Start here" ordering, categories, and brief blurbs.
- Create a lightweight data file for MMM entries; allow "Link pending" until URLs are provided.

---

## 2025-12-01 — No options; ETF "options-like" exposure via ETFs only
Choice: Avoid options strategies; if we need convexity/managed futures/etc, use ETFs/funds.
Why: Target users won't use options; ETFs are simpler and implementable.

## 2025-12-05 — No accounts/login in V1
Choice: V1 is compute + display; persistence via localStorage only.
Why: Reduce scope; validate usefulness before Supabase.

## 2025-12-08 — Voya + Schwab design: Schwab = growth bucket, Voya = defensive + inflation bucket
Choice: For combo users, Voya implementation avoids duplicating equity funds when Schwab exists.
Why: Reduces redundancy and makes the split feel intentional.

## 2025-12-09 — OKC 457 reality must be explicit
Choice: UI copy states payroll contributions land in Voya first; Schwab requires manual sweeps.
Why: Prevents incorrect expectations and improves real-world usability.

## 2025-12-12 — Canonical OKC Voya fund list is a single source of truth
Choice: All dropdowns and mixes reference lib/voyaFunds.ts canonical IDs.
Why: Prevents drift, enables validation, supports future expansions.

## 2025-12-15 — Builder UX optimized for action, not reading
Choice: "Start here" strip + Action Plan first; details collapsed by default.
Why: Firefighters want a checklist, not a whitepaper.

## 2025-12-22 — Define V1 vs V1.1 scope
Choice: V1 is MVP Foundation; V1.1 is model portfolio validation + GhostRegime visual polish.
Why: Keeps a stable shipping milestone while allowing iterative refinement.
Alternatives: "V1 never ends" (rejected)
---
