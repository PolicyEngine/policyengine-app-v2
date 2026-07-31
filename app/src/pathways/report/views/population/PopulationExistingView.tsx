/**
 * PopulationExistingView - View for selecting existing population
 * Duplicated from SimulationSelectExistingPopulationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
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
import { getCountryDisplayName } from '@/models/geography';
import { Household as HouseholdModel } from '@/models/Household';
import { Geography } from '@/types/ingredients/Geography';
import {
  getLoadErrorAvailability,
  getUserHouseholdAvailability,
  isUserHouseholdSelectable,
  POPULATION_LOAD_ERROR_MESSAGE,
} from '@/utils/ingredientAvailability';
import {
  isGeographicAssociationReady,
  isHouseholdAssociationReady,
} from '@/utils/validation/ingredientValidation';

interface PopulationExistingViewProps {
  onSelectHousehold: (householdId: string, household: HouseholdModel, label: string) => void;
  onSelectGeography: (geographyId: string, geography: Geography, label: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

type ExistingPopulation =
  | UserHouseholdMetadataWithAssociation
  | UserGeographicMetadataWithAssociation;

function getPopulationAssociationKey(association: ExistingPopulation): string {
  if (isHouseholdMetadataWithAssociation(association)) {
    return `household:${association.association.id || association.association.householdId}`;
  }

  return `geography:${association.association.id || association.association.geographyId}`;
}

export default function PopulationExistingView({
  onSelectHousehold,
  onSelectGeography,
  onBack,
  onCancel,
}: PopulationExistingViewProps) {
  const userId = MOCK_USER_ID.toString();

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

  const householdPopulations = householdData || [];
  const geographicPopulations = geographicData || [];
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );
  const allPopulations: ExistingPopulation[] = [...filteredHouseholds, ...geographicPopulations];
  const [selectedPopulationKey, setSelectedPopulationKey] = useState<string | null>(null);
  const localPopulation =
    allPopulations.find(
      (association) => getPopulationAssociationKey(association) === selectedPopulationKey
    ) ?? null;

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  function canProceed() {
    if (!localPopulation) {
      return false;
    }

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      return (
        isUserHouseholdSelectable(localPopulation) && isHouseholdAssociationReady(localPopulation)
      );
    }

    if (isGeographicMetadataWithAssociation(localPopulation)) {
      return !localPopulation.error && isGeographicAssociationReady(localPopulation);
    }

    return false;
  }

  function handleHouseholdPopulationSelect(association: UserHouseholdMetadataWithAssociation) {
    if (!association || !isUserHouseholdSelectable(association)) {
      return;
    }

    setSelectedPopulationKey(getPopulationAssociationKey(association));
  }

  function handleGeographicPopulationSelect(association: UserGeographicMetadataWithAssociation) {
    if (!association || association.error || !isGeographicAssociationReady(association)) {
      return;
    }

    setSelectedPopulationKey(getPopulationAssociationKey(association));
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
    if (
      !localPopulation ||
      !isHouseholdMetadataWithAssociation(localPopulation) ||
      !isUserHouseholdSelectable(localPopulation)
    ) {
      return;
    }

    const householdToSet = localPopulation.household;
    const label = localPopulation.association?.label || '';
    const householdId = householdToSet.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectHousehold(householdId, householdToSet, label);
  }

  function handleSubmitGeographicPopulation() {
    if (
      !localPopulation ||
      !isGeographicMetadataWithAssociation(localPopulation) ||
      localPopulation.error ||
      !isGeographicAssociationReady(localPopulation)
    ) {
      return;
    }

    const label = localPopulation.association?.label || '';
    const geography = localPopulation.geography!;
    const geographyId = geography.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectGeography(geographyId, geography, label);
  }

  if (isLoading) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={<p className="tw:text-gray-600">Loading households...</p>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={
          <p className="tw:text-red-600">
            Error: {(error as Error)?.message || 'Something went wrong.'}
          </p>
        }
        buttonPreset="none"
      />
    );
  }

  if (householdPopulations.length === 0 && geographicPopulations.length === 0) {
    return (
      <PathwayView
        title="Select existing household(s)"
        content={
          <p className="tw:text-gray-600">
            No households available. Please create new household(s).
          </p>
        }
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

  // Build card list items from ALL household populations
  const householdCardItems = allPopulations
    .filter((association) => isHouseholdMetadataWithAssociation(association))
    .map((association) => {
      const isReady = isHouseholdAssociationReady(association);
      const associationKey = getPopulationAssociationKey(association);
      const isSelectable = isUserHouseholdSelectable(association);
      const availability = getUserHouseholdAvailability(association);

      let title = '';
      let subtitle = '';

      if (association.error) {
        title =
          association.association.label || `Household #${association.association.householdId}`;
        subtitle = 'Failed to load';
      } else if (!isReady) {
        // NOT LOADED YET - show loading indicator
        title = '⏳ Loading...';
        subtitle = 'Household data not loaded yet';
      } else if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Household #${association.household!.id}`;
      } else {
        title = `Household #${association.household!.id}`;
        subtitle = '';
      }

      return {
        id: associationKey,
        title,
        subtitle,
        onClick: () => handleHouseholdPopulationSelect(association!),
        ...availability,
        isSelected: isSelectable && selectedPopulationKey === associationKey,
      };
    });

  // Helper function to get geographic label from metadata
  const getGeographicLabel = (geography: Geography) => {
    if (!geography) {
      return 'Unknown Location';
    }

    if (geography.scope === 'national') {
      return getCountryDisplayName(geography.countryId);
    }

    return geography.name || geography.geographyId;
  };

  // Build card list items from ALL geographic populations
  const geographicCardItems = allPopulations
    .filter((association) => isGeographicMetadataWithAssociation(association))
    .map((association) => {
      const associationKey = getPopulationAssociationKey(association);
      const isSelectable = !association.error && isGeographicAssociationReady(association);
      const availability = getLoadErrorAvailability(
        association.error,
        POPULATION_LOAD_ERROR_MESSAGE
      );
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
        id: associationKey,
        title,
        subtitle,
        onClick: () => handleGeographicPopulationSelect(association!),
        ...availability,
        isDisabled: !isSelectable,
        isSelected: isSelectable && selectedPopulationKey === associationKey,
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
