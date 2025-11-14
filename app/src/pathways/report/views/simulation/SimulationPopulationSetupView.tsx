/**
 * SimulationPopulationSetupView - View for choosing how to setup population
 * Duplicated from SimulationSetupPopulationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { SimulationStateProps, PopulationStateProps } from '@/types/pathwayState';
import { getPopulationLabel, getSimulationLabel } from '@/utils/populationCompatibility';
import {
  getPopulationLockConfig,
  getPopulationSelectionSubtitle,
  getPopulationSelectionTitle,
} from '@/utils/reportPopulationLock';

type SetupAction = 'createNew' | 'loadExisting' | 'copyExisting';

interface SimulationPopulationSetupViewProps {
  isReportMode: boolean;
  otherSimulation: SimulationStateProps | null;
  otherPopulation: PopulationStateProps | null;
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onCopyExisting: () => void;
}

export default function SimulationPopulationSetupView({
  isReportMode,
  otherSimulation,
  otherPopulation,
  onCreateNew,
  onLoadExisting,
  onCopyExisting,
}: SimulationPopulationSetupViewProps) {
  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  // Determine if population selection should be locked
  const mode = isReportMode ? 'report' : 'standalone';
  const { shouldLock: shouldLockToOtherPopulation } = getPopulationLockConfig(
    mode,
    otherSimulation as any, // TODO: Type compatibility
    otherPopulation as any
  );

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickCopyExisting() {
    setSelectedAction('copyExisting');
  }

  function handleClickSubmit() {
    if (selectedAction === 'createNew') {
      onCreateNew();
    } else if (selectedAction === 'loadExisting') {
      onLoadExisting();
    } else if (selectedAction === 'copyExisting') {
      onCopyExisting();
    }
  }

  // Define card arrays separately for clarity
  const lockedCards = [
    // Card 1: Load Existing Population (disabled)
    {
      title: 'Load Existing Household(s)',
      description:
        'Cannot load different household(s) when another simulation is already configured',
      onClick: handleClickExisting,
      isSelected: false,
      isDisabled: true,
    },
    // Card 2: Create New Population (disabled)
    {
      title: 'Create New Household(s)',
      description: 'Cannot create new household(s) when another simulation is already configured',
      onClick: handleClickCreateNew,
      isSelected: false,
      isDisabled: true,
    },
    // Card 3: Use Population from Other Simulation (enabled)
    {
      title: `Use household(s) from ${getSimulationLabel(otherSimulation as any)}`,
      description: `Household(s): ${getPopulationLabel(otherPopulation as any)}`,
      onClick: handleClickCopyExisting,
      isSelected: selectedAction === 'copyExisting',
      isDisabled: false,
    },
  ];

  const normalCards = [
    {
      title: 'Load Existing Household(s)',
      description: 'Use household(s) you have already created',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
    },
    {
      title: 'Create New Household(s)',
      description: 'Build new household(s)',
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
