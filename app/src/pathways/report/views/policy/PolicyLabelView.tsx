/**
 * PolicyLabelView - View for setting policy label
 * Duplicated from PolicyCreationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { PathwayMode } from '@/types/pathwayModes/PathwayMode';

interface PolicyLabelViewProps {
  label: string | null;
  mode: PathwayMode;
  simulationIndex?: 0 | 1; // Required if mode='report', ignored if mode='standalone'
  reportLabel?: string | null; // Optional for report context
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
}

export default function PolicyLabelView({
  label,
  mode,
  simulationIndex,
  reportLabel = null,
  onUpdateLabel,
  onNext,
}: PolicyLabelViewProps) {
  // Validate that required props are present in report mode
  if (mode === 'report' && simulationIndex === undefined) {
    throw new Error('[PolicyLabelView] simulationIndex is required when mode is "report"');
  }

  // Generate default label based on context
  const getDefaultLabel = () => {
    if (mode === 'standalone') {
      return 'My policy';
    }
    // mode === 'report'
    const baseName = simulationIndex === 0 ? 'baseline policy' : 'reform policy';
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
