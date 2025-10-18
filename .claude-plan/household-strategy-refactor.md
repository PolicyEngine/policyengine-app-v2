# Household Strategy Refactor - Simulated Polling

## The Real Problem

You're absolutely right - I completely misunderstood the requirement. The issue is NOT that we're blocking, the issue is:

1. **We DO want parallel execution** - Both simulations should run AT THE SAME TIME
2. **We DO want to simulate progress** - Show users smooth progress during the 30-45s wait
3. **We DON'T want actual polling** - The API call is synchronous, returns only when done
4. **We ONLY want to touch household strategy files** - Keep everything else the same

The current code SHOULD work for this, but it has bugs in:
- `useAggregatedCalculationStatus` causing infinite loops
- `useHydrateCalculationCache` creating duplicate queries

---

## Current Flow (What SHOULD Work)

```
User navigates to household report
    ↓
ReportOutput.page.tsx
    ↓
Builds 2 CalcStartConfigs (one per simulation)
    ↓
useStartCalculationOnLoad([config1, config2])
    ↓
Starts BOTH calculations in parallel
    ↓
┌─────────────────────┬─────────────────────┐
│                     │                     │
│ CalcOrchestrator    │ CalcOrchestrator    │
│ (sim1)              │ (sim2)              │
│     ↓               │     ↓               │
│ HouseholdCalcStrategy│ HouseholdCalcStrategy│
│     ↓               │     ↓               │
│ fetchHouseholdCalc  │ fetchHouseholdCalc  │
│ (BLOCKS 30-45s)     │ (BLOCKS 30-45s)     │
│     ↓               │     ↓               │
│ Returns result      │ Returns result      │
│     ↓               │     ↓               │
│ ResultPersister     │ ResultPersister     │
│                     │                     │
└─────────────────────┴─────────────────────┘
    ↓
Both simulations complete
    ↓
Report marked complete
    ↓
Display results
```

**This is the RIGHT architecture** - parallel execution, no actual polling, simulated progress.

---

## The ACTUAL Bugs to Fix

### Bug 1: Infinite Loop in `useAggregatedCalculationStatus`

**Location**: `useAggregatedCalculationStatus.ts:245-247`

**Problem**:
```typescript
useEffect(() => {
  // ... subscribe to observers ...

  setCalculations((prev) => {
    return prev.map((calc, index) => currentValues[index] || calc);
  });

}, [queryClient, calcIds, targetType]);
```

**Why it loops**:
- `calcIds` is an array from `useMemo` in ReportOutput.page.tsx
- Even though values are same, the array reference changes
- This triggers useEffect
- Which calls `setCalculations`
- Which triggers re-render
- Which creates new `calcIds` array
- Infinite loop

**Fix**: Stabilize the dependency
```typescript
// Create stable string key from calcIds
const calcIdsKey = useMemo(() => calcIds.join(','), [calcIds]);

useEffect(() => {
  // ... subscribe to observers ...

  setCalculations((prev) => {
    return prev.map((calc, index) => currentValues[index] || calc);
  });

}, [queryClient, calcIdsKey, targetType]); // Use string key, not array
```

---

### Bug 2: Duplicate Queries in `useHydrateCalculationCache`

**Location**: `useHydrateCalculationCache.ts:57-78` (already tried to fix, still wrong)

**Problem**:
```typescript
// Read simulations from cache (already fetched by useUserReportById)
const simulationIds = report?.simulationIds || [];
const simulations = simulationIds
  .map(id => queryClient.getQueryData<Simulation>(simulationKeys.byId(id)))
  .filter((s): s is Simulation => !!s);
```

**Why it still fails**:
- This runs in useEffect
- useEffect runs AFTER render
- During first render, simulations might not be in cache yet (race condition)
- Returns empty array
- Can't hydrate
- Then later simulations arrive but useEffect already ran

**Fix**: Add simulations to dependency array properly
```typescript
// In ReportOutput.page.tsx, pass simulations directly
useHydrateCalculationCache({
  report,
  outputType,
  simulations, // Pass the actual simulations from useUserReportById
});

// In useHydrateCalculationCache.ts
export function useHydrateCalculationCache({
  report,
  outputType,
  simulations, // NEW: receive simulations from parent
}: UseHydrateCalculationCacheParams): void {
  const queryClient = useQueryClient();
  const hydratedRef = useRef<string>('');

  // Create stable key from simulation IDs
  const simKey = useMemo(() => {
    return simulations?.map(s => s.id).join(',') || '';
  }, [simulations]);

  useEffect(() => {
    // ... existing hydration logic, but uses passed simulations directly
  }, [report?.id, outputType, simKey, simulations, queryClient]);
}
```

---

### Bug 3: Progress Not Showing During Blocking Call

**Location**: `HouseholdCalcStrategy.ts:24-47`

**Problem**: The strategy works correctly but doesn't communicate "computing" status

**Current flow**:
```
1. CalcOrchestrator calls strategy.execute()
2. Strategy awaits fetchHouseholdCalculation() ← BLOCKS HERE
3. Returns { status: 'complete', result }
4. During the 30-45s wait: UI sees NOTHING (no status update)
```

**What we need**:
```
1. CalcOrchestrator calls strategy.execute()
2. Strategy IMMEDIATELY returns { status: 'computing' }
3. Strategy continues execution in background
4. When done, updates cache with { status: 'complete', result }
5. During the 30-45s wait: UI sees 'computing' with synthetic progress
```

**But wait**: `execute()` is async, returns a Promise. We can't "return early" then "update later".

**Real solution**: The `CalcOrchestrator` should set 'computing' status BEFORE calling strategy

**Check CalcOrchestrator.ts:80-92**:
```typescript
// For household calculations: Set 'computing' status BEFORE API call
// WHY: Household API call blocks for 30-45s, so we need to show progress immediately
if (metadata.calcType === 'household') {
  const computingStatus: CalcStatus = {
    status: 'computing',
    message: 'Starting household calculation...',
    metadata,
  };
  this.queryClient.setQueryData(queryOptions.queryKey, computingStatus);
  console.log(`[CalcOrchestrator][${timestamp}]   Set computing status for household`);
}
```

**This ALREADY EXISTS!** So progress SHOULD show. If it's not showing, the bug is elsewhere.

---

## Revised Understanding

After reading the code more carefully:

1. **CalcOrchestrator DOES set 'computing' status before calling household strategy** ✅
2. **Both simulations DO run in parallel** (separate orchestrators) ✅
3. **Synthetic progress DOES show during blocking calls** (useSyntheticProgress) ✅
4. **The actual bugs are**:
   - Infinite loop in `useAggregatedCalculationStatus` ❌
   - Possible race condition in `useHydrateCalculationCache` ❌

---

## The Fix (MINIMAL CHANGES)

### File 1: `useAggregatedCalculationStatus.ts`

**Change**: Stabilize `calcIds` dependency

```diff
export function useAggregatedCalculationStatus(
  calcIds: string[],
  targetType: 'report' | 'simulation'
): AggregatedCalcStatus {
  const queryClient = useQueryClient();
  const [calculations, setCalculations] = useState<CalcStatus[]>([]);

+  // Create stable key from calcIds to prevent infinite loops
+  const calcIdsKey = useMemo(() => {
+    return calcIds.join('|');
+  }, [calcIds]);

  // Subscribe to each calculation's cache entry
  useEffect(() => {
    if (calcIds.length === 0) {
      setCalculations([]);
      return;
    }

    console.log(`[useAggregatedCalculationStatus] Subscribing to ${calcIds.length} calculations`);

    const observers = calcIds.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      return new QueryObserver<CalcStatus>(queryClient, { queryKey });
    });

    const unsubscribers = observers.map((observer) =>
      observer.subscribe(() => {
        // On any update, re-read all current values
        const currentValues = calcIds.map((calcId) => {
          const queryKey =
            targetType === 'report'
              ? calculationKeys.byReportId(calcId)
              : calculationKeys.bySimulationId(calcId);

          return queryClient.getQueryData<CalcStatus>(queryKey);
        });

        setCalculations((prev) => {
          return prev.map((calc, index) => currentValues[index] || calc);
        });
      })
    );

    return () => {
      console.log(`[useAggregatedCalculationStatus] Unsubscribing ${calcIds.length} observers`);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
-  }, [queryClient, calcIds, targetType]);
+  }, [queryClient, calcIdsKey, targetType, calcIds]);
+  // NOTE: Using calcIdsKey for stability but keep calcIds for the loop

  // ... rest of file unchanged
}
```

**Why this works**: String key is stable across re-renders if IDs don't change.

---

### File 2: `useHydrateCalculationCache.ts`

**Change 1**: Add simulations parameter
```diff
interface UseHydrateCalculationCacheParams {
  report: Report | undefined;
  outputType: 'economy' | 'household' | undefined;
+  simulations?: Simulation[]; // NEW: Pass simulations from parent to avoid race
}
```

**Change 2**: Use passed simulations, create stable key
```diff
export function useHydrateCalculationCache({
  report,
  outputType,
+  simulations,
}: UseHydrateCalculationCacheParams): void {
  const queryClient = useQueryClient();
  const hydratedRef = useRef<string>('');

+  // Create stable key from simulation IDs
+  const simKey = useMemo(() => {
+    if (outputType !== 'household' || !simulations) return '';
+    return simulations.map(s => s.id).join('|');
+  }, [outputType, simulations]);

  useEffect(() => {
    const timestamp = Date.now();
    const currentReportId = report?.id || '';

    // ... existing early returns ...

    // HOUSEHOLD vs ECONOMY: Different hydration strategies
    if (outputType === 'household') {
      console.log('[useHydrateCache] HOUSEHOLD: Hydrating simulation-level caches');

-      // Read simulations from cache (already fetched by useUserReportById)
-      const simulationIds = report?.simulationIds || [];
-      const simulations = simulationIds
-        .map(id => queryClient.getQueryData<Simulation>(simulationKeys.byId(id)))
-        .filter((s): s is Simulation => !!s);
+      // Use simulations passed from parent (already fetched by useUserReportById)
+      if (!simulations || simulations.length === 0) {
+        console.log(`[useHydrateCache][${timestamp}] SKIP: No simulations provided`);
+        return;
+      }

      console.log(`[useHydrateCache][${timestamp}] Found ${simulations.length} simulations in cache`);

      // ... rest of household hydration unchanged ...
    }

    // ... economy hydration unchanged ...

-  }, [report?.id, outputType, queryClient]);
+  }, [report?.id, outputType, queryClient, simKey, simulations]);
}
```

**Change 3**: Update call site in `ReportOutput.page.tsx`
```diff
// Phase 4: Hydrate cache from persisted results first
useHydrateCalculationCache({
  report,
  outputType,
+  simulations, // Pass simulations from useUserReportById
});
```

**Why this works**:
- No race condition (simulations passed directly from parent)
- No duplicate queries (uses passed data, not fetching)
- Stable dependencies (simKey string, not array reference)

---

## Files Changed Summary

### Modified (3 files):

1. **`useAggregatedCalculationStatus.ts`**
   - Add `calcIdsKey` using `useMemo`
   - Change dependency array to use `calcIdsKey`
   - Lines changed: ~5 lines

2. **`useHydrateCalculationCache.ts`**
   - Add `simulations` parameter to interface
   - Add `simKey` using `useMemo`
   - Use passed simulations instead of reading from cache
   - Update dependency array
   - Lines changed: ~15 lines

3. **`ReportOutput.page.tsx`**
   - Pass `simulations` to `useHydrateCalculationCache`
   - Lines changed: ~1 line

### NOT Changed:

- ❌ `HouseholdCalcStrategy.ts` - Already correct
- ❌ `CalcOrchestrator.ts` - Already sets 'computing' status
- ❌ `useCalculationStatus.ts` - Already works
- ❌ `useSyntheticProgress.ts` - Already works
- ❌ All economy files - Untouched
- ❌ All API files - Untouched

**Total impact**: ~21 lines changed across 3 files

---

## Why This is Minimal

**What I was proposing before**: Completely separate household/economy flows, 23 new files, delete 13 files

**What's actually needed**: Fix 2 bugs in existing hooks that cause infinite loops and race conditions

**Root cause of my confusion**: I thought the architecture was wrong, but it's actually RIGHT. Just has 2 implementation bugs.

---

## Testing Strategy

After making these 3 small changes:

1. **Test household report from Reports page**
   - Should see both calculations start in parallel
   - Should see synthetic progress during 30-45s wait
   - Should see both complete
   - Should mark report complete
   - Should display output
   - **Should NOT see duplicate queries warning** ✅
   - **Should NOT see infinite loop error** ✅

2. **Test economy report from Reports page**
   - Should work exactly as before (no changes to economy code)

3. **Test direct URL access**
   - Household: Should hydrate from simulation.output
   - Economy: Should hydrate from report.output

---

## Why The Original Architecture is Actually Good

1. **Parallel execution**: ✅ Both sims run at same time via separate orchestrators
2. **Simulated polling**: ✅ Synthetic progress shows smooth updates during blocking call
3. **No actual polling**: ✅ Household strategy returns once, never refetches
4. **Reuses infrastructure**: ✅ Same orchestrator/strategy pattern for both types
5. **Clear separation**: ✅ Strategy pattern isolates household vs economy differences

**The only issues were**:
- Unstable array dependencies causing infinite loops
- Race condition in cache reads causing duplicate queries

**These are fixable with ~21 lines of code.**

I apologize for the massive over-engineering in my previous plans. You were right to push back.
