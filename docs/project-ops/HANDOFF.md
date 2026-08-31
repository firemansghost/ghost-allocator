# HANDOFF

## Last Session Summary (2026-08-30, GhostRegime R1 test foundation)
R1 baseline: `0d8f4c90126ee8185da770f103c9a658c63d7ad4`. Canonical command: `npm run test:ghostregime` (`scripts/ghostregime/run-tests.ts`, **28 files**). `npm test` now runs the complete GhostRegime deterministic suite plus existing GhostFlow. `verify:ghostregime` is build + lint + that same suite.

New / R1-owned tests:
- **Stable:** `r1Invariants.test.ts` — classifyRegime zero behavior; 60/30/10 and INFLATION 15% / DEFLATION 30% gold policy; allocation sum; VAMS scales 0/0.5/1; live-like core 0 + sat +1; local C1 math; seed output-history-only header check.
- **R3 characterization:** current PDBC/TIP Inflation vs TLT/UUP Disinflation labels while TLT/UUP +1 still add to the scalar.
- **R4 characterization:** `detectFlipWatch` PENDING / negative days / STRONG / BREWING; `shouldApplyFlip` in isolation (not an engine-use proof); stress helper RISK ON → RISK OFF.
- **R5 characterization:** commodity vote; Freight fallback name match; Truflation fallback-name mismatch; Freight keeps Freight semantics on commodity value.
- **R6 characterization:** vote-0 receipts are a side not Neutral; coverage = non-neutral count; `formatScaleLabel` helper only.
- **R2:** no new test. Public GET / anonymous debug / error-path double-fetch deferred (no clean seam without production changes). Scheduled no-fetch remains in existing `scheduledRefreshEngine.test.ts`.

R3/R4/R5 still gated. 60/30/10 still frozen. No `DECISIONS.md` entry (test-runner choice only). **Next: R2 — operational containment.** Do not start R2 in this thread.

## Priority for Next Session (GhostRegime)
1. **R2** — operational containment
2. Do not implement R3/R4/R5/R6, and do not change 60/30/10 or VAMS
3. GhostFlow: ordinary source monitoring only

---

## Last Session Summary (2026-08-30, GhostRegime R0 forensic complete)
R0 baseline: `019aa383d595c1f775885d1db270c985f8f993d5`. No tracked R0 analysis changes. Canonical record: [R0_FORENSIC_AUDIT_2026-08-30.md](../ghostregime/R0_FORENSIC_AUDIT_2026-08-30.md). Parent audit: [AUDIT_2026-08-30.md](../ghostregime/AUDIT_2026-08-30.md).

**Evidence classification warning:** reconstructed 2017–2025 C0/C1 results are **current-code replay**, not historical production behavior. Seed-era C1 cannot be called production impact.

Main numerical results:
- Seed overlap: **769 / 1,990 = 38.6%** regime match.
- Post-cutover persisted: **130 / 133 = 97.7%** regime match (Yahoo/CBOE vintage caveat; 2026-08-28 miss is risk-axis, not C1).
- Current-code C1: **471 / 2,280 = 20.7%** regime changes; 118 episodes; longest 25 days; median 2 days.
- **295 / 471** GOLDILOCKS ↔ REFLATION (same 60/30/10); **176 / 471** INFLATION ↔ DEFLATION (gold 15% ↔ 30%). VAMS actuals differ **168 / 2,280** days; max sleeve delta gold/cash 15 pp, stocks/BTC 0 pp. Not a backtest.
- Persisted-receipt C1: **9 / 125** regime changes; **8 / 9** target-equivalent; **1** target change on **2026-02-27**. Live 2026-08-28 stays `core 0 / sat +1 / final +1`.
- Satellites: sat decides axis/regime on **166** reconstructed days; PDBC TR63+TR21 both active **1,298** (same direction **1,040**).
- Stress: **78** reconstructed triggers; **0** reconstructed or persisted RiskOn / RISK-OFF clashes.
- Flip Watch: **13** persisted PENDING; **12 / 13** already new regime/targets; `daysSinceLastFlip` replay **−3313 to 0**.

High-confidence findings: improve-in-place still justified; TLT/UUP signs inconsistent; live one-day C1 is a no-op; Flip Watch is telemetry; commodity satellite is material; no stored stress-axis incident; 60/30/10 stays frozen.

Roadmap remains intact. **Next step: R1 — canonical GhostRegime test foundation.**

R1 boundary: build `test:ghostregime` and characterization seams. Do **not** install failing tests for R2 desired behaviors, and do **not** encode those current defects as permanent invariants. R2 targets (no public-GET provider fetch; anonymous debug cannot reach paid fallback; error path performs no duplicate fetch) become authoritative in R2. Neutral receipt labels and coverage semantics are R6 product-truth items, not current R1 invariants.

Explicit later gates (unchanged):
- **R3** — inflation-sign / model-version policy; Bobby approval required
- **R4** — Flip Watch telemetry vs real confirmation; undecided
- **R5** — satellite cleanup / PDBC dual-horizon / fallback names; not a removal decision
- **R7** — allocation research; **R8** only if evidence + separate product decision

Do not modify `DECISIONS.md` for R0. The 2026-08-30 remediation-sequencing decision remains controlling.

GhostFlow three-family receipt-backed refresh remains complete and separate (summary below). Ordinary GhostFlow source monitoring is not displaced by this GhostRegime checkpoint.

## Priority for Next Session (GhostRegime)
1. **R1** — canonical complete GhostRegime test command and characterization foundation
2. Do not implement R2/R3/R4/R5/R6, and do not change 60/30/10 or VAMS
3. Keep R2 operational targets and R6 UI-truth defects as characterization / deferred tests, not fake current invariants
4. GhostFlow: ordinary source monitoring only (do not start a new architecture project)

---

## Last Session Summary (2026-08-30, GhostRegime audit checkpoint)
`main` baseline: `519092ea1a7de384df4b74d833a8c937f6210f9a`. Production was READY on that commit. Persisted GhostRegime snapshot was computed under `d9473b02a5eb28df313378dd800c3473200f74c8` with no GhostRegime code changes since. **Verdict: IMPROVE IN PLACE** — do not rebuild. Canonical record: [AUDIT_2026-08-30.md](../ghostregime/AUDIT_2026-08-30.md).

Core findings (details in the audit; do not treat this list as a fix list):
- Inflation core sums PDBC/TIP (positive = Inflation) with TLT/UUP (positive = Disinflation). Internal sign inconsistency. Observed 2026-08-28 live regime would not necessarily change from a one-day correction because satellite was `+1`. Historical impact unknown.
- Flip Watch is telemetry/status, not a transition gate (`shouldApplyFlip()` unused; allocations apply immediately; live `PENDING_CONFIRMATION` with INFLATION targets already active). `daysSinceLastFlip` is not durable flip history.
- Stress override can force RISK OFF without recomputing `riskAxis` — characterization item, not a proven historical failure.
- Satellites: commodity basket is the live production satellite; others are stubs. Satellite decided the observed inflation axis (`core 0 / sat +1 / final +1`).
- Public `/api/ghostregime/today` reads can fetch providers; scheduled refresh can skip fetch. `debug=1` is not secret-protected. Error path can fetch again. Marketstack remains ALLOW-gated; anonymous traffic could reach paid fallback during an emergency ALLOW window.
- UI truth issues: “Hold now,” `% of Max`, headline rounding, BTC half-size shown as “off,” coverage = non-neutral not availability, neutral receipts stored as a side, vocabulary overload.
- Tests are fragmented; `npm test` is not the full GhostRegime suite.
- 60/30/10 full-risk baseline is an intentional policy assumption influenced by Darius Dale / 42 Macro. GhostRegime has not independently established optimality. **Out of scope for R0–R6 unless Bobby reopens it.**

Approved roadmap: docs checkpoint (this) → **R0 forensic replay** → R1 `test:ghostregime` → R2 operational containment → R3 inflation-sign (only after R0 + Bobby approval) → R4 Flip Watch product gate (A telemetry vs B real confirmation; undecided) → R5 satellite cleanup → R6 UI truth → R7 allocation research → R8 redesign only if R7 + separate product decision.

**Immediate next step: R0 — read-only forensic GhostRegime model-impact audit.** Do not begin methodology, provider, UI, allocation, or GhostFlow work in that thread unless Bobby explicitly expands scope.

Gates: no inflation-sign production change before R0 review; no real Flip Watch confirmation without a separate decision; no satellite score expansion; no VAMS / regime-threshold / sleeve changes; no Builder / Model Portfolio / GhostFlow mixing; no score/model change hidden inside a UI or provider PR.

GhostFlow three-family receipt-backed refresh remains complete and separate (summary below). Ordinary GhostFlow source monitoring is not displaced by this GhostRegime checkpoint.

## Priority for Next Session (GhostRegime)
1. **R0** — read-only historical replay / characterization per [AUDIT_2026-08-30.md](../ghostregime/AUDIT_2026-08-30.md)
2. Do not correct inflation signs, Flip Watch, satellites, providers, UI, tests, or allocations in R0
3. Keep 60/30/10 and VAMS thresholds unchanged
4. GhostFlow: ordinary source monitoring only (do not start a new architecture project)

---

## Last Session Summary (2026-08-30, first three-family receipt-backed refresh complete)
`main` baseline: `c3310b489b7d145b67d5ca1bf842dd021f97c373` (PRs **#140–#164** merged). Phase 1 receipts are implemented **and** the first full prospective three-family receipt-backed production refresh is complete. All three candidate-enabled families now have at least one prospective receipt:
- Long-End `treasuryLongEndIncomeLens` — `asOf` **2026-08-27** (PR **#162**) + receipt
- Treasury Futures `treasuryFuturesPositioningProxy` — `asOf` **2026-08-25** (PR **#163**) + receipt
- Systematic `systematicFlowProxy` — `asOf` **2026-08-25**, Mapping-A display **83** (PR **#164**) + receipt
Research Composite Systematic remains **MOCK 62**. Scores/reference/`publicSignalCount` unchanged. Receipt = verified transition evidence, **not** approval; Git merge remains acceptance boundary. Same-date / `revision_review_required` / automation remain blocked. **Next work is ordinary source monitoring, not new architecture.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- First production promotion merged (PR **#152**) — Long-End Board-native.
- Post-Long-End docs checkpoint merged (PR **#153**).
- Second production promotion merged (PR **#154**) — Treasury Futures automated.
- Post-Treasury Futures docs checkpoint merged (PR **#155**).
- Third production promotion merged (PR **#156**) — Systematic automated; three-family milestone complete.
- Three-family docs checkpoint merged (PR **#157**).
- Phase 1 promotion receipt policy/design authorized (PR **#158**).
- Phase 1 receipt R1 pure core merged (PR **#159**).
- Phase 1 receipt R2 writer/CLI merged (PR **#160**).
- Receipt docs/completion checkpoint merged (PR **#161**).
- First prospective receipt-backed Long-End refresh merged (PR **#162**) — `2026-08-27`.
- First prospective receipt-backed Treasury Futures refresh merged (PR **#163**) — `2026-08-25`.
- First prospective receipt-backed Systematic refresh merged (PR **#164**) — `2026-08-25` / display **83**.
- Receipt command: `npm run ghostflow:record-promotion-receipt -- --envelope <exact-path>` (dry-run); `--write` for sidecar.
- Same-date promotion blocked; automatic promotion blocked.
- Systematic score wiring / v1.0c blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. **Ordinary source monitoring** — wait for newer official observations; do not start another architecture project merely because this cycle completed
2. When ready: `npm run ghostflow:refresh-report` → generate/review/promote/receipt/PR per family if newer valid data exists
3. Do **not** manufacture updates; do **not** promote same-date changes
4. Same-date / `revision_review_required` promotion remains blocked (receipt history does not unlock this)
5. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
6. Systematic score wiring / v1.0c remains blocked
7. Breadth authorization remains separate and blocked; do not wire VIX or Gate C
8. Historical receipt backfill remains blocked

## Open Questions
- Same-date mapped-payload promotion policy? (still blocked; beginning of durable prospective receipt history exists, but still needs a **separate** explicit product/policy decision)
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Systematic score wiring / v1.0c product approval (still blocked)?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — Phase 1 promotion receipts complete (2026-08-27)
`main` baseline: `f04c456fe1ae48d9dc9b90ac232fc4e678cfd737` (PRs **#140–#160** merged). Phase 1 **verified promotion receipts are complete**: PR **#158** policy/design; PR **#159** R1 pure core; PR **#160** R2 writer/CLI. Receipt workflow is live for future promotions. `--apply` still writes one production artifact only; receipt writer writes receipt sidecar only; receipt failures retry receipt command only. Receipt is transition evidence, **not** approval; Git merge remains acceptance boundary. Prospective only — no historical backfill; no same-date unlock; no automation. Scores/reference unchanged. **Receipt mechanism completed but not yet exercised on a live three-family refresh.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- First production promotion merged (PR **#152**) — Long-End Board-native.
- Post-Long-End docs checkpoint merged (PR **#153**).
- Second production promotion merged (PR **#154**) — Treasury Futures automated.
- Post-Treasury Futures docs checkpoint merged (PR **#155**).
- Third production promotion merged (PR **#156**) — Systematic automated; three-family milestone complete.
- Three-family docs checkpoint merged (PR **#157**).
- Phase 1 promotion receipt policy/design authorized (PR **#158**).
- Phase 1 receipt R1 pure core merged (PR **#159**).
- Phase 1 receipt R2 writer/CLI merged (PR **#160**).
- Receipt command: `npm run ghostflow:record-promotion-receipt -- --envelope <exact-path>` (dry-run); `--write` for sidecar.
- Same-date promotion blocked; automatic promotion blocked.
- Systematic score wiring / v1.0c blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Use complete receipt path on the **next legitimate newer-date production promotion** — do not manufacture a promotion merely to create a receipt
2. Do **not** unlock same-date / `revision_review_required` merely because receipt infrastructure exists (prospective Phase 1; no historical receipts for #152 / #154 / #156)
3. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth authorization remains separate and blocked; do not wire VIX or Gate C
6. Historical receipt backfill remains blocked

## Open Questions
- Same-date mapped-payload promotion policy? (still blocked; needs durable prospective receipt history before separate future decision)
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Systematic score wiring / v1.0c product approval (still blocked)?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — Phase 1 promotion receipt policy (2026-08-27)
`main` baseline for this checkpoint: `e4dc0e9f043bcdd3d8987ab4f135c2780a2a92d6` (PRs **#140–#157**). Three automated candidate families remain production-live. **Next architecture milestone selected:** Phase 1 **verified promotion receipt** — policy/design authorized; implementation **not** done. Receipt is transition evidence (post-apply sidecar), **not** approval. Existing `--apply` stays one production write; future receipt command is separately retryable, deterministic (no wall-clock fields), Git-tracked in the same human data PR, prospective-only (no backfill). Same-date promotion, automation, Systematic v1.0c, breadth/Gate C/VIX remain blocked.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- First production promotion merged (PR **#152**) — Long-End Board-native.
- Post-Long-End docs checkpoint merged (PR **#153**).
- Second production promotion merged (PR **#154**) — Treasury Futures automated.
- Post-Treasury Futures docs checkpoint merged (PR **#155**).
- Third production promotion merged (PR **#156**) — Systematic automated; three-family milestone complete.
- Three-family docs checkpoint merged (PR **#157**).
- **Phase 1 promotion receipt policy/design** authorized (this checkpoint); coding not started.
- Same-date promotion blocked; automatic promotion blocked.
- Systematic score wiring / v1.0c blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Implement Phase 1 receipt per [PROMOTION_RECEIPT_PHASE1_DESIGN.md](../ghostflow/PROMOTION_RECEIPT_PHASE1_DESIGN.md) (R1 then R2) — do not change `--apply` single-write semantics
2. Same-date / `revision_review_required` promotion policy remains blocked
3. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth authorization remains separate and blocked; do not wire VIX or Gate C
6. Do not invent historical receipt backfill for #152 / #154 / #156

## Open Questions
- Same-date mapped-payload promotion policy? (still blocked; needs prospective receipts first for future design)
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Systematic score wiring / v1.0c product approval (still blocked)?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — three-family promotion milestone (2026-08-27)
`main` is `fdcf74d6d1ba7d9b42c3d4d23049bb1856548d38` (PRs **#140–#156** merged). All three current automated candidate families are now production-live via the human-reviewed promotion workflow:
- Long-End Board H.15: `asOf` **2026-08-25** (PR **#152**)
- Treasury Futures CFTC: `asOf` **2026-08-18** (PR **#154**)
- Systematic CFTC: `asOf` **2026-08-18**, Mapping-A display **79** (PR **#156**)
Research Composite Systematic input remains MOCK **62**. Scores / reference / `publicSignalCount` unchanged. Promotion writer remains explicit / manual / human-reviewed; no history / receipts / automation. Systematic test/date-lock hardening completed in PR **#156**. Do not automatically nominate another production artifact; remaining gates are separate product/policy decisions (Systematic v1.0c score wiring, same-date promotion, history/receipts, automatic promotion, workflow automation, breadth / Gate C / VIX).

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- First production promotion merged (PR **#152**) — Long-End Board-native.
- Post-Long-End docs checkpoint merged (PR **#153**).
- Second production promotion merged (PR **#154**) — Treasury Futures automated.
- Post-Treasury Futures docs checkpoint merged (PR **#155**).
- **Third production promotion merged (PR #156)** — Systematic automated; three-family milestone complete.
- Same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Systematic score wiring / v1.0c blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Do **not** automatically nominate another production artifact
2. Systematic score wiring / v1.0c remains blocked
3. Same-date / `revision_review_required` promotion policy remains blocked
4. Accepted-history / provenance receipt timing remains blocked
5. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
6. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Systematic score wiring / v1.0c product approval (still blocked)?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — second production promotion / Treasury Futures (2026-08-27)
`main` is `d17ec98dab241b83ddf615b117b1be10804578da` (PRs **#140–#154** merged). Long-End Board-native production remains live (PR **#152**). PR **#154** completed the second actual production promotion: `treasuryFuturesPositioningProxy` is now automated CFTC PRE TFF production (`asOf` **2026-08-18**, dataset `gpe5-46if`, `verified_automated`, no fabricated `publishedAt`, four core basket contracts, Ultra optional only, basket lev net **-32.4% OI**). Both promotions used reviewed envelope → dry-run → explicit `--apply` → validation → human PR → merge. Writer remains human-triggered; no history/receipts/automation. Scores / reference / `publicSignalCount` unchanged. Next: independently review `systematicFlowProxy` only — audit stale presentation/test assumptions before any apply. Systematic is not approved; Systematic score wiring / v1.0c remains blocked.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- First production promotion merged (PR **#152**) — Long-End Board-native.
- Post-Long-End docs checkpoint merged (PR **#153**).
- **Second production promotion merged (PR #154)** — Treasury Futures automated.
- Same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Independently review `systematicFlowProxy` before any additional `--apply` (not approved). Required audit points:
   - display-only / no Research Composite score merge
   - current `Weekly (manual artifact)` presentation metadata
   - `verified_automated` snapshot `dataQuality` handling
   - production-coupled tests pinned to old market values / metadata
2. Same-date / `revision_review_required` promotion policy remains blocked
3. History/provenance receipt timing remains blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — first production promotion / Long-End (2026-08-27)
`main` is `32eb660734e01b5a77980d54c8bcbca0565eecff` (PRs **#140–#152** merged). PR **#151** delivered the promotion writer; PR **#152** completed the first actual production promotion: `treasuryLongEndIncomeLens` is now Board-native production (`asOf` **2026-08-25**, H.15 SDMX, `frb_h15_treasury_long_end_income_lens_v1`, `verified_automated`, no T10YIE/breakeven, no fabricated `publishedAt`). First end-to-end cycle succeeded: candidate → human review → dry-run → explicit `--apply` → validation → data PR → merge. Writer remains operational but human-triggered (explicit envelope / dry-run default / explicit `--apply`). No history/receipts/automation. Scores / reference / `publicSignalCount` unchanged. Next: independently review the next candidate before any additional apply.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- PR C2 promotion writer merged (PR **#151**).
- **First production promotion merged (PR #152)** — Long-End Board-native.
- Same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Independently review remaining live candidates before any additional `--apply` (not approved yet):
   1. `treasuryFuturesPositioningProxy`
   2. `systematicFlowProxy`
2. Same-date / `revision_review_required` promotion policy remains blocked
3. History/provenance receipt timing remains blocked
4. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — promotion C2 writer (2026-08-27)
Starting `main`: `e5db69db5ddae54a933372ee5a96e29f75d13ecd` (PRs **#140–#150** merged). Implemented promotion C2 on `feat/ghostflow-promotion-writer`: explicit `--apply`, public envelope-path-only apply API, temp-sibling prevalidation, commit-point optimistic re-lock, rename-over-existing fail-closed write, mandatory post-write verification. **No live candidate promoted at that time; actual repo production JSON unchanged until PR #152.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture / mapping / mappers / generator / policy merged (PRs **#145–#149**).
- PR C1 promotion dry-run merged (PR **#150**).
- **PR C2 promotion writer** on `feat/ghostflow-promotion-writer` (pending merge at that checkpoint).
- Next: separately review/promote actual candidates (dry-run → `--apply` → human data PR).
- Same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Review live candidates and promote via separate human-reviewed production-artifact PR(s)
2. Same-date / `revision_review_required` promotion policy remains blocked
3. History/provenance receipt timing remains blocked
4. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- When to promote Long-End production artifact from FRED → Board (human data PR)?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — promotion C1 dry-run (2026-08-26)
Starting `main`: `cb7f45697831ba1d31e0a813ce90a1acb44f7ed9` (PRs **#140–#149** merged). Implemented promotion C1 on `feat/ghostflow-promotion-dry-run`: envelope eligibility validation, integrity reuse, current mapper replay, production optimistic lock, newer-date gate, `PromotionPlan`, and dry-run CLI. **`--apply` rejected; no production write capability; no candidate promoted.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture design merged (PR **#145**).
- Candidate mapping policy approved + impact inventory merged (PR **#146**).
- PR A candidate mappers + provenance hardening merged (PR **#147**).
- PR B candidate generator + integrity hardening merged (PR **#148**).
- Promotion policy + impact inventory merged (PR **#149**).
- **PR C1 promotion dry-run** on `feat/ghostflow-promotion-dry-run` (pending merge).
- **PR C2 writer not implemented**; `--apply` unavailable.
- Same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. **PR C2** — `--apply` fail-closed production writer + post-write verification
2. After C2 merges: separate human-reviewed data PRs for any actual artifact refresh
3. Same-date / `revision_review_required` promotion policy remains blocked
4. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- When to promote Long-End production artifact from FRED → Board (human data PR after mechanism)?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — promotion policy + PR C impact (2026-08-26)
Starting `main`: `70d8ade488a70c1f92015a8454864314d90db1d5` (PRs **#140–#148** merged). Recorded Bobby’s approved candidate-promotion policy in DECISIONS and completed read-only PR C impact inventory in [PROMOTION_POLICY_IMPACT.md](../ghostflow/PROMOTION_POLICY_IMPACT.md). **No code, no production writes, no candidate promoted.**

Policy highlights: `ready_for_review` only; explicit `--envelope`; dry-run default / `--apply` write; current mapper replay; current-production optimistic lock; newer-date gate; registry-owned destination; no network; no history; no Git automation. Recommended implementation split: **C1 dry-run**, then **C2 writer**.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture design merged (PR **#145**).
- Candidate mapping policy approved + impact inventory merged (PR **#146**).
- PR A candidate mappers + provenance hardening merged (PR **#147**).
- PR B candidate generator + integrity hardening merged (PR **#148**).
- **Promotion policy approved + impact audit** on `docs/ghostflow-promotion-policy` (pending merge).
- Promotion mechanism **not implemented**; same-date promotion blocked; history/provenance writes blocked; automatic promotion blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. **PR C1** — promotion validation + dry-run plan + CLI (no production writes)
2. **PR C2** — `--apply` fail-closed production writer + post-write verification
3. After mechanism merges: separate human-reviewed data PRs for any actual artifact refresh
4. Same-date / `revision_review_required` promotion policy remains blocked
5. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Same-date mapped-payload promotion policy?
- Accepted-history / provenance receipt timing?
- When to promote Long-End production artifact from FRED → Board (human data PR after mechanism)?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — PR B candidate generator (2026-08-26)
Starting `main`: `ee018350a8d76737027473a62e6196ce986a7f24` (PRs **#140–#147** merged). Implemented candidate generator + review envelope on branch `feat/ghostflow-candidate-generator`: canonical JSON hashing, deterministic candidate identity, current production fingerprinting, factual structural diff, fetch→parse→normalize→mapper pipeline, collision-safe idempotent writer, and single-artifact CLI. Live smoke all three artifacts `ready_for_review`; Long-End rerun `candidate_already_exists`. **No production JSON writes, no promotion.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 SDMX transport merged (PR **#143–#144**).
- Candidate-generation architecture design merged (PR **#145**).
- Candidate mapping policy approved + impact inventory merged (PR **#146**).
- PR A candidate mappers + provenance hardening merged (PR **#147**).
- **PR B candidate generator implemented** on `feat/ghostflow-candidate-generator` (pending merge).
- Promotion / PR C **not implemented** — blocked pending separate DECISIONS approval.
- Same-date promotion policy still blocked.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. **Promotion policy / PR C authorization gate** — DECISIONS entry + human approval before production writes
2. Same-date mapped-payload promotion policy decision (does not block review of PR B)
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Promotion command authorization (DECISIONS entry)?
- Same-date mapped-payload promotion policy?
- When to promote Long-End production artifact from FRED → Board (human decision)?
- Optional future: adapter emission of defensible CFTC/Board `sourcePublishedAt`?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — PR A candidate mappers (2026-08-26)
Starting `main`: `2dd7c086d8c659e2823ca36928ce7eef91c625b1` (PRs **#140–#146** merged). Implemented approved candidate production-mapping policy on branch `feat/ghostflow-candidate-mappers`: narrow type changes, fail-closed validators (including Long-End legacy FRED / Board-native transitional validation), Treasury display truth branching, three pure candidate mappers + registry, and offline tests. **No production JSON writes, no candidate generator/CLI, no promotion.**

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**).
- CSV blank-as-missing parser **1.0.1** merged (PR **#142**).
- H.15 SDMX transport decision (PR **#143**) and implementation/cutover (PR **#144**) merged to `main`.
- Candidate-generation **architecture design** on PR **#145**; implementation **blocked on mapping-policy decisions**.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. **Resolve candidate production-mapping policy decisions** (Long-End `seriesDefinition` / Board source block, `dataQuality`, `publishedAt`) — DECISIONS update after Bobby approval
2. **PR A** — types + authorized validator/schema updates + pure mappers + tests (only after decision gate)
3. **PR B** — generator + diff + idempotent writer + CLI
4. Promotion (PR C) requires separate DECISIONS approval
5. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Approve proposed Long-End `seriesDefinition`: `frb_h15_treasury_long_end_income_lens_v1`?
- Board H.15 production `source` block + validator/display-copy changes?
- `dataQuality`: `verified_automated` vs retain existing enum?
- CFTC + H.15 automated `publishedAt` mapping policy?
- Same-date mapped-payload promotion policy (does not block generator)?
- Promotion command authorization (DECISIONS entry)?

---

## Archive — Candidate-generation design initial draft (2026-08-26)
Starting `main`: `ae6fbf14a25e5e898d0874358bed17b26ba28c50` (PRs **#140–#144** merged). Authored read-only candidate-generation design memo for operator-ready artifacts. Initial draft proposed PR A immediately after merge; superseded by mapping-policy gate in contract correction pass.

## Priority for Next Session (superseded)
1. ~~PR A immediately after #145~~ → mapping-policy decisions first

---

## Archive — H.15 SDMX/XML transport implemented (2026-08-26)
Starting `main`: `3f63fdf27176dc5fabb4b15c8395200d10c9c931` (PRs **#140–#143**). Implemented and cut over `treasuryLongEndIncomeLens` active transport from dual Board H.15 DDP CSV to release-level SDMX/XML ZIP (`FRB_h15_xml.zip`). New adapter `frb-h15-treasury-yields-sdmx` parser **1.0.0**; registry + operator runner updated; CSV **1.0.1** retained without automatic fallback. ZIP via narrow in-memory local-header reader + `node:zlib`; XML via deterministic SDMX compact scanner — **no new dependencies**. Live CSV/XML parity OK at `2026-08-24`. Live smokes healthy (H.15-only + full runner, exit 0). DECISIONS unchanged (PR **#143** approval already recorded). Production artifacts, scores, MOCK, reference date, and candidate generation unchanged.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**).
- CSV blank-as-missing parser **1.0.1** merged (PR **#142**); CSV adapter retained but inactive at runtime.
- H.15 SDMX/XML transport approved (PR **#143**) and **implemented** on `feat/ghostflow-h15-sdmx`.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Human-reviewed candidate-generation design for operator-ready artifacts
2. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Candidate-generation acceptance workflow and production writer boundaries?
- Breadth licensed-source path still blocked pending authorization?
Live smoke outcomes:
- H.15-only (`2026-08-26T00:08:24.514Z`): `candidate_observation_available` (candidate `2026-08-24`); overall `ready_for_review`; `review_candidates`; exit 0; prior row-67486 failure gone
- Full runner (`2026-08-26T00:08:41.683Z`): systematic + Treasury CFTC + H.15 all `candidate_observation_available` (CFTC `2026-08-18`, H.15 `2026-08-24`); overall `ready_for_review`; `review_candidates`; exit 0; no writes

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**); blank-as-missing parser repair implemented on that branch and later merged as PR **#142**.
- Custom TIPS-30 leg remains BYP-exposed; durable Path D XML migration still required before **2026-11-09**.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Design and approve durable Board release-level SDMX/XML transport migration for `treasuryLongEndIncomeLens`
2. Only after transport migration planning is locked, resume human-reviewed candidate-generation design
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Record XML/SDMX transport migration in DECISIONS after Bobby review?
- Retain dual CSV briefly for provenance comparison during XML cutover?

---

## Archive — H.15 live-source investigation (2026-08-25)
Starting `main`: `51236fb96b15b73c5da095aa6b8dc7b3410148e0` (PR **#140** merged). Completed docs-only **H.15 live source and transport investigation** on branch `docs/ghostflow-h15-live-source-investigation`.

**Findings:**
- Live smoke (`npm run ghostflow:refresh-report`, `2026-08-25T22:22:19.375Z`): H.15 fails at TCM CSV row **67486** — blank value on `H15/H15/RIFLGFCY02_N.B` / `1962-01-02`
- Classification: **B — parser omission** (blank cells = missing; not schema drift)
- Custom TIPS-30 DDP package is **BYP-exposed** (custom-package mechanism; removal week of **2026-11-09**); continued arbitrary-package URL support after BYP removal not guaranteed; preformatted TCM **NOT SPECIFIED** post-November
- Release SDMX/XML ZIP verified: all five contract series present at `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- Memo: [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md)
- **Recommended:** durable Path D (release XML); smallest next PR = parser **1.0.1** blank-as-missing CSV fix
- **No** adapter, registry, transport, or production changes in this investigation

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation complete; live parse still blocked until approved implementation.
- CFTC adapters healthy in prior smoke; H.15 transport durability concern confirmed (BYP + blank CSV).
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Bobby review investigation memo; approve parser 1.0.1 fix and/or SDMX migration path
2. Implement approved H.15 fix(es) before **2026-11-09** BYP removal
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Approve interim CSV 1.0.1 fix only, or proceed directly to SDMX adapter?
- Record transport migration in DECISIONS after review?
- Any requirement to retain dual CSV for provenance comparison during XML cutover?

---

## Archive — Report-only operator runner (2026-08-25)
Starting `main`: `0cf02b922baf0f5a6ade38f700dee886f307e4d7` (PR **#139** Board H.15 adapter merged). PR **#140** implements manual **report-only operator runner** (`npm run ghostflow:refresh-report`) for three non-score-fed adapters: systematic CFTC, Treasury CFTC, and Board H.15 long-end.

Live smoke (2026-08-25T21:54:54.950Z):
- CFTC systematic and Treasury sources returned newer candidate observation dates (2026-08-18)
- H.15 long-end live execution failed closed: `source_failed` with `h15_csv_invalid_value` at source CSV row 67486
- Overall report: `partial_with_blocks`; exit code 2
- No production, candidate, or history write occurred
- Runner behavior is correct; H.15 adapter/source investigation is the immediate next task

**Federal Reserve DDP announcement (2026-07-16):**
On [2026-07-16](https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15), the Board announced **Build Your Package (BYP)** removal planned for the week of **2026-11-09**, in preparation for eventual DDP retirement. Users are directed toward FRED or release-level XML downloads. The current H.15 adapter uses a custom DDP package for the required 30Y inflation-indexed series (`RIFLGFCY30_XII_N.B`), so source transport durability must be revisited. No replacement source is approved by this note.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner is implemented on PR **#140**.
- CFTC systematic and Treasury adapters returned newer candidate dates in live smoke.
- H.15 adapter failed live parse at row 67486; transport durability concern added by July 16 DDP/BYP announcement.
- No production/candidate/history write occurred; runner fail-closed behavior confirmed.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. H.15 live-source / parser / transport investigation (including DDP/BYP retirement implications)
2. Candidate-generation design only after H.15 returns to a healthy deterministic live smoke
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- What exact value/row shape triggered `h15_csv_invalid_value` at row 67486?
- Is the defect a valid historical sentinel/format case or actual schema drift?
- Can the existing CSV transport survive the November BYP removal?
- Should the canonical Board transport move to release-level SDMX/XML?

---

## Archive — Board H.15 adapter (2026-07-13)
Starting `main`: `9cf9fa4` (PR **#138** Treasury long-end source audit merged). Implemented fixture-driven **Board H.15 Treasury yields adapter** (`frb-h15-treasury-yields-csv` → `implemented` / `1.0.0`) after Bobby approved migrating `treasuryLongEndIncomeLens` off FRED. Dual DDP packages: official TCM + `RIFLGFCY30_XII_N.B`. Required 30Y nom + 30Y real; optional 2/5/10Y; **T10YIE omitted** (no derived breakeven). Unwired; no production write. DECISIONS appended. CFTC systematic/Treasury + VIX remain unwired. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Long-end H.15 adapter: fixture-tested, registry implemented, production-unwired.
- Source decision recorded; FRED graph CSV / API not production transports for this artifact.
- Treasury CFTC + systematic + VIX adapters remain implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Do not wire H.15 / CFTC / VIX adapters into CLI/workflows/production writers yet
2) Breadth: decide written permission vs licensed SKU (neither approved)
3) Optional: human-approved artifact refresh path using H.15 (separate from this adapter PR)

## Open Questions
- When should display adapters become operator-driven vs remain research/fixture-only?
- Later breakeven posture: omit permanently, derived H.15, or FRED under written permission?

---

## Archive — Treasury long-end source audit (2026-07-13)
Starting `main`: `12ad053` (PR **#137** CFTC Treasury adapter merged). Docs-only **Treasury long-end source feasibility / authorization audit** for `treasuryLongEndIncomeLens`: [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md). Verdict: prefer direct Board H.15; do not promote `fredgraph.csv`; FRED API permission-required for retention/history. No registry/artifact/score change in that PR.

## Archive — CFTC Treasury adapter (2026-07-13)
Starting `main`: `70b66f7` (PR **#136** shared CFTC Socrata core merged). Implemented fixture-driven **CFTC TFF Treasury Socrata adapter** (`cftc-tff-treasury-socrata` → `implemented` / `1.0.0`) reusing the shared core. Four standard Treasury contracts are required core; two Ultra contracts remain optional context (missing optional → review issue). Adapter normalizes raw observations only; no net/gross/direction/basket/score. Unwired; no production write. Systematic unchanged/unwired; FRED Treasury remains `spike_available`. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## Archive — Shared CFTC Socrata core (2026-07-13)
Starting `main`: `96852dc` (PR **#135** CFTC systematic adapter merged). Extracted shared **CFTC TFF Socrata source core** (transport, cell parsers, hashing, generic deterministic query builder). Systematic adapter refactored to consume the core with **no behavior change** (ID / parser `1.0.0` / query URL / errors / normalized output preserved). Systematic remains unwired. Treasury CFTC remains `spike_available` and is the recommended next implementation. Breadth / Gate C blocked; no provider approved. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Shared CFTC Socrata core extracted; systematic adapter behavior unchanged.
- CFTC systematic adapter: fixture-tested, registry implemented, production-unwired.
- VIX adapter remains implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Implement `cftc-tff-treasury-socrata` using the shared CFTC Socrata core
2) Do not wire systematic/Treasury adapters into CLI/workflows/production writers yet
3) Breadth: decide written permission vs licensed SKU (neither approved)

## Open Questions
- Any Treasury-contract selection nuances before implementing the Treasury adapter?
- When should systematic display refresh become operator-driven vs remain research-only?

---

## Archive — CFTC systematic adapter (2026-07-13)
Starting `main` for this work: `c503042` (PR **#134** breadth operator packet merged). Implemented fixture-driven **CFTC TFF systematic Socrata adapter** (`cftc-tff-systematic-socrata` → `implemented` / `1.0.0`). Adapter normalizes official ES/NQ/RTY/VIX Futures Only observations only; basket and pressure mapping stay downstream; unwired from runtime/workflows; no production artifact write; MOCK systematic **62** unchanged. Breadth / Gate C remain blocked; no provider approved. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- CFTC systematic adapter: fixture-tested, registry implemented, production-unwired.
- VIX adapter remains implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Implement Treasury CFTC adapter (reuse Socrata boundary) **or** FRED Treasury adapter (neither already claimed done)
2) Do not wire systematic adapter into CLI/workflows/production writers yet
3) Breadth: decide written permission vs licensed SKU (neither approved)

## Open Questions
- Prefer Treasury CFTC reuse next, or FRED Treasury first?
- When should systematic display refresh become operator-driven vs remain research-only?

---

## Archive — Breadth operator packet (2026-07-13)
PR **#133** is on `main` (`18ab040`). Completed docs-only **breadth operator-packet** specification and reconciled stale operator docs: [BREADTH_ARTIFACT_RUNBOOK.md](../ghostflow/BREADTH_ARTIFACT_RUNBOOK.md), [MANUAL_REFRESH_CHECKLIST.md](../ghostflow/MANUAL_REFRESH_CHECKLIST.md), [REFERENCE_DATE_AND_OPERATOR_POLICY.md](../ghostflow/REFERENCE_DATE_AND_OPERATOR_POLICY.md). Packet is intake-only; no provider approved; production breadth refresh and Gate C remain blocked. VIX adapter remains unwired. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Feasibility decision (PR #133) + operator-packet runbook are in place.
- Direct StockCharts/Barchart production transcription instructions are quarantined / non-executable.
- No registry, adapter, artifact, or score changes.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Decide whether to seek written provider permission **or** investigate an exact licensed provider SKU (neither approved)
2) Do not implement scrapers, HTML adapters, packet parsers, or Gate C runners
3) Do not bump reference through Gate C until an authorized breadth source exists

## Open Questions
- Does Bobby want written StockCharts permission, a licensed vendor SKU investigation, or to leave Gate C blocked longer?
- If a licensed path emerges, should registry later move `marketBreadth` to `operator_packet` only after both product approval and provider rights evidence?

---

## Archive — Education session (2026-01-21)
Added "457(b) in 5 Minutes" quick reference to education section:
- Created reusable component (components/learn/457InFiveMinutes.tsx) with scannable format
- Added prominent section to /learn/457 page (positioned after header, before longer content)
- Added Browse card to /learn hub linking to /learn/457#in-5-minutes anchor
- Component covers: 60-second version, governmental vs non-governmental, withdrawals (with rollover caution), catch-ups, common mistakes, and actionable checklist
- Uses existing styling patterns for consistency

## State of Work
- Core app is stable and deployable; builder/onboarding works.
- Sleeve logic is clean (no Gold double-counting; Gold and Commodities remain separate).
- GhostRegime diagnostics are in a good place and can be revisited if parity issues matter again.
- Education section is live and functional. Masterclass items use fallback links ("Find on Substack") until per-article URLs are provided.

## Priority for Next Session
1) Add per-article Substack URLs to masterclass data file as Bobby provides them
2) Develop OKC-specific 457(b) playbook content when plan documents are available
3) Consider content for Finance Basics and Glossary pages (currently stubs)

## Open Questions
- When will per-article Substack URLs be available to replace fallback links?
- What's the timeline for OKC plan documents to enable OKC-specific 457(b) playbook?
- Should Finance Basics and Glossary be prioritized, or focus on other features first?

---

## Archive
### Snapshot (2025-12-22)
Ghost Allocator V1 is in a strong place: platform-aware builder flow, Voya fund menu completeness, delta "one-time rebalance" guidance, and clearer UX hierarchy. SEO basics are added (metadata, robots/sitemap, OG). GhostRegime workflow was adjusted to avoid noisy failures by skipping safely when not configured.

## State of Work
- Core product works locally and the UI is now readable/actionable.
- Remaining work is mostly: verification, deployment, and deciding the next feature slice.

## Priority for Next Session
1) Model portfolios: define final set + sleeve weights + ETF examples (spec first)
2) Build a quick output review checklist across risk bands + platform types
3) GhostRegime UI polish plan (cards/layout/hierarchy)

## Open Questions
- Do we capture Schwab holdings next (like CurrentVoyaForm) or do PWA/perf first?
- What's the minimum "done" for V1 before we add Supabase accounts?

---

## START SESSION PROMPT (copy/paste)
Read these files first:
- docs/project-ops/STATUS.md
- docs/project-ops/DECISIONS.md
- docs/project-ops/TASK_LOG.md
- docs/project-ops/HANDOFF.md
- docs/project-ops/SKILLS.md

Before acting:
1) Summarize current state in 3-5 bullets.
2) Confirm the priority for this session.
3) Propose a plan (max 3 steps).
4) Wait for Bobby's approval before coding.

Risk posture: Conservative
Tone: Use SKILLS.md

## END SESSION PROMPT (copy/paste)
Session ending. Do this:

COMPACTION (3-5 sentences):
- What was done, what changed, what's unresolved.

UPDATE FILES:
- Update STATUS.md (state, blockers, next actions, date)
- Add a new entry to TASK_LOG.md
- Add decisions (if any) to DECISIONS.md
- Update HANDOFF.md with next-session priority + open questions