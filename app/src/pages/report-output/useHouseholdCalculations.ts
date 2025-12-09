import { useEffect } from 'react';
import { useHouseholdReportOrchestrator } from '@/hooks/household';
import type { HouseholdReportViewModel } from './HouseholdReportViewModel';

/**
 * Hook to manage household calculation orchestration
 *
 * Single responsibility: Start calculations when needed
 * Delegates decision-making to ViewModel
 */
export function useHouseholdCalculations(viewModel: HouseholdReportViewModel) {
  const orchestrator = useHouseholdReportOrchestrator();

  useEffect(() => {
    if (viewModel.shouldStartCalculations(orchestrator)) {
      const config = viewModel.buildCalculationConfig();

      if (config) {
        orchestrator.startReport(config);
      }
    }
  }, [
    viewModel,
    orchestrator,
    // Re-run when simulation states change
    viewModel.simulationStates.isPending,
  ]);

  return { orchestrator };
}
