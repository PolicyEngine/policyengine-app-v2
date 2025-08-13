import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/simulation';
import {
  serializeSimulationCreationPayload,
  SimulationCreationPayload,
} from '@/types/simulationPayload';
import FlowView from '@/components/common/FlowView';

export default function SimulationSubmitFrame({
  onNavigate,
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const simulation: Simulation = useSelector((state: RootState) => state.simulation);
  const { createSimulation, isPending } = useCreateSimulation();
  const { resetIngredient } = useIngredientReset();

  function handleSubmit() {
    const serializedSimulationCreationPayload: SimulationCreationPayload =
      serializeSimulationCreationPayload(simulation);

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

  const content = (
    <Stack>
      <Text>Population ID: {simulation.populationId}</Text>
      <Text>Policy ID: {simulation.policyId}</Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Submit',
    onClick: handleSubmit,
    isLoading: isPending,
  };

  return (
    <FlowView
      title="Review simulation"
      content={content}
      primaryAction={primaryAction}
    />
  );
}
