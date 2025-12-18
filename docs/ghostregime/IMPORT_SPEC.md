# GhostRegime Import Specification

## CSV Format

The seed CSV file `ghostregime_replay_history.csv` should contain historical GhostRegime data for dates ≤ 2025-11-28 UTC.

## Required Columns

- `date`: ISO date string (YYYY-MM-DD)
- `regime`: One of "GOLDILOCKS", "REFLATION", "INFLATION", "DEFLATION"
- `risk_regime`: One of "RISK ON", "RISK OFF"
- `risk_score`: Number (risk axis vote score)
- `infl_score`: Number (total inflation score)
- `infl_core_score`: Number (core inflation vote score)
- `infl_sat_score`: Number (satellite inflation score)
- `stocks_vams_state`: Number (-2, 0, or 2)
- `gold_vams_state`: Number (-2, 0, or 2)
- `btc_vams_state`: Number (-2, 0, or 2)
- `stocks_target`: Number (0-1)
- `gold_target`: Number (0-1)
- `btc_target`: Number (0-1)
- `stocks_scale`: Number (0-1)
- `gold_scale`: Number (0-1)
- `btc_scale`: Number (0-1)
- `stocks_actual`: Number (0-1)
- `gold_actual`: Number (0-1)
- `btc_actual`: Number (0-1)
- `cash`: Number (0-1)
- `flip_watch_status`: One of "NONE", "BREWING", "PENDING_CONFIRMATION", "STRONG_FLIP"
- `source`: "replay" (for seed data)

## Optional Columns

- `stale`: Boolean (true if data is stale)
- `stale_reason`: String (reason for stale status)

## Date Format

- ISO 8601 date format: `YYYY-MM-DD`
- All dates should be in UTC
- Dates should be sorted ascending

## Validation Rules

1. All required columns must be present
2. Date format must be valid ISO date
3. Regime values must match allowed enum values
4. Allocation values (targets, actuals, cash) must sum to 1.0 within 1e-6 tolerance
5. VAMS states must be -2, 0, or 2
6. Scales must be 0, 0.5, or 1.0

## Sample Row

```csv
date,regime,risk_regime,risk_score,infl_score,infl_core_score,infl_sat_score,stocks_vams_state,gold_vams_state,btc_vams_state,stocks_target,gold_target,btc_target,stocks_scale,gold_scale,btc_scale,stocks_actual,gold_actual,btc_actual,cash,flip_watch_status,source
2025-11-28,GOLDILOCKS,RISK ON,2,0,0,0,2,0,2,0.6,0.3,0.1,1,0.5,1,0.6,0.15,0.1,0.15,NONE,replay
```




