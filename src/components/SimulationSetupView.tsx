import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSetupPopulationFrame from '@/frames/SimulationSetupPopulationFrame';
import { Button, Container, Grid, Stack, Text, Card } from '@mantine/core';
import { useDispatch } from 'react-redux';

interface SimulationSetupViewProps {
  onPopulationSelect?: () => void;
  onPolicySelect: () => void;
  selectedPopulation?: string;
  selectedPolicy?: string;
  isPopulationDisabled?: boolean;
  onNext: () => void;
  canProceed: boolean;
}

export default function SimulationSetupView({
  onPopulationSelect,
  onPolicySelect,
  selectedPopulation,
  selectedPolicy,
  isPopulationDisabled = true,
  onNext,
  canProceed,
}: SimulationSetupViewProps) {

  // TODO: Handle navigation/display after a user goes through policy creation flow;
  // policies not yet actually selecting after creation

  return (
    <Container size="md" py="xl">
      <Stack>
        <Card withBorder p="md" mb="xl" component="button" onClick={onPopulationSelect} disabled={isPopulationDisabled}>
          <Text fw={700}>TODO: ICON</Text>
          <Text>Add population</Text>
          <Text size="sm" c="dimmed">
            Select a geographic scope or specific household
          </Text>
        </Card>
        <Card withBorder p="md" mb="xl" component="button" onClick={onPolicySelect}>
          <Text fw={700}>TODO: ICON</Text>
          <Text>Add policy</Text>
          <Text size="sm" c="dimmed">
            Select a policy to apply to the simulation
          </Text>
        </Card>
      </Stack>
    </Container>
  );
}