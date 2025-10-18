import { QueryClient } from '@tanstack/react-query';
import { EconomyReportOrchestrator } from './EconomyReportOrchestrator';
import { EconomyResultPersister } from './EconomyResultPersister';
import { CalcStartConfig } from '@/types/calculation';

/**
 * Manages all economy calculation orchestrators
 *
 * RESPONSIBILITY: Single source of truth for active economy calculation orchestrators.
 * Prevents duplicate orchestrators from being created for the same calculation.
 *
 * LIFECYCLE:
 * - Lives for entire app lifetime (singleton via React Context)
 * - Tracks all active orchestrators in a Map
 * - Orchestrators register themselves on creation
 * - Orchestrators unregister on completion/error
 *
 * WHY THIS EXISTS:
 * Without centralized management, multiple components can create duplicate
 * orchestrators that fight over cache updates and make redundant API calls.
 *
 * NOTE: This is economy-only. Household uses HouseholdReportOrchestrator (singleton pattern).
 */
export class EconomyOrchestratorManager {
  private activeOrchestrators = new Map<string, EconomyReportOrchestrator>();
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    console.log('[EconomyOrchestratorManager] ✓ Manager created');
  }

  /**
   * Start an economy calculation (idempotent)
   *
   * IDEMPOTENCY: Calling this multiple times with the same calcId does nothing
   * after the first call. This is the key feature that prevents duplicates.
   *
   * FLOW:
   * 1. Check if orchestrator already exists for this calcId
   * 2. If yes: Log and return (no-op)
   * 3. If no: Create orchestrator, register it, start calculation
   * 4. Starts polling, cleanup on completion
   *
   * @param config - Calculation configuration
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    const calcId = config.calcId;
    const timestamp = Date.now();

    console.log(`[EconomyOrchestratorManager][${timestamp}] ========================================`);
    console.log(`[EconomyOrchestratorManager][${timestamp}] startCalculation() called`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   calcId: "${calcId}"`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   targetType: "${config.targetType}"`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   countryId: "${config.countryId}"`);

    // CHECK: Is this calculation already being managed?
    if (this.activeOrchestrators.has(calcId)) {
      console.log(`[EconomyOrchestratorManager][${timestamp}] ⚠️  SKIPPING: Orchestrator already exists for ${calcId}`);
      console.log(`[EconomyOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`);
      console.log(`[EconomyOrchestratorManager][${timestamp}]   Active IDs: [${Array.from(this.activeOrchestrators.keys()).join(', ')}]`);
      console.log(`[EconomyOrchestratorManager][${timestamp}] ========================================`);
      return;
    }

    console.log(`[EconomyOrchestratorManager][${timestamp}] ✓ No existing orchestrator found, creating new one`);

    // Create new orchestrator with manager reference
    const orchestrator = new EconomyReportOrchestrator(
      this.queryClient,
      new EconomyResultPersister(this.queryClient),
      this // Manager reference so orchestrator can cleanup itself
    );

    // Register BEFORE starting (prevents race condition)
    this.activeOrchestrators.set(calcId, orchestrator);
    console.log(`[EconomyOrchestratorManager][${timestamp}] ✓ Orchestrator registered for ${calcId}`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`);

    try {
      // Start the calculation
      console.log(`[EconomyOrchestratorManager][${timestamp}] → Calling orchestrator.startCalculation()...`);
      await orchestrator.startCalculation(config);
      console.log(`[EconomyOrchestratorManager][${timestamp}] ✓ orchestrator.startCalculation() completed`);

      // Polling has started, cleanup will happen when calculation completes

      console.log(`[EconomyOrchestratorManager][${timestamp}] ========================================`);
    } catch (error) {
      console.error(`[EconomyOrchestratorManager][${timestamp}] ❌ Failed to start calculation ${calcId}:`, error);
      console.log(`[EconomyOrchestratorManager][${timestamp}] → Cleaning up failed orchestrator`);
      this.cleanup(calcId);
      console.log(`[EconomyOrchestratorManager][${timestamp}] ========================================`);
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
    console.log(`[EconomyOrchestratorManager] isRunning("${calcId}"): ${isRunning}`);
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
    console.log(`[EconomyOrchestratorManager][${timestamp}] cleanup("${calcId}") called`);

    const orchestrator = this.activeOrchestrators.get(calcId);

    if (!orchestrator) {
      console.log(`[EconomyOrchestratorManager][${timestamp}]   ⚠️  No orchestrator found for ${calcId}`);
      console.log(`[EconomyOrchestratorManager][${timestamp}]   Active orchestrators: ${this.activeOrchestrators.size}`);
      return;
    }

    console.log(`[EconomyOrchestratorManager][${timestamp}]   → Calling orchestrator.cleanup()`);
    orchestrator.cleanup();

    this.activeOrchestrators.delete(calcId);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   ✓ Orchestrator removed from registry`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   Active orchestrators remaining: ${this.activeOrchestrators.size}`);

    if (this.activeOrchestrators.size > 0) {
      console.log(`[EconomyOrchestratorManager][${timestamp}]   Active IDs: [${Array.from(this.activeOrchestrators.keys()).join(', ')}]`);
    }
  }

  /**
   * Cleanup all orchestrators
   *
   * CALLED BY: App unmount (cleanup effect)
   */
  cleanupAll(): void {
    const timestamp = Date.now();
    console.log(`[EconomyOrchestratorManager][${timestamp}] cleanupAll() called`);
    console.log(`[EconomyOrchestratorManager][${timestamp}]   Cleaning up ${this.activeOrchestrators.size} orchestrators`);

    for (const [calcId, orchestrator] of this.activeOrchestrators.entries()) {
      console.log(`[EconomyOrchestratorManager][${timestamp}]   → Cleaning up ${calcId}`);
      orchestrator.cleanup();
    }

    this.activeOrchestrators.clear();
    console.log(`[EconomyOrchestratorManager][${timestamp}]   ✓ All orchestrators cleaned up`);
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
