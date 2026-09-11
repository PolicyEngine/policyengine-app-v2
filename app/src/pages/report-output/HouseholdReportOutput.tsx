import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import SPMMethodologyFootnote from '@/components/household/SPMMethodologyFootnote';
import { Button, Stack, Text } from '@/components/ui';
import { useSimulationProgressDisplay } from '@/hooks/household';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { Household } from '@/models/Household';
import type { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { resolveDefaultReportOutputSubpage } from '@/utils/reportOutputSubpage';
import { convertPoliciesToV1Format, type HouseholdReproduction } from '@/utils/reproducibilityCode';
import { getModelMetadataError, getSPMSelectionError } from '@/utils/spmSelection';
import { getDisplayStatus } from '@/utils/statusMapping';
import DynamicsSubPage from './DynamicsSubPage';
import ErrorPage from './ErrorPage';
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
  output: HouseholdCalculationOutput[];
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
};

/**
 * Output tabs - require calculation results before rendering
 * These tabs need the OUTPUT data (calculated household values)
 */
const OUTPUT_TABS: Record<string, (props: OutputTabProps) => React.ReactElement> = {
  overview: ({ output, policyLabels, simulations, policies, activeView }) => (
    <OverviewSubPage
      output={output}
      outputType="household"
      policyLabels={policyLabels}
      simulations={simulations}
      policies={policies}
      activeView={activeView}
    />
  ),

  'comparative-analysis': ({ output, policyLabels, simulations, policies, activeView }) => (
    <OverviewSubPage
      output={output}
      outputType="household"
      policyLabels={policyLabels}
      simulations={simulations}
      policies={policies}
      activeView={activeView}
    />
  ),
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
  onEditHousehold?: () => void;
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
  onEditHousehold,
}: HouseholdReportOutputProps) {
  const normalizedSubpage = resolveDefaultReportOutputSubpage('household', subpage);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Build view model (memoized - recomputes only when props change)
  const viewModel = useMemo(
    () => new HouseholdReportViewModel(report, simulations, userSimulations, userPolicies),
    [report, simulations, userSimulations, userPolicies]
  );

  // Next.js renders this page before metadata finishes loading. Only pending reports
  // need this gate; saved results remain readable without revalidating old inputs.
  const { isPending, isComplete, isError } = viewModel.simulationStates;
  const modelReadinessError = getModelMetadataError(countryId, metadata);
  let householdReadinessError: string | null = null;
  if (isPending && report && !modelReadinessError) {
    if (report.countryId !== countryId) {
      householdReadinessError = 'Open this report in its original country before calculating.';
    } else {
      for (const simulation of simulations ?? []) {
        const household = households?.find(
          (candidate) =>
            candidate.id === simulation.populationId && candidate.countryId === countryId
        );
        householdReadinessError = household
          ? getSPMSelectionError(household, report.year, metadata)
          : 'Household inputs are unavailable. Reload the page to load them before calculating.';
        if (householdReadinessError) {
          break;
        }
      }
    }
  }
  const calculationReadinessError = modelReadinessError ?? householdReadinessError;
  useHouseholdCalculations(
    viewModel,
    !dataLoading && !dataError && !!report && !calculationReadinessError
  );

  // Get real-time progress display (for UI enhancement only)
  const {
    displayProgress,
    hasCalcStatus,
    message: progressMessage,
  } = useSimulationProgressDisplay(viewModel.simulationIds);

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
  if (normalizedSubpage === 'reproduce') {
    const reproductionSimulations: HouseholdReproduction[] = (simulations ?? []).map(
      (simulation, index) => {
        const household =
          households?.find(
            (candidate) =>
              candidate.id === simulation.populationId && candidate.countryId === report.countryId
          ) ?? null;
        const policy = policies?.find(
          (candidate) =>
            candidate.id === simulation.policyId &&
            (!candidate.countryId || candidate.countryId === report.countryId)
        );
        const output = simulation.output as Partial<HouseholdCalculationResult> | null;
        return {
          role: index === 0 ? 'baseline' : 'reform',
          household,
          policy: policy ? convertPoliciesToV1Format([policy]).baseline.data : null,
          spmConfig: output?.spm_config,
          spmProvenance: output?.spm_provenance,
          policyengineVersion:
            output?.policyengine_bundle?.policyengine_version ??
            output?.spm_provenance?.runtime_versions?.policyengine ??
            null,
          modelVersion:
            output?.policyengine_bundle?.model_version ??
            output?.spm_provenance?.runtime_versions?.[`policyengine-${report.countryId}`] ??
            null,
        };
      }
    );
    return (
      <HouseholdReproducibility
        countryId={report.countryId}
        year={report.year}
        simulations={reproductionSimulations}
      />
    );
  }

  const InputTabRenderer = INPUT_ONLY_TABS[normalizedSubpage];
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
    const hasUnavailableYear = simulations?.some(
      (simulation) =>
        simulation.status === 'error' && simulation.errorCode === 'SPM_YEAR_UNAVAILABLE'
    );
    return (
      <ErrorPage
        error={new Error(viewModel.getErrorMessage())}
        recovery={
          viewModel.hasCorrectiveSPMError() && onEditHousehold
            ? {
                label: hasUnavailableYear ? 'Edit report year' : 'Edit household inputs',
                description: hasUnavailableYear
                  ? 'Open report setup, choose Edit report, and select a year supported by the SPM artifact. Then update the report to calculate again.'
                  : 'Open report setup, choose Edit report, and edit the affected household to correct its SPM settings, geography, or adult composition. Then update the report to calculate again.',
                onClick: onEditHousehold,
              }
            : undefined
        }
      />
    );
  }

  // 5. Show loading if calculation is pending (for output-dependent tabs)
  if (isPending && calculationReadinessError) {
    return (
      <Stack gap="md">
        <Text role="status">{calculationReadinessError}</Text>
        {!modelReadinessError && householdReadinessError && onEditHousehold && (
          <Button onClick={onEditHousehold}>Edit household inputs</Button>
        )}
      </Stack>
    );
  }

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

    const OutputTabRenderer = OUTPUT_TABS[normalizedSubpage];
    if (OutputTabRenderer) {
      return (
        <>
          {OutputTabRenderer({
            report,
            simulations,
            policies,
            userPolicies,
            households,
            userHouseholds,
            output,
            policyLabels,
            activeView,
          })}
          <SPMMethodologyFootnote output={output} />
        </>
      );
    }
  }

  // 7. Unknown tab or no output
  return <NotFoundSubPage />;
}
