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
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import { useCreateReport } from '@/hooks/useCreateReport';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { trackReportStarted } from '@/utils/analytics';
import { toApiPolicyId } from '../currentLaw';
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

function getJourneyProfiler(): {
  markStart?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
  markEnd?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
  markEvent?: (name: string, category?: 'user-interaction' | 'api-call' | 'render') => void;
} | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  return (window as any).__journeyProfiler ?? null;
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
    policyId: toApiPolicyId(policyId, currentLawId),
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

    const journeyProfiler = getJourneyProfiler();
    setIsSubmitting(true);
    trackReportStarted();
    journeyProfiler?.markStart?.('report-submit', 'user-interaction');

    try {
      const simulationIds: string[] = [];
      const simulations: (Simulation | null)[] = [];
      journeyProfiler?.markStart?.('report-submit-simulations', 'api-call');

      for (const simState of reportState.simulations) {
        const policyId = simState.policy?.id
          ? toApiPolicyId(simState.policy.id, currentLawId)
          : undefined;

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

        // Create UserSimulation association in localStorage so sharing works
        const simulationStore = new LocalStorageSimulationStore();
        await simulationStore.create({
          userId: MOCK_USER_ID,
          simulationId,
          countryId,
          label: simState.label ?? undefined,
          isCreated: true,
        });

        const simulation = convertToSimulation(simState, simulationId, countryId, currentLawId);
        simulations.push(simulation);
      }

      journeyProfiler?.markEnd?.('report-submit-simulations', 'api-call');

      if (simulationIds.length === 0) {
        console.error('[useReportSubmission] No simulations created');
        setIsSubmitting(false);
        journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
        return;
      }

      const reportData: Partial<Report> = {
        countryId,
        year: reportState.year,
        simulationIds,
        apiVersion: null,
      };

      const serializedPayload = ReportAdapter.toCreationPayload(reportData as Report);

      journeyProfiler?.markStart?.('report-submit-create-report', 'api-call');
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
            journeyProfiler?.markEvent?.('report-submit-success-handoff', 'render');
            onSuccess(data.userReport.id);
          },
          onError: (error) => {
            console.error('[useReportSubmission] Report creation failed:', error);
            setIsSubmitting(false);
            journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
            journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
          },
        }
      );
      journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
      journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
    } catch (error) {
      console.error('[useReportSubmission] Error running report:', error);
      setIsSubmitting(false);
      journeyProfiler?.markEnd?.('report-submit-create-report', 'api-call');
      journeyProfiler?.markEnd?.('report-submit-simulations', 'api-call');
      journeyProfiler?.markEnd?.('report-submit', 'user-interaction');
    }
  }, [
    isReportConfigured,
    isSubmitting,
    reportState,
    countryId,
    currentLawId,
    createReport,
    onSuccess,
  ]);

  return { handleSubmit, isSubmitting, isReportConfigured };
}
