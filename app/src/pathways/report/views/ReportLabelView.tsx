import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import PathwayView from '@/components/common/PathwayView';
import { CURRENT_YEAR } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getTaxYears } from '@/libs/metadataUtils';
import { trackReportStarted } from '@/utils/analytics';

interface ReportLabelViewProps {
  label: string | null;
  year: string | null;
  onUpdateLabel: (label: string) => void;
  onUpdateYear: (year: string) => void;
  onNext: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportLabelView({
  label,
  year,
  onUpdateLabel,
  onUpdateYear,
  onNext,
  onBack,
  onCancel,
}: ReportLabelViewProps) {
  const countryId = useCurrentCountry();
  const [localLabel, setLocalLabel] = useState(label || '');
  const [localYear, setLocalYear] = useState<string>(year || CURRENT_YEAR);

  // Get available years from metadata
  const availableYears = useSelector(getTaxYears);

  // Use British spelling for UK
  const initializeText = countryId === 'uk' ? 'Initialise' : 'Initialize';

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function handleYearChange(value: string) {
    const newYear = value || CURRENT_YEAR;
    setLocalYear(newYear);
  }

  function submissionHandler() {
    trackReportStarted();
    onUpdateLabel(localLabel);
    onUpdateYear(localYear);
    onNext();
  }

  const formInputs = (
    <>
      <div className="tw:flex tw:flex-col tw:gap-xs">
        <label className="tw:text-sm tw:font-medium">Report name</label>
        <Input
          placeholder="Enter report name"
          value={localLabel}
          onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
        />
      </div>
      <div className="tw:flex tw:flex-col tw:gap-xs">
        <label className="tw:text-sm tw:font-medium">Year</label>
        <Select value={localYear} onValueChange={handleYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const primaryAction = {
    label: `${initializeText} report`,
    onClick: submissionHandler,
  };

  return (
    <PathwayView
      title="Create report"
      content={formInputs}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
