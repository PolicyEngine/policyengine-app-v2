import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { EnhancedUserSimulation, useUserSimulations } from '@/hooks/useUserSimulations';
import { selectActiveSimulationPosition } from '@/reducers/reportReducer';
import { updateSimulationAtPosition } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function ReportSelectExistingSimulationFrame({ onNavigate }: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const dispatch = useDispatch();

  // Get the active simulation position from report reducer
  const activeSimulationPosition = useSelector((state: RootState) =>
    selectActiveSimulationPosition(state)
  );

  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const [localSimulation, setLocalSimulation] = useState<EnhancedUserSimulation | null>(null);

  console.log('[ReportSelectExistingSimulationFrame] ========== DATA FETCH ==========');
  console.log('[ReportSelectExistingSimulationFrame] Raw data:', data);
  console.log('[ReportSelectExistingSimulationFrame] Raw data length:', data?.length);
  console.log('[ReportSelectExistingSimulationFrame] isLoading:', isLoading);
  console.log('[ReportSelectExistingSimulationFrame] isError:', isError);
  console.log('[ReportSelectExistingSimulationFrame] Error:', error);

  function canProceed() {
    if (!localSimulation) {
      return false;
    }
    return localSimulation.simulation?.id !== null && localSimulation.simulation?.id !== undefined;
  }

  function handleSimulationSelect(enhancedSimulation: EnhancedUserSimulation) {
    if (!enhancedSimulation) {
      return;
    }

    setLocalSimulation(enhancedSimulation);
  }

  function handleSubmit() {
    if (!localSimulation || !localSimulation.simulation) {
      return;
    }

    console.log('Submitting Simulation in handleSubmit:', localSimulation);

    // Update the simulation at the active position from report reducer
    dispatch(
      updateSimulationAtPosition({
        position: activeSimulationPosition,
        updates: {
          ...localSimulation.simulation,
          label: localSimulation.userSimulation?.label || localSimulation.simulation.label || '',
        },
      })
    );

    onNavigate('next');
  }

  const userSimulations = data || [];

  console.log('[ReportSelectExistingSimulationFrame] ========== BEFORE FILTERING ==========');
  console.log('[ReportSelectExistingSimulationFrame] User simulations count:', userSimulations.length);
  console.log('[ReportSelectExistingSimulationFrame] User simulations:', userSimulations);

  // TODO: For all of these, refactor into something more reusable
  if (isLoading) {
    return (
      <FlowView
        title="Select an Existing Simulation"
        content={<Text>Loading simulations...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <FlowView
        title="Select an Existing Simulation"
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
        buttonPreset="none"
      />
    );
  }

  if (userSimulations.length === 0) {
    return (
      <FlowView
        title="Select an Existing Simulation"
        content={<Text>No simulations available. Please create a new simulation.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Filter simulations with loaded data
  const filteredSimulations = userSimulations.filter((enhancedSim) => enhancedSim.simulation?.id);

  console.log('[ReportSelectExistingSimulationFrame] ========== AFTER FILTERING ==========');
  console.log('[ReportSelectExistingSimulationFrame] Filtered simulations count:', filteredSimulations.length);
  console.log('[ReportSelectExistingSimulationFrame] Filter criteria: enhancedSim.simulation?.id exists');
  console.log('[ReportSelectExistingSimulationFrame] Filtered simulations:', filteredSimulations);

  // Build card list items from ALL filtered simulations (pagination handled by FlowView)
  const simulationCardItems = filteredSimulations.map((enhancedSim) => {
    const simulation = enhancedSim.simulation!;
    let title = '';
    let subtitle = '';

    if (enhancedSim.userSimulation?.label) {
      title = enhancedSim.userSimulation.label;
      subtitle = `Simulation #${simulation.id}`;
    } else {
      title = `Simulation #${simulation.id}`;
    }

    // Add policy and population info to subtitle if available
    const policyLabel = enhancedSim.userPolicy?.label || enhancedSim.policy?.label || enhancedSim.policy?.id;
    const populationLabel =
      enhancedSim.userHousehold?.label ||
      enhancedSim.geography?.name ||
      simulation.populationId;

    if (policyLabel && populationLabel) {
      subtitle = subtitle
        ? `${subtitle} • Policy: ${policyLabel} • Population: ${populationLabel}`
        : `Policy: ${policyLabel} • Population: ${populationLabel}`;
    }

    return {
      title,
      subtitle,
      onClick: () => handleSimulationSelect(enhancedSim),
      isSelected: localSimulation?.simulation?.id === simulation.id,
    };
  });

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  return (
    <FlowView
      title="Select an Existing Simulation"
      variant="cardList"
      cardListItems={simulationCardItems}
      primaryAction={primaryAction}
      itemsPerPage={5}
    />
  );
}
