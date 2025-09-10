import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { HouseholdAdapter } from '@/adapters';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import {
  isGeographicMetadataWithAssociation,
  UserGeographicMetadataWithAssociation,
  useUserGeographics,
} from '@/hooks/useUserGeographic';
import {
  isHouseholdMetadataWithAssociation,
  UserHouseholdMetadataWithAssociation,
  useUserHouseholds,
} from '@/hooks/useUserHousehold';
import {
  clearPopulation,
  markPopulationAsCreated,
  setGeography,
  setHousehold,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { getCountryLabel, getRegionLabel } from '@/utils/geographyUtils';
import { Geography } from '@/types/ingredients/Geography';

export default function SimulationSelectExistingPopulationFrame({
  onNavigate,
}: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const metadata = useSelector((state: RootState) => state.metadata);

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
  } = useUserGeographics(userId);

  console.log('Geographic Data:', geographicData);
  console.log('Geographic Loading:', isGeographicLoading);
  console.log('Geographic Error:', isGeographicError);
  console.log('Geographic Error Message:', geographicError);

  const [localPopulation, setLocalPopulation] = useState<
    UserHouseholdMetadataWithAssociation | UserGeographicMetadataWithAssociation | null
  >(null);
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
    if (isGeographicMetadataWithAssociation(localPopulation)) {
      return localPopulation.geography?.id !== null;
    }
    return false;
  }

  function handleHouseholdPopulationSelect(association: UserHouseholdMetadataWithAssociation) {
    if (!association) {
      return;
    }

    setLocalPopulation(association);
  }

  function handleGeographicPopulationSelect(association: UserGeographicMetadataWithAssociation) {
    if (!association) {
      return;
    }

    setLocalPopulation(association);
  }

  function handleSubmit() {
    if (!localPopulation) {
      return;
    }

    console.log('Submitting Population in handleSubmit:', localPopulation);

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      console.log('Use household handler');
      handleSubmitHouseholdPopulation();
    } else if (isGeographicMetadataWithAssociation(localPopulation)) {
      console.log('Use geographic handler');
      handleSubmitGeographicPopulation();
    }

    onNavigate('next');
  }

  function handleSubmitHouseholdPopulation() {
    if (!localPopulation || !isHouseholdMetadataWithAssociation(localPopulation)) {
      return;
    }

    dispatch(clearPopulation());

    console.log('Local Population on Submit:', localPopulation);
    dispatch(updatePopulationId(localPopulation.household?.id || ''));
    dispatch(updatePopulationLabel(localPopulation.association?.label || ''));

    const householdToSet = HouseholdAdapter.fromAPI(localPopulation.household!);
    console.log('Setting household in population:', householdToSet);
    dispatch(setHousehold(householdToSet));

    dispatch(markPopulationAsCreated());
  }

  function handleSubmitGeographicPopulation() {
    if (!localPopulation || !isGeographicMetadataWithAssociation(localPopulation)) {
      return;
    }

    dispatch(clearPopulation());

    console.log('Local Geographic Population on Submit:', localPopulation);
    dispatch(updatePopulationId(localPopulation.geography?.id || ''));
    dispatch(updatePopulationLabel(localPopulation.association?.label || ''));

    console.log('Setting geography in population:', localPopulation.geography);
    dispatch(setGeography(localPopulation.geography!));

    dispatch(markPopulationAsCreated());
  }

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

  console.log('Household Populations:', householdPopulations);
  console.log('Geographic Populations:', geographicPopulations);

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
          <Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
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
      let title = '';
      let subtitle = '';
      if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Population #${association.household!.id}`;
      } else {
        title = `Population #${association.household!.id}`;
      }

      return {
        title,
        subtitle,
        onClick: () => handleHouseholdPopulationSelect(association!),
        isSelected:
          isHouseholdMetadataWithAssociation(localPopulation) &&
          localPopulation.household?.id === association.household!.id,
      };
    });

  // Helper function to get geographic label from metadata
  const getGeographicLabel = (geography: Geography) => {
    if (!geography) return 'Unknown Location';
    
    // If it's a national scope, return the country name
    if (geography.scope === 'national') {
      return getCountryLabel(geography.countryId);
    }
    
    // For subnational, look up in metadata
    if (geography.scope === "subnational") {
      return getRegionLabel(geography.geographyId, metadata);
    }
    return geography.name || geography.geographyId;
  };

  // Build card list items from geographic populations
  const geographicCardItems = geographicPopulations
    .filter((association) => isGeographicMetadataWithAssociation(association)) // Only include valid associations
    .slice(0, 5) // Display only the first 5 populations
    .map((association) => {
      let title = '';
      let subtitle = '';
      
      // Use the label if it exists, otherwise look it up from metadata
      if ('label' in association.association && association.association.label) {
        title = association.association.label;
      } else {
        title = getGeographicLabel(association.geography!);
      }
      
      // If user has defined a label, show the geography name as a subtitle (e.g., 'New York');
      // if user has not defined label, we already show geography name above; show nothing
      if ('label' in association.association && association.association.label) {
        subtitle = getGeographicLabel(association.geography!);
      } else {
        subtitle = "";
      }

      return {
        title,
        subtitle,
        onClick: () => handleGeographicPopulationSelect(association!),
        isSelected:
          isGeographicMetadataWithAssociation(localPopulation) &&
          localPopulation.geography?.id === association.geography!.id,
      };
    });

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
