import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';
import FlowView from '@/components/common/FlowView';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    onNavigate('next');
  }

  const formInputs = (
    <TextInput
      label="Simulation name"
      placeholder="Enter simulation name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create simulation',
    onClick: submissionHandler,
  };

  return (
    <FlowView
      title="Create simulation"
      content={formInputs}
      primaryAction={primaryAction}
    />
  );
}
