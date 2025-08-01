import { useDispatch } from 'react-redux';
import IngredientReadView from '@/components/IngredientReadView';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useUserSimulations } from '@/hooks/useUserSimulation';
import { setFlow } from '@/reducers/flowReducer';

export default function SimulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const dispatch = useDispatch();

  const handleNavigateToCreate = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const columns = [
    { key: 'id', header: 'ID' } as const,
    { key: 'population_id', header: 'Population' } as const,
    { key: 'policy_id', header: 'Policy' } as const,
    { key: 'country_id', header: 'Country' } as const,
    { key: 'api_version', header: 'API Version' } as const,
  ];

  const tableData =
    data?.map((item) => ({
      id: item.id,
      population_id: item.population_id || 'Unknown',
      policy_id: item.policy_id || 'Unknown',
      country_id: item.country_id || 'Unknown',
      api_version: item.api_version || 'Unknown',
    })) || [];

  return (
    <IngredientReadView
      title="Simulations"
      onCreate={handleNavigateToCreate}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={tableData || []}
      columns={columns}
    />
  );
}
