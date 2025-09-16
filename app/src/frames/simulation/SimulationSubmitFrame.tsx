import { useDispatch, useSelector } from 'react-redux';
import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import {
  clearSimulationAtPosition,
  selectActiveSimulation,
  selectActivePosition,
  selectSimulationAtPosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationCreationPayload } from '@/types/payloads';

interface SimulationSubmitFrameProps extends FlowComponentProps {
  position?: 0 | 1; // Optional specific position to submit
}

export default function SimulationSubmitFrame({
  onNavigate,
  isInSubflow,
  position,
}: SimulationSubmitFrameProps) {
  const dispatch = useDispatch();

  // Get simulation from position-based state
  const simulation = useSelector((state: RootState) =>
    position !== undefined
      ? selectSimulationAtPosition(state, position)
      : selectActiveSimulation(state)
  );

  const activePosition = useSelector(selectActivePosition);
  const targetPosition = position ?? activePosition;

  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);

  console.log('Simulation label: ', simulation?.label);
  console.log('Simulation in SimulationSubmitFrame: ', simulation);
  const { createSimulation, isPending } = useCreateSimulation(simulation?.label || undefined);

  function handleSubmit() {
    // Ensure we have a valid position to update
    if (targetPosition === null) {
      console.error('No target position available for simulation submission');
      return;
    }

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

        // Update the simulation at position with the API response
        dispatch(updateSimulationAtPosition({
          position: targetPosition,
          updates: {
            id: data.result.simulation_id,
            isCreated: true
          }
        }));

        // Navigate to the next step
        onNavigate('submit');

        // If we're not in a subflow, clear just this specific simulation
        if (!isInSubflow) {
          dispatch(clearSimulationAtPosition(targetPosition));
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
