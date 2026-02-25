import { useMemo } from 'react';
import type { AggregatedCalcStatus } from '@/hooks/useAggregatedCalculationStatus';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import type { CalcStartConfig } from '@/types/calculation';
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

interface HouseholdReportOutputProps {
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
 * - ViewModel: Data transformation (extract outputs from CalcStatus, policy labels)
 * - CalcOrchestrator + HouseholdCalcStrategy: Async job management and polling
 * - useStartCalculationOnLoad: Ensures calculations run on direct URL loads
 * - useCalculationStatus: Aggregated status across all per-simulation calculations
 * - Component: Presentation only
 */
export function HouseholdReportOutput({
  report,
  simulations,
  userSimulations: _userSimulations,
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
    () => new HouseholdReportViewModel(report, simulations, userPolicies),
    [report, simulations, userPolicies]
  );

  const simulationIds = viewModel.simulationIds;

  // Get aggregated CalcStatus across all simulations
  const calcStatus = useCalculationStatus(simulationIds, 'simulation') as AggregatedCalcStatus;

  // Build CalcStartConfig for each simulation (for direct URL loads)
  // Each simulation gets its own CalcOrchestrator → HouseholdCalcStrategy,
  // matching the pattern used by useCreateReport for household reports
  const calcConfigs = useMemo(() => {
    if (!report || !simulations?.length) {
      return null;
    }

    return simulations
      .filter((sim) => sim.id && sim.populationId)
      .map(
        (sim): CalcStartConfig => ({
          calcId: sim.id!,
          targetType: 'simulation',
          countryId: report.countryId,
          year: report.year,
          reportId: report.id,
          simulations: {
            simulation1: sim,
            simulation2: null,
          },
          populations: {
            household1: households?.find((h) => h.id === sim.populationId) || null,
            household2: null,
            geography1: null,
            geography2: null,
          },
        })
      );
  }, [report, simulations, households]);

  // Auto-start calculations if needed (direct URL loads)
  useStartCalculationOnLoad({
    enabled: !!report && !!calcConfigs,
    configs: calcConfigs || [],
    isComplete: calcStatus.isComplete,
  });

  // RENDER DECISIONS: Based on aggregated CalcStatus across all simulations

  // Show loading state while fetching data
  if (dataLoading) {
    return <LoadingPage message="Loading report..." />;
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return <ErrorPage error={dataError || new Error('Report not found')} />;
  }

  // Show loading if calculation status is still initializing
  if (calcStatus.isInitializing) {
    return <LoadingPage message="Loading calculation status..." />;
  }

  // Show error if any simulation calculation failed
  if (calcStatus.isError) {
    return <ErrorPage error={new Error(viewModel.getErrorMessage(calcStatus.error))} />;
  }

  // Show loading if any simulation calculation is still running
  if (calcStatus.isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = calcStatus.message || `${displayStatusLabel} household simulations...`;

    return <LoadingPage message={message} progress={calcStatus.progress} />;
  }

  // Show results if all simulations complete
  if (calcStatus.isComplete) {
    const output = viewModel.getFormattedOutput(calcStatus.calculations);
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
