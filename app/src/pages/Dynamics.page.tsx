import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '@mantine/core';
import moment from 'moment';
import { apiClient } from '@/api/apiClient';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { userDynamicsAPI } from '@/api/v2/userDynamics';
import { usersAPI } from '@/api/v2/users';
import { notifications } from '@mantine/notifications';
import { MOCK_USER_ID } from '@/constants';

interface Dynamic {
  id: string;
  name: string;
  description?: string;
  type?: string;
  parameters?: any;
  created_at: string;
  updated_at: string;
}

export default function DynamicsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string | null>('my-dynamics');
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [dynamicToRename, setDynamicToRename] = useState<{ id: string; name: string } | null>(null);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch dynamics from API
  const {
    data: dynamics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dynamics'],
    queryFn: () => apiClient.get<Dynamic[]>('/dynamics/', { params: { limit: 1000 } }),
    refetchInterval: 30000,
  });

  // Fetch user dynamics associations
  const { data: userDynamics = [] } = useQuery({
    queryKey: ['userDynamics', userId],
    queryFn: () => userDynamicsAPI.list(userId),
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.listUsers({ limit: 1000 }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/dynamics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamics'] });
      notifications.show({
        title: 'Dynamic deleted',
        message: 'The dynamic has been deleted successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete dynamic',
        color: 'red',
      });
    },
  });

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteMutation.mutate(id));
  };

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ dynamicId, name }: { dynamicId: string; name: string }) => {
      const existing = userDynamics.find(ud => ud.dynamic_id === dynamicId);

      if (existing) {
        return userDynamicsAPI.update(userId, dynamicId, { custom_name: name });
      } else {
        return userDynamicsAPI.create(userId, {
          dynamic_id: dynamicId,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDynamics', userId] });
      setRenameModalOpened(false);
      setDynamicToRename(null);
    },
  });

  const handleRenameDynamic = (name: string) => {
    if (dynamicToRename) {
      renameMutation.mutate({ dynamicId: dynamicToRename.id, name });
    }
  };

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'dynamic',
    onRename: (id: string) => {
      const dynamic = dynamics?.find(d => d.id === id);
      if (dynamic) {
        const userDyn = userDynamics.find(ud => ud.dynamic_id === id);
        setDynamicToRename({
          id: dynamic.id,
          name: userDyn?.custom_name || dynamic.name,
        });
        setRenameModalOpened(true);
      }
    },
    onView: (id: string) => {
      navigate(`/dynamic/${id}`);
    },
  });

  const handleBuildDynamic = () => {
    // TODO: Implement dynamic creation flow
    console.log('Build new dynamic');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  // Filter dynamics based on active tab
  // "My Dynamics" = dynamics where user has an association
  // "Explore Dynamics" = ALL dynamics (user can explore and bookmark any dynamic)
  const userDynamicIds = new Set(userDynamics.map(ud => ud.dynamic_id));
  const myDynamics = dynamics?.filter(d => userDynamicIds.has(d.id)) || [];
  const exploreDynamics = dynamics || []; // Show ALL dynamics in explore tab

  const currentDynamics = activeTab === 'my-dynamics' ? myDynamics : exploreDynamics;

  // Filter dynamics based on search
  const filteredDynamics = currentDynamics?.filter(
    (dynamic) =>
      dynamic.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      dynamic.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Define column configurations for dynamics
  const dynamicColumns: ColumnConfig[] = [
    {
      key: 'dynamicName',
      header: 'Dynamic name',
      type: 'text',
    },
    {
      key: 'createdBy',
      header: 'Created by',
      type: 'text',
    },
    {
      key: 'description',
      header: 'Description',
      type: 'text',
    },
    {
      key: 'type',
      header: 'Type',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
  ];

  // Transform the data to match the IngredientRecord structure
  const transformedData: IngredientRecord[] =
    filteredDynamics?.map((dynamic) => {
      const userDyn = userDynamics.find(ud => ud.dynamic_id === dynamic.id);
      const displayName = userDyn?.custom_name || dynamic.name;

      // Only show creator info if the current user is NOT the creator
      const isCreator = userDyn?.is_creator || false;
      const creator = userDyn && !isCreator ? users.find(u => u.id === userDyn.user_id) : null;
      const creatorName = creator ? usersAPI.getDisplayName(creator) : '';

      return {
        id: dynamic.id,
        dynamicName: {
          text: displayName,
        } as TextValue,
        createdBy: {
          text: creatorName ? `by ${creatorName}` : '',
        } as TextValue,
        description: {
          text: dynamic.description || 'No description',
        } as TextValue,
        type: {
          text: dynamic.type || 'Standard',
        } as TextValue,
        dateCreated: {
          text: moment(dynamic.created_at).fromNow(),
        } as TextValue,
      };
    }) || [];

  return (
    <>
      <ReportRenameModal
        opened={renameModalOpened}
        onClose={() => {
          setRenameModalOpened(false);
          setDynamicToRename(null);
        }}
        onSubmit={handleRenameDynamic}
        currentName={dynamicToRename?.name || ''}
        isLoading={renameMutation.isPending}
      />
      <IngredientReadView
        ingredient="dynamic"
        title="Dynamics"
        subtitle="Manage time-varying behaviours and dynamic configurations for your models."
        onBuild={handleBuildDynamic}
        onDelete={handleDeleteSelected}
        isLoading={isLoading}
        isError={!!error}
        error={error}
        data={transformedData}
        columns={dynamicColumns}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onMoreFilters={handleMoreFilters}
        enableSelection
        isSelected={isSelected}
        onSelectionChange={handleSelectionChange}
        selectedCount={selectedIds.length}
        onRowClick={(id) => navigate(`/dynamic/${id}`)}
        headerContent={
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="my-dynamics">My dynamics</Tabs.Tab>
              <Tabs.Tab value="explore-dynamics">Explore dynamics</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        }
      />
    </>
  );
}
