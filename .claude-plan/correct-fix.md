# The Correct Fix - Individual Simulation Tracking

## The Core Issue I Keep Missing

**Both economy and household reports have**:
- A `Report` record with `status` field
- An `output` field (economy stores here, household stores array here after completion)

**The KEY difference**:
- **Economy**: Result stored in `report.output`, ONE calculation query by reportId
- **Household**: Results stored in EACH `simulation.output`, MULTIPLE calculation queries by simulationId

**What this means**:
- Each simulation is an INDEPENDENT calculation
- Each simulation has its OWN cache entry: `calculationKeys.bySimulationId(sim.id)`
- Each simulation can be hydrated INDIVIDUALLY
- Each simulation can be tracked INDIVIDUALLY
- No aggregation needed in hydration - just hydrate each sim separately

## Current Problem with useHydrateCalculationCache

**Lines 79-85**: Tries to read ALL simulations at once
```typescript
const simulationIds = report?.simulationIds || [];
const simulations = simulationIds
  .map(id => queryClient.getQueryData<Simulation>(simulationKeys.byId(id)))
  .filter((s): s is Simulation => !!s);
```

**Why this causes duplicate queries**:
1. `useUserReportById` fetches simulations using `useParallelQueries`
2. Those queries are ACTIVE queries managed by React Query
3. `useHydrateCalculationCache` runs in useEffect AFTER render
4. When it tries to `getQueryData`, the queries might still be pending
5. Returns empty array or incomplete data
6. Can't hydrate properly

**But more importantly - WHY are we reading simulations at all?**

The answer: **We need simulation.output to hydrate calculation cache**

## The Real Fix: Use Individual Simulation Queries

Instead of trying to read ALL simulations from cache (which may not be ready), we should:

1. **Subscribe to INDIVIDUAL simulation queries by ID**
2. **When each simulation loads, hydrate its calculation cache**
3. **No aggregation, no arrays, no "read all at once"**

---

## Revised useHydrateCalculationCache

### Current approach (WRONG):
```typescript
// Read all simulations at once
const simulations = simulationIds.map(id =>
  queryClient.getQueryData<Simulation>(simulationKeys.byId(id))
);

// Try to hydrate all at once
for (const sim of simulations) {
  // hydrate...
}
```

**Problem**: Race condition - simulations might not be in cache yet

---

### New approach (CORRECT):
```typescript
// For each simulation ID, subscribe to its query
// When that specific query resolves, hydrate that specific calculation cache
simulationIds.forEach(simId => {
  const observer = new QueryObserver<Simulation>(queryClient, {
    queryKey: simulationKeys.byId(simId),
  });

  observer.subscribe((result) => {
    if (result.data?.output && result.data?.status === 'complete') {
      // This specific simulation is loaded and complete
      // Hydrate its calculation cache
      const calcKey = calculationKeys.bySimulationId(simId);
      const existing = queryClient.getQueryData<CalcStatus>(calcKey);

      if (!existing) {
        queryClient.setQueryData(calcKey, {
          status: 'complete',
          result: result.data.output,
          metadata: {
            calcId: simId,
            calcType: 'household',
            targetType: 'simulation',
            startedAt: Date.now(),
            reportId: currentReportId,
          },
        });
      }
    }
  });
});
```

**Why this works**:
- Each simulation tracked INDIVIDUALLY
- No race condition (subscribe waits for data)
- Hydrates as SOON as each simulation loads
- No "read all at once" assumption
- Works whether simulations load fast or slow

---

## The Infinite Loop Fix

**Current code (line 253)**:
```typescript
}, [queryClient, calcIds, targetType]);
```

**Problem**: `calcIds` is an array. Even with same values, it's a new reference each render.

**Fix**: Create a stable string key
```typescript
const calcIdsKey = useMemo(() => calcIds.join('|'), [calcIds]);

useEffect(() => {
  // ... all the observer logic ...
}, [queryClient, calcIdsKey, targetType]);
```

But wait - we still need `calcIds` array inside the effect to create observers!

**Better fix**: Use the array VALUES, not the reference
```typescript
useEffect(() => {
  // ... observer logic using calcIds ...
}, [queryClient, targetType, ...calcIds]); // Spread the array!
```

No wait, that's not allowed for arbitrary length arrays.

**Actual fix**: Store calcIds in a ref and compare values
```typescript
const calcIdsRef = useRef<string[]>([]);

// Only update ref if actual values changed
const calcIdsChanged = JSON.stringify(calcIds) !== JSON.stringify(calcIdsRef.current);
if (calcIdsChanged) {
  calcIdsRef.current = calcIds;
}

useEffect(() => {
  const ids = calcIdsRef.current;
  // ... use ids ...
}, [queryClient, targetType]); // No calcIds dependency!
```

**But this breaks reactivity!** If calcIds changes, we need to re-run the effect.

**Real real fix**: Use a stable key AND keep the array
```typescript
const calcIdsKey = useMemo(() => calcIds.join('|'), [calcIds]);

useEffect(() => {
  if (!calcIdsKey) return; // No IDs yet

  const ids = calcIdsKey.split('|'); // Reconstruct from stable key

  // ... create observers using ids ...

}, [queryClient, calcIdsKey, targetType]);
```

**This works because**:
- `calcIdsKey` is a string - stable reference if values don't change
- Split recreates the array fresh each time but ONLY when key changes
- No infinite loop

---

## Updated Files

### File 1: `useHydrateCalculationCache.ts`

**Change**: Use QueryObserver for INDIVIDUAL simulations, not bulk read

```typescript
export function useHydrateCalculationCache({
  report,
  outputType,
}: UseHydrateCalculationCacheParams): void {
  const queryClient = useQueryClient();
  const hydratedRef = useRef<Set<string>>(new Set()); // Track INDIVIDUAL sims, not just report

  useEffect(() => {
    const currentReportId = report?.id || '';

    if (!outputType || !currentReportId) return;

    if (outputType === 'household') {
      console.log('[useHydrateCache] HOUSEHOLD: Setting up individual simulation observers');

      const simulationIds = report?.simulationIds || [];

      // Create observer for EACH simulation INDIVIDUALLY
      const observers = simulationIds.map(simId => {
        // Skip if already hydrated this specific simulation
        if (hydratedRef.current.has(simId)) {
          console.log(`[useHydrateCache] SKIP: Already hydrated simulation ${simId}`);
          return null;
        }

        const observer = new QueryObserver<Simulation>(queryClient, {
          queryKey: simulationKeys.byId(simId),
        });

        // Subscribe to THIS SPECIFIC simulation
        const unsubscribe = observer.subscribe((result) => {
          if (!result.data) return;

          const simulation = result.data;

          // Check if this simulation has output and is complete
          if (simulation.output && simulation.status === 'complete') {
            const calcKey = calculationKeys.bySimulationId(simId);
            const existing = queryClient.getQueryData<CalcStatus>(calcKey);

            // Only hydrate if not already in calculation cache
            if (!existing) {
              console.log(`[useHydrateCache] Hydrating calculation cache for simulation ${simId}`);

              queryClient.setQueryData(calcKey, {
                status: 'complete',
                result: simulation.output,
                metadata: {
                  calcId: simId,
                  calcType: 'household',
                  targetType: 'simulation',
                  startedAt: Date.now(),
                  reportId: currentReportId,
                },
              });

              // Mark this simulation as hydrated
              hydratedRef.current.add(simId);

              console.log(`[useHydrateCache] ✓ Hydrated simulation ${simId}`);
            }
          }
        });

        return { observer, unsubscribe };
      }).filter(Boolean);

      // Cleanup observers when report changes
      return () => {
        observers.forEach(obs => obs?.unsubscribe());
      };

    } else {
      // ECONOMY: Existing single-report hydration (UNCHANGED)
      if (hydratedRef.current.has(currentReportId)) return;

      if (!report?.output) return;

      const queryKey = calculationKeys.byReportId(currentReportId);
      const existing = queryClient.getQueryData<CalcStatus>(queryKey);

      if (existing) return;

      queryClient.setQueryData(queryKey, {
        status: 'complete',
        result: report.output,
        metadata: {
          calcId: currentReportId,
          calcType: 'economy',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });

      hydratedRef.current.add(currentReportId);
    }
  }, [report?.id, outputType, queryClient]);
}
```

**Key changes**:
1. **Individual observers** for each simulation (no bulk read)
2. **Track each simulation separately** in hydratedRef (Set instead of single string)
3. **Subscribe and wait** for each simulation to load
4. **Hydrate as soon as ready** (no race condition)
5. **No dependencies on simulation array** (only report.id)

---

### File 2: `useAggregatedCalculationStatus.ts`

**Change**: Stabilize calcIds dependency

```typescript
export function useAggregatedCalculationStatus(
  calcIds: string[],
  targetType: 'report' | 'simulation'
): AggregatedCalcStatus {
  const queryClient = useQueryClient();
  const [calculations, setCalculations] = useState<CalcStatus[]>([]);
  const [anyLoading, setAnyLoading] = useState(false);

  // Create stable string key from array
  const calcIdsKey = useMemo(() => {
    return calcIds.join('|');
  }, [calcIds]);

  useEffect(() => {
    if (!calcIdsKey) {
      setCalculations([]);
      return;
    }

    // Reconstruct IDs from stable key
    const ids = calcIdsKey.split('|');

    console.log(`[useAggregatedCalculationStatus] Creating ${ids.length} QueryObservers`);

    // Create observer for each calculation
    const observers = ids.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      return new QueryObserver<CalcStatus>(queryClient, {
        queryKey,
      });
    });

    // Subscribe to all observers
    const unsubscribers = observers.map((observer, index) => {
      return observer.subscribe((result) => {
        console.log(`[useAggregatedCalculationStatus] Observer update for ${ids[index]}:`, result.data?.status);

        setCalculations((prev) => {
          const next = [...prev];
          if (result.data) {
            next[index] = result.data;
          }
          return next;
        });

        setAnyLoading((prevLoading) => prevLoading || result.isLoading);
      });
    });

    // Get current values immediately
    const currentValues = ids.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      return queryClient.getQueryData<CalcStatus>(queryKey);
    });

    setCalculations(currentValues.filter(Boolean) as CalcStatus[]);

    return () => {
      console.log(`[useAggregatedCalculationStatus] Unsubscribing ${ids.length} observers`);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, calcIdsKey, targetType]); // Use stable key!

  // ... rest unchanged ...
}
```

**Key changes**:
1. **calcIdsKey** string created from array
2. **Dependency uses key** not array (prevents infinite loop)
3. **Reconstruct array inside effect** from key when needed

---

## Why This Approach is Correct

### Individual Simulation Tracking
✅ Each simulation has its own query: `simulationKeys.byId(simId)`
✅ Each simulation has its own calculation cache: `calculationKeys.bySimulationId(simId)`
✅ Each simulation is hydrated INDEPENDENTLY
✅ No "all or nothing" - works even if only some simulations loaded
✅ No race conditions - subscribes and waits for each one

### Parallel Execution Still Works
✅ `useStartCalculationOnLoad` creates separate orchestrators for each simulation
✅ Both API calls happen in parallel (different fetch requests)
✅ Each completes independently
✅ Each persists independently

### Simulated Progress Still Works
✅ `CalcOrchestrator` sets 'computing' status before calling strategy
✅ `useSyntheticProgress` generates smooth progress during 30-45s wait
✅ UI shows progress for EACH simulation independently
✅ No actual polling - just synthetic UI smoothing

### No Duplicate Queries
✅ `useHydrateCalculationCache` uses QueryObserver (subscribes to existing queries)
✅ Does NOT create new queries via useQuery
✅ Just watches the queries created by `useUserReportById`
✅ No duplicate queries warning

### No Infinite Loops
✅ `calcIdsKey` is stable string (same values = same string)
✅ Effect only re-runs when IDs actually change
✅ No array reference comparison issues

---

## Summary

**The fix is NOT about passing simulations as props.**

**The fix IS about**:
1. Treating each simulation as INDIVIDUAL entity with its own cache entry
2. Subscribing to individual simulation queries (not reading all at once)
3. Hydrating each calculation cache independently as data arrives
4. Using stable string keys instead of array dependencies

**Files changed**: 2
**Lines changed**: ~40
**Architecture changed**: 0 (still uses same orchestrator/strategy pattern)
**Works for economy**: Yes (unchanged)
**Works for household**: Yes (fixes race conditions and infinite loops)
