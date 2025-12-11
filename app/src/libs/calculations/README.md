# Calculation System Architecture

> **Last Updated**: Phase 1-7 Implementation Complete (January 2025)

## Overview

The calculation system orchestrates policy impact calculations for both household and economy-level reports. It follows clean architecture principles with clear boundaries between layers and uses TanStack Query for state management.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        Hook Layer                            │
│  (useCalculationStatus, useStartCalculation, etc.)          │
│  - Provides reactive access to calculation state            │
│  - Manages component lifecycle                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Orchestrator Layer                         │
│              (CalcOrchestrator)                             │
│  - Coordinates calculation lifecycle                         │
│  - Watches for completion                                    │
│  - Triggers result persistence                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Strategy Layer                            │
│  (EconomyCalcStrategy, HouseholdCalcStrategy)               │
│  - Executes ONE calculation                                  │
│  - Returns status snapshots                                  │
│  - Stateless (singleton instances)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      API Layer                               │
│  (fetchEconomyCalculation, fetchHouseholdCalculation)       │
│  - Makes HTTP requests                                       │
│  - Handles response parsing                                  │
└─────────────────────────────────────────────────────────────┘
```

## Calculation Lifecycle

### 1. Initiation

**Manual Creation (via useCreateReport):**

```typescript
// User creates report → useCreateReport → CalcOrchestrator.startCalculation()
const { createReport } = useCreateReport();
await createReport({ countryId, payload, simulations, populations });
```

**Direct URL Load (via useStartCalculationOnLoad):**

```typescript
// User loads /report-output/:id → auto-start if needed
useStartCalculationOnLoad({
  enabled: !!report && !!calcConfig,
  config: calcConfig,
  isComplete: calcStatus.isComplete,
  isComputing: calcStatus.isComputing,
});
```

### 2. Orchestration

```typescript
// CalcOrchestrator builds metadata and params
class CalcOrchestrator {
  async startCalculation(config: CalcStartConfig) {
    // 1. Build metadata (calcType, targetType, startedAt)
    const metadata = this.buildMetadata(config);

    // 2. Build params (countryId, policyIds, populationId, calcId)
    const params = this.buildParams(config);

    // 3. Start query (triggers strategy execution)
    queryClient.prefetchQuery(calculationQueries.forReport(calcId, metadata, params));

    // 4. Subscribe to completion
    this.subscribeToCompletion(calcId, metadata, countryId);
  }
}
```

### 3. Strategy Execution

**Economy Calculations (Polling):**

```typescript
// EconomyCalcStrategy polls API until complete
class EconomyCalcStrategy {
  async execute(params: CalcParams): Promise<CalcStatus> {
    const response = await fetchEconomyCalculation(...);

    if (response.status === 'computing') {
      return {
        status: 'computing',
        progress: response.progress * 100,
        queuePosition: response.queue_position,
        // ...
      };
    }

    return {
      status: 'complete',
      result: response.result,
      // ...
    };
  }
}

// Query config enables polling
refetchInterval: (query) => {
  const data = query.state.data as CalcStatus | undefined;
  return data?.status === 'computing' ? 1000 : false; // Poll every 1s while computing
}
```

**Household Calculations (Await + Synthetic Progress):**

```typescript
// HouseholdCalcStrategy awaits result (NO polling)
class HouseholdCalcStrategy {
  async execute(params: CalcParams): Promise<CalcStatus> {
    // Single API call - waits for completion
    const result = await fetchHouseholdCalculation(...);

    return {
      status: 'complete',
      result,
      metadata: { calcId: params.calcId, ... }
    };
  }
}

// UI shows synthetic progress via useSyntheticProgress hook
// - Starts at 0%, increases gradually
// - Completes when API returns
```

### 4. Cache Management

**TanStack Query Cache:**

```typescript
// Query key structure
calculationKeys = {
  byReportId: (id) => ['calculations', 'report', id],
  bySimulationId: (id) => ['calculations', 'simulation', id],
};

// Status stored in cache
interface CalcStatus {
  status: 'idle' | 'computing' | 'complete' | 'error';
  progress?: number;
  result?: CalcResult;
  error?: CalcError;
  metadata: CalcMetadata;
}
```

**Cache Hydration (Phase 4):**

```typescript
// On page load, hydrate cache from persisted report.output
useHydrateCalculationCache({ report, outputType });

// Prevents unnecessary recalculation for completed reports
if (report.output && !existingCacheEntry) {
  queryClient.setQueryData(queryKey, {
    status: 'complete',
    result: report.output,
    metadata: { ... }
  });
}
```

### 5. Completion & Persistence

```typescript
// CalcOrchestrator watches for completion
subscribeToCompletion(calcId, metadata, countryId) {
  observer.subscribe((result) => {
    if (status.status === 'complete') {
      // Persist result to database
      this.resultPersister.persist(status, countryId)
        .finally(() => {
          unsubscribe(); // Clean up observer
        });
    }
  });
}
```

## Key Design Decisions

### 1. No Polling for Household Calculations (Phase 2)

**Problem:** Household API is synchronous but was being polled every 500ms.

**Solution:** Strategy awaits API response, UI shows synthetic progress.

**Benefits:**

- Eliminates API hammering
- Reduces server load by 99%+
- Better UX with smooth progress animation

### 2. Stateless Strategies with Singleton Pattern (Phase 3)

**Problem:** Creating new strategy instances broke progress continuity.

**Solution:** Strategies are stateless, reused via singleton pattern.

**Benefits:**

- Performance optimization (no repeated instantiation)
- Simpler code (no state management in strategies)
- Thread-safe (no shared mutable state)

### 3. Cache Hydration for Direct URL Loads (Phase 4)

**Problem:** Direct URL loads showed "idle" forever.

**Solution:** Two hooks working together:

- `useHydrateCalculationCache`: Populates cache from persisted data
- `useStartCalculationOnLoad`: Auto-starts calculation if needed

**Benefits:**

- Instant results for completed reports
- Automatic calculation restart when needed
- No duplicate calculation starts

### 4. Observer Cleanup for Memory Leaks (Phase 5)

**Problem:** QueryObserver subscriptions never cleaned up.

**Solution:**

- Track unsubscribe function in CalcOrchestrator
- Auto-cleanup on complete/error
- Manual cleanup on component unmount

**Benefits:**

- No memory leaks
- Proper resource cleanup
- Better long-term stability

## Testing Strategy

### Unit Tests

- Each strategy has dedicated tests
- Orchestrator tests verify lifecycle
- Hook tests verify state management

### Integration Tests

- Pathway validation tests (10 critical flows)
- End-to-end calculation flows
- Error handling and edge cases

### Test Fixtures

All mocks and test data in `src/tests/fixtures/`:

- `libs/calculations/` - Strategy and orchestrator fixtures
- `hooks/` - Hook test fixtures
- `integration/` - End-to-end flow fixtures

## API Contract

### Economy Calculation API

**Endpoint:** `GET /{country}/economy/{reform}/over/{baseline}`

**Response (Computing):**

```json
{
  "status": "computing",
  "queue_position": 2,
  "progress": 0.45,
  "message": "Computing budget impact..."
}
```

**Response (Complete):**

```json
{
  "status": "ok",
  "result": {
    "budget": { "budgetary_impact": 1000000 },
    "earnings": { "total_earnings": 50000000 }
    // ... more metrics
  }
}
```

### Household Calculation API

**Endpoint:** `POST /{country}/household`

**Request:**

```json
{
  "policy_id": "1",
  "household": {
    "people": { "you": { "age": { "2024": 30 } } },
    "households": { "your household": { "members": ["you"] } }
  }
}
```

**Response (Always Synchronous):**

```json
{
  "people": {
    "you": {
      "age": { "2024": 30 },
      "employment_income": { "2024": 50000 }
    }
  },
  "households": {
    "your household": {
      "household_net_income": { "2024": 45000 }
    }
  }
}
```

## Common Patterns

### Starting a Calculation

```typescript
const orchestrator = new CalcOrchestrator(queryClient, new ResultPersister(queryClient));

await orchestrator.startCalculation({
  calcId: 'report-123',
  targetType: 'report',
  countryId: 'us',
  simulations: { simulation1, simulation2 },
  populations: { household1, geography1 },
});
```

### Reading Calculation Status

```typescript
// Single calculation
const status = useCalculationStatus('report-123', 'report');

// Multiple calculations (aggregated)
const status = useCalculationStatus(['sim-1', 'sim-2'], 'simulation');

// Access status properties
if (status.isComputing) {
  console.log(`Progress: ${status.progress}%`);
}
if (status.isComplete) {
  console.log('Result:', status.result);
}
```

### Hydrating Cache on Page Load

```typescript
// In ReportOutput.page.tsx
useHydrateCalculationCache({
  report, // Report with output field
  outputType, // 'economy' | 'household'
});

useStartCalculationOnLoad({
  enabled: !!report && !!calcConfig,
  config: calcConfig,
  isComplete: calcStatus.isComplete,
  isComputing: calcStatus.isComputing,
});
```

## Performance Characteristics

### Economy Calculations

- **API Calls:** Polling (1 per second while computing)
- **Duration:** 5-30 seconds (server-side processing)
- **Progress:** Real-time from API
- **Caching:** Results cached indefinitely (staleTime: Infinity)

### Household Calculations

- **API Calls:** Single call (awaits result)
- **Duration:** 100-500ms (fast synchronous calculation)
- **Progress:** Synthetic (client-side animation)
- **Caching:** Results cached indefinitely (staleTime: Infinity)

## Troubleshooting

### Issue: "No queryFn was passed" Error (FIXED - Phase 9)

**Cause:** `useCalculationStatus` called before CalcOrchestrator registers the query.

**Symptoms:**

```
No queryFn was passed as an option, and no default queryFn was found.
Query key: ["calculations","report",48]
```

**Fix (Phase 9):** Added no-op queryFn that returns a never-resolving Promise. This satisfies TanStack Query requirements while maintaining cache-first behavior. The hook returns idle state until CalcOrchestrator populates the cache with real data.

**Technical Details:**

- `queryFn: () => new Promise(() => {})` - Prevents TanStack Query error
- `isComputing` only true when `status === 'computing'` (not on `isLoading`)
- Synthetic progress disabled for no-op loading state
- Cache updates from CalcOrchestrator automatically trigger re-renders

### Issue: Calculation Stuck in "Idle"

**Cause:** Auto-start hook not triggering.

**Fix:** Verify `useStartCalculationOnLoad` enabled and config provided.

### Issue: Multiple API Calls for Household

**Cause:** Strategy polling instead of awaiting.

**Fix:** Verify HouseholdCalcStrategy.execute() uses await, not polling.

### Issue: Memory Leak

**Cause:** Observer not cleaned up.

**Fix:** Verify CalcOrchestrator.cleanup() called on unmount.

### Issue: Progress Not Updating

**Cause:** For household: Synthetic progress not enabled.

**Fix:** Verify useSyntheticProgress hook active in UI.

## Future Improvements

1. **Batch Calculations:** Support parallel calculation starts
2. **Cancellation:** Allow user to cancel in-progress calculations
3. **Retry Logic:** Automatic retry on transient errors
4. **Offline Support:** Queue calculations when offline
5. **Real-time Updates:** WebSocket support for economy calculations

## Related Documentation

- [Calculation Types](../types/calculation/README.md)
- [Query Key Structure](../queryKeys.ts)
- [API Documentation](../../api/README.md)
- [Testing Guide](../../tests/README.md)
