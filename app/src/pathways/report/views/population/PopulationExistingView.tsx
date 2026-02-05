/**
 * PopulationExistingView - View for selecting existing household population
 *
 * Note: Geographic populations are no longer stored as user associations.
 * Users select a geography per-simulation via the scope selection flow.
 * This view now only shows household populations.
 */

import { useState } from 'react';
import { Text } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { useUserId } from '@/hooks/useUserId';
import {
  isHouseholdMetadataWithAssociation,
  UserHouseholdMetadataWithAssociation,
  useUserHouseholds,
} from '@/hooks/useUserHousehold';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { isHouseholdAssociationReady } from '@/utils/validation/ingredientValidation';

interface PopulationExistingViewProps {
  onSelectHousehold: (householdId: string, household: Household, label: string) => void;
  // Keep onSelectGeography for API compatibility, but it won't be called from this view
  // since users now select geography via the scope flow, not from saved associations
  onSelectGeography: (geographyId: string, geography: Geography, label: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function PopulationExistingView({
  onSelectHousehold,
  onBack,
  onCancel,
}: PopulationExistingViewProps) {
  const userId = useUserId();

  // Fetch household populations only
  // Geographic populations are no longer stored as user associations
  const { data: householdData, isLoading, isError, error } = useUserHouseholds(userId);

  const [localPopulation, setLocalPopulation] =
    useState<UserHouseholdMetadataWithAssociation | null>(null);

  function canProceed() {
    if (!localPopulation) {
      return false;
    }

    return isHouseholdAssociationReady(localPopulation);
  }

  function handleHouseholdPopulationSelect(association: UserHouseholdMetadataWithAssociation) {
    if (!association) {
      return;
    }

    setLocalPopulation(association);
  }

  function handleSubmit() {
    if (!localPopulation) {
      return;
    }

    handleSubmitHouseholdPopulation();
  }

  function handleSubmitHouseholdPopulation() {
    if (!localPopulation) {
      return;
    }

    // Guard: ensure household data is fully loaded before calling adapter
    if (!localPopulation.household) {
      console.error('[PopulationExistingView] Household metadata is undefined');
      return;
    }

    // Household is already in v2 format (Household type)
    const householdToSet = localPopulation.household;

    const label = localPopulation.association?.label || '';
    const householdId = householdToSet.id!;

    // Call parent callback instead of dispatching to Redux
    onSelectHousehold(householdId, householdToSet, label);
  }

  const householdPopulations = householdData || [];

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

  if (householdPopulations.length === 0) {
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

  // Filter valid household populations
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );

  // Build card list items from household populations
  const cardListItems = filteredHouseholds.map((association) => {
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
      id: association.association.id?.toString() || association.household?.id?.toString(),
      title,
      subtitle,
      onClick: () => handleHouseholdPopulationSelect(association),
      isSelected: localPopulation?.household?.id === association.household?.id,
    };
  });

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
