/**
 * PolicySubmitView - View for reviewing and submitting policy
 * Duplicated from PolicySubmitFrame
 * Props-based instead of Redux-based
 */

import { PolicyAdapter } from '@/adapters';
import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { PolicyStateProps } from '@/types/pathwayState';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyCreationPayload } from '@/types/payloads';
import { formatDate } from '@/utils/dateUtils';

interface PolicySubmitViewProps {
  policy: PolicyStateProps;
  countryId: string;
  onSubmitSuccess: (policyId: string) => void;
}

export default function PolicySubmitView({
  policy,
  countryId,
  onSubmitSuccess,
}: PolicySubmitViewProps) {
  const { createPolicy, isPending } = useCreatePolicy(policy?.label || undefined);

  // Convert state to Policy type structure
  const policyData: Partial<Policy> = {
    parameters: policy?.parameters,
  };

  function handleSubmit() {
    if (!policy) {
      console.error('No policy found');
      return;
    }

    const serializedPolicyCreationPayload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(
      policyData as Policy
    );
    console.log('serializedPolicyCreationPayload', serializedPolicyCreationPayload);
    createPolicy(serializedPolicyCreationPayload, {
      onSuccess: (data) => {
        console.log('Policy created successfully:', data);
        onSubmitSuccess(data.result.policy_id);
      },
    });
  }

  // Helper function to format date range string (UTC timezone-agnostic)
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate, 'short-month-day-year', countryId);
    const end =
      endDate === '9999-12-31' ? 'Ongoing' : formatDate(endDate, 'short-month-day-year', countryId);
    return `${start} - ${end}`;
  };

  // Create hierarchical provisions list with header and date intervals
  const provisions: TextListItem[] = [
    {
      text: 'Provision',
      isHeader: true,
      subItems: policy.parameters.map((param) => {
        const dateIntervals: DateIntervalValue[] = param.values.map((valueInterval) => ({
          dateRange: formatDateRange(valueInterval.startDate, valueInterval.endDate),
          value: valueInterval.value,
        }));

        return {
          label: param.name,
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
