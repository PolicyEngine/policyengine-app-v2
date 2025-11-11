import IngredientSubmissionView, {
  DateIntervalValue,
  TextListItem,
  TextListSubItem,
} from '@/components/IngredientSubmissionView';
import { CountryId } from '@/api/report';
import { FOREVER } from '@/constants';
import { Parameter } from '@/types/subIngredients/parameter';
import { formatDate } from '@/utils/dateUtils';

interface PolicySubmitFrameProps {
  label: string;
  parameters: Parameter[];
  countryId: CountryId;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function PolicySubmitFrame({
  label,
  parameters,
  countryId,
  onSubmit,
  onBack,
  isSubmitting = false,
}: PolicySubmitFrameProps) {
  // Helper function to format date range string (UTC timezone-agnostic)
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate, 'short-month-day-year', countryId);
    const end =
      endDate === FOREVER ? 'Ongoing' : formatDate(endDate, 'short-month-day-year', countryId);
    return `${start} - ${end}`;
  };

  // Create hierarchical provisions list with header and date intervals
  const provisions: TextListItem[] = [
    {
      text: 'Provision',
      isHeader: true,
      subItems: parameters.map((param) => {
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
      submissionHandler={onSubmit}
      submitButtonLoading={isSubmitting}
    />
  );
}
