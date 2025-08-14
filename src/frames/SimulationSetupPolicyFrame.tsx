import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';

type SetupAction = 'createNew' | 'loadExisting';

export default function SimulationSetupPolicyFrame({ onNavigate }: FlowComponentProps) {
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

  const selectionCards = [
    {
      title: 'Load existing policy',
      description: 'Use a policy you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create new policy',
      description: 'Build a new policy',
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
      title="Select Policy"
      variant="selection"
      selectionCards={selectionCards}
      primaryAction={primaryAction}
    />
  );
}
