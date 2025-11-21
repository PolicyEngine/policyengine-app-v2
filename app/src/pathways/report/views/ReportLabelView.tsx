import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Select, TextInput } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { CURRENT_YEAR } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getTaxYears } from '@/libs/metadataUtils';

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
  console.log('[ReportLabelView] ========== COMPONENT RENDER ==========');
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

  function handleYearChange(value: string | null) {
    const newYear = value || CURRENT_YEAR;
    console.log('[ReportLabelView] Year changed to:', newYear);
    setLocalYear(newYear);
  }

  function submissionHandler() {
    console.log('[ReportLabelView] Submit clicked - label:', localLabel, 'year:', localYear);
    onUpdateLabel(localLabel);
    onUpdateYear(localYear);
    console.log('[ReportLabelView] Navigating to next');
    onNext();
  }

  const formInputs = (
    <>
      <TextInput
        label="Report name"
        placeholder="Enter report name"
        value={localLabel}
        onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
      />
      <Select
        label="Year"
        placeholder="Select year"
        data={availableYears}
        value={localYear}
        onChange={handleYearChange}
        searchable
      />
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
