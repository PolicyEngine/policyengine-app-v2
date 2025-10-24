import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import FlowContainer from '@/components/FlowContainer';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { clearFlow, setFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { formatDate } from '@/utils/dateUtils';

interface SimulationsPageProps {
  flowMode?: 'create';
}

export default function SimulationsPage({ flowMode }: SimulationsPageProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentFlow } = useSelector((state: RootState) => state.flow);

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize flow when in create mode
  useEffect(() => {
    if (flowMode === 'create') {
      dispatch(setFlow(SimulationCreationFlow));
    }

    // Cleanup on unmount
    return () => {
      if (currentFlow) {
        dispatch(clearFlow());
      }
    };
  }, [flowMode, dispatch]);

  // Listen for flow completion
  useEffect(() => {
    // If we're in create mode but flow was cleared (completed), navigate back
    if (flowMode === 'create' && !currentFlow) {
      navigate('/us/simulations');
    }
  }, [currentFlow, flowMode, navigate]);

  const handleBuildSimulation = () => {
    navigate('create');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
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

  // Render flow if in create mode
  if (flowMode === 'create') {
    return <FlowContainer />;
  }

  // Otherwise render normal list view
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
      onMoreFilters={handleMoreFilters}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
