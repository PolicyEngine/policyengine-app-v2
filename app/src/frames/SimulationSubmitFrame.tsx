import { useSelector } from 'react-redux';
import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { 
  selectSimulationById, 
  selectSimulationCompat 
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';

interface SimulationSubmitFrameProps extends FlowComponentProps {
  simulationId?: string; // Optional specific simulation ID to submit
}

export default function SimulationSubmitFrame({ 
  onNavigate, 
  isInSubflow,
  simulationId 
}: SimulationSubmitFrameProps) {
  // @compat - This selector
  // Use compatibility selector to work with both old and new state
  const simulation = useSelector((state: RootState) => {
    if (simulationId) {
      // If specific simulation ID provided, get that simulation
      return selectSimulationById(state, simulationId);
    }
    // Otherwise use compatibility selector to get from either old or new state
    return selectSimulationCompat(state);
  });

  console.log('Active simulation ID: ', simulationId);
  console.log('Active simulation from state: ', simulation);
  
  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);

  console.log('Simulation label: ', simulation?.label);
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);
  const { resetIngredient } = useIngredientReset();

  function handleSubmit() {
    // Convert state to partial Simulation for adapter
    const simulationData: Partial<Simulation> = {
      populationId: simulation?.populationId || undefined,
      policyId: simulation?.policyId || undefined,
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
      description: population.label || `Household #${simulation?.populationId}`,
      isFulfilled: !!simulation?.populationId,
      badge: population.label || `Household #${simulation?.populationId}`,
    },
    {
      title: 'Policy Reform Added',
      description: policy.label || `Policy #${simulation?.policyId}`,
      isFulfilled: !!simulation?.policyId,
      badge: policy.label || `Policy #${simulation?.policyId}`,
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
