import { useDispatch } from 'react-redux';
import { useState } from 'react';
import IngredientReadView, { 
  ColumnConfig, 
  IngredientRecord,
  TextValue,
  LinkValue,
  AvatarTextValue,
  BulletsValue
} from '@/components/IngredientReadView';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useUserSimulations } from '@/hooks/useUserSimulation';
import { setFlow } from '@/reducers/flowReducer';

export default function SimulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const dispatch = useDispatch();
  
  const [searchValue, setSearchValue] = useState("");
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

  // Define column configurations for simulations
  const simulationColumns: ColumnConfig[] = [
    {
      key: 'simulation',
      header: 'Simulation',
      type: 'avatar-text',
      avatarKey: 'avatar',
      textKey: 'text',
      linkKey: 'link',
      avatarColor: 'primary',
      avatarSize: 32
    },
    {
      key: 'dateCreated',
      header: 'Date Created',
      type: 'text',
      size: 'sm',
      color: '#6B7280' // colors.text.secondary
    },
    {
      key: 'policy',
      header: 'Policy',
      type: 'text',
      size: 'sm',
      weight: 'medium'
    },
    {
      key: 'population',
      header: 'Population',
      type: 'link',
      size: 'sm',
      color: '#0284C7' // colors.blue[600]
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
      avatar: item.association.simulationId.slice(-1),
      text: 'Simulation',
      link: `#${item.association.simulationId}`
    } as AvatarTextValue,
    dateCreated: {
      text: 'Just now' // TODO: Format actual date from item data
    } as TextValue,
    policy: {
      text: `Policy Name\n7 Provisions` // TODO: Get actual policy data
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
    />
  );
}
