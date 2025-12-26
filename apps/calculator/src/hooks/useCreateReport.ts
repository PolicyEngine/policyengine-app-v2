import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReportAndAssociateWithUser, CreateReportWithAssociationResult } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { useCalcOrchestratorManager } from '@/contexts/CalcOrchestratorContext';
import { countryIds } from '@/libs/countries';
import { reportAssociationKeys, reportKeys } from '@/libs/queryKeys';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { ReportCreationPayload } from '@/types/payloads';

interface CreateReportAndBeginCalculationParams {
  countryId: (typeof countryIds)[number];
  payload: ReportCreationPayload;
  simulations?: {
    simulation1?: Simulation | null;
    simulation2?: Simulation | null;
  };
  populations?: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

// Extended result type that includes simulations and populations for onSuccess
interface ExtendedCreateReportResult extends CreateReportWithAssociationResult {
  simulations?: {
    simulation1?: Simulation | null;
    simulation2?: Simulation | null;
  };
  populations?: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

// Note: Much of this code's complexity is due to mapping v2 concepts (simulations, populations)
// to the v1 API, which cannot run reports as subsets of simulations. This should be simplified
// with the creation of API v2, where we can merely pass simulation IDs to create a report.
export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  const manager = useCalcOrchestratorManager();

  const userId = MOCK_USER_ID;

  const mutation = useMutation({
    mutationFn: async ({
      countryId,
      payload,
      simulations,
      populations,
    }: CreateReportAndBeginCalculationParams): Promise<ExtendedCreateReportResult> => {
      // Call the combined API function
      const result = await createReportAndAssociateWithUser({
        countryId: countryId as any,
        payload,
        userId,
        label: reportLabel,
      });

      // Attach simulations and populations for use in onSuccess
      return {
        ...result,
        simulations,
        populations,
      };
    },

    onSuccess: async (result) => {
      try {
        const { report, simulations, populations } = result;
        const reportIdStr = String(report.id);

        // Invalidate queries
        // WHY: We need to invalidate BOTH reports AND report associations
        // - reportKeys.all: Invalidates individual report queries
        // - reportAssociationKeys.all: Invalidates user→report mappings (critical for Reports page)
        queryClient.invalidateQueries({ queryKey: reportKeys.all });
        queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });

        // Cache the report data using consistent key structure
        queryClient.setQueryData(reportKeys.byId(reportIdStr), report);

        // Determine calculation type from simulation
        const simulation1 = simulations?.simulation1;
        const simulation2 = simulations?.simulation2;
        const household = populations?.household1;
        const geography = populations?.geography1;

        if (!simulation1) {
          console.warn('[useCreateReport] No simulation1 provided, cannot start calculation');
          return;
        }

        const isHouseholdReport = simulation1.populationType === 'household';

        if (isHouseholdReport) {
          // Household reports: Start separate calculation for EACH simulation
          // WHY: Each simulation needs its own API call to calculate household results
          // for a specific policy. A report with N simulations = N calculations.
          // Results are stored at simulation level and compared in the UI.
          //
          // CRITICAL: We do NOT await these calls. The household API takes 30-60s per
          // simulation, but we want the UI to navigate immediately and show progress.
          // TanStack Query will handle waiting for the response in the background.

          const allSimulations = [simulation1, simulation2].filter(
            (sim): sim is Simulation => sim !== null && sim !== undefined
          );

          for (const sim of allSimulations) {
            if (!sim.id) {
              console.warn('[useCreateReport] Simulation missing ID, skipping');
              continue;
            }

            // Fire and forget - don't await, let TanStack Query handle the waiting
            manager
              .startCalculation({
                calcId: sim.id, // Each simulation uses its own ID
                targetType: 'simulation', // Simulation-level calculation
                countryId: report.countryId,
                year: report.year,
                simulations: {
                  simulation1: sim, // Only this specific simulation
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
                // Log errors but don't block the flow
                console.error(
                  `[useCreateReport] Failed to start calculation for simulation ${sim.id}:`,
                  error
                );
              });
          }
        } else {
          // Economy reports: Single calculation at report level
          // WHY: Economy calculations operate on the entire geography and compare
          // all policies in a single API call. Results stored at report level.

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
