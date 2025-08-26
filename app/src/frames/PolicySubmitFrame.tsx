import { useDispatch, useSelector } from 'react-redux';
import { PolicyAdapter, PolicyCreationPayload } from '@/adapters';
import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { markPolicyAsCreated, updatePolicyId } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Policy } from '@/types/ingredients/Policy';
import { formatDate } from '@/utils/dateFormatter';

export default function PolicySubmitFrame({ onReturn, isInSubflow }: FlowComponentProps) {
  const params = useSelector((state: RootState) => state.policy.parameters || []);
  const dispatch = useDispatch();
  const { resetIngredient } = useIngredientReset();
  const policyState = useSelector((state: RootState) => state.policy);
  const { createPolicy, isPending } = useCreatePolicy(policyState.label || undefined);

  // Convert Redux state to Policy type structure
  const policy: Partial<Policy> = {
    parameters: policyState.parameters,
  };

  function handleSubmit() {
    const serializedPolicyCreationPayload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(
      policy as Policy
    );
    console.log('serializedPolicyCreationPayload', serializedPolicyCreationPayload);
    createPolicy(serializedPolicyCreationPayload, {
      onSuccess: (data) => {
        console.log('Policy created successfully:', data);
        dispatch(updatePolicyId(data.result.policy_id));
        dispatch(markPolicyAsCreated());
        // If we've created this policy as part of a standalone policy creation flow,
        // we're done; clear the policy reducer
        if (!isInSubflow) {
          resetIngredient('policy');
        }
        onReturn();
      },
    });
  }

  // Helper function to format date range string (UTC timezone-agnostic)
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate, 'short-month-day-year');
    const end = endDate === '9999-12-31' ? 'Ongoing' : formatDate(endDate, 'short-month-day-year');
    return `${start} - ${end}`;
  };

  // Create hierarchical provisions list with header and date intervals
  const provisions: TextListItem[] = [
    {
      text: 'Provision',
      isHeader: true, // Use larger size for header
      subItems: params.map((param) => {
        const dateIntervals: DateIntervalValue[] = param.values.map((valueInterval) => ({
          dateRange: formatDateRange(valueInterval.startDate, valueInterval.endDate),
          value: valueInterval.value,
        }));

        return {
          label: param.name, // Parameter name
          dateIntervals,
        } as TextListSubItem;
      }),
    },
  ];

  return (
    <IngredientSubmissionView
      title="Review Policy"
      subtitle="Review your policy configurations before submitting."
      textList={provisions}
      submitButtonText="Submit Policy"
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
    />
  );
}
