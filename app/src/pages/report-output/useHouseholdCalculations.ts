import { useEffect } from 'react';
import { useHouseholdReportOrchestrator } from '@/hooks/household';
import type { HouseholdReportViewModel } from './HouseholdReportViewModel';

/**
 * Hook to manage household calculation orchestration
 *
 * Single responsibility: Start calculations when needed
 * Delegates decision-making to ViewModel
 */
export function useHouseholdCalculations(
  viewModel: HouseholdReportViewModel,
  inputsReady: boolean
) {
  const orchestrator = useHouseholdReportOrchestrator();

  useEffect(() => {
    if (inputsReady && viewModel.shouldStartCalculations(orchestrator)) {
      const config = viewModel.buildCalculationConfig();

      if (config) {
        orchestrator.startReport(config);
      }
    }
  }, [
    viewModel,
    orchestrator,
    inputsReady,
    // Re-run when simulation states change
    viewModel.simulationStates.isPending,
  ]);

  return { orchestrator };
}
