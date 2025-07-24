import { useDispatch } from 'react-redux';
import IngredientReadView from '@/components/IngredientReadView';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { usePolicy } from '@/hooks/usePolicy';
import { setFlow } from '@/reducers/flowReducer';

// import { FlowComponentProps } from '@/types/flow';

// export default function PoliciesPage({ onNavigate }: FlowComponentProps) {
export default function PoliciesPage() {
  const { data, isLoading, isError, error } = usePolicy();
  const dispatch = useDispatch();

  const handleNavigateToCreate = () => {
    dispatch(setFlow(PolicyCreationFlow));
    // onNavigate('next')
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'label', header: 'Label' },
    { key: 'country_id', header: 'Country' },
    { key: 'api_version', header: 'API Version' },
  ];

  return (
    <IngredientReadView
      title="Policies"
      onCreate={handleNavigateToCreate}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data || []}
      columns={columns}
    />
  );
}
