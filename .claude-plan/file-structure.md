# Proposed File Structure After Refactor

## New Directory Organization

```
app/src/
├── pages/
│   ├── ReportOutput.page.tsx           [MODIFIED] Router/dispatcher only
│   ├── EconomyReportOutput.page.tsx    [NEW] Economy-specific page
│   └── HouseholdReportOutput.page.tsx  [NEW] Household-specific page
│
├── hooks/
│   ├── economy/                        [NEW] Economy-specific hooks
│   │   ├── useEconomyCalculation.ts    [NEW] Economy calc management
│   │   └── useEconomyHydration.ts      [NEW] Economy cache hydration
│   │
│   ├── household/                      [NEW] Household-specific hooks
│   │   ├── useSimulationCalculation.ts [NEW] Single sim calculation
│   │   ├── useHouseholdSimulations.ts  [NEW] Read sims from cache
│   │   └── useHouseholdProgress.ts     [NEW] Simple progress tracking
│   │
│   ├── useUserReports.ts               [KEEP] Unchanged - used by both
│   ├── useCurrentCountry.ts            [KEEP] Unchanged - used by both
│   └── [REMOVED]
│       ├── useAggregatedCalculationStatus.ts  ❌ Delete (too complex)
│       ├── useStartCalculationOnLoad.ts       ❌ Delete (economy-specific logic moves to economy/)
│       ├── useHydrateCalculationCache.ts      ❌ Delete (split into economy/household)
│       └── useCalculationStatus.ts            ❌ Delete (economy-specific logic moves to economy/)
│
├── libs/
│   ├── calculations/
│   │   ├── economy/                    [NEW] Economy calculation logic
│   │   │   ├── CalcOrchestrator.ts     [MOVED] From calculations/
│   │   │   ├── CalcOrchestratorManager.ts [MOVED] From calculations/
│   │   │   ├── EconomyCalcStrategy.ts  [MOVED] From strategies/
│   │   │   └── EconomyResultPersister.ts [NEW] Economy-specific persistence
│   │   │
│   │   ├── household/                  [NEW] Household calculation logic
│   │   │   ├── calculateHousehold.ts   [NEW] Direct API wrapper
│   │   │   └── checkReportComplete.ts  [NEW] Report completion logic
│   │   │
│   │   └── [REMOVED]
│   │       ├── CalcOrchestrator.ts              ❌ Move to economy/
│   │       ├── CalcOrchestratorManager.ts       ❌ Move to economy/
│   │       ├── ResultPersister.ts               ❌ Delete (split into economy/household)
│   │       └── strategies/
│   │           ├── HouseholdCalcStrategy.ts     ❌ Delete (replaced by direct hook)
│   │           ├── EconomyCalcStrategy.ts       ❌ Move to economy/
│   │           ├── CalcStrategyFactory.ts       ❌ Delete (no longer needed)
│   │           └── types.ts                     ❌ Delete (no longer needed)
│   │
│   └── queries/
│       ├── calculationQueries.ts       [MODIFIED] Economy only
│       └── [REMOVED]
│           └── (household logic)       ❌ Remove household branches
│
├── components/
│   ├── report-output/
│   │   ├── economy/                    [NEW] Economy-specific components
│   │   │   ├── EconomyOverview.tsx     [MOVED] From parent
│   │   │   ├── EconomyLoadingState.tsx [NEW] Loading UI for economy
│   │   │   └── EconomyErrorState.tsx   [NEW] Error UI for economy
│   │   │
│   │   └── household/                  [NEW] Household-specific components
│   │       ├── HouseholdOverview.tsx   [MOVED] From parent
│   │       ├── SimulationCard.tsx      [NEW] Shows single simulation
│   │       └── SimulationProgress.tsx  [NEW] Progress for one sim
│   │
│   └── [REMOVED]
│       ├── LoadingPage.tsx             ❌ Delete (replace with economy/household specific)
│       └── ErrorPage.tsx               ❌ Delete (replace with economy/household specific)
│
├── types/
│   ├── calculation/
│   │   ├── economy/                    [NEW] Economy-specific types
│   │   │   ├── EconomyCalcConfig.ts    [NEW] Economy calculation config
│   │   │   └── EconomyCalcStatus.ts    [NEW] Economy status types
│   │   │
│   │   ├── household/                  [NEW] Household-specific types
│   │   │   ├── SimulationCalcStatus.ts [NEW] Simple status for one sim
│   │   │   └── HouseholdProgress.ts    [NEW] Progress tracking
│   │   │
│   │   └── [REMOVED]
│   │       ├── CalcStartConfig.ts      ❌ Delete (split into economy/household)
│   │       ├── AggregatedCalcStatus.ts ❌ Delete (too complex)
│   │       └── CalcMetadata.ts         ❌ Delete (split into economy/household)
│   │
│   └── ingredients/
│       ├── Report.ts                   [KEEP] Unchanged
│       ├── Simulation.ts               [KEEP] Unchanged
│       └── ...                         [KEEP] All other types unchanged
│
└── api/
    ├── economy.ts                      [KEEP] Unchanged
    ├── householdCalculation.ts         [KEEP] Unchanged
    ├── simulation.ts                   [KEEP] Unchanged
    └── report.ts                       [KEEP] Unchanged
```

---

## Key Changes Summary

### Created (New Files)
- 2 page components (economy/household split)
- 6 hooks (3 economy, 3 household)
- 5 lib files (economy orchestration + household helpers)
- 6 component files (economy/household UI)
- 4 type files (economy/household specific)

**Total new: ~23 files**

### Deleted (Removed Files)
- 4 complex hooks (aggregation, orchestration, hydration)
- 3 strategy files (factory, interface, household strategy)
- 1 shared persister
- 2 shared loading/error pages
- 3 shared type files

**Total deleted: ~13 files**

### Modified (Changed Files)
- `ReportOutput.page.tsx` - Simplified to router
- `calculationQueries.ts` - Economy only
- Test files for moved components

**Total modified: ~5 files**

---

## Net Result

**Before**: ~50 files with complex shared logic
**After**: ~60 files with clear separation

**Code volume**: Similar total lines
**Complexity**: Massively reduced per-file
**Maintainability**: Much higher
**Debuggability**: Much easier

---

## Directory Philosophy

### Economy (`/economy/`)
Contains EVERYTHING for async, report-level, polling-based calculations:
- Orchestration (manager, orchestrator)
- Strategy (economy calc strategy)
- Persistence (economy result persister)
- Hooks (calculation, hydration, progress)
- Components (overview, loading, error)
- Types (config, status, metadata)

### Household (`/household/`)
Contains EVERYTHING for sync, simulation-level, blocking calculations:
- Calculation (direct API wrapper)
- Completion check (report marking)
- Hooks (simulation calc, sims reader, progress)
- Components (overview, simulation card, progress)
- Types (status, progress)

### Shared (`/` root level)
ONLY truly shared code:
- `useUserReports.ts` - Data fetching (both use)
- `useCurrentCountry.ts` - Country context (both use)
- API clients - Backend communication (both use)
- Ingredient types - Core domain models (both use)

**Rule**: If it has `if (isHousehold)` it should be split, not shared.

---

## Migration Safety

### Phase 1: Build household/ (No deletions)
- Add all household/ files
- Add HouseholdReportOutput.page.tsx
- Update ReportOutput.page.tsx router
- Test household reports work

✅ **Safe**: Economy code untouched, old code still exists

### Phase 2: Build economy/ (Move, don't delete)
- Copy existing code into economy/
- Add EconomyReportOutput.page.tsx
- Update ReportOutput.page.tsx router
- Test economy reports work

✅ **Safe**: Both flows use separate code, old code still exists

### Phase 3: Delete old shared code
- Remove old hooks/
- Remove old libs/calculations/ (non-economy)
- Remove shared strategies
- Update tests

✅ **Safe**: Both flows proven working in Phase 1-2

---

## File Size Expectations

### Large Files (200+ lines)
- `HouseholdReportOutput.page.tsx` (~150 lines) - Page layout + logic
- `EconomyReportOutput.page.tsx` (~200 lines) - Page layout + orchestration
- `CalcOrchestrator.ts` (~150 lines) - Async orchestration
- `useEconomyCalculation.ts` (~120 lines) - Economy calc hook

### Medium Files (50-150 lines)
- `useSimulationCalculation.ts` (~80 lines) - Simple calculation hook
- `checkReportComplete.ts` (~60 lines) - Aggregation logic
- `HouseholdOverview.tsx` (~100 lines) - UI component
- `EconomyOverview.tsx` (~150 lines) - UI component

### Small Files (< 50 lines)
- `useHouseholdSimulations.ts` (~20 lines) - Cache reader
- `calculateHousehold.ts` (~30 lines) - API wrapper
- `SimulationCard.tsx` (~40 lines) - UI component
- Type definition files (~20 lines each)

**Philosophy**: Many small, focused files > Few large, complex files
