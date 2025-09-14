import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';
import { clearReport } from '@/reducers/reportReducer';

export default function ReportCreationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [localLabel, setLocalLabel] = useState('');

  // Clear any existing report data when mounting
  useState(() => {
    dispatch(clearReport());
  });

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    // For now, just navigate to next
    // Will add label storage to report reducer in future iteration
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