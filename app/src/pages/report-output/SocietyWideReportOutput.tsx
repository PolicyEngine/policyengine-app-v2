import { useMemo } from 'react';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useReportProgressDisplay } from '@/hooks/useReportProgressDisplay';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import type { CalcStartConfig } from '@/types/calculation';
import type { Geography } from '@/types/ingredients/Geography';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { getDisplayStatus } from '@/utils/statusMapping';
import { ComparativeAnalysisPage } from './ComparativeAnalysisPage';
import { ConstituencySubPage } from './ConstituencySubPage';
import DynamicsSubPage from './DynamicsSubPage';
import ErrorPage from './ErrorPage';
import LoadingPage from './LoadingPage';
import { LocalAuthoritySubPage } from './LocalAuthoritySubPage';
import NotFoundSubPage from './NotFoundSubPage';
import OverviewSubPage from './OverviewSubPage';
import PolicySubPage from './PolicySubPage';
import PopulationSubPage from './PopulationSubPage';

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
 * Uses existing society-wide calculation infrastructure (unchanged)
 *
 * This is the same as the societyWide branch of ReportOutput.page.tsx,
 * just isolated into its own component for clarity.
 */
export function SocietyWideReportOutput({
  reportId: _reportId,
  subpage = 'overview',
  activeView,
  report,
  simulations,
  userPolicies,
  policies,
  geographies,
}: SocietyWideReportOutputProps) {
  // Get calculation status for report (for state decisions)
  const calcStatus = useCalculationStatus(report?.id || '', 'report');

  // Get real-time progress display (for UI enhancement only)
  const {
    displayProgress,
    hasCalcStatus,
    message: progressMessage,
  } = useReportProgressDisplay(report?.id);

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
    enabled: !!report && !!calcConfigs,
    configs: calcConfigs || [],
    isComplete: calcStatus.isComplete,
  });

  // RENDER DECISIONS: Based on persistent Report.status (via calcStatus)
  // PROGRESS DISPLAY: Enhanced with ephemeral CalcStatus when available

  // Show error if no report data
  if (!report) {
    return <ErrorPage error={new Error('Report not found')} />;
  }

  // Show loading if calculation status is still initializing
  if (calcStatus.isInitializing) {
    return <LoadingPage message="Loading calculation status..." />;
  }

  // Show loading page if calculation is still running
  // CalcStatus provides progress display if available (same session)
  if (calcStatus.isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = progressMessage || `${displayStatusLabel} society-wide impacts...`;

    return <LoadingPage message={message} progress={hasCalcStatus ? displayProgress : undefined} />;
  }

  // Show error page if calculation failed
  if (calcStatus.isError) {
    const errorMessage = calcStatus.error?.message || 'Calculation failed';
    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // Show results if complete
  if (calcStatus.isComplete && calcStatus.result) {
    const output = calcStatus.result as SocietyWideOutput;

    // Route to appropriate SubPage based on subpage param
    switch (subpage) {
      case 'overview':
        return <OverviewSubPage output={output} outputType="societyWide" />;

      case 'policy':
        return (
          <PolicySubPage policies={policies} userPolicies={userPolicies} reportType="economy" />
        );

      case 'population':
        return (
          <PopulationSubPage
            baselineSimulation={simulations?.[0]}
            reformSimulation={simulations?.[1]}
            geographies={geographies}
          />
        );

      case 'dynamics':
        return (
          <DynamicsSubPage policies={policies} userPolicies={userPolicies} reportType="economy" />
        );

      case 'comparative-analysis':
        return (
          <ComparativeAnalysisPage
            key={`comparative-analysis-${activeView}`}
            output={output}
            view={activeView}
          />
        );

      case 'constituency':
        return <ConstituencySubPage output={output} />;

      case 'local-authority':
        return <LocalAuthoritySubPage output={output} />;

      // Congressional districts are now under Comparative Analysis sidebar

      default:
        return <NotFoundSubPage />;
    }
  }

  // No output yet
  return <NotFoundSubPage />;
}
