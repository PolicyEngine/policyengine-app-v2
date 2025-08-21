import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import {
  clearPopulation,
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { FlowComponentProps } from '@/types/flow';
import { HouseholdMetadata } from '@/types/householdMetadata';

export default function SimulationSelectExistingPopulationFrame({
  onNavigate,
}: FlowComponentProps) {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic

  const { data, isLoading, isError, error } = useUserHouseholds(userId);
  const [localPopulationId, setLocalPopulationId] = useState<string | null>(null);
  const dispatch = useDispatch();

  const canProceed = localPopulationId !== null;

  function handlePopulationSelect(population: HouseholdMetadata) {
    // Blank out any existing population
    dispatch(clearPopulation());

    // Fill in all population details
    // TODO: Fix ID types
    dispatch(updatePopulationId(population.id.toString()));
    dispatch(updatePopulationLabel(population.label || ''));

    dispatch(markPopulationAsCreated());
    setLocalPopulationId(population.id.toString());
  }

  function handleSubmit() {
    dispatch(updatePopulationId(localPopulationId || ''));
    dispatch(markPopulationAsCreated());
    onNavigate('next');
  }

  const userPopulations = data || [];

  // TODO: For all of these, refactor into something more reusable
  if (isLoading) {
    return (
      <FlowView
        title="Select an Existing Population"
        content={<Text>Loading populations...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <FlowView
        title="Select an Existing Population"
        content={
          <Text color="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
        }
        buttonPreset="none"
      />
    );
  }

  if (userPopulations.length === 0) {
    return (
      <FlowView
        title="Select an Existing Population"
        content={<Text>No populations available. Please create a new population.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  const recentUserPopulations = userPopulations.slice(0, 5); // Display only the first 5 populations
  const cardListItems = recentUserPopulations
    .filter((association) => association.household) // Only include associations with loaded households
    .map((association) => ({
      title: association.household!.label || `Population ${association.household!.id}`,
      onClick: () => handlePopulationSelect(association.household!),
      isSelected: localPopulationId === association.household!.id.toString(),
    }));

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Recents</Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed,
  };

  return (
    <FlowView
      title="Select an Existing Population"
      variant="cardList"
      content={content}
      cardListItems={cardListItems}
      primaryAction={primaryAction}
    />
  );
}
