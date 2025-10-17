import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
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

  /**
   * Whether calculation is already running
   */
  isComputing: boolean;
}

/**
 * Hook to automatically start calculation when loading a report
 *
 * WHY THIS EXISTS:
 * Used for direct URL loads where calculation hasn't been started yet.
 * Without this, users who directly access /report-output/{id} would see
 * "idle" status forever with no way to start the calculation.
 *
 * This hook detects when:
 * 1. Report data is loaded
 * 2. Calculation is NOT complete
 * 3. Calculation is NOT already running
 * 4. No calculation has been started yet
 *
 * And then starts the calculation automatically.
 *
 * SAFETY: Only starts once per mount and includes multiple guards to prevent
 * duplicate starts.
 *
 * @example
 * // In ReportOutput.page:
 * useStartCalculationOnLoad({
 *   enabled: !!report && !!calcConfig,
 *   config: calcConfig,
 *   isComplete: calcStatus.isComplete,
 *   isComputing: calcStatus.isComputing,
 * });
 */
export function useStartCalculationOnLoad({
  enabled,
  config,
  isComplete,
  isComputing,
}: UseStartCalculationOnLoadParams): void {
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  useEffect(() => {
    // Don't start if:
    // - Not enabled
    // - Already started
    // - No config
    // - Already complete
    // - Already computing
    if (!enabled || startedRef.current || !config || isComplete || isComputing) {
      return;
    }

    console.log('[useStartCalculationOnLoad] Starting calculation for:', config.calcId);

    startedRef.current = true;

    const orchestrator = new CalcOrchestrator(
      queryClient,
      new ResultPersister(queryClient)
    );

    orchestrator.startCalculation(config).catch((error) => {
      console.error('[useStartCalculationOnLoad] Failed to start calculation:', error);
      startedRef.current = false; // Allow retry
    });
  }, [enabled, config, isComplete, isComputing, queryClient]);
}
