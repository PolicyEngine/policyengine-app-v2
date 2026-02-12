import { useMemo } from 'react';
import { useSimulationProgressDisplay } from '@/hooks/household';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { convertPoliciesToV1Format } from '@/utils/reproducibilityCode';
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
import HouseholdReproducibility from './reproduce-in-python/HouseholdReproducibility';
import { useHouseholdCalculations } from './useHouseholdCalculations';

/**
 * Props available to input-only tabs (don't need calculation output)
 */
interface InputTabProps {
  report: Report;
  simulations?: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * Props available to output tabs (need calculation results)
 */
interface OutputTabProps extends InputTabProps {
  output: Household[];
  policyLabels: string[];
  activeView: string;
}

/**
 * Input-only tabs - can render immediately after data loads, before calculation completes
 * These tabs only need the INPUT data (policies, households, simulations metadata)
 */
const INPUT_ONLY_TABS: Record<string, (props: InputTabProps) => React.ReactElement> = {
  policy: ({ policies, userPolicies }) => (
    <PolicySubPage policies={policies} userPolicies={userPolicies} reportType="household" />
  ),

  population: ({ simulations, households, userHouseholds }) => (
    <PopulationSubPage
      baselineSimulation={simulations?.[0]}
      reformSimulation={simulations?.[1]}
      households={households}
      userHouseholds={userHouseholds}
    />
  ),

  dynamics: ({ policies, userPolicies }) => (
    <DynamicsSubPage policies={policies} userPolicies={userPolicies} reportType="household" />
  ),

  reproduce: ({ report, policies, households }) => {
    const householdInput = households?.[0]?.householdData || {};
    const policyV1 = convertPoliciesToV1Format(policies);
    return (
      <HouseholdReproducibility
        countryId={report.countryId}
        policy={policyV1}
        householdInput={householdInput}
        region={report.countryId}
        dataset={null}
      />
    );
  },
};

/**
 * Output tabs - require calculation results before rendering
 * These tabs need the OUTPUT data (calculated household values)
 */
const OUTPUT_TABS: Record<string, (props: OutputTabProps) => React.ReactElement> = {
  overview: ({ output, policyLabels }) => (
    <OverviewSubPage output={output} outputType="household" policyLabels={policyLabels} />
  ),

  'comparative-analysis': ({
    output,
    simulations,
    policies,
    userPolicies,
    households,
    activeView,
  }) => {
    const baseline = output[0];
    const reform = output.length > 1 ? output[1] : null;
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
  },
};

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
 * - Tab Maps: Declarative configuration of which tabs need what data
 * - Input-only tabs render immediately after data loads
 * - Output tabs wait for calculation to complete
 * - ViewModel: Data transformation and business logic
 * - Hook: Orchestration side effects
 */
export function HouseholdReportOutput({
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

  // ============================================================
  // RENDER FLOW: Linear progression through data availability
  // ============================================================

  // 1. Show loading state while fetching data from DB
  if (dataLoading) {
    return <LoadingPage message="Loading report..." />;
  }

  // 2. Show error if data failed to load
  if (dataError || !report) {
    return <ErrorPage error={dataError || new Error('Report not found')} />;
  }

  // 3. Data loaded - render input-only tabs immediately (no calculation needed)
  const InputTabRenderer = INPUT_ONLY_TABS[subpage];
  if (InputTabRenderer) {
    return InputTabRenderer({
      report,
      simulations,
      policies,
      userPolicies,
      households,
      userHouseholds,
    });
  }

  // 4. Show error if any simulation has error status
  if (isError) {
    return <ErrorPage error={new Error(viewModel.getErrorMessage())} />;
  }

  // 5. Show loading if calculation is pending (for output-dependent tabs)
  if (isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = progressMessage || `${displayStatusLabel} household simulations...`;
    return <LoadingPage message={message} progress={hasCalcStatus ? displayProgress : undefined} />;
  }

  // 6. Calculation complete - render output tabs
  if (isComplete) {
    const rawOutput = viewModel.getFormattedOutput();
    const policyLabels = viewModel.getPolicyLabels();

    if (!rawOutput) {
      return <NotFoundSubPage />;
    }

    // Normalize output to always be an array
    const output = Array.isArray(rawOutput) ? rawOutput : [rawOutput];

    const OutputTabRenderer = OUTPUT_TABS[subpage];
    if (OutputTabRenderer) {
      return OutputTabRenderer({
        report,
        simulations,
        policies,
        userPolicies,
        households,
        userHouseholds,
        output,
        policyLabels,
        activeView,
      });
    }
  }

  // 7. Unknown tab or no output
  return <NotFoundSubPage />;
}
