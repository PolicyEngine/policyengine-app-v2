/**
 * PolicySubmitView - View for reviewing and submitting policy
 * Duplicated from PolicySubmitFrame
 * Props-based instead of Redux-based
 */

import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters';
import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { countryIds } from '@/libs/countries';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyStateProps } from '@/types/pathwayState';
import { PolicyCreationPayload } from '@/types/payloads';
import { trackPolicyCreated } from '@/utils/analytics';
import { formatDate } from '@/utils/dateUtils';
import {
  evaluatePolicyAgainstCurrentLaw,
  NO_EFFECTIVE_POLICY_CHANGES_MESSAGE,
  POLICY_COMPARISON_UNAVAILABLE_MESSAGE,
} from '@/utils/policyCurrentLaw';

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
  const metadata = useSelector((state: RootState) => state.metadata);
  const currentLawEvaluation = evaluatePolicyAgainstCurrentLaw(
    policy.parameters,
    metadata,
    countryId
  );

  // Issue #605: Block empty policy creation
  const startedEmpty = !policy.parameters || policy.parameters.length === 0;
  const effectiveParameters =
    currentLawEvaluation.status === 'has-effective-changes' ? currentLawEvaluation.parameters : [];

  // Convert state to Policy type structure
  const policyData: Partial<Policy> = {
    parameters: effectiveParameters,
  };

  function handleSubmit() {
    if (currentLawEvaluation.status !== 'has-effective-changes') {
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
  const provisions: TextListItem[] =
    effectiveParameters.length === 0
      ? []
      : [
          {
            text: 'Provision',
            isHeader: true,
            subItems: effectiveParameters.map((param) => {
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
      submitButtonDisabled={currentLawEvaluation.status !== 'has-effective-changes'}
      warningMessage={
        startedEmpty
          ? 'Add at least one parameter change to create a policy.'
          : currentLawEvaluation.status === 'metadata-unavailable'
            ? POLICY_COMPARISON_UNAVAILABLE_MESSAGE
            : currentLawEvaluation.status === 'no-effective-changes'
              ? NO_EFFECTIVE_POLICY_CHANGES_MESSAGE
              : undefined
      }
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}
