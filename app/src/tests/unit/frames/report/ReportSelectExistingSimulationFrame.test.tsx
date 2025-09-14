import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSelectExistingSimulationFrame from '@/frames/report/ReportSelectExistingSimulationFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer, * as simulationsActions from '@/reducers/simulationsReducer';
import {
  MOCK_CONFIGURED_SIMULATION_1,
  MOCK_CONFIGURED_SIMULATION_2,
  MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL,
  MOCK_UNCONFIGURED_SIMULATION,
  NEXT_BUTTON_LABEL,
  NO_SIMULATIONS_MESSAGE,
  SEARCH_LABEL,
  SEARCH_TODO,
  SELECT_EXISTING_SIMULATION_FRAME_TITLE,
  SELECTED_SIMULATION_LOG_PREFIX,
  SHOWING_SIMULATIONS_PREFIX,
  SIMULATIONS_SUFFIX,
  YOUR_SIMULATIONS_LABEL,
} from '@/tests/fixtures/frames/ReportSelectExistingSimulationFrame';

describe('ReportSelectExistingSimulationFrame', () => {
  let store: any;
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  test('given no simulations exist then displays empty state', () => {
    // Given/When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    expect(
      screen.getByRole('heading', { name: SELECT_EXISTING_SIMULATION_FRAME_TITLE })
    ).toBeInTheDocument();
    expect(screen.getByText(NO_SIMULATIONS_MESSAGE)).toBeInTheDocument();
  });

  test('given unconfigured simulations exist then filters them out', () => {
    // Given - add an unconfigured simulation
    store.dispatch(simulationsActions.createSimulation(MOCK_UNCONFIGURED_SIMULATION));

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - should still show empty state
    expect(screen.getByText(NO_SIMULATIONS_MESSAGE)).toBeInTheDocument();
  });

  test('given configured simulations exist then displays simulation list', () => {
    // Given - add configured simulations
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_2));

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    expect(
      screen.getByRole('heading', { name: SELECT_EXISTING_SIMULATION_FRAME_TITLE })
    ).toBeInTheDocument();
    expect(screen.getByText(SEARCH_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SEARCH_TODO)).toBeInTheDocument();
    expect(screen.getByText(YOUR_SIMULATIONS_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(`${SHOWING_SIMULATIONS_PREFIX} 2 ${SIMULATIONS_SUFFIX}`)
    ).toBeInTheDocument();
  });

  test('given simulations with labels then displays titles correctly', () => {
    // Given
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_2));

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONFIGURED_SIMULATION_2.label!)).toBeInTheDocument();
    expect(
      screen.getByText(
        `Policy #${MOCK_CONFIGURED_SIMULATION_1.policyId} • Population #${MOCK_CONFIGURED_SIMULATION_1.populationId}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Policy #${MOCK_CONFIGURED_SIMULATION_2.policyId} • Population #${MOCK_CONFIGURED_SIMULATION_2.populationId}`
      )
    ).toBeInTheDocument();
  });

  test('given simulation without label then displays ID as title', () => {
    // Given
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL));

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    expect(
      screen.getByText(`Simulation #${MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL.id}`)
    ).toBeInTheDocument();
  });

  test('given no selection then Next button is disabled', () => {
    // Given
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).toBeDisabled();
  });

  test('given user selects simulation then Next button is enabled', async () => {
    // Given
    const user = userEvent.setup();
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));

    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const simCard = screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!).closest('button');
    await user.click(simCard!);

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).not.toBeDisabled();
  });

  test('given user selects simulation and clicks Next then logs selection and navigates', async () => {
    // Given
    const user = userEvent.setup();
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));

    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const simCard = screen.getByText(MOCK_CONFIGURED_SIMULATION_1.label!).closest('button');
    await user.click(simCard!);

    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(
      SELECTED_SIMULATION_LOG_PREFIX,
      expect.objectContaining({
        id: MOCK_CONFIGURED_SIMULATION_1.id,
        label: MOCK_CONFIGURED_SIMULATION_1.label,
        policyId: MOCK_CONFIGURED_SIMULATION_1.policyId,
        populationId: MOCK_CONFIGURED_SIMULATION_1.populationId,
      })
    );
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given user switches selection then updates selected simulation', async () => {
    // Given
    const user = userEvent.setup();
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_CONFIGURED_SIMULATION_2));

    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

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
    expect(consoleLogSpy).toHaveBeenCalledWith(
      SELECTED_SIMULATION_LOG_PREFIX,
      expect.objectContaining({
        id: MOCK_CONFIGURED_SIMULATION_2.id,
        label: MOCK_CONFIGURED_SIMULATION_2.label,
      })
    );
  });

  test('given more than 10 simulations then displays only first 10', () => {
    // Given - add 12 configured simulations
    for (let i = 1; i <= 12; i++) {
      store.dispatch(
        simulationsActions.createSimulation({
          id: `sim-${i}`,
          label: `Simulation ${i}`,
          policyId: `policy-${i}`,
          populationId: `pop-${i}`,
          populationType: 'household' as const,
          isCreated: true,
        })
      );
    }

    // When
    render(
      <Provider store={store}>
        <ReportSelectExistingSimulationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - should show only 10 simulations
    expect(
      screen.getByText(`${SHOWING_SIMULATIONS_PREFIX} 10 ${SIMULATIONS_SUFFIX}`)
    ).toBeInTheDocument();

    // First 10 should be visible
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`Simulation ${i}`)).toBeInTheDocument();
    }

    // 11th and 12th should not be visible
    expect(screen.queryByText('Simulation 11')).not.toBeInTheDocument();
    expect(screen.queryByText('Simulation 12')).not.toBeInTheDocument();
  });
});
