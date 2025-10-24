import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import FlowContainer from '@/components/FlowContainer';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { clearFlow, setFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { countParameterChanges } from '@/utils/countParameterChanges';
import { formatDate } from '@/utils/dateUtils';

interface PoliciesPageProps {
  flowMode?: 'create';
}

export default function PoliciesPage({ flowMode }: PoliciesPageProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentFlow } = useSelector((state: RootState) => state.flow);

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize flow when in create mode
  useEffect(() => {
    if (flowMode === 'create') {
      dispatch(setFlow(PolicyCreationFlow));
    }

    // Cleanup on unmount
    return () => {
      if (currentFlow) {
        dispatch(clearFlow());
      }
    };
  }, [flowMode, dispatch]);

  // Listen for flow completion
  useEffect(() => {
    // If we're in create mode but flow was cleared (completed), navigate back
    if (flowMode === 'create' && !currentFlow) {
      navigate('/us/policies');
    }
  }, [currentFlow, flowMode, navigate]);

  const handleBuildPolicy = () => {
    navigate('create');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
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
      header: 'Parameter changes',
      type: 'text',
    },
  ];

  // Transform the data to match the new structure
  console.log('Raw user policies data:', data);

  const transformedData: IngredientRecord[] =
    data?.map((item) => ({
      id: item.association.policyId.toString(),
      policyName: {
        text: item.association.label || `Policy #${item.association.policyId}`,
      } as TextValue,
      dateCreated: {
        text: item.association.createdAt
          ? formatDate(
              item.association.createdAt,
              'short-month-day-year',
              item.association.countryId,
              true
            )
          : '',
      } as TextValue,
      provisions: {
        text: `${countParameterChanges(item.policy)} parameter change${countParameterChanges(item.policy) !== 1 ? 's' : ''}`,
      } as TextValue,
    })) || [];

  // Render flow if in create mode
  if (flowMode === 'create') {
    return <FlowContainer />;
  }

  // Otherwise render normal list view
  return (
    <IngredientReadView
      ingredient="policy"
      title="Your saved policies"
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
