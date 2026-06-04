# Passive Stress-Zone Language Standard (GhostFlow v1.6a)

**Status:** v1.6a language standard — copy and methodology only; **no** scoring, artifact, or data-model changes.  
**Related:** [DATA_ROADMAP.md](./DATA_ROADMAP.md) (canonical dashboard counts) · [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md)

---

## Purpose

Align GhostFlow passive-share and model-stress-zone wording with passive-endgame research framing (e.g. Mike Green transcript / scenario handoff): **model-stress zones**, not precise tripwires; **public proxies**, not perfect measurement; **pressure gauge**, not crash countdown or investment advice.

This memo is the **phrasebook** for UI copy, runbooks, and operator notes. Internal `signalId` values (e.g. `distance-65`) and scoring math are unchanged in v1.6a.

---

## Canonical phrasing (use)

| Theme | Preferred language |
|-------|-------------------|
| Thresholds | GhostFlow treats passive-share thresholds as **model-stress zones**, not precise tripwires. |
| Range | The model-stress zone is **not a single number**. Experts often frame the danger zone around **60–65%**, depending on definition and denominator. |
| Reference point | **~65%** is a **reference point** in published passive-flow framing, not a guaranteed trigger. |
| Endgame band | Some passive-endgame models describe **~65–85%** as a **possible** unstable operating zone — a **possible pathway**, not a law of physics or certain outcome. |
| ICI proxy | ICI index-share data is a **public proxy**, not a perfect measure of true passive control of market pricing or **active price-discovery capital**. |
| Dashboard role | GhostFlow is a **research/education pressure gauge**, not a forecast engine or investment advice. |
| Time | GhostFlow does **not** treat passive share as a **countdown clock** to a crash date. |
| Dynamics | **Passive adoption** may be linear, but **passive market impact** can become **convex** as the active pool shrinks. |
| Distance card | **Distance to model-stress zone** (or **model-stress-zone reference**) — gap vs published ~65% framing; context only. |
| Predictions | **Possible pathways, not predictions.** |

---

## Avoid list

Do **not** use (except in clear negation, e.g. “not a tripwire”):

- “65% danger zone” as a precise trigger  
- “65% means crash”  
- “tripwire” (unless negated: “not a tripwire”)  
- “countdown clock” / “crash countdown” as affirmative framing  
- “doom meter”  
- “guaranteed crash”  
- Buy / sell / allocate / portfolio advice  
- Language implying ICI index-share **equals** market-wide passive control  

---

## 60–65% model-stress-zone framing

- Published passive-flow models often discuss stress **around 60–65%**, not at one exact tick.  
- GhostFlow’s distance display uses **~65%** as a **reference** for gap math only; that does **not** mean crossing 65% on the ICI proxy triggers a crash or forecast event.  
- The ICI Index Share Proxy can sit in the **60–65% pre-stress band** while still being **below** the ~65% reference used for distance context.

---

## 65–85% possible unstable operating zone (caveated)

Some endgame narratives describe higher passive-share bands as **possibly** more reflexive or fragile in **model** terms. GhostFlow band labels in methodology (e.g. 65–75%, 75–87%) reflect **illustrative model interpretation**, not verified market law. **v1.6b** adds the educational explainer — see [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md).

---

## Scenario language (v1.6b)

| Rule | Language |
|------|----------|
| Role | **Educational explainer** — not scored, not in `publicSignals`, not a forecast |
| Order | Scenarios **do not have to happen in sequence** |
| Tone | **Possible pathways, not predictions**; same avoid-list as above |
| UI | Dashboard teaser + Methodology `#ghostflow-endgame-scenarios` |

Full copy: [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md).

---

## Proxy quality (ICI index-share)

- **What it measures:** domestic equity **fund/ETF** index assets as a share of active + index domestic equity fund assets (ICI Total Net Assets table).  
- **What it does not measure:** total market passive ownership, float, trading volume, marginal price-setting, or proof that passive flows dominate **active price-discovery capital**.

---

## Pressure gauge / not forecast / not advice

- Composite and sub-scores are **context gauges** for research preview.  
- No crash-date prediction; no allocation recommendation.  
- Display-only artifact cards and MOCK score inputs remain separate from measured public proxies (see v1.5a roadmap checkpoint).

---

## Delivered in v1.6b

- [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) — six-scenario educational ladder (UI + doc); not scored

## Delivered in v1.7a

- [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) — Treasury Plumbing feasibility complete (docs-only); separate future lane; not on live dashboard; not scored

## Out of scope (ongoing)

| Item | Deferred phase |
|------|----------------|
| Treasury Plumbing dashboard section | v1.7e+ (after artifact design v1.7b–d) |
| Treasury basis trade / bond neglect artifacts & cards | v1.7b+ |
| Scoring weight or mapper changes | Not approved |
| New artifacts or data sources | Not approved |
| Live fetching / runtime feeds | Not approved |
| Scenario prediction engine | Not approved |

---

## Files touched in v1.6a (reference)

- This phrasebook  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) · [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md)  
- GhostFlow UI methodology / current read / signal grid / score drivers  
- `lib/ghostflow/artifacts/passiveShareProxy.ts` — display strings and caveats only  

**Unchanged:** `scoring.ts`, `buildSnapshot.ts`, production artifact JSON, `mockGhostflowSnapshot.ts`, `validate-artifacts.ts`, `package.json`.
