import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card, Stack, Text } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from '@/components/common/MultiButtonFooter';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import {
  clearPopulation,
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSelectExistingPopulationFrame({
  onNavigate,
}: FlowComponentProps) {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic

  const { data, isLoading, isError, error } = useUserHouseholds(userId);
  const [localPopulationId, setLocalPopulationId] = useState<string | null>(null);

  const canProceed = localPopulationId !== null;
  const dispatch = useDispatch();

  function handlePopulationSelect(population: NonNullable<typeof data>[number]['household']) {
    if (!population) {
      return;
    }
    dispatch(clearPopulation());

    dispatch(updatePopulationId(population.id.toString()));
    dispatch(updatePopulationLabel(population.label || ''));

    dispatch(markPopulationAsCreated());
    setLocalPopulationId(population.id.toString());
  }

  function handleSubmit() {
    if (!localPopulationId) {
      return;
    }

    dispatch(updatePopulationId(localPopulationId));
    dispatch(markPopulationAsCreated());
    onNavigate('next');
  }

  const canProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'filled',
    onClick: handleSubmit,
  };

  const cantProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'disabled',
    onClick: () => null,
  };

  const cancelButtonConfig: ButtonConfig = {
    label: 'Cancel',
    variant: 'outline',
    onClick: () => {
      console.log('Cancel clicked');
    },
  };

  const buttonConfig: ButtonConfig[] = canProceed
    ? [cancelButtonConfig, canProceedNextButtonConfig]
    : [cancelButtonConfig, cantProceedNextButtonConfig];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  const userPopulations = data || [];

  let displayPopulations = null;

  if (userPopulations.length === 0) {
    displayPopulations = <Text>No populations available. Please create a new population.</Text>;
  } else {
    const recentUserPopulations = userPopulations.slice(0, 5);
    displayPopulations = recentUserPopulations
      .filter(({ household }) => household) // filter out any missing households
      .map(({ household }) => (
        <Card
          key={household!.id}
          withBorder
          p="md"
          component="button"
          onClick={() => handlePopulationSelect(household!)}
        >
          <Stack>
            <Text fw={600}>{household!.id}</Text>
          </Stack>
        </Card>
      )); // TODO Update the content to be displayed for available households
  }

  return (
    <Stack>
      <Text fw={700}>Select an Existing Population</Text>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Recents</Text>
      <Stack>{displayPopulations}</Stack>
      <MultiButtonFooter buttons={buttonConfig} />
    </Stack>
  );
}
