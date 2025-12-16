/**
 * PopulationExistingView - View for selecting existing population
 * Duplicated from SimulationSelectExistingPopulationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '@mantine/core';
import { HouseholdAdapter } from '@/adapters';
import PathwayView from '@/components/common/PathwayView';
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
import {
  isGeographicAssociationReady,
  isHouseholdAssociationReady,
} from '@/utils/validation/ingredientValidation';

interface PopulationExistingViewProps {
  onSelectHousehold: (householdId: string, household: Household, label: string) => void;
  onSelectGeography: (geographyId: string, geography: Geography, label: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function PopulationExistingView({
  onSelectHousehold,
  onSelectGeography,
  onBack,
  onCancel,
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

  // Fetch geographic populations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useUserGeographics(userId);

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
      return isHouseholdAssociationReady(localPopulation);
    }

    if (isGeographicMetadataWithAssociation(localPopulation)) {
      return isGeographicAssociationReady(localPopulation);
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

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      handleSubmitHouseholdPopulation();
    } else if (isGeographicMetadataWithAssociation(localPopulation)) {
      handleSubmitGeographicPopulation();
    }
  }

  function handleSubmitHouseholdPopulation() {
    if (!localPopulation || !isHouseholdMetadataWithAssociation(localPopulation)) {
      return;
    }

    // Guard: ensure household data is fully loaded before calling adapter
    if (!localPopulation.household) {
      console.error('[PopulationExistingView] Household metadata is undefined');
      return;
    }

    // Handle both API format (household_json) and transformed format (householdData)
    // The cache might contain transformed data from useUserSimulations
    let householdToSet;
    if ('household_json' in localPopulation.household) {
      // API format - needs transformation
      householdToSet = HouseholdAdapter.fromMetadata(localPopulation.household);
    } else {
      // Already transformed format from cache
      householdToSet = localPopulation.household as any;
    }

    const label = localPopulation.association?.label || '';
    const householdId = householdToSet.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectHousehold(householdId, householdToSet, label);
  }

  function handleSubmitGeographicPopulation() {
    if (!localPopulation || !isGeographicMetadataWithAssociation(localPopulation)) {
      return;
    }

    const label = localPopulation.association?.label || '';
    const geography = localPopulation.geography!;
    const geographyId = geography.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectGeography(geographyId, geography, label);
  }

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];

  if (isLoading) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={<Text>Loading households...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
        buttonPreset="none"
      />
    );
  }

  if (householdPopulations.length === 0 && geographicPopulations.length === 0) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={<Text>No households available. Please create new household(s).</Text>}
        primaryAction={{
          label: 'Next',
          onClick: () => {},
          isDisabled: true,
        }}
        backAction={onBack ? { onClick: onBack } : undefined}
        cancelAction={onCancel ? { onClick: onCancel } : undefined}
      />
    );
  }

  // Filter household populations
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );

  // Combine all populations (pagination handled by PathwayView)
  const allPopulations = [...filteredHouseholds, ...geographicPopulations];

  // Build card list items from ALL household populations
  const householdCardItems = allPopulations
    .filter((association) => isHouseholdMetadataWithAssociation(association))
    .map((association) => {
      const isReady = isHouseholdAssociationReady(association);

      let title = '';
      let subtitle = '';

      if (!isReady) {
        // NOT LOADED YET - show loading indicator
        title = '⏳ Loading...';
        subtitle = 'Household data not loaded yet';
      } else if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Population #${association.household!.id}`;
      } else {
        title = `Population #${association.household!.id}`;
        subtitle = '';
      }

      return {
        id: association.association.id?.toString() || association.household?.id?.toString(), // Use association ID for unique key
        title,
        subtitle,
        onClick: () => handleHouseholdPopulationSelect(association!),
        isSelected:
          isHouseholdMetadataWithAssociation(localPopulation) &&
          localPopulation.household?.id === association.household?.id,
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
        id: association.association.id?.toString() || association.geography?.id?.toString(), // Use association ID for unique key
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
    <PathwayView
      title="Select existing household(s)"
      variant="cardList"
      cardListItems={cardListItems}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
      itemsPerPage={5}
    />
  );
}
