# Simulation & Report V2 Migration Progress

## Current: Phase 4a — Task 6

## Branch Strategy

Each phase gets a feature branch per repo, based on the migration base branches.

| Repo | Path | Base branch | Feature branch pattern |
|---|---|---|---|
| policyengine.py | `~/Documents/PolicyEngine/policyengine.py` | `app-v2-migration` | `feat/sim-report-migration/phase-N` |
| policyengine-api-v2-alpha | `~/Documents/PolicyEngine/policyengine-api-v2-alpha` | `app-v2-migration` | `feat/sim-report-migration/phase-N` |
| policyengine-app-v2 | `~/Documents/PolicyEngine/policyengine-app-v2` | `move-to-api-v2` | `feat/sim-report-migration/phase-N` |

**Rules:**
- Feature branches are created at the start of each phase (with user approval)
- All task commits within a phase go to that phase's feature branch
- Merging feature branches into base branches requires explicit user instruction
- Pushing to remote requires explicit user instruction

## Active Branches

_(Updated as branches are created)_

| Repo | Current branch | Created | Status |
|---|---|---|---|
| policyengine.py | `feat/sim-report-migration/phase-4` | 2026-02-20 | Phase 4 complete |
| policyengine-api-v2-alpha | `feat/sim-report-migration/phase-4a` | 2026-02-23 | Active |
| policyengine-app-v2 | `feat/sim-report-migration/phase-4a` | 2026-02-23 | Active |

---

## Phase 1: Foundation (API v2 alpha)

- [x] 1. Fix Alembic migration branch conflict (2026-02-18)
- [x] 2. Add `filter_field`/`filter_value` to `simulations` table (2026-02-18)
- [x] 3. Remove `parent_report_id` from Report model (2026-02-18)
- [x] 4. Create `user_simulation_associations` table + CRUD endpoints (2026-02-18)
- [x] 5. Create `user_report_associations` table + CRUD endpoints (2026-02-19)
- [x] 6. Create standalone simulation endpoints (2026-02-19)
- [x] 7. Create missing Modal functions (2026-02-19)
- [x] 8. Create `_run_local_economy_comparison_us` local fallback (2026-02-19)

---

## Phase 2: V1 Output Parity (API v2 alpha + .py)

- [x] 1. Wire up poverty computation (overall) in economy comparison (2026-02-19)
- [x] 2. Wire up inequality computation (2026-02-19)
- [x] 3. Add poverty by age group (2026-02-20)
- [x] 4. Add poverty by gender (2026-02-20)
- [x] 5. Add poverty by race (2026-02-20)
- [x] 6. Add budget summary (2026-02-20)
- [x] 7. Add intra-decile breakdown (2026-02-20)
- [x] 8. Add detailed budget / per-program breakdown (2026-02-20)
- [x] 9. Create `/analysis/economy` and `/analysis/household` endpoints (2026-02-20)

---

## Phase 3: Expensive Computations (.py + API v2 alpha)

- [x] 1. Congressional district impact (US) (2026-02-20)
- [x] 2. UK constituency impact (2026-02-20)
- [x] 3. UK local authority impact (2026-02-20)
- [ ] 4. Labor supply response — **DEFERRED** (detailed plan: `.claude-plan/DEFERRED_LSR_PLAN.md`)
- [ ] 5. Cliff impact — **DEFERRED** (detailed plan: `.claude-plan/DEFERRED_CLIFF_PLAN.md`)
- [x] 6. Wealth decile impact (UK) + refactor intra-decile to policyengine.py (2026-02-20)
- [x] 7. Write tests for Phase 3 changes (2026-02-20)
  - [x] .py: Tests for new output classes (IntraDecileImpact, constituency, local authority, wealth decile)
  - [x] API: Tests for new response fields and computation wiring
  - [x] All new tests pass

---

## Phase 4: Custom Modules (API v2 alpha)

- [x] 1. Define module registry with computation functions (2026-02-20)
- [x] 2. Create `/analysis/options` endpoint (2026-02-23)
- [x] 3. Create `/analysis/economy-custom` endpoint (2026-02-23)
- [x] 4. Refactor Modal economy comparison functions into composable modules (2026-02-23)

---

## Phase 4a: Lazy Metadata Loading (API v2 alpha + app v2)

_Full spec: `.claude-plan/LAZY_METADATA_SPEC.md`_

- [x] 1. `POST /parameters/by-name` — fetch specific parameters by name list (2026-02-23)
- [x] 2. `GET /parameters/children` — fetch direct children of a parameter path (2026-02-23)
- [x] 3. `POST /variables/by-name` — fetch specific variables by name list (2026-02-23)
- [x] 4. `GET /tax-benefit-models/by-country/{country_id}` — model + latest version (2026-02-23)
- [x] 5. Replace bulk parameter fetch with lazy tree loading (2026-02-23)
- [ ] 6. Batch-fetch policy parameters on demand
- [ ] 7. Add localStorage caching keyed on model version
- [ ] 8. Move variable fetch to background/cache-first

---

## Phase 5: App Migration (app v2)

- [ ] 1. Create v2 API modules
- [ ] 2. Create v2 adapters
- [ ] 3. Rewrite `SocietyWideCalcStrategy` for v2
- [ ] 4. Update `HouseholdCalcStrategy` for v2 analysis endpoint
- [ ] 5. Update `ResultPersister` for v2
- [ ] 6. Wire up association stores to v2 API
- [ ] 7. Update hooks
- [ ] 8. Deprecate v1 API files

---

## Decisions Log

- 2026-02-20: LSR deferred — complex branching mechanism, missing variables, needs design decisions
- 2026-02-20: Cliff impact deferred — expensive per-person marginal tax rate calculation
- 2026-02-20: Wealth decile uses `decile_variable` param on DecileImpact/IntraDecileImpact (qcut default, pre-computed grouping when specified)
- 2026-02-20: All intra-decile computation migrated from API's `api/intra_decile.py` to policyengine.py's `IntraDecileImpact` output class
