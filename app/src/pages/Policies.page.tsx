import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import FlowContainer from '@/components/FlowContainer';
import IngredientReadView from '@/components/IngredientReadView';
import PolicyCreationModal from '@/components/policy/PolicyCreationModal';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { usePolicies } from '@/hooks/usePolicies';
import { countryIds } from '@/libs/countries';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { navigateToFrame, setFlow } from '@/reducers/flowReducer';
import { createPolicyAtPosition, updatePolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { formatDate } from '@/utils/dateUtils';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = usePolicies();
  const dispatch = useDispatch();
  const isError = !!error;
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const { currentFlow } = useSelector((state: RootState) => state.flow);

  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();
  const [modalOpened, setModalOpened] = useState(false);

  const handleBuildPolicy = () => {
    setModalOpened(true);
  };

  const handleModalSubmit = (policyName: string) => {
    // Create policy at current position with the label
    dispatch(createPolicyAtPosition({ position: currentPosition }));
    dispatch(
      updatePolicyAtPosition({
        position: currentPosition,
        updates: { label: policyName },
      })
    );

    // Set the flow and navigate to parameter selection
    dispatch(setFlow(PolicyCreationFlow));
    // Navigate directly to the parameter selector, skipping the creation frame
    dispatch(navigateToFrame('PolicyParameterSelectorFrame'));
    setModalOpened(false);
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

  // Render the normal policies page with the modal and/or flow overlay
  return (
    <>
      <PolicyCreationModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
      {currentFlow && <FlowContainer />}
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
