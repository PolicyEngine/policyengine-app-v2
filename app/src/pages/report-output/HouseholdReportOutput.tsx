import { useMemo } from 'react';
import { useSimulationProgressDisplay } from '@/hooks/household';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { getDisplayStatus } from '@/utils/statusMapping';
import DynamicsSubPage from './DynamicsSubPage';
import ErrorPage from './ErrorPage';
import { HouseholdComparativeAnalysisPage } from './HouseholdComparativeAnalysisPage';
import { HouseholdReportViewModel } from './HouseholdReportViewModel';
import LoadingPage from './LoadingPage';
import NotFoundSubPage from './NotFoundSubPage';
import OverviewSubPage from './OverviewSubPage';
import PolicySubPage from './PolicySubPage';
import PopulationSubPage from './PopulationSubPage';
import { useHouseholdCalculations } from './useHouseholdCalculations';

interface HouseholdReportOutputProps {
  reportId: string;
  report: Report | undefined;
  simulations: Simulation[] | undefined;
  userSimulations?: UserSimulation[];
  userPolicies?: UserPolicy[];
  policies?: Policy[];
  households?: Household[];
  userHouseholds?: UserHouseholdPopulation[];
  subpage?: string;
  activeView?: string;
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
  reportId: _reportId,
  report,
  simulations,
  userSimulations,
  userPolicies,
  policies,
  households,
  userHouseholds,
  subpage = 'overview',
  activeView = '',
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
  const {
    displayProgress,
    hasCalcStatus,
    message: progressMessage,
  } = useSimulationProgressDisplay(viewModel.simulationIds);

  // Extract states from view model
  const { isPending, isComplete, isError } = viewModel.simulationStates;

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
    const output = viewModel.getFormattedOutput();
    const policyLabels = viewModel.getPolicyLabels();

    if (!output) {
      return <NotFoundSubPage />;
    }

    // Render different content based on active tab
    switch (subpage) {
      case 'overview':
        return (
          <OverviewSubPage output={output} outputType="household" policyLabels={policyLabels} />
        );

      case 'comparative-analysis': {
        // Extract baseline and reform from output
        const outputs = Array.isArray(output) ? output : [output];
        const baseline = outputs[0];
        const reform = outputs.length > 1 ? outputs[1] : null;

        return (
          <HouseholdComparativeAnalysisPage
            key={`comparative-analysis-${activeView}`}
            baseline={baseline}
            reform={reform}
            simulations={simulations || []}
            policies={policies}
            userPolicies={userPolicies}
            households={households}
            view={activeView}
          />
        );
      }

      case 'policy':
        return (
          <PolicySubPage policies={policies} userPolicies={userPolicies} reportType="household" />
        );

      case 'population':
        return (
          <PopulationSubPage
            baselineSimulation={simulations?.[0]}
            reformSimulation={simulations?.[1]}
            households={households}
            userHouseholds={userHouseholds}
          />
        );

      case 'dynamics':
        return (
          <DynamicsSubPage policies={policies} userPolicies={userPolicies} reportType="household" />
        );

      default:
        return <NotFoundSubPage />;
    }
  }

  // No output yet
  return <NotFoundSubPage />;
}
