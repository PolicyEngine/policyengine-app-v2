import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { FlowComponentProps } from '@/types/flow';
import IngredientCreationStartView from '../components/IngredientCreationStartView';

export default function SimulationCreationFrame({ onNavigate }: FlowComponentProps) {
  // Manage local label state for the simulation name
  const [localLabel, setLocalLabel] = useState('');

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  const formInputs = (
    <TextInput
      label="Simulation name"
      placeholder="Enter simulation name"
      value={localLabel}
      onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
    />
  );

  function submissionHandler() {
    // For now, we just proceed to the next frame
    // The label will be handled at the UserSimulation level later
    onNavigate('next');
  }

  return (
    <IngredientCreationStartView
      title="Create simulation"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}
