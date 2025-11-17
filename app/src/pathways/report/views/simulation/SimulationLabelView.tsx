/**
 * SimulationLabelView - View for setting simulation label
 * Duplicated from SimulationCreationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { PathwayMode } from '@/types/pathwayModes/PathwayMode';

interface SimulationLabelViewProps {
  label: string | null;
  mode: PathwayMode;
  simulationIndex?: 0 | 1; // Required if mode='report', ignored if mode='standalone'
  reportLabel?: string | null; // Optional for report context
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
}

export default function SimulationLabelView({
  label,
  mode,
  simulationIndex,
  reportLabel = null,
  onUpdateLabel,
  onNext,
}: SimulationLabelViewProps) {
  // Validate that required props are present in report mode
  if (mode === 'report' && simulationIndex === undefined) {
    throw new Error('[SimulationLabelView] simulationIndex is required when mode is "report"');
  }

  // Generate default label based on context
  const getDefaultLabel = () => {
    if (mode === 'standalone') {
      return 'My simulation';
    }
    // mode === 'report'
    const baseName = simulationIndex === 0 ? 'baseline simulation' : 'reform simulation';
    return reportLabel ? `${reportLabel} ${baseName}` : `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`;
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
