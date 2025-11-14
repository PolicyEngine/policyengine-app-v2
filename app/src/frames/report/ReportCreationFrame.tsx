import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Select, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { CURRENT_YEAR } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getTaxYears } from '@/libs/metadataUtils';
import { clearReport, updateLabel, updateYear } from '@/reducers/reportReducer';
import { AppDispatch } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function ReportCreationFrame({ onNavigate }: FlowComponentProps) {
  console.log('[ReportCreationFrame] ========== COMPONENT RENDER ==========');
  const dispatch = useDispatch<AppDispatch>();
  const countryId = useCurrentCountry();
  const [localLabel, setLocalLabel] = useState('');

  // Get available years from metadata
  const availableYears = useSelector(getTaxYears);
  const [localYear, setLocalYear] = useState<string>(CURRENT_YEAR);

  // Clear any existing report data when mounting and initialize with current year
  useEffect(() => {
    console.log('[ReportCreationFrame] Mounting - clearing report for country:', countryId);
    dispatch(clearReport(countryId));
    // Initialize report year to current year
    dispatch(updateYear(CURRENT_YEAR));
    setLocalYear(CURRENT_YEAR);
  }, [dispatch, countryId]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function handleYearChange(value: string | null) {
    const newYear = value || CURRENT_YEAR;
    console.log('[ReportCreationFrame] Year changed to:', newYear);
    setLocalYear(newYear);
    dispatch(updateYear(newYear));
  }

  function submissionHandler() {
    console.log('[ReportCreationFrame] Submit clicked - label:', localLabel, 'year:', localYear);
    dispatch(updateLabel(localLabel));
    console.log('[ReportCreationFrame] Navigating to next frame');
    onNavigate('next');
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
    label: 'Create report',
    onClick: submissionHandler,
  };

  return <FlowView title="Create report" content={formInputs} primaryAction={primaryAction} />;
}
