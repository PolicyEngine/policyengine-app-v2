import { useState } from 'react';
import { Stack } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { ButtonPanelVariant } from '@/components/flowView';
import { MOCK_USER_ID } from '@/constants';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { SimulationStateProps } from '@/types/pathwayState';
import DefaultBaselineOption from '../components/DefaultBaselineOption';

type SetupAction = 'createNew' | 'loadExisting' | 'defaultBaseline';

interface ReportSimulationSelectionViewProps {
  simulationIndex: 0 | 1;
  countryId: string;
  currentLawId: number;
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onSelectDefaultBaseline?: (simulationState: SimulationStateProps, simulationId: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSimulationSelectionView({
  simulationIndex,
  countryId,
  currentLawId,
  onCreateNew,
  onLoadExisting,
  onSelectDefaultBaseline,
  onBack,
  onCancel,
}: ReportSimulationSelectionViewProps) {
  const userId = MOCK_USER_ID.toString();
  const { data: userSimulations } = useUserSimulations(userId);
  const hasExistingSimulations = (userSimulations?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  const isBaseline = simulationIndex === 0;

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    if (hasExistingSimulations) {
      setSelectedAction('loadExisting');
    }
  }

  // DefaultBaselineOption handles its own creation - this just passes through
  function handleSelectDefaultBaseline(simulationState: SimulationStateProps, simulationId: string) {
    if (onSelectDefaultBaseline) {
      onSelectDefaultBaseline(simulationState, simulationId);
    }
  }

  function handleClickSubmit() {
    if (selectedAction === 'createNew') {
      onCreateNew();
    } else if (selectedAction === 'loadExisting') {
      onLoadExisting();
    }
    // Note: defaultBaseline is handled directly by DefaultBaselineOption
  }

  const buttonPanelCards = [
    // Only show "Load existing" if user has existing simulations
    ...(hasExistingSimulations ? [{
      title: 'Load existing simulation',
      description: 'Use a simulation you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    }] : []),
    {
      title: 'Create new simulation',
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

  // For baseline simulation, combine default baseline option with other cards
  if (isBaseline) {
    return (
      <PathwayView
        title="Select simulation"
        content={
          <Stack>
            <DefaultBaselineOption
              countryId={countryId}
              currentLawId={currentLawId}
              onSelect={handleSelectDefaultBaseline}
            />
            <ButtonPanelVariant cards={buttonPanelCards} />
          </Stack>
        }
        primaryAction={primaryAction}
        backAction={onBack ? { onClick: onBack } : undefined}
        cancelAction={onCancel ? { onClick: onCancel } : undefined}
      />
    );
  }

  // For reform simulation, just show the standard button panel
  return (
    <PathwayView
      title="Select simulation"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
