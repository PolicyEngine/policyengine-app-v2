import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import { isGeographicMetadataWithAssociation, useUserGeographics } from '@/hooks/useUserGeographic';
import { isHouseholdMetadataWithAssociation, useUserHouseholds } from '@/hooks/useUserHousehold';
import { ReportStateProps, SimulationStateProps } from '@/types/pathwayState';
import { Simulation } from '@/types/ingredients/Simulation';
import { findMatchingPopulation } from '@/utils/populationMatching';
import { HouseholdAdapter } from '@/adapters';
import { isSimulationConfigured } from '@/utils/validation/ingredientValidation';

type SimulationCard = 'simulation1' | 'simulation2';

interface ReportSetupViewProps {
  reportState: ReportStateProps;
  onNavigateToSimulationSelection: (simulationIndex: 0 | 1) => void;
  onNext: () => void;
  onPrefillPopulation2: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSetupView({
  reportState,
  onNavigateToSimulationSelection,
  onNext,
  onPrefillPopulation2,
  onBack,
  onCancel,
}: ReportSetupViewProps) {
  const [selectedCard, setSelectedCard] = useState<SimulationCard | null>(null);

  // Get simulation state from report
  const simulation1 = reportState.simulations[0];
  const simulation2 = reportState.simulations[1];

  // Fetch population data for pre-filling simulation 2
  const userId = MOCK_USER_ID.toString();
  const { data: householdData } = useUserHouseholds(userId);
  const { data: geographicData } = useUserGeographics(userId);

  // Check if simulations are fully configured
  const simulation1Configured = isSimulationConfigured(simulation1);
  const simulation2Configured = isSimulationConfigured(simulation2);

  // Check if population data is loaded (needed for simulation2 prefill)
  const isPopulationDataLoaded = householdData !== undefined && geographicData !== undefined;

  // Determine if simulation2 is optional based on population type of simulation1
  const isHouseholdReport = simulation1?.population.type === 'household';
  const isSimulation2Optional = simulation1Configured && isHouseholdReport;

  const handleSimulation1Select = () => {
    setSelectedCard('simulation1');
    console.log('Adding simulation 1');
  };

  const handleSimulation2Select = () => {
    setSelectedCard('simulation2');
    console.log('Adding simulation 2');
  };

  const handleNext = () => {
    if (selectedCard === 'simulation1') {
      console.log('Setting up simulation 1');
      onNavigateToSimulationSelection(0);
    } else if (selectedCard === 'simulation2') {
      console.log('Setting up simulation 2');
      // PRE-FILL POPULATION FROM SIMULATION 1
      onPrefillPopulation2();
      onNavigateToSimulationSelection(1);
    } else if (canProceed) {
      console.log('Both simulations configured, proceeding to next step');
      onNext();
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
  const canProceed: boolean =
    simulation1Configured && (isSimulation2Optional || simulation2Configured);

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    // Allow setting up simulation1 if selected and not configured
    if (selectedCard === 'simulation1' && !simulation1Configured) {
      return {
        label: 'Configure baseline simulation ',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Allow setting up simulation2 if selected and not configured
    else if (selectedCard === 'simulation2' && !simulation2Configured) {
      return {
        label: 'Configure comparison simulation ',
        onClick: handleNext,
        isDisabled: !isPopulationDataLoaded, // Disable if data not loaded
      };
    }
    // Allow proceeding if requirements met
    else if (canProceed) {
      return {
        label: 'Review report ',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Disable if requirements not met - show uppermost option (baseline)
    return {
      label: 'Configure baseline simulation ',
      onClick: handleNext,
      isDisabled: true,
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <PathwayView
      title="Configure report"
      variant="setupConditions"
      setupConditionCards={setupConditionCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}

/**
 * Get title for baseline simulation card
 */
function getBaselineCardTitle(simulation: SimulationStateProps | null, isConfigured: boolean): string {
  if (isConfigured) {
    const label = simulation?.label || simulation?.id || 'Configured';
    return `Baseline: ${label}`;
  }
  return 'Baseline simulation';
}

/**
 * Get description for baseline simulation card
 */
function getBaselineCardDescription(simulation: SimulationStateProps | null, isConfigured: boolean): string {
  if (isConfigured) {
    const policyId = simulation?.policy.id || 'N/A';
    const populationId = simulation?.population.household?.id || simulation?.population.geography?.id || 'N/A';
    return `Policy #${policyId} • Household(s) #${populationId}`;
  }
  return 'Select your baseline simulation';
}

/**
 * Get title for comparison simulation card
 */
function getComparisonCardTitle(
  simulation: SimulationStateProps | null,
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
  simulation: SimulationStateProps | null,
  isConfigured: boolean,
  baselineConfigured: boolean,
  isOptional: boolean,
  dataLoading: boolean
): string {
  // If configured, show simulation details
  if (isConfigured) {
    const policyId = simulation?.policy.id || 'N/A';
    const populationId = simulation?.population.household?.id || simulation?.population.geography?.id || 'N/A';
    return `Policy #${policyId} • Household(s) #${populationId}`;
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
