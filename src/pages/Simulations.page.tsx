import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { Box, Text, Anchor, Badge, Group, Stack } from '@mantine/core';
import IngredientReadView from '@/components/IngredientReadView';
import { 
  ColumnConfig, 
  IngredientRecord,
  TextValue,
  LinkValue,
  BulletsValue
} from '@/components/columns';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useUserSimulations } from '@/hooks/useUserSimulation';
import { setFlow } from '@/reducers/flowReducer';
import { colors, spacing, typography } from '@/designTokens';

export default function SimulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const dispatch = useDispatch();
  
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState([
    { label: "Most Recent", value: "most-recent" },
    { label: "Type", value: "type" }
  ]);

  const handleNavigateToCreate = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const handleBuildSimulation = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const handleFilterRemove = (filterValue: string) => {
    setFilters(prev => prev.filter(f => f.value !== filterValue));
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
    setSelectedIds(prev => 
      selected 
        ? [...prev, recordId]
        : prev.filter(id => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  // Define column configurations for simulations
  const simulationColumns: ColumnConfig[] = [
    {
      key: 'simulation',
      header: 'Simulation',
      type: 'text'
    },
    {
      key: 'dateCreated',
      header: 'Date Created',
      type: 'text'
    },
    {
      key: 'policy',
      header: 'Policy',
      type: 'text'
    },
    {
      key: 'population',
      header: 'Population',
      type: 'link'
    },
    {
      key: 'connected',
      header: 'Connected',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge'
        }
      ]
    },
    {
      key: 'actions',
      header: '',
      type: 'menu',
      actions: [
        { label: 'Add to Report', action: 'add-to-report' },
        { label: 'Delete', action: 'delete', color: 'red' }
      ],
      onAction: handleMenuAction
    }
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] = data?.map((item) => ({
    id: item.association.simulationId,
    simulation: {
      text: `Simulation #${item.association.simulationId}`
    } as TextValue,
    dateCreated: {
      text: 'Just now' // TODO: Format actual date from item data
    } as TextValue,
    policy: {
      text: 'Policy Name\n7 Provisions' // TODO: Get actual policy data
    } as TextValue,
    population: {
      text: item.simulation?.population_id || "Unknown",
      url: `#${item.simulation?.population_id || "unknown"}`
    } as LinkValue,
    connected: {
      items: [
        {
          text: 'Report Title',
          badge: 1
        }
      ]
    } as BulletsValue,
  })) || [];

  return (
    <IngredientReadView
      ingredient="simulation"
      title="Simulations"
      subtitle="Build and save tax policy scenarios for quick access when creating impact reports. Pre-configured simulations accelerate report generation by up to X%"
      onCreate={handleNavigateToCreate}
      onBuild={handleBuildSimulation}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={simulationColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onFilterRemove={handleFilterRemove}
      onMoreFilters={handleMoreFilters}
      enableSelection={true}
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
