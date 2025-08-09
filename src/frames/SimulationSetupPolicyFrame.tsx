import { FlowComponentProps } from '@/types/flow';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function SimulationSetupPolicyFrame({ onNavigate }: FlowComponentProps) {
  function onClickCreateNew() {
    onNavigate('createNew');
  }

  function onClickExisting() {
    onNavigate('loadExisting');
  }

  const selectionCards = [
    {
      title: 'Load existing policy',
      description: 'Use a policy you have already created',
      onClick: onClickExisting,
    },
    {
      title: 'Create new policy',
      description: 'Build a new policy',
      onClick: onClickCreateNew,
    },
  ];

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
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
