import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateHouseholdAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import { formatDate } from '@/utils/dateUtils';

export default function PopulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything
  const countryId = useCurrentCountry();

  // Fetch household associations
  // Note: Geographic populations are no longer stored as user associations.
  // They are selected per-simulation and constructed from metadata.
  const { data: householdData, isLoading, isError, error } = useUserHouseholds(userId);

  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rename modal state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Rename mutation hooks
  const updateHouseholdAssociation = useUpdateHouseholdAssociation();

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
    // Find the household by its association id
    const household = householdData?.find(
      (item) => (item.association.id || item.association.householdId.toString()) === recordId
    );

    if (!household) {
      return;
    }

    setRenamingId(recordId);
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingId(null);
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingId) {
      return;
    }

    try {
      await updateHouseholdAssociation.mutateAsync({
        userHouseholdId: renamingId,
        updates: { label: newLabel },
      });
      handleCloseRename();
    } catch (err) {
      console.error(`[PopulationsPage] Failed to rename household:`, err);
    }
  };

  // Find the item being renamed for current label
  const renamingHousehold = householdData?.find((item) => item.association.id === renamingId);

  const currentLabel =
    renamingHousehold?.association.label ||
    `Household #${renamingHousehold?.association.householdId}`;

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
  // Note: Geographic populations are no longer stored as user associations.
  // They are selected per-simulation and don't appear in this list.
  const transformedData: IngredientRecord[] =
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

  return (
    <>
      <Stack gap="md">
        <IngredientReadView
          ingredient="household"
          title="Your saved households"
          subtitle="Configure one or more custom households to use in your simulation configurations."
          buttonLabel="New custom household"
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
        isLoading={updateHouseholdAssociation.isPending}
        ingredientType="household"
      />
    </>
  );
}
