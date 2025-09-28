import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { apiClient } from '@/api/apiClient';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';

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
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();
  const { handleSelectionChange, isSelected } = useIngredientSelection();

  // Fetch dynamics from API
  const {
    data: dynamics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dynamics'],
    queryFn: () => apiClient.get<Dynamic[]>('/dynamics/', { params: { limit: 1000 } }),
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/dynamics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamics'] });
    },
  });

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'dynamic',
    onDelete: (id) => {
      if (confirm('Delete this dynamic configuration?')) {
        deleteMutation.mutate(id);
      }
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

  // Filter dynamics based on search
  const filteredDynamics = dynamics?.filter(
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
    {
      key: 'actions',
      header: '',
      type: 'split-menu',
      actions: getDefaultActions(),
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the IngredientRecord structure
  const transformedData: IngredientRecord[] =
    filteredDynamics?.map((dynamic) => ({
      id: dynamic.id,
      dynamicName: {
        text: dynamic.name,
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
    })) || [];

  return (
    <IngredientReadView
      ingredient="dynamic"
      title="Your dynamics"
      subtitle="Manage time-varying behaviours and dynamic configurations for your models."
      onBuild={handleBuildDynamic}
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
    />
  );
}
