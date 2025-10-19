import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserReportById } from '@/hooks/useUserReports';
import {
  useHouseholdReportOrchestrator,
  useSimulationProgress,
  useHouseholdReportCompletion,
} from '@/hooks/household';
import type { HouseholdReportConfig } from '@/types/calculation/household';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import LoadingPage from '../report-output/LoadingPage';
import ErrorPage from '../report-output/ErrorPage';
import NotFoundSubPage from '../report-output/NotFoundSubPage';
import OverviewSubPage from '../report-output/OverviewSubPage';
import { isFileLoadingAllowed } from 'vite';

/**
 * Household report output page
 *
 * SIMPLIFIED ARCHITECTURE:
 * - No HouseholdReportProgress tracking
 * - Subscribes to individual simulation CalcStatus
 * - Reactively marks report complete when all sims done
 * - Results live on simulations (not report)
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

  // Get simulation IDs
  const simulationIds = useMemo(() => {
    return simulations?.map((s) => s.id).filter((id): id is string => !!id) || [];
  }, [simulations]);

  // Subscribe to simulation progress (reads from CalcStatus cache)
  const { overallProgress, isComputing, isComplete, isError } = useSimulationProgress(simulationIds);

  console.log('[HouseholdReportOutput] Render:', {
    "reportId": reportId,
    "report": report,
    "simulations": simulations,
    "dataLoading": dataLoading,
    "dataError": dataError,
    "overallProgress": overallProgress,
    "isComputing": isComputing,
    "isComplete": isComplete,
    "isError": isError,
  });

  // Reactively mark report complete when all simulations are done
  // TODO: Why not just do this upon calculation completion in orchestrator?
  useHouseholdReportCompletion(report, simulations);

  // TODO: Check if this can go
  // Create stable key from simulation IDs to prevent infinite loops
  const simulationIdsKey = simulationIds.join('|');

  // Check if simulations need to be calculated
  const needsCalc = useMemo(() => {
    if (!simulations || simulations.length === 0) return false;
    return simulations.some((sim) => !sim.output || sim.status !== 'complete');
  }, [simulations]);

  // Start calculations if needed
  useEffect(() => {
    if (!report?.id || !simulations || simulations.length === 0) return;

    if (needsCalc) {
      // Check if any simulation is already calculating
      const alreadyCalculating = simulations.some((sim) => orchestrator.isCalculating(sim.id!));

      if (!alreadyCalculating) {
        console.log('[HouseholdReportOutput] Starting calculations for report', report.id);

        // Build configs for each simulation
        const configs = simulations
          .filter((sim) => sim.id && sim.populationId && sim.policyId)
          .map((sim) => ({
            simulationId: sim.id!,
            populationId: sim.populationId!,
            policyId: sim.policyId!,
          }));

        const config: HouseholdReportConfig = {
          reportId: report.id,
          simulationConfigs: configs,
          countryId: report.countryId,
        };

        // Start calculations (orchestrator manages blocking calls)
        orchestrator.startReport(config);
      }
    }
  }, [report?.id, simulationIdsKey, orchestrator, simulations, needsCalc]);

  // Show loading state while fetching data
  if (dataLoading) {
    return <LoadingPage message="Loading report..." />;
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return <ErrorPage error={dataError || new Error('Report not found')} />;
  }

  // Show loading during calculations OR if calculations haven't started yet
  if (isComputing || needsCalc) {
    return (
      <LoadingPage
        message={`Calculating household simulations... ${Math.round(overallProgress)}%`}
        progress={overallProgress}
      />
    );
  }

  // Show error if calculations failed
  if (isError) {
    const errorSims = simulations?.filter((s) => s.status === 'error') || [];
    const errorMessage =
      errorSims.length > 0
        ? errorSims.map((s) => `Simulation ${s.id}: Failed to calculate`).join('\n')
        : 'Calculation failed';

    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // Show results if complete
  if (isComplete || simulations?.every((s) => s.output && s.status === 'complete')) {
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
