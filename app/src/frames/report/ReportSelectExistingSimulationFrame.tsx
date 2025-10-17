import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text, Group, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { EnhancedUserSimulation, useUserSimulations } from '@/hooks/useUserSimulations';
import { selectActiveSimulationPosition } from '@/reducers/reportReducer';
import { updateSimulationAtPosition } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

const ITEMS_PER_PAGE = 5;

export default function ReportSelectExistingSimulationFrame({ onNavigate }: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const dispatch = useDispatch();

  // Get the active simulation position from report reducer
  const activeSimulationPosition = useSelector((state: RootState) =>
    selectActiveSimulationPosition(state)
  );

  const { data, isLoading, isError, error } = useUserSimulations(userId);
  const [localSimulation, setLocalSimulation] = useState<EnhancedUserSimulation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  console.log('Simulation Data:', data);
  console.log('Simulation Loading:', isLoading);
  console.log('Simulation Error:', isError);
  console.log('Simulation Error Message:', error);

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

  console.log('User Simulations:', userSimulations);

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

  console.log('[Pagination Debug] Total simulations:', userSimulations.length);
  console.log('[Pagination Debug] Filtered simulations:', filteredSimulations.length);
  console.log('[Pagination Debug] Current page:', currentPage);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSimulations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSimulations = filteredSimulations.slice(startIndex, endIndex);

  console.log('[Pagination Debug] Total pages:', totalPages);
  console.log('[Pagination Debug] Start index:', startIndex);
  console.log('[Pagination Debug] End index:', endIndex);
  console.log('[Pagination Debug] Paginated simulations:', paginatedSimulations.length);

  // Build card list items from paginated simulations
  const simulationCardItems = paginatedSimulations.map((enhancedSim) => {
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

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700}>Your Simulations</Text>
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredSimulations.length)} of {filteredSimulations.length}
          </Text>
        </div>
        {totalPages > 1 && (
          <Group gap="xs">
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        )}
      </Group>
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
