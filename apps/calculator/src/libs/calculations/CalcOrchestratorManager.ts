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

    // CHECK: Is this calculation already being managed?
    if (this.activeOrchestrators.has(calcId)) {
      return;
    }

    // Create new orchestrator with manager reference
    const orchestrator = new CalcOrchestrator(
      this.queryClient,
      new ResultPersister(this.queryClient),
      this // Manager reference so orchestrator can cleanup itself
    );

    // Register BEFORE starting (prevents race condition)
    this.activeOrchestrators.set(calcId, orchestrator);

    try {
      // Start the calculation
      await orchestrator.startCalculation(config);

      // NOTE: For household calculations, the calculation is already complete at this point
      // and the orchestrator has already cleaned itself up.
      // For economy calculations, polling has started and cleanup will happen later.
    } catch (error) {
      console.error(`[CalcOrchestratorManager] Failed to start calculation ${calcId}:`, error);
      this.cleanup(calcId);
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
    return this.activeOrchestrators.has(calcId);
  }

  /**
   * Cleanup orchestrator and remove from registry
   *
   * CALLED BY: Orchestrator when calculation completes, errors, or is cancelled
   *
   * @param calcId - Calculation ID to cleanup
   */
  cleanup(calcId: string): void {
    const orchestrator = this.activeOrchestrators.get(calcId);

    if (!orchestrator) {
      return;
    }

    orchestrator.cleanup();
    this.activeOrchestrators.delete(calcId);
  }

  /**
   * Cleanup all orchestrators
   *
   * CALLED BY: App unmount (cleanup effect)
   */
  cleanupAll(): void {
    for (const [, orchestrator] of this.activeOrchestrators.entries()) {
      orchestrator.cleanup();
    }

    this.activeOrchestrators.clear();
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
