import { useSelector } from 'react-redux';
import { Card, Container, Stack, Text } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

// TODO: Refactor these props based on integration of population
interface SimulationSetupViewProps {
  onPopulationSelect?: () => void;
  onPolicySelect: () => void;
  selectedPopulation?: string;
  isPopulationDisabled?: boolean;
  onNext: () => void;
  canProceed: boolean;
}

export default function SimulationSetupView({
  onPopulationSelect,
  onPolicySelect,
  // selectedPopulation,
  isPopulationDisabled = false, // defaulted to false so clickable; TODO remove disabling logic?
  onNext,
  canProceed,
}: SimulationSetupViewProps) {
  const userDefinedPolicy = useSelector((state: any) => state.policy);
  const userDefinedPopulation = useSelector((state: any) => state.population);

  const canProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'filled' as const,
    onClick: onNext,
  };

  const cantProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'disabled' as const,
    onClick: () => null,
  };

  const cancelButtonConfig: ButtonConfig = {
    label: 'Cancel',
    variant: 'default' as const,
    onClick: () => {
      console.log('Cancel clicked');
    },
  };

  const buttonConfig: ButtonConfig[] = canProceed
    ? [cancelButtonConfig, canProceedNextButtonConfig]
    : [cancelButtonConfig, cantProceedNextButtonConfig];

  return (
    <Container size="md" py="xl">
      <Stack>
        {userDefinedPopulation && userDefinedPopulation.isCreated ? (
          <CardSelectedPopulation label={userDefinedPopulation.label ?? ''} />
        ) : (
          <Card
            withBorder
            p="md"
            mb="xl"
            component="button"
            onClick={onPopulationSelect}
            disabled={isPopulationDisabled}
          >
            <Text fw={700}>TODO: ICON</Text>
            <Text>Add population</Text>
            <Text size="sm" c="dimmed">
              Select a geographic scope or specific household
            </Text>
          </Card>
        )}

        {userDefinedPolicy && userDefinedPolicy.isCreated ? (
          <CardSelectedPolicy label={userDefinedPolicy.label ?? ''} />
        ) : (
          <CardCreatePolicy onClick={onPolicySelect} />
        )}
        <MultiButtonFooter buttons={buttonConfig} />
      </Stack>
    </Container>
  );
}

interface CardSelectedPolicyProps {
  label: string;
}

interface CardSelectedPopulationProps {
  label: string;
}

interface CardCreatePolicyProps {
  onClick: () => void;
}

function CardSelectedPolicy({ label }: CardSelectedPolicyProps) {
  return (
    <Card withBorder p="md" mb="xl" component="button" bg="lightblue">
      <Text fw={700}>TODO: ICON</Text>
      <Text>{label}</Text>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </Card>
  );
}

function CardSelectedPopulation({ label }: CardSelectedPopulationProps) {
  return (
    <Card withBorder p="md" mb="xl" component="button" bg="lightgreen">
      <Text fw={700}>TODO: ICON</Text>
      <Text>{label}</Text>
      <Text size="sm" c="dimmed">
        {label}
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
