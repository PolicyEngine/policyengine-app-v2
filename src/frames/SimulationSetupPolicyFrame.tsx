import { FlowComponentProps } from '@/types/flow';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';
import { useState } from "react";

// TODO: Determine enum syntax for setupActions
const setupActions = ""

export default function SimulationSetupPolicyFrame({ onNavigate }: FlowComponentProps) {

  // TODO: Fix typing
  const [selectedAction, setSelectedAction]: setupActions | null = useState(null);

  function handleClickCreateNew() {
    setSelectedAction("createNew");
  }

  function handleClickExisting() {
    setSelectedAction("loadExisting");
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
    },
    {
      title: 'Create new policy',
      description: 'Build a new policy',
      onClick: handleClickCreateNew,
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
      variant: 'filled',
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
