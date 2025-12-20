# Ghost Allocator Documentation Index

This directory contains documentation for the Ghost Allocator repository.

## Start Here

**I want to understand the app quickly:**
- Read the [root README](../README.md) for a high-level overview
- Then read [flows.md](flows.md) to understand the two user paths (Voya-only vs Voya + Schwab)

**I want to change portfolio logic:**
- Start with [ghost-sleeve-overview.md](ghost-sleeve-overview.md) to understand how sleeves map to funds
- Then read [flows.md](flows.md) to see where the computation functions live
- Key files: `lib/portfolioEngine.ts`, `lib/voya.ts`, `lib/voyaDelta.ts`, `lib/sleeves.ts`

**I'm working on GhostRegime:**
- Start with [ghostregime/RUNBOOK.md](ghostregime/RUNBOOK.md) for operations
- See [ghostregime/PLAN.md](ghostregime/PLAN.md) for architecture
- Check [ghostregime/IMPORT_SPEC.md](ghostregime/IMPORT_SPEC.md) for data format

## Ghost Allocator Docs

### User Flows
- **[flows.md](flows.md)** - Detailed explanation of the two main user flows: Voya-only and Voya + Schwab. Includes inputs, computation functions, current mix + delta logic, and UI display structure.

### Ghost Sleeves
- **[ghost-sleeve-overview.md](ghost-sleeve-overview.md)** - Dev-focused explanation of Ghost sleeves, their roles, and how they map to actual funds/ETFs (Schwab vs Voya). Includes where the config lives in code.

### Voya Fund Menu
- **[voya-menu.md](voya-menu.md)** - Complete listing of all OKC Voya 457 funds with tickers, vehicle types, and canonical IDs. Canonical source is `lib/voyaFunds.ts`.

## GhostRegime Docs

### Operations
- **[ghostregime/RUNBOOK.md](ghostregime/RUNBOOK.md)** - Daily workflow, how to run manually, what to check when it fails, and exact curl commands for endpoints.

### Planning & Specs
- **[ghostregime/PLAN.md](ghostregime/PLAN.md)** - High-level plan and architecture for GhostRegime.
- **[ghostregime/IMPORT_SPEC.md](ghostregime/IMPORT_SPEC.md)** - CSV import specification for seed data.
- **[ghostregime/VALIDATION.md](ghostregime/VALIDATION.md)** - Validation rules and checks for GhostRegime data.

## Seed Data Docs

- **[../data/ghostregime/seed/README.md](../data/ghostregime/seed/README.md)** - GhostRegime seed CSV format, file status, expected schema, and validation checks.
