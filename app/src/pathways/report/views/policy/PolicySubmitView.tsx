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
import { countryIds } from '@/libs/countries';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyStateProps } from '@/types/pathwayState';
import { PolicyCreationPayload } from '@/types/payloads';
import { trackPolicyCreated } from '@/utils/analytics';
import { formatDate } from '@/utils/dateUtils';

interface PolicySubmitViewProps {
  policy: PolicyStateProps;
  countryId: (typeof countryIds)[number];
  onSubmitSuccess: (policyId: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function PolicySubmitView({
  policy,
  countryId,
  onSubmitSuccess,
  onBack,
  onCancel,
}: PolicySubmitViewProps) {
  const { createPolicy, isPending } = useCreatePolicy(policy?.label || undefined);

  // Issue #605: Block empty policy creation
  const hasNoParameters = !policy.parameters || policy.parameters.length === 0;

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
    createPolicy(serializedPolicyCreationPayload, {
      onSuccess: (data) => {
        trackPolicyCreated();
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
  const provisions: TextListItem[] = hasNoParameters
    ? []
    : [
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
      title="Review policy"
      subtitle="Review your policy configurations before submitting."
      textList={provisions}
      submitButtonText="Create policy"
      submissionHandler={handleSubmit}
      submitButtonLoading={isPending}
      submitButtonDisabled={hasNoParameters}
      warningMessage={
        hasNoParameters ? 'Add at least one parameter change to create a policy.' : undefined
      }
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
