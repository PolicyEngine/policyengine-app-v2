import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from '@mantine/core';
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
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import {
  createPopulationAtPosition,
  setGeographyAtPosition,
  setHouseholdAtPosition,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';
import { getCountryLabel, getRegionLabel } from '@/utils/geographyUtils';

export default function SimulationSelectExistingPopulationFrame({
  onNavigate,
}: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const dispatch = useDispatch();

  // Read position from report reducer via cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const metadata = useSelector((state: RootState) => state.metadata);

  // Fetch household populations
  const {
    data: householdData,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
    error: householdError,
  } = useUserHouseholds(userId);

  console.log(
    '[SimulationSelectExistingPopulationFrame] ========== HOUSEHOLD DATA FETCH =========='
  );
  console.log('[SimulationSelectExistingPopulationFrame] Household raw data:', householdData);
  console.log(
    '[SimulationSelectExistingPopulationFrame] Household raw data length:',
    householdData?.length
  );
  console.log('[SimulationSelectExistingPopulationFrame] Household isLoading:', isHouseholdLoading);
  console.log('[SimulationSelectExistingPopulationFrame] Household isError:', isHouseholdError);
  console.log('[SimulationSelectExistingPopulationFrame] Household error:', householdError);

  // Fetch geographic populations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useUserGeographics(userId);

  console.log(
    '[SimulationSelectExistingPopulationFrame] ========== GEOGRAPHIC DATA FETCH =========='
  );
  console.log('[SimulationSelectExistingPopulationFrame] Geographic raw data:', geographicData);
  console.log(
    '[SimulationSelectExistingPopulationFrame] Geographic raw data length:',
    geographicData?.length
  );
  console.log(
    '[SimulationSelectExistingPopulationFrame] Geographic isLoading:',
    isGeographicLoading
  );
  console.log('[SimulationSelectExistingPopulationFrame] Geographic isError:', isGeographicError);
  console.log('[SimulationSelectExistingPopulationFrame] Geographic error:', geographicError);

  const [localPopulation, setLocalPopulation] = useState<
    UserHouseholdMetadataWithAssociation | UserGeographicMetadataWithAssociation | null
  >(null);

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

    console.log('[POPULATION SELECT] === SUBMIT START ===');
    console.log('[POPULATION SELECT] Local Population on Submit:', localPopulation);
    console.log('[POPULATION SELECT] Association:', localPopulation.association);
    console.log(
      '[POPULATION SELECT] Association countryId:',
      localPopulation.association?.countryId
    );
    console.log('[POPULATION SELECT] Household metadata:', localPopulation.household);

    const householdToSet = HouseholdAdapter.fromMetadata(localPopulation.household!);
    console.log('[POPULATION SELECT] Converted household:', householdToSet);
    console.log('[POPULATION SELECT] Household ID:', householdToSet.id);

    // Create a new population at the current position
    console.log('[POPULATION SELECT] Dispatching createPopulationAtPosition with:', {
      position: currentPosition,
      label: localPopulation.association?.label || '',
      isCreated: true,
    });
    dispatch(
      createPopulationAtPosition({
        position: currentPosition,
        population: {
          label: localPopulation.association?.label || '',
          isCreated: true,
          household: null,
          geography: null,
        },
      })
    );

    // Update with household data
    console.log(
      '[POPULATION SELECT] Dispatching setHouseholdAtPosition with household ID:',
      householdToSet.id
    );
    dispatch(
      setHouseholdAtPosition({
        position: currentPosition,
        household: householdToSet,
      })
    );
    console.log('[POPULATION SELECT] === SUBMIT END ===');
  }

  function handleSubmitGeographicPopulation() {
    if (!localPopulation || !isGeographicMetadataWithAssociation(localPopulation)) {
      return;
    }

    console.log('Local Geographic Population on Submit:', localPopulation);
    console.log('Setting geography in population:', localPopulation.geography);

    // Create a new population at the current position
    dispatch(
      createPopulationAtPosition({
        position: currentPosition,
        population: {
          label: localPopulation.association?.label || '',
          isCreated: true,
          household: null,
          geography: null,
        },
      })
    );

    // Update with geography data
    dispatch(
      setGeographyAtPosition({
        position: currentPosition,
        geography: localPopulation.geography!,
      })
    );
  }

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

  console.log('[SimulationSelectExistingPopulationFrame] ========== BEFORE FILTERING ==========');
  console.log(
    '[SimulationSelectExistingPopulationFrame] Household populations count:',
    householdPopulations.length
  );
  console.log(
    '[SimulationSelectExistingPopulationFrame] Household populations:',
    householdPopulations
  );
  console.log(
    '[SimulationSelectExistingPopulationFrame] Geographic populations count:',
    geographicPopulations.length
  );
  console.log(
    '[SimulationSelectExistingPopulationFrame] Geographic populations:',
    geographicPopulations
  );

  // TODO: For all of these, refactor into something more reusable
  if (isLoading) {
    const cancelAction = {
    ingredientType: 'simulation' as const,
  };

  return (
      <FlowView
        title="Select an Existing Population"
        content={<Text>Loading populations...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    const cancelAction = {
    ingredientType: 'simulation' as const,
  };

  return (
      <FlowView
        title="Select an Existing Population"
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
        buttonPreset="none"
      />
    );
  }

  if (householdPopulations.length === 0 && geographicPopulations.length === 0) {
    const cancelAction = {
    ingredientType: 'simulation' as const,
  };

  return (
      <FlowView
        title="Select an Existing Population"
        content={<Text>No populations available. Please create a new population.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Filter household populations
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );

  console.log('[SimulationSelectExistingPopulationFrame] ========== AFTER FILTERING ==========');
  console.log(
    '[SimulationSelectExistingPopulationFrame] Filtered households count:',
    filteredHouseholds.length
  );
  console.log(
    '[SimulationSelectExistingPopulationFrame] Filter criteria: isHouseholdMetadataWithAssociation(association)'
  );
  console.log('[SimulationSelectExistingPopulationFrame] Filtered households:', filteredHouseholds);

  // Combine all populations (pagination handled by FlowView)
  const allPopulations = [...filteredHouseholds, ...geographicPopulations];

  // Build card list items from ALL household populations
  const householdCardItems = allPopulations
    .filter((association) => isHouseholdMetadataWithAssociation(association))
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
    if (!geography) {
      return 'Unknown Location';
    }

    // If it's a national scope, return the country name
    if (geography.scope === 'national') {
      return getCountryLabel(geography.countryId);
    }

    // For subnational, look up in metadata
    if (geography.scope === 'subnational') {
      return getRegionLabel(geography.geographyId, metadata);
    }
    return geography.name || geography.geographyId;
  };

  // Build card list items from ALL geographic populations
  const geographicCardItems = allPopulations
    .filter((association) => isGeographicMetadataWithAssociation(association))
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
        subtitle = '';
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

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  const cancelAction = {
    ingredientType: 'simulation' as const,
  };

  return (
    <FlowView
      title="Select an Existing Population"
      variant="cardList"
      cardListItems={cardListItems}
      primaryAction={primaryAction}
      itemsPerPage={5}
      cancelAction={cancelAction}
    />
  );
}
