import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { selectPopulationAtPosition } from '@/reducers/populationReducer';
import { selectActiveSimulationPosition } from '@/reducers/reportReducer';
import { selectSimulationAtPosition } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { getPopulationLabel, getSimulationLabel } from '@/utils/populationCompatibility';
import { copyPopulationToPosition } from '@/utils/populationCopy';
import {
  getPopulationLockConfig,
  getPopulationSelectionTitle,
  getPopulationSelectionSubtitle,
} from '@/utils/reportPopulationLock';

type SetupAction = 'createNew' | 'loadExisting' | 'copyExisting';

export default function SimulationSetupPopulationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  // Get current mode and position information
  const mode = useSelector((state: RootState) => state.report.mode);
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const activeSimulationPosition = useSelector((state: RootState) =>
    selectActiveSimulationPosition(state)
  );

  // Get the other simulation and its population to check if we should lock
  const otherPosition = activeSimulationPosition === 0 ? 1 : 0;
  const otherSimulation = useSelector((state: RootState) =>
    selectSimulationAtPosition(state, otherPosition)
  );
  const otherPopulation = useSelector((state: RootState) =>
    selectPopulationAtPosition(state, otherPosition)
  );

  // Determine if population selection should be locked
  const { shouldLock: shouldLockToOtherPopulation } = getPopulationLockConfig(
    mode,
    otherSimulation,
    otherPopulation
  );

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickCopyExisting() {
    if (!otherPopulation) return;

    // Copy the population and set the action
    copyPopulationToPosition(dispatch, otherPopulation, currentPosition);
    setSelectedAction('copyExisting');
  }

  function handleClickSubmit() {
    if (selectedAction) {
      onNavigate(selectedAction);
    }
  }

  // Define card arrays separately for clarity
  const lockedCards = [
    // Card 1: Load Existing Population (disabled)
    {
      title: 'Load Existing Population',
      description:
        'Cannot load a different population when another simulation is already configured',
      onClick: handleClickExisting,
      isSelected: false,
      isDisabled: true,
    },
    // Card 2: Create New Population (disabled)
    {
      title: 'Create New Population',
      description:
        'Cannot create a new population when another simulation is already configured',
      onClick: handleClickCreateNew,
      isSelected: false,
      isDisabled: true,
    },
    // Card 3: Use Population from Other Simulation (enabled)
    {
      title: `Use population from ${getSimulationLabel(otherSimulation)}`,
      description: `Population: ${getPopulationLabel(otherPopulation)}`,
      onClick: handleClickCopyExisting,
      isSelected: selectedAction === 'copyExisting',
      isDisabled: false,
    },
  ];

  const normalCards = [
    {
      title: 'Load Existing Population',
      description: 'Use a population you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create New Population',
      description: 'Build a new population',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
  ];

  // Select appropriate cards based on lock state
  const buttonPanelCards = shouldLockToOtherPopulation ? lockedCards : normalCards;

  const viewTitle = getPopulationSelectionTitle(shouldLockToOtherPopulation);
  const viewSubtitle = getPopulationSelectionSubtitle(shouldLockToOtherPopulation);

  const primaryAction = {
    label: 'Next',
    onClick: handleClickSubmit,
    isDisabled: shouldLockToOtherPopulation ? false : !selectedAction,
  };

  return (
    <FlowView
      title={viewTitle}
      subtitle={viewSubtitle}
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
    />
  );
}
