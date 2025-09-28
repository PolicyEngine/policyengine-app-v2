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
import { MOCK_USER_ID } from '@/constants';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { useSimulationsWithPolicies } from '@/hooks/useSimulations';
import { countryIds } from '@/libs/countries';
import { setFlow } from '@/reducers/flowReducer';
import { formatDate } from '@/utils/dateUtils';

export default function SimulationsPage() {
  const { data: simulations, isLoading, error } = useSimulationsWithPolicies();
  const dispatch = useDispatch();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();

  const handleBuildSimulation = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'simulation',
    // TODO: Implement actual action handlers
  });

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
      actions: getDefaultActions(),
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    simulations?.map((sim) => ({
      id: sim.id,
      simulation: {
        text: sim.name || `Simulation #${sim.id}`,
      } as TextValue,
      dateCreated: {
        text: formatDate(
          sim.created_at,
          'short-month-day-year',
          'us' as (typeof countryIds)[number],
          true
        ),
      } as TextValue,
      policy: {
        text: sim.policy?.name || (sim.policy_id ? `Policy ${sim.policy_id}` : 'No policy'),
      } as TextValue,
      population: {
        text: sim.dataset_id ? `Dataset ${sim.dataset_id}` : 'Default population',
        url: '#',
      } as LinkValue,
      connected: {
        items: [
          {
            text: sim.status === 'completed' ? 'Results available' : `Status: ${sim.status}`,
            badge: sim.status === 'completed' ? '✓' : '',
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
