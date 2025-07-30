import { useDispatch } from 'react-redux';
import IngredientReadView from '@/components/IngredientReadView';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { usePolicy } from '@/hooks/usePolicy';
import { setFlow } from '@/reducers/flowReducer';
import { usePolicyAssociationsByUser, useUserPolicies } from '@/hooks/useUserPolicy';

// import { FlowComponentProps } from '@/types/flow';

// export default function PoliciesPage({ onNavigate }: FlowComponentProps) {
export default function PoliciesPage() {
  const userId = "anonymous"; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  // TODO: All we're doing right now is fetching user-policy associations;
  // we should also fetch policies and display them in the view
  // TODO: Fix isError
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const dispatch = useDispatch();

  console.log('PoliciesPage data:', data);

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
