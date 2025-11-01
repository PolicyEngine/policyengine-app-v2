import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Select, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { clearReport, updateLabel } from '@/reducers/reportReducer';
import { AppDispatch } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function ReportCreationFrame({ onNavigate }: FlowComponentProps) {
  console.log('[ReportCreationFrame] ========== COMPONENT RENDER ==========');
  const dispatch = useDispatch<AppDispatch>();
  const countryId = useCurrentCountry();
  const [localLabel, setLocalLabel] = useState('');
  // NOTE: Temporary hardcoded year dropdown - does nothing functionally, placeholder for future feature
  const [year, setYear] = useState<string>('2025');

  // Clear any existing report data when mounting
  useEffect(() => {
    console.log('[ReportCreationFrame] Mounting - clearing report for country:', countryId);
    dispatch(clearReport(countryId));
  }, [dispatch, countryId]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    console.log('[ReportCreationFrame] Submit clicked - label:', localLabel);
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
      {/* NOTE: Temporary hardcoded year dropdown - does nothing functionally */}
      <Select
        label="Year"
        placeholder="Select year"
        data={['2025']}
        value={year}
        onChange={(val) => setYear(val || '2025')}
        disabled
      />
    </>
  );

  const primaryAction = {
    label: 'Create report',
    onClick: submissionHandler,
  };

  return <FlowView title="Create report" content={formInputs} primaryAction={primaryAction} />;
}
