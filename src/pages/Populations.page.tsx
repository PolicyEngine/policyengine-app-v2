import { useDispatch } from 'react-redux';
import IngredientReadView from '@/components/IngredientReadView';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { setFlow } from '@/reducers/flowReducer';

export default function PopulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  // TODO: All we're doing right now is fetching user-household associations;
  // we should also fetch policies and display them in the view
  // TODO: Fix isError
  const { data, isLoading, isError, error } = useUserHouseholds(userId);
  const dispatch = useDispatch();

  const handleNavigateToCreate = () => {
    dispatch(setFlow(PopulationCreationFlow));
    // onNavigate('next')
  };

  const columns = [
    { key: 'id', header: 'ID' } as const,
    { key: 'label', header: 'Label' } as const,
    { key: 'country_id', header: 'Country' } as const,
    { key: 'api_version', header: 'API Version' } as const,
  ];

  const tableData =
    data?.map((item) => ({
      id: item.association.householdId,
      label: item.household?.label || 'Unknown',
      country_id: item.household?.country_id || 'Unknown',
      api_version: item.household?.api_version || 'Unknown',
    })) || [];

  return (
    <IngredientReadView
      title="Households"
      onCreate={handleNavigateToCreate}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={tableData || []}
      columns={columns}
    />
  );
}
