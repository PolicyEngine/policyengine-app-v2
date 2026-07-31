/**
 * SimulationSubmitView - View for reviewing and submitting simulation
 * Duplicated from SimulationSubmitFrame
 * Props-based instead of Redux-based
 */

import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { SimulationCreationPayload } from '@/types/payloads';

interface SimulationSubmitViewProps {
  simulation: SimulationStateProps;
  onSubmitSuccess: (simulationId: string) => void;
  isPolicyUnavailable?: boolean;
  isPopulationUnavailable?: boolean;
  policyErrorMessage?: string;
  populationErrorMessage?: string;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationSubmitView({
  simulation,
  onSubmitSuccess,
  isPolicyUnavailable = false,
  isPopulationUnavailable = false,
  policyErrorMessage,
  populationErrorMessage,
  onBack,
  onCancel,
}: SimulationSubmitViewProps) {
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);
  const hasPolicy = !!simulation.policy.id;
  const hasPopulation = !!(
    simulation.population.household?.id || simulation.population.geography?.id
  );
  const isSubmissionBlocked =
    !hasPolicy || !hasPopulation || isPolicyUnavailable || isPopulationUnavailable;

  function handleSubmit() {
    if (isSubmissionBlocked) {
      return;
    }

    // Determine population ID and type based on what's set
    let populationId: string | undefined;
    let populationType: 'household' | 'geography' | undefined;

    if (simulation.population.household?.id) {
      populationId = simulation.population.household.id;
      populationType = 'household';
    } else if (simulation.population.geography?.id) {
      populationId = simulation.population.geography.id;
      populationType = 'geography';
    }

    // Convert state to partial Simulation for adapter
    const simulationData: Partial<Simulation> = {
      populationId,
      policyId: simulation.policy.id,
      populationType,
    };

    const serializedSimulationCreationPayload: SimulationCreationPayload =
      SimulationAdapter.toCreationPayload(simulationData);

    createSimulation(serializedSimulationCreationPayload, {
      onSuccess: (data) => {
        onSubmitSuccess(data.result.simulation_id);
      },
    });
  }

  // Create summary boxes based on the current simulation state
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population added',
      description:
        isPopulationUnavailable && populationErrorMessage
          ? 'Failed to load'
          : simulation.population.label ||
            `Household #${simulation.population.household?.id || simulation.population.geography?.id}`,
      isFulfilled: hasPopulation && !isPopulationUnavailable,
      isDisabled: isPopulationUnavailable,
      errorMessage: populationErrorMessage,
      badge: isPopulationUnavailable
        ? undefined
        : simulation.population.label ||
          `Household #${simulation.population.household?.id || simulation.population.geography?.id}`,
    },
    {
      title: 'Policy reform added',
      description:
        isPolicyUnavailable && policyErrorMessage
          ? 'Failed to load'
          : simulation.policy.label || `Policy #${simulation.policy.id}`,
      isFulfilled: hasPolicy && !isPolicyUnavailable,
      isDisabled: isPolicyUnavailable,
      errorMessage: policyErrorMessage,
      badge: isPolicyUnavailable
        ? undefined
        : simulation.policy.label || `Policy #${simulation.policy.id}`,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Summary of selections"
      subtitle="Review your configurations and add additional criteria before running your simulation."
      summaryBoxes={summaryBoxes}
      submitButtonText="Create simulation"
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
      submitButtonDisabled={isSubmissionBlocked}
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
