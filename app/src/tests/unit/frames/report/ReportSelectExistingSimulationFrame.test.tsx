import { QueryNormalizerProvider } from '@normy/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, userEvent } from '@test-utils';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import ReportSelectExistingSimulationFrame from '@/frames/report/ReportSelectExistingSimulationFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer, * as simulationsActions from '@/reducers/simulationsReducer';
import {
  createEnhancedUserSimulation,
  MOCK_CONFIGURED_SIMULATION_1,
  MOCK_CONFIGURED_SIMULATION_2,
  MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL,
  MOCK_UNCONFIGURED_SIMULATION,
  NEXT_BUTTON_LABEL,
  NO_SIMULATIONS_MESSAGE,
  SELECT_EXISTING_SIMULATION_FRAME_TITLE,
  SELECTED_SIMULATION_LOG_PREFIX,
} from '@/tests/fixtures/frames/ReportSelectExistingSimulationFrame';

// Mock useUserSimulations hook
const mockUseUserSimulations = vi.fn();
vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: (userId: string) => mockUseUserSimulations(userId),
}));

// Mock useBackButton hook
const mockHandleBack = vi.fn();
vi.mock('@/hooks/useBackButton', () => ({
  useBackButton: vi.fn(() => ({ handleBack: mockHandleBack, canGoBack: false })),
}));

// Mock useCancelFlow
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('ReportSelectExistingSimulationFrame', () => {
  let store: any;
  let queryClient: QueryClient;
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHandleCancel.mockClear();
    vi.clearAllMocks();

    // Create QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        report: reportReducer,
        simulations: simulationsReducer,
        flow: flowReducer,
        policy: policyReducer,
        population: populationReducer,
        household: populationReducer,
        metadata: metadataReducer,
      },
    });

    mockOnNavigate = vi.fn();
    mockOnReturn = vi.fn();

    // Default flow props to satisfy FlowComponentProps interface
    defaultFlowProps = {
      onNavigate: mockOnNavigate,
      onReturn: mockOnReturn,
      flowConfig: {
        component: 'ReportSelectExistingSimulationFrame',
        on: {
          next: 'ReportSetupFrame',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };

    // Spy on console.log for testing console messages
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock for useUserSimulations - returns empty array (no simulations)
    mockUseUserSimulations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  // Helper function to render with router context
  const renderFrame = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <QueryNormalizerProvider queryClient={queryClient}>
            <MantineProvider>
              <MemoryRouter initialEntries={['/us/reports']}>
                <Routes>
                  <Route path="/:countryId/*" element={component} />
                </Routes>
              </MemoryRouter>
            </MantineProvider>
          </QueryNormalizerProvider>
        </QueryClientProvider>
      </Provider>
    );
  };

  test('given no simulations exist then displays empty state', () => {
    // Given - mock hook returns empty array (default from beforeEach)

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then
    expect(
      screen.getByRole('heading', { name: SELECT_EXISTING_SIMULATION_FRAME_TITLE })
    ).toBeInTheDocument();
    expect(screen.getByText(NO_SIMULATIONS_MESSAGE)).toBeInTheDocument();
  });

  test('given unconfigured simulations exist then filters them out', () => {
    // Given - mock hook returns unconfigured simulation (simulation without id)
    // The component filters based on enhancedSim.simulation?.id, so we need to ensure id is falsy
    mockUseUserSimulations.mockReturnValue({
      data: [
        {
          userSimulation: {
            id: 'user-sim-unconfigured',
            userId: '1',
            simulationId: MOCK_UNCONFIGURED_SIMULATION.id,
            label: MOCK_UNCONFIGURED_SIMULATION.label,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isCreated: false,
          },
          simulation: {
            id: null, // Explicitly null to be filtered out
            label: MOCK_UNCONFIGURED_SIMULATION.label,
            policyId: null,
            populationId: null,
            populationType: null,
            isCreated: false,
          },
          isLoading: false,
          error: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then - component shows title but no simulation cards (filtered out)
    // Note: Component currently doesn't show "No simulations" message after filtering,
    // it just renders an empty card list
    expect(
      screen.getByRole('heading', { name: SELECT_EXISTING_SIMULATION_FRAME_TITLE })
    ).toBeInTheDocument();
    // Verify no simulation cards are present by checking that simulation label is NOT in document
    expect(screen.queryByText(MOCK_UNCONFIGURED_SIMULATION.label!)).not.toBeInTheDocument();
    // Next button should still be present but disabled
    const nextButton = screen.queryByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).toBeInTheDocument();
  });

  test('given configured simulations exist then displays simulation list', () => {
    // Given - mock hook returns configured simulations
    const enhanced1 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    const enhanced2 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_2);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced1, enhanced2],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then
    expect(
      screen.getByRole('heading', { name: SELECT_EXISTING_SIMULATION_FRAME_TITLE })
    ).toBeInTheDocument();
    // Check that the simulation cards are shown
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_2.label!)).toBeInTheDocument();
  });

  test('given simulations with labels then displays titles correctly', () => {
    // Given - mock hook returns simulations with labels
    const enhanced1 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    const enhanced2 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_2);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced1, enhanced2],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then - check that simulation titles are displayed
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_2.label!)).toBeInTheDocument();
    // Check that policy and population info appears somewhere in the document
    // (exact format may vary based on subtitle construction)
    expect(screen.getByText(/Policy 1/)).toBeInTheDocument();
    expect(screen.getByText(/Policy 2/)).toBeInTheDocument();
  });

  test('given simulation without label then displays ID as title', () => {
    // Given - mock hook returns simulation without label
    const enhanced = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then
    expect(
      screen.getByText(`Simulation #${MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL.id}`)
    ).toBeInTheDocument();
  });

  test('given no selection then Next button is disabled', () => {
    // Given - mock hook returns simulation
    const enhanced = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).toBeDisabled();
  });

  test('given user selects simulation then Next button is enabled', async () => {
    // Given
    const user = userEvent.setup();
    const enhanced = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // When
    const simCard = screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!).closest('button');
    await user.click(simCard!);

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).not.toBeDisabled();
  });

  test('given user selects simulation and clicks Next then logs selection and navigates', async () => {
    // Given - set up a placeholder simulation in Redux at position 0 so update can succeed
    store.dispatch(
      simulationsActions.createSimulationAtPosition({
        position: 0,
        simulation: {
          id: undefined,
          label: undefined,
          policyId: undefined,
          populationId: undefined,
          populationType: undefined,
          isCreated: false,
        },
      })
    );

    const user = userEvent.setup();
    const enhanced = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // When
    const simCard = screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!).closest('button');
    await user.click(simCard!);

    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then - check that console.log was called with the prefix and an object
    expect(consoleLogSpy).toHaveBeenCalledWith(SELECTED_SIMULATION_LOG_PREFIX, expect.any(Object));
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given user switches selection then updates selected simulation', async () => {
    // Given - set up a placeholder simulation in Redux at position 0 so update can succeed
    store.dispatch(
      simulationsActions.createSimulationAtPosition({
        position: 0,
        simulation: {
          id: undefined,
          label: undefined,
          policyId: undefined,
          populationId: undefined,
          populationType: undefined,
          isCreated: false,
        },
      })
    );

    const user = userEvent.setup();
    const enhanced1 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_1);
    const enhanced2 = createEnhancedUserSimulation(MOCK_CONFIGURED_SIMULATION_2);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced1, enhanced2],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // When - first select simulation 1
    const sim1Card = screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!).closest('button');
    await user.click(sim1Card!);

    // Then switch to simulation 2
    const sim2Card = screen.getByText(MOCK_CONFIGURED_SIMULATION_2.label!).closest('button');
    await user.click(sim2Card!);

    // When clicking Next
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then - should log the last selected simulation
    expect(consoleLogSpy).toHaveBeenCalledWith(SELECTED_SIMULATION_LOG_PREFIX, expect.any(Object));
  });

  test('given 2 simulations (max capacity) then displays both', () => {
    // Given - mock hook returns 2 simulations
    const sim1 = {
      id: `1`,
      label: `Simulation 1`,
      policyId: `1`,
      populationId: `1`,
      populationType: 'household' as const,
      isCreated: true,
    };
    const sim2 = {
      id: `2`,
      label: `Simulation 2`,
      policyId: `2`,
      populationId: `2`,
      populationType: 'household' as const,
      isCreated: true,
    };
    const enhanced1 = createEnhancedUserSimulation(sim1);
    const enhanced2 = createEnhancedUserSimulation(sim2);
    mockUseUserSimulations.mockReturnValue({
      data: [enhanced1, enhanced2],
      isLoading: false,
      isError: false,
      error: null,
    });

    // When
    renderFrame(<ReportSelectExistingSimulationFrame {...defaultFlowProps} />);

    // Then - Both should be visible
    expect(screen.getByText('Simulation 1')).toBeInTheDocument();
    expect(screen.getByText('Simulation 2')).toBeInTheDocument();
  });
});
