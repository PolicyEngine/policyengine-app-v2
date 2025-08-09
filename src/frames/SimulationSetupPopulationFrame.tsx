import FlowView, { ButtonConfig } from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSetupPopulationFrame({ onNavigate }: FlowComponentProps) {
  function onClickCreateNew() {
    onNavigate('createNew');
  }

  function onClickExisting() {
    onNavigate('loadExisting');
  }

  const selectionCards = [
    {
      title: 'Load existing population',
      description: 'Use a population you have already created',
      onClick: onClickExisting,
    },
    {
      title: 'Create new population',
      description: 'Build a new population',
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
      title="Select Population"
      variant="selection"
      selectionCards={selectionCards}
      buttons={buttons}
    />
  );
}
