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

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Text fw={700}>Review Simulation</Text>
        <Text>Population ID: {simulation.populationId}</Text>
        <Text>Policy ID: {simulation.policyId}</Text>

        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" fullWidth onClick={onReturn}>
              Cancel
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button variant="filled" fullWidth loading={isPending} onClick={handleSubmit}>
              Submit
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
