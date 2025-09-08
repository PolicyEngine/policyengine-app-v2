import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import {
  clearPopulation,
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { FlowComponentProps } from '@/types/flow';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { UserGeographicAssociation } from '@/types/userIngredientAssociations';

export default function SimulationSelectExistingPopulationFrame({
  onNavigate,
}: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic

  // Fetch household populations
  const {
    data: householdData,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
    error: householdError,
  } = useUserHouseholds(userId);

  console.log('Household Data:', householdData);
  console.log('Household Loading:', isHouseholdLoading);
  console.log('Household Error:', isHouseholdError);
  console.log('Household Error Message:', householdError);

  // Fetch geographic populations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useGeographicAssociationsByUser(userId);

  console.log('Geographic Data:', geographicData);
  console.log('Geographic Loading:', isGeographicLoading);
  console.log('Geographic Error:', isGeographicError);
  console.log('Geographic Error Message:', geographicError);

  const [localPopulationId, setLocalPopulationId] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  const canProceed = localPopulationId !== null;

  function handleHouseholdPopulationSelect(population: HouseholdMetadata) {

    console.log("Selected Household Population:", population);
    // Blank out any existing population
    dispatch(clearPopulation());

    // Fill in all population details
    // TODO: Fix ID types
    dispatch(updatePopulationId(population.id.toString()));
    dispatch(updatePopulationLabel(population.label || ''));

    dispatch(markPopulationAsCreated());
    setLocalPopulationId(population.id);
  }

  function handleGeographicPopulationSelect(population: UserGeographicAssociation) {
    // Blank out any existing population
    dispatch(clearPopulation());

    // Fill in all population details
    dispatch(updatePopulationId(population.id.toString()));
    dispatch(updatePopulationLabel(population.label));

    dispatch(markPopulationAsCreated());
    setLocalPopulationId(`geographic-${population.id}`);

    // TODO: What's going on with labels here?
  }

  function handleSubmit() {
    dispatch(updatePopulationId(localPopulationId || ''));
    dispatch(markPopulationAsCreated());
    onNavigate('next');
  }

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

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

  if (householdPopulations.length === 0 && geographicPopulations.length === 0) {
    return (
      <FlowView
        title="Select an Existing Population"
        content={<Text>No populations available. Please create a new population.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Build card list items from household populations
  const householdCardItems = householdPopulations
    .filter((association) => association.household) // Only include associations with loaded households
    .slice(0, 5) // Display only the first 5 populations
    .map((association) => ({
      title: association.household!.label || `Population ${association.household!.id}`,
      onClick: () => handleHouseholdPopulationSelect(association.household!),
      isSelected: localPopulationId === association.household!.id,
    }));

  // Build card list items from geographic populations
  const geographicCardItems = geographicPopulations
    .slice(0, 5) // Display only the first 5 populations
    .map((association) => ({
      title: association.label,
      onClick: () => handleGeographicPopulationSelect(association),
      isSelected: localPopulationId === `geographic-${association.id}`,
    }));

  // Combine both types of populations
  const cardListItems = [...householdCardItems, ...geographicCardItems];

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Your Populations</Text>
      <Text size="sm" c="dimmed">
        Showing {householdCardItems.length} household and {geographicCardItems.length} geographic
        populations
      </Text>
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
