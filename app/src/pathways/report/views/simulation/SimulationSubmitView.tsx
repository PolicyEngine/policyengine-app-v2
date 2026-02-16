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
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationSubmitView({
  simulation,
  onSubmitSuccess,
  onBack,
  onCancel,
}: SimulationSubmitViewProps) {
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);

  function handleSubmit() {
    // Determine population ID and type based on what's set
    let populationId: string | undefined;
    let populationType: 'household' | 'geography' | undefined;

    if (simulation.population.household?.id) {
      populationId = simulation.population.household.id;
      populationType = 'household';
    } else if (simulation.population.geography?.regionCode) {
      populationId = simulation.population.geography.regionCode;
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
  const populationIdentifier =
    simulation.population.household?.id || simulation.population.geography?.regionCode;
  const populationDisplay =
    simulation.population.label ||
    (simulation.population.household?.id
      ? `Household #${simulation.population.household.id}`
      : null) ||
    (simulation.population.geography?.regionCode
      ? `Households in ${simulation.population.geography.regionCode}`
      : null) ||
    'No population';
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population added',
      description: populationDisplay,
      isFulfilled: !!populationIdentifier,
      badge: populationDisplay,
    },
    {
      title: 'Policy reform added',
      description: simulation.policy.label || `Policy #${simulation.policy.id}`,
      isFulfilled: !!simulation.policy.id,
      badge: simulation.policy.label || `Policy #${simulation.policy.id}`,
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
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
