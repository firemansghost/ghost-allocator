# GhostRegime VAMS vs 42 Macro KISS — Signal-layer audit (2026-03-24)

This document records a **code-based forensic audit** of how sleeve states are computed in GhostRegime versus what 42 Macro’s KISS materials *appear* to label (VT / GLDM / FBTC, etc.). It does **not** claim access to 42’s proprietary internal formulas.

**Source materials cited by stakeholders** (`2026-03-21_Slides.pdf`, `2026-03-21.xlsb`) are **not present in this repository**; claims about workbook/slide content below are **second-hand** unless corroborated by committed code. Parity reference JSON (when present under `.local/reference/`) uses ES1/XAU/XBT naming per `kissTypes.ts`.

---

## 1) Executive summary

- GhostRegime computes sleeve states with a **surrogate VAMS** implemented in [`lib/ghostregime/vams.ts`](../../lib/ghostregime/vams.ts): momentum/vol score on **SPY**, **GLD**, and **BTC-USD**, with thresholds **±0.5**.
- The parity harness and reference JSON use **ES1 / XAU / XBT** *names* for states; production uses **liquid ETF/spot proxies**, not futures tickers.
- **Allocation parity** (regime → targets × scale → cash) can match KISS 8.0 after the INFLATION gold fix **if** states match — but **state parity** with 42’s published VT/GLDM/FBTC labels is **not guaranteed** by construction.
- The March 2026 mismatch (**neutral / bullish / bearish** implied by our old screenshot vs **bearish / neutral / bearish** on 42) is **fully explained** by (a) **different instruments** (SPY vs VT, GLD vs GLDM, spot vs FBTC) and/or (b) **different raw VAMS scores** crossing ±0.5 — not by allocation math alone.
- **Recommended direction:** treat production as **KISS-inspired proxy VAMS** (Level 1–2); **document honestly**; optionally tighten symbols toward VT/GLDM/FBTC and revalidate; **ingest published states** (Level 3) only as an optional overlay if a stable feed exists.

---

## 2) Current GhostRegime signal-source map (confirmed from code)

| Sleeve | Symbol(s) | Data path | Raw signal | Windows | Thresholds → state |
|--------|-----------|-----------|------------|---------|---------------------|
| **Stocks** | **`SPY`** (hardcoded in `computeAllVamsStates`) | `marketData` via Stooq/AlphaVantage/etc. ([`marketData.ts`](../../lib/ghostregime/marketData.ts)) | Close-to-close **TR_126**, **TR_252**; `mom = 0.6*TR_126 + 0.4*TR_252`; `vol = stdev(daily returns, 63)*√252`; `score = mom/vol` | 126, 252 obs; 63-day return window for vol | `score ≥ 0.5` → +2 (bullish); `≤ -0.5` → -2 (bearish); else 0 (neutral) ([`config.ts`](../../lib/ghostregime/config.ts) `VAMS_THRESHOLD_HIGH/LOW`) |
| **Gold** | **`GLD`** (hardcoded) | Same | Same formula | Same | Same |
| **Bitcoin** | **`BTC-USD`** (default; `MARKET_SYMBOLS.BTC_USD` from engine) | Stooq `btcusd` / CoinGecko fallback per provider | Same formula | Same | Same |

**Fallback:** If `< TR_252` observations or insufficient returns, `computeVamsScore` returns **0** → **neutral** state (conservative).

**Not VAMS:** Macro **regime** (GOLDILOCKS / …) comes from **Option B voting** on SPY, HYG/IEF, VIX, EEM/SPY, PDBC, TIP/IEF, TLT, UUP — separate pipeline ([`regimeCore.ts`](../../lib/ghostregime/regimeCore.ts)).

**Persistence:** Daily row stores `stocks_vams_state`, `gold_vams_state`, `btc_vams_state` on [`GhostRegimeRow`](../../lib/ghostregime/types.ts); computed in [`engine.ts`](../../lib/ghostregime/engine.ts) via `computeAllVamsStates(marketData, BTC_USD, asofDate)`.

---

## 3) 42 KISS evidence (from repo + uncertainty)

| Topic | Confirmed in repo | Uncertain / not in repo |
|-------|--------------------|---------------------------|
| Reference **state labels** | [`kissTypes.ts`](../../lib/ghostregime/parity/kissTypes.ts): `ES1`, `XAU`, `XBT` naming; sample parity snapshots (local reference) use `es1_state` / `xau_state` / `xbt_state` and may list sheet tickers such as **SPYM**, **GLDM**, **FBTC** | Whether 42 computes VAMS on **futures** (ES) vs **ETFs** (VT), or on **display tickers** only |
| Parity harness purpose | [`PARITY_REFERENCE.md`](PARITY_REFERENCE.md): **not** a reverse-engineer of VAMS; validates allocation wiring when states are **given** | Exact 42 internal momentum/vol/threshold formulas |
| Slide/workbook | — | **PDF/xlsb not in repo** — cannot verify formulas, hidden cells, or exact thresholds |

---

## 4) Difference matrix

| Dimension | GhostRegime (production) | 42 KISS (stakeholder narrative) | Likely effect |
|-----------|--------------------------|-----------------------------------|---------------|
| **Stocks instrument** | SPY | VT (Total World) per deck | Different return path → different score → different ±0.5 bucket |
| **Gold instrument** | GLD | GLDM per deck | Small tracking diff; can flip neutral vs bullish near threshold |
| **BTC instrument** | BTC-USD spot | FBTC ETF | Different vol/mom; common source of large divergence |
| **Thresholds** | ±0.5 on mom/vol score | Unknown unless workbook matches | Bucket changes if 42 uses different cutoffs |
| **Lookback** | TR on 126/252 **observations**, 63-day vol | Unknown | ETF vs spot calendar alignment differs for BTC |
| **Price type** | Close-to-close, not total return ([`vams.ts`](../../lib/ghostregime/vams.ts) L4) | Unknown | Dividends/distributions differ ETF vs spot |
| **Regime** | Option B 8-market vote | 42 regime classification | Already independent; only allocation targets were aligned to KISS 8.0 |
| **Timing** | `asofDate` filter on series | Daily publish time unknown | Edge cases on rebalance days |

---

## 5) March 2026 discrepancy (reconciled)

**Observed old screenshot (~15 / 30 / 0 + 55 cash)** with **old** INFLATION gold target **30%** implies VAMS scales:

- Stocks: 0.15 / 0.30 = **0.5** → **neutral** (0)
- Gold: 0.30 / 0.30 = **1.0** → **bullish** (+2)
- BTC: 0 → **bearish** (-2)

**42 published:** bearish / neutral / bearish (VT / GLDM / FBTC narrative).

So the mismatch is **not** a bug in scale mapping — it is **inconsistent sleeve states** driven by **proxy instruments and/or thresholds** vs 42’s published labels. After the **gold target fix** (15% in INFLATION), **bearish/neutral/bearish** with our formula yields **0 / 7.5% / 0 + 92.5% cash**, matching KISS **allocation** when states align.

---

## 6) Parity levels

| Level | Meaning | GhostRegime today |
|-------|---------|-------------------|
| **1** | Allocation map + scales | **Yes** (after KISS 8.0 target fix) |
| **2** | Same **instruments/rules** as 42 | **No** — SPY/GLD/BTC-USD surrogate + documented ±0.5 |
| **3** | **Ingest** published 42 states | **Not implemented** — would need external feed |

---

## 7) Recommendation

**Primary:** **Option C (intentional proxy)** — explicitly label GhostRegime sleeve states as **“surrogate VAMS (SPY / GLD / BTC-USD)”** in user-facing methodology, not “42’s published VT/GLDM/FBTC states.”

**Secondary (optional):** **Option B (tighten)** — add VT, GLDM, FBTC (or closest data) **behind** a flag or A/B comparison in diagnostics; revalidate thresholds before switching production.

**Tertiary:** **Option A (mirror)** — only if you have a **licensed or manual** daily feed of 42 states; treat as **overlay**, not replacement for internal compute, unless you fully own the dependency.

---

## 8) Smallest next-step implementation plan (no broad rewrite)

1. **Copy/methodology:** One pass on `/ghostregime/methodology` (and glossary if needed) stating surrogate instruments + ±0.5 thresholds; link to this doc.
2. **Diagnostics:** Optional script: print `computeVamsScore` + `vamsScoreToState` for SPY/GLD/BTC-USD for a given `asofDate` (reuse engine data load) — **keep** in `scripts/ghostregime/` if useful for ops.
3. **Future:** Spike **Level 2** with parallel VT/GLDM/FBTC series and compare distribution of state buckets vs SPY/GLD/BTC-USD on historical dates (no production flip until reviewed).

---

## 9) What remains unknown

- 42’s **exact** VAMS formula, thresholds, and whether sleeve labels use **futures** vs **ETF** series.
- **Full** workbook formulas for Mar 21 / Mar 24 without the xlsb in repo.
- Whether 42 **revises** states intraday vs market close — our pipeline is **as-of close** style.

---

## References (in-repo)

- [`lib/ghostregime/vams.ts`](../../lib/ghostregime/vams.ts)
- [`lib/ghostregime/engine.ts`](../../lib/ghostregime/engine.ts) (`computeAllVamsStates`)
- [`lib/ghostregime/config.ts`](../../lib/ghostregime/config.ts) (thresholds)
- [`docs/ghostregime/PARITY_REFERENCE.md`](PARITY_REFERENCE.md)
- [`docs/ghostregime/PLAN.md`](PLAN.md) (VAMS section)
