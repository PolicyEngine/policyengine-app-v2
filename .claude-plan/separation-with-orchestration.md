# Household/Economy Separation with Proper Orchestration

## Core Principles

1. **Separate code paths** - Household and economy are fundamentally different
2. **Individual simulation tracking** - Each household simulation is independent
3. **Background execution** - Calculations continue even if user navigates away
4. **Front-end progress simulation** - Show progress during long-running household calls
5. **Minimal economy changes** - Only remove dead code, don't change behavior

---

## The Key Architectural Insight

### Economy Reports
```
Report (id: report-123)
  ↓
ONE calculation at REPORT level
  ↓
Cache: calculationKeys.byReportId('report-123')
  ↓
Result stored in: report.output
```

### Household Reports
```
Report (id: report-456)
  ↓
TWO calculations at SIMULATION level
  ↓
Cache: calculationKeys.bySimulationId('sim-1')
Cache: calculationKeys.bySimulationId('sim-2')
  ↓
Results stored in: simulation.output (individually)
```

**Critical difference**: Household has N independent calculations, not one aggregated calculation.

---

## New Cache Structure for Household Reports

### Current Problem
Household reports have no report-level calculation tracking. We only track individual simulations.

**Issue**: When user navigates away, we lose context that these simulations are part of a report.

### Solution: Add Report-Level Orchestration Tracking

Create a NEW cache entry type: **Household Report Progress**

```typescript
// NEW type - not a CalcStatus, but a progress tracker
interface HouseholdReportProgress {
  reportId: string;
  simulationIds: string[];

  // Track each simulation's calculation status
  simulations: {
    [simId: string]: {
      status: 'pending' | 'computing' | 'complete' | 'error';
      startedAt?: number;
      completedAt?: number;
      error?: CalcError;
    };
  };

  // Overall report state
  overallStatus: 'pending' | 'computing' | 'complete' | 'error';
  startedAt: number;
  completedAt?: number;
}

// New query key
export const householdReportProgressKeys = {
  all: ['household-report-progress'] as const,
  byId: (reportId: string) => [...householdReportProgressKeys.all, reportId] as const,
};
```

**Why this works**:
- Separate from CalcStatus (economy reports)
- Tracks report-level orchestration state
- Maintains links to individual simulation calculations
- Persists across navigation
- Can be queried by UI to show "2 of 3 simulations complete"

---

## File Structure

### New Files to Create

```
app/src/
├── libs/
│   ├── calculations/
│   │   ├── household/                          [NEW DIRECTORY]
│   │   │   ├── HouseholdReportOrchestrator.ts  [NEW] Manages household report calculations
│   │   │   ├── HouseholdSimCalculator.ts       [NEW] Executes individual simulation calcs
│   │   │   ├── HouseholdProgressTracker.ts     [NEW] Tracks progress across sims
│   │   │   └── types.ts                        [NEW] Household-specific types
│   │   │
│   │   └── economy/                            [NEW DIRECTORY]
│   │       ├── EconomyReportOrchestrator.ts    [MOVED] Current CalcOrchestrator
│   │       └── EconomyResultPersister.ts       [MOVED] Current ResultPersister (economy only)
│   │
│   └── queries/
│       ├── householdReportQueries.ts           [NEW] Household report progress queries
│       └── economyCalculationQueries.ts        [RENAMED] Current calculationQueries
│
├── hooks/
│   ├── household/                              [NEW DIRECTORY]
│   │   ├── useHouseholdReportProgress.ts       [NEW] Hook into household report state
│   │   ├── useStartHouseholdCalculations.ts    [NEW] Start all sims for a report
│   │   └── useHouseholdReportOrchestrator.ts   [NEW] Access orchestrator singleton
│   │
│   └── economy/                                [NEW DIRECTORY]
│       ├── useEconomyCalculation.ts            [NEW] Economy-specific calc hook
│       └── useEconomyReportOrchestrator.ts     [NEW] Access orchestrator singleton
│
├── pages/
│   ├── ReportOutput.page.tsx                   [MODIFIED] Router only
│   ├── report-output/
│   │   ├── HouseholdReportOutput.tsx           [NEW] Household report page
│   │   └── EconomyReportOutput.tsx             [NEW] Economy report page
│
└── types/
    └── calculation/
        ├── household/                          [NEW DIRECTORY]
        │   ├── HouseholdReportProgress.ts      [NEW] Progress tracking types
        │   └── HouseholdSimStatus.ts           [NEW] Individual sim status
        │
        └── economy/                            [NEW DIRECTORY]
            └── EconomyCalcStatus.ts            [MOVED] Current CalcStatus (economy only)
```

---

## Core Components Deep Dive

### 1. HouseholdReportOrchestrator

**Responsibility**: Manage household report calculations in background, persist across navigation

```typescript
/**
 * Singleton that manages household report calculations
 * Runs in background independent of component lifecycle
 */
export class HouseholdReportOrchestrator {
  private queryClient: QueryClient;
  private activeReports: Map<string, HouseholdReportProgress>;
  private simulationCalculators: Map<string, HouseholdSimCalculator>;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.activeReports = new Map();
    this.simulationCalculators = new Map();
  }

  /**
   * Start calculations for a household report
   * Creates individual calculators for each simulation
   * Tracks progress at report level
   */
  async startReport(config: HouseholdReportConfig): Promise<void> {
    const { reportId, simulationConfigs, countryId } = config;

    // Create progress tracker
    const progress: HouseholdReportProgress = {
      reportId,
      simulationIds: simulationConfigs.map(c => c.simulationId),
      simulations: {},
      overallStatus: 'computing',
      startedAt: Date.now(),
    };

    // Initialize each simulation's progress
    simulationConfigs.forEach(simConfig => {
      progress.simulations[simConfig.simulationId] = {
        status: 'pending',
      };
    });

    // Store in cache immediately
    this.queryClient.setQueryData(
      householdReportProgressKeys.byId(reportId),
      progress
    );

    this.activeReports.set(reportId, progress);

    // Start each simulation calculation IN PARALLEL
    const promises = simulationConfigs.map(simConfig =>
      this.startSimulation(reportId, simConfig, countryId)
    );

    // Don't await - let them run in background
    // Each will update progress independently
    Promise.all(promises).then(() => {
      this.checkReportCompletion(reportId, countryId);
    });
  }

  /**
   * Start individual simulation calculation
   * Updates progress as it runs
   */
  private async startSimulation(
    reportId: string,
    simConfig: SimulationConfig,
    countryId: string
  ): Promise<void> {
    const { simulationId, populationId, policyId } = simConfig;

    // Create calculator for this simulation
    const calculator = new HouseholdSimCalculator(
      this.queryClient,
      simulationId,
      reportId
    );

    this.simulationCalculators.set(simulationId, calculator);

    // Update progress: computing
    this.updateSimProgress(reportId, simulationId, {
      status: 'computing',
      startedAt: Date.now(),
    });

    try {
      // Execute the long-running calculation
      // This BLOCKS for 30-45s but that's OK - runs in background
      const result = await calculator.execute({
        countryId,
        populationId,
        policyId,
      });

      // Update progress: complete
      this.updateSimProgress(reportId, simulationId, {
        status: 'complete',
        completedAt: Date.now(),
      });

      // Persist result to simulation.output
      await this.persistSimulation(countryId, simulationId, result);

    } catch (error) {
      // Update progress: error
      this.updateSimProgress(reportId, simulationId, {
        status: 'error',
        completedAt: Date.now(),
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      });
    }
  }

  /**
   * Update individual simulation progress in report tracker
   */
  private updateSimProgress(
    reportId: string,
    simulationId: string,
    update: Partial<HouseholdReportProgress['simulations'][string]>
  ): void {
    const progress = this.activeReports.get(reportId);
    if (!progress) return;

    // Update this simulation's status
    progress.simulations[simulationId] = {
      ...progress.simulations[simulationId],
      ...update,
    };

    // Update overall status
    const statuses = Object.values(progress.simulations).map(s => s.status);

    if (statuses.every(s => s === 'complete')) {
      progress.overallStatus = 'complete';
      progress.completedAt = Date.now();
    } else if (statuses.some(s => s === 'error')) {
      progress.overallStatus = 'error';
    } else if (statuses.some(s => s === 'computing')) {
      progress.overallStatus = 'computing';
    }

    // Update cache - this triggers UI re-renders
    this.queryClient.setQueryData(
      householdReportProgressKeys.byId(reportId),
      { ...progress }
    );
  }

  /**
   * Check if all simulations complete, if so mark report complete
   */
  private async checkReportCompletion(
    reportId: string,
    countryId: string
  ): Promise<void> {
    const progress = this.activeReports.get(reportId);
    if (!progress || progress.overallStatus !== 'complete') return;

    // Aggregate outputs from all simulations
    const outputs = progress.simulationIds
      .map(simId => {
        const sim = this.queryClient.getQueryData<Simulation>(
          simulationKeys.byId(simId)
        );
        return sim?.output;
      })
      .filter(Boolean);

    // Mark report complete with aggregated output
    const report: Report = {
      id: reportId,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: progress.simulationIds,
      status: 'complete',
      output: outputs,
    };

    await markReportCompleted(countryId as any, reportId, report);

    // Invalidate report cache
    this.queryClient.invalidateQueries({
      queryKey: reportKeys.byId(reportId),
    });

    // Clean up
    this.activeReports.delete(reportId);
    progress.simulationIds.forEach(simId => {
      this.simulationCalculators.delete(simId);
    });
  }

  /**
   * Get current progress for a report
   */
  getProgress(reportId: string): HouseholdReportProgress | undefined {
    return this.activeReports.get(reportId);
  }

  /**
   * Check if report is currently calculating
   */
  isCalculating(reportId: string): boolean {
    const progress = this.activeReports.get(reportId);
    return progress?.overallStatus === 'computing' || false;
  }
}
```

**Key features**:
- ✅ Singleton - persists across navigation
- ✅ Background execution - doesn't block UI
- ✅ Individual sim tracking - each has own calculator
- ✅ Parallel execution - all sims start at once
- ✅ Progress updates - UI can query current state
- ✅ Auto-completion - marks report complete when all sims done

---

### 2. HouseholdSimCalculator

**Responsibility**: Execute a single simulation calculation, show front-end progress

```typescript
/**
 * Executes a single household simulation calculation
 * Provides simulated progress updates during long-running API call
 */
export class HouseholdSimCalculator {
  private queryClient: QueryClient;
  private simulationId: string;
  private reportId: string;
  private progressTimer: NodeJS.Timeout | null = null;

  constructor(
    queryClient: QueryClient,
    simulationId: string,
    reportId: string
  ) {
    this.queryClient = queryClient;
    this.simulationId = simulationId;
    this.reportId = reportId;
  }

  /**
   * Execute the calculation with simulated front-end progress
   */
  async execute(params: {
    countryId: string;
    populationId: string;
    policyId: string;
  }): Promise<any> {
    const calcKey = calculationKeys.bySimulationId(this.simulationId);

    // Set initial computing status
    const initialStatus: CalcStatus = {
      status: 'computing',
      message: 'Starting household calculation...',
      progress: 0,
      metadata: {
        calcId: this.simulationId,
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
        reportId: this.reportId,
      },
    };

    this.queryClient.setQueryData(calcKey, initialStatus);

    // Start simulated progress updates
    this.startProgressSimulation(calcKey);

    try {
      // Execute the LONG-RUNNING API call (30-45s)
      // This blocks but that's OK - runs in background Promise
      const result = await fetchHouseholdCalculation(
        params.countryId,
        params.populationId,
        params.policyId
      );

      // Stop progress simulation
      this.stopProgressSimulation();

      // Set final complete status
      const completeStatus: CalcStatus = {
        status: 'complete',
        result,
        progress: 100,
        metadata: {
          calcId: this.simulationId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: initialStatus.metadata.startedAt,
          reportId: this.reportId,
        },
      };

      this.queryClient.setQueryData(calcKey, completeStatus);

      return result;

    } catch (error) {
      this.stopProgressSimulation();

      const errorStatus: CalcStatus = {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
        metadata: {
          calcId: this.simulationId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: initialStatus.metadata.startedAt,
          reportId: this.reportId,
        },
      };

      this.queryClient.setQueryData(calcKey, errorStatus);

      throw error;
    }
  }

  /**
   * Simulate progress on the front-end during API call
   * Creates smooth, believable progress bar
   */
  private startProgressSimulation(calcKey: readonly string[]): void {
    const startTime = Date.now();
    const estimatedDuration = 37500; // 37.5s average (30-45s range)

    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Asymptotic progress: fast at start, slower near end
      // Never reaches 100% (that happens when API actually completes)
      const rawProgress = (elapsed / estimatedDuration) * 100;
      const progress = Math.min(95, rawProgress * (1 - rawProgress / 200));

      const currentStatus = this.queryClient.getQueryData<CalcStatus>(calcKey);

      if (currentStatus?.status === 'computing') {
        this.queryClient.setQueryData(calcKey, {
          ...currentStatus,
          progress,
          message: this.getProgressMessage(progress),
        });
      }
    }, 100); // Update every 100ms for smooth animation
  }

  /**
   * Stop progress simulation
   */
  private stopProgressSimulation(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Get human-friendly message for current progress
   */
  private getProgressMessage(progress: number): string {
    if (progress < 20) return 'Initializing calculation...';
    if (progress < 50) return 'Running household simulation...';
    if (progress < 80) return 'Computing policy impacts...';
    return 'Finalizing results...';
  }
}
```

**Key features**:
- ✅ Front-end progress simulation - smooth progress bar during blocking call
- ✅ Updates calculation cache - UI can subscribe and show progress
- ✅ Asymptotic progress - realistic (never hits 100% until actually done)
- ✅ Clean separation - handles one simulation, orchestrator handles coordination

---

### 3. useHouseholdReportProgress Hook

**Responsibility**: Let UI components subscribe to household report progress

```typescript
/**
 * Hook to subscribe to household report progress
 * Shows progress across all simulations
 */
export function useHouseholdReportProgress(reportId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<HouseholdReportProgress | null>(null);

  useEffect(() => {
    if (!reportId) return;

    const queryKey = householdReportProgressKeys.byId(reportId);

    // Create observer
    const observer = new QueryObserver<HouseholdReportProgress>(queryClient, {
      queryKey,
    });

    // Subscribe to updates
    const unsubscribe = observer.subscribe((result) => {
      if (result.data) {
        setProgress(result.data);
      }
    });

    // Get initial value
    const initial = queryClient.getQueryData<HouseholdReportProgress>(queryKey);
    if (initial) {
      setProgress(initial);
    }

    return unsubscribe;
  }, [reportId, queryClient]);

  // Calculate overall progress percentage
  const overallProgress = useMemo(() => {
    if (!progress) return 0;

    const simProgresses = progress.simulationIds.map(simId => {
      const simStatus = queryClient.getQueryData<CalcStatus>(
        calculationKeys.bySimulationId(simId)
      );
      return simStatus?.progress || 0;
    });

    return simProgresses.reduce((sum, p) => sum + p, 0) / simProgresses.length;
  }, [progress, queryClient]);

  return {
    progress,
    overallProgress,
    isComputing: progress?.overallStatus === 'computing',
    isComplete: progress?.overallStatus === 'complete',
    isError: progress?.overallStatus === 'error',
    simulationStatuses: progress?.simulations || {},
  };
}
```

**Key features**:
- ✅ Subscribes to report-level progress
- ✅ Calculates overall progress across all sims
- ✅ Works even after navigation (orchestrator keeps running)
- ✅ Simple API for UI components

---

### 4. HouseholdReportOutput Page

**Responsibility**: Render household report with progress tracking

```typescript
export function HouseholdReportOutput() {
  const { reportId } = useParams();
  const { report, simulations } = useUserReportById(reportId!);
  const orchestrator = useHouseholdReportOrchestrator();

  // Subscribe to report progress
  const {
    progress,
    overallProgress,
    isComputing,
    isComplete,
  } = useHouseholdReportProgress(reportId!);

  // Start calculations if needed
  useEffect(() => {
    if (!report || !simulations || simulations.length === 0) return;

    // Check if any simulation needs calculation
    const needsCalc = simulations.some(sim => !sim.output);

    if (needsCalc && !orchestrator.isCalculating(reportId!)) {
      // Build configs for each simulation
      const configs = simulations.map(sim => ({
        simulationId: sim.id,
        populationId: sim.populationId,
        policyId: sim.policyId,
      }));

      // Start calculations
      orchestrator.startReport({
        reportId: reportId!,
        simulationConfigs: configs,
        countryId: report.countryId,
      });
    }
  }, [report, simulations, orchestrator, reportId]);

  // Show loading state
  if (isComputing) {
    return (
      <HouseholdLoadingState
        progress={overallProgress}
        simulationStatuses={progress?.simulations || {}}
      />
    );
  }

  // Show results
  if (isComplete && simulations.every(s => s.output)) {
    const outputs = simulations.map(s => s.output).filter(Boolean);
    return <HouseholdOverview outputs={outputs} />;
  }

  // Show error state
  if (progress?.overallStatus === 'error') {
    return <HouseholdErrorState progress={progress} />;
  }

  return <NotFoundSubPage />;
}
```

**Key features**:
- ✅ Dedicated household page
- ✅ Uses orchestrator to start calculations
- ✅ Shows progress during calculations
- ✅ Works even if user navigates away (orchestrator persists)

---

## Economy Code Changes

### Files to Move (Not Change)

1. **CalcOrchestrator.ts** → **economy/EconomyReportOrchestrator.ts**
   - Rename class: `CalcOrchestrator` → `EconomyReportOrchestrator`
   - Remove household-specific code (lines 80-92)
   - Otherwise IDENTICAL behavior

2. **CalcOrchestratorManager.ts** → **economy/EconomyOrchestratorManager.ts**
   - Rename class: `CalcOrchestratorManager` → `EconomyOrchestratorManager`
   - Use `EconomyReportOrchestrator` instead of `CalcOrchestrator`
   - Otherwise IDENTICAL

3. **ResultPersister.ts** → **economy/EconomyResultPersister.ts**
   - Remove household simulation persistence logic (lines 111-159)
   - Remove `checkAllSimulationsComplete` method
   - Remove `aggregateSimulationOutputs` method
   - Keep only report-level persistence
   - Otherwise IDENTICAL

4. **EconomyCalcStrategy.ts** → **economy/EconomyCalcStrategy.ts**
   - Just move, no changes

### Files to Delete

1. **strategies/HouseholdCalcStrategy.ts** - Replaced by `HouseholdSimCalculator`
2. **strategies/CalcStrategyFactory.ts** - No longer needed (no polymorphism)
3. **strategies/types.ts** - No longer needed (separate economy/household)
4. **useStartCalculationOnLoad.ts** - Replaced by household/economy specific hooks
5. **useAggregatedCalculationStatus.ts** - Replaced by `useHouseholdReportProgress`

### Files to Simplify

1. **ReportOutput.page.tsx** - Just route to household or economy page
   ```typescript
   export function ReportOutputPage() {
     const { reportId } = useParams();
     const { report, simulations } = useUserReportById(reportId!);

     const outputType = simulations?.[0]?.populationType === 'household'
       ? 'household'
       : 'economy';

     if (outputType === 'household') {
       return <HouseholdReportOutput />;
     } else {
       return <EconomyReportOutput />;
     }
   }
   ```

---

## Migration Plan

### Phase 1: Create Household Infrastructure (No Economy Impact)

1. Create `libs/calculations/household/` directory
2. Implement `HouseholdReportOrchestrator.ts`
3. Implement `HouseholdSimCalculator.ts`
4. Implement `HouseholdProgressTracker.ts`
5. Create `types/calculation/household/` directory
6. Implement `HouseholdReportProgress.ts`
7. Create `hooks/household/` directory
8. Implement `useHouseholdReportProgress.ts`
9. Implement `useStartHouseholdCalculations.ts`
10. Create `pages/report-output/HouseholdReportOutput.tsx`

**Test**: Household calculations work, economy untouched

### Phase 2: Move Economy Code (Refactor, Don't Rewrite)

1. Create `libs/calculations/economy/` directory
2. Move `CalcOrchestrator.ts` → `economy/EconomyReportOrchestrator.ts`
3. Move `CalcOrchestratorManager.ts` → `economy/EconomyOrchestratorManager.ts`
4. Move `ResultPersister.ts` → `economy/EconomyResultPersister.ts`
5. Move `EconomyCalcStrategy.ts` → `economy/EconomyCalcStrategy.ts`
6. Create `hooks/economy/` directory
7. Implement `useEconomyCalculation.ts`
8. Create `pages/report-output/EconomyReportOutput.tsx`
9. Update `ReportOutput.page.tsx` to route

**Test**: Economy still works exactly as before

### Phase 3: Delete Shared Code

1. Delete `strategies/HouseholdCalcStrategy.ts`
2. Delete `strategies/CalcStrategyFactory.ts`
3. Delete `strategies/types.ts`
4. Delete `useStartCalculationOnLoad.ts`
5. Delete `useAggregatedCalculationStatus.ts`
6. Delete `useHydrateCalculationCache.ts`

**Test**: Both household and economy work, no shared code

---

## Key Benefits

### 1. Background Execution
✅ Orchestrators run independently of component lifecycle
✅ Calculations continue if user navigates away
✅ Can navigate back and see progress

### 2. Front-End Progress Simulation
✅ Smooth progress bars during 30-45s household calls
✅ No polling - purely front-end timer-based simulation
✅ Realistic asymptotic progress (fast start, slow end)

### 3. Individual Simulation Tracking
✅ Each simulation has own calculator
✅ Each updates its own cache entry
✅ Report-level progress aggregates them
✅ Can show "Simulation 1: 75%, Simulation 2: 40%"

### 4. Economy Unchanged
✅ Same CalcOrchestrator behavior (just renamed and moved)
✅ Same persistence logic
✅ Same strategy pattern
✅ Just removes dead household code

### 5. Clear Separation
✅ `/household/` directory - all household logic
✅ `/economy/` directory - all economy logic
✅ No shared code with `if (isHousehold)` branches
✅ Easy to understand and maintain

---

## Summary

**What we're building**:
- Separate orchestrators for household and economy
- Household orchestrator manages N independent simulations
- Each simulation has own calculator with front-end progress
- Report-level progress tracker aggregates simulation states
- Everything runs in background, persists across navigation
- No polling - just front-end progress simulation during blocking calls

**What we're NOT changing**:
- Economy calculation logic (just moving files)
- API calls (same endpoints, same behavior)
- Result persistence (same database updates)
- Overall architecture (still uses orchestrators, just separate ones)

**Files created**: ~15 new files
**Files moved**: ~5 economy files
**Files deleted**: ~6 shared files
**Files modified**: ~3 routing files

**Lines of code**: Similar total, but much clearer organization
