import { FlowComponentProps } from '@/types/flow';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';
import { useState } from "react";

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
      isSelected: selectedAction === "loadExisting",
    },
    {
      title: 'Create new policy',
      description: 'Build a new policy',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === "createNew",
    },
  ];

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
    {
      label: 'Next',
      variant: selectedAction ? 'filled': 'disabled',
      onClick: () => handleClickSubmit()
    }
  ];

  return (
    <FlowView
      title="Select Policy"
      variant="selection"
      selectionCards={selectionCards}
      buttons={buttons}
    />
  );
}
