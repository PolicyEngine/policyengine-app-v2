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
      endDate === FOREVER ? 'onward' : formatDate(endDate, 'short-month-day-year', countryId);
    return endDate === FOREVER ? `${start} ${end}` : `${start} - ${end}`;
  };

  // Helper function to format value with currency symbol and proper formatting
  const formatValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return String(value);
    }

    // Determine currency symbol based on country
    const currencySymbol = countryId === 'us' ? '$' : countryId === 'uk' ? '£' : '';

    // Check if value has decimals
    const hasDecimals = numValue % 1 !== 0;

    // Format with commas and optional decimals
    const formattedNumber = hasDecimals
      ? numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : numValue.toLocaleString('en-US', { maximumFractionDigits: 0 });

    return `${currencySymbol}${formattedNumber}`;
  };

  // Create hierarchical provisions list with header and date intervals
  const provisions: TextListItem[] = [
    {
      text: 'Provision',
      isHeader: true,
      subItems: parameters.map((param) => {
        const dateIntervals: DateIntervalValue[] = param.values.map((valueInterval) => ({
          dateRange: formatDateRange(valueInterval.startDate, valueInterval.endDate),
          value: formatValue(valueInterval.value),
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
      submissionHandler={onSubmit}
      submitButtonLoading={isSubmitting}
    />
  );
}
