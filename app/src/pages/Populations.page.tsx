import { useState } from 'react';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { Stack } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useUpdateGeographicAssociation, useUserGeographics } from '@/hooks/useUserGeographic';
import { useUpdateHouseholdAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import { countryIds } from '@/libs/countries';
import { getCountryDisplayName, getGeographyRegionTypeLabel } from '@/models/geography';
import { Household } from '@/models/Household';
import { Geography } from '@/types/ingredients/Geography';
import { formatDate } from '@/utils/dateUtils';

export default function PopulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything
  const countryId = useCurrentCountry();

  // Fetch household associations
  const {
    data: householdData,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
    error: householdError,
  } = useUserHouseholds(userId);

  // Fetch geographic associations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useUserGeographics(userId);

  const nav = useAppNavigate();

  const [searchValue, setSearchValue] = useState('');

  // Rename modal state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingType, setRenamingType] = useState<'household' | 'geography' | null>(null);
  const [renamingUserId, setRenamingUserId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Rename mutation hooks
  const updateHouseholdAssociation = useUpdateHouseholdAssociation();
  const updateGeographicAssociation = useUpdateGeographicAssociation();

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  const handleBuildPopulation = () => {
    nav.push(`/${countryId}/households/create`);
  };

  const handleOpenRename = (recordId: string) => {
    // Determine type by looking up in the original data
    // Households use their association.id, geographies use geographyId
    const household = householdData?.find(
      (item) => (item.association.id || item.association.householdId.toString()) === recordId
    );
    const geography = geographicData?.find((item) => item.association.geographyId === recordId);

    if (!household && !geography) {
      return;
    }

    const type: 'household' | 'geography' = household ? 'household' : 'geography';
    const userIdValue = household ? household.association.userId : geography!.association.userId;

    setRenamingId(recordId);
    setRenamingType(type);
    setRenamingUserId(userIdValue);
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingId(null);
    setRenamingType(null);
    setRenamingUserId(null);
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingId || !renamingType || !renamingUserId) {
      return;
    }

    try {
      if (renamingType === 'household') {
        await updateHouseholdAssociation.mutateAsync({
          userHouseholdId: renamingId,
          updates: { label: newLabel },
        });
      } else {
        // For geographies, renamingId is the geographyId
        await updateGeographicAssociation.mutateAsync({
          userId: renamingUserId,
          geographyId: renamingId,
          updates: { label: newLabel },
        });
      }
      handleCloseRename();
    } catch (error) {
      console.error(`[PopulationsPage] Failed to rename ${renamingType}:`, error);
    }
  };

  // Find the item being renamed for current label
  const renamingHousehold = householdData?.find((item) => item.association.id === renamingId);
  const renamingGeography = geographicData?.find(
    (item) => item.association.geographyId === renamingId
  );

  const currentLabel =
    renamingType === 'household'
      ? renamingHousehold?.association.label ||
        `Household #${renamingHousehold?.association.householdId}`
      : renamingGeography?.association.label || '';

  // Helper function to get geographic scope details
  const getGeographicDetails = (geography: Geography) => {
    const details = [];

    // Add geography scope
    const typeLabel = geography.scope === 'national' ? 'National' : 'Subnational';
    details.push({ text: typeLabel, badge: '' });

    // Add region if subnational
    if (geography.scope === 'subnational' && geography.geographyId) {
      if (geography.countryId === 'uk' && geography.geographyId.startsWith('constituency/')) {
        details.push({ text: getCountryDisplayName(geography.countryId), badge: '' });
      }

      details.push({
        text: `${getGeographyRegionTypeLabel(geography)}: ${geography.name ?? geography.geographyId}`,
        badge: '',
      });
    } else {
      details.push({ text: getCountryDisplayName(geography.countryId), badge: '' });
    }

    return details;
  };

  // Helper function to get household configuration details
  const getHouseholdDetails = (household: Household | undefined) => {
    const peopleCount = household?.personCount ?? 0;
    const families =
      (household?.householdData?.families as Record<string, unknown> | undefined) ?? {};
    const familiesCount = Object.keys(families).length;
    return [
      { text: `${peopleCount} person${peopleCount !== 1 ? 's' : ''}`, badge: '' },
      { text: `${familiesCount} household${familiesCount !== 1 ? 's' : ''}`, badge: '' },
    ];
  };

  // Define column configurations for populations
  const populationColumns: ColumnConfig[] = [
    {
      key: 'populationName',
      header: 'Household name',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'details',
      header: 'Details',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'actions',
      header: '',
      type: 'menu',
      actions: [{ label: 'Rename', action: 'rename' }],
      onAction: (action: string, recordId: string) => {
        if (action === 'rename') {
          handleOpenRename(recordId);
        }
      },
    },
  ];

  // Transform household data
  const householdRecords: IngredientRecord[] =
    householdData?.map((item) => {
      const detailsItems = getHouseholdDetails(item.household);

      return {
        id: item.association.id || item.association.householdId.toString(),
        type: 'household',
        userId: item.association.userId,
        populationName: {
          text: item.association.label || `Household #${item.association.householdId}`,
        } as TextValue,
        dateCreated: {
          text: item.association.createdAt
            ? formatDate(
                item.association.createdAt,
                'short-month-day-year',
                item.association.countryId,
                true
              )
            : '',
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
      };
    }) || [];

  // Transform geographic data
  const geographicRecords: IngredientRecord[] =
    geographicData?.map((association) => {
      const detailsItems = getGeographicDetails(association.geography!);

      return {
        id: association.association.geographyId,
        type: 'geography',
        userId: association.association.userId,
        geographyId: association.geography?.geographyId ?? association.association.geographyId,
        populationName: {
          text: association.association.label || association.geography?.name || '',
        } as TextValue,
        dateCreated: {
          text: association.association.createdAt
            ? formatDate(
                association.association.createdAt,
                'short-month-day-year',
                association.association.countryId as (typeof countryIds)[number],
                true
              )
            : '',
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
      };
    }) || [];

  // Combine both data sources
  const transformedData: IngredientRecord[] = [...householdRecords, ...geographicRecords];

  return (
    <>
      <Stack gap="md">
        <IngredientReadView
          ingredient="household"
          title="Your saved households"
          subtitle="Configure one or a collection of households to use in your simulation configurations."
          buttonLabel="New household(s)"
          onBuild={handleBuildPopulation}
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={transformedData}
          columns={populationColumns}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </Stack>

      <RenameIngredientModal
        opened={renameOpened}
        onClose={handleCloseRename}
        currentLabel={currentLabel}
        onRename={handleRename}
        isLoading={
          renamingType === 'household'
            ? updateHouseholdAssociation.isPending
            : updateGeographicAssociation.isPending
        }
        ingredientType={renamingType || 'household'}
      />
    </>
  );
}
