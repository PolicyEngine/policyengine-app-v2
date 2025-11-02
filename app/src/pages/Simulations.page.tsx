import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { formatDate } from '@/utils/dateUtils';

export default function SimulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBuildSimulation = () => {
    navigate(`/${countryId}/simulations/create`);
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

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
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    data?.map((item) => ({
      id: item.userSimulation.simulationId.toString(),
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
  );
}
