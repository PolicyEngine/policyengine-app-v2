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
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { trackReportStarted } from '@/utils/analytics';
import {
  getBudgetWindowOptions,
  getEffectiveReportAnalysisMode,
  serializeReportTiming,
} from '@/utils/reportTiming';
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

async function persistSimulationAssociations(
  associations: Array<{
    simulationId: string;
    countryId: 'us' | 'uk';
    label?: string;
  }>
): Promise<void> {
  const simulationStore = new LocalStorageSimulationStore();
  const createdSimulationIds: string[] = [];

  try {
    for (const association of associations) {
      await simulationStore.create({
        userId: MOCK_USER_ID,
        simulationId: association.simulationId,
        countryId: association.countryId,
        label: association.label,
        isCreated: true,
      });
      createdSimulationIds.push(association.simulationId);
    }
  } catch (error) {
    await Promise.allSettled(
      createdSimulationIds.map((simulationId) => simulationStore.delete(MOCK_USER_ID, simulationId))
    );
    console.error('[useReportSubmission] Failed to store simulation associations:', error);
  }
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
  const yearOptions = useSelector(getTaxYears);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReport } = useCreateReport(reportState.label || undefined);
  const isGeographyReport = !!reportState.simulations[0]?.population?.geography?.id;
  const availableBudgetWindowOptions = getBudgetWindowOptions(
    reportState.year,
    yearOptions,
    countryId
  );
  const effectiveAnalysisMode = getEffectiveReportAnalysisMode(
    reportState.analysisMode,
    isGeographyReport ? availableBudgetWindowOptions : []
  );

  const isReportConfigured = reportState.simulations.every(
    (sim) => !!sim.policy.id && !!(sim.population.household?.id || sim.population.geography?.id)
  );

  const handleSubmit = useCallback(async () => {
    if (!isReportConfigured || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    trackReportStarted();

    try {
      const simulationIds: string[] = [];
      const simulations: (Simulation | null)[] = [];
      const simulationAssociations: Array<{
        simulationId: string;
        countryId: 'us' | 'uk';
        label?: string;
      }> = [];

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
        simulationAssociations.push({
          simulationId,
          countryId,
          label: simState.label ?? undefined,
        });

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
        year: serializeReportTiming({
          analysisMode: effectiveAnalysisMode,
          startYear: reportState.year,
          budgetWindowYears: reportState.budgetWindowYears,
        }),
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

      await persistSimulationAssociations(simulationAssociations);
    } catch (error) {
      console.error('[useReportSubmission] Error running report:', error);
      setIsSubmitting(false);
    }
  }, [
    isReportConfigured,
    isSubmitting,
    reportState,
    countryId,
    currentLawId,
    createReport,
    effectiveAnalysisMode,
    onSuccess,
  ]);

  return { handleSubmit, isSubmitting, isReportConfigured };
}
