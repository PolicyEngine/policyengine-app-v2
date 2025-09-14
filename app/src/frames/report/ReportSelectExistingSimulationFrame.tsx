import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { RootState } from '@/store';
import { selectAllSimulations } from '@/reducers/simulationsReducer';
import { FlowComponentProps } from '@/types/flow';
import { Simulation } from '@/types/ingredients/Simulation';

export default function ReportSelectExistingSimulationFrame({ onNavigate }: FlowComponentProps) {
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

  // Get all simulations from the store
  const simulations = useSelector((state: RootState) => selectAllSimulations(state));

  // Filter to only show fully configured simulations
  const configuredSimulations = simulations.filter(
    sim => sim.policyId && sim.populationId
  );

  function canProceed() {
    return selectedSimulation !== null;
  }

  function handleSimulationSelect(simulation: Simulation) {
    setSelectedSimulation(simulation);
  }

  function handleSubmit() {
    if (!selectedSimulation) {
      return;
    }

    // TODO: Store the selected simulation for the report
    console.log('Selected simulation:', selectedSimulation);

    onNavigate('next');
  }

  if (configuredSimulations.length === 0) {
    return (
      <FlowView
        title="Select an Existing Simulation"
        content={<Text>No simulations available. Please create a new simulation.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Build card list items from simulations
  const simulationCardItems = configuredSimulations
    .slice(0, 10) // Display only the first 10 simulations
    .map((simulation) => {
      let title = '';
      let subtitle = '';

      if (simulation.label) {
        title = simulation.label;
        subtitle = `Policy #${simulation.policyId} • Population #${simulation.populationId}`;
      } else if (simulation.id) {
        title = `Simulation #${simulation.id}`;
        subtitle = `Policy #${simulation.policyId} • Population #${simulation.populationId}`;
      } else {
        title = 'Unnamed Simulation';
        subtitle = `Policy #${simulation.policyId} • Population #${simulation.populationId}`;
      }

      return {
        title,
        subtitle,
        onClick: () => handleSimulationSelect(simulation),
        isSelected: selectedSimulation?.id === simulation.id,
      };
    });

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Your Simulations</Text>
      <Text size="sm" c="dimmed">
        Showing {simulationCardItems.length} simulations
      </Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  return (
    <FlowView
      title="Select an Existing Simulation"
      variant="cardList"
      content={content}
      cardListItems={simulationCardItems}
      primaryAction={primaryAction}
    />
  );
}