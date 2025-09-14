import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer, * as simulationsActions from '@/reducers/simulationsReducer';
import {
  ADDING_SIMULATION_1_MESSAGE,
  ADDING_SIMULATION_2_MESSAGE,
  BOTH_SIMULATIONS_CONFIGURED_MESSAGE,
  FIRST_SIMULATION_DESCRIPTION,
  FIRST_SIMULATION_TITLE,
  MOCK_SIMULATION_1,
  MOCK_SIMULATION_2,
  NEXT_BUTTON_LABEL,
  REPORT_SETUP_FRAME_TITLE,
  SECOND_SIMULATION_DESCRIPTION,
  SECOND_SIMULATION_TITLE,
  SETTING_UP_SIMULATION_1_MESSAGE,
  SETTING_UP_SIMULATION_2_MESSAGE,
  SETUP_FIRST_SIMULATION_LABEL,
  SETUP_SECOND_SIMULATION_LABEL,
} from '@/tests/fixtures/frames/ReportSetupFrame';

describe('ReportSetupFrame', () => {
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
        component: 'ReportSetupFrame',
        on: {
          setupSimulation1: 'ReportSelectSimulationFrame',
          setupSimulation2: 'ReportSelectSimulationFrame',
          next: '__return__',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };

    // Spy on console.log for testing console messages
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Spy on simulation actions
    vi.spyOn(simulationsActions, 'createSimulation');
    vi.spyOn(simulationsActions, 'setActiveSimulation');
  });

  test('given component renders then displays two simulation setup cards', () => {
    // Given/When
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - should display title and two cards
    expect(screen.getByRole('heading', { name: REPORT_SETUP_FRAME_TITLE })).toBeInTheDocument();
    expect(screen.getByText(FIRST_SIMULATION_TITLE)).toBeInTheDocument();
    expect(screen.getByText(FIRST_SIMULATION_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(SECOND_SIMULATION_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SECOND_SIMULATION_DESCRIPTION)).toBeInTheDocument();
  });

  test('given no simulations configured then Next button is disabled', () => {
    // Given/When
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).toBeDisabled();
  });

  test('given user clicks first simulation card then logs message and updates selection', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const firstSimCard = screen.getByText(FIRST_SIMULATION_TITLE).closest('button');
    await user.click(firstSimCard!);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(ADDING_SIMULATION_1_MESSAGE);
    // Card should appear selected (would need to check visual state)
  });

  test('given user clicks second simulation card then logs message and updates selection', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const secondSimCard = screen.getByText(SECOND_SIMULATION_TITLE).closest('button');
    await user.click(secondSimCard!);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(ADDING_SIMULATION_2_MESSAGE);
  });

  test('given first simulation selected then primary button shows setup label', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const firstSimCard = screen.getByText(FIRST_SIMULATION_TITLE).closest('button');
    await user.click(firstSimCard!);

    // Then
    const primaryButton = screen.getByRole('button', { name: SETUP_FIRST_SIMULATION_LABEL });
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).not.toBeDisabled();
  });

  test('given second simulation selected then primary button shows setup label', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const secondSimCard = screen.getByText(SECOND_SIMULATION_TITLE).closest('button');
    await user.click(secondSimCard!);

    // Then
    const primaryButton = screen.getByRole('button', { name: SETUP_SECOND_SIMULATION_LABEL });
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).not.toBeDisabled();
  });

  test('given user clicks setup first simulation then creates simulation and navigates', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When - select first simulation and click setup
    const firstSimCard = screen.getByText(FIRST_SIMULATION_TITLE).closest('button');
    await user.click(firstSimCard!);

    const setupButton = screen.getByRole('button', { name: SETUP_FIRST_SIMULATION_LABEL });
    await user.click(setupButton);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(SETTING_UP_SIMULATION_1_MESSAGE);
    expect(simulationsActions.createSimulation).toHaveBeenCalled();
    expect(mockOnNavigate).toHaveBeenCalledWith('setupSimulation1');
  });

  test('given user clicks setup second simulation then creates simulation and navigates', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When - select second simulation and click setup
    const secondSimCard = screen.getByText(SECOND_SIMULATION_TITLE).closest('button');
    await user.click(secondSimCard!);

    const setupButton = screen.getByRole('button', { name: SETUP_SECOND_SIMULATION_LABEL });
    await user.click(setupButton);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(SETTING_UP_SIMULATION_2_MESSAGE);
    expect(simulationsActions.createSimulation).toHaveBeenCalled();
    expect(mockOnNavigate).toHaveBeenCalledWith('setupSimulation2');
  });

  test('given both simulations configured then displays configured state', () => {
    // Given - pre-populate store with configured simulations
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_2));

    // When
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - cards should show configured state
    expect(screen.getByText(new RegExp(MOCK_SIMULATION_1.label!))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(MOCK_SIMULATION_2.label!))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Policy #${MOCK_SIMULATION_1.policyId}`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Policy #${MOCK_SIMULATION_2.policyId}`))
    ).toBeInTheDocument();
  });

  test('given both simulations configured then Next button is enabled', () => {
    // Given - pre-populate store with configured simulations
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_2));

    // When
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).not.toBeDisabled();
  });

  test('given both simulations configured and Next clicked then navigates to next', async () => {
    // Given - pre-populate store with configured simulations
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_1));
    store.dispatch(simulationsActions.createSimulation(MOCK_SIMULATION_2));

    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <ReportSetupFrame {...defaultFlowProps} />
      </Provider>
    );

    // When
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then
    expect(consoleLogSpy).toHaveBeenCalledWith(BOTH_SIMULATIONS_CONFIGURED_MESSAGE);
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });
});
