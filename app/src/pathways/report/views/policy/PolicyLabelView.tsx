/**
 * PolicyLabelView - View for setting policy label
 * Duplicated from PolicyCreationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';

interface PolicyLabelViewProps {
  label: string | null;
  simulationIndex: 0 | 1;
  reportLabel: string | null;
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
}

export default function PolicyLabelView({
  label,
  simulationIndex,
  reportLabel,
  onUpdateLabel,
  onNext,
}: PolicyLabelViewProps) {
  // Generate default label based on context
  const getDefaultLabel = () => {
    if (reportLabel) {
      // Report mode WITH report name: prefix with report name
      const baseName = simulationIndex === 0 ? 'baseline policy' : 'reform policy';
      return `${reportLabel} ${baseName}`;
    }
    // All other cases: use standalone label
    const baseName = simulationIndex === 0 ? 'Baseline policy' : 'Reform policy';
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
