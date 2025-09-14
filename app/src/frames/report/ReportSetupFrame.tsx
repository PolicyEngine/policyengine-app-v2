import { useState } from 'react';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';

type SimulationCard = 'simulation1' | 'simulation2';

interface ReportSetupFrameProps extends FlowComponentProps {}

export default function ReportSetupFrame({
  onNavigate,
}: ReportSetupFrameProps) {
  const [selectedCard, setSelectedCard] = useState<SimulationCard | null>(null);
  const [simulation1Configured, setSimulation1Configured] = useState(false);
  const [simulation2Configured, setSimulation2Configured] = useState(false);

  const handleSimulation1Select = () => {
    setSelectedCard('simulation1');
    console.log('Adding simulation 1');
  };

  const handleSimulation2Select = () => {
    setSelectedCard('simulation2');
    console.log('Adding simulation 2');
  };

  const handleNext = () => {
    if (selectedCard === 'simulation1' && !simulation1Configured) {
      console.log('Setting up simulation 1');
      // TODO: Navigate to simulation setup flow
      // For now, just mark as configured for testing
      setSimulation1Configured(true);
    } else if (selectedCard === 'simulation2' && !simulation2Configured) {
      console.log('Setting up simulation 2');
      // TODO: Navigate to simulation setup flow
      // For now, just mark as configured for testing
      setSimulation2Configured(true);
    } else if (canProceed) {
      console.log('Both simulations configured, proceeding to next step');
      onNavigate('next');
    }
  };

  const setupConditionCards = [
    {
      title: 'Add a first simulation',
      description: 'Select a simulation simulation',
      onClick: handleSimulation1Select,
      isSelected: selectedCard === 'simulation1',
      isFulfilled: simulation1Configured,
      isDisabled: false,
    },
    {
      title: 'Add a second simulation',
      description: 'Choose another simulation to compare against',
      onClick: handleSimulation2Select,
      isSelected: selectedCard === 'simulation2',
      isFulfilled: simulation2Configured,
      isDisabled: false,
    },
  ];

  // Determine if both simulations are configured
  const canProceed: boolean = simulation1Configured && simulation2Configured;

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    if (selectedCard === 'simulation1' && !simulation1Configured) {
      return {
        label: 'Setup first simulation',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (selectedCard === 'simulation2' && !simulation2Configured) {
      return {
        label: 'Setup second simulation',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (canProceed) {
      return {
        label: 'Next',
        onClick: handleNext,
        isDisabled: false,
      };
    }
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