import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';
import { clearReport, updateLabel } from '@/reducers/reportReducer';

export default function ReportCreationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [localLabel, setLocalLabel] = useState('');

  // Clear any existing report data when mounting
  useEffect(() => {
    dispatch(clearReport());
  }, [dispatch]);

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