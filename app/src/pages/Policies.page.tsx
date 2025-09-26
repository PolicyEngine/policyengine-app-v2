import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { usePolicies } from '@/hooks/usePolicies';
import { countryIds } from '@/libs/countries';
import { setFlow } from '@/reducers/flowReducer';
import { formatDate } from '@/utils/dateUtils';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = usePolicies();
  const dispatch = useDispatch();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBuildPolicy = () => {
    dispatch(setFlow(PolicyCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleMenuAction = (action: string, recordId: string) => {
    switch (action) {
      case 'view-policy':
        // TODO: Implement view reform functionality
        console.log('View details:', recordId);
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
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

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
      key: 'connections',
      header: 'Connections',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'actions',
      header: '',
      type: 'split-menu',
      actions: [
        { label: 'View details', action: 'view-policy' },
        { label: 'Bookmark', action: 'bookmark' },
        { label: 'Edit', action: 'edit' },
        { label: 'Share', action: 'share' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ],
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the new structure
  console.log('Raw policies data:', policies);

  const transformedData: IngredientRecord[] =
    policies?.map((policy) => ({
      id: policy.id,
      policyName: {
        text: policy.name || `Policy #${policy.id}`,
      } as TextValue,
      dateCreated: {
        text: formatDate(
          policy.created_at,
          'short-month-day-year',
          (policy.country || 'us') as (typeof countryIds)[number],
          true
        ),
      } as TextValue,
      provisions: {
        text: policy.description || 'No description',
      } as TextValue,
      connections: {
        items: [
          {
            text: 'View simulations',
            badge: '',
          },
        ],
      } as BulletsValue,
    })) || [];

  return (
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
    />
  );
}
