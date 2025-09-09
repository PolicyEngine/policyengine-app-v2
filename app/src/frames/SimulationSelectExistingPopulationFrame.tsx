import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds, UserHouseholdMetadataWithAssociation, isHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import {
  clearPopulation,
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
  setHousehold,
} from '@/reducers/populationReducer';
import { HouseholdAdapter } from '@/adapters';
import { FlowComponentProps } from '@/types/flow';
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

  // TODO: After adding geographic API handling, UserGeographicAssociation will likely be replaced
  // by a different type 
  const [localPopulation, setLocalPopulation] = useState<UserHouseholdMetadataWithAssociation | UserGeographicAssociation | null>(null);
  const dispatch = useDispatch();

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  function canProceed() {
    if (!localPopulation) {
      return false;
    }
    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      return localPopulation.household?.id !== null;
    }
    return false;
    // TODO: Add handling for geographies here
  }

  function handleHouseholdPopulationSelect(association: UserHouseholdMetadataWithAssociation) {
    if (!association) return;

    setLocalPopulation(association);
  }


  // TODO: Update this to work correctly with geographic populations
  function handleGeographicPopulationSelect(geography: UserGeographicAssociation) {
    console.log("Selected Geographic Population:", geography);
    if (!geography || !('id' in geography)) return;
    // Blank out any existing population
    dispatch(clearPopulation());

    // Fill in all population details
    dispatch(updatePopulationId(geography.id.toString()));
    dispatch(updatePopulationLabel(geography.label));

    dispatch(markPopulationAsCreated());
    // setLocalPopulationId(`geographic-${geography.id}`);
    setLocalPopulation(geography);

    // TODO: What's going on with labels here?
  }

  function handleSubmit() {
    if (!localPopulation) return;

    console.log("Submitting Population in handleSubmit:", localPopulation);

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      console.log("Use household handler");
      handleSubmitHouseholdPopulation();
    }

    // TODO: Add handling for geographic populations here

    onNavigate('next');
  }

  function handleSubmitHouseholdPopulation() {
    if (!localPopulation || !isHouseholdMetadataWithAssociation(localPopulation)) return;

    dispatch(clearPopulation());

    console.log("Local Population on Submit:", localPopulation);
    dispatch(updatePopulationId(localPopulation.household?.id || ''));
    dispatch(updatePopulationLabel(localPopulation.association?.label || ''));

    const householdToSet = HouseholdAdapter.fromAPI(localPopulation.household!);
    console.log("Setting household in population:", householdToSet);
    dispatch(setHousehold(householdToSet));

    dispatch(markPopulationAsCreated());
  }


  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

  console.log("Household Populations:", householdPopulations);
  console.log("Geographic Populations:", geographicPopulations);

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
    .filter((association) => isHouseholdMetadataWithAssociation(association)) // Only include associations with loaded households
    .slice(0, 5) // Display only the first 5 populations
    .map((association) => {
      let title = "";
      let subtitle = "";
      if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Population #${association.household!.id}`;
      } else {
        title = `Population #${association.household!.id}`;
      }

      return {
        title: title,
        subtitle: subtitle,
        onClick: () => handleHouseholdPopulationSelect(association!),
        isSelected: isHouseholdMetadataWithAssociation(localPopulation) && localPopulation.household?.id === association.household!.id,
      }
    });

  // Build card list items from geographic populations
  const geographicCardItems = geographicPopulations
    .slice(0, 5) // Display only the first 5 populations
    .map((association) => ({
      title: association.label,
      onClick: () => handleGeographicPopulationSelect(association),
      // TODO: Update this selection logic to work properly after overhauling geography types
      // isSelected: localPopulation?.id === association.id,
      isSelected: false,
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
    isDisabled: !canProceed(),
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
