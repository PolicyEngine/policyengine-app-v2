import { useEffect, useMemo } from 'react';
import {
  useHouseholdReportOrchestrator,
  useSimulationProgressDisplay,
} from '@/hooks/household';
import { getDisplayStatus } from '@/utils/statusMapping';
import type { HouseholdReportConfig } from '@/types/calculation/household';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import LoadingPage from '../report-output/LoadingPage';
import ErrorPage from '../report-output/ErrorPage';
import NotFoundSubPage from '../report-output/NotFoundSubPage';
import OverviewSubPage from '../report-output/OverviewSubPage';

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
 * SIMPLIFIED ARCHITECTURE:
 * - No HouseholdReportProgress tracking
 * - Subscribes to individual simulation CalcStatus
 * - Reactively marks report complete when all sims done
 * - Results live on simulations (not report)
 */
export function HouseholdReportOutput({ reportId, report, simulations, userSimulations, userPolicies, activeTab = 'overview', isLoading: dataLoading, error: dataError }: HouseholdReportOutputProps) {
  const orchestrator = useHouseholdReportOrchestrator();

  // Get simulation IDs
  const simulationIds = useMemo(() => {
    return simulations?.map((s) => s.id).filter((id): id is string => !!id) || [];
  }, [simulations]);

  // Get real-time progress from CalcStatus (for display only)
  const { displayProgress, hasCalcStatus } = useSimulationProgressDisplay(simulationIds);

  // Derive state from Simulation.status (SOURCE OF TRUTH)
  // Note: API uses 'pending' for "not complete yet" (includes actively calculating)
  const simulationStates = useMemo(() => {
    console.log('[HouseholdReportOutput] Deriving simulation states from persistent statuses');
    console.log('[HouseholdReportOutput] Current simulations:', simulations);

    if (!simulations || simulations.length === 0) {
      return { isPending: false, isComplete: false, isError: false };
    }

    return {
      // 'pending' means: needs calculation OR currently calculating
      // Also check for undefined/null status (defensive)
      isPending: simulations.some(s => !s.status || s.status === 'pending'),
      isComplete: simulations.every(s => s.status === 'complete'),
      isError: simulations.some(s => s.status === 'error'),
    };
  }, [simulations]);

  const { isPending, isComplete, isError } = simulationStates;

  console.log('[HouseholdReportOutput] Render:', {
    "reportId": reportId,
    "report": report,
    "simulations": simulations,
    "dataLoading": dataLoading,
    "dataError": dataError,
    "displayProgress": displayProgress,
    "hasCalcStatus": hasCalcStatus,
    "isPending": isPending,
    "isComplete": isComplete,
    "isError": isError,
  });

  // TODO: Check if this can go
  // Create stable key from simulation IDs to prevent infinite loops
  const simulationIdsKey = simulationIds.join('|');

  // Start calculations if needed (decision based on Simulation.status)
  useEffect(() => {
    if (!report?.id || !simulations || simulations.length === 0) return;

    if (isPending) {
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
          report: report,
          simulationConfigs: configs,
          countryId: report.countryId,
        };

        // Start calculations (orchestrator manages blocking calls)
        orchestrator.startReport(config);
      }
    }
  }, [report?.id, isPending, simulations, orchestrator]);

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
    const errorSims = simulations?.filter((s) => s.status === 'error') || [];
    const errorMessage =
      errorSims.length > 0
        ? errorSims.map((s) => `Simulation ${s.id}: Failed to calculate`).join('\n')
        : 'Calculation failed';

    return <ErrorPage error={new Error(errorMessage)} />;
  }

  // Show loading if pending (needs calculation OR currently calculating)
  // CalcStatus provides progress display if available (same session)
  if (isPending) {
    const displayStatusLabel = getDisplayStatus('pending');
    const message = hasCalcStatus
      ? `${displayStatusLabel} household simulations... ${Math.round(displayProgress)}%`
      : `${displayStatusLabel} household simulations...`;

    return (
      <LoadingPage
        message={message}
        progress={hasCalcStatus ? displayProgress : undefined}
      />
    );
  }

  // Show results if all simulations complete (persistent status)
  if (isComplete) {
    console.log('[HouseholdReportOutput] ========== PREPARING HOUSEHOLD OUTPUTS ==========');
    console.log('[HouseholdReportOutput] Complete simulations:', simulations);
    console.log('[HouseholdReportOutput] Simulation statuses:', simulations?.map(s => ({ id: s.id, status: s.status, hasOutput: !!s.output })));

    // Collect all simulation outputs
    const householdOutputs: Household[] = (simulations || [])
      .filter((sim) => sim.output)
      .map((sim, index) => {
        console.log(`[HouseholdReportOutput] Mapping simulation ${index} (ID: ${sim.id}):`, {
          simOutput: sim.output,
          simOutputType: typeof sim.output,
          simOutputKeys: sim.output ? Object.keys(sim.output) : [],
        });

        return {
          id: sim.id, // Use actual simulation ID, not generated
          countryId: report.countryId,
          householdData: sim.output as HouseholdData,
        };
      });

    console.log('[HouseholdReportOutput] Final householdOutputs array length:', householdOutputs.length);
    console.log('[HouseholdReportOutput] Final householdOutputs:', householdOutputs);
    console.log('[HouseholdReportOutput] Baseline (outputs[0]):', householdOutputs[0]);
    if (householdOutputs[1]) {
      console.log('[HouseholdReportOutput] Reform (outputs[1]):', householdOutputs[1]);
    }

    if (householdOutputs.length === 0) {
      return <NotFoundSubPage />;
    }

    // Pass array of household outputs to overview page
    const output = householdOutputs.length > 1 ? householdOutputs : householdOutputs[0];

    // Extract policy labels from UserPolicy records (matched via simulation.policyId)
    const policyLabels = simulations
      ?.filter((sim) => sim.output)
      .map((sim) => {
        // Find corresponding UserPolicy to get label
        const userPolicy = userPolicies?.find((up) => up.policyId === sim.policyId);
        console.log('[HouseholdReportOutput] userPolicy for simulation', sim.id, '(policyId:', sim.policyId, '):', userPolicy);
        return userPolicy?.label || `Policy ${sim.policyId}`;
      }) || [];

    console.log('[HouseholdReportOutput] Policy labels for title:', policyLabels);

    // Render different content based on active tab
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewSubPage
            output={output}
            outputType="household"
            policyLabels={policyLabels}
          />
        );
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
