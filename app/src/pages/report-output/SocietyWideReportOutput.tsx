import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { useUserReportById } from '@/hooks/useUserReports';
import type { CalcStartConfig } from '@/types/calculation';
import ErrorPage from './ErrorPage';
import LoadingPage from './LoadingPage';
import NotFoundSubPage from './NotFoundSubPage';
import OverviewSubPage from './OverviewSubPage';

/**
 * Society-wide report output page
 * Uses existing society-wide calculation infrastructure (unchanged)
 *
 * This is the same as the societyWide branch of ReportOutput.page.tsx,
 * just isolated into its own component for clarity.
 */
export function SocietyWideReportOutput() {
  const { reportId } = useParams<{ reportId: string }>();

  // Fetch report and simulations
  const {
    report,
    simulations,
    isLoading: dataLoading,
    error: dataError,
  } = useUserReportById(reportId!);

  // Get calculation status for report
  const calcStatus = useCalculationStatus(report?.id || '', 'report');

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

  // Show loading page if calculation is still running
  if (calcStatus.isPending) {
    return (
      <LoadingPage message="Computing society-wide impacts..." progress={calcStatus.progress} />
    );
  }

  // Show error page if calculation failed
  if (calcStatus.isError) {
    const errorMessage = calcStatus.error?.message || 'Calculation failed';
    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // Show results if complete
  if (calcStatus.isComplete && calcStatus.result) {
    const output = calcStatus.result as SocietyWideOutput;

    return <OverviewSubPage output={output} outputType="societyWide" />;
  }

  // No output yet
  return <NotFoundSubPage />;
}
