import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs } from '@mantine/core';
import { datasetsAPI } from '@/api/v2/datasets';
import { userDatasetsAPI } from '@/api/v2/userDatasets';
import { usersAPI } from '@/api/v2/users';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { notifications } from '@mantine/notifications';
import { MOCK_USER_ID } from '@/constants';

export default function DatasetsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('my-datasets');
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();

  // Fetch datasets
  const {
    data: datasets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsAPI.listDatasets({ limit: 1000 }),
    refetchInterval: 30000,
  });

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch user datasets for custom names
  const { data: userDatasets = [] } = useQuery({
    queryKey: ['userDatasets', userId],
    queryFn: () => userDatasetsAPI.listUserDatasets(userId),
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.listUsers({ limit: 1000 }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: datasetsAPI.deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      notifications.show({
        title: 'Dataset deleted',
        message: 'The dataset has been deleted successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete dataset',
        color: 'red',
      });
    },
  });

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteMutation.mutate(id));
  };

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'dataset',
  });

  const handleBuildDataset = () => {
    // TODO: Implement dataset creation flow
    console.log('Build new dataset');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  // Filter datasets based on active tab
  // "My Datasets" = datasets where user has an association
  // "Explore Datasets" = ALL datasets (user can explore and bookmark any dataset)
  const userDatasetIds = new Set(userDatasets.map(ud => ud.dataset_id));
  const myDatasets = datasets?.filter(d => userDatasetIds.has(d.id)) || [];
  const exploreDatasets = datasets || []; // Show ALL datasets in explore tab

  const currentDatasets = activeTab === 'my-datasets' ? myDatasets : exploreDatasets;

  // Filter datasets based on search
  const filteredDatasets = currentDatasets?.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Define column configurations for datasets
  const datasetColumns: ColumnConfig[] = [
    {
      key: 'datasetName',
      header: 'Dataset name',
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
      key: 'year',
      header: 'Year',
      type: 'text',
    },
  ];

  // Transform the data to match the IngredientRecord structure
  const transformedData: IngredientRecord[] =
    filteredDatasets?.map((dataset) => {
      const userDataset = userDatasets.find(ud => ud.dataset_id === dataset.id);
      const displayName = userDataset?.custom_name || dataset.name;

      // Only show creator info if the current user is NOT the creator
      const isCreator = userDataset?.is_creator || false;
      const creator = userDataset && !isCreator ? users.find(u => u.id === userDataset.user_id) : null;
      const creatorName = creator ? usersAPI.getDisplayName(creator) : '';

      return {
        id: dataset.id,
        datasetName: {
          text: displayName,
        } as TextValue,
        createdBy: {
          text: creatorName ? `by ${creatorName}` : '',
        } as TextValue,
        description: {
          text: dataset.description || 'No description',
        } as TextValue,
        year: {
          text: dataset.year?.toString() || 'N/A',
        } as TextValue,
      };
    }) || [];

  return (
    <IngredientReadView
      ingredient="dataset"
      title="Datasets"
      subtitle="Manage household, population, and economic datasets for your simulations."
      onBuild={handleBuildDataset}
      onDelete={handleDeleteSelected}
      isLoading={isLoading}
      isError={!!error}
      error={error}
      data={transformedData}
      columns={datasetColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onMoreFilters={handleMoreFilters}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
      selectedCount={selectedIds.length}
      onRowClick={(datasetId) => navigate(`/dataset/${datasetId}`)}
      headerContent={
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="my-datasets">My datasets</Tabs.Tab>
            <Tabs.Tab value="explore-datasets">Explore datasets</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      }
    />
  );
}
