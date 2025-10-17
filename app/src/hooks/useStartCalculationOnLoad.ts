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
 * Hook to automatically start/resume calculation when loading a report
 *
 * WHY THIS EXISTS:
 * Used for direct URL loads where calculation orchestrator isn't running.
 * Without this, users who directly access /report-output/{id} would see
 * status forever with no polling to update it.
 *
 * This hook detects when:
 * 1. Report data is loaded
 * 2. Calculation is NOT complete
 * 3. No orchestrator is running yet (either idle OR computing)
 *
 * And then starts/resumes the calculation orchestrator.
 *
 * IMPORTANT: This hook handles TWO scenarios:
 * - **Fresh start**: Cache shows 'idle' → Start new calculation
 * - **Resume**: Cache shows 'computing' → Resume polling for existing calculation
 *
 * The second scenario is critical: when you load a page showing a computing
 * calculation, the cache has status='computing' but NO orchestrator is polling
 * the API to update that status. This hook creates an orchestrator to resume polling.
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
    if (!enabled || startedRef.current || !config || isComplete) {
      return;
    }

    // Start/resume orchestrator for both idle and computing states
    if (isComputing) {
      console.log('[useStartCalculationOnLoad] Resuming polling for computing calculation:', config.calcId);
    } else {
      console.log('[useStartCalculationOnLoad] Starting fresh calculation for:', config.calcId);
    }

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
