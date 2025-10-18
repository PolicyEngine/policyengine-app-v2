# Household Calculation Architecture Refactor

## Current Problems

### 1. **Architectural Mismatch**
- Economy calculations: Single calculation at **report level**, result stored in `report.output`
- Household calculations: N calculations at **simulation level**, results stored in `simulation.output`
- Both try to use the same infrastructure, causing confusion and bugs

### 2. **Specific Issues**
- **Duplicate queries**: `useUserReportById` fetches simulations, then `useHydrateCalculationCache` tries to fetch them again
- **Infinite loops**: Dependencies in `useAggregatedCalculationStatus` change on every render (line 245-247)
- **Complex aggregation**: Household reports need to aggregate multiple simulation results
- **Cache hydration timing**: Simulations might not be in cache when hydration runs
- **Over-engineered**: Household calculations are SYNCHRONOUS but we treat them like async with polling

### 3. **Root Cause**
The system was designed for **economy** (async, report-level) and we're forcing **household** (sync, simulation-level) into the same patterns.

---

## Proposed Architecture

### Core Principle: **Separation of Concerns**

**Keep economy flow UNCHANGED**. Create a **parallel, simpler flow for household**.

---

## New Structure

### 1. **Two Separate Report Output Flows**

```
├── ReportOutput.page.tsx (router/dispatcher)
│   ├── If economy → EconomyReportOutput.page.tsx
│   └── If household → HouseholdReportOutput.page.tsx
```

**Why**: Economy and household have fundamentally different needs. Stop trying to share logic.

---

### 2. **Economy Flow (UNCHANGED)**

```
EconomyReportOutput.page.tsx
  ↓
useUserReportById(reportId)
  → Fetches report with report.output
  ↓
useHydrateCalculationCache
  → If report.output exists, hydrate calculation cache at REPORT level
  ↓
useCalculationStatus(reportId, 'report')
  → Read from calculation cache
  ↓
useStartCalculationOnLoad
  → If no output, start calculation at REPORT level
  ↓
CalcOrchestrator
  → EconomyCalcStrategy
  → Async polling
  → Persist to report.output
  ↓
Display: EconomyOverview
```

**No changes needed here** - this already works.

---

### 3. **Household Flow (SIMPLIFIED)**

```
HouseholdReportOutput.page.tsx
  ↓
useUserReportById(reportId)
  → Fetches report
  → Fetches simulations (already has simulation.output)
  ↓
useHouseholdSimulations(reportId)
  → Simply reads simulations from cache (no new queries!)
  → Returns { simulation1, simulation2 }
  ↓
FOR EACH simulation:
  ↓
  useSimulationCalculation(simulationId)
    → Check if simulation.output exists
    → If yes: Return { status: 'complete', result: simulation.output }
    → If no: Start calculation
    ↓
    startHouseholdCalculation(simulationId)
      → Direct API call to household endpoint
      → BLOCKS for 30-45s (it's synchronous!)
      → Returns result immediately
      → Update simulation.output in database
      → Invalidate simulation cache
      → Check if all simulations complete → mark report complete
  ↓
Display: HouseholdOverview
  → Receives [household1, household2]
```

---

## Key Simplifications

### A. **No Aggregation Hook**
- Remove `useAggregatedCalculationStatus` for household
- Each simulation is independent
- Component reads both simulations separately
- UI shows "Simulation 1: Computing..." and "Simulation 2: Complete"

### B. **No Polling**
- Household calculations are synchronous
- No `QueryObserver`, no `refetchInterval`
- Just: Call API → Wait → Get result → Done

### C. **No Orchestrator/Manager**
- `CalcOrchestrator` and `CalcOrchestratorManager` designed for async polling
- Household doesn't need this complexity
- Replace with simple `useSimulationCalculation` hook

### D. **Direct Cache Reads**
- `useUserReportById` already fetches simulations
- Just read from cache, don't create new queries
- No hydration gymnastics

---

## New Files to Create

### 1. `HouseholdReportOutput.page.tsx`
```typescript
/**
 * Dedicated page for household reports
 * Simpler than ReportOutput.page.tsx - no shared logic with economy
 */
export function HouseholdReportOutput() {
  const { reportId } = useParams();
  const { report, simulations } = useUserReportById(reportId);

  // Simple: Just read simulations from cache and check their outputs
  const sim1Result = simulations[0]?.output;
  const sim2Result = simulations[1]?.output;

  // Start calculations if needed (independent, no orchestration)
  useSimulationCalculation(simulations[0]?.id, report?.id);
  useSimulationCalculation(simulations[1]?.id, report?.id);

  return (
    <HouseholdOverview
      outputs={[sim1Result, sim2Result].filter(Boolean)}
    />
  );
}
```

### 2. `useSimulationCalculation.ts`
```typescript
/**
 * Simple hook for a single simulation calculation
 * No aggregation, no polling, no orchestration
 */
export function useSimulationCalculation(
  simulationId: string,
  reportId: string
) {
  const queryClient = useQueryClient();
  const country = useCurrentCountry();

  return useQuery({
    queryKey: ['simulation-calculation', simulationId],
    queryFn: async () => {
      // Check if already has output
      const sim = queryClient.getQueryData<Simulation>(
        simulationKeys.byId(simulationId)
      );

      if (sim?.output) {
        return { status: 'complete', result: sim.output };
      }

      // Start calculation (synchronous!)
      const result = await fetchHouseholdCalculation(
        country,
        sim.populationId,
        sim.policyId
      );

      // Update simulation in database
      await updateSimulationOutput(country, simulationId, result);

      // Invalidate cache to refetch
      queryClient.invalidateQueries({
        queryKey: simulationKeys.byId(simulationId)
      });

      // Check if all simulations complete
      await checkAndMarkReportComplete(reportId, queryClient);

      return { status: 'complete', result };
    },
    enabled: !!simulationId,
    staleTime: Infinity, // Never refetch
  });
}
```

### 3. `useHouseholdSimulations.ts`
```typescript
/**
 * Simply reads simulations from cache (already fetched by useUserReportById)
 * No new queries, no duplicates
 */
export function useHouseholdSimulations(reportId: string) {
  const queryClient = useQueryClient();

  const report = queryClient.getQueryData<Report>(
    reportKeys.byId(reportId)
  );

  const simulations = report?.simulationIds.map(id =>
    queryClient.getQueryData<Simulation>(simulationKeys.byId(id))
  ).filter(Boolean) || [];

  return {
    simulation1: simulations[0],
    simulation2: simulations[1],
  };
}
```

### 4. `checkAndMarkReportComplete.ts`
```typescript
/**
 * After a simulation completes, check if ALL simulations are done
 * If yes, aggregate outputs and mark report complete
 */
export async function checkAndMarkReportComplete(
  reportId: string,
  queryClient: QueryClient
) {
  const report = queryClient.getQueryData<Report>(
    reportKeys.byId(reportId)
  );

  if (!report) return;

  // Get all simulations
  const simulations = report.simulationIds.map(id =>
    queryClient.getQueryData<Simulation>(simulationKeys.byId(id))
  ).filter(Boolean);

  // Check if all complete
  const allComplete = simulations.every(s => s.status === 'complete');

  if (!allComplete) return;

  // Aggregate outputs
  const outputs = simulations.map(s => s.output).filter(Boolean);

  // Mark report complete
  const updatedReport: Report = {
    ...report,
    status: 'complete',
    output: outputs,
  };

  await markReportCompleted(
    report.countryId,
    reportId,
    updatedReport
  );

  // Invalidate report cache
  queryClient.invalidateQueries({
    queryKey: reportKeys.byId(reportId)
  });
}
```

---

## Files to Keep (Economy Only)

These remain **unchanged** and only used by economy reports:

- `CalcOrchestrator.ts` - Async polling orchestration
- `CalcOrchestratorManager.ts` - Managing multiple orchestrators
- `useStartCalculationOnLoad.ts` - Starting calculations with configs
- `useAggregatedCalculationStatus.ts` - Aggregating statuses
- `EconomyCalcStrategy.ts` - Economy calculation strategy
- `EconomyReportOutput.page.tsx` (to be created from current ReportOutput)

---

## Files to Simplify/Remove for Household

### Remove entirely:
- ❌ `HouseholdCalcStrategy.ts` - Replace with direct API call in hook
- ❌ No need for strategy pattern when there's only one simple operation

### Simplify:
- `ResultPersister.ts` - Remove household-specific logic, move to `checkAndMarkReportComplete`
- `useHydrateCalculationCache.ts` - Remove household branch, economy only
- `useCalculationStatus.ts` - Can be removed for household, or kept for economy only

---

## Migration Plan

### Phase 1: Create Parallel Household Flow
1. Create `HouseholdReportOutput.page.tsx`
2. Create `useSimulationCalculation.ts`
3. Create `useHouseholdSimulations.ts`
4. Create `checkAndMarkReportComplete.ts`
5. Update `ReportOutput.page.tsx` to route:
   ```typescript
   if (outputType === 'household') {
     return <HouseholdReportOutput />;
   } else {
     return <EconomyReportOutput />;
   }
   ```

### Phase 2: Test Household Flow
1. Verify no duplicate queries
2. Verify no infinite loops
3. Verify calculations start and complete
4. Verify outputs display correctly
5. Verify report marked complete after all simulations

### Phase 3: Clean Up Shared Code
1. Remove household logic from `ResultPersister`
2. Remove household logic from `useHydrateCalculationCache`
3. Remove household logic from `useStartCalculationOnLoad`
4. Remove `HouseholdCalcStrategy.ts`
5. Update `CalcOrchestrator` to only handle economy

### Phase 4: Verify Economy Unchanged
1. Test economy reports still work
2. Verify no regressions
3. Confirm same behavior as before refactor

---

## Benefits

### 1. **Simplicity**
- Household flow is 1/3 the code
- No orchestration, no polling, no aggregation complexity
- Just: Fetch → Check → Calculate if needed → Display

### 2. **No More Bugs**
- No duplicate queries (direct cache reads)
- No infinite loops (no complex dependencies)
- No timing issues (synchronous execution)

### 3. **Maintainability**
- Clear separation: "This is household, this is economy"
- Easy to debug: Follow one linear flow
- Easy to modify: Change household without touching economy

### 4. **Performance**
- Fewer queries
- Fewer re-renders
- Simpler dependency trees

---

## Risk Mitigation

### "What if we break economy?"
- **Mitigation**: We don't touch any economy files in Phase 1-2
- Only after household works do we clean up shared code
- Economy flow remains identical until Phase 3

### "What if we need shared logic later?"
- **Reality**: There is NO shared logic
- Economy: Async, report-level, polling, aggregated result
- Household: Sync, simulation-level, blocking, array of results
- They're fundamentally different operations

### "What about code duplication?"
- **Answer**: Some duplication is good
- Better than incorrect abstraction
- "Duplication is far cheaper than the wrong abstraction" - Sandi Metz
- Current "shared" code has so many conditionals it's already duplicated

---

## Summary

**Current state**: One complex system trying to handle two different patterns

**Proposed state**: Two simple systems, each optimized for its pattern

**Key insight**: Economy and household calculations are as different as "fetch a file" vs "upload a file". Stop treating them the same.

**Action**: Build household flow from scratch, keep economy flow unchanged, remove shared complexity after both work independently.
