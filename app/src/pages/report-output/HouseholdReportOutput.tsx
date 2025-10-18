import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserReportById } from '@/hooks/useUserReports';
import { useHouseholdReportProgress, useHouseholdReportOrchestrator } from '@/hooks/household';
import type { HouseholdReportConfig } from '@/types/calculation/household';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import LoadingPage from '../report-output/LoadingPage';
import ErrorPage from '../report-output/ErrorPage';
import NotFoundSubPage from '../report-output/NotFoundSubPage';
import OverviewSubPage from '../report-output/OverviewSubPage';

/**
 * Household report output page
 * Uses new household-specific orchestration infrastructure
 *
 * KEY DIFFERENCES FROM ECONOMY:
 * - Uses HouseholdReportOrchestrator (not CalcOrchestrator)
 * - Tracks N independent simulation calculations
 * - Shows aggregated progress across all simulations
 * - Results stored in simulation.output (not report.output)
 */
export function HouseholdReportOutput() {
  const { reportId } = useParams<{ reportId: string }>();
  const orchestrator = useHouseholdReportOrchestrator();

  // Fetch report and simulations
  const {
    report,
    simulations,
    isLoading: dataLoading,
    error: dataError,
  } = useUserReportById(reportId!);

  // Subscribe to household report progress
  const { progress, overallProgress, isComputing, isComplete, isError } =
    useHouseholdReportProgress(reportId!);

  // Create stable key from simulation IDs to prevent infinite loops from array reference changes
  const simulationIdsKey = useMemo(() => {
    return simulations?.map((s) => s.id).join('|') || '';
  }, [simulations]);

  // Start calculations if needed
  useEffect(() => {
    if (!report || !simulations || simulations.length === 0) return;

    // Check if any simulation needs calculation
    const needsCalc = simulations.some((sim) => !sim.output || sim.status !== 'complete');

    if (needsCalc && !orchestrator.isCalculating(reportId!)) {
      console.log('[HouseholdReportOutput] Starting calculations for report', reportId);

      // Build configs for each simulation
      const configs = simulations
        .filter((sim) => sim.id && sim.populationId && sim.policyId)
        .map((sim) => ({
          simulationId: sim.id!,
          populationId: sim.populationId!,
          policyId: sim.policyId!,
        }));

      const config: HouseholdReportConfig = {
        reportId: reportId!,
        simulationConfigs: configs,
        countryId: report.countryId,
      };

      // Start calculations
      orchestrator.startReport(config);
    }
  }, [report, simulationIdsKey, orchestrator, reportId, simulations]);
  // Use simulationIdsKey for stability, keep simulations for the loop above

  // Show loading state while fetching data
  if (dataLoading) {
    return <LoadingPage message="Loading report..." />;
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return <ErrorPage error={dataError || new Error('Report not found')} />;
  }

  // Show loading during calculations
  if (isComputing) {
    return (
      <LoadingPage
        message={`Calculating household simulations... ${Math.round(overallProgress)}%`}
        progress={overallProgress}
      />
    );
  }

  // Show error if calculations failed
  if (isError) {
    const errorMessage =
      progress?.simulationIds
        .map((simId) => {
          const simStatus = progress.simulations[simId];
          if (simStatus.status === 'error') {
            return `Simulation ${simId}: ${simStatus.error?.message || 'Unknown error'}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n') || 'Calculation failed';

    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // Show results if complete
  if (isComplete || simulations.every((s) => s.output && s.status === 'complete')) {
    // Collect all simulation outputs
    const householdOutputs: Household[] = simulations
      .filter((sim) => sim.output)
      .map((sim, index) => ({
        id: `${report.id}-sim${index + 1}`,
        countryId: report.countryId,
        householdData: sim.output as HouseholdData,
      }));

    if (householdOutputs.length === 0) {
      return <NotFoundSubPage />;
    }

    // Pass array of household outputs to overview page
    const output = householdOutputs.length > 1 ? householdOutputs : householdOutputs[0];

    return (
      <OverviewSubPage
        output={output}
        outputType="household"
      />
    );
  }

  // No output yet
  return <NotFoundSubPage />;
}
