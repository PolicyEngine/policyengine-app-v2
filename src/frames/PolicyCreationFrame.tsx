import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';
import { updateLabel } from '../reducers/policyReducer';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

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

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
    {
      label: 'Create a policy',
      variant: 'filled',
      onClick: submissionHandler,
    },
  ];

  return (
    <FlowView
      title="Create a policy"
      content={formInputs}
      buttons={buttons}
    />
  );
}
