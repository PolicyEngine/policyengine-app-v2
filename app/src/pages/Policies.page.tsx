import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import PolicyCreationFlow from '@/components/policy/PolicyCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { usePolicies } from '@/hooks/usePolicies';
import { countryIds } from '@/libs/countries';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPolicyAtPosition, updatePolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { formatDate } from '@/utils/dateUtils';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = usePolicies();
  const dispatch = useDispatch();
  const isError = !!error;
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();
  const [modalOpened, setModalOpened] = useState(false);

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

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'policy',
    // TODO: Implement actual action handlers
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
      actions: getDefaultActions(),
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the new structure

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
    </>
  );
}
