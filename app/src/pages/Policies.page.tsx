import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import PolicyCreationFlow from '@/components/policy/PolicyCreationFlow';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { usePolicies } from '@/hooks/usePolicies';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { MOCK_USER_ID } from '@/constants';

export default function PoliciesPage() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
  const queryClient = useQueryClient();
  const { data: policies, isLoading, error } = usePolicies();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const { handleSelectionChange, isSelected } = useIngredientSelection();
  const [modalOpened, setModalOpened] = useState(false);
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [policyToRename, setPolicyToRename] = useState<{ id: string; name: string } | null>(null);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch user policy associations
  const { data: userPolicies = [] } = useQuery({
    queryKey: ['userPolicies', userId],
    queryFn: () => userPoliciesAPI.list(userId),
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ policyId, name }: { policyId: string; name: string }) => {
      // Find existing user policy association
      const existing = userPolicies.find(up => up.policy_id === policyId);

      if (existing) {
        // Update existing
        return userPoliciesAPI.update(existing.id, { custom_name: name });
      } else {
        // Create new association
        return userPoliciesAPI.create({
          user_id: userId,
          policy_id: policyId,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPolicies', userId] });
      setRenameModalOpened(false);
      setPolicyToRename(null);
    },
  });

  const handleBuildPolicy = () => {
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleRenamePolicy = (name: string) => {
    if (policyToRename) {
      renameMutation.mutate({ policyId: policyToRename.id, name });
    }
  };

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'policy',
    onRename: (id: string) => {
      const policy = policies?.find(p => p.id === id);
      if (policy) {
        const userPolicy = userPolicies.find(up => up.policy_id === id);
        setPolicyToRename({
          id: policy.id,
          name: userPolicy?.custom_name || policy.name || `Policy #${policy.id}`,
        });
        setRenameModalOpened(true);
      }
    },
    onView: (id: string) => {
      navigate(`/policy/${id}`);
    },
  });

  // Define column configurations for policies
  const policyColumns: ColumnConfig[] = [
    {
      key: 'policyName',
      header: 'Policy name',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'provisions',
      header: 'Provisions',
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
    policies?.map((policy) => {
      const userPolicy = userPolicies.find(up => up.policy_id === policy.id);
      const displayName = userPolicy?.custom_name || policy.name || `Policy #${policy.id}`;

      return {
        id: policy.id,
        policyName: {
          text: displayName,
        } as TextValue,
        dateCreated: {
          text: moment(policy.created_at).fromNow(),
        } as TextValue,
        provisions: {
          text: policy.description || 'No description',
        } as TextValue,
      };
    }) || [];

  // Render the normal policies page with modals
  return (
    <>
      <PolicyCreationFlow
        opened={modalOpened}
        onClose={handleModalClose}
        onComplete={() => {
          // TODO: Navigate to next step or complete
          console.log('Policy creation complete');
        }}
      />
      <ReportRenameModal
        opened={renameModalOpened}
        onClose={() => {
          setRenameModalOpened(false);
          setPolicyToRename(null);
        }}
        onSubmit={handleRenamePolicy}
        currentName={policyToRename?.name || ''}
        isLoading={renameMutation.isPending}
      />
      <IngredientReadView
        ingredient="policy"
        title="Your policies"
        subtitle="Create a policy reform or find and save existing policies to use in your simulation configurations."
        onBuild={handleBuildPolicy}
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={transformedData}
        columns={policyColumns}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onMoreFilters={handleMoreFilters}
        enableSelection
        isSelected={isSelected}
        onSelectionChange={handleSelectionChange}
        onRowClick={(id) => navigate(`/${countryId}/policy/${id}`)}
      />
    </>
  );
}
