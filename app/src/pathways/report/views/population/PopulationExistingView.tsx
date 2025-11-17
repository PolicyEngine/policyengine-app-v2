/**
 * PopulationExistingView - View for selecting existing population
 * Duplicated from SimulationSelectExistingPopulationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { RootState } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { getCountryLabel, getRegionLabel } from '@/utils/geographyUtils';

interface PopulationExistingViewProps {
  onSelectHousehold: (householdId: string, household: Household, label: string) => void;
  onSelectGeography: (geographyId: string, geography: Geography, label: string) => void;
  onReturn: () => void;
}

export default function PopulationExistingView({
  onSelectHousehold,
  onSelectGeography,
  onReturn,
}: PopulationExistingViewProps) {
  const userId = MOCK_USER_ID.toString();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Fetch household populations
  const {
    data: householdData,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
    error: householdError,
  } = useUserHouseholds(userId);

  console.log('[PopulationExistingView] ========== HOUSEHOLD DATA FETCH ==========');
  console.log('[PopulationExistingView] Household raw data:', householdData);
  console.log('[PopulationExistingView] Household raw data length:', householdData?.length);
  console.log('[PopulationExistingView] Household isLoading:', isHouseholdLoading);
  console.log('[PopulationExistingView] Household isError:', isHouseholdError);
  console.log('[PopulationExistingView] Household error:', householdError);

  // Fetch geographic populations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useUserGeographics(userId);

  console.log('[PopulationExistingView] ========== GEOGRAPHIC DATA FETCH ==========');
  console.log('[PopulationExistingView] Geographic raw data:', geographicData);
  console.log('[PopulationExistingView] Geographic raw data length:', geographicData?.length);
  console.log('[PopulationExistingView] Geographic isLoading:', isGeographicLoading);
  console.log('[PopulationExistingView] Geographic isError:', isGeographicError);
  console.log('[PopulationExistingView] Geographic error:', geographicError);

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

    console.log('[PopulationExistingView] Submitting Population in handleSubmit:', localPopulation);

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      console.log('[PopulationExistingView] Use household handler');
      handleSubmitHouseholdPopulation();
    } else if (isGeographicMetadataWithAssociation(localPopulation)) {
      console.log('[PopulationExistingView] Use geographic handler');
      handleSubmitGeographicPopulation();
    }
  }

  function handleSubmitHouseholdPopulation() {
    if (!localPopulation || !isHouseholdMetadataWithAssociation(localPopulation)) {
      return;
    }

    console.log('[PopulationExistingView] === SUBMIT START ===');
    console.log('[PopulationExistingView] Local Population on Submit:', localPopulation);
    console.log('[PopulationExistingView] Association:', localPopulation.association);
    console.log(
      '[PopulationExistingView] Association countryId:',
      localPopulation.association?.countryId
    );
    console.log('[PopulationExistingView] Household metadata:', localPopulation.household);

    const householdToSet = HouseholdAdapter.fromMetadata(localPopulation.household!);
    console.log('[PopulationExistingView] Converted household:', householdToSet);
    console.log('[PopulationExistingView] Household ID:', householdToSet.id);

    const label = localPopulation.association?.label || '';
    const householdId = householdToSet.id!;

    console.log('[PopulationExistingView] === SUBMIT END ===');

    // Call parent callback instead of dispatching to Redux
    onSelectHousehold(householdId, householdToSet, label);
  }

  function handleSubmitGeographicPopulation() {
    if (!localPopulation || !isGeographicMetadataWithAssociation(localPopulation)) {
      return;
    }

    console.log('[PopulationExistingView] Local Geographic Population on Submit:', localPopulation);
    console.log('[PopulationExistingView] Setting geography in population:', localPopulation.geography);

    const label = localPopulation.association?.label || '';
    const geography = localPopulation.geography!;
    const geographyId = geography.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectGeography(geographyId, geography, label);
  }

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

  console.log('[PopulationExistingView] ========== BEFORE FILTERING ==========');
  console.log('[PopulationExistingView] Household populations count:', householdPopulations.length);
  console.log('[PopulationExistingView] Household populations:', householdPopulations);
  console.log(
    '[PopulationExistingView] Geographic populations count:',
    geographicPopulations.length
  );
  console.log('[PopulationExistingView] Geographic populations:', geographicPopulations);

  if (isLoading) {
    return (
      <FlowView
        title="Select Existing Household(s)"
        content={<Text>Loading households...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <FlowView
        title="Select Existing Household(s)"
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
        title="Select Existing Household(s)"
        content={<Text>No households available. Please create new household(s).</Text>}
        cancelAction={{ onClick: onReturn }}
        buttonPreset="cancel-only"
      />
    );
  }

  // Filter household populations
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );

  console.log('[PopulationExistingView] ========== AFTER FILTERING ==========');
  console.log('[PopulationExistingView] Filtered households count:', filteredHouseholds.length);
  console.log(
    '[PopulationExistingView] Filter criteria: isHouseholdMetadataWithAssociation(association)'
  );
  console.log('[PopulationExistingView] Filtered households:', filteredHouseholds);

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

  return (
    <FlowView
      title="Select Existing Household(s)"
      variant="cardList"
      cardListItems={cardListItems}
      primaryAction={primaryAction}
      itemsPerPage={5}
    />
  );
}
