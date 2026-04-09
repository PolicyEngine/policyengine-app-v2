import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useReportProgressDisplay } from '@/hooks/useReportProgressDisplay';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { RootState } from '@/store';
import type { CalcStartConfig } from '@/types/calculation';
import type { Geography } from '@/types/ingredients/Geography';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { resolveDefaultReportOutputSubpage } from '@/utils/reportOutputSubpage';
import { isBudgetWindowReportYear } from '@/utils/reportTiming';
import { convertPoliciesToV1Format } from '@/utils/reproducibilityCode';
import { getDisplayStatus } from '@/utils/statusMapping';
import {
  BUDGET_WINDOW_SUBPAGE,
  isBudgetWindowReportOutput,
  resolveBudgetWindowSubpage,
} from './budget-window/budgetWindowUtils';
import { BudgetWindowSubPage } from './BudgetWindowSubPage';
import { ComparativeAnalysisPage } from './ComparativeAnalysisPage';
import { ConstituencySubPage } from './ConstituencySubPage';
import DynamicsSubPage from './DynamicsSubPage';
import ErrorPage from './ErrorPage';
import { useBudgetWindowCalculation } from './hooks/useBudgetWindowCalculation';
import LoadingPage from './LoadingPage';
import { LocalAuthoritySubPage } from './LocalAuthoritySubPage';
import MigrationSubPage from './MigrationSubPage';
import NotFoundSubPage from './NotFoundSubPage';
import PolicySubPage from './PolicySubPage';
import PopulationSubPage from './PopulationSubPage';
import PolicyReproducibility from './reproduce-in-python/PolicyReproducibility';

/**
 * Dataset entry from metadata economy options
 */
interface DatasetEntry {
  name: string;
  label: string;
  title: string;
  default: boolean;
}

/**
 * Props available to input-only tabs (don't need calculation output)
 */
interface InputTabProps {
  report: Report;
  simulations?: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  geographies?: Geography[];
  userGeographies?: UserGeographyPopulation[];
  datasets?: DatasetEntry[];
}

/**
 * Props available to output tabs (need calculation results)
 */
interface OutputTabProps extends InputTabProps {
  output: SocietyWideOutput;
  activeView?: string;
}

/**
 * Input-only tabs - can render immediately after data loads, before calculation completes
 * These tabs only need the INPUT data (policies, geographies, simulations metadata)
 */
const INPUT_ONLY_TABS: Record<string, (props: InputTabProps) => React.ReactElement> = {
  policy: ({ policies, userPolicies }) => (
    <PolicySubPage policies={policies} userPolicies={userPolicies} reportType="economy" />
  ),

  population: ({ simulations, geographies }) => (
    <PopulationSubPage
      baselineSimulation={simulations?.[0]}
      reformSimulation={simulations?.[1]}
      geographies={geographies}
    />
  ),

  dynamics: ({ policies, userPolicies }) => (
    <DynamicsSubPage policies={policies} userPolicies={userPolicies} reportType="economy" />
  ),

  reproduce: ({ report, policies, simulations, datasets }) => {
    const policyV1 = convertPoliciesToV1Format(policies);
    const defaultDataset = datasets?.find((d) => d.default);
    const datasetName = defaultDataset?.name || null;
    return (
      <PolicyReproducibility
        countryId={report.countryId}
        policy={policyV1}
        region={simulations?.[0]?.populationId || report.countryId}
        dataset={datasetName}
        isDefaultDataset
      />
    );
  },
};

/**
 * Output tabs - require calculation results before rendering
 * These tabs need the OUTPUT data (calculated society-wide impacts)
 */
const OUTPUT_TABS: Record<string, (props: OutputTabProps) => React.ReactElement> = {
  migration: ({ output, report, simulations, geographies }) => (
    <MigrationSubPage
      output={output}
      report={report}
      simulations={simulations}
      geographies={geographies}
    />
  ),

  'comparative-analysis': ({ output, simulations, report, activeView }) => (
    <ComparativeAnalysisPage
      output={output}
      view={activeView}
      reformPolicyId={simulations?.[1]?.policyId}
      baselinePolicyId={simulations?.[0]?.policyId}
      year={report.year}
      region={simulations?.[0]?.populationId}
    />
  ),

  constituency: ({ output }) => <ConstituencySubPage output={output} />,

  'local-authority': ({ output }) => <LocalAuthoritySubPage output={output} />,
};

interface SocietyWideReportOutputProps {
  reportId: string;
  subpage?: string;
  activeView?: string;
  report?: Report;
  simulations?: Simulation[];
  userSimulations?: UserSimulation[];
  userPolicies?: UserPolicy[];
  policies?: Policy[];
  geographies?: Geography[];
}

/**
 * Society-wide report output page
 *
 * ARCHITECTURE:
 * - Tab Maps: Declarative configuration of which tabs need what data
 * - Input-only tabs render immediately after data loads
 * - Output tabs wait for calculation to complete
 * - Hook: Orchestration side effects
 */
export function SocietyWideReportOutput({
  reportId: _reportId,
  subpage = 'migration',
  activeView,
  report,
  simulations,
  userPolicies,
  policies,
  geographies,
}: SocietyWideReportOutputProps) {
  const isBudgetWindow = isBudgetWindowReportYear(report?.year || '');
  const normalizedSubpage = resolveDefaultReportOutputSubpage('societyWide', subpage, {
    societyWideDefaultSubpage: isBudgetWindow ? BUDGET_WINDOW_SUBPAGE : undefined,
  });
  const effectiveSubpage = isBudgetWindow
    ? resolveBudgetWindowSubpage(normalizedSubpage)
    : normalizedSubpage;

  // Read datasets from metadata for the reproduce tab
  const datasets = useSelector((state: RootState) => state.metadata.economyOptions?.datasets);

  // Get calculation status for report (for state decisions)
  const calcStatus = useCalculationStatus(report?.id || '', 'report');

  // Get real-time progress display (for UI enhancement only)
  const {
    displayProgress,
    hasCalcStatus,
    message: progressMessage,
  } = useReportProgressDisplay(report?.id);
  const shouldRunBudgetWindowCalculation =
    isBudgetWindow && effectiveSubpage !== 'population' && !!report && !!simulations?.[0];

  useBudgetWindowCalculation({
    enabled: shouldRunBudgetWindowCalculation,
    report,
    simulations,
  });

  // Build calculation config for auto-start
  const calcConfigs = useMemo(() => {
    if (!report || !simulations?.[0]) {
      return null;
    }

    const simulation1 = simulations[0];
    const simulation2 = simulations[1] || null;

    if (!report.id) {
      return null;
    }

    const geography = {
      id: `${report.countryId}-${simulation1.populationId}`,
      countryId: report.countryId,
      scope: 'national' as const,
      geographyId: simulation1.populationId || '',
    };

    return [
      {
        calcId: report.id,
        targetType: 'report' as const,
        countryId: report.countryId,
        year: report.year,
        simulations: {
          simulation1,
          simulation2,
        },
        populations: {
          household1: null,
          household2: null,
          geography1: geography,
          geography2: null,
        },
      } as CalcStartConfig,
    ];
  }, [report, simulations]);

  // Auto-start calculation if needed (direct URL loads)
  useStartCalculationOnLoad({
    enabled: !!report && !!calcConfigs && !isBudgetWindow,
    configs: calcConfigs || [],
    isComplete: calcStatus.isComplete,
  });

  // ============================================================
  // RENDER FLOW: Linear progression through data availability
  // ============================================================

  // 1. Show error if no report data
  if (!report) {
    return <ErrorPage error={new Error('Report not found')} />;
  }

  // 2. Data loaded - render input-only tabs immediately (no calculation needed)
  const InputTabRenderer = INPUT_ONLY_TABS[effectiveSubpage];
  if (InputTabRenderer) {
    return InputTabRenderer({
      report,
      simulations,
      policies,
      userPolicies,
      geographies,
      datasets,
    });
  }

  if (isBudgetWindow && isBudgetWindowReportOutput(report.output)) {
    return <BudgetWindowSubPage output={report.output} countryId={report.countryId} />;
  }

  // 3. Show loading if calculation status is still initializing
  if (calcStatus.isInitializing) {
    return <LoadingPage message="Loading calculation status..." />;
  }

  // 4. Show error page if calculation failed
  if (calcStatus.isError) {
    const errorMessage = calcStatus.error?.message || 'Calculation failed';
    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // 5. Show loading page if calculation is still running
  if (calcStatus.isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = progressMessage || `${displayStatusLabel} society-wide impacts...`;
    return <LoadingPage message={message} progress={hasCalcStatus ? displayProgress : undefined} />;
  }

  // 6. Calculation complete - render output tabs
  if (calcStatus.isComplete && calcStatus.result) {
    if (isBudgetWindow && isBudgetWindowReportOutput(calcStatus.result)) {
      return <BudgetWindowSubPage output={calcStatus.result} countryId={report.countryId} />;
    }

    const output = calcStatus.result as SocietyWideOutput;

    const OutputTabRenderer = OUTPUT_TABS[effectiveSubpage];
    if (OutputTabRenderer) {
      return OutputTabRenderer({
        report,
        simulations,
        policies,
        userPolicies,
        geographies,
        output,
        activeView,
      });
    }
  }

  // 7. Unknown tab or no output
  if (isBudgetWindow && isBudgetWindowReportOutput(report.output)) {
    return <BudgetWindowSubPage output={report.output} countryId={report.countryId} />;
  }

  return <NotFoundSubPage />;
}
