import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function SimulationSetupPopulationFrame() {
  function temporaryNullFunc() {
    return 'success';
  }

  const selectionCards = [
    {
      title: 'Load existing population',
      description: 'Use a population you have already created',
      onClick: temporaryNullFunc,
    },
    {
      title: 'Create new population',
      description: 'Build a new population',
      onClick: temporaryNullFunc,
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
