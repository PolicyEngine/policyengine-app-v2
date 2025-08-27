import { useSelector } from 'react-redux';
import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';

export default function SimulationSubmitFrame({ onNavigate, isInSubflow }: FlowComponentProps) {
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);

  console.log('Simulation label: ', simulation.label);
  const { createSimulation, isPending } = useCreateSimulation(simulation.label || undefined);
  const { resetIngredient } = useIngredientReset();

  function handleSubmit() {
    // Convert state to partial Simulation for adapter
    const simulationData: Partial<Simulation> = {
      populationId: simulation.populationId || undefined,
      policyId: simulation.policyId || undefined,
    };

    const serializedSimulationCreationPayload: SimulationCreationPayload =
      SimulationAdapter.toCreationPayload(simulationData);

    console.log('Submitting simulation:', serializedSimulationCreationPayload);
    createSimulation(serializedSimulationCreationPayload, {
      onSuccess: () => {
        onNavigate('submit');
        if (!isInSubflow) {
          resetIngredient('simulation');
        }
      },
    });
  }

  // Create summary boxes based on the current simulation state
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population Added',
      description: population.label || `Household #${simulation.populationId}`,
      isFulfilled: !!simulation.populationId,
      badge: population.label || `Household #${simulation.populationId}`,
    },
    {
      title: 'Policy Reform Added',
      description: policy.label || `Policy #${simulation.policyId}`,
      isFulfilled: !!simulation.policyId,
      badge: policy.label || `Policy #${simulation.policyId}`,
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
