/**
 * SimulationPopulationSetupView - View for choosing how to setup population
 * Duplicated from SimulationSetupPopulationFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';
import { getCountryLabel, getRegionLabel, isNationalGeography } from '@/utils/geographyUtils';
import { getSimulationLabel } from '@/utils/populationCompatibility';
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
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationPopulationSetupView({
  isReportMode,
  otherSimulation,
  otherPopulation,
  onCreateNew,
  onLoadExisting,
  onCopyExisting,
  onBack,
  onCancel,
}: SimulationPopulationSetupViewProps) {
  const userId = MOCK_USER_ID.toString();
  const countryId = useCurrentCountry();
  const { regions } = useRegions(countryId);
  const { data: userHouseholds } = useUserHouseholds(userId);
  // Note: Geographic populations are no longer stored as user associations.
  // They are selected per-simulation. We only check for existing households.
  const hasExistingPopulations = (userHouseholds?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);

  // Determine if population selection should be locked
  const mode = isReportMode ? 'report' : 'standalone';
  const { shouldLock: shouldLockToOtherPopulation } = getPopulationLockConfig(
    mode,
    otherSimulation as any, // TODO: Type compatibility
    otherPopulation as any
  );

  function getOtherPopulationLabel(): string {
    if (otherPopulation?.label) return otherPopulation.label;
    if (otherPopulation?.household?.id) return `Household #${otherPopulation.household.id}`;
    if (otherPopulation?.geography) {
      const geo = otherPopulation.geography;
      if (isNationalGeography(geo)) return getCountryLabel(geo.countryId);
      return getRegionLabel(geo.regionCode, regions);
    }
    return 'Unknown Household(s)';
  }

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    if (hasExistingPopulations) {
      setSelectedAction('loadExisting');
    }
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
    // Card 1: Create New Population (disabled)
    {
      title: 'Create new household(s)',
      description: 'Cannot create new household(s) when another simulation is already configured',
      onClick: handleClickCreateNew,
      isSelected: false,
      isDisabled: true,
    },
    // Card 2: Use Population from Other Simulation (enabled)
    {
      title: `Use household(s) from ${getSimulationLabel(otherSimulation as any)}`,
      description: `Household(s): ${getOtherPopulationLabel()}`,
      onClick: handleClickCopyExisting,
      isSelected: selectedAction === 'copyExisting',
      isDisabled: false,
    },
    // Card 3: Load Existing Population (disabled)
    {
      title: 'Load existing household(s)',
      description:
        'Cannot load different household(s) when another simulation is already configured',
      onClick: handleClickExisting,
      isSelected: false,
      isDisabled: true,
    },
  ];

  const normalCards = [
    {
      title: 'Create new household(s)',
      description: 'Build new household(s)',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
    {
      title: 'Load existing household(s)',
      description: hasExistingPopulations
        ? 'Use household(s) you have already created'
        : 'No existing household(s) available',
      onClick: handleClickExisting,
      isSelected: selectedAction === 'loadExisting',
      isDisabled: !hasExistingPopulations,
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
    <PathwayView
      title={viewTitle}
      subtitle={viewSubtitle}
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
