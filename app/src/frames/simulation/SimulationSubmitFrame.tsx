import { useDispatch, useSelector } from 'react-redux';
import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import {
  clearSimulationAtPosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import {
  selectCurrentPosition,
  selectActiveSimulation,
  selectActivePolicy,
  selectActivePopulation,
} from '@/reducers/activeSelectors';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';

export default function SimulationSubmitFrame({
  onNavigate,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position and active simulation from cross-cutting selectors
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const simulation = useSelector((state: RootState) => selectActiveSimulation(state));

  // Get policy and population at the current position
  const policy = useSelector((state: RootState) => selectActivePolicy(state));
  const population = useSelector((state: RootState) => selectActivePopulation(state));

  console.log('Simulation label: ', simulation?.label);
  console.log('Simulation in SimulationSubmitFrame: ', simulation);
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);

  function handleSubmit() {

    // Convert state to partial Simulation for adapter
    const simulationData: Partial<Simulation> = {
      populationId: simulation?.populationId || undefined,
      policyId: simulation?.policyId || undefined,
      populationType: simulation?.populationType || undefined,
    };

    const serializedSimulationCreationPayload: SimulationCreationPayload =
      SimulationAdapter.toCreationPayload(simulationData);

    console.log('Submitting simulation:', serializedSimulationCreationPayload);
    createSimulation(serializedSimulationCreationPayload, {
      onSuccess: (data) => {
        console.log('Simulation created successfully:', data);

        // Update the simulation at current position with the API response
        dispatch(updateSimulationAtPosition({
          position: currentPosition,
          updates: {
            id: data.result.simulation_id,
            isCreated: true
          }
        }));

        // Navigate to the next step
        onNavigate('submit');

        // If we're not in a subflow, clear just this specific simulation
        if (!isInSubflow) {
          dispatch(clearSimulationAtPosition(currentPosition));
        }
      },
    });
  }

  // Create summary boxes based on the current simulation state
  const summaryBoxes: SummaryBoxItem[] = [
    {
      title: 'Population Added',
      description: population?.label || `Household #${simulation?.populationId}`,
      isFulfilled: !!simulation?.populationId,
      badge: population?.label || `Household #${simulation?.populationId}`,
    },
    {
      title: 'Policy Reform Added',
      description: policy?.label || `Policy #${simulation?.policyId}`,
      isFulfilled: !!simulation?.policyId,
      badge: policy?.label || `Policy #${simulation?.policyId}`,
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
