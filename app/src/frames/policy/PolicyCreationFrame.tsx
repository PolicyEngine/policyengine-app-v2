import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';
import { updateLabel } from '../../reducers/policyReducer';

export default function PolicyCreationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [localLabel, setLocalLabel] = useState('');

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    dispatch(updateLabel(localLabel));
    onNavigate('next');
  }

  const formInputs = (
    <TextInput
      label="Policy title"
      placeholder="Policy name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create a policy',
    onClick: submissionHandler,
  };

  return <FlowView title="Create a policy" content={formInputs} primaryAction={primaryAction} />;
}
