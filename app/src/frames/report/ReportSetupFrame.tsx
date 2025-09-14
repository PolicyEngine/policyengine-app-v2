import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { FlowComponentProps } from '@/types/flow';
import { RootState } from '@/store';
import {
  createSimulation,
  selectAllSimulations,
  setActiveSimulation
} from '@/reducers/simulationsReducer';

type SimulationCard = 'simulation1' | 'simulation2';

interface ReportSetupFrameProps extends FlowComponentProps {}

export default function ReportSetupFrame({
  onNavigate,
}: ReportSetupFrameProps) {
  const dispatch = useDispatch();
  const [selectedCard, setSelectedCard] = useState<SimulationCard | null>(null);
  const [simulation1Id, setSimulation1Id] = useState<string | null>(null);
  const [simulation2Id, setSimulation2Id] = useState<string | null>(null);

  // Get all simulations from the store to check their configuration status
  const simulations = useSelector((state: RootState) => selectAllSimulations(state));

  // Find simulations by their stored IDs
  const simulation1 = simulation1Id ? simulations.find(s =>
    (s.id === simulation1Id) || (simulation1Id.startsWith('temp-') && simulations.indexOf(s).toString() === simulation1Id.split('-')[1])
  ) : null;

  const simulation2 = simulation2Id ? simulations.find(s =>
    (s.id === simulation2Id) || (simulation2Id.startsWith('temp-') && simulations.indexOf(s).toString() === simulation2Id.split('-')[1])
  ) : null;

  // Check if simulations are fully configured
  const simulation1Configured = !!(simulation1?.policyId && simulation1?.populationId);
  const simulation2Configured = !!(simulation2?.policyId && simulation2?.populationId);

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
      // Create or set active simulation for slot 1
      if (!simulation1Id) {
        dispatch(createSimulation());
        // Store the index as temp ID since we don't have the actual ID yet
        setSimulation1Id(`temp-${simulations.length}`);
      } else {
        // Set existing simulation as active
        const simIndex = simulations.findIndex(s =>
          (s.id === simulation1Id) || (simulation1Id.startsWith('temp-') && simulations.indexOf(s).toString() === simulation1Id.split('-')[1])
        );
        if (simIndex >= 0) {
          dispatch(setActiveSimulation(simulations[simIndex].id || `temp-${simIndex}`));
        }
      }
      // Navigate to simulation selection frame
      onNavigate('setupSimulation1');
    } else if (selectedCard === 'simulation2') {
      console.log('Setting up simulation 2');
      // Create or set active simulation for slot 2
      if (!simulation2Id) {
        dispatch(createSimulation());
        // Store the index as temp ID since we don't have the actual ID yet
        setSimulation2Id(`temp-${simulations.length}`);
      } else {
        // Set existing simulation as active
        const simIndex = simulations.findIndex(s =>
          (s.id === simulation2Id) || (simulation2Id.startsWith('temp-') && simulations.indexOf(s).toString() === simulation2Id.split('-')[1])
        );
        if (simIndex >= 0) {
          dispatch(setActiveSimulation(simulations[simIndex].id || `temp-${simIndex}`));
        }
      }
      // Navigate to simulation selection frame
      onNavigate('setupSimulation2');
    } else if (canProceed) {
      console.log('Both simulations configured, proceeding to next step');
      onNavigate('next');
    }
  };

  const setupConditionCards = [
    {
      title: simulation1Configured ? `Simulation 1: ${simulation1?.label || simulation1?.id || 'Configured'}` : 'Add a first simulation',
      description: simulation1Configured
        ? `Policy #${simulation1?.policyId} • Population #${simulation1?.populationId}`
        : 'Select a simulation simulation',
      onClick: handleSimulation1Select,
      isSelected: selectedCard === 'simulation1',
      isFulfilled: simulation1Configured,
      isDisabled: false,
    },
    {
      title: simulation2Configured ? `Simulation 2: ${simulation2?.label || simulation2?.id || 'Configured'}` : 'Add a second simulation',
      description: simulation2Configured
        ? `Policy #${simulation2?.policyId} • Population #${simulation2?.populationId}`
        : 'Choose another simulation to compare against',
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