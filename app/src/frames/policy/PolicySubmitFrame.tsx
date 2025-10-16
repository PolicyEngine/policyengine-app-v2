import { useDispatch, useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters';
import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectActivePolicy, selectCurrentPosition } from '@/reducers/activeSelectors';
import { clearPolicyAtPosition, updatePolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyCreationPayload } from '@/types/payloads';
import { formatDate } from '@/utils/dateUtils';

export default function PolicySubmitFrame({ onReturn, isInSubflow }: FlowComponentProps) {
  const dispatch = useDispatch();
  const countryId = useCurrentCountry();

  // Read position from report reducer via cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  // Get the active policy at the current position
  const policyState = useSelector((state: RootState) => selectActivePolicy(state));
  const params = policyState?.parameters || [];

  const { createPolicy, isPending } = useCreatePolicy(policyState?.label || undefined);

  // Convert Redux state to Policy type structure
  const policy: Partial<Policy> = {
    parameters: policyState?.parameters,
  };

  function handleSubmit() {
    if (!policyState) {
      console.error('No policy found at current position');
      return;
    }

    const serializedPolicyCreationPayload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(
      policy as Policy
    );
    console.log('serializedPolicyCreationPayload', serializedPolicyCreationPayload);
    createPolicy(serializedPolicyCreationPayload, {
      onSuccess: (data) => {
        console.log('Policy created successfully:', data);
        // Update the policy at the current position with the ID and mark as created
        dispatch(
          updatePolicyAtPosition({
            position: currentPosition,
            updates: {
              id: data.result.policy_id,
              isCreated: true,
            },
          })
        );
        // If we've created this policy as part of a standalone policy creation flow,
        // we're done; clear the policy at current position
        if (!isInSubflow) {
          dispatch(clearPolicyAtPosition(currentPosition));
        }
        onReturn();
      },
    });
  }

  // Helper function to format date range string (UTC timezone-agnostic)
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate, 'short-month-day-year', countryId);
    const end =
      endDate === '9999-12-31'
        ? 'Ongoing'
        : formatDate(endDate, 'short-month-day-year', countryId);
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
