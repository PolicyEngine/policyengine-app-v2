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

  // Determine if simulation2 is optional based on population type
  // Household reports: simulation2 is optional (single-sim allowed)
  // Geography reports: simulation2 is required (comparison only)
  const isHouseholdReport = simulation1?.populationType === 'household';
  const isSimulation2Optional = isHouseholdReport;

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
      title: simulation1Configured
        ? `Simulation 1: ${simulation1?.label || simulation1?.id || 'Configured'}`
        : 'Add a first simulation',
      description: simulation1Configured
        ? `Policy #${simulation1?.policyId} • Population #${simulation1?.populationId}`
        : 'Select a simulation simulation',
      onClick: handleSimulation1Select,
      isSelected: selectedCard === 'simulation1',
      isFulfilled: simulation1Configured,
      isDisabled: false,
    },
    {
      title: simulation2Configured
        ? `Simulation 2: ${simulation2?.label || simulation2?.id || 'Configured'}`
        : isSimulation2Optional
          ? 'Add a simulation to compare to (optional)'
          : 'Add a second simulation',
      description: simulation2Configured
        ? `Policy #${simulation2?.policyId} • Population #${simulation2?.populationId}`
        : isSimulation2Optional
          ? 'Optional: choose another simulation to compare'
          : 'Choose another simulation to compare against',
      onClick: handleSimulation2Select,
      isSelected: selectedCard === 'simulation2',
      isFulfilled: simulation2Configured,
      isDisabled: false,
    },
  ];

  // Determine if we can proceed to submission
  // Household reports: Only simulation1 required (simulation2 optional)
  // Geography reports: Both simulations required
  const canProceed: boolean = simulation1Configured && (isSimulation2Optional || simulation2Configured);

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    // Allow setting up simulation1 if selected and not configured
    if (selectedCard === 'simulation1' && !simulation1Configured) {
      return {
        label: 'Setup first simulation',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Allow setting up simulation2 if selected and not configured
    else if (selectedCard === 'simulation2' && !simulation2Configured) {
      return {
        label: 'Setup second simulation',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Allow proceeding if:
    // - Household report: simulation1 configured (simulation2 optional)
    // - Geography report: both simulations configured
    else if (canProceed) {
      return {
        label: 'Next',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Disable next button if requirements not met
    return {
      label: 'Next',
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
