/**
 * SimulationLabelView - View for setting simulation label
 * Duplicated from SimulationCreationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { Input } from '@/components/ui';
import PathwayView from '@/components/common/PathwayView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { PathwayMode } from '@/types/pathwayModes/PathwayMode';

interface SimulationLabelViewProps {
  label: string | null;
  mode: PathwayMode;
  simulationIndex?: 0 | 1; // Required if mode='report', ignored if mode='standalone'
  reportLabel?: string | null; // Optional for report context
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationLabelView({
  label,
  mode,
  simulationIndex,
  reportLabel = null,
  onUpdateLabel,
  onNext,
  onBack,
  onCancel,
}: SimulationLabelViewProps) {
  // Validate that required props are present in report mode
  if (mode === 'report' && simulationIndex === undefined) {
    throw new Error('[SimulationLabelView] simulationIndex is required when mode is "report"');
  }

  const countryId = useCurrentCountry();
  const initializeText = countryId === 'uk' ? 'Initialise' : 'Initialize';

  // Generate default label based on context
  const getDefaultLabel = () => {
    if (mode === 'standalone') {
      return 'My simulation';
    }
    // mode === 'report'
    const baseName = simulationIndex === 0 ? 'baseline simulation' : 'reform simulation';
    return reportLabel
      ? `${reportLabel} ${baseName}`
      : `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`;
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
    <div className="tw:flex tw:flex-col tw:gap-xs">
      <label className="tw:text-sm tw:font-medium">Simulation name</label>
      <Input
        placeholder="Enter simulation name"
        value={localLabel}
        onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
      />
    </div>
  );

  const primaryAction = {
    label: `${initializeText} simulation`,
    onClick: submissionHandler,
  };

  return (
    <PathwayView
      title="Create simulation"
      content={formInputs}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
