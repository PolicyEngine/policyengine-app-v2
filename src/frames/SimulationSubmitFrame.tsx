import { useSelector } from 'react-redux';
import { Button, Container, Grid, Stack, Text } from '@mantine/core';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/simulation';
import {
  serializeSimulationCreationPayload,
  SimulationCreationPayload,
} from '@/types/simulationPayload';
import IngredientSubmissionView from '@/components/IngredientSubmissionView';

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

  return (
    <IngredientSubmissionView
      title="Review simulation"
      content={content}
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
      submitButtonText="Submit"
    />
  );
}
