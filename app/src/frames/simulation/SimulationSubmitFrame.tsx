import { useDispatch, useSelector } from 'react-redux';
import { SimulationAdapter } from '@/adapters';
import IngredientSubmissionView, { SummaryBoxItem } from '@/components/IngredientSubmissionView';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import {
  clearSimulation,
  markSimulationAsCreated,
  selectActiveSimulation,
  selectSimulationById,
  updateSimulationId,
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
  simulationId,
}: SimulationSubmitFrameProps) {
  const dispatch = useDispatch();

  // Get simulation from the normalized state
  const simulation = useSelector((state: RootState) => {
    if (simulationId) {
      // If specific simulation ID provided, get that simulation
      return selectSimulationById(state, simulationId);
    }
    // Otherwise get the active simulation
    return selectActiveSimulation(state);
  });

  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);

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

        // Update the simulation ID with the one returned from the API
        const newSimulationId = data.result.simulation_id;
        dispatch(updateSimulationId({
          simulationId: simulationId || undefined,
          id: newSimulationId
        }));

        // Mark the simulation as created
        dispatch(markSimulationAsCreated({
          simulationId: simulationId || undefined
        }));

        // Navigate to the next step
        onNavigate('submit');

        // If we're not in a subflow, clear just this specific simulation
        // (not the full ingredient like resetIngredient would do)
        if (!isInSubflow) {
          dispatch(clearSimulation({
            simulationId: simulationId || undefined
          }));
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
