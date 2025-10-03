import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Stack, Text, TextInput, LoadingOverlay } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import FlowView from '@/components/common/FlowView';
import { selectActiveSimulationPosition } from '@/reducers/reportReducer';
import { updateSimulationAtPosition, createSimulationAtPosition } from '@/reducers/simulationsReducer';
import { simulationsAPI } from '@/api/v2/simulations';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function ReportSelectExistingSimulationFrame({ onNavigate }: FlowComponentProps) {
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();

  // Get the active simulation position from the report reducer
  const activePosition = useSelector((state: RootState) => selectActiveSimulationPosition(state));

  // Fetch simulations from API
  const { data: simulations, isLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => simulationsAPI.list({ limit: 100 }),
  });

  // Filter to only show simulations with results
  const availableSimulations = (simulations || []).filter((sim) => sim.results);

  // Filter by search query
  const filteredSimulations = availableSimulations.filter((sim) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      sim.id.toLowerCase().includes(searchLower) ||
      sim.name?.toLowerCase().includes(searchLower) ||
      sim.description?.toLowerCase().includes(searchLower)
    );
  });

  function canProceed() {
    return selectedSimulationId !== null;
  }

  function handleSimulationSelect(simulationId: string) {
    setSelectedSimulationId(simulationId);
  }

  function handleSubmit() {
    if (!selectedSimulationId) {
      return;
    }

    const selectedSim = simulations?.find(s => s.id === selectedSimulationId);
    if (!selectedSim) return;

    // Update or create simulation at the active position
    if (activePosition) {
      dispatch(
        updateSimulationAtPosition({
          position: activePosition,
          updates: {
            id: selectedSim.id,
            policyId: selectedSim.policy_id,
            populationId: selectedSim.dataset_id,
            isCreated: true,
          },
        })
      );
    } else {
      dispatch(
        createSimulationAtPosition({
          position: 'baseline', // Default to baseline if no active position
          simulation: {
            id: selectedSim.id,
            policyId: selectedSim.policy_id,
            populationId: selectedSim.dataset_id,
            isCreated: true,
          },
        })
      );
    }

    onNavigate('next');
  }

  if (isLoading) {
    return (
      <FlowView
        title="Select simulation"
        content={
          <div style={{ position: 'relative', minHeight: 200 }}>
            <LoadingOverlay visible={true} />
          </div>
        }
        buttonPreset="cancel-only"
      />
    );
  }

  if (availableSimulations.length === 0) {
    return (
      <FlowView
        title="Select simulation"
        content={<Text>No completed simulations available. Create a new simulation first.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Build card list items from simulations
  const simulationCardItems = filteredSimulations
    .slice(0, 10) // Display only the first 10 simulations
    .map((simulation) => {
      const title = simulation.name || simulation.description || `Simulation ${simulation.id.slice(0, 8)}`;
      const subtitle = `Policy: ${simulation.policy_id?.slice(0, 8) || 'None'} • Dataset: ${simulation.dataset_id?.slice(0, 8) || 'Default'}`;

      return {
        title,
        subtitle,
        onClick: () => handleSimulationSelect(simulation.id),
        isSelected: selectedSimulationId === simulation.id,
      };
    });

  const content = (
    <Stack>
      <TextInput
        placeholder="Search simulations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
      />
      <Text fw={700}>Your simulations</Text>
      <Text size="sm" c="dimmed">
        Showing {simulationCardItems.length} of {availableSimulations.length} completed simulations
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
      title="Select simulation"
      variant="cardList"
      content={content}
      cardListItems={simulationCardItems}
      primaryAction={primaryAction}
    />
  );
}
