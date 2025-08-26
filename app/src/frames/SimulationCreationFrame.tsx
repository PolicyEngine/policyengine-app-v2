import { useState } from 'react';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';
import { updateSimulationLabel } from '@/reducers/simulationReducer';
import { useDispatch } from 'react-redux';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  const [localLabel, setLocalLabel] = useState('');
  const dispatch = useDispatch();

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    dispatch(updateSimulationLabel(localLabel));
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

  return <FlowView title="Create simulation" content={formInputs} primaryAction={primaryAction} />;
}
