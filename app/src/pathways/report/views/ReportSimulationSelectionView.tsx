import { useState } from 'react';
import FlowView from '@/components/common/FlowView';

type SetupAction = 'createNew' | 'loadExisting';

interface ReportSimulationSelectionViewProps {
  onCreateNew: () => void;
  onLoadExisting: () => void;
}

export default function ReportSimulationSelectionView({
  onCreateNew,
  onLoadExisting,
}: ReportSimulationSelectionViewProps) {
  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickSubmit() {
    if (selectedAction === 'createNew') {
      onCreateNew();
    } else if (selectedAction === 'loadExisting') {
      onLoadExisting();
    }
  }

  const buttonPanelCards = [
    {
      title: 'Load Existing Simulation',
      description: 'Use a simulation you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create New Simulation',
      description: 'Build a new simulation',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
  ];

  const primaryAction = {
    label: 'Next',
    onClick: handleClickSubmit,
    isDisabled: !selectedAction,
  };

  return (
    <FlowView
      title="Select Simulation"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
    />
  );
}
