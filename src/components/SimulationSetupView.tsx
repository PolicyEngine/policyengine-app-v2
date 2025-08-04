import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSetupPopulationFrame from '@/frames/SimulationSetupPopulationFrame';
import { Button, Container, Grid, Stack, Text, Card } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

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

  const userDefinedPolicy = useSelector((state: any) => state.policy);

  useEffect(() => {
    console.log('User defined policy updated:', userDefinedPolicy);
  }, [userDefinedPolicy]);

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
        {/* TODO: Add pointer cursor on hover over card*/}
        {userDefinedPolicy && userDefinedPolicy.isCreated ? (
          <CardSelectedPolicy label={userDefinedPolicy.label} />
        ) : (
          <CardCreatePolicy onClick={onPolicySelect} />
        )}
      </Stack>
    </Container>
  );
}

interface CardSelectedPolicyProps {
  label: string;
}

interface CardCreatePolicyProps {
  onClick: () => void;
}

function CardSelectedPolicy({ label }: CardSelectedPolicyProps) {
  return (
    <Card withBorder p="md" mb="xl" component="button">
      <Text fw={700}>TODO: ICON</Text>
      <Text>{label}</Text>
      <Text size="sm" c="dimmed">
        TODO: Policy description and details
      </Text>
    </Card>
  );
}

function CardCreatePolicy({ onClick }: CardCreatePolicyProps) {
  return (
    <Card withBorder p="md" mb="xl" component="button" onClick={onClick}>
      <Text fw={700}>TODO: ICON</Text>
      <Text>Add policy</Text>
      <Text size="sm" c="dimmed">
        Select a policy to apply to the simulation
      </Text>
    </Card>
  );
}