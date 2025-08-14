import FlowView from '@/components/common/FlowView';
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

  // Note: This uses cancel-only pattern temporarily. We'll want to modify this as we rope in population flow.

  return (
    <FlowView
      title="Select Population"
      variant="selection"
      selectionCards={selectionCards}
      buttonPreset="cancel-only"
    />
  );
}
