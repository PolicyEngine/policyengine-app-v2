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

  const handleNavigateToCreate = () => {
    dispatch(setFlow(PolicyCreationFlow));
    // onNavigate('next')
  };

  const columns = [
    { key: 'id', header: 'ID' } as const,
    { key: 'label', header: 'Label' } as const,
    { key: 'country_id', header: 'Country' } as const,
    { key: 'api_version', header: 'API Version' } as const,
  ];

  const tableData = data?.map(item => ({
    id: item.association.policyId,
    label: item.policy?.label || 'Unknown',
    country_id: item.policy?.country_id || 'Unknown',
    api_version: item.policy?.api_version || 'Unknown',
  })) || [];

  return (
    <IngredientReadView
      title="Policies"
      onCreate={handleNavigateToCreate}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={tableData || []}
      columns={columns}
    />
  );
}
