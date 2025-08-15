import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { Box, Text, Anchor, Badge, Group, Stack } from '@mantine/core';
import IngredientReadView from '@/components/IngredientReadView';
import { 
  ColumnConfig, 
  IngredientRecord,
  TextValue,
  LinkValue,
  BulletsValue
} from '@/components/columns';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { setFlow } from '@/reducers/flowReducer';
import { colors, spacing, typography } from '@/designTokens';

export default function PoliciesPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const dispatch = useDispatch();
  
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState([
    { label: "Most Recent", value: "most-recent" },
    { label: "Type", value: "type" }
  ]);

  const handleNavigateToCreate = () => {
    dispatch(setFlow(PolicyCreationFlow));
  };

  const handleBuildPolicy = () => {
    dispatch(setFlow(PolicyCreationFlow));
  };

  const handleFilterRemove = (filterValue: string) => {
    setFilters(prev => prev.filter(f => f.value !== filterValue));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleMenuAction = (action: string, recordId: string) => {
    switch (action) {
      case 'view-policy':
        // TODO: Implement view reform functionality
        console.log('View policy:', recordId);
        break;
      case 'bookmark':
        // TODO: Implement bookmark functionality
        console.log('Bookmark policy:', recordId);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        console.log('Edit policy:', recordId);
        break;
      case 'share':
        // TODO: Implement share functionality
        console.log('Share policy:', recordId);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        console.log('Delete policy:', recordId);
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected 
        ? [...prev, recordId]
        : prev.filter(id => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  // Define column configurations for policies
  const policyColumns: ColumnConfig[] = [
    {
      key: 'policyName',
      header: 'Policy name',
      type: 'text'
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text'
    },
    {
      key: 'provisions',
      header: 'Provisions',
      type: 'text'
    },
    {
      key: 'connections',
      header: 'Connections',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge'
        }
      ]
    },
    {
      key: 'actions',
      header: '',
      type: 'menu',
      actions: [
        { label: 'View policy', action: 'view-policy' },
        { label: 'Bookmark', action: 'bookmark' },
        { label: 'Edit', action: 'edit' },
        { label: 'Share', action: 'share' },
        { label: 'Delete', action: 'delete', color: 'red' }
      ],
      onAction: handleMenuAction
    }
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] = data?.map((item) => ({
    id: item.association.policyId,
    policyName: {
      text: item.policy?.label || `Policy #${item.association.policyId}`
    } as TextValue,
    dateCreated: {
      text: 'Just now' // TODO: Format actual date from item data
    } as TextValue,
    provisions: {
      text: '7 provisions' // TODO: Get actual provisions count
    } as TextValue,
    connections: {
      items: [
        {
          text: 'Sample simulation',
          badge: ''
        },
        {
          text: 'Sample report',
          badge: ''
        }
      ]
    } as BulletsValue,
  })) || [];

  return (
    <IngredientReadView
      ingredient="policy"
      title="Your policies"
      subtitle="Create a policy reform or find and save existing policies to use in your simulation configurations."
      onCreate={handleNavigateToCreate}
      onBuild={handleBuildPolicy}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={policyColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onFilterRemove={handleFilterRemove}
      onMoreFilters={handleMoreFilters}
      enableSelection={true}
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
