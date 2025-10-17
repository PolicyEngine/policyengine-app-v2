import { useEffect } from 'react';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { CalcStartConfig } from '@/types/calculation';

interface UseStartCalculationOnLoadParams {
  /**
   * Whether to enable auto-start (only when data is ready)
   */
  enabled: boolean;

  /**
   * Calculation configuration
   */
  config: CalcStartConfig | null;

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
 * @example
 * // In ReportOutput.page:
 * useStartCalculationOnLoad({
 *   enabled: !!report && !!calcConfig,
 *   config: calcConfig,
 *   isComplete: calcStatus.isComplete,
 * });
 */
export function useStartCalculationOnLoad({
  enabled,
  config,
  isComplete,
}: UseStartCalculationOnLoadParams): void {
  const manager = useCalcOrchestratorManager();

  useEffect(() => {
    // Don't start if disabled, no config, or already complete
    if (!enabled || !config || isComplete) {
      return;
    }

    const timestamp = Date.now();
    console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] Ensuring calculation started`);
    console.log(`[useStartCalculationOnLoad][${timestamp}]   calcId: "${config.calcId}"`);
    console.log(`[useStartCalculationOnLoad][${timestamp}]   targetType: "${config.targetType}"`);

    // Manager handles idempotency - won't start if already running
    console.log(`[useStartCalculationOnLoad][${timestamp}] → Calling manager.startCalculation()`);

    manager.startCalculation(config)
      .then(() => {
        console.log(`[useStartCalculationOnLoad][${timestamp}] ✓ manager.startCalculation() completed`);
        console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
      })
      .catch((error) => {
        console.error(`[useStartCalculationOnLoad][${timestamp}] ❌ Failed to start:`, error);
        console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
      });
  }, [enabled, config, isComplete, manager]);
}
