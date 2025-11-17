import { useState } from 'react';
import { Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { EnhancedUserSimulation, useUserSimulations } from '@/hooks/useUserSimulations';
import { SimulationStateProps } from '@/types/pathwayState';
import { arePopulationsCompatible } from '@/utils/populationCompatibility';

interface ReportSimulationExistingViewProps {
  activeSimulationIndex: 0 | 1;
  otherSimulation: SimulationStateProps | null;
  onSelectSimulation: (enhancedSimulation: EnhancedUserSimulation) => void;
  onNext: () => void;
}

export default function ReportSimulationExistingView({
  activeSimulationIndex,
  otherSimulation,
  onSelectSimulation,
  onNext,
}: ReportSimulationExistingViewProps) {
  const userId = MOCK_USER_ID.toString();

  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const [localSimulation, setLocalSimulation] = useState<EnhancedUserSimulation | null>(null);

  console.log('[ReportSimulationExistingView] ========== DATA FETCH ==========');
  console.log('[ReportSimulationExistingView] Raw data:', data);
  console.log('[ReportSimulationExistingView] Raw data length:', data?.length);
  console.log('[ReportSimulationExistingView] isLoading:', isLoading);
  console.log('[ReportSimulationExistingView] isError:', isError);
  console.log('[ReportSimulationExistingView] Error:', error);

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

    onSelectSimulation(localSimulation);
    onNext();
  }

  const userSimulations = data || [];

  console.log('[ReportSimulationExistingView] ========== BEFORE FILTERING ==========');
  console.log('[ReportSimulationExistingView] User simulations count:', userSimulations.length);
  console.log('[ReportSimulationExistingView] User simulations:', userSimulations);

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

  console.log('[ReportSimulationExistingView] ========== AFTER FILTERING ==========');
  console.log('[ReportSimulationExistingView] Filtered simulations count:', filteredSimulations.length);

  // Get other simulation's population ID (base ingredient ID) for compatibility check
  // For household populations, use household.id
  // For geography populations, use geography.geographyId (the base geography identifier)
  const otherPopulationId = otherSimulation?.population.household?.id
    || otherSimulation?.population.geography?.geographyId
    || otherSimulation?.population.geography?.id;

  // Sort simulations to show compatible first, then incompatible
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const aCompatible = arePopulationsCompatible(
      otherPopulationId,
      a.simulation!.populationId
    );
    const bCompatible = arePopulationsCompatible(
      otherPopulationId,
      b.simulation!.populationId
    );

    return bCompatible === aCompatible ? 0 : aCompatible ? -1 : 1;
  });

  console.log('[ReportSimulationExistingView] ========== AFTER SORTING ==========');
  console.log('[ReportSimulationExistingView] Sorted simulations count:', sortedSimulations.length);

  // Build card list items from sorted simulations
  const simulationCardItems = sortedSimulations.map((enhancedSim) => {
    const simulation = enhancedSim.simulation!;

    // Check compatibility with other simulation
    const isCompatible = arePopulationsCompatible(
      otherPopulationId,
      simulation.populationId
    );

    let title = '';
    let subtitle = '';

    if (enhancedSim.userSimulation?.label) {
      title = enhancedSim.userSimulation.label;
      subtitle = `Simulation #${simulation.id}`;
    } else {
      title = `Simulation #${simulation.id}`;
    }

    // Add policy and population info to subtitle if available
    const policyLabel =
      enhancedSim.userPolicy?.label || enhancedSim.policy?.label || enhancedSim.policy?.id;
    const populationLabel =
      enhancedSim.userHousehold?.label || enhancedSim.geography?.name || simulation.populationId;

    if (policyLabel && populationLabel) {
      subtitle = subtitle
        ? `${subtitle} • Policy: ${policyLabel} • Population: ${populationLabel}`
        : `Policy: ${policyLabel} • Population: ${populationLabel}`;
    }

    // If incompatible, add explanation to subtitle
    if (!isCompatible) {
      subtitle = subtitle
        ? `${subtitle} • Incompatible: different population than configured simulation`
        : 'Incompatible: different population than configured simulation';
    }

    return {
      title,
      subtitle,
      onClick: () => handleSimulationSelect(enhancedSim),
      isSelected: localSimulation?.simulation?.id === simulation.id,
      isDisabled: !isCompatible,
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
