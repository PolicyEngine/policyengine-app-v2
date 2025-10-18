import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { calculationKeys } from '@/libs/queryKeys';
import { CalcStartConfig, CalcStatus } from '@/types/calculation';

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
  const queryClient = useQueryClient();

  // Create a stable reference to configs to prevent re-runs on object reference changes
  // This ensures we only re-run when the actual config data changes, not when the array is recreated
  const configsRef = useRef<CalcStartConfig[]>([]);
  const configKey = useMemo(() => {
    return configs.map(c => `${c.calcId}:${c.targetType}`).join('|');
  }, [configs]);

  // Update ref when configKey changes (meaning actual IDs changed)
  useEffect(() => {
    configsRef.current = configs;
  }, [configKey, configs]);

  useEffect(() => {
    const currentConfigs = configsRef.current;

    // Don't start if disabled, no configs, or already complete
    if (!enabled || currentConfigs.length === 0 || isComplete) {
      return;
    }

    const timestamp = Date.now();
    console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] Ensuring ${currentConfigs.length} calculation(s) started`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] Config key: ${configKey}`);

    // Start all calculations (household reports have multiple, economy has one)
    // CRITICAL: Do NOT await - let TanStack Query handle waiting in background
    for (const config of currentConfigs) {
      // Check if calculation already exists in cache and is complete
      const queryKey = config.targetType === 'report'
        ? calculationKeys.byReportId(config.calcId)
        : calculationKeys.bySimulationId(config.calcId);

      const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

      if (cachedStatus?.status === 'complete') {
        console.log(`[useStartCalculationOnLoad][${timestamp}] ⏭️  SKIP: ${config.calcId} already complete in cache`);
        continue;
      }

      // Check if orchestrator is already running for this calcId
      if (manager.isRunning(config.calcId)) {
        console.log(`[useStartCalculationOnLoad][${timestamp}] ⏭️  SKIP: ${config.calcId} orchestrator already running`);
        continue;
      }

      console.log(`[useStartCalculationOnLoad][${timestamp}]   calcId: "${config.calcId}"`);
      console.log(`[useStartCalculationOnLoad][${timestamp}]   targetType: "${config.targetType}"`);
      console.log(`[useStartCalculationOnLoad][${timestamp}]   cachedStatus: ${cachedStatus?.status || 'none'}`);

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

    console.log(`[useStartCalculationOnLoad][${timestamp}] ✓ All calculation requests processed`);
    console.log(`[useStartCalculationOnLoad][${timestamp}] ========================================`);
  }, [enabled, configKey, isComplete, manager, queryClient]);
  // NOTE: Using configKey instead of configs to prevent infinite loop
  // configKey is a stable string that only changes when calcIds change
}
