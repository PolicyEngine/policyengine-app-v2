import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { clearReport, updateLabel } from '@/reducers/reportReducer';
import { AppDispatch } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function ReportCreationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const countryId = useCurrentCountry();
  const [localLabel, setLocalLabel] = useState('');

  // Clear any existing report data when mounting
  useEffect(() => {
    dispatch(clearReport(countryId));
  }, [dispatch, countryId]);

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    dispatch(updateLabel(localLabel));
    onNavigate('next');
  }

  const formInputs = (
    <TextInput
      label="Report name"
      placeholder="Enter report name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create report',
    onClick: submissionHandler,
  };

  return <FlowView title="Create report" content={formInputs} primaryAction={primaryAction} />;
}
