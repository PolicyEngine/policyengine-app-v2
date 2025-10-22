import { useMemo } from 'react';
import { useSimulationProgressDisplay } from '@/hooks/household';
import { getDisplayStatus } from '@/utils/statusMapping';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import NotFoundSubPage from './NotFoundSubPage';
import OverviewSubPage from './OverviewSubPage';
import { HouseholdReportViewModel } from './HouseholdReportViewModel';
import { useHouseholdCalculations } from './useHouseholdCalculations';

interface HouseholdReportOutputProps {
  reportId: string;
  report: Report | undefined;
  simulations: Simulation[] | undefined;
  userSimulations?: UserSimulation[];
  userPolicies?: UserPolicy[];
  activeTab?: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Household report output page
 *
 * ARCHITECTURE:
 * - ViewModel: Data transformation and business logic
 * - Hook: Orchestration side effects
 * - Component: Presentation only
 */
export function HouseholdReportOutput({
  reportId,
  report,
  simulations,
  userSimulations,
  userPolicies,
  activeTab = 'overview',
  isLoading: dataLoading,
  error: dataError,
}: HouseholdReportOutputProps) {
  // Build view model (memoized - recomputes only when props change)
  const viewModel = useMemo(
    () => new HouseholdReportViewModel(report, simulations, userSimulations, userPolicies),
    [report, simulations, userSimulations, userPolicies]
  );

  // Handle calculation orchestration
  useHouseholdCalculations(viewModel);

  // Get real-time progress display (for UI enhancement only)
  const { displayProgress, hasCalcStatus, message: progressMessage } =
    useSimulationProgressDisplay(viewModel.simulationIds);

  // Extract states from view model
  const { isPending, isComplete, isError } = viewModel.simulationStates;

  // Logging for debugging
  console.log('[HouseholdReportOutput] Render:', {
    reportId,
    report,
    simulations,
    dataLoading,
    dataError,
    displayProgress,
    hasCalcStatus,
    isPending,
    isComplete,
    isError,
  });

  // RENDER DECISIONS: Based on persistent Simulation.status
  // PROGRESS DISPLAY: Enhanced with ephemeral CalcStatus when available

  // Show loading state while fetching data
  if (dataLoading) {
    return <LoadingPage message="Loading report..." />;
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return <ErrorPage error={dataError || new Error('Report not found')} />;
  }

  // Show error if any simulation has error status (persistent)
  if (isError) {
    return <ErrorPage error={new Error(viewModel.getErrorMessage())} />;
  }

  // Show loading if pending (needs calculation OR currently calculating)
  // CalcStatus provides progress display if available (same session)
  if (isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = progressMessage || `${displayStatusLabel} household simulations...`;

    return <LoadingPage message={message} progress={hasCalcStatus ? displayProgress : undefined} />;
  }

  // Show results if all simulations complete (persistent status)
  if (isComplete) {
    console.log('[HouseholdReportOutput] ========== PREPARING HOUSEHOLD OUTPUTS ==========');
    console.log('[HouseholdReportOutput] Complete simulations:', simulations);
    console.log(
      '[HouseholdReportOutput] Simulation statuses:',
      simulations?.map(s => ({ id: s.id, status: s.status, hasOutput: !!s.output }))
    );

    const output = viewModel.getFormattedOutput();
    const policyLabels = viewModel.getPolicyLabels();

    console.log('[HouseholdReportOutput] Final output:', output);
    console.log('[HouseholdReportOutput] Policy labels:', policyLabels);

    if (!output) {
      return <NotFoundSubPage />;
    }

    // Render different content based on active tab
    switch (activeTab) {
      case 'overview':
        return <OverviewSubPage output={output} outputType="household" policyLabels={policyLabels} />;
      case 'baseline-results':
        // TODO: Implement baseline results view
        return <NotFoundSubPage />;
      case 'reform-results':
        // TODO: Implement reform results view
        return <NotFoundSubPage />;
      case 'parameters':
        // TODO: Implement parameters view
        return <NotFoundSubPage />;
      case 'population':
        // TODO: Implement population view
        return <NotFoundSubPage />;
      default:
        return <NotFoundSubPage />;
    }
  }

  // No output yet
  return <NotFoundSubPage />;
}
