import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { setActiveSimulationPosition, setMode } from '@/reducers/reportReducer';
import {
  createSimulationAtPosition,
  selectSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';

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

  // Check if simulations are fully configured
  const simulation1Configured = !!(simulation1?.policyId && simulation1?.populationId);
  const simulation2Configured = !!(simulation2?.policyId && simulation2?.populationId);

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
        isSimulation2Optional
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
        isDisabled: false,
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
    return `Policy #${simulation?.policyId} • Population #${simulation?.populationId}`;
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
  isOptional: boolean
): string {
  // If configured, show simulation details
  if (isConfigured) {
    return `Policy #${simulation?.policyId} • Population #${simulation?.populationId}`;
  }

  // If baseline not configured yet, show waiting message
  if (!baselineConfigured) {
    return 'Set up your baseline simulation first';
  }

  // Baseline configured: show optional or required message
  if (isOptional) {
    return 'Optional: add a second simulation to compare';
  }
  return 'Required: add a second simulation to compare';
}
