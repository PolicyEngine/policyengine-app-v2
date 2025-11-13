import { useSelector } from 'react-redux';
import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { FOREVER } from '@/constants';
import { RootState } from '@/store';
import { formatDate } from '@/utils/dateUtils';
import { formatParameterValueFromMetadata } from '@/utils/formatters';
import { PolicyState } from '../types';

interface PolicySubmitFrameProps {
  state: PolicyState;
  onStateChange: (newState: Partial<PolicyState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * PolicySubmitFrame is wrapped in a standard AppShell by PolicyPathwayWrapper.
 *
 * This frame does not manage its own layout - it's rendered inside the
 * AppShell.Main section provided by PolicyPathwayWrapper.
 */

export default function PolicySubmitFrame({
  state,
  onNext,
  onBack,
}: PolicySubmitFrameProps) {
  // Get parameter metadata from Redux store
  const parameterMetadata = useSelector((state: RootState) => state.metadata.parameters);

  // Helper function to format date range string (UTC timezone-agnostic)
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate, 'short-month-day-year', state.countryId);
    const end =
      endDate === FOREVER ? 'onward' : formatDate(endDate, 'short-month-day-year', state.countryId);
    return endDate === FOREVER ? `${start} ${end}` : `${start} - ${end}`;
  };

  // Create hierarchical provisions list with header and date intervals
  const provisions: TextListItem[] = [
    {
      text: 'Provision',
      isHeader: true,
      subItems: state.parameters.map((param) => {
        const dateIntervals: DateIntervalValue[] = param.values.map((valueInterval) => ({
          dateRange: formatDateRange(valueInterval.startDate, valueInterval.endDate),
          value: formatParameterValueFromMetadata(
            param.name,
            valueInterval.value,
            parameterMetadata,
            state.countryId
          ),
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
      subtitle="Review your policy configuration before submitting."
      textList={provisions}
      submitButtonText="Submit Policy"
      submissionHandler={onNext}
      submitButtonLoading={false}
    />
  );
}
