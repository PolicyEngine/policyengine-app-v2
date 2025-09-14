import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';

type SetupAction = 'createNew' | 'loadExisting';

export default function ReportSelectSimulationFrame({ onNavigate }: FlowComponentProps) {
  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickSubmit() {
    if (selectedAction) {
      onNavigate(selectedAction);
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