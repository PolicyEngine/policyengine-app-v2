import { useState } from 'react';
import moment from 'moment';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import PolicyCreationFlow from '@/components/policy/PolicyCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { usePolicies } from '@/hooks/usePolicies';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = usePolicies();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const { handleSelectionChange, isSelected } = useIngredientSelection();
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
        text: moment(policy.created_at).fromNow(),
      } as TextValue,
      provisions: {
        text: policy.description || 'No description',
      } as TextValue,
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
