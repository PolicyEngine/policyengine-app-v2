import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateSimulationAssociation } from '@/hooks/useUserSimulationAssociations';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { formatDate } from '@/utils/dateUtils';

export default function SimulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rename modal state
  const [renamingSimulationId, setRenamingSimulationId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Rename mutation hook
  const updateAssociation = useUpdateSimulationAssociation();

  const handleBuildSimulation = () => {
    navigate(`/${countryId}/simulations/create`);
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  const handleOpenRename = (userSimulationId: string) => {
    setRenamingSimulationId(userSimulationId);
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingSimulationId(null);
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingSimulationId) {
      return;
    }

    try {
      await updateAssociation.mutateAsync({
        userSimulationId: renamingSimulationId,
        updates: { label: newLabel },
      });
      handleCloseRename();
    } catch (error) {
      console.error('[SimulationsPage] Failed to rename simulation:', error);
    }
  };

  // Find the simulation being renamed for current label
  const renamingSimulation = data?.find((item) => item.userSimulation.id === renamingSimulationId);
  const currentLabel =
    renamingSimulation?.userSimulation.label ||
    `Simulation #${renamingSimulation?.userSimulation.simulationId}`;

  // Define column configurations for simulations
  const simulationColumns: ColumnConfig[] = [
    {
      key: 'simulation',
      header: 'Simulation',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date Created',
      type: 'text',
    },
    {
      key: 'policy',
      header: 'Policy',
      type: 'text',
    },
    {
      key: 'population',
      header: 'Population',
      type: 'text',
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

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    data?.map((item) => ({
      id: item.userSimulation.id?.toString() || item.userSimulation.simulationId.toString(), // Use user association ID, not base simulation ID
      simulation: {
        text: item.userSimulation.label || `Simulation #${item.userSimulation.simulationId}`,
      } as TextValue,
      dateCreated: {
        text: item.userSimulation.createdAt
          ? formatDate(
              item.userSimulation.createdAt,
              'short-month-day-year',
              item.userSimulation.countryId,
              true
            )
          : '',
      } as TextValue,
      policy: {
        text: item.userPolicy?.label || (item.policy ? `Policy #${item.policy.id}` : 'No policy'),
      } as TextValue,
      population: {
        text:
          item.userHousehold?.label ||
          item.geography?.name ||
          (item.household ? `Household #${item.household.id}` : 'No population'),
      } as TextValue,
    })) || [];

  return (
    <>
    
    <Stack gap="md">

      <IngredientReadView
          ingredient="simulation"
          title="Your saved simulations"
          subtitle="Build and save tax policy scenarios for quick access when creating impact reports. Pre-configured simulations accelerate report generation by up to X%"
          onBuild={handleBuildSimulation}
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={transformedData}
          columns={simulationColumns}
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
        isLoading={updateAssociation.isPending}
        ingredientType="simulation"
      />
    </>
  );
}
