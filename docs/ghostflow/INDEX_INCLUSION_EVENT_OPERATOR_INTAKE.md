# Index Inclusion Event Operator Intake — GhostFlow v1.9c.4b

## Status

| Item | Value |
|------|-------|
| **Phase** | v1.9c.4b |
| **Status** | Docs-only operator collection pass — **Done (4 rows operator-reviewed; production-eligible pending v1.9c.4 product approval)** |
| **Production data** | **No** — memo rows are candidates only, not committed artifact JSON |
| **Dashboard impact** | **None** — no card, no runtime feed |
| **Production artifact** | **None** — [`indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) does not exist |
| **UI card** | **None** |
| **Scoring** | **None** — not a Research Composite input |
| **`publicSignalCount`** | **10** — unchanged |
| **v1.9c.4** | **Product-gated** — 4 production-eligible rows exist; separate product approval required before production JSON or UI |
| **Current recommendation** | **Eligible to request v1.9c.4 product approval** |

**Related documents:**

- [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) — artifact design + v1.9c.4a operator provenance checklist (§14)
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — future Index Inclusion Event Proxy refresh discipline
- [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) — v1.9c.1 Lane D source inventory

---

## Collection rules

- **Official public index-provider sources only**
  - Nasdaq IR / index change announcements
  - FTSE Russell / LSEG reconstitution materials
  - S&P DJI media center / index announcements
- **No rumors**, social-media-only sources, or unsourced news
- **No restricted or login-gated sources**
- **No committed PDFs, CSVs, or provider downloads** — cite public URLs only
- **Source URL** must be stable and public at `sourceAccessedDate`
- **Manual operator review** required for every row
- **`operatorVerified: true`** only after human review (not agent self-certification)
- **`productionEligible: yes`** only after all checklist items pass and no disqualifier applies
- **Never infer** free float or index-fund demand dollars
- **Never add** score-like fields, pressure claims, or `publicPassiveInputKey`

**Valid values when transcribing to future production JSON:**

| Field | Allowed values |
|-------|----------------|
| `indexFamily` | `sp_dji` · `nasdaq` · `ftse_russell` · `other` |
| `action` | `add` · `delete` · `rebalance` · `reconstitution` · `unknown` |

Apply the full [v1.9c.4a provenance checklist](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md#14-v1.9c4a-operator-provenance-checklist) before marking any row production-eligible.

---

## Candidate row table

| eventId | sourceName | sourceUrl | announcedDate | effectiveDate | sourceAccessedDate | indexFamily | indexName | ticker | companyName | action | eventType | sourceConfidence | notes | operatorVerified | productionEligible |
|---------|------------|-----------|---------------|---------------|--------------------|-------------|-----------|--------|-------------|--------|-----------|------------------|-------|------------------|--------------------|
| nasdaq100-2026-wmt-add | Nasdaq Investor Relations | https://ir.nasdaq.com/news-releases/news-release-details/walmart-inc-join-nasdaq-100-indexr-beginning-january-20th-2026 | 2026-01-09 | 2026-01-20 | 2026-06-16 | nasdaq | Nasdaq-100 Index | WMT | Walmart Inc. | add | component_replacement | high | Nasdaq announced Walmart Inc. would join the Nasdaq-100 Index prior to market open on 2026-01-20, replacing AstraZeneca PLC. Operator review still required before production eligibility. | true | yes |
| nasdaq100-2026-azn-delete | Nasdaq Investor Relations | https://ir.nasdaq.com/news-releases/news-release-details/walmart-inc-join-nasdaq-100-indexr-beginning-january-20th-2026 | 2026-01-09 | 2026-01-20 | 2026-06-16 | nasdaq | Nasdaq-100 Index | AZN | AstraZeneca PLC | delete | component_replacement | high | Nasdaq announced AstraZeneca PLC would be removed from the Nasdaq-100 Index prior to market open on 2026-01-20, replaced by Walmart Inc. Operator review still required before production eligibility. | true | yes |
| nasdaq100-2026-sndk-add | Nasdaq Investor Relations | https://ir.nasdaq.com/news-releases/news-release-details/sandisk-corporation-join-nasdaq-100-indexr-beginning-april-20 | 2026-04-10 | 2026-04-20 | 2026-06-16 | nasdaq | Nasdaq-100 Index | SNDK | Sandisk Corporation | add | component_replacement | high | Nasdaq announced Sandisk Corporation would join the Nasdaq-100 Index prior to market open on 2026-04-20, replacing Atlassian Corporation. Operator review still required before production eligibility. | true | yes |
| nasdaq100-2026-team-delete | Nasdaq Investor Relations | https://ir.nasdaq.com/news-releases/news-release-details/sandisk-corporation-join-nasdaq-100-indexr-beginning-april-20 | 2026-04-10 | 2026-04-20 | 2026-06-16 | nasdaq | Nasdaq-100 Index | TEAM | Atlassian Corporation | delete | component_replacement | high | Nasdaq announced Atlassian Corporation would be replaced in the Nasdaq-100 Index by Sandisk Corporation prior to market open on 2026-04-20. Operator review still required before production eligibility. | true | yes |

Operator review completed for the four Nasdaq Investor Relations rows. Source URLs, announcement dates, effective dates, tickers, index names, and add/delete actions were reviewed against the v1.9c.4a checklist. These rows are eligible to be considered for future v1.9c.4 production JSON, pending separate product approval.

**Row conventions:**

- `productionEligible`: `yes` · `no` · `pending`
- `operatorVerified`: `true` only after human review
- One row per index event (add, delete, rebalance, or reconstitution action)
- Stable unique `eventId` within the future artifact window

---

## Rejected rows

| eventId | rejectionReason | rejectedDate | notes |
|---------|-----------------|--------------|-------|
| *(no rows)* | | | |

**No rejected rows recorded yet.**

---

## Production disqualifier checklist

Reject a candidate row if any of the following apply:

- [ ] URL contains `example.com`
- [ ] Ticker matches `EXMP*` (synthetic example pattern)
- [ ] Source note includes `EXAMPLE / DESIGN ONLY`
- [ ] Source cannot be verified
- [ ] Source is restricted or login-gated
- [ ] Missing `effectiveDate` without explanatory notes
- [ ] Action cannot be classified
- [ ] Rumor / social / unsourced news
- [ ] Row includes score, pressure, demand-dollar, free-float, or float-absorption claims
- [ ] Row includes or implies `publicPassiveInputKey`

---

## Production readiness summary

| Metric | Count |
|--------|-------|
| Candidate rows | 4 |
| productionEligible: yes | 4 |
| productionEligible: no | 0 |
| productionEligible: pending | 0 |
| operatorVerified: true | 4 |

**Blockers:** v1.9c.4 product approval not requested; production JSON and UI not approved.

**Recommendation:** eligible to request v1.9c.4 product approval.

**Recommendation logic:**

| Condition | Recommendation |
|-----------|----------------|
| 0 production-eligible rows | **defer** |
| Partial pending rows (candidates exist but none eligible) | **collect more rows** |
| ≥1 production-eligible row + operator sign-off on window coverage | **Eligible to request v1.9c.4 product approval** |
| Product approval granted | Future v1.9c.4 may transcribe rows to production JSON + UI — not in v1.9c.4b |

Product approval is still required before production JSON, UI wiring, or any `publicSignalCount` change.

---

## Official source inventory

Starting points from [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) (v1.9c.1 Lane D). **Do not treat as current event rows** — operator must verify URLs and extract events manually.

| Provider | Verified location | Data type | Cadence | Notes |
|----------|-------------------|-----------|---------|-------|
| S&P DJI | https://www.spglobal.com/spdji/en/media-center/news-announcements/ | Announcement feed | Event-driven | Official public path; spike noted intermittent page fetch — verify URL at collection time |
| Nasdaq | https://ir.nasdaq.com/news-releases/ (index change announcements) | News releases with add/remove lists + effective dates | Quarterly/annual | Example path verified in spike: annual Nasdaq-100 changes |
| Nasdaq methodology | https://indexes.nasdaq.com/docs/Methodology_NDX.pdf | Methodology document | Rule-based | Supports announcement/effective-date discipline; do not commit PDF |
| FTSE Russell | https://www.lseg.com/en/ftse-russell/russell-reconstitution | Reconstitution schedules + preliminary add/delete files | Semi-annual + updates | Strong public event lane; do not commit downloaded files |

These are starting points for manual operator review, not an automated source lock or runtime feed.

---

## Handoff to v1.9c.4

When **production-eligible** rows exist in this memo:

1. Operator may **request v1.9c.4 product approval** (separate decision).
2. Approved rows are transcribed into [`data/ghostflow/artifacts/indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) only in a future approved v1.9c.4 phase.
3. Production-mode validation (`validateIndexInclusionEventProxyArtifact(..., { mode: 'production' })`), `validate-artifacts` registration, `buildSnapshot` merge, and UI card wiring remain **future work**.
4. A future display card would likely move `publicSignalCount` from **10 → 11**, requiring explicit product approval.
5. **No production JSON** should be created in v1.9c.4b.

See also [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md §15](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md#15-operator-event-intake-template-v1.9c2a-appendix) intake template and [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) future refresh discipline.
