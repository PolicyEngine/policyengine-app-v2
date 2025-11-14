/**
 * SimulationLabelView - View for setting simulation label
 * Duplicated from SimulationCreationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';

interface SimulationLabelViewProps {
  label: string | null;
  simulationIndex: 0 | 1;
  reportLabel: string | null;
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
}

export default function SimulationLabelView({
  label,
  simulationIndex,
  reportLabel,
  onUpdateLabel,
  onNext,
}: SimulationLabelViewProps) {
  // Generate default label based on context
  const getDefaultLabel = () => {
    if (reportLabel) {
      // Report mode WITH report name: prefix with report name
      const baseName = simulationIndex === 0 ? 'baseline simulation' : 'reform simulation';
      return `${reportLabel} ${baseName}`;
    }
    // All other cases: use standalone label
    const baseName = simulationIndex === 0 ? 'Baseline simulation' : 'Reform simulation';
    return baseName;
  };

  const [localLabel, setLocalLabel] = useState(label || getDefaultLabel());

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    onUpdateLabel(localLabel);
    onNext();
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
