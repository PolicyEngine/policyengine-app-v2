import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  BulletsValue,
  ColumnConfig,
  IngredientRecord,
  LinkValue,
  TextValue,
} from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { setFlow } from '@/reducers/flowReducer';

export default function SimulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const dispatch = useDispatch();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBuildSimulation = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleMenuAction = (action: string, recordId: string) => {
    switch (action) {
      case 'add-to-report':
        // TODO: Implement add to report functionality
        console.log('Add to report:', recordId);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        console.log('Delete simulation:', recordId);
        break;
      default:
        console.log('Unknown action:', action);
    }
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
      type: 'link',
    },
    {
      key: 'connected',
      header: 'Connected',
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
      type: 'split-menu',
      actions: [
        { label: 'Add to Report', action: 'add-to-report' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ],
      onAction: handleMenuAction,
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
          ? new Date(item.userSimulation.createdAt).toLocaleDateString()
          : 'Just now',
      } as TextValue,
      policy: {
        text: item.userPolicy?.label || (item.policy ? `Policy #${item.policy.id}` : 'No policy'),
      } as TextValue,
      population: {
        text:
          item.household?.label ||
          (item.simulation?.populationId
            ? `Household #${item.simulation.populationId}`
            : 'No household'),
        url: item.household?.id ? `#household-${item.household.id}` : '#',
      } as LinkValue,
      connected: {
        items: [
          {
            text: 'No reports yet', // TODO: Connect to actual reports
            badge: 0,
          },
        ],
      } as BulletsValue,
    })) || [];

  return (
    <IngredientReadView
      ingredient="simulation"
      title="Simulations"
      subtitle="Build and save tax policy scenarios for quick access when creating impact reports. Pre-configured simulations accelerate report generation by up to X%"
      onBuild={handleBuildSimulation}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={simulationColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onMoreFilters={handleMoreFilters}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
