import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Container, Grid, Stack, Text } from '@mantine/core';
import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
import SimulationSetupPopulationFrame from '@/frames/SimulationSetupPopulationFrame';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

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

  console.log('userDefinedPolicy', userDefinedPolicy);

  const canProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'filled' as const,
    onClick: onNext,
  };

  const cantProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'disabled' as const,
    onClick: () => {
      return null;
    },
  };

  const cancelButtonConfig: ButtonConfig = {
    label: 'Cancel',
    variant: 'outline' as const,
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
        {/* Temporarily add color to demonstrate disabled*/}
        <Card
          withBorder
          p="md"
          mb="xl"
          component="button"
          onClick={onPopulationSelect}
          disabled={isPopulationDisabled}
          bg="gray"
        >
          <Text fw={700}>TODO: ICON</Text>
          <Text>Add population</Text>
          <Text size="sm" c="dimmed">
            Select a geographic scope or specific household
          </Text>
        </Card>
        {userDefinedPolicy && userDefinedPolicy.isCreated ? (
          <CardSelectedPolicy label={userDefinedPolicy.label} />
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

interface CardCreatePolicyProps {
  onClick: () => void;
}

function CardSelectedPolicy({ label }: CardSelectedPolicyProps) {
  return (
    <Card withBorder p="md" mb="xl" component="button" bg={'lightblue'}>
      {/* TODO: Remove hardcoded color*/}
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
