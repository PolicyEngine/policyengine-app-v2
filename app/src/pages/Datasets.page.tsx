import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datasetsAPI } from '@/api/v2/datasets';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { formatIngredientDate } from '@/utils/ingredientUtils';

export default function DatasetsPage() {
  const [searchValue, setSearchValue] = useState('');
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: datasetsAPI.deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'dataset' as any,
    onDelete: (id) => {
      if (confirm('Delete this dataset?')) {
        deleteMutation.mutate(id);
      }
    },
  });

  const handleBuildDataset = () => {
    // TODO: Implement dataset creation flow
    console.log('Build new dataset');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  // Filter datasets based on search
  const filteredDatasets = datasets?.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'household':
        return 'blue';
      case 'population':
        return 'green';
      case 'economic':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Define column configurations for datasets
  const datasetColumns: ColumnConfig[] = [
    {
      key: 'datasetName',
      header: 'Dataset name',
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
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'country',
      header: 'Country',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
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
    filteredDatasets?.map((dataset) => ({
      id: dataset.id,
      datasetName: {
        text: dataset.name,
      } as TextValue,
      description: {
        text: dataset.description || 'No description',
      } as TextValue,
      type: {
        items: [{ text: dataset.type, badge: getTypeColor(dataset.type) }],
      } as BulletsValue,
      country: {
        items: dataset.country ? [{ text: dataset.country.toUpperCase(), badge: '' }] : [],
      } as BulletsValue,
      dateCreated: {
        text: formatIngredientDate(dataset.created_at, dataset.country as any),
      } as TextValue,
    })) || [];

  return (
    <IngredientReadView
      ingredient="dataset"
      title="Your datasets"
      subtitle="Manage household, population, and economic datasets for your simulations."
      onBuild={handleBuildDataset}
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
    />
  );
}
