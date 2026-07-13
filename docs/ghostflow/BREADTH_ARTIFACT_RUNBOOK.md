# GhostFlow Market Breadth Operator Packet Runbook

**Canonical intake specification for `marketBreadth`.** Documentation only — no adapter, parser, registry, or artifact writer.

**Authority:** [MARKET_BREADTH_SOURCE_FEASIBILITY.md](./MARKET_BREADTH_SOURCE_FEASIBILITY.md) (PR #133) · [REFERENCE_DATE_AND_OPERATOR_POLICY.md](./REFERENCE_DATE_AND_OPERATOR_POLICY.md)

---

## Current status banner

```text
Production breadth refresh: BLOCKED
StockCharts HTML automation: PROHIBITED WITHOUT APPROVAL
StockCharts manual production use: NOT APPROVED
Barchart production use: NOT APPROVED
Operator packet: RESEARCH / INTAKE DESIGN ONLY
Gate C reference bump: BLOCKED
```

| Item | Current posture |
|------|-----------------|
| Packet role | Intake and review architecture only |
| Provider approval | **None** by this document |
| Production JSON edit | **Do not** edit `marketBreadth.v1.json` under this runbook |
| Reference bump | **Blocked** — Gate C cannot execute until breadth source authorization is approved |
| VIX | CBOE VIX adapter implemented (PR #132) but **unwired**; does not unlock Gate C alone |

---

## 1. Purpose and non-purpose

### This document defines

- A typed **operator packet** for research and candidate intake design
- Required evidence, review states, fail-closed dispositions
- How Gate C interacts with breadth **after** source authorization exists

### This document does not

- Approve StockCharts, Barchart, or any other provider
- Approve a license purchase or derived methodology
- Change the refresh registry `sourceFormat`
- Authorize editing production artifacts
- Calculate breadth weakness, scores, or reference-date recommendations

**An operator packet cannot create source authorization.**

---

## 2. Artifact contract (unchanged)

| Item | Value |
|------|--------|
| Artifact ID | `marketBreadth` |
| File (production — do not edit under current policy) | `data/ghostflow/artifacts/marketBreadth.v1.json` |
| Candidate group | `gate_c_daily_session` |
| Partners | `volatilityRegime` |
| Acceptance | `candidate_group` |
| Reference role | `gate_c_required` |
| Lane | Score-fed equity → Structural `breadthWeakness` |
| Series definition | `sp500_percent_above_50_day_ma` |
| Observation field | `sp500Above50DayMaPercent` (percent 0–100, one decimal) |

Downstream mapper, banding, validation, and freshness remain in `lib/ghostflow/artifacts/marketBreadth.ts`. A future packet conversion would normalize **only** raw percentage + durable provenance.

`operator_packet` is already an allowed `GhostFlowSourceFormat` in refresh types. This PR does **not** change the registry entry (still planned HTML).

---

## 3. Operator packet contract

### Schema example

```text
SYNTHETIC SCHEMA EXAMPLE
NOT CURRENT MARKET DATA
NOT PRODUCTION EVIDENCE
NOT AUTHORIZATION
```

```json
{
  "packetVersion": "1",
  "artifactId": "marketBreadth",
  "candidateGroupId": "gate_c_daily_session",
  "purpose": "research_intake_only",
  "preparedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "targetObservationAsOf": "YYYY-MM-DD",
  "observation": {
    "seriesDefinition": "sp500_percent_above_50_day_ma",
    "sp500Above50DayMaPercent": 57.3,
    "units": "percent",
    "precision": 1,
    "sessionStatus": "eod_confirmed"
  },
  "primarySource": {
    "sourceFamilyId": "provider_series_id",
    "sourceName": "Provider and series name",
    "sourceLocator": "authorized source locator",
    "accessMethod": "licensed_export",
    "accessedAt": "YYYY-MM-DDTHH:mm:ssZ",
    "sourceObservationAsOf": "YYYY-MM-DD",
    "sourcePublishedAt": null,
    "authorization": {
      "status": "approved",
      "evidenceType": "license_order_form",
      "evidenceReference": "internal authorization record",
      "approvedUse": "GhostFlow production artifact and public display",
      "expiresAt": null
    }
  },
  "crossCheck": null,
  "review": {
    "semanticMatch": "confirmed",
    "sessionMatch": "confirmed",
    "sourceAuthorization": "confirmed",
    "operatorVerified": true,
    "reviewer": "operator identifier",
    "reviewedAt": "YYYY-MM-DDTHH:mm:ssZ",
    "blockingIssues": []
  },
  "disposition": "ready_for_candidate_review"
}
```

Values in the example are fabricated. Do not treat them as live market data.

---

## 4. Controlled field values

### purpose

| Value | Meaning |
|-------|---------|
| `research_intake_only` | Default under current policy |
| `candidate_intake` | Allowed **only after** source authorization is confirmed |

### sessionStatus

| Value | Meaning |
|-------|---------|
| `eod_confirmed` | Only status potentially eligible for Gate C |
| `intraday` | Block |
| `unknown` | Block |

### authorization.status

| Value | Meaning |
|-------|---------|
| `approved` | Only status that may proceed toward candidate review |
| `permission_required` | Block |
| `unknown` | Block |
| `prohibited` | Block |
| `expired` | Block |

### authorization.evidenceType

| Value | Notes |
|-------|-------|
| `written_permission` | Provider-written approval |
| `license_order_form` | Commercial Order Form / contract |
| `provider_contract` | Broader contracted data rights |
| `provider_terms` | Alone **does not** equal approval unless terms clearly authorize intended use |
| `internal_approval_record` | GhostFlow product gate record — does **not** create provider rights by itself |
| `none` | Block |

### semanticMatch / sessionMatch

`confirmed` | `mismatch` | `unknown`

### review.sourceAuthorization

`confirmed` | `blocked` | `unknown`

### disposition

| Value | Meaning |
|-------|---------|
| `research_only` | Safe default while authorization unresolved |
| `blocked_source_authorization` | Rights not approved |
| `blocked_semantic_mismatch` | Wrong universe / MA / definition |
| `blocked_session_mismatch` | Not same target session / not EOD |
| `blocked_invalid_observation` | Bad value or date |
| `ready_for_candidate_review` | Structurally complete — **not** production approval |
| `rejected` | Explicit rejection |

`ready_for_candidate_review` does **not** mean write production JSON, bump reference, or open a Gate C PR.

---

## 5. Required evidence checklist

Every packet must record:

| Category | Required items |
|----------|----------------|
| Identity | artifact ID, candidate-group ID, target session |
| Access | operator access timestamp |
| Source | owner, series name, series definition, locator, access method |
| Observation | session date, EOD vs intraday status, raw %, units, precision, publication date when available |
| Authorization | status, evidence type, evidence reference, approved-use description, expiration when applicable |
| Review | semantic equivalence, same-session match, cross-check when authorized and available, operator identity, reviewer identity, blocking issues |
| Outcome | final packet disposition |

### Fail closed if any are missing or unresolved

- Authorized production use
- Exact or explicitly approved semantic match
- EOD observation (`sessionStatus: eod_confirmed`)
- Valid observation date
- Finite percentage from 0 through 100
- One-decimal storage precision
- Same target session
- Human review

---

## 6. Source-authorization gate

Production eligibility requires **all** of:

1. Bobby’s explicit product approval
2. Provider rights permitting the intended GhostFlow use
3. A retained authorization reference
4. Exact or approved semantic match
5. Completed human review

Bobby’s approval alone does **not** create provider rights.  
Provider permission alone does **not** approve a GhostFlow methodology or source change.  
**Both** gates must be satisfied.

Do **not** treat StockCharts or Barchart as approved sources in this runbook.

---

## 7. Evidence retention boundaries

### May be durable (documentation / future candidate records)

- Source owner, series identity, canonical locator
- Access timestamp, observation date, published date when available
- Normalized value
- Authorization status and authorization record reference
- Content SHA-256 when an authorized export exists
- Adapter or intake version
- Operator/reviewer decision and blocking issues

### Must not be committed

- Provider passwords, cookies, API keys, session tokens, account identifiers
- Private contracts unless explicitly approved for retention
- Raw restricted downloads
- Screenshots unless rights and storage are separately approved
- Local file paths, temporary files
- Full page HTML, chart images, OCR output, browser cache

Raw authorized exports, if ever used, remain temporary unless a separate retention decision approves otherwise.

---

## 8. Validation and rejection rules

Reject or block packets when:

- Source authorization not approved
- Authorization expired
- Provider use scope does not include GhostFlow
- Wrong index universe
- Wrong moving-average definition
- Intraday value
- Missing observation date
- Future observation date
- Weekend date without documented valid market-session reason
- Value below 0 or above 100
- Non-finite value
- More than one decimal without explicit normalization
- Primary and cross-check dates misaligned
- Vendors materially disagree without resolution
- Cross-check substituted for primary source
- Missing operator review
- Missing authorization reference

A close vendor cross-check supports semantic review only. It does **not** grant data rights and must not define a numerical tolerance as proof of authorization.

---

## 9. Gate C interaction

Canonical Gate C rule (preserved):

```text
volatilityRegime + marketBreadth
same observation session
atomic candidate group
human approval required
```

**New prerequisite after PR #133:**

```text
marketBreadth source authorization must be approved before the Gate C package can be eligible for production review.
```

Both daily observations being numerically “available” is **insufficient**. The breadth observation must come from an authorized source.

### Operator packet alone must not

- Run the VIX adapter
- Generate a candidate
- Update an artifact
- Calculate breadth weakness
- Calculate scores
- Recommend a reference date
- Edit `reference.ts`
- Write history
- Open a PR

Even an authorized and valid packet only becomes `ready_for_candidate_review`. A separate future implementation would convert it into a normalized candidate.

---

## 10. Synthetic examples

### Example A — blocked (permission required)

```text
SYNTHETIC — NOT MARKET DATA — NOT PRODUCTION EVIDENCE
```

```json
{
  "packetVersion": "1",
  "artifactId": "marketBreadth",
  "candidateGroupId": "gate_c_daily_session",
  "purpose": "research_intake_only",
  "preparedAt": "2026-08-01T20:00:00.000Z",
  "targetObservationAsOf": "2026-07-31",
  "observation": {
    "seriesDefinition": "sp500_percent_above_50_day_ma",
    "sp500Above50DayMaPercent": 54.2,
    "units": "percent",
    "precision": 1,
    "sessionStatus": "eod_confirmed"
  },
  "primarySource": {
    "sourceFamilyId": "unresolved_public_series",
    "sourceName": "Unresolved public breadth page",
    "sourceLocator": "https://example.invalid/research-only",
    "accessMethod": "browser_view",
    "accessedAt": "2026-08-01T19:45:00.000Z",
    "sourceObservationAsOf": "2026-07-31",
    "sourcePublishedAt": null,
    "authorization": {
      "status": "permission_required",
      "evidenceType": "none",
      "evidenceReference": null,
      "approvedUse": null,
      "expiresAt": null
    }
  },
  "crossCheck": null,
  "review": {
    "semanticMatch": "unknown",
    "sessionMatch": "confirmed",
    "sourceAuthorization": "blocked",
    "operatorVerified": true,
    "reviewer": "operator-example",
    "reviewedAt": "2026-08-01T20:05:00.000Z",
    "blockingIssues": ["authorization.status is permission_required"]
  },
  "disposition": "blocked_source_authorization"
}
```

This observation **cannot** enter Gate C.

### Example B — structurally complete but hypothetical

```text
HYPOTHETICAL ONLY
NO PROVIDER HAS BEEN APPROVED
NOT A PRODUCTION PACKET
```

```json
{
  "packetVersion": "1",
  "artifactId": "marketBreadth",
  "candidateGroupId": "gate_c_daily_session",
  "purpose": "candidate_intake",
  "preparedAt": "2026-09-15T21:00:00.000Z",
  "targetObservationAsOf": "2026-09-14",
  "observation": {
    "seriesDefinition": "sp500_percent_above_50_day_ma",
    "sp500Above50DayMaPercent": 61.4,
    "units": "percent",
    "precision": 1,
    "sessionStatus": "eod_confirmed"
  },
  "primarySource": {
    "sourceFamilyId": "fictional_licensed_sp500_breadth",
    "sourceName": "Fictional Licensed S&P 500 % Above 50-Day MA Feed",
    "sourceLocator": "https://example.invalid/licensed/breadth/export",
    "accessMethod": "licensed_export",
    "accessedAt": "2026-09-15T20:30:00.000Z",
    "sourceObservationAsOf": "2026-09-14",
    "sourcePublishedAt": "2026-09-15",
    "authorization": {
      "status": "approved",
      "evidenceType": "license_order_form",
      "evidenceReference": "internal-auth-record-EXAMPLE-ONLY",
      "approvedUse": "GhostFlow production artifact and public display",
      "expiresAt": null
    }
  },
  "crossCheck": null,
  "review": {
    "semanticMatch": "confirmed",
    "sessionMatch": "confirmed",
    "sourceAuthorization": "confirmed",
    "operatorVerified": true,
    "reviewer": "reviewer-example",
    "reviewedAt": "2026-09-15T21:10:00.000Z",
    "blockingIssues": []
  },
  "disposition": "ready_for_candidate_review"
}
```

Do **not** use StockCharts or Barchart as the approved-provider example. No provider has been approved.

---

## 11. Downstream mapping reminder (read-only)

Participation **strength** (% above 50DMA) maps inversely to **breadth weakness** in code. This runbook does **not** recalculate or authorize score impact:

| Strength % | Weakness proxy |
|---|---|
| ≥ 75 | 20 |
| 60 | 38 |
| 50 | 52 |
| 40 | 68 |
| 30 | 80 |
| ≤ 20 | 92 |

---

## 12. Historical procedure archive

```text
Historical procedure — do not execute under current source-authorization policy.
```

Before PR #133, operator docs described:

1. Opening StockCharts `$SPXA50R`
2. Copying an EOD reading and optionally cross-checking Barchart `$S5FI`
3. Editing `marketBreadth.v1.json` and setting `verified_manual` / `manual_unverified`
4. Bumping `GHOSTFLOW_REFERENCE_AS_OF` when VIX and breadth aligned

That procedure is **not executable** while breadth source rights remain unresolved. Historical committed artifacts remain historical facts; this document does not re-approve their source rights and does not instruct operators to repeat the old transcription path.

See [MARKET_BREADTH_SOURCE_FEASIBILITY.md](./MARKET_BREADTH_SOURCE_FEASIBILITY.md) for the authorization audit.
