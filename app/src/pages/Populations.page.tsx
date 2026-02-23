import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@/components/ui';
import { useDisclosure } from '@/hooks/useDisclosure';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  useGeographicAssociationsByUser,
  useUpdateGeographicAssociation,
} from '@/hooks/useUserGeographic';
import { useUpdateHouseholdAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import { countryIds } from '@/libs/countries';
import { RootState } from '@/store';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { formatDate } from '@/utils/dateUtils';
import { getCountryLabel } from '@/utils/geographyUtils';
import { extractRegionDisplayValue } from '@/utils/regionStrategies';

export default function PopulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything
  const metadata = useSelector((state: RootState) => state.metadata);
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
  } = useGeographicAssociationsByUser(userId);

  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    navigate(`/${countryId}/households/create`);
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  const handleOpenRename = (recordId: string) => {
    // Determine type by looking up in the original data
    // Households use their association.id, geographies use geographyId
    const household = householdData?.find(
      (item) => (item.association.id || item.association.householdId.toString()) === recordId
    );
    const geography = geographicData?.find((item) => item.geographyId === recordId);

    if (!household && !geography) {
      return;
    }

    const type: 'household' | 'geography' = household ? 'household' : 'geography';
    const userIdValue = household ? household.association.userId : geography!.userId;

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
  const renamingGeography = geographicData?.find((item) => item.id === renamingId);

  const currentLabel =
    renamingType === 'household'
      ? renamingHousehold?.association.label ||
        `Household #${renamingHousehold?.association.householdId}`
      : renamingGeography?.label || '';

  // Helper function to get geographic scope details
  const getGeographicDetails = (geography: UserGeographyPopulation) => {
    const details = [];

    // Add geography scope
    const typeLabel = geography.scope === 'national' ? 'National' : 'Subnational';
    details.push({ text: typeLabel, badge: '' });

    // Add region if subnational
    if (geography.scope === 'subnational' && geography.geographyId) {
      let regionLabel = geography.geographyId;
      const fullRegionName = geography.geographyId;
      if (metadata.economyOptions?.region) {
        const region = metadata.economyOptions.region.find((r) => r.name === geography.geographyId);

        if (region) {
          regionLabel = region.label;
        } else {
          const fallbackRegion = metadata.economyOptions.region.find(
            (r) =>
              r.name === `state/${geography.geographyId}` ||
              r.name === `constituency/${geography.geographyId}` ||
              r.name === `country/${geography.geographyId}`
          );
          if (fallbackRegion) {
            regionLabel = fallbackRegion.label;
          }
        }
      }

      if (regionLabel === geography.geographyId) {
        regionLabel = extractRegionDisplayValue(geography.geographyId);
      }

      let regionTypeLabel = 'Region';
      if (geography.countryId === 'us') {
        regionTypeLabel = 'State';
      } else if (geography.countryId === 'uk') {
        if (fullRegionName.startsWith('country/')) {
          regionTypeLabel = 'Country';
        } else if (fullRegionName.startsWith('constituency/')) {
          regionTypeLabel = 'Constituency';
        }
      }

      if (geography.countryId === 'uk' && fullRegionName.startsWith('constituency/')) {
        const countryLabel = getCountryLabel(geography.countryId);
        details.push({ text: countryLabel, badge: '' });
      }

      details.push({ text: `${regionTypeLabel}: ${regionLabel}`, badge: '' });
    } else {
      const countryLabel = getCountryLabel(geography.countryId);
      details.push({ text: countryLabel, badge: '' });
    }

    return details;
  };

  // Helper function to get household configuration details
  const getHouseholdDetails = (household: any) => {
    const peopleCount = Object.keys(household?.household_json?.people || {}).length;
    const familiesCount = Object.keys(household?.household_json?.families || {}).length;
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
      const detailsItems = getGeographicDetails(association);

      return {
        id: association.geographyId,
        type: 'geography',
        userId: association.userId,
        geographyId: association.geographyId,
        populationName: {
          text: association.label,
        } as TextValue,
        dateCreated: {
          text: association.createdAt
            ? formatDate(
                association.createdAt,
                'short-month-day-year',
                association?.countryId as (typeof countryIds)[number],
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
          enableSelection
          isSelected={isSelected}
          onSelectionChange={handleSelectionChange}
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
