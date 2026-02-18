/**
 * useReportSubmission - Extracted submission logic for creating a new report
 *
 * Handles:
 * - Sequential simulation creation via API
 * - Report creation with simulation IDs
 * - isReportConfigured derivation
 * - isSubmitting state
 *
 * Accepts an onSuccess callback instead of navigating directly,
 * so the consuming page controls routing.
 */
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ReportAdapter, SimulationAdapter } from '@/adapters';
import { createSimulation } from '@/api/simulation';
import { useCreateReport } from '@/hooks/useCreateReport';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { ReportBuilderState } from '../types';

interface UseReportSubmissionArgs {
  reportState: ReportBuilderState;
  countryId: 'us' | 'uk';
  onSuccess: (userReportId: string) => void;
}

interface UseReportSubmissionReturn {
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isReportConfigured: boolean;
}

function convertToSimulation(
  simState: SimulationStateProps,
  simulationId: string,
  countryId: 'us' | 'uk',
  currentLawId: number
): Simulation | null {
  const policyId = simState.policy?.id;
  if (!policyId) {
    return null;
  }

  let populationId: string | undefined;
  let populationType: 'household' | 'geography' | undefined;

  if (simState.population?.household?.id) {
    populationId = simState.population.household.id;
    populationType = 'household';
  } else if (simState.population?.geography?.geographyId) {
    populationId = simState.population.geography.geographyId;
    populationType = 'geography';
  }

  if (!populationId || !populationType) {
    return null;
  }

  return {
    id: simulationId,
    countryId,
    apiVersion: undefined,
    policyId: policyId === 'current-law' ? currentLawId.toString() : policyId,
    populationId,
    populationType,
    label: simState.label,
    isCreated: true,
    output: null,
    status: 'pending',
  };
}

export function useReportSubmission({
  reportState,
  countryId,
  onSuccess,
}: UseReportSubmissionArgs): UseReportSubmissionReturn {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReport } = useCreateReport(reportState.label || undefined);

  const isReportConfigured = reportState.simulations.every(
    (sim) => !!sim.policy.id && !!(sim.population.household?.id || sim.population.geography?.id)
  );

  const handleSubmit = useCallback(async () => {
    if (!isReportConfigured || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const simulationIds: string[] = [];
      const simulations: (Simulation | null)[] = [];

      for (const simState of reportState.simulations) {
        const policyId =
          simState.policy?.id === 'current-law' ? currentLawId.toString() : simState.policy?.id;

        if (!policyId) {
          console.error('[useReportSubmission] Simulation missing policy ID');
          continue;
        }

        let populationId: string | undefined;
        let populationType: 'household' | 'geography' | undefined;

        if (simState.population?.household?.id) {
          populationId = simState.population.household.id;
          populationType = 'household';
        } else if (simState.population?.geography?.geographyId) {
          populationId = simState.population.geography.geographyId;
          populationType = 'geography';
        }

        if (!populationId || !populationType) {
          console.error('[useReportSubmission] Simulation missing population');
          continue;
        }

        const simulationData: Partial<Simulation> = {
          populationId,
          policyId,
          populationType,
        };

        const payload = SimulationAdapter.toCreationPayload(simulationData);
        const result = await createSimulation(countryId, payload);
        const simulationId = result.result.simulation_id;
        simulationIds.push(simulationId);

        const simulation = convertToSimulation(simState, simulationId, countryId, currentLawId);
        simulations.push(simulation);
      }

      if (simulationIds.length === 0) {
        console.error('[useReportSubmission] No simulations created');
        setIsSubmitting(false);
        return;
      }

      const reportData: Partial<Report> = {
        countryId,
        year: reportState.year,
        simulationIds,
        apiVersion: null,
      };

      const serializedPayload = ReportAdapter.toCreationPayload(reportData as Report);

      await createReport(
        {
          countryId,
          payload: serializedPayload,
          simulations: {
            simulation1: simulations[0],
            simulation2: simulations[1] || null,
          },
          populations: {
            household1: reportState.simulations[0]?.population?.household || null,
            household2: reportState.simulations[1]?.population?.household || null,
            geography1: reportState.simulations[0]?.population?.geography || null,
            geography2: reportState.simulations[1]?.population?.geography || null,
          },
        },
        {
          onSuccess: (data) => {
            onSuccess(data.userReport.id);
          },
          onError: (error) => {
            console.error('[useReportSubmission] Report creation failed:', error);
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[useReportSubmission] Error running report:', error);
      setIsSubmitting(false);
    }
  }, [isReportConfigured, isSubmitting, reportState, countryId, currentLawId, createReport, onSuccess]);

  return { handleSubmit, isSubmitting, isReportConfigured };
}
