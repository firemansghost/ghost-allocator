# STATUS

## Current State (GhostRegime — 2026-09-02 R7C complete / evidence reviewed)
**R7C COMPLETE — VALID FROZEN STUDY**

R7C executed the preregistered frozen-panel allocation study **exactly once** from the sealed runner. PR **#187** (`research(ghostregime): add R7C frozen study runner`) merged as `04eff53e576d572b3e06b9c29c47173fbdf0c8a5`. Sealed runner head: `8c33c028b67b7b2bdbe97db07dc44d6781f5074b`. The runner was committed and pushed before outcomes were viewed. There were no post-result runner changes.

Private snapshot **`r7b0-20260902-210842Z`**. Manifest SHA-256 `bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00`. Validation-report SHA-256 `397712e67a72500badd705bc369105f82bb52ba3fc7af6ff016821000abbcf22`. Result directory (untracked): `tmp/ghostregime-r7/r7c-20260902-231435Z/`. Started `2026-09-02T23:13:49.459Z`, completed `2026-09-02T23:14:35.535Z`. Receipt status **VALID**. RUN_RECEIPT SHA-256 `766d0c7418da5051c46538230504da09a10f09f45351eea30bbc1c6115d47af6`. Result hashes verified. No private result artifact was committed.

Common dates: S0 `2017-08-03`, S1 `2017-08-04`, S2 `2017-08-07`. Full `2017-08-04` → `2026-09-01`. Development `2017-08-04` → `2024-08-30`. Holdout calendar `2024-09-01` → `2026-09-01` (first session `2024-09-03`). Holdout was a continuing-path slice, not a restart.

**P0_CURRENT full (historical, not a forecast):** CAGR 16.74%; vol 9.89%; Sharpe 1.37; Sortino 1.99; max DD −12.79%; Calmar 1.31; final NAV 4.08; worst complete year 2018 −9.34%; approx. avg exposure SPY 41% / GLD 21% / BTC 5.8% / BIL 32%; one-way turnover 110.66; rebalances 477. **Holdout:** CAGR 20.47%; vol 10.65%; Sharpe 1.43; Sortino 2.02; max DD −5.38%; Calmar 3.81.

**Benchmarks (full):** STATIC_601030 CAGR 23.43% / Sharpe 1.18 / max DD −26.39%. STATIC_6040 9.45% / 0.66 / −21.32%. SPY_100 14.95% / 0.71 / −33.72%. P0 did not maximize return versus static 60/30/10. In this sample P0 materially reduced historical drawdown and improved risk-adjusted return versus static 60/30/10 and SPY. That does **not** prove future superiority.

**Candidates (evidence only; no ranking / no winner):** P1 full CAGR 14.60%, max DD −11.15%, full return lag vs P0, holdout CAGR +0.61pp vs P0 (holdout reversal). P2 full CAGR 14.42%, Sharpe 1.27, max DD −12.15%, lagged P0 at every expanding checkpoint. P3 full CAGR 16.73%, Sharpe 1.37, max DD −12.54%, effectively indistinguishable from P0. P4 full CAGR 16.57%, Sharpe 1.34, max DD −13.18%, holdout CAGR 19.67% / max DD −7.61%, did not improve the P0 tradeoff. P5 full CAGR 16.57%, Sharpe 1.39, max DD −12.12%, Calmar 1.37, modest risk-adjusted improvement, higher turnover, no material return improvement. P6 full CAGR 18.99%, Sharpe 1.39, max DD −16.21%, +2.24pp CAGR vs P0, materially higher BTC, return edge did not repeat in holdout (holdout CAGR ≈ P0), deeper drawdown.

**P0-family ablations (diagnostic, not causal):** REGIME_ONLY 18.62% / 1.20 / −23.56%. VAMS_ONLY 18.88% / 1.29 / −17.02%. COMBINED P0 16.74% / 1.37 / −12.79%. STATIC_601030 23.43% / 1.18 / −26.39%. SPY_100 14.95% / 0.71 / −33.72%. VAMS appears to contribute substantial drawdown control. Regime-only also reduces static drawdown but less than VAMS-only. Combined regime + VAMS produced the shallowest P0-family drawdown and highest Sharpe.

**BTC dependence:** P0 NO_BTC_TO_CASH ΔCAGR −6.17pp, ΔSharpe −0.35, ΔmaxDD +3.60pp shallower. P6 NO_BTC_TO_CASH ΔCAGR −8.74pp, ΔmaxDD +6.95pp shallower. P0 arithmetic BTC contribution +0.527 full / +0.493 development / +0.034 holdout. Most measured BTC benefit occurred before the holdout. P6’s higher full-period return is strongly BTC-dependent. No-BTC remains a sensitivity, not a candidate.

**Cost:** P0 0 bps CAGR 16.74% / NAV 4.076; 5 bps 15.33% / 3.649; 10 bps 13.93% / 3.266. Static 60/30/10 cost impact is very small because turnover is low. High event-driven turnover materially reduces dynamic-strategy performance under positive cost assumptions. These bps are study assumptions, not measured implementation costs.

**Holdout / stability:** Holdout is roughly two years. P6 full-period return edge did not repeat. P1 holdout improvement reverses its full-period lag. P3 remains near P0. P4 remains weak. P5 remains a small tradeoff change. END_MINUS_3M preserved the same broad candidate directions. END_PLUS_3M was unavailable under the frozen snapshot. No extra provider fetch.

**Inflation regime diagnostic (P0 executed regime):** REFLATION 939 intervals, positive conditional; GOLDILOCKS 513, positive; DEFLATION 551, positive; INFLATION 277, average net ≈ −0.014%/session, conditional compounded ≈ −4.0%. Diagnostic only. It does **not** prove the Inflation policy should change. P4’s higher Inflation gold target did not improve the overall or holdout tradeoff.

**Warnings:** one BTC return mark stale 1 hour on 2017-02-28; no BTC post-close leakage; 32 VIX non-XNYS weekday extras preserved; full current-model sample ~9 years; holdout ~2 years; meaningful BTC path dependence; high event-driven turnover; historical backtest, not a forecast; one frozen data path only.

**Reporting caveat:** R7C `allocationChangeCount` is computed over the full study session range and reused in FULL, DEVELOPMENT, HOLDOUT, and endpoint bundles. The FULL count is a valid full-period count. Development / holdout / endpoint `allocation_change_count` fields must **not** be interpreted as window-specific. This does **not** affect NAV, CAGR, vol, Sharpe, Sortino, drawdown, Calmar, TUW, turnover, rebalance count, exposures, or reported candidate evidence. Do not patch the sealed runner. Do not rerun R7C. Exclude subwindow allocation-change-count fields from R7D evidence.

Model remains `ghostregime-v1.0.4`. **60/30/10 unchanged.** No refresh. No production writes. No GhostFlow change. **No R7D KEEP / MODIFY / REDESIGN decision has been made.** R7C is evidence complete and does **not** authorize changing 60/30/10, BTC weight, Inflation gold, risk-off equity, VAMS, regime math, or `MODEL_VERSION`.

**R7C is complete.** Next is **R7D — product/model decision gate**, a decision exercise using this existing evidence. R7D does not require a new backtest by default. Do not reopen R7A–R7C without a demonstrated defect. Do not rerun R7C.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R7D — product/model decision gate** using existing R7C evidence (does **not** authorize live allocation changes until an explicit R7D decision)
2. Do **not** rerun R7C
3. Do **not** reopen R7A / R7A.1 / R7B0 / R7B1 / R7C unless new evidence shows a real defect
4. Exclude subwindow `allocation_change_count` fields from R7D evidence
5. Separate non-R7 backlog: **site-wide product-copy truth audit** (do not perform it here)
6. Do **not** change VAMS, allocation formulas, provider routing, workflows, P1/P2/P3, or R4
7. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R7B1 merged / preregistered)
**R7B1 HARNESS COMPLETE — MERGED**

R7A architecture, R7A.1 methodology correction, R7B0 frozen research-data capture, and R7B1 deterministic research harness are complete. PR **#185** (`research(ghostregime): add R7 allocation study harness`, reviewed final head `7ff4e1d5e3c3fdbb5f1b1488f8595b1b797c063a`) merged as `fa139ac94507b7c86a88932023045e987b0c933a`. Research harness / tests / validate-only tooling only. Production engine semantics were not changed.

**NO REAL CANDIDATE PERFORMANCE HAS BEEN VIEWED.** No frozen-panel CAGR, drawdown, Sharpe, Sortino, ranking, or winner exists. That preregistration boundary is the point of this checkpoint.

- Private snapshot **`r7b0-20260902-210842Z`** (gitignored / uncommitted). Manifest SHA-256 `bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00`. Validation-report SHA-256 `397712e67a72500badd705bc369105f82bb52ba3fc7af6ff016821000abbcf22`. Window `2016-01-01` → `2026-09-01`.
- Hashes verified. Return panels and ordinary ETF signal panels exactly aligned to XNYS. Known warnings: 32 VIX non-XNYS weekday extras preserved (0 weekend extras); BTC return mark stale exactly once on **2017-02-28** (1 hour, non-leaky); no missing ETF-session BTC marks.
- Post-cutover model-state parity vs production `computeGhostRegime()`: **189** dates (`2025-12-01` → `2026-09-01`), **0** allocation-relevant mismatches, **0** non-zero `infl_sat_score` dates. Cutover remains intact; the research adapter uses lower-level production functions rather than a production bypass.
- Frozen contract: T/T+1/T+2 execution; self-financing drift; event-driven rebalance; inception free of turnover/cost (`rebalanced = false`); fail-closed held-asset returns; after-cost `netPortfolioReturn` for metrics; BIL adjusted cash; 0 bps primary / 5 and 10 bps sensitivities; annual static benchmarks; P0–P6 only; ablations `STATIC_601030` / `REGIME_ONLY` / `VAMS_ONLY` / `COMBINED` / `SPY_100`; holdout `2024-09-01` → `2026-09-01` (first eligible session `2024-09-03`).
- Model remains `ghostregime-v1.0.4`. **60/30/10 unchanged.** No refresh. No production writes. No GhostFlow change.
- Decision recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-09-02 — GhostRegime R7 allocation study preregistered before outcomes**.

**R7B1 is complete.** Next substantive work is **R7C — first eligible real frozen-panel study run, pending separate authorization**. R7C does **not** authorize a production allocation change. **R7D remains the product/model decision gate.** Do not reopen R7A / R7A.1 / R7B0 / R7B1 without real evidence of a defect. Do not alter the preregistered contract after viewing outcomes.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R7C — designated first real frozen-panel study run; separately gated** (does **not** authorize live allocation changes)
2. **R7D — product/model decision gate** after R7C evidence (not authorized by R7C)
3. Do **not** reopen R7A / R7A.1 / R7B0 / R7B1 unless new evidence shows a real defect
4. Do **not** change the preregistered contract, holdout, P0–P6 family, or costs after outcomes are viewed
5. Separate non-R7 backlog: **site-wide product-copy truth audit** (do not perform it here)
6. Do **not** change VAMS, allocation formulas, provider routing, workflows, P1/P2/P3, or R4
7. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R6 final closeout)
**R6 UI TRUTH COMPLETE — LIVE / VERIFIED**

R6 is finished: **R6A**, **R6B**, and **R6C** are all merged, deployed, and independently live-verified. Do not reopen R6A / R6B / R6C unless new evidence shows a real defect. Do not begin R7 in this docs PR. Do not perform the separate site-wide product-copy truth audit in this docs PR.

- **R6A — factual display correctness:** PR **#178** → `9eb143d5bdb58e3be2ade694efb4019b29a149eb`. Half vs off sleeve-brake truth; BTC half → +5% cash; Gold half → +15% cash; shared allocation formatting; primary-driver percentage units; Neutral display treatment; Exposure primary; Vs 60/30/10 secondary. No model change.
- **R6B — evidence / resolution separation:** PR **#180** → `ac76f49899e8e6aa57df5aa66cd0e1d6215de729`. Evidence receipts separate from procedural resolution; `risk_tiebreak` / `infl_tiebreak` excluded from evidence statistics; Coverage renamed Participation; Agreement / Participation / Confidence / Conviction / Crowded / Primary Driver / Top Drivers / Compare are evidence-only; separate **Resolved by…** provenance; persisted resolver receipts retained; final scores/axes unchanged. No model change.
- **R6C — educational / advice-like copy truth:** main PR **#182** → `cbf2b15ad79f022c1c47448c102e7fb4ad54c989`. Residual shared-component repair PR **#183** → `bac20952d43480e138de01586e2a296000d7bfdc` (current production serving build). Public vocabulary: Hold now → **Model mix**; Actionable read → **Model read**; What to do now → **How to use this**. Removed “should actually hold,” crash-avoidance / re-entry claims, sell-near-top / buy-near-bottom claims, and recommended rebalance cadence. Cash now became factual cash terminology. How It Works / glossary / share / copied output aligned. GrayGhost voice and educational usefulness retained. No model change.
- PR **#183** removed the last live full-variant Drawdown Reality Check claim (“That's why GhostRegime exists: not to be 'right' — to keep you from getting wrecked.”). Live replacement: “Large drawdowns can take years to recover from. That is why GhostRegime makes its exposure rules explicit instead of pretending it can call the exact top or bottom.”
- Display/copy-only across R6. Model remains `ghostregime-v1.0.4`. No `MODEL_VERSION` bump, no Blob namespace change, no persisted-row rewrite, no force refresh, no provider call.
- Serving UI/build is `bac20952d43480e138de01586e2a296000d7bfdc`. The persisted model row was **not** recomputed. `row_build_commit` remains `7e1bce227878e0901f4241a9c955e1d25bdeaf6b` (the R5B compute that created the v1.0.4 snapshot).
- Public `/api/ghostregime/today` after the final R6C residual deploy (HTTP 200): `date = 2026-09-01`, `regime = REFLATION`, `risk_regime = RISK ON`, `risk_score = +1`, `infl_score = +1`, `risk_axis = RiskOn`, `infl_axis = Inflation`, `engine_version` / `row_engine_version = ghostregime-v1.0.4`, `build_commit = bac20952…`, `row_build_commit = 7e1bce227…`, `data_source = persisted`. Serve metadata: `refresh_attempt = read`, `refresh_outcome = served_persisted_snapshot`, `persisted_snapshot_preserved = true`.
- Live fixture unchanged: allocation **60 / 15 / 5 + 20 cash**; scales Stocks **1.0** / Gold **0.5** / BTC **0.5**. Risk: Agreement **1/2**, Participation **2/4**, Confidence **Low**, Conviction **0**, Evidence net **0/4**, **Resolved by SPY TR21 tie-break**, final score **+1**. Inflation: Agreement **2/4**, Participation **4/4**, Confidence **Medium**, Conviction **0**, Evidence net **0/4**, **Resolved by PDBC TR21 tie-break**, final score **+1**. Regime Conviction **0**; Primary Driver **Tie / both axes weak**.
- `/api/ghostregime/health` (HTTP 200): `ok true`, `status OK`, `latest_date 2026-09-01`, `age_days 1`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.4`, `build_commit = bac20952…`. No refresh was required or performed.
- Brief post-deploy observation only: after PR **#183**, the first server-rendered `/ghostregime` payload briefly carried prior serving-build metadata `cbf2b15…` while `/today` and `/health` already reported `bac20952…`. Visible model semantics were already correct and the persisted model row was unchanged. A subsequent request converged to `bac20952…`. Treat as observed server-rendered cache / revalidation behavior. Not model staleness, not data loss, not a resolved bug, and not a reason to refresh. No code fix is authorized by this docs PR.
- Future **non-R6** cleanup (not started): **Site-wide product-copy truth audit**. R6 live verification observed older product-positioning / efficacy language outside the tightly scoped GhostRegime R6 surfaces (homepage examples include capture-upside / limit-downside, catching most of a bull market, and broader drawdown-protection framing). This is not a GhostRegime model defect. Do not rewrite Builder or other module copy here. Preserve educational usefulness and GrayGhost voice. Separate future product/copy workstream.
- R4, P1/P2/P3, VAMS, allocation formulas, **60/30/10**, provider routing, workflows, and GhostFlow unchanged by R6.

**R6 is complete.** Next substantive GhostRegime work is **R7 — allocation research harness**. R7 does **not** automatically authorize allocation changes. Preserve **60 / 30 / 10** until research evidence and an explicit product/model decision support a change. Do **not** start R7 in this docs PR.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-09-02 — GhostRegime R6 product gate: GO WITH CHANGES — Option B**. This checkpoint records completion evidence, not a new product decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R7 — allocation research harness** (research only; **not** authorized to change live allocations or **60/30/10**)
2. Do **not** reopen R6A / R6B / R6C unless new evidence shows a real defect
3. Separate non-R6 backlog: **site-wide product-copy truth audit** (do not perform it here)
4. Do **not** change VAMS, allocation formulas, provider routing, workflows, P1/P2/P3, or R4
5. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R6B live closeout)
R6B merge: PR **#180** (`fix(ghostregime): separate evidence from tie resolution`, reviewed head `8eaeb966eae5765d9005acfcb5a1cda96d4ec76f`) → `ac76f49899e8e6aa57df5aa66cd0e1d6215de729` (`main`, merged 2026-09-02). Production Vercel deployment was verified READY on that exact merge commit (`target = production`). No manual deployment.

**R6B COMPLETE — MERGED / DEPLOYED / LIVE-VERIFIED**

- Display-only. Model remains `ghostregime-v1.0.4`. No `MODEL_VERSION` bump, no Blob namespace change, no persisted-row rewrite, no force refresh, no provider call.
- Serving UI/build is `ac76f498…`. The persisted model row was **not** recomputed. `row_build_commit` remains `7e1bce227878e0901f4241a9c955e1d25bdeaf6b` (the R5B compute that created the v1.0.4 snapshot). R6B reinterprets existing receipts at display time only.
- Public `/api/ghostregime/today` after deploy (HTTP 200): `date = 2026-09-01`, `regime = REFLATION`, `risk_regime = RISK ON`, `risk_score = +1`, `infl_score = +1`, `risk_axis = RiskOn`, `infl_axis = Inflation`, `engine_version` / `row_engine_version = ghostregime-v1.0.4`, `build_commit = ac76f498…`, `row_build_commit = 7e1bce227…`, `data_source = persisted`. Serve metadata: `refresh_attempt = read`, `refresh_outcome = served_persisted_snapshot`, `persisted_snapshot_preserved = true`.
- Live evidence / resolution split on that persisted row. Risk receipts remain `spy 0`, `hyg_ief +1`, `vix 0`, `eem_spy -1`, `risk_tiebreak +1`. Evidence-only UI: Agreement **1/2 (50%)**, Participation **2/4**, Confidence **Low**, Conviction **0**, Evidence net **0/4 (Neutral)**, **Resolved by SPY TR21 tie-break**. Final `risk_score` remains **+1**.
- Inflation receipts remain `pdbc +1`, `tip_ief -1`, `tlt +1`, `uup -1`, `infl_tiebreak +1`. Evidence-only UI: Agreement **2/4 (50%)**, Participation **4/4**, Confidence **Medium**, Conviction **0**, Evidence net **0/4 (Neutral)**, **Resolved by PDBC TR21 tie-break**. Final `infl_score` remains **+1**.
- Regime-level live proof: REFLATION / RISK ON / Inflation; Regime Confidence **Low**; Regime Conviction **0**; Primary driver **Tie** (`Tie: both axes weak`); Crowded **false**. No model classification changed.
- Top Drivers are evidence-only: Risk shows EM vs US → Risk Off (−1) and Credit vs Treasuries → Risk On (+1); Inflation shows Commodities → Inflation (+1) and TIP/IEF ratio → Disinflation (−1). Neither `risk_tiebreak` nor `infl_tiebreak` is a Top Driver. Public footnote: “Biggest evidence votes today. Tie-break resolution is shown separately when used.” Nerd Mode / persisted API provenance remains intact; tie-break receipts were not deleted.
- Participation is non-neutral evidence receipts / present evidence receipts. Tie-breaks are excluded. Public legend: “Tie-breaks are resolution, not evidence.” Participation is not Availability; no expected-feed denominator was invented.
- Inflation Confidence **Medium** is the correct `>= 0.65` bucket for `0.7 × 0.50 + 0.3 × 1.00 = 0.65`. No threshold retuning. The original R6 audit replay classified many exact-boundary cases Low because binary float produced ~`0.649999…`. R6B uses numerically stable evaluation of the same 70/30 formula. Resulting T0 → T2 confidence-label changes: Infl **2**, Risk **7**, Overall **9**; Compare kind changes **213** (original audit 142 / 252 / 349 confidence and 220 compare). The gap is the repaired 0.65 numeric boundary, not threshold optimization.
- Replay (2017-08-03 through 2026-08-28, n = 2,280; no market-data refresh): Infl Participation 123; Risk Participation 238; Infl Agreement 263; Risk Agreement 483; Infl Conviction 263; Risk Conviction 483; Overall Regime Conviction 679; Infl Top Drivers 263; Risk Top Drivers 223; Primary Driver label/why 211 / 211; Crowded 0; no-tie-break parity mismatches 0; model-field differences 0.
- `/api/ghostregime/health` (HTTP 200): `ok true`, `status OK`, `latest_date 2026-09-01`, `age_days 1`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.4`, `build_commit = ac76f498…`. No refresh was required or performed.
- Brief post-deploy observation only: public `/today` and `/health` already reported serving build `ac76f498…`, while the first server-rendered `/ghostregime` payload briefly embedded prior serving-build metadata `9eb143d5…`. Visible R6B semantics were already correct and the persisted model row was unchanged. The page server fetch uses `next: { revalidate: 60 }`; a later request after revalidation embedded `ac76f498…`. Treat as brief server-rendered data-cache / stale-while-revalidate behavior. Not model staleness, not data loss, not a permanent fix, and not a code change in this docs PR.
- **R6C copy intentionally unchanged** (Hold now / Actionable read / What to do now / “what you should actually hold” / contribution-rebalance guidance / train-wreck wording remain).
- R4, P1/P2/P3, VAMS, allocation formulas, 60/30/10, provider routing, workflows, and GhostFlow unchanged by R6B.

**R6B is complete.** Next is **R6C — educational / advice-like copy cleanup**. R6C implementation is **still separately gated** and must **not** begin in this docs PR.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-09-02 — GhostRegime R6 product gate: GO WITH CHANGES — Option B**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R6C — educational / advice-like copy cleanup** (implementation is **separately gated** and is **not** authorized by this closeout)
2. Do **not** change R6A/R6B display-truth or evidence/resolution semantics
3. Do **not** change VAMS, allocation formulas, or **60/30/10**
4. Do **not** change provider routing, workflows, P1/P2/P3, or R4
5. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R6A live closeout)
R6A merge: PR **#178** (`fix(ghostregime): make R6A display semantics truthful`, reviewed final head `45becfdb7746a64dcd79649979085b9bed3b4ce4`) → `9eb143d5bdb58e3be2ade694efb4019b29a149eb` (`main`, merged 2026-09-02). Production Vercel deployment was verified READY on that exact merge commit (`target = production`). No manual deployment.

**R6A COMPLETE — MERGED / DEPLOYED / LIVE-VERIFIED**

- Display-only. Model remains `ghostregime-v1.0.4`. No `MODEL_VERSION` bump, no Blob namespace change, no persisted-row rewrite, no force refresh, no provider call.
- Serving UI/build is `9eb143d5…`. The persisted model row was **not** recomputed. `row_build_commit` remains `7e1bce227878e0901f4241a9c955e1d25bdeaf6b` (the R5B compute that created the v1.0.4 snapshot). Do not imply R6A recomputed the model.
- Public `/api/ghostregime/today` after deploy (HTTP 200): `date = 2026-09-01`, `regime = REFLATION`, `risk_regime = RISK ON`, `engine_version` / `row_engine_version = ghostregime-v1.0.4`, `build_commit = 9eb143d5…`, `row_build_commit = 7e1bce227…`, `data_source = persisted`. Serve metadata: `refresh_attempt = read`, `refresh_outcome = served_persisted_snapshot`, `persisted_snapshot_preserved = true`.
- Allocations / VAMS unchanged on that row: targets 60/30/10; scales 1.0 / 0.5 / 0.5; actuals 60/15/5 + 20 cash.
- Independently inspected rendered production HTML at `/ghostregime`. Live R6A proof: sleeve brake **Stocks full / Gold half / BTC half**; Actionable Read throttle pill **BTC half → +5% cash • Gold half → +15% cash** (the prior false `BTC off → +5% cash` is gone); allocation card default **Exposure** (Stocks 60%, Gold 15%, Bitcoin 5%, Cash 20%) with Gold and Bitcoin still identified as half size; secondary toggle **Vs 60/30/10**; displayed mix remains coherent **60/15/5 + 20 cash**.
- R6A live for: (1) sleeve brake-state truth — half is not off; (2) shared one-decimal-only-when-needed allocation formatting; (3) primary-driver agreement thresholds 75 / 50 on the 0–100 scale (latent correctness; current row unchanged); (4) vote=0 user display Neutral where direction is rendered — persisted `direction` not rewritten; (5) Exposure primary, Vs 60/30/10 secondary full-risk comparison.
- `/api/ghostregime/health` (HTTP 200): `ok true`, `status OK`, `latest_date 2026-09-01`, `age_days 1`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.4`, `build_commit = 9eb143d5…`. No refresh was required or performed.
- **R6B semantics intentionally unchanged** on this live row: Risk Agreement 2/3, Coverage 3/5, Confidence Low, Conviction 20; Inflation Agreement 3/5, Coverage 5/5, Confidence Medium, Conviction 20; Inflation Top Drivers still includes Inflation tie-breaker (PDBC TR21). That is expected pre-R6B behavior, not a new R6A defect.
- **R6C copy intentionally unchanged** (Hold now / Actionable read / What to do now remain).
- R4, P1/P2/P3, VAMS, allocation formulas, 60/30/10, provider routing, workflows, and GhostFlow unchanged by R6A.

**R6A is complete.** Next is **R6B — evidence / resolution separation**. R6B implementation is **still separately gated** and must **not** begin in this docs PR.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-09-02 — GhostRegime R6 product gate: GO WITH CHANGES — Option B**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R6B — evidence / resolution separation** (implementation is **separately gated** and is **not** authorized by this closeout)
2. Do **not** start R6C copy work
3. Do **not** change VAMS, allocation formulas, or **60/30/10**
4. Do **not** change provider routing, workflows, P1/P2/P3, or R4
5. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R5B live closeout)
R5B merge: PR **#176** (`feat(ghostregime): remove duplicate PDBC TR21 satellite`, reviewed head `9107a6e68adf0ef2c91f7540cf7f2db6cdb075f7`) → `7e1bce227878e0901f4241a9c955e1d25bdeaf6b` (`main`, merged 2026-09-02). Production deployment was verified READY on that exact merge commit.

**R5B COMPLETE — MERGED / DEPLOYED / v1.0.4 SEEDED / HEALTHY**

- Effective model is `ghostregime-v1.0.4`. The existing `MODEL_VERSION/` Blob prefix created a new, initially empty namespace. `BLOB_KEYS` and the persistence mechanism were unchanged. No historical rewrite and no copy from v1.0.3 into v1.0.4.
- Immediately after deploy and **before** the controlled refresh, public endpoints were fail-closed as expected: `/today` HTTP 503 `GHOSTREGIME_NOT_READY` / `NO_PERSISTED_SNAPSHOT`; `/health` HTTP 503 `ok false` / `NOT_READY` with `engine_version = ghostregime-v1.0.4` and `build_commit = 7e1bce227…`. That is not a failure and not data loss.
- The effective production engine was already `ghostregime-v1.0.4` before seeding, so no stale Vercel `NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION` override was masking the repository default.
- One controlled first refresh: GitHub Actions run [33652482469](https://github.com/firemansghost/ghost-allocator/actions/runs/33652482469) (`GhostRegime Daily Refresh` #232, `workflow_dispatch`, head `7e1bce227…`, success). `force_refresh = true`, request mode `manual_force`, query `force=1`. Serve metadata: `run_date_utc = 2026-09-02`, `latest_snapshot_date = 2026-09-01`, `market_snapshot_lag_days = 1`, `refresh_attempt = force`, `refresh_outcome = computed_and_persisted`, `persisted_snapshot_preserved = false`. Compute-path `data_source = computed_forced`. No second force refresh.
- Persisted v1.0.4 row: `date = 2026-09-01`, `run_date_utc = 2026-09-02`, `regime = REFLATION`, `risk_regime = RISK ON`, `risk_score = +1`, `infl_core_score = 0`, `infl_sat_score = 0`, `infl_total_score_pre_tiebreak = 0`, `infl_tiebreaker_used = true`, `infl_score = +1`, `infl_axis = Inflation`. Live proof: P2 contributes zero, core ties at zero, P3 resolves to +1.
- **P1 retained:** receipt `pdbc` / `Commodities` / vote `+1` Inflation / `>= 0.02 (Inflation)`.
- **P2 removed from active scoring:** `infl_sat_score = 0`; no `satellite_commodity_nowcast_basket_(energy+metals)` receipt; no PDBC TR21 Commodity satellite contribution. The satellite framework remains; only the Commodity lane is not production-scored.
- **P3 used and truthful:** receipt `infl_tiebreak` / `Inflation tie-breaker (PDBC TR21)` / vote `+1` Inflation / `Tie-breaker applied; source: PDBC TR21; rule: GTE_ZERO`. P3 is the zero-score inflation tie-break, not a satellite.
- Persistence: `row_computed_at_utc = 2026-09-02T16:03:18Z`, `row_build_commit = 7e1bce227…`, `row_engine_version = ghostregime-v1.0.4`. Public serve: `engine_version = ghostregime-v1.0.4`, `build_commit = 7e1bce227…`, `data_source = persisted`.
- Allocations / VAMS unchanged: stocks 0.60 / gold 0.30 / BTC 0.10 targets; scales 1 / 0.5 / 0.5; actuals 0.60 / 0.15 / 0.05; cash 0.20; VAMS states 2 / 0 / 0. **60/30/10** remains frozen.
- Flip Watch `NONE` on the first v1.0.4 row is expected (no prior unique v1.0.4 persisted trading snapshot). Not an R4 logic change.
- R5B did **not** change provider routing. Stooq browser challenge; all eight core ETFs routed to Yahoo (`yahoo:<symbol>`). Verified: `stooq_browser_challenge_detected = true`, `yahoo_etf_fallback_used = true`, `marketstack_used = false`.
- Workflow immediate health check succeeded (latest `2026-09-01`, age 1 day) and did **not** emit the prior R5A post-write `WARN LATEST_ROW_OLD`. Do not conclude that wrinkle is permanently fixed; record only that this controlled rollout's immediate health check was clean.
- Independently verified `/api/ghostregime/today` (HTTP 200): `date = 2026-09-01`, `regime = REFLATION`, `risk_regime = RISK ON`, `data_source = persisted`, `row_engine_version` / `engine_version = ghostregime-v1.0.4`, `row_build_commit` / `build_commit = 7e1bce227…`.
- `/api/ghostregime/health` (HTTP 200): `ok true`, `status OK`, `latest_date 2026-09-01`, `age_days 1`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.4`, `build_commit = 7e1bce227…`.
- R4, R6 formulas, VAMS, allocation formulas, 60/30/10, provider routing, workflows, and GhostFlow unchanged by R5B.

**R5 is complete.** Next is **R6 — UI truth PRODUCT GATE / READ-ONLY AUDIT FIRST**. R6 implementation is **NOT authorized**.

Known R6 items for audit only (do not fix here): prescriptive “Hold now” language; confusing `% of Max`; rounded headline can show 101%; BTC half-scale can read as “off”; Coverage measures non-neutral receipts rather than source availability; vote=0 receipt direction is shown as a side rather than Neutral; confidence/conviction/crowding/primary-driver depend on receipt structure; P3 ordinary receipts changed denominators by design in R5B and must be interpreted correctly before any UI change.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-08-31 — GhostRegime R5B removes duplicate PDBC TR21 satellite role**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R6 — UI truth: READ-ONLY PRODUCT AUDIT / DECISION GATE** (implementation is **NOT authorized**)
2. Do **not** change VAMS, allocation formulas, or **60/30/10**
3. Do **not** change provider routing, workflows, P1/P2/P3, or R4
4. GhostFlow remains a separate workstream

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-09-02 R5A live closeout)
R5A merge: PR **#174** (`fix(ghostregime): contain satellite fallback provenance`, reviewed head `76422e861000fc6c568607ac5245a9af82256aa7`) → `f03c20b6707f61f7af842c28ecb01afb6f29a785` (`main`, merged 2026-08-31). Production deployment was verified READY on that exact merge commit.

**R5A COMPLETE — MERGED / DEPLOYED / NATURAL SCHEDULED COMPUTE VERIFIED**

- Model remains `ghostregime-v1.0.3`. No `MODEL_VERSION` bump, no new Blob namespace, no historical Blob rewrite.
- No forced refresh was used to obtain the final R5A production proof.
- September 1 scheduled run [33488935024](https://github.com/firemansghost/ghost-allocator/actions/runs/33488935024) succeeded, but no market compute occurred because the persisted `2026-08-28` snapshot was still inside the freshness window: `refresh_attempt = scheduled`, `refresh_outcome = scheduled_served_persisted_no_fetch`, `persisted_snapshot_preserved = true`, `latest_snapshot_date = 2026-08-28`, `market_snapshot_lag_days = 4`. That proved the post-R5A scheduled no-fetch path. It is **not** the final R5A compute proof.
- September 2 scheduled run [33606515025](https://github.com/firemansghost/ghost-allocator/actions/runs/33606515025) (`schedule`, head `f03c20b…`, success) was the first genuine natural post-R5A recompute: `refresh_attempt = scheduled`, `refresh_outcome = scheduled_recomputed_and_persisted`, `persisted_snapshot_preserved = false`, `market_snapshot_lag_days = 1`. Compute-path `data_source = computed`.
- Persisted row: `date = 2026-09-01`, `run_date_utc = 2026-09-02`, `regime = REFLATION`, `risk_regime = RISK ON`, `risk_score = +1`, `infl_core_score = 0`, `infl_sat_score = +1`, `infl_score = +1`, `row_build_commit = f03c20b…`, `row_engine_version = ghostregime-v1.0.3`.
- R5A provenance on that new compute: receipt key remains `satellite_commodity_nowcast_basket_(energy+metals)`; display label `Commodity proxy (PDBC TR21)`; vote `+1` Inflation; note includes `source: PDBC TR21`. This remains a PDBC TR21 proxy under v1.0.3, not an independent Commodity feed.
- No Freight receipt was sourced from Commodity/PDBC. The invalid Freight → Commodity alias did not appear. Fallback containment survived real production computation.
- R5A did **not** change provider routing. The September 2 compute hit a Stooq browser challenge; all eight core ETFs (SPY, GLD, HYG, IEF, EEM, TIP, TLT, UUP) routed to Yahoo. Verified: `stooq_browser_challenge_detected = true`, `yahoo_etf_fallback_used = true`, `marketstack_used = false`.
- Immediate post-write workflow health step briefly read the prior `2026-08-28` snapshot and emitted `WARN LATEST_ROW_OLD` (`age_days = 5`, `max_age_days = 4`). Production endpoints later resolved to the newly persisted `2026-09-01` row and were independently verified healthy. Characterize as an observed post-write/read timing or consistency wrinkle — **not** a production failure. No fix is authorized here.
- Independently verified `/api/ghostregime/today` (HTTP 200): `date = 2026-09-01`, `regime = REFLATION`, `risk_regime = RISK ON`, `data_source = persisted`, `row_build_commit` / `build_commit = f03c20b…`, `row_engine_version` / `engine_version = ghostregime-v1.0.3`.
- `/api/ghostregime/health` (HTTP 200): `ok true`, `status OK`, `latest_date 2026-09-01`, `age_days 1`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.3`, `build_commit = f03c20b…`.
- Allocations, VAMS, provider routing, workflows, GhostFlow, and **60/30/10** unchanged by R5A.

**R5B AUTHORIZED / IMPLEMENTED LOCALLY — not pushed, no PR, not deployed.** Do not describe R5B as live.

Bobby explicitly authorized R5B. Local branch `model/ghostregime-r5b-remove-p2`, commit `75be5228c7fe60d255ecb05afb5ec57b7c080177`.

Authorized contract: P1 PDBC TR63 core remains; P2 PDBC TR21 Commodity satellite removed from active scoring; P3 PDBC TR21 tie-break retained with ordinary `infl_tiebreak` provenance; target repository `MODEL_VERSION = ghostregime-v1.0.4` (new Blob namespace when deployed). R4, R6 formulas, VAMS, allocation formulas, 60/30/10, provider routing, workflows, and GhostFlow unchanged. The R5B model decision is recorded on that local branch and will arrive with the coherent model PR.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-08-31 — GhostRegime R5A satellite correctness/provenance containment authorized**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. Merge this R5A closeout docs PR
2. Update/rebase the local R5B branch onto the new main
3. Rerun R5B validation
4. Push / open the R5B PR for review
5. Do **not** deploy `ghostregime-v1.0.4` until PR review and an explicit rollout step (new empty namespace requires a controlled first refresh after deployment)
6. R6 is **not** authorized
7. Do **not** change 60/30/10 or VAMS formulas/thresholds
8. Future operational observation only (no fix authorized): post-write `/health` briefly reading the prior snapshot (`WARN LATEST_ROW_OLD` on the September 2 workflow)

Last updated: 2026-09-02

---

## Current State (GhostRegime — 2026-08-31 R5A satellite containment)
**R5A AUTHORIZED / IMPLEMENTED LOCALLY — PR review pending.** Not live.

Bobby explicitly authorized R5A only: behavior-neutral satellite correctness / provenance containment. R5B is **NOT authorized**.

- Invalid semantic fallbacks are rejected. Freight cannot inherit Commodity/PDBC. Truflation cannot acquire Commodity by a typo-only alias.
- Commodity runtime provenance is PDBC TR21. New receipts must not present a fetched independent Energy+Metals basket. Historical Blob rows are not rewritten.
- PDBC-derived Commodity calculation is as-of safe.
- Model remains `ghostregime-v1.0.3`. No model-version bump, no new Blob namespace, no forced refresh, no new satellite sources.
- Score / regime / allocation parity vs pre-R5A S0 is required on the reconstructed 2,280-date window before this is treated as merge-ready.
- Next after R5A is review / deploy / verify R5A — **not** automatic R5B implementation.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-08-31 — GhostRegime R5A satellite correctness/provenance containment authorized**.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. Review / deploy / verify R5A (not live until that happens)
2. **R5B — Commodity/PDBC model decision remains NOT authorized**
3. Do **not** begin R6 unless Bobby expands scope
4. Do **not** change 60/30/10 or VAMS formulas/thresholds
5. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-31

---

## Current State (GhostRegime — 2026-08-31 R4 Flip Watch live)
R4 merge: PR **#172** → `80a09a7ef52f686d086697641da447737c3f6580` (`main`). Production deployment was verified on that exact merge commit.

**R4 OPTION A LIVE — Flip Watch is truthful transition telemetry**

- Production: READY, target production, commit `80a09a7…`.
- Model remains `ghostregime-v1.0.3`. No model-version bump and no new Blob namespace.
- Existing persisted row was intentionally preserved. R4 did not force-recompute or rewrite the current snapshot.
- Independently verified `/today` (HTTP 200): `regime = INFLATION`, `data_source = persisted`, `engine_version = ghostregime-v1.0.3`, `build_commit = 80a09a7…`.
- Persisted-row provenance: `date = 2026-08-28`, `row_build_commit = c19ccdc…` (prior valid R3 snapshot), `row_engine_version = ghostregime-v1.0.3`, `flip_watch_status = NONE`.
- `/health`: HTTP 200, `ok true`, `status OK`, `latest_date 2026-08-28`, `age_days 3`, `max_age_days 4`, `is_fresh true`, `engine_version ghostregime-v1.0.3`, `build_commit 80a09a7…`.
- Live methodology verified: Flip Watch is transition telemetry versus the prior unique persisted trading snapshot; it does not delay the regime or allocations. Strong transition is `max(|risk score|, |inflation score|) >= 2`; the new regime and allocations are already active.
- No forced refresh. The next ordinary scheduled compute will produce the first post-R4 Flip Watch telemetry status if a regime transition exists.
- Allocations, VAMS, satellites, providers, and **60/30/10** unchanged.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-08-31 — GhostRegime Flip Watch remains telemetry (R4 Option A)**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R5 — satellite cleanup forensic audit** (read-only). **R5 implementation is NOT authorized.**
2. Do **not** begin R5 implementation or R6 unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-31

---

## Current State (GhostRegime — 2026-08-31 R4 Flip Watch telemetry truth)
R4 baseline: `5dc578eddccaf6ab060eb470ba50c39a6ec27ced` (`main` after PR **#171**). Bobby **explicitly authorized R4 Option A**.

**AUTHORIZED / IMPLEMENTED LOCALLY — PR review pending**

- Flip Watch is transition telemetry. It does not delay, gate, hold, or alter regime, risk regime, allocation targets, VAMS, actual sleeve weights, cash, or persistence.
- New compute emits `NONE` / `REGIME_CHANGE` / `STRONG_FLIP`. Legacy `BREWING` / `PENDING_CONFIRMATION` remain readable.
- Prior unique persisted trading snapshot drives comparison. Wall-clock confirmation arithmetic is gone. `shouldApplyFlip()` / `CONFIRMATION_DAYS` / `daysPending` removed as dead gate logic.
- No model-version bump: still `ghostregime-v1.0.3`. No allocation, VAMS, satellite, provider, or 60/30/10 changes.
- Canonical suite includes `r4FlipWatch.test.ts` as a stable invariant.
- Not live. Do not claim production until merge/deployment.

Decision: [DECISIONS.md](./DECISIONS.md) entry **2026-08-31 — GhostRegime Flip Watch remains telemetry (R4 Option A)**.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R4 PR review / merge** (this branch is local-only until pushed)
2. **R5 — satellite cleanup** is next after R4, but **R5 is NOT authorized**
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-31

---

## Current State (GhostRegime — 2026-08-31 R3 C1 live rollout)
R3 merge: PR **#170** → `c19ccdcad4934d635fd39dc3d8b2708dc0e03ce0` (`main`). Production deployment was verified on that exact merge commit.

**R3 C1 LIVE — merged, deployed, persisted, and healthy**

- Repository / effective model version: `ghostregime-v1.0.3`.
- Stale Vercel override `NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION = ghostregime-v1` was removed; production was redeployed afterward.
- Blob keys are prefixed with `MODEL_VERSION`. The new `ghostregime-v1.0.3` namespace initially had no latest (temporary `/today` and `/health` NOT_READY). That is expected namespacing, not data loss. The old `ghostregime-v1` namespace was **not** deleted. No historical backfill.
- Authorized force refresh: GitHub Actions run [33393949114](https://github.com/firemansghost/ghost-allocator/actions/runs/33393949114) (`workflow_dispatch`, `main`, `head_sha = c19ccdc…`, `force=1`, success).
- Refresh: `date 2026-08-28`, `regime INFLATION`, `refresh_outcome computed_and_persisted`, `data_source computed_forced`.
- Independently verified persisted `/today` (HTTP 200): `row_engine_version = ghostregime-v1.0.3`, `engine_version = ghostregime-v1.0.3`, `row_build_commit` / `build_commit = c19ccdc…`, `data_source = persisted`, `regime = INFLATION`, `risk_regime = RISK OFF`, `risk_score = -1`, `infl_core_score = 0`, `infl_sat_score = +1`, `infl_score = +1`.
- Live C1 receipts: PDBC +1 Inflation; TIP/IEF −1 Disinflation; TLT +1 Inflation; UUP −1 Disinflation; satellite +1 Inflation. Matches the R0 live-like C1 expectation; final August 28 regime remains INFLATION.
- `/health`: `ok true`, `status OK`, `engine_version ghostregime-v1.0.3`, `latest_date 2026-08-28`, `age_days 3`, `max_age_days 4`, `is_fresh true`.
- Providers: Stooq browser challenge; Yahoo fallback for all eight core ETFs; Marketstack **not** used.
- Observation only (R4, not this closeout): new namespace currently reports `flip_watch_status = NONE`. Do not reinterpret; Flip Watch belongs to R4.
- Allocations, VAMS, satellites, risk logic, and **60/30/10** unchanged.

Decision already recorded: [DECISIONS.md](./DECISIONS.md) entry **2026-08-30 — GhostRegime inflation vote sign convention (R3 C1)**. This checkpoint records rollout facts, not a new decision.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R4 — Flip Watch product gate** (product/model decision, not coding). **R4 is NOT yet authorized for implementation.**
2. Do **not** begin R4–R8 unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-31

---

## Current State (GhostRegime — 2026-08-30 R3 C1 inflation semantics)
R3 baseline: `b8b1bf6d71f5f661a91403560b728222916e9b0e` (`main` after PR **#169**). Bobby **explicitly authorized R3 C1**. Implementation PR: **#170**.

**R3 implementation complete — rollout pending**

- C1 TLT/UUP numeric signs are implemented and validated. PDBC/TIP unchanged. Inflation core convention: **+1 = inflationary**, **−1 = disinflationary**.
- TLT/UUP economic labels and thresholds unchanged (TLT/UUP ±1%; PDBC ±2%; TIP/IEF ±0.5%).
- Satellites, Flip Watch, VAMS, allocations, 60/30/10, provider routing, and R2 read/compute separation unchanged.
- Repository default `MODEL_VERSION` is `ghostregime-v1.0.3`. Production activation is **not** claimed.
- As of the PR **#170** review, live public `/api/ghostregime/today` reported `engine_version = ghostregime-v1` and `row_engine_version = ghostregime-v1`. That is an effective stale override older than the R3 repository default; the exact Vercel env value was not read from a file.
- Production currently requires: (1) deploy merged R3; (2) verify effective `MODEL_VERSION`; (3) correct or remove the stale `NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION` override if necessary; (4) one authenticated force refresh; (5) persisted / public `/today` / `/health` verification.
- No historical backfill, seed rewrite, or persisted-receipt rewrite.
- Canonical suite: **29 files** passed (`r3InflationSemantics.characterization.test.ts` renamed to `r3InflationSemantics.test.ts`).
- Next phase is **R4**, but R4 remains **separately gated**. This work does **not** authorize R4. **60/30/10** still frozen.

Decision: [DECISIONS.md](./DECISIONS.md) entry **2026-08-30 — GhostRegime inflation vote sign convention (R3 C1)**.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R3 controlled rollout** (do not begin R4)
2. Do **not** begin R4–R8 unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-30

---

## Current State (GhostRegime — 2026-08-30 R2 operational containment)
R2 baseline: `49c622cbf81d86357d80b2ec25cfb97d66db71e9` (`main` after PR **#168**). Narrow operations fix only.

**R2 complete — public read persisted-only; debug authenticated; no error-path second fetch**

- Ordinary public `/api/ghostregime/today` serves persisted latest with **zero** `getHistoricalPrices()` calls. Missing latest → `503 GHOSTREGIME_NOT_READY` / `NO_PERSISTED_SNAPSHOT`, still no fetch.
- `debug=1` now requires the existing GhostRegime cron secret (same header/query as force/scheduled). Anonymous debug is 401 before the engine.
- Outer engine catch reuses first-attempt diagnostics; orchestration-level fetch count on a failed compute is **1**, not 2.
- Marketstack guard and Stooq → Yahoo → Marketstack routing are unchanged.
- Canonical suite: **29 files** (`r2OperationalContainment.test.ts` auto-discovered).
- Next work: **R3 — inflation semantics, explicit product gate**. R2 completion does **not** authorize R3. R4/R5/R6 untouched. **60/30/10** still frozen.

Decision: [DECISIONS.md](./DECISIONS.md) entry **2026-08-30 — GhostRegime read/compute separation (R2)**.

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R3** — inflation semantics product gate (do not implement until Bobby authorizes)
2. Do **not** begin R4–R8 unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-30

---

## Current State (GhostRegime — 2026-08-30 R1 test foundation)
R1 baseline: `0d8f4c90126ee8185da770f103c9a658c63d7ad4` (`main` after PR **#167**). Tests and test infrastructure only. No production GhostRegime formulas, providers, APIs, UI, VAMS, or allocations changed.

**R1 complete — canonical suite is `npm run test:ghostregime`**

- Runner: `scripts/ghostregime/run-tests.ts` walks `lib/ghostregime/__tests__/` and `lib/ghostregime/parity/__tests__/` for `*.test.ts` (sorted; Windows-safe; no shell glob). **28 files** on this baseline.
- `npm test` = `test:ghostregime` then unchanged `test:ghostflow`.
- `verify:ghostregime` = build → lint → `test:ghostregime` (one authoritative test list).
- New tests: `r1Invariants.test.ts` (stable); `r3InflationSemantics.characterization.test.ts`; `r4FlipWatch.characterization.test.ts` (includes stress helper); `r5Satellites.characterization.test.ts`; `r6UiTruth.characterization.test.ts`.
- Exclusions: live/network/secret calls; public-GET / anonymous-debug / error-path fetch (R2, no clean seam); copy/legend static checks; opt-in `RUN_PARITY_TESTS=1` workbook rows.
- Next work: **R2 — operational containment**. R3/R4/R5 remain gated. **60/30/10** still frozen.

Canonical evidence: [R0_FORENSIC_AUDIT_2026-08-30.md](../ghostregime/R0_FORENSIC_AUDIT_2026-08-30.md). Test truth: [VALIDATION.md](../ghostregime/VALIDATION.md).

This workstream is independent of GhostFlow source monitoring below.

## Recommended next work (GhostRegime)
1. **R2** — operational containment (public-read fetch, debug protection, error-path double fetch)
2. Do **not** begin R3–R8 unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-30

---

## Current State (GhostRegime — 2026-08-30 R0 forensic complete)
R0 baseline: `019aa383d595c1f775885d1db270c985f8f993d5` (unchanged `main` after PR **#166**). No tracked GhostRegime code, tests, providers, workflows, or data were changed during R0.

**R0 complete — evidence recorded, roadmap unchanged**

Canonical record: [R0_FORENSIC_AUDIT_2026-08-30.md](../ghostregime/R0_FORENSIC_AUDIT_2026-08-30.md)

- Seed-era parity is **38.6%** (769 / 1,990). Seed-era C1 is **not** historical production impact. Post-cutover C0 regime match is **97.7%** (130 / 133), with a Yahoo/CBOE reconstruction caveat.
- Current-code C1 changes regime on **471 / 2,280** days (20.7%). **295 / 471** are target-equivalent GOLDILOCKS ↔ REFLATION; **176 / 471** change gold **15% ↔ 30%**. Not a performance backtest.
- Best production-adjacent evidence: **9 / 125** receipt dates change regime; **1** target-changing date (`2026-02-27`, DEFLATION → INFLATION, gold 30% → 15%). Live `2026-08-28` inflation axis stays `core 0 / sat +1 / final +1` under one-day C1.
- Commodity satellite influence is material (decides 166 reconstructed days; decided the live inflation axis). S1 was diagnostic only.
- Flip Watch is telemetry (`shouldApplyFlip()` unused; 12 / 13 PENDING rows already show the new regime/targets). F1 was not run. R4 remains an open product gate.
- Roadmap unchanged: R1 tests → R2 containment → gated R3–R6 → deferred R7–R8.
- Next work: **R1 — canonical GhostRegime test foundation**. Do not implement R3/R4/R5. Do not encode R2 desired behaviors as current passing invariants.
- Full-risk baseline **60/30/10** remains frozen.

This workstream is independent of GhostFlow source monitoring below. Do not mix GhostRegime remediation into GhostFlow PRs or the reverse.

## Recommended next work (GhostRegime)
1. **R1** — canonical complete `test:ghostregime` plus characterization foundation (see R0 §12)
2. Do **not** begin R2–R8 implementation in the R1 thread unless Bobby expands scope
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-30

---

## Current State (GhostRegime — 2026-08-30 audit checkpoint)
Starting `main` for this checkpoint: `519092ea1a7de384df4b74d833a8c937f6210f9a` (same SHA as the independently verified August 30 audit baseline). Production was READY and built from that commit. Persisted GhostRegime snapshot had been computed under `d9473b02a5eb28df313378dd800c3473200f74c8`; no GhostRegime code/workflow changes exist between that compute commit and current `main`.

**GhostRegime audit complete — IMPROVE IN PLACE**

Canonical record: [AUDIT_2026-08-30.md](../ghostregime/AUDIT_2026-08-30.md)

- Verdict: improve in place. Do **not** rebuild GhostRegime. Keep the four-regime concept, fail-closed posture, persisted-state architecture, provider fallbacks, and VAMS concept.
- Production / current `main` was healthy at audit time (observed 2026-08-28 snapshot: INFLATION, RISK OFF, health OK, not stale).
- Significant correctness, semantics, operations, UI-truth, and test-coverage findings are recorded. None authorize production changes yet.
- Roadmap approved: R0 forensic replay → R1 tests → R2 operational containment → gated R3–R6 → deferred R7–R8 allocation research.
- Immediate next substantive work: **R0 — read-only forensic model-impact audit**. No production GhostRegime changes yet.
- Full-risk baseline **60/30/10** is held constant. INFLATION gold 15% is existing policy, not reopened.
- Methodology/product gates remain explicit: no inflation-sign change before R0 review; no Flip Watch confirmation implementation without a separate decision; no satellite score expansion; no VAMS / regime-threshold / sleeve / Builder / GhostFlow mixing.

This workstream is independent of GhostFlow source monitoring below. Do not mix GhostRegime remediation into GhostFlow PRs or the reverse.

## Recommended next work (GhostRegime)
1. **R0** — read-only historical replay / characterization of inflation-sign semantics and related interactions (see audit)
2. Do **not** correct TLT/UUP signs, Flip Watch, satellites, providers, UI, or allocations before R0 is reviewed
3. Do **not** change 60/30/10 or VAMS formulas/thresholds
4. GhostFlow ordinary source monitoring remains a separate workstream (below)

Last updated: 2026-08-30

---

## Current State (GhostFlow — 2026-08-30, first three-family receipt-backed refresh complete)
Starting `main` for this work: `c3310b489b7d145b67d5ca1bf842dd021f97c373` (includes PRs **#140–#164** merged).

**First full prospective receipt-backed production refresh — COMPLETE**

Phase 1 receipt workflow has now been exercised successfully on **all three** candidate-enabled artifact families. Each family was promoted in its **own** human-reviewed data + receipt PR:

| Family | PR | Production asOf | Source | Receipt |
|--------|----|-----------------|--------|---------|
| `treasuryLongEndIncomeLens` | **#162** | **2026-08-27** | Board H.15 | `data/ghostflow/promotion-receipts/treasuryLongEndIncomeLens/2026-08-27.48c8c7fedbd5.receipt.json` |
| `treasuryFuturesPositioningProxy` | **#163** | **2026-08-25** | CFTC TFF Treasury | `data/ghostflow/promotion-receipts/treasuryFuturesPositioningProxy/2026-08-25.afee7f54f0c3.receipt.json` |
| `systematicFlowProxy` | **#164** | **2026-08-25** | CFTC TFF equity | `data/ghostflow/promotion-receipts/systematicFlowProxy/2026-08-25.cc8cf20f742f.receipt.json` |

**Current three-family production:**
1. `treasuryLongEndIncomeLens` — Board H.15, `asOf` **2026-08-27**, receipt above
2. `treasuryFuturesPositioningProxy` — CFTC TFF Treasury, `asOf` **2026-08-25**, basket net % OI **-28.9**, direction **net_short**, receipt above
3. `systematicFlowProxy` — CFTC TFF equity, `asOf` **2026-08-25**, basket net % OI **-16.5**, Mapping-A display pressure **83**, receipt above

**CRITICAL score boundary:**
- Systematic Mapping-A **83** is **DISPLAY ONLY**
- Research Composite `systematicStrategyPressure` remains **MOCK 62**
- No score wiring; Systematic v1.0c remains blocked; Breadth / Gate C / VIX scoring remain blocked

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

**Proven production workflow (now exercised end-to-end with receipts):**
report-only source check → candidate generation → human inspection → exact candidate promotion dry-run → explicit `--apply` → production post-write verification → receipt dry-run → explicit receipt `--write` → validation → human-reviewed data + receipt PR → merge

**Receipt terminology (unchanged):**
- Promotion receipt = **verified transition evidence** after successful local `--apply`
- Receipt is **NOT** approval authority, automated acceptance, or score authorization
- Git merge remains the human acceptance boundary

**Same-date / revision boundary (unchanged — no new policy):**
- Same-date changed payload remains blocked
- `revision_review_required` remains blocked
- Prospective receipt history does **not** itself authorize same-date revision promotion
- A separate explicit product/policy decision is still required before any same-date revision mechanism may be implemented

**Automation boundary (unchanged):**
- Automated promotion / automatic candidate PR creation / automated receipt write / workflow-driven production mutation remain blocked
- Process remains human-gated; report-only source checking may remain read-only

## Recommended next work
1. **Ordinary source monitoring** — do **not** start another architecture project merely because this cycle completed
2. Wait for newer official source observations, then `npm run ghostflow:refresh-report`
3. If newer valid data exists: generate candidates → review individually → promote individually → write receipts → merge human-reviewed PRs
4. Do **not** manufacture updates; do **not** promote same-date changes
5. Same-date / `revision_review_required` promotion remains blocked
6. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
7. Systematic score wiring / v1.0c remains blocked
8. Breadth / Gate C remains blocked; do not wire VIX
9. Historical receipt backfill remains blocked

Last updated: 2026-08-30

---

## Archive — Phase 1 promotion receipts complete (2026-08-27)
Starting `main` for this work: `f04c456fe1ae48d9dc9b90ac232fc4e678cfd737` (includes PRs **#140–#160** merged).

**Phase 1 verified promotion receipts — IMPLEMENTED**
- PR **#158**: policy/design authorization (DECISIONS + [PROMOTION_RECEIPT_PHASE1_DESIGN.md](../ghostflow/PROMOTION_RECEIPT_PHASE1_DESIGN.md))
- PR **#159 / R1**: receipt v1 contract; deterministic receipt planner; post-apply equality reconciliation; mapper replay; prior/promoted fingerprints; receipt path safety; **no** filesystem writer
- PR **#160 / R2**: explicit receipt CLI; dry-run default; explicit `--write`; current production loaded from registry-owned destination; exclusive `wx` receipt creation; identical retry idempotent; differing existing receipt fails closed; post-write byte verification; receipt operation **never** writes production; `--apply` remains unchanged / single production write

Receipt command (dry-run default):
```text
npm run ghostflow:record-promotion-receipt -- --envelope <exact-path>
npm run ghostflow:record-promotion-receipt -- --envelope <exact-path> --write
```

**Terminology and boundaries:**
- Promotion receipt = **verified transition evidence** after successful local `--apply`
- Receipt itself is **NOT** approval; Git merge remains the human acceptance boundary
- Receipts are **prospective** — no automatic backfill of PRs **#152 / #154 / #156**
- No receipt JSON was added merely to complete the mechanism; first real receipt will accompany the next legitimate newer-date promotion

**Current operator workflow:**
candidate generation → human candidate inspection → promotion dry-run → explicit `--apply` → production post-write verification → receipt dry-run → explicit receipt `--write` → validation / git diff → human-reviewed PR containing production JSON + receipt → merge

**Three-family production baseline (pre–receipt-backed refresh):**
1. `treasuryLongEndIncomeLens` — Board H.15 SDMX, `asOf` **2026-08-25**, `verified_automated`
2. `treasuryFuturesPositioningProxy` — CFTC TFF, `asOf` **2026-08-18**, `verified_automated`
3. `systematicFlowProxy` — CFTC TFF equity, `asOf` **2026-08-18**, Mapping-A display **79**, Research Composite MOCK **62**

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Use the complete receipt path on the **next legitimate newer-date production promotion** — do **not** manufacture a promotion merely to create a receipt
2. Do **not** unlock same-date / `revision_review_required` merely because receipt infrastructure now exists (Phase 1 is prospective; current three production states lack historical receipts)
3. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth / Gate C remains blocked; do not wire VIX
6. Historical receipt backfill remains blocked

Last updated: 2026-08-27

---

## Archive — Phase 1 promotion receipt policy (2026-08-27)
Starting `main` for this work: `e4dc0e9f043bcdd3d8987ab4f135c2780a2a92d6` (includes PRs **#140–#157** merged).

**Selected next architecture milestone: Phase 1 verified promotion receipt**
- Policy + design authorized (DECISIONS + [PROMOTION_RECEIPT_PHASE1_DESIGN.md](../ghostflow/PROMOTION_RECEIPT_PHASE1_DESIGN.md))
- **Implementation not yet done** — no receipt JSON, no CLI, no runtime writer in this checkpoint
- Receipt is a **separate post-apply sidecar**, not approval authority
- Existing `--apply` remains **exactly one** registry-owned production artifact write
- Future receipt command is independently retryable (dry-run default; explicit `--write`)
- Prospective only — **no** historical backfill of PRs #152 / #154 / #156
- Same-date / `revision_review_required` promotion remains blocked
- Automatic promotion / candidate PRs / workflow automation remain blocked

**Three-family production baseline (unchanged):**
1. `treasuryLongEndIncomeLens` — Board H.15 SDMX, `asOf` 2026-08-25, `verified_automated`
2. `treasuryFuturesPositioningProxy` — CFTC TFF, `asOf` 2026-08-18, `verified_automated`
3. `systematicFlowProxy` — CFTC TFF equity, `asOf` 2026-08-18, Mapping-A display **79**, Research Composite MOCK **62**

Promotion pipeline at that checkpoint:
candidate generation → human inspection → exact-envelope dry-run → explicit `--apply` → (future) explicit receipt command → validation → human-reviewed PR → merge.

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Implement Phase 1 receipt mechanism per design (R1 types/builder/path safety, then R2 CLI/writer) — separate coding PR(s)
2. Same-date / `revision_review_required` promotion remains blocked
3. Automatic promotion / automatic candidate PR creation / workflow automation remain blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth / Gate C remains blocked; do not wire VIX
6. Do **not** automatically nominate another production artifact solely because receipts are designed

Last updated: 2026-08-27

---

## Archive — three-family promotion milestone (2026-08-27)
Starting `main` for this work: `fdcf74d6d1ba7d9b42c3d4d23049bb1856548d38` (includes PRs **#140–#156** merged).

**PR #156 merged — third actual GhostFlow production promotion (Systematic Flow Proxy):**
- Promoted reviewed `systematicFlowProxy` candidate for `asOf` **2026-08-18**
- Production Systematic artifact now:
  - CFTC PRE TFF Futures Only (`gpe5-46if`)
  - `dataQuality`: `verified_automated`
  - **no** fabricated `publishedAt`
  - ES / NQ / RTY remain the artifact basket contracts (`13874A`, `209742`, `239742`)
  - VIX remains context-only / `usedInScore: false` (`1170E1`)
  - `basketNetPctOi`: **-15.8**
  - Mapping-A `basketScore` / display pressure: **79**
- Systematic remains **DISPLAY ONLY / unscored**
- **Critical score boundary:** Research Composite still uses `systematicStrategyPressure = MOCK 62`
- No Systematic public passive input has been promoted

**Three completed automated production promotions (all current supported candidate families):**
1. `treasuryLongEndIncomeLens` (PR **#152**) — Board H.15 SDMX, `asOf` 2026-08-25, `verified_automated`
2. `treasuryFuturesPositioningProxy` (PR **#154**) — CFTC TFF Treasury, `asOf` 2026-08-18, `verified_automated`
3. `systematicFlowProxy` (PR **#156**) — CFTC TFF equity, `asOf` 2026-08-18, `verified_automated`, Mapping-A display **79** / Research Composite MOCK **62**

The promotion mechanism has now been exercised successfully across **all three** currently supported automated candidate families.

Each used: candidate generation → human inspection → exact-envelope dry-run → explicit `--apply` → validation → human-reviewed PR → merge.
Promotion writer remains human-triggered; no automatic promotion.

**PR #156 test-hardening (Systematic):**
- Production market values no longer pinned in Systematic display/artifact tests
- Candidate generator/writer “newer” tests are production-relative
- Promotion envelope/plan/writer “newer” tests are production-relative
- Same-date same-payload remains `no_change`
- Same-date changed-payload remains `revision_review_required`
- Promotion safety guards were not weakened

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
Do **not** automatically nominate another production artifact. Remaining items are separate product/policy gates:
1. Systematic score wiring / v1.0c remains blocked
2. Same-date / `revision_review_required` promotion policy remains blocked
3. Accepted-history / provenance receipts remain blocked
4. Automatic promotion remains blocked
5. Automatic candidate PR creation remains blocked
6. Workflow automation remains blocked
7. Breadth / Gate C remains blocked; do not wire VIX

Current promotion pipeline remains:
candidate generation → human inspection → exact-envelope dry-run → explicit `--apply` → validation → human-reviewed PR → merge.

Last updated: 2026-08-27

---

## Archive — second production promotion / Treasury Futures (2026-08-27)
Starting `main` for this work: `d17ec98dab241b83ddf615b117b1be10804578da` (includes PRs **#140–#154** merged).

**PR #154 merged — second actual GhostFlow production promotion (Treasury Futures):**
- Promoted reviewed `treasuryFuturesPositioningProxy` candidate for `asOf` **2026-08-18**
- Production Treasury Futures artifact now:
  - CFTC PRE TFF Futures Only (`gpe5-46if`)
  - `dataQuality`: `verified_automated`
  - **no** fabricated `publishedAt`
  - four core Treasury contracts in basket (`042601`, `044601`, `043602`, `020601`)
  - two Ultra contracts optional / context only (`043607`, `020604`)
  - basket leveraged-funds net positioning **-32.4% OI** (`net_short`)
- Stale Treasury Plumbing hard-coded `34.6` market-value assertion converted to a semantic
  current-production `formatTreasuryFuturesPrimaryValue()` check
- Treasury Futures remains **display-only / unscored**

**Two real promotion cycles completed:**
1. Treasury Long-End (PR **#152**) — Board H.15 SDMX, `asOf` 2026-08-25
2. Treasury Futures (PR **#154**) — CFTC TFF automated, `asOf` 2026-08-18

Both used: reviewed envelope → dry-run → explicit `--apply` → validation → human data PR → merge.
Promotion writer remains human-triggered; no automatic promotion.

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Independently review `systematicFlowProxy` only (not approved yet). That review must specifically inspect:
   - display-only / no Research Composite score merge
   - current `Weekly (manual artifact)` presentation metadata
   - `verified_automated` snapshot `dataQuality` handling
   - production-coupled tests currently pinned to old market values / metadata
   Do not decide or repair those issues in this docs checkpoint.
2. Same-date / `revision_review_required` promotion policy remains blocked
3. History/provenance writes remain blocked; automatic promotion blocked
4. Systematic score wiring / v1.0c remains blocked
5. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-27

---

## Archive — first production promotion / Long-End (2026-08-27)
Starting `main` for this work: `32eb660734e01b5a77980d54c8bcbca0565eecff` (includes PRs **#140–#152** merged).

**PR #152 merged — first actual GhostFlow production promotion:**
- Promoted reviewed `treasuryLongEndIncomeLens` candidate identity
  `97ffb565f373626c9e88295d018e8d2f74d1e63dbd8647cd11c866cfd399e62a`
- Production Long-End artifact now:
  - `asOf`: **2026-08-25**
  - Board H.15 SDMX source transport
  - `seriesDefinition`: `frb_h15_treasury_long_end_income_lens_v1`
  - `dataQuality`: `verified_automated`
  - **no** T10YIE / breakeven
  - **no** fabricated `publishedAt`
- First end-to-end candidate promotion cycle completed successfully:
  candidate → human review → dry-run → explicit `--apply` → validation → data PR → merge
- Three stale production-coupled tests aligned to the Board-native contract in the same PR
- Long-End remains **display-only / unscored** (not in composite / Passive / Structural / `publicSignalCount`)

**PR #151 merged (C2 promotion writer):**
- Explicit `--apply` fail-closed writer; dry-run default; public envelope-path-only apply API
- Destination containment under `data/ghostflow/artifacts/`; commit-point re-lock; post-write verification
- Writer remains human-triggered; no automatic promotion

Production GhostFlow score/reference baseline remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Independently review remaining live candidates (not approved yet):
   1. `treasuryFuturesPositioningProxy`
   2. `systematicFlowProxy`
2. Same-date promotion policy remains blocked
3. History/provenance writes remain blocked; automatic promotion blocked
4. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-27

---

## Archive — promotion C2 writer (2026-08-27)
Starting `main` for this work: `e5db69db5ddae54a933372ee5a96e29f75d13ecd` (includes PRs **#140–#150** merged).

**PR C2 — explicit `--apply` production writer implemented (branch `feat/ghostflow-promotion-writer`):**
- Builds on merged PR **#150** C1 dry-run validation/plan
- Public `applyGhostFlowCandidatePromotion({ repoRoot, envelopePath })` only — no plan/mapper/currentProduction injection
- Reuses full C1 validation path; writer revalidates proposed artifact
- Unique temp sibling (`wx`) + temp prevalidation + commit-point optimistic re-lock
- Rename-over-existing fail-closed (no unlink-destination fallback); mandatory post-write readback
- Post-write failure → exit 6; no guaranteed rollback
- **Mechanism PR does not promote any live candidate**; actual repo production JSON unchanged at that time
- **Does not include:** history, receipts, Git automation, same-date promotion, network fetch

**PR #150 merged (C1 dry-run):**
- Envelope eligibility, mapper replay, production lock, newer-date gate, dry-run CLI

Production GhostFlow state remains unchanged at C2 merge:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Separately review/promote actual artifact candidate(s) via dry-run → `--apply` → human production-artifact PR (one artifact preferred)
2. Same-date promotion policy remains blocked
3. History/provenance writes remain blocked; automatic promotion blocked
4. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-27

---

## Archive — promotion C1 dry-run (2026-08-26)
Starting `main` for this work: `cb7f45697831ba1d31e0a813ce90a1acb44f7ed9` (includes PRs **#140–#149** merged).

**PR C1 — promotion dry-run validation/plan implemented (branch `feat/ghostflow-promotion-dry-run`):**
- Builds on merged PR **#149** promotion policy + impact inventory
- Extracted pure `reconcileStoredCandidateEnvelope` to `candidates/envelopeIntegrity.ts`
- Promotion envelope eligibility validation (`ready_for_review` only)
- Current mapper replay + reviewed payload hash lock
- Current-production optimistic lock (+ `sourcePublishedAt` when recorded)
- Strict newer-date gate; explicit safe `--envelope` path under `tmp/ghostflow/`
- `PromotionPlan` + `ghostflow:promote-candidate` dry-run CLI
- **`--apply` intentionally unavailable** (rejected); **no production write capability**
- **Does not include:** production writer, history, receipts, Git automation, or candidate promotion

**PR #149 merged (promotion policy):**
- DECISIONS entry + [PROMOTION_POLICY_IMPACT.md](../ghostflow/PROMOTION_POLICY_IMPACT.md)

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. **PR C2** — `--apply` fail-closed production writer + post-write verification
2. Separate human-reviewed data PRs for any actual artifact refresh after mechanism merges
3. Same-date promotion policy remains blocked
4. History/provenance writes remain blocked; automatic promotion blocked
5. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-26

---

## Archive — promotion policy + PR C impact (2026-08-26)
Starting `main` for this work: `70d8ade488a70c1f92015a8454864314d90db1d5` (includes PRs **#140–#148** merged).

**Promotion policy approved + impact audit (branch `docs/ghostflow-promotion-policy`):**
- DECISIONS entry: *2026-08-26 — GhostFlow candidate promotion policy*
- Impact memo: [PROMOTION_POLICY_IMPACT.md](../ghostflow/PROMOTION_POLICY_IMPACT.md)
- Eligible: `ready_for_review` only; `revision_review_required` blocked
- Explicit `--envelope`; dry-run default; `--apply` required for write
- Current mapper replay + current-production optimistic lock + newer-date gate
- Registry-owned destination; no network; no history; no Git automation
- Recommended next implementation: **C1 dry-run/validation**, then **C2 `--apply` writer**
- **Does not authorize or perform any production artifact write**; no candidate promoted

**PR #148 merged (candidate generator):**
- Local review envelopes under gitignored `tmp/ghostflow/candidates/`
- Canonical identity/hash, factual diff, collision-safe idempotent writer, single-artifact CLI

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. **PR C1** — promotion validation + dry-run plan + CLI (no production writes)
2. **PR C2** — `--apply` fail-closed production writer + post-write verification
3. Separate human-reviewed data PRs for any actual artifact refresh after mechanism merges
4. Same-date promotion policy remains blocked
5. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-26

---

## Archive — PR B candidate generator (2026-08-26)
Starting `main` for this work: `ee018350a8d76737027473a62e6196ce986a7f24` (includes PRs **#140–#147** merged).

**PR B — candidate generator + review envelope implemented (branch `feat/ghostflow-candidate-generator`):**
- Builds on merged PR **#147** candidate mappers + provenance guards
- Typed candidate envelope (`candidateVersion: 1`) with deterministic identity and canonical production-payload hashing
- Factual current-vs-candidate structural diff (no investment interpretation)
- `generateGhostFlowCandidate` programmatic API + `ghostflow:generate-candidate` single-artifact CLI
- Collision-safe idempotent writer under gitignored `tmp/ghostflow/candidates/` only
- Full normalized durable provenance embedded verbatim; no raw source persistence
- Live smoke (2026-08-26): all three artifacts `ready_for_review`; Long-End idempotency `candidate_already_exists` exit 0
- **Does not include:** production artifact writes, promotion, accepted-history writes, automatic PR creation, or `--artifact all`

**PR #147 merged (candidate mappers + provenance hardening):**
- Pure candidate mappers + registry for systematic, Treasury Futures, and Board-native Long-End (SDMX-only)
- Fail-closed mapper provenance reconciliation; strict timestamp validation

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. **Promotion policy / PR C authorization gate** — separate DECISIONS approval required before any production promotion
2. Same-date promotion policy remains blocked pending human decision
3. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-26

---

## Archive — PR A candidate mappers (2026-08-26)
Starting `main` for this work: `2dd7c086d8c659e2823ca36928ce7eef91c625b1` (includes PRs **#140–#146** merged).

**Candidate-generation architecture design (PR #145, branch `docs/ghostflow-candidate-generation-design`):**
- Design memo: [CANDIDATE_GENERATION_DESIGN.md](../ghostflow/CANDIDATE_GENERATION_DESIGN.md)
- Scope: operator-ready artifacts only — `systematicFlowProxy`, `treasuryFuturesPositioningProxy`, `treasuryLongEndIncomeLens`
- Architecture approved: typed review envelope, pure mappers, validator reuse, gitignored `tmp/ghostflow/candidates/`, explicit CLI, no automatic promotion
- **Contract corrections:** idempotency reconciles identity + payload (not whole-envelope bytes); same-date revision limited to mapped-payload diff (production lacks accepted source hash); mapping-policy decision gate **blocks PR A**
- **Does not authorize** production writes, automatic promotion, or candidate commits
- Report-only operator runner unchanged

**PR #144 merged to `main` (H.15 SDMX/XML transport):**
- Active transport for `treasuryLongEndIncomeLens` → Board release-level SDMX/XML ZIP
- Adapter `frb-h15-treasury-yields-sdmx` parser **1.0.0**; CSV **1.0.1** retained without runtime fallback

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. **Resolve candidate production-mapping policy decisions** before PR A (Long-End `seriesDefinition` / Board source block, `dataQuality`, `publishedAt`) — record in DECISIONS after Bobby approval
2. **PR A** — types + authorized validator/schema updates + pure mappers + tests (only after decision gate)
3. **PR B** — generator + diff + idempotent writer + CLI
4. Promotion (PR C) blocked pending separate DECISIONS approval
5. Breadth remains blocked. Do not wire VIX or Gate C.

Last updated: 2026-08-26

---

## Archive — H.15 SDMX/XML transport implemented (2026-08-26)
Starting `main` for this work: `3f63fdf27176dc5fabb4b15c8395200d10c9c931` (includes PRs **#140–#143**).

**H.15 SDMX/XML transport cutover complete (branch `feat/ghostflow-h15-sdmx`):**
- Active transport for `treasuryLongEndIncomeLens` → Board release-level SDMX/XML ZIP
  `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- New adapter: `frb-h15-treasury-yields-sdmx` parser **1.0.0**; registry + operator runner cut over
- Product contract unchanged: required 30Y nominal + 30Y inflation-indexed real; optional 2Y/5Y/10Y; **no T10YIE**; **no derived breakeven**; display-only / unscored / `human_required`
- Source family remains `frb_h15_treasury_yields`
- **CSV adapter `frb-h15-treasury-yields-csv` parser 1.0.1 retained** for manual parity/rollback inspection; **no automatic runtime fallback**
- ZIP strategy: narrow in-memory local-header reader + `node:zlib` raw DEFLATE (no new dependency)
- XML strategy: deterministic SDMX compact series/observation scanner (no new dependency)
- Live CSV/XML normalized parity verified at ceiling `2026-08-24` (all five series aligned)
- PR **#143** transport decision already in DECISIONS — not duplicated

**Live smoke (report-only, no writes):**
- H.15-only (`2026-08-26T19:57:55.764Z`): `candidate_observation_available` (candidate `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0; adapter `frb-h15-treasury-yields-sdmx`
- Full runner (`2026-08-26T19:58:07.000Z`): all three artifacts `candidate_observation_available` (CFTC `2026-08-18`; H.15 `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Human-reviewed candidate-generation design for operator-ready artifacts (including H.15 long-end)
2. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-26

---

## Archive — H.15 SDMX/XML transport approved (2026-08-26)
Starting `main` for this work: `38333e0224fa4112cae4bb149cbec8c16f6b502f` (PR **#142** blank-as-missing parser **1.0.1** merged).

**Bobby approved H.15 transport migration (recorded in DECISIONS):**
- Canonical transport for `treasuryLongEndIncomeLens` → Board release-level SDMX/XML ZIP
  `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- Product contract preserved: required 30Y nominal + 30Y inflation-indexed real; optional 2Y/5Y/10Y; **no T10YIE**; **no derived breakeven**; display-only / unscored / `human_required`; no production writer or workflow in the migration itself
- H.15-only (`2026-08-26T00:08:24.514Z`): `candidate_observation_available` (candidate observation date `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0. Prior `h15_csv_invalid_value` / row 67486 gone.
- Full runner (`2026-08-26T00:08:41.683Z`): all three artifacts `candidate_observation_available` (systematic + Treasury CFTC `2026-08-18`; H.15 `2026-08-24`); overall `ready_for_review`; suggested `review_candidates`; exit 0.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Design and approve the durable Board release-level SDMX/XML transport migration for `treasuryLongEndIncomeLens` before **2026-11-09** BYP removal
2. Only after transport migration planning is locked, resume human-reviewed candidate-generation design
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — H.15 live-source investigation (2026-08-25)
Starting `main` for this work: `51236fb96b15b73c5da095aa6b8dc7b3410148e0` (PR **#140** merged).

PR **#140** merged the manual **report-only operator runner** on `main`. Live smoke command: `npm run ghostflow:refresh-report`.

**H.15 live-source investigation completed (docs-only):**
- Canonical memo: [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md)
- Live reproduction (`2026-08-25T22:22:19.375Z`): `treasuryLongEndIncomeLens` → `source_failed`, `h15_csv_invalid_value`, **TCM package**, parse stage, **row 67486**
- Exact failure: series `H15/H15/RIFLGFCY02_N.B`, date `1962-01-02`, **blank** value cell (`""`); 3 columns; no quoting
- Classification: **B — parser omission** (blank pre-inception cells are legitimate Board CSV missing representation; parser accepts `ND` only)
- **DDP/BYP exposure:** preformatted TCM package **NOT SPECIFIED** post-November; custom TIPS-30 package **BYP-exposed** (custom-package mechanism; continued arbitrary-package URL support after BYP removal not guaranteed)
- **XML feasibility:** release ZIP `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` contains all five GhostFlow series; SDMX 1.0; `OBS_STATUS` missing semantics
- **Recommended durable transport:** release-level SDMX/XML (Path D) before November BYP removal
- **Smallest next implementation PR:** parser **1.0.1** blank-as-missing CSV fix (interim live unblock); XML migration as follow-up after Bobby review
- **Production unchanged;** no adapter/registry/parser/transport approval in this investigation

CFTC systematic + Treasury adapters returned `candidate_observation_available` (2026-08-18) in prior PR #140 smoke. H.15 remains blocked until parser/transport work is approved and implemented.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

## Recommended next work
1. Bobby review of H.15 investigation memo; if approved, implement parser **1.0.1** blank-missing fix, then plan SDMX/XML adapter migration before **2026-11-09**
2. After H.15 returns to healthy deterministic live smoke, design human-reviewed candidate generation for report-ready non-score-fed observations
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — Report-only operator runner (2026-08-25)
- `systematicFlowProxy` (`cftc-tff-systematic-socrata`)
- `treasuryFuturesPositioningProxy` (`cftc-tff-treasury-socrata`)
- `treasuryLongEndIncomeLens` (`frb-h15-treasury-yields-csv`)

Runner behavior:
- Reads current production artifacts only for validated date summaries
- Fetches official sources through existing adapters
- Builds the existing GhostFlow refresh report (`report_only`, human review required)
- Writes nothing (no production, candidate, history, score, or reference changes)
- Requires human review; cannot generate candidates or change production

**Live smoke (`npm run ghostflow:refresh-report`, 2026-08-25T21:54:54.950Z):**
- `systematicFlowProxy`: `candidate_observation_available` (candidate observation date 2026-08-18)
- `treasuryFuturesPositioningProxy`: `candidate_observation_available` (candidate observation date 2026-08-18)
- `treasuryLongEndIncomeLens`: `source_failed` — `h15_csv_invalid_value` at source CSV row 67486
- Overall report: `partial_with_blocks`; suggested action: `review_candidates_and_investigate_blocks`; exit code 2

This is expected fail-closed runner behavior. The H.15 adapter defect is separate from runner correctness.

**Source-risk note (Board DDP, announced 2026-07-16):**
On [2026-07-16](https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15), the Federal Reserve Board announced that **Build Your Package (BYP)** is scheduled for removal during the week of **November 9, 2026**, in preparation for eventual retirement of the Data Download Program (DDP). Users are directed toward FRED or release-level XML downloads. The current H.15 adapter depends on (1) a preformatted Treasury Constant Maturities DDP package and (2) a custom single-series DDP package for `RIFLGFCY30_XII_N.B`. Source transport therefore requires re-evaluation before candidate-generation work proceeds. This announcement is not claimed to have caused the live parse failure above.

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

## Recommended next work
1. Investigate the live Board H.15 adapter failure and re-evaluate the DDP transport in light of the July 16 DDP/BYP retirement announcement. Determine whether the safe path is a narrowly scoped parser correction or migration to the Board release-level XML/SDMX source. Do not change sources or methodology without explicit review.
2. After H.15 returns to a healthy deterministic live smoke, design human-reviewed candidate generation for report-ready non-score-fed observations.
3. Breadth remains blocked pending provider authorization / licensed-source decision. Do not wire VIX or Gate C.

Last updated: 2026-08-25

---

## Archive — Board H.15 Treasury adapter (2026-07-13)
PR **#138** merged the Treasury long-end source feasibility audit on `main` (`9cf9fa4`).

**Board H.15 Treasury long-end adapter implemented** (fixture-driven, unwired):
- Canonical source migrated from FRED → Board of Governors H.15 DDP (`frb-h15-treasury-yields-csv` / `1.0.0`)
- Required: 30Y nominal + 30Y inflation-indexed; optional: 2Y / 5Y / 10Y nominal on common date
- **T10YIE omitted**; no derived breakeven
- Display-only / unscored / `human_required`; no production artifact writer or workflow wiring
- DECISIONS records Bobby's 2026-07-13 source migration approval
- No production artifact refresh; historical FRED provenance in committed JSON unchanged

**Implemented but unwired adapters:**
- `cboe-vix-history-csv`
- `cftc-tff-systematic-socrata`
- `cftc-tff-treasury-socrata`
- `frb-h15-treasury-yields-csv`

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

Breadth and Gate C remain blocked. VIX / CFTC adapters remain unwired.

## Recommended next work
1. Do **not** wire H.15 / CFTC / VIX adapters into production refresh, CLI, or workflows yet
2. Breadth: decide written provider permission **or** licensed SKU investigation (neither approved)
3. Optional later: operator runner / human-approved long-end refresh using H.15 (no silent FRED graph CSV)

Last updated: 2026-07-13

---

## Archive — Treasury long-end source audit (2026-07-13)
PR **#137** merged the CFTC TFF Treasury adapter on `main` (`12ad053`).
PR **#136** previously merged the shared CFTC Socrata core; PR **#135** the systematic adapter.

**Treasury long-end source authorization audit (docs-only):**
- Canonical memo: [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md)
- Task-start `main` SHA for the audit: `12ad05350f0aeab24d62b809f271a9c1c59bf2ee`
- Recommended direct Board H.15; FRED graph CSV not for production; FRED API retention issues
- **No** source approved by the audit alone; no registry/artifact change in that PR

## Archive — CFTC Treasury adapter (2026-07-13)
PR **#136** merged the shared CFTC Socrata source core on `main` (`70b66f7`).
PR **#135** previously merged the CFTC systematic adapter.

**CFTC TFF Treasury adapter implemented** (fixture-driven, unwired):
- Official TFF Futures Only (`gpe5-46if`) via shared Socrata core
- Four standard Treasury contracts required as core; two Ultra contracts optional context
- Adapter normalizes raw CFTC source observations only; derived metrics remain downstream
- Treasury remains display-only / unscored; `mappingStatus` still `not_final` downstream
- No production artifact refresh; adapter not wired to runtime or workflows
- Systematic adapter unchanged and unwired; FRED Treasury remains `spike_available`

## Archive — Shared CFTC Socrata core (2026-07-13)
PR **#135** merged the CFTC TFF systematic adapter on `main` (`96852dc`).
PR **#134** previously merged the breadth operator-packet specification; Gate C remains blocked; no provider approved.

**Shared CFTC Socrata source core extracted** (no behavior change):
- Reusable transport/parsing/query primitives in `cftcTffSocrataCore.ts` / generic query builder
- Systematic adapter consumes the shared core; ID/parser version `1.0.0` and behavior unchanged
- Systematic adapter remains fixture-tested and **unwired**
- Treasury CFTC (`cftc-tff-treasury-socrata`) was still `spike_available` at that point

## Archive — CFTC systematic adapter (2026-07-13)
PR **#134** merged the breadth operator-packet specification on `main` (`c503042`).
PR **#133** established the breadth-source authorization block; Gate C remains blocked; no provider approved.

**CFTC TFF systematic adapter implemented** (fixture-driven, unwired):
- Official CFTC Public Reporting Environment TFF Futures Only (`gpe5-46if`) fetch / parse / normalize
- Normalizes registered ES / NQ / RTY / VIX contract observations only
- Basket calculation and pressure mapping remain downstream
- `systematicFlowProxy` remains display-only; MOCK systematic **62** unchanged
- No production artifact refresh; adapter not wired to runtime or workflows

## Archive — Breadth operator packet (2026-07-13)
PR **#133** merged the breadth-source feasibility decision on `main` (`18ab040`).
PR **#132** previously merged the CBOE VIX CSV adapter (implemented, **unwired**).
Breadth operator-packet runbook completed; intake-only; no provider approved; Gate C blocked.

## Archive — Education / V1 snapshot (2026-01-21)
Ghost Allocator is stable and usable: onboarding + builder flow works, Schwab sleeve logic is clean (Gold and Commodities are always separate), and GhostRegime diagnostics are local-first and usable without production secrets. We are deliberately holding off on BTC parity mismatch investigation for now (watchlist item, not a blocker).

Education section (V1.1) is now live:
- /learn hub exists with guided "Start Here" path and Browse section
- /learn/457 basics page provides generic 457(b) education (first responder friendly)
- /learn/457 now includes "457(b) in 5 Minutes" quick reference section (fast, scannable format)
- /learn/masterclass page integrates Macro Mayhem Masterclass as Level 1: link-out to Substack with curated "Start here" sequence and category browse
- All stub pages created (/learn/457/okc, /learn/basics, /learn/glossary)
- Masterclass data file uses real titles/dates from archive with validation guardrails
- Navigation updated: "Learn" link in top nav, secondary CTA on homepage

## What done looks like

### V1 (Foundation)
- Working onboarding/builder for both platforms (Voya-only, Voya+Schwab)
- Canonical Voya menu (full OKC fund list)
- Schwab sleeves/tilts are explainable and free of duplicate tickers
- Docs/checks exist and are Windows/PowerShell-friendly
- Deployable (builds cleanly)

### V1.1 (Education + trust) ✓ COMPLETE
- /learn hub exists with a guided "Start here" path ✓
- /learn/457 basics page exists with sourced, conservative explanations ✓
- /learn/masterclass index exists with curated sequence + category browse + Substack link-outs ✓
- No UI churn beyond minimal nav/CTA additions needed to surface Learn ✓
- Masterclass data uses real titles/dates from archive (manual list, no parsing) ✓
- Validation guardrails for data integrity (dev-time) ✓
- Fallback links ("Find on Substack") ensure every item has working click path ✓

## Blockers
- None critical.

## Watchlist (not blocking)
- BTC parity mismatch investigation remains on hold unless it resurfaces in a meaningful way.
- Avoid drift between displayed lineup logic and GhostRegime engine logic.

## Next Actions
1) Add per-article Substack URLs to masterclass data file as Bobby provides them
2) Develop OKC-specific 457(b) playbook content when plan documents are available
3) Consider adding Finance Basics and Glossary content (currently stubs)

Last updated: 2026-01-21

---

## Archive
### Snapshot (Last updated: 2025-12-22)
Ghost Allocator V1 is functional and firefighter-friendly: pension-aware onboarding, Voya-only and Voya+Schwab paths, full OKC Voya fund menu, delta "one-time rebalance" guidance, and a black/gold glass UI. SEO basics (metadata helper, robots/sitemap, OG image) are in place. GhostRegime exists as a secondary tool and its scheduled workflow has been "tamed" to skip safely when not configured.

## What done looks like

### V1 (MVP Foundation)
- Working onboarding/builder for both platforms (Voya-only, Voya+Schwab)
- Canonical Voya menu (full OKC fund list)
- Delta logic (one-time rebalance guidance)
- OKC Voya-first copy (payroll lands in Voya, manual Schwab sweeps)
- Docs/checks (project-ops pack, verification checklist)
- Workflows non-noisy (skip guards, safe Slack notify)
- Deployable (builds cleanly, staging-ready)

### V1.1 (Trust & polish)
- Model portfolios locked + reviewed outputs for each risk band/platform path
- GhostRegime UI polish (cards/layout/hierarchy improvements)

## Blockers
- Verify GitHub Actions are now green (workflow YAML + skip guard + Slack notify logic).
- Confirm production deployment plan (Vercel or Convex) and set NEXT_PUBLIC_SITE_URL.

## Next Actions
1) Create model portfolio spec + acceptance criteria (V1.1)
2) Add a review harness page or dev script to snapshot outputs across risk bands (V1.1)
3) GhostRegime UI polish pass (V1.1)