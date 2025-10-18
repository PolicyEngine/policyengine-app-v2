# Economy Report Changes - Impact Analysis

## TL;DR

**Behavior changes**: NONE
**Logic changes**: NONE
**API changes**: NONE

**Actual changes**:
1. Move 4 files to `/economy/` directory
2. Rename 3 classes
3. Delete ~50 lines of household-specific code from shared files
4. Update import paths in consuming files
5. Create new page component that calls same code

**Total lines of actual logic changed**: 0
**Lines deleted** (household code removal): ~50
**Risk**: Very low (just reorganization)

---

## File-by-File Analysis

### File 1: CalcOrchestrator.ts → economy/EconomyReportOrchestrator.ts

#### Changes Required

**Line 1**: Update class name
```diff
-export class CalcOrchestrator {
+export class EconomyReportOrchestrator {
```

**Lines 80-92**: DELETE household-specific code
```diff
-    // For household calculations: Set 'computing' status BEFORE API call
-    // WHY: Household API call blocks for 30-45s, so we need to show progress immediately
-    if (metadata.calcType === 'household') {
-      const computingStatus: CalcStatus = {
-        status: 'computing',
-        message: 'Starting household calculation...',
-        metadata,
-      };
-      this.queryClient.setQueryData(queryOptions.queryKey, computingStatus);
-      console.log(`[CalcOrchestrator][${timestamp}]   Set computing status for household`);
-    }
```

**Everywhere**: Update console logs
```diff
-    console.log(`[CalcOrchestrator][${timestamp}] ...`);
+    console.log(`[EconomyReportOrchestrator][${timestamp}] ...`);
```

**Constructor parameter**: Update type reference
```diff
  constructor(
    queryClient: QueryClient,
    resultPersister: ResultPersister,
-   manager?: CalcOrchestratorManager
+   manager?: EconomyOrchestratorManager
  ) {
```

#### Total Changes
- **Lines deleted**: 12 (household-specific)
- **Lines modified**: ~15 (class name, logs)
- **Lines added**: 0
- **Behavior changed**: NO (deleted code only ran for household)

---

### File 2: CalcOrchestratorManager.ts → economy/EconomyOrchestratorManager.ts

#### Changes Required

**Line 1**: Update class name
```diff
-export class CalcOrchestratorManager {
+export class EconomyOrchestratorManager {
```

**Instance references**: Update type
```diff
-  private orchestrators: Map<string, CalcOrchestrator> = new Map();
+  private orchestrators: Map<string, EconomyReportOrchestrator> = new Map();
```

**Factory method**: Update instantiation
```diff
-    const orchestrator = new CalcOrchestrator(
+    const orchestrator = new EconomyReportOrchestrator(
       this.queryClient,
       this.resultPersister,
       this
     );
```

**Everywhere**: Update console logs
```diff
-    console.log(`[CalcOrchestratorManager] ...`);
+    console.log(`[EconomyOrchestratorManager] ...`);
```

#### Total Changes
- **Lines deleted**: 0
- **Lines modified**: ~10 (class name, type references, logs)
- **Lines added**: 0
- **Behavior changed**: NO (identical logic)

---

### File 3: ResultPersister.ts → economy/EconomyResultPersister.ts

#### Changes Required

**Lines 37-46**: DELETE household-specific branch in persist()
```diff
  async persist(status: CalcStatus, countryId: string): Promise<void> {
    // ...

    try {
      if (status.metadata.targetType === 'report') {
        await this.persistToReport(status.metadata.calcId, status.result, countryId);
-     } else {
-       await this.persistToSimulation(
-         status.metadata.calcId,
-         status.result,
-         countryId,
-         status.metadata.reportId
-       );
-     }
      console.log(`[ResultPersister] Successfully persisted to ${status.metadata.targetType}`);
    } catch (error) {
```

**Lines 53-62**: DELETE household retry branch
```diff
    } catch (error) {
      // ...
      try {
        if (status.metadata.targetType === 'report') {
          await this.persistToReport(status.metadata.calcId, status.result, countryId);
-       } else {
-         await this.persistToSimulation(
-           status.metadata.calcId,
-           status.result,
-           countryId,
-           status.metadata.reportId
-         );
-       }
```

**Lines 111-219**: DELETE entire simulation persistence methods
```diff
-  /**
-   * Persist result to a simulation
-   * ...
-   */
-  private async persistToSimulation(...): Promise<void> {
-    // ... entire method ...
-  }
-
-  private async checkAllSimulationsComplete(reportId: string): Promise<boolean> {
-    // ... entire method ...
-  }
-
-  private async aggregateSimulationOutputs(reportId: string): Promise<any> {
-    // ... entire method ...
-  }
```

#### Total Changes
- **Lines deleted**: ~110 (all household simulation logic)
- **Lines modified**: 0
- **Lines added**: 0
- **Behavior changed**: NO (deleted code only ran for household)

---

### File 4: EconomyCalcStrategy.ts → economy/EconomyCalcStrategy.ts

#### Changes Required

**NONE** - Just move the file

#### Total Changes
- **Lines deleted**: 0
- **Lines modified**: 0
- **Lines added**: 0
- **Behavior changed**: NO

---

### File 5: calculationQueries.ts → economy/economyCalculationQueries.ts

#### Changes Required

**DELETE**: forSimulation() method (household only)
```diff
  forReport: (reportId: string, metadata: CalcMetadata, params: CalcParams) => {
    const strategy = CalcStrategyFactory.getStrategy(metadata.calcType);
    return {
      queryKey: calculationKeys.byReportId(reportId),
      queryFn: async () => {
        console.log(`[calculationQueries.forReport] Executing ${metadata.calcType}`);
        return strategy.execute(params, metadata);
      },
      ...strategy.getRefetchConfig(),
      meta: { calcMetadata: metadata },
    };
  },

- forSimulation: (simulationId: string, metadata: CalcMetadata, params: CalcParams) => {
-   const strategy = CalcStrategyFactory.getStrategy(metadata.calcType);
-   return {
-     queryKey: calculationKeys.bySimulationId(simulationId),
-     queryFn: async () => {
-       console.log(`[calculationQueries.forSimulation] Metadata:`, metadata);
-       return strategy.execute(params, metadata);
-     },
-     ...strategy.getRefetchConfig(),
-     meta: { calcMetadata: metadata },
-   };
- },
```

**UPDATE**: forReport() to not use factory
```diff
- const strategy = CalcStrategyFactory.getStrategy(metadata.calcType);
+ const strategy = new EconomyCalcStrategy();
```

#### Total Changes
- **Lines deleted**: ~15 (forSimulation method)
- **Lines modified**: ~1 (remove factory)
- **Lines added**: 0
- **Behavior changed**: NO (forSimulation was only used by household)

---

## New Files Required for Economy

### File 1: hooks/economy/useEconomyCalculation.ts

**Purpose**: Wrap existing calculation logic for economy-specific page

```typescript
/**
 * Hook to manage economy report calculation
 * Wraps existing orchestrator logic
 */
export function useEconomyCalculation(reportId: string) {
  const queryClient = useQueryClient();
  const manager = useRef<EconomyOrchestratorManager | null>(null);

  // Initialize manager once
  if (!manager.current) {
    const persister = new EconomyResultPersister(queryClient);
    manager.current = new EconomyOrchestratorManager(queryClient, persister);
  }

  // Read calculation status from cache
  const status = useCalculationStatus(reportId, 'report');

  // Start calculation if needed
  const startCalculation = useCallback((config: CalcStartConfig) => {
    manager.current?.startCalculation(config);
  }, []);

  return {
    status,
    startCalculation,
    isComputing: status.status === 'computing',
    isComplete: status.status === 'complete',
    isError: status.status === 'error',
    result: status.result,
  };
}
```

**New logic**: NONE - just wraps existing orchestrator
**Lines**: ~30

---

### File 2: pages/report-output/EconomyReportOutput.tsx

**Purpose**: Economy-specific page component

```typescript
/**
 * Economy report output page
 * Uses existing economy calculation infrastructure
 */
export function EconomyReportOutput() {
  const { reportId } = useParams();
  const { report, simulations } = useUserReportById(reportId!);
  const { status, startCalculation } = useEconomyCalculation(reportId!);

  // Start calculation if needed
  useEffect(() => {
    if (!report || !simulations?.[0]) return;

    // Check if already has output
    if (report.output) return;

    // Check if already calculating
    if (status.status === 'computing' || status.status === 'complete') return;

    // Build config and start
    const config = buildEconomyConfig(report, simulations[0]);
    startCalculation(config);
  }, [report, simulations, status.status, startCalculation]);

  // Show loading
  if (status.isComputing) {
    return <EconomyLoadingState status={status} />;
  }

  // Show results
  if (status.isComplete && status.result) {
    return <EconomyOverview result={status.result as EconomyReportOutput} />;
  }

  // Show error
  if (status.isError) {
    return <EconomyErrorState error={status.error} />;
  }

  return <NotFoundSubPage />;
}
```

**New logic**: NONE - same as current ReportOutput.page.tsx economy branch
**Lines**: ~50

---

## Import Path Updates

Files that import economy classes need updated paths:

### Files to Update

1. **ReportOutput.page.tsx**
```diff
- import { CalcOrchestratorManager } from '@/libs/calculations/CalcOrchestratorManager';
+ import { EconomyReportOutput } from './report-output/EconomyReportOutput';
```

2. **Any test files**
```diff
- import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
+ import { EconomyReportOrchestrator } from '@/libs/calculations/economy/EconomyReportOrchestrator';
```

**Total files**: ~5-10 files
**Change per file**: 1-3 import lines

---

## Summary Table

| File | Move | Rename | Delete Lines | Modify Lines | Add Lines | Behavior Change |
|------|------|--------|--------------|--------------|-----------|-----------------|
| CalcOrchestrator.ts | ✅ | ✅ | 12 | 15 | 0 | ❌ |
| CalcOrchestratorManager.ts | ✅ | ✅ | 0 | 10 | 0 | ❌ |
| ResultPersister.ts | ✅ | ✅ | 110 | 0 | 0 | ❌ |
| EconomyCalcStrategy.ts | ✅ | ❌ | 0 | 0 | 0 | ❌ |
| calculationQueries.ts | ✅ | ✅ | 15 | 1 | 0 | ❌ |
| **TOTALS** | **5** | **4** | **137** | **26** | **0** | **NO** |

### New Files (Wrapper/Router Code)
| File | Lines | New Logic? |
|------|-------|------------|
| useEconomyCalculation.ts | 30 | ❌ (wrapper) |
| EconomyReportOutput.tsx | 50 | ❌ (router) |
| **TOTALS** | **80** | **NO** |

### Import Path Updates
| Type | Count | Risk |
|------|-------|------|
| Files needing updates | 5-10 | Low |
| Lines per file | 1-3 | Low |

---

## Risk Assessment

### What Could Break?

1. **Import path errors** - Low risk
   - TypeScript will catch at compile time
   - Easy to fix with find/replace

2. **Missed references** - Very low risk
   - Only ~5-10 files import these classes
   - All caught by TypeScript

3. **Deleted code still needed** - Zero risk
   - All deleted code is household-specific
   - Household will use new orchestrator
   - Economy never calls deleted code

4. **Behavior regression** - Zero risk
   - No logic changes
   - Only reorganization

### Testing Strategy

**Before move**:
1. Run economy report calculation
2. Note exact behavior
3. Note console logs
4. Note API calls

**After move**:
1. Run same economy report calculation
2. Verify identical behavior
3. Verify identical console logs (except class name)
4. Verify identical API calls

**Expected difference**: Only class names in logs

---

## Migration Checklist

### Step 1: Create directories
- [ ] Create `app/src/libs/calculations/economy/`
- [ ] Create `app/src/hooks/economy/`
- [ ] Create `app/src/pages/report-output/`

### Step 2: Move files
- [ ] Move `CalcOrchestrator.ts` → `economy/EconomyReportOrchestrator.ts`
- [ ] Move `CalcOrchestratorManager.ts` → `economy/EconomyOrchestratorManager.ts`
- [ ] Move `ResultPersister.ts` → `economy/EconomyResultPersister.ts`
- [ ] Move `EconomyCalcStrategy.ts` → `economy/EconomyCalcStrategy.ts`
- [ ] Move/rename `calculationQueries.ts` → `economy/economyCalculationQueries.ts`

### Step 3: Modify moved files
- [ ] Rename class in EconomyReportOrchestrator.ts
- [ ] Delete lines 80-92 in EconomyReportOrchestrator.ts
- [ ] Update console logs in EconomyReportOrchestrator.ts
- [ ] Rename class in EconomyOrchestratorManager.ts
- [ ] Update type references in EconomyOrchestratorManager.ts
- [ ] Update console logs in EconomyOrchestratorManager.ts
- [ ] Delete lines 37-46, 53-62, 111-219 in EconomyResultPersister.ts
- [ ] Delete forSimulation() in economyCalculationQueries.ts
- [ ] Remove CalcStrategyFactory usage in economyCalculationQueries.ts

### Step 4: Create new wrapper files
- [ ] Create `hooks/economy/useEconomyCalculation.ts`
- [ ] Create `pages/report-output/EconomyReportOutput.tsx`

### Step 5: Update imports
- [ ] Update imports in ReportOutput.page.tsx
- [ ] Update imports in test files
- [ ] Search codebase for any other imports

### Step 6: Test
- [ ] Run TypeScript compiler
- [ ] Run existing tests
- [ ] Manually test economy report calculation
- [ ] Verify behavior identical to before

---

## Bottom Line

**For economy reports, this is a PURE REFACTOR**:
- Same orchestrator logic (just renamed)
- Same strategy pattern (just moved)
- Same persistence logic (minus household code)
- Same API calls
- Same calculation flow
- Same results

**The only changes are**:
- File locations
- Class names
- Removed dead code (that economy never used)
- Import paths

**Behavior change**: ZERO
**Risk**: Very low (caught by TypeScript)
**Benefit**: Clear separation, easier maintenance
