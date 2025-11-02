import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HouseholdAdapter } from '@/adapters';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { isGeographicMetadataWithAssociation, useUserGeographics } from '@/hooks/useUserGeographic';
import { isHouseholdMetadataWithAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import {
  createPopulationAtPosition,
  selectPopulationAtPosition,
  setGeographyAtPosition,
  setHouseholdAtPosition,
} from '@/reducers/populationReducer';
import { selectActiveSimulationPosition } from '@/reducers/reportReducer';
import { selectSimulationAtPosition } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { getPopulationLabel, getSimulationLabel } from '@/utils/populationCompatibility';
import { findMatchingPopulation } from '@/utils/populationMatching';
import {
  getPopulationLockConfig,
  getPopulationSelectionSubtitle,
  getPopulationSelectionTitle,
} from '@/utils/reportPopulationLock';

type SetupAction = 'createNew' | 'loadExisting' | 'copyExisting';

export default function SimulationSetupPopulationFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const userId = MOCK_USER_ID.toString();
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

  // Fetch ALL user populations (mimicking the policy pattern)
  const { data: householdData } = useUserHouseholds(userId);
  const { data: geographicData } = useUserGeographics(userId);

  // Determine if population selection should be locked
  const { shouldLock: shouldLockToOtherPopulation } = getPopulationLockConfig(
    mode,
    otherSimulation,
    otherPopulation
  );

  // Auto-select and populate the locked population when in locked mode
  useEffect(() => {
    if (!shouldLockToOtherPopulation || !otherSimulation?.populationId) {
      return;
    }

    // Find the matching population from fetched data
    const matchedPopulation = findMatchingPopulation(
      otherSimulation,
      householdData,
      geographicData
    );

    if (!matchedPopulation) {
      return;
    }

    // Populate Redux with the matched population (mimicking SimulationSelectExistingPopulationFrame)
    if (isHouseholdMetadataWithAssociation(matchedPopulation)) {
      // Handle household population
      const householdToSet = HouseholdAdapter.fromMetadata(matchedPopulation.household!);

      dispatch(
        createPopulationAtPosition({
          position: currentPosition,
          population: {
            label: matchedPopulation.association?.label || '',
            isCreated: true,
            household: null,
            geography: null,
          },
        })
      );

      dispatch(
        setHouseholdAtPosition({
          position: currentPosition,
          household: householdToSet,
        })
      );
    } else if (isGeographicMetadataWithAssociation(matchedPopulation)) {
      // Handle geographic population
      dispatch(
        createPopulationAtPosition({
          position: currentPosition,
          population: {
            label: matchedPopulation.association?.label || '',
            isCreated: true,
            household: null,
            geography: null,
          },
        })
      );

      dispatch(
        setGeographyAtPosition({
          position: currentPosition,
          geography: matchedPopulation.geography!,
        })
      );
    }
  }, [
    shouldLockToOtherPopulation,
    otherSimulation,
    householdData,
    geographicData,
    currentPosition,
    dispatch,
  ]);

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    setSelectedAction('loadExisting');
  }

  function handleClickCopyExisting() {
    // The population is already populated in Redux by the useEffect above
    // We just need to set the action and navigate
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
      title: `Use household(s) from ${getSimulationLabel(otherSimulation)}`,
      description: `Household(s): ${getPopulationLabel(otherPopulation)}`,
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
