import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { getDatasetIdForRegion } from '@/api/societyWideCalculation';
import {
  createEconomyAnalysis,
  EconomicImpactRequest,
  EconomicImpactResponse,
} from '@/api/v2/economyAnalysis';
import {
  createHouseholdAnalysis,
  HouseholdImpactRequest,
  HouseholdImpactResponse,
} from '@/api/v2/householdAnalysis';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { useUserId } from '@/hooks/useUserId';
import { countryIds } from '@/libs/countries';
import { reportAssociationKeys, reportKeys, simulationAssociationKeys } from '@/libs/queryKeys';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserReport } from '@/types/ingredients/UserReport';

// ============================================================================
// Types
// ============================================================================

interface CreateReportParams {
  countryId: (typeof countryIds)[number];
  year: string;
  simulations: {
    simulation1: Simulation;
    simulation2?: Simulation | null;
  };
  populations: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

interface CreateReportResult {
  report: Report;
  userReport: UserReport;
  simulations: {
    simulation1: Simulation;
    simulation2?: Simulation | null;
  };
  populations: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Call v2 household analysis endpoint per simulation and extract simulation IDs.
 * Each simulation gets its own analysis call. The v2 API is idempotent —
 * same inputs always return the same report_id and simulation IDs.
 */
async function createHouseholdReportV2(
  householdId: string,
  allSimulations: Simulation[]
): Promise<{
  v2Simulations: Simulation[];
  responses: HouseholdImpactResponse[];
}> {
  const v2Simulations: Simulation[] = [];
  const responses: HouseholdImpactResponse[] = [];

  for (const sim of allSimulations) {
    const request: HouseholdImpactRequest = {
      household_id: householdId,
      policy_id: sim.policyId ?? null,
    };
    const response = await createHouseholdAnalysis(request);
    responses.push(response);

    // Extract the primary simulation ID for this analysis:
    // - If reform_simulation exists (policy_id was set), use reform_simulation.id
    // - Otherwise use baseline_simulation.id (baseline-only / current law)
    const primarySimId = response.reform_simulation?.id || response.baseline_simulation?.id;

    if (primarySimId) {
      v2Simulations.push({
        id: primarySimId,
        policyId: sim.policyId,
        populationId: householdId,
        populationType: 'household',
        label: sim.label,
        isCreated: true,
      });
    }
  }

  return { v2Simulations, responses };
}

/**
 * Call v2 economy analysis endpoint and extract report + simulation IDs.
 */
async function createEconomyReportV2(
  countryId: string,
  region: string,
  reformPolicyId: string | null
): Promise<{
  response: EconomicImpactResponse;
  reportId: string;
  v2SimulationIds: string[];
}> {
  const datasetId = await getDatasetIdForRegion(countryId, region);

  const request: EconomicImpactRequest = {
    tax_benefit_model_name: `policyengine_${countryId}`,
    region,
    policy_id: reformPolicyId,
    dataset_id: datasetId,
  };

  const response = await createEconomyAnalysis(request);
  const v2SimulationIds = [response.baseline_simulation.id, response.reform_simulation.id];

  return { response, reportId: response.report_id, v2SimulationIds };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Creates a report using v2 analysis endpoints.
 *
 * Flow:
 * 1. Call v2 analysis endpoint (economy or household) to get report_id + simulation IDs
 * 2. Create UserReport association with v2 IDs
 * 3. Create UserSimulation associations for each v2 simulation
 * 4. Start CalcOrchestrators for polling (idempotent — re-uses existing v2 jobs)
 */
export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  const manager = useCalcOrchestratorManager();
  const userId = useUserId();

  // TODO: Replace with actual auth check
  const reportStore = new LocalStorageReportStore();
  const simulationStore = new LocalStorageSimulationStore();

  const mutation = useMutation({
    mutationFn: async (params: CreateReportParams): Promise<CreateReportResult> => {
      const { countryId, year, simulations, populations } = params;
      const { simulation1, simulation2 } = simulations;

      const isHouseholdReport = simulation1.populationType === 'household';
      const outputType: 'household' | 'economy' = isHouseholdReport ? 'household' : 'economy';

      let reportId: string;
      let v2SimulationIds: string[];
      let v2Simulations: Simulation[] | undefined;

      if (isHouseholdReport) {
        const householdId = populations.household1?.id || simulation1.populationId || '';
        const allSims = [simulation1, simulation2].filter(
          (sim): sim is Simulation => sim !== null && sim !== undefined
        );

        const result = await createHouseholdReportV2(householdId, allSims);
        v2Simulations = result.v2Simulations;
        v2SimulationIds = v2Simulations.map((s) => s.id!);

        // For household, use a local UUID as the container report ID.
        // There's no single v2 report for a multi-simulation household report.
        reportId = crypto.randomUUID();
      } else {
        const region = populations.geography1?.regionCode || simulation1.populationId || countryId;
        const reformPolicyId = simulation2?.policyId ?? simulation1.policyId ?? null;

        const result = await createEconomyReportV2(countryId, region, reformPolicyId);
        reportId = result.reportId;
        v2SimulationIds = result.v2SimulationIds;
      }

      // Create UserReport association
      const userReport = await reportStore.create({
        userId: String(userId),
        reportId,
        countryId,
        outputType,
        simulationIds: v2SimulationIds,
        year,
        label: reportLabel,
        isCreated: true,
      });

      // Create UserSimulation associations for each v2 simulation
      for (const simId of v2SimulationIds) {
        try {
          await simulationStore.create({
            userId: String(userId),
            simulationId: simId,
            countryId,
            label: undefined,
            isCreated: true,
          });
        } catch (error) {
          console.warn(
            `[useCreateReport] Failed to create simulation association for ${simId}:`,
            error
          );
        }
      }

      // Build app Report
      const report: Report = {
        id: reportId,
        countryId,
        year,
        apiVersion: 'v2',
        simulationIds: v2SimulationIds,
        status: 'pending',
        outputType,
      };

      return {
        report,
        userReport,
        // Pass through v2 simulations for household, original simulations for economy
        simulations: v2Simulations
          ? {
              simulation1: v2Simulations[0],
              simulation2: v2Simulations[1] || null,
            }
          : simulations,
        populations,
      };
    },

    onSuccess: async (result) => {
      try {
        const { report, simulations, populations } = result;
        const reportIdStr = String(report.id);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: reportKeys.all });
        queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });
        queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.all });

        // Cache the report data
        queryClient.setQueryData(reportKeys.byId(reportIdStr), report);

        const simulation1 = simulations.simulation1;
        const simulation2 = simulations.simulation2;
        const household = populations.household1;
        const geography = populations.geography1;

        if (!simulation1) {
          console.warn('[useCreateReport] No simulation1 provided, cannot start calculation');
          return;
        }

        const isHouseholdReport = report.outputType === 'household';

        if (isHouseholdReport) {
          // Household: Start CalcOrchestrator per v2 simulation
          // The v2 analysis endpoints are idempotent, so calling again just returns
          // the existing job. CalcOrchestrator will pick up and poll from there.
          const allSims = [simulation1, simulation2].filter(
            (sim): sim is Simulation => sim !== null && sim !== undefined
          );

          for (const sim of allSims) {
            if (!sim.id) {
              continue;
            }

            manager
              .startCalculation({
                calcId: sim.id,
                targetType: 'simulation',
                countryId: report.countryId,
                year: report.year,
                reportId: reportIdStr,
                simulations: {
                  simulation1: sim,
                  simulation2: null,
                },
                populations: {
                  household1: household || null,
                  household2: null,
                  geography1: null,
                  geography2: null,
                },
              })
              .catch((error) => {
                console.error(
                  `[useCreateReport] Failed to start calculation for sim ${sim.id}:`,
                  error
                );
              });
          }
        } else {
          // Economy: Single CalcOrchestrator at report level
          await manager.startCalculation({
            calcId: reportIdStr,
            targetType: 'report',
            countryId: report.countryId,
            year: report.year,
            simulations: {
              simulation1,
              simulation2: simulation2 || null,
            },
            populations: {
              household1: null,
              household2: null,
              geography1: geography || null,
              geography2: null,
            },
          });
        }
      } catch (error) {
        console.error('[useCreateReport] Post-creation tasks failed:', error);
      }
    },
  });

  return {
    createReport: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
