import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '@mantine/core';
import moment from 'moment';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import PolicyCreationFlow from '@/components/policy/PolicyCreationFlow';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { usePolicies } from '@/hooks/usePolicies';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { usersAPI } from '@/api/v2/users';
import { policiesAPI } from '@/api/v2/policies';
import { notifications } from '@mantine/notifications';
import { MOCK_USER_ID } from '@/constants';

export default function PoliciesPage() {
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const { data: policies, isLoading, error } = usePolicies();
  const isError = !!error;

  console.log('[Policies.page] Query results:', { policies, isLoading, error });

  const [activeTab, setActiveTab] = useState<string | null>('my-policies');
  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteMutation.mutate(id));
  };
  const [modalOpened, setModalOpened] = useState(false);
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [policyToRename, setPolicyToRename] = useState<{ id: string; name: string } | null>(null);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch user policy associations
  const { data: userPolicies = [], isLoading: userPoliciesLoading } = useQuery({
    queryKey: ['userPolicies', userId],
    queryFn: () => userPoliciesAPI.list(userId),
  });

  console.log('[Policies.page] User policies:', { userPolicies, userPoliciesLoading });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.listUsers({ limit: 1000 }),
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (policyId: string) => {
      return policiesAPI.delete(policyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      notifications.show({
        title: 'Policy deleted',
        message: 'The policy has been deleted successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete policy',
        color: 'red',
      });
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
      key: 'createdBy',
      header: 'Created by',
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
  ];

  // Filter policies based on active tab
  // "My Policies" = policies where user has an association
  // "Explore Policies" = ALL policies (user can explore and bookmark any policy)
  const userPolicyIds = new Set(userPolicies.map(up => up.policy_id));

  console.log('Policies debug:', {
    totalPolicies: policies?.length,
    userPolicies: userPolicies.length,
    userPolicyIds: Array.from(userPolicyIds),
    activeTab
  });

  const myPolicies = policies?.filter(p => userPolicyIds.has(p.id)) || [];
  const explorePolicies = policies || []; // Show ALL policies in explore tab

  console.log('Filtered:', { myPolicies: myPolicies.length, explorePolicies: explorePolicies.length });

  // Transform the data to match the new structure
  const transformData = (policyList: typeof policies) =>
    policyList?.map((policy) => {
      const userPolicy = userPolicies.find(up => up.policy_id === policy.id);
      const displayName = userPolicy?.custom_name || policy.name || `Policy #${policy.id}`;

      // Only show creator info if the current user is NOT the creator
      const isCreator = userPolicy?.is_creator || false;
      const creator = userPolicy && !isCreator ? users.find(u => u.id === userPolicy.user_id) : null;
      const creatorName = creator ? usersAPI.getDisplayName(creator) : '';

      return {
        id: policy.id,
        policyName: {
          text: displayName,
        } as TextValue,
        createdBy: {
          text: creatorName ? `by ${creatorName}` : '',
        } as TextValue,
        dateCreated: {
          text: moment(policy.created_at).fromNow(),
        } as TextValue,
        provisions: {
          text: policy.description || 'No description',
        } as TextValue,
      };
    }) || [];

  const transformedData = activeTab === 'my-policies'
    ? transformData(myPolicies)
    : transformData(explorePolicies);

  console.log('[Policies.page] Final transformed data:', { count: transformedData.length, data: transformedData });

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
        title="Policies"
        subtitle="Create a policy reform or find and save existing policies to use in your simulation configurations."
        onBuild={handleBuildPolicy}
        onDelete={handleDeleteSelected}
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
        selectedCount={selectedIds.length}
        onRowClick={(id) => navigate(`/policy/${id}`)}
        headerContent={
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="my-policies">My policies</Tabs.Tab>
              <Tabs.Tab value="explore-policies">Explore policies</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        }
      />
    </>
  );
}
