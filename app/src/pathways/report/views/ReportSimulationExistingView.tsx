import { useState } from 'react';
import { Text } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserId } from '@/hooks/useUserId';
import { useRegions } from '@/hooks/useRegions';
import { EnhancedUserSimulation, useUserSimulations } from '@/hooks/useUserSimulations';
import { SimulationStateProps } from '@/types/pathwayState';
import { getCountryLabel, getRegionLabel, isNationalGeography } from '@/utils/geographyUtils';
import { arePopulationsCompatible } from '@/utils/populationCompatibility';

interface ReportSimulationExistingViewProps {
  activeSimulationIndex: 0 | 1;
  otherSimulation: SimulationStateProps | null;
  onSelectSimulation: (enhancedSimulation: EnhancedUserSimulation) => void;
  onNext: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSimulationExistingView({
  activeSimulationIndex: _activeSimulationIndex,
  otherSimulation,
  onSelectSimulation,
  onNext,
  onBack,
  onCancel,
}: ReportSimulationExistingViewProps) {
  const userId = useUserId();
  const countryId = useCurrentCountry();
  const { regions } = useRegions(countryId);

  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const [localSimulation, setLocalSimulation] = useState<EnhancedUserSimulation | null>(null);

  // Helper to get geography display label in "Households in {label}" format
  function getGeographyLabel(enhancedSim: EnhancedUserSimulation): string | undefined {
    if (!enhancedSim.geography) {
      return undefined;
    }
    const label = isNationalGeography(enhancedSim.geography)
      ? getCountryLabel(enhancedSim.geography.countryId)
      : getRegionLabel(enhancedSim.geography.regionCode, regions);
    return `Households in ${label}`;
  }

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

    onSelectSimulation(localSimulation);
    onNext();
  }

  const userSimulations = data || [];

  if (isLoading) {
    return (
      <PathwayView
        title="Select an existing simulation"
        content={<Text>Loading simulations...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <PathwayView
        title="Select an existing simulation"
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
        buttonPreset="none"
      />
    );
  }

  if (userSimulations.length === 0) {
    return (
      <PathwayView
        title="Select an existing simulation"
        content={<Text>No simulations available. Please create a new simulation.</Text>}
        primaryAction={{
          label: 'Next',
          onClick: () => {},
          isDisabled: true,
        }}
        backAction={onBack ? { onClick: onBack } : undefined}
        cancelAction={onCancel ? { onClick: onCancel } : undefined}
      />
    );
  }

  // Filter simulations with loaded data
  const filteredSimulations = userSimulations.filter((enhancedSim) => enhancedSim.simulation?.id);

  // Get other simulation's population ID (base ingredient ID) for compatibility check
  // For household populations, use household.id
  // For geography populations, use geography.regionCode
  const otherPopulationId =
    otherSimulation?.population.household?.id || otherSimulation?.population.geography?.regionCode;

  // Sort simulations to show compatible first, then incompatible
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const aCompatible = arePopulationsCompatible(otherPopulationId, a.simulation!.populationId);
    const bCompatible = arePopulationsCompatible(otherPopulationId, b.simulation!.populationId);

    return bCompatible === aCompatible ? 0 : aCompatible ? -1 : 1;
  });

  // Build card list items from sorted simulations
  const simulationCardItems = sortedSimulations.map((enhancedSim) => {
    const simulation = enhancedSim.simulation!;

    // Check compatibility with other simulation
    const isCompatible = arePopulationsCompatible(otherPopulationId, simulation.populationId);

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
      enhancedSim.userHousehold?.label || getGeographyLabel(enhancedSim) || simulation.populationId;

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
      id: enhancedSim.userSimulation?.id?.toString() || simulation.id, // Use user simulation association ID for unique key
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
    <PathwayView
      title="Select an existing simulation"
      variant="cardList"
      cardListItems={simulationCardItems}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
      itemsPerPage={5}
    />
  );
}
