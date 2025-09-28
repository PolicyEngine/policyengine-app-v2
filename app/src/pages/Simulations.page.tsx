import { useState } from 'react';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import {
  ColumnConfig,
  IngredientRecord,
  TextValue,
} from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { useSimulationsWithPolicies } from '@/hooks/useSimulations';
import { setFlow } from '@/reducers/flowReducer';

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
      key: 'simulationId',
      header: 'Simulation ID',
      type: 'text',
    },
    {
      key: 'description',
      header: 'Description',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'text',
    },
    {
      key: 'dataset',
      header: 'Dataset',
      type: 'text',
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
      simulationId: {
        text: sim.id, // UUID display
      } as TextValue,
      description: {
        text: sim.name || 'No description',
      } as TextValue,
      dateCreated: {
        text: moment(sim.created_at).fromNow(),
      } as TextValue,
      status: {
        text: sim.has_result ? 'Ready' : 'Not ready',
      } as TextValue,
      dataset: {
        text: sim.dataset_id ? `Dataset ${sim.dataset_id}` : 'Default dataset',
      } as TextValue,
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
