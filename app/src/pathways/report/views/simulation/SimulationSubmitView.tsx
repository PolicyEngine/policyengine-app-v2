/**
 * SimulationSubmitView - View for reviewing and submitting simulation
 * Duplicated from SimulationSubmitFrame
 * Props-based instead of Redux-based
 */

import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';

interface SimulationSubmitViewProps {
  simulation: SimulationStateProps;
  onSubmitSuccess: (simulationId: string) => void;
}

export default function SimulationSubmitView({
  simulation,
  onSubmitSuccess,
}: SimulationSubmitViewProps) {
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);

  function handleSubmit() {
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

    console.log('Submitting simulation:', serializedSimulationCreationPayload);
    createSimulation(serializedSimulationCreationPayload, {
      onSuccess: (data) => {
        console.log('Simulation created successfully:', data);
        onSubmitSuccess(data.result.simulation_id);
      },
    });
  }

  // Create summary boxes based on the current simulation state
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population Added',
      description:
        simulation.population.label ||
        `Household #${simulation.population.household?.id || simulation.population.geography?.id}`,
      isFulfilled: !!(
        simulation.population.household?.id || simulation.population.geography?.id
      ),
      badge:
        simulation.population.label ||
        `Household #${simulation.population.household?.id || simulation.population.geography?.id}`,
    },
    {
      title: 'Policy Reform Added',
      description: simulation.policy.label || `Policy #${simulation.policy.id}`,
      isFulfilled: !!simulation.policy.id,
      badge: simulation.policy.label || `Policy #${simulation.policy.id}`,
    },
  ];

  return (
    <IngredientSubmissionView
      title="Summary of Selections"
      subtitle="Review your configurations and add additional criteria before running your simulation."
      summaryBoxes={summaryBoxes}
      submitButtonText="Save Simulation"
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
    />
  );
}
