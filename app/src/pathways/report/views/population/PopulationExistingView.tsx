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
import {
  isHouseholdAssociationReady,
  isGeographicAssociationReady,
} from '@/utils/validation/ingredientValidation';

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
    console.log('[POPEXIST] ========== canProceed CHECK ==========');
    console.log('[POPEXIST] localPopulation:', localPopulation);

    if (!localPopulation) {
      console.log('[POPEXIST] canProceed: false (no localPopulation)');
      return false;
    }

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      const isReady = isHouseholdAssociationReady(localPopulation);
      console.log('[POPEXIST] Household association check:');
      console.log('[POPEXIST]   - isLoading:', localPopulation.isLoading);
      console.log('[POPEXIST]   - household exists:', !!localPopulation.household);
      console.log('[POPEXIST]   - household.id:', localPopulation.household?.id);
      console.log('[POPEXIST]   - household.household_json exists:', !!localPopulation.household?.household_json);
      console.log('[POPEXIST]   - isHouseholdAssociationReady:', isReady);
      console.log('[POPEXIST] canProceed:', isReady);
      return isReady;
    }

    if (isGeographicMetadataWithAssociation(localPopulation)) {
      const isReady = isGeographicAssociationReady(localPopulation);
      console.log('[POPEXIST] Geographic association check:');
      console.log('[POPEXIST]   - isLoading:', localPopulation.isLoading);
      console.log('[POPEXIST]   - geography exists:', !!localPopulation.geography);
      console.log('[POPEXIST]   - geography.id:', localPopulation.geography?.id);
      console.log('[POPEXIST]   - isGeographicAssociationReady:', isReady);
      console.log('[POPEXIST] canProceed:', isReady);
      return isReady;
    }

    console.log('[POPEXIST] canProceed: false (neither household nor geographic)');
    return false;
  }

  function handleHouseholdPopulationSelect(association: UserHouseholdMetadataWithAssociation) {
    console.log('[POPEXIST] ========== handleHouseholdPopulationSelect ==========');
    console.log('[POPEXIST] Association received:', association);
    console.log('[POPEXIST]   - association.household:', association?.household);
    console.log('[POPEXIST]   - association.household?.id:', association?.household?.id);
    console.log('[POPEXIST]   - association.household?.household_json:', association?.household?.household_json);
    console.log('[POPEXIST]   - association.isLoading:', association?.isLoading);

    if (!association) {
      console.log('[POPEXIST] No association provided, returning');
      return;
    }

    setLocalPopulation(association);
    console.log('[POPEXIST] Set localPopulation to:', association);
  }

  function handleGeographicPopulationSelect(association: UserGeographicMetadataWithAssociation) {
    console.log('[POPEXIST] ========== handleGeographicPopulationSelect ==========');
    console.log('[POPEXIST] Association received:', association);
    console.log('[POPEXIST]   - association.geography:', association?.geography);
    console.log('[POPEXIST]   - association.geography?.id:', association?.geography?.id);
    console.log('[POPEXIST]   - association.isLoading:', association?.isLoading);

    if (!association) {
      console.log('[POPEXIST] No association provided, returning');
      return;
    }

    setLocalPopulation(association);
    console.log('[POPEXIST] Set localPopulation to:', association);
  }

  function handleSubmit() {
    console.log('[POPEXIST] ========== handleSubmit ==========');
    console.log('[POPEXIST] localPopulation:', localPopulation);

    if (!localPopulation) {
      console.log('[POPEXIST] No localPopulation, returning');
      return;
    }

    if (isHouseholdMetadataWithAssociation(localPopulation)) {
      console.log('[POPEXIST] Type: Household, calling handleSubmitHouseholdPopulation');
      handleSubmitHouseholdPopulation();
    } else if (isGeographicMetadataWithAssociation(localPopulation)) {
      console.log('[POPEXIST] Type: Geographic, calling handleSubmitGeographicPopulation');
      handleSubmitGeographicPopulation();
    } else {
      console.log('[POPEXIST] Unknown type, not submitting');
    }
  }

  function handleSubmitHouseholdPopulation() {
    console.log('[POPEXIST] ========== handleSubmitHouseholdPopulation ==========');
    console.log('[POPEXIST] localPopulation:', localPopulation);
    console.log('[POPEXIST] Type check:', isHouseholdMetadataWithAssociation(localPopulation));

    if (!localPopulation || !isHouseholdMetadataWithAssociation(localPopulation)) {
      console.log('[POPEXIST] Type guard failed, returning');
      return;
    }

    console.log('[POPEXIST] Association:', localPopulation.association);
    console.log('[POPEXIST] Association.countryId:', localPopulation.association?.countryId);
    console.log('[POPEXIST] Association.householdId:', localPopulation.association?.householdId);
    console.log('[POPEXIST] Association.label:', localPopulation.association?.label);
    console.log('[POPEXIST] Household metadata:', localPopulation.household);
    console.log('[POPEXIST] Household metadata type:', typeof localPopulation.household);
    console.log('[POPEXIST] Household metadata is null/undefined:', localPopulation.household == null);

    if (localPopulation.household) {
      console.log('[POPEXIST] Household.id:', localPopulation.household.id);
      console.log('[POPEXIST] Household.household_json:', localPopulation.household.household_json);
      console.log('[POPEXIST] Household.household_json type:', typeof localPopulation.household.household_json);
    } else {
      console.log('[POPEXIST] ⚠️ ERROR: Household metadata is undefined!');
      return;
    }

    console.log('[POPEXIST] About to call HouseholdAdapter.fromMetadata...');
    const householdToSet = HouseholdAdapter.fromMetadata(localPopulation.household);
    console.log('[POPEXIST] ✓ Successfully converted household:', householdToSet);
    console.log('[POPEXIST] Household ID:', householdToSet.id);

    const label = localPopulation.association?.label || '';
    const householdId = householdToSet.id!;

    console.log('[POPEXIST] Calling onSelectHousehold with:');
    console.log('[POPEXIST]   - householdId:', householdId);
    console.log('[POPEXIST]   - label:', label);

    // Call parent callback instead of dispatching to Redux
    onSelectHousehold(householdId, householdToSet, label);
    console.log('[POPEXIST] ========== handleSubmitHouseholdPopulation END ==========');
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
  console.log('[POPEXIST] ========== BUILDING HOUSEHOLD CARD ITEMS ==========');
  console.log('[POPEXIST] allPopulations:', allPopulations);
  console.log('[POPEXIST] allPopulations.length:', allPopulations.length);

  const householdCardItems = allPopulations
    .filter((association) => isHouseholdMetadataWithAssociation(association))
    .map((association, index) => {
      console.log(`[POPEXIST] Building card for household ${index}:`, association);
      console.log(`[POPEXIST]   - association.household:`, association.household);
      console.log(`[POPEXIST]   - association.household?.id:`, association.household?.id);
      console.log(`[POPEXIST]   - association.household?.household_json:`, association.household?.household_json);
      console.log(`[POPEXIST]   - association.isLoading:`, association.isLoading);
      console.log(`[POPEXIST]   - isHouseholdAssociationReady:`, isHouseholdAssociationReady(association));

      const isReady = isHouseholdAssociationReady(association);
      let title = '';
      let subtitle = '';

      if (!isReady) {
        // NOT LOADED YET - show loading indicator for testing
        title = '⏳ Loading...';
        subtitle = 'Household data not loaded yet';
        console.log(`[POPEXIST]   - ⚠️ Household ${index} NOT READY`);
      } else if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Population #${association.household!.id}`;
        console.log(`[POPEXIST]   - ✓ Household ${index} READY with label`);
      } else {
        title = `Population #${association.household!.id}`;
        subtitle = '';
        console.log(`[POPEXIST]   - ✓ Household ${index} READY without label`);
      }

      return {
        title,
        subtitle,
        onClick: () => handleHouseholdPopulationSelect(association!),
        isSelected:
          isHouseholdMetadataWithAssociation(localPopulation) &&
          localPopulation.household?.id === association.household?.id,
      };
    });

  console.log('[POPEXIST] Built householdCardItems.length:', householdCardItems.length);

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
