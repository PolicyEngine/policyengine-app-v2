import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HouseholdAdapter } from '@/adapters';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { isGeographicMetadataWithAssociation, useUserGeographics } from '@/hooks/useUserGeographic';
import { isHouseholdMetadataWithAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import {
  createPopulationAtPosition,
  selectPopulationAtPosition,
  setGeographyAtPosition,
  setHouseholdAtPosition,
  updatePopulationAtPosition,
} from '@/reducers/populationReducer';
import { setActiveSimulationPosition, setMode } from '@/reducers/reportReducer';
import {
  createSimulationAtPosition,
  selectSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';
import { findMatchingPopulation } from '@/utils/populationMatching';

type SimulationCard = 'simulation1' | 'simulation2';

interface ReportSetupFrameProps extends FlowComponentProps {}

export default function ReportSetupFrame({ onNavigate }: ReportSetupFrameProps) {
  const dispatch = useDispatch();
  const [selectedCard, setSelectedCard] = useState<SimulationCard | null>(null);

  // Set mode to 'report' on mount
  useEffect(() => {
    dispatch(setMode('report'));
  }, [dispatch]);

  // Use position-based selectors - position IS the stable reference
  const simulation1 = useSelector((state: RootState) => selectSimulationAtPosition(state, 0));
  const simulation2 = useSelector((state: RootState) => selectSimulationAtPosition(state, 1));

  // Fetch population data for pre-filling simulation 2
  const userId = MOCK_USER_ID.toString();
  const { data: householdData } = useUserHouseholds(userId);
  const { data: geographicData } = useUserGeographics(userId);

  // Get population at position 1 to check if already filled
  const population2 = useSelector((state: RootState) => selectPopulationAtPosition(state, 1));

  // Check if simulations are fully configured
  const simulation1Configured = !!(simulation1?.policyId && simulation1?.populationId);
  const simulation2Configured = !!(simulation2?.policyId && simulation2?.populationId);

  // Check if population data is loaded (needed for simulation2 prefill)
  const isPopulationDataLoaded = householdData !== undefined && geographicData !== undefined;

  // Determine if simulation2 is optional based on population type of simulation1
  // Household reports: simulation2 is optional (single-sim allowed)
  // Geography reports: simulation2 is required (comparison only)
  // If simulation1 doesn't exist yet, we can't determine optionality
  const isHouseholdReport = simulation1?.populationType === 'household';
  const isSimulation2Optional = simulation1Configured && isHouseholdReport;

  const handleSimulation1Select = () => {
    setSelectedCard('simulation1');
    console.log('Adding simulation 1');
  };

  const handleSimulation2Select = () => {
    setSelectedCard('simulation2');
    console.log('Adding simulation 2');
  };

  /**
   * Pre-fills population for simulation 2 by copying from simulation 1.
   * Called when user clicks to setup simulation 2.
   * This ensures both simulations use the same population as required by reports.
   */
  function prefillPopulation2FromSimulation1() {
    console.log('[ReportSetupFrame] ===== PRE-FILLING POPULATION 2 =====');

    if (!simulation1?.populationId) {
      console.error('[ReportSetupFrame] Cannot prefill: simulation1 has no population');
      return;
    }

    if (population2?.isCreated) {
      console.log('[ReportSetupFrame] Population 2 already exists, skipping prefill');
      return;
    }

    console.log('[ReportSetupFrame] simulation1:', simulation1);
    console.log('[ReportSetupFrame] householdData:', householdData);
    console.log('[ReportSetupFrame] geographicData:', geographicData);

    // Find matching population from simulation1
    const matchedPopulation = findMatchingPopulation(simulation1, householdData, geographicData);

    console.log('[ReportSetupFrame] matchedPopulation:', matchedPopulation);

    if (!matchedPopulation) {
      console.error('[ReportSetupFrame] No matching population found for simulation1');
      return;
    }

    // Handle household population
    if (isHouseholdMetadataWithAssociation(matchedPopulation)) {
      console.log('[ReportSetupFrame] Pre-filling household population');
      const householdToSet = HouseholdAdapter.fromMetadata(matchedPopulation.household!);

      // Create population with isCreated: true
      dispatch(
        createPopulationAtPosition({
          position: 1,
          population: {
            label: matchedPopulation.association?.label || '',
            isCreated: true,
            household: null,
            geography: null,
          },
        })
      );

      // Set household data
      dispatch(
        setHouseholdAtPosition({
          position: 1,
          household: householdToSet,
        })
      );

      // Ensure isCreated flag is set (handles case where population already existed)
      dispatch(
        updatePopulationAtPosition({
          position: 1,
          updates: { isCreated: true },
        })
      );

      console.log('[ReportSetupFrame] Household population pre-filled successfully');
    }
    // Handle geographic population
    else if (isGeographicMetadataWithAssociation(matchedPopulation)) {
      console.log('[ReportSetupFrame] Pre-filling geographic population');

      // Create population with isCreated: true
      dispatch(
        createPopulationAtPosition({
          position: 1,
          population: {
            label: matchedPopulation.association?.label || '',
            isCreated: true,
            household: null,
            geography: null,
          },
        })
      );

      // Set geography data
      dispatch(
        setGeographyAtPosition({
          position: 1,
          geography: matchedPopulation.geography!,
        })
      );

      // Ensure isCreated flag is set (handles case where population already existed)
      dispatch(
        updatePopulationAtPosition({
          position: 1,
          updates: { isCreated: true },
        })
      );

      console.log('[ReportSetupFrame] Geographic population pre-filled successfully');
    }
  }

  const handleNext = () => {
    if (selectedCard === 'simulation1') {
      console.log('Setting up simulation 1');
      // Create simulation at position 0 if needed
      if (!simulation1) {
        dispatch(createSimulationAtPosition({ position: 0 }));
      }
      // Set position 0 as active in report reducer
      dispatch(setActiveSimulationPosition(0));
      // Navigate to simulation selection frame
      onNavigate('setupSimulation1');
    } else if (selectedCard === 'simulation2') {
      console.log('Setting up simulation 2');
      // Create simulation at position 1 if needed
      if (!simulation2) {
        dispatch(createSimulationAtPosition({ position: 1 }));
      }
      // PRE-FILL POPULATION FROM SIMULATION 1
      prefillPopulation2FromSimulation1();
      // Set position 1 as active in report reducer
      dispatch(setActiveSimulationPosition(1));
      // Navigate to simulation selection frame
      onNavigate('setupSimulation2');
    } else if (canProceed) {
      console.log('Both simulations configured, proceeding to next step');
      onNavigate('next');
    }
  };

  const setupConditionCards = [
    {
      title: getBaselineCardTitle(simulation1, simulation1Configured),
      description: getBaselineCardDescription(simulation1, simulation1Configured),
      onClick: handleSimulation1Select,
      isSelected: selectedCard === 'simulation1',
      isFulfilled: simulation1Configured,
      isDisabled: false,
    },
    {
      title: getComparisonCardTitle(
        simulation2,
        simulation2Configured,
        simulation1Configured,
        isSimulation2Optional
      ),
      description: getComparisonCardDescription(
        simulation2,
        simulation2Configured,
        simulation1Configured,
        isSimulation2Optional,
        !isPopulationDataLoaded
      ),
      onClick: handleSimulation2Select,
      isSelected: selectedCard === 'simulation2',
      isFulfilled: simulation2Configured,
      isDisabled: !simulation1Configured, // Disable until simulation1 is configured
    },
  ];

  // Determine if we can proceed to submission
  // Household reports: Only simulation1 required (simulation2 optional)
  // Geography reports: Both simulations required
  const canProceed: boolean =
    simulation1Configured && (isSimulation2Optional || simulation2Configured);

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    // Allow setting up simulation1 if selected and not configured
    if (selectedCard === 'simulation1' && !simulation1Configured) {
      return {
        label: 'Setup baseline simulation',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Allow setting up simulation2 if selected and not configured
    else if (selectedCard === 'simulation2' && !simulation2Configured) {
      return {
        label: 'Setup comparison simulation',
        onClick: handleNext,
        isDisabled: !isPopulationDataLoaded, // Disable if data not loaded
      };
    }
    // Allow proceeding if requirements met
    else if (canProceed) {
      return {
        label: 'Review report',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Disable if requirements not met
    return {
      label: 'Review report',
      onClick: handleNext,
      isDisabled: true,
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <FlowView
      title="Setup Report"
      variant="setupConditions"
      setupConditionCards={setupConditionCards}
      primaryAction={primaryAction}
    />
  );
}

/**
 * Get title for baseline simulation card
 */
function getBaselineCardTitle(simulation: Simulation | null, isConfigured: boolean): string {
  if (isConfigured) {
    const label = simulation?.label || simulation?.id || 'Configured';
    return `Baseline: ${label}`;
  }
  return 'Baseline simulation';
}

/**
 * Get description for baseline simulation card
 */
function getBaselineCardDescription(simulation: Simulation | null, isConfigured: boolean): string {
  if (isConfigured) {
    return `Policy #${simulation?.policyId} • Household(s) #${simulation?.populationId}`;
  }
  return 'Select your baseline simulation';
}

/**
 * Get title for comparison simulation card
 */
function getComparisonCardTitle(
  simulation: Simulation | null,
  isConfigured: boolean,
  baselineConfigured: boolean,
  isOptional: boolean
): string {
  // If configured, show simulation name
  if (isConfigured) {
    const label = simulation?.label || simulation?.id || 'Configured';
    return `Comparison: ${label}`;
  }

  // If baseline not configured yet, show waiting message
  if (!baselineConfigured) {
    return 'Comparison simulation · Waiting for baseline';
  }

  // Baseline configured: show optional or required
  if (isOptional) {
    return 'Comparison simulation (optional)';
  }
  return 'Comparison simulation';
}

/**
 * Get description for comparison simulation card
 */
function getComparisonCardDescription(
  simulation: Simulation | null,
  isConfigured: boolean,
  baselineConfigured: boolean,
  isOptional: boolean,
  dataLoading: boolean
): string {
  // If configured, show simulation details
  if (isConfigured) {
    return `Policy #${simulation?.policyId} • Household(s) #${simulation?.populationId}`;
  }

  // If baseline not configured yet, show waiting message
  if (!baselineConfigured) {
    return 'Set up your baseline simulation first';
  }

  // If baseline configured but data still loading, show loading message
  if (dataLoading && baselineConfigured && !isConfigured) {
    return 'Loading household data...';
  }

  // Baseline configured: show optional or required message
  if (isOptional) {
    return 'Optional: add a second simulation to compare';
  }
  return 'Required: add a second simulation to compare';
}
