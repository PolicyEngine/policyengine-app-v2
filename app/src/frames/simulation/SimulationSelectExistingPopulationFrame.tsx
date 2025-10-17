import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text, Group, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { HouseholdAdapter } from '@/adapters';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';

const ITEMS_PER_PAGE = 5;
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
  const [currentPage, setCurrentPage] = useState(1);

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

    console.log('Local Population on Submit:', localPopulation);

    const householdToSet = HouseholdAdapter.fromAPI(localPopulation.household!);
    console.log('Setting household in population:', householdToSet);

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

    // Update with household data
    dispatch(
      setHouseholdAtPosition({
        position: currentPosition,
        household: householdToSet,
      })
    );
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
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
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

  // Filter and paginate household populations
  const filteredHouseholds = householdPopulations.filter((association) =>
    isHouseholdMetadataWithAssociation(association)
  );

  // Calculate pagination for combined populations
  const allPopulations = [...filteredHouseholds, ...geographicPopulations];
  const totalPages = Math.ceil(allPopulations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPopulations = allPopulations.slice(startIndex, endIndex);

  // Build card list items from paginated household populations
  const householdCardItems = paginatedPopulations
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

  // Build card list items from paginated geographic populations
  const geographicCardItems = paginatedPopulations
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

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700}>Your Populations</Text>
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, allPopulations.length)} of {allPopulations.length}
          </Text>
        </div>
        {totalPages > 1 && (
          <Group gap="xs">
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        )}
      </Group>
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
