import { useEffect } from 'react';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { CalcStartConfig } from '@/types/calculation';

interface UseStartCalculationOnLoadParams {
  /**
   * Whether to enable auto-start (only when data is ready)
   */
  enabled: boolean;

  /**
   * Calculation configurations (array for household reports with multiple simulations)
   */
  configs: CalcStartConfig[];

  /**
   * Whether calculation is already complete
   */
  isComplete: boolean;
}

/**
 * Hook to automatically ensure calculation is started when loading a report
 *
 * WHY THIS EXISTS:
 * For direct URL access, we need to ensure calculation orchestrator is running.
 * The manager handles idempotency - if calculation is already running, it does nothing.
 * If not running but should be, it starts it.
 *
 * SCENARIOS:
 * 1. Create report → navigate immediately → calculation already started by useCreateReport
 *    → manager.startCalculation() sees it's already running → does nothing ✓
 *
 * 2. Direct URL to computing report → no orchestrator running
 *    → manager.startCalculation() starts orchestrator to resume polling ✓
 *
 * 3. Direct URL to idle report → need to start calculation
 *    → manager.startCalculation() starts orchestrator ✓
 *
 * 4. Direct URL to completed report → isComplete = true
 *    → Early return, don't start ✓
 *
 * NOTE: We don't need isComputing parameter anymore because the manager
 * handles idempotency. Calling startCalculation() multiple times is safe.
 *
 * CRITICAL FOR HOUSEHOLD: We do NOT await startCalculation() calls because
 * household API calls take 30-60s each. We fire them and let TanStack Query
 * handle waiting in the background while the UI shows progress.
 *
 * @example
 * // In ReportOutput.page:
 * useStartCalculationOnLoad({
 *   enabled: !!report && !!calcConfigs,
 *   configs: calcConfigs || [],
 *   isComplete: calcStatus.isComplete,
 * });
 */
export function useStartCalculationOnLoad({
  enabled,
  configs,
  isComplete,
}: UseStartCalculationOnLoadParams): void {
  const manager = useCalcOrchestratorManager();

  useEffect(() => {
    // Don't start if disabled, no configs, or already complete
    if (!enabled || configs.length === 0 || isComplete) {
      return;
    }

    const timestamp = Date.now();
    console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] Ensuring ${configs.length} calculation(s) started`);

    // Start all calculations (household reports have multiple, economy has one)
    // CRITICAL: Do NOT await - let TanStack Query handle waiting in background
    for (const config of configs) {
      console.log(`[useStartCalculationOnLoad][${timestamp}]   calcId: "${config.calcId}"`);
      console.log(`[useStartCalculationOnLoad][${timestamp}]   targetType: "${config.targetType}"`);

      // Manager handles idempotency - won't start if already running
      console.log(`[useStartCalculationOnLoad][${timestamp}] → Calling manager.startCalculation() (fire and forget)`);

      // Fire and forget - don't await, especially critical for household (30-60s API calls)
      manager.startCalculation(config)
        .then(() => {
          console.log(`[useStartCalculationOnLoad][${timestamp}] ✓ manager.startCalculation() completed for ${config.calcId}`);
        })
        .catch((error) => {
          console.error(`[useStartCalculationOnLoad][${timestamp}] ❌ Failed to start ${config.calcId}:`, error);
        });
    }

    console.log(`[useStartCalculationOnLoad][${timestamp}] ✓ All calculation requests fired`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
  }, [enabled, configs, isComplete, manager]);
}
