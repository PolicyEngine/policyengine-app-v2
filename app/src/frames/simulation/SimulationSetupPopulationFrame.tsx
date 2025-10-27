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

type SetupAction = 'createNew' | 'loadExisting';

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

  function handleCopyPopulation() {
    if (!otherPopulation) return;

    copyPopulationToPosition(dispatch, otherPopulation, currentPosition);

    // Navigate back to SimulationSetupFrame
    // The effect in SimulationSetupFrame will detect the population
    // and automatically update the simulation with populationId
    onNavigate('loadExisting');
  }

  function handleClickSubmit() {
    if (shouldLockToOtherPopulation) {
      handleCopyPopulation();
    } else if (selectedAction) {
      onNavigate(selectedAction);
    }
  }

  const buttonPanelCards = [
    {
      title: shouldLockToOtherPopulation
        ? `Use population from ${getSimulationLabel(otherSimulation)}`
        : 'Load Existing Population',
      description: shouldLockToOtherPopulation
        ? `Population: ${getPopulationLabel(otherPopulation)}`
        : 'Use a population you have already created',
      onClick: shouldLockToOtherPopulation ? handleCopyPopulation : handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create New Population',
      description: shouldLockToOtherPopulation
        ? 'Cannot create a new population when another simulation is already configured'
        : 'Build a new population',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
      isDisabled: shouldLockToOtherPopulation ? true : undefined,
    },
  ];

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
