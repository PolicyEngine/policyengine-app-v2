import { QueryClient } from '@tanstack/react-query';
import { CalcStartConfig } from '@/types/calculation';
import { CalcOrchestrator } from './CalcOrchestrator';
import { ResultPersister } from './ResultPersister';

/**
 * Manages all calculation orchestrators
 *
 * RESPONSIBILITY: Single source of truth for active calculation orchestrators.
 * Prevents duplicate orchestrators from being created for the same calculation.
 *
 * LIFECYCLE:
 * - Lives for entire app lifetime (singleton via React Context)
 * - Tracks all active orchestrators in a Map
 * - Orchestrators register themselves on creation
 * - Orchestrators unregister on completion/error
 *
 * WHY THIS EXISTS:
 * Without centralized management, multiple components (useCreateReport,
 * useStartCalculationOnLoad) can create duplicate orchestrators that
 * fight over cache updates and make redundant API calls.
 */
export class CalcOrchestratorManager {
  private activeOrchestrators = new Map<string, CalcOrchestrator>();
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    console.log('[CalcOrchestratorManager] ✓ Manager created');
  }

  /**
   * Start a calculation (idempotent)
   *
   * IDEMPOTENCY: Calling this multiple times with the same calcId does nothing
   * after the first call. This is the key feature that prevents duplicates.
   *
   * FLOW:
   * 1. Check if orchestrator already exists for this calcId
   * 2. If yes: Log and return (no-op)
   * 3. If no: Create orchestrator, register it, start calculation
   * 4. If household: Completes immediately, cleanup
   * 5. If economy: Starts polling, cleanup on completion
   *
   * @param config - Calculation configuration
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    const calcId = config.calcId;
    const timestamp = Date.now();

    console.log(`[CalcOrchestratorManager][${timestamp}] ========================================`);
    console.log(`[CalcOrchestratorManager][${timestamp}] startCalculation() called`);
    console.log(`[CalcOrchestratorManager][${timestamp}]   calcId: "${calcId}"`);
    console.log(`[CalcOrchestratorManager][${timestamp}]   targetType: "${config.targetType}"`);
    console.log(`[CalcOrchestratorManager][${timestamp}]   countryId: "${config.countryId}"`);

    // CHECK: Is this calculation already being managed?
    if (this.activeOrchestrators.has(calcId)) {
      console.log(
        `[CalcOrchestratorManager][${timestamp}] ⚠️  SKIPPING: Orchestrator already exists for ${calcId}`
      );
      console.log(
        `[CalcOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`
      );
      console.log(
        `[CalcOrchestratorManager][${timestamp}]   Active IDs: [${Array.from(this.activeOrchestrators.keys()).join(', ')}]`
      );
      console.log(
        `[CalcOrchestratorManager][${timestamp}] ========================================`
      );
      return;
    }

    console.log(
      `[CalcOrchestratorManager][${timestamp}] ✓ No existing orchestrator found, creating new one`
    );

    // Create new orchestrator with manager reference
    const orchestrator = new CalcOrchestrator(
      this.queryClient,
      new ResultPersister(this.queryClient),
      this // Manager reference so orchestrator can cleanup itself
    );

    // Register BEFORE starting (prevents race condition)
    this.activeOrchestrators.set(calcId, orchestrator);
    console.log(`[CalcOrchestratorManager][${timestamp}] ✓ Orchestrator registered for ${calcId}`);
    console.log(
      `[CalcOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`
    );

    try {
      // Start the calculation
      console.log(
        `[CalcOrchestratorManager][${timestamp}] → Calling orchestrator.startCalculation()...`
      );
      await orchestrator.startCalculation(config);
      console.log(
        `[CalcOrchestratorManager][${timestamp}] ✓ orchestrator.startCalculation() completed`
      );

      // NOTE: For household calculations, the calculation is already complete at this point
      // and the orchestrator has already cleaned itself up.
      // For economy calculations, polling has started and cleanup will happen later.

      console.log(
        `[CalcOrchestratorManager][${timestamp}] ========================================`
      );
    } catch (error) {
      console.error(
        `[CalcOrchestratorManager][${timestamp}] ❌ Failed to start calculation ${calcId}:`,
        error
      );
      console.log(`[CalcOrchestratorManager][${timestamp}] → Cleaning up failed orchestrator`);
      this.cleanup(calcId);
      console.log(
        `[CalcOrchestratorManager][${timestamp}] ========================================`
      );
      throw error;
    }
  }

  /**
   * Check if calculation is currently being managed
   *
   * @param calcId - Calculation ID to check
   * @returns true if orchestrator exists in registry
   */
  isRunning(calcId: string): boolean {
    const isRunning = this.activeOrchestrators.has(calcId);
    console.log(`[CalcOrchestratorManager] isRunning("${calcId}"): ${isRunning}`);
    return isRunning;
  }

  /**
   * Cleanup orchestrator and remove from registry
   *
   * CALLED BY: Orchestrator when calculation completes, errors, or is cancelled
   *
   * @param calcId - Calculation ID to cleanup
   */
  cleanup(calcId: string): void {
    const timestamp = Date.now();
    console.log(`[CalcOrchestratorManager][${timestamp}] cleanup("${calcId}") called`);

    const orchestrator = this.activeOrchestrators.get(calcId);

    if (!orchestrator) {
      console.log(
        `[CalcOrchestratorManager][${timestamp}]   ⚠️  No orchestrator found for ${calcId}`
      );
      console.log(
        `[CalcOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`
      );
      return;
    }

    console.log(`[CalcOrchestratorManager][${timestamp}]   → Calling orchestrator.cleanup()`);
    orchestrator.cleanup();

    this.activeOrchestrators.delete(calcId);
    console.log(`[CalcOrchestratorManager][${timestamp}]   ✓ Orchestrator removed from registry`);
    console.log(
      `[CalcOrchestratorManager][${timestamp}]   Active orchestrators remaining: ${this.activeOrchestrators.size}`
    );

    if (this.activeOrchestrators.size > 0) {
      console.log(
        `[CalcOrchestratorManager][${timestamp}]   Active IDs: [${Array.from(this.activeOrchestrators.keys()).join(', ')}]`
      );
    }
  }

  /**
   * Cleanup all orchestrators
   *
   * CALLED BY: App unmount (cleanup effect)
   */
  cleanupAll(): void {
    const timestamp = Date.now();
    console.log(`[CalcOrchestratorManager][${timestamp}] cleanupAll() called`);
    console.log(
      `[CalcOrchestratorManager][${timestamp}]   Cleaning up ${this.activeOrchestrators.size} orchestrators`
    );

    for (const [calcId, orchestrator] of this.activeOrchestrators.entries()) {
      console.log(`[CalcOrchestratorManager][${timestamp}]   → Cleaning up ${calcId}`);
      orchestrator.cleanup();
    }

    this.activeOrchestrators.clear();
    console.log(`[CalcOrchestratorManager][${timestamp}]   ✓ All orchestrators cleaned up`);
  }

  /**
   * Get current state for debugging
   */
  getDebugInfo(): { activeCount: number; activeIds: string[] } {
    return {
      activeCount: this.activeOrchestrators.size,
      activeIds: Array.from(this.activeOrchestrators.keys()),
    };
  }
}
