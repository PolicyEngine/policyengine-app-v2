import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useUserSimulations } from '@/hooks/useUserSimulations';

type SetupAction = 'createNew' | 'loadExisting';

interface ReportSimulationSelectionViewProps {
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSimulationSelectionView({
  onCreateNew,
  onLoadExisting,
  onBack,
  onCancel,
}: ReportSimulationSelectionViewProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: userSimulations } = useUserSimulations(userId);
  const hasExistingSimulations = (userSimulations?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    if (hasExistingSimulations) {
      setSelectedAction('loadExisting');
    }
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
      title: 'Load existing simulation',
      description: hasExistingSimulations
        ? 'Use a simulation you have already created'
        : 'No existing simulations available',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
      isDisabled: !hasExistingSimulations,
    },
    {
      title: 'Create new simulation',
      description: 'Build a new simulation',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
  ];

  const primaryAction = {
    label: 'Next ',
    onClick: handleClickSubmit,
    isDisabled: !selectedAction,
  };

  return (
    <FlowView
      title="Select simulation"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
