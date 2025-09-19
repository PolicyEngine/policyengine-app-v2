import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSubmitFrame from '@/frames/simulation/SimulationSubmitFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer, * as simulationsActions from '@/reducers/simulationsReducer';
import {
  mockSimulationComplete,
  mockSimulationPartial,
  mockStateWithBothSimulations,
  mockStateWithNewSimulation,
  mockStateWithOldSimulation,
  POLICY_REFORM_ADDED_TITLE,
  POPULATION_ADDED_TITLE,
  SUBMIT_VIEW_TITLE,
  TEST_POLICY_LABEL,
  TEST_POPULATION_LABEL,
} from '@/tests/fixtures/frames/SimulationSubmitFrame';

// Mock the hooks - must be defined inline due to hoisting
vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(() => ({
    createSimulation: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: vi.fn(() => ({
    resetIngredient: vi.fn(),
    resetIngredients: vi.fn(),
  })),
}));

describe('SimulationSubmitFrame - Compatibility Features', () => {
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOnNavigate = vi.fn();
    mockOnReturn = vi.fn();

    defaultFlowProps = {
      onNavigate: mockOnNavigate,
      onReturn: mockOnReturn,
      flowConfig: {
        component: 'SimulationSubmitFrame',
        on: {
          submit: '__return__',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };
  });

  describe('Specific Position', () => {
    test('given position-based state structure then uses simulations at positions', () => {
      // Given - store with both old and new state
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationPartial, // Missing policyId
          simulations: () => mockStateWithBothSimulations.simulations, // Complete
          flow: flowReducer,
          policy: () => mockStateWithBothSimulations.policy,
          population: () => mockStateWithBothSimulations.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should use data from new state (which has policyId)
      const policyBoxes = screen.getAllByText(/Policy/);
      expect(policyBoxes.length).toBeGreaterThan(0);
    });
    test('given specific position prop then uses simulation at that position', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationPartial,
          simulations: () => ({
            simulations: [mockSimulationComplete, null],
            activePosition: 0,
          }),
          flow: flowReducer,
          policy: () => mockStateWithNewSimulation.policy,
          population: () => mockStateWithNewSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When - pass specific simulation ID
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should display the specific simulation's data
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
    });

    test('given position with no simulation then handles gracefully', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulations: () => ({
            simulations: [mockSimulationComplete, null],
            activePosition: 0,
          }),
          flow: flowReducer,
          policy: () => mockStateWithNewSimulation.policy,
          population: () => mockStateWithNewSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When - pass position with no simulation
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should still render without crashing
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();

      // Population and policy cards should still appear, but without fulfilled state
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
    });
  });

  describe('Summary Box Display', () => {
    test('given complete simulation then shows all fulfilled badges', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationComplete,
          simulations: simulationsReducer,
          flow: flowReducer,
          policy: () => mockStateWithOldSimulation.policy,
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - both summary boxes should show populated data (may appear multiple times)
      const populationElements = screen.getAllByText(TEST_POPULATION_LABEL);
      expect(populationElements.length).toBeGreaterThan(0);
      const policyElements = screen.getAllByText(TEST_POLICY_LABEL);
      expect(policyElements.length).toBeGreaterThan(0);
    });

    test('given partial simulation then shows appropriate placeholders', () => {
      // Given - simulation without policyId
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationPartial,
          simulations: simulationsReducer,
          flow: flowReducer,
          policy: () => ({ ...mockStateWithOldSimulation.policy, label: null }),
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();

      // Should show population label (may appear multiple times)
      const populationElements = screen.getAllByText(TEST_POPULATION_LABEL);
      expect(populationElements.length).toBeGreaterThan(0);
    });

    test('given no simulation data then shows empty state gracefully', () => {
      // Given - completely empty position-based state
      const store = configureStore({
        reducer: {
          simulation: () => null,
          simulations: () => ({ simulations: [null, null] }),
          flow: flowReducer,
          policy: () => ({ policies: [null, null] }),
          population: () => ({ populations: [null, null] }),
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should render without crashing
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
    });
  });

  describe('Position-Based Updates', () => {
    test('given successful submission then updates simulation at position', async () => {
      // Given
      const mockCreateSimulation = vi.fn();
      vi.mocked(await import('@/hooks/useCreateSimulation')).useCreateSimulation.mockReturnValue({
        createSimulation: mockCreateSimulation,
        isPending: false,
        error: null,
      });

      // Set up store with simulation at position 0
      const store = configureStore({
        reducer: {
          simulations: () => ({
            simulations: [mockSimulationComplete, null],
            activePosition: 0,
          }),
          flow: flowReducer,
          policy: () => mockStateWithOldSimulation.policy,
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      const user = userEvent.setup();
      vi.spyOn(simulationsActions, 'updateSimulationAtPosition');
      vi.spyOn(simulationsActions, 'clearSimulationAtPosition');

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      const submitButton = screen.getByRole('button', { name: /Save Simulation/i });
      await user.click(submitButton);

      // Simulate successful API response
      const onSuccessCallback = mockCreateSimulation.mock.calls[0][1].onSuccess;
      onSuccessCallback({
        result: {
          simulation_id: '123',
        },
      });

      // Then
      expect(simulationsActions.updateSimulationAtPosition).toHaveBeenCalledWith({
        position: 0,
        updates: {
          id: '123',
          isCreated: true,
        },
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('submit');
    });

    test('given submission not in subflow then clears simulation at position', async () => {
      // Given
      const mockCreateSimulation = vi.fn();
      vi.mocked(await import('@/hooks/useCreateSimulation')).useCreateSimulation.mockReturnValue({
        createSimulation: mockCreateSimulation,
        isPending: false,
        error: null,
      });

      const store = configureStore({
        reducer: {
          simulation: () => null,
          simulations: () => ({
            simulations: [null, mockSimulationComplete],
          }),
          flow: flowReducer,
          policy: () => mockStateWithOldSimulation.policy,
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: () => ({
            activeSimulationPosition: 1,
            mode: 'report',
          }),
        },
      });

      const user = userEvent.setup();
      vi.spyOn(simulationsActions, 'clearSimulationAtPosition');

      // When - not in subflow
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} isInSubflow={false} />
        </Provider>
      );

      const submitButton = screen.getByRole('button', { name: /Save Simulation/i });
      await user.click(submitButton);

      // Simulate successful API response
      const onSuccessCallback = mockCreateSimulation.mock.calls[0][1].onSuccess;
      onSuccessCallback({
        result: {
          simulation_id: '456',
        },
      });

      // Then
      expect(simulationsActions.clearSimulationAtPosition).toHaveBeenCalledWith(1);
    });

    test('given submission in subflow then does not clear simulation', async () => {
      // Given
      const mockCreateSimulation = vi.fn();
      vi.mocked(await import('@/hooks/useCreateSimulation')).useCreateSimulation.mockReturnValue({
        createSimulation: mockCreateSimulation,
        isPending: false,
        error: null,
      });

      const store = configureStore({
        reducer: {
          simulations: () => ({
            simulations: [mockSimulationComplete, null],
            activePosition: 0,
          }),
          flow: flowReducer,
          policy: () => mockStateWithOldSimulation.policy,
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
          report: reportReducer,
        },
      });

      const user = userEvent.setup();
      vi.spyOn(simulationsActions, 'clearSimulationAtPosition');

      // When - in subflow
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} isInSubflow />
        </Provider>
      );

      const submitButton = screen.getByRole('button', { name: /Save Simulation/i });
      await user.click(submitButton);

      // Simulate successful API response
      const onSuccessCallback = mockCreateSimulation.mock.calls[0][1].onSuccess;
      onSuccessCallback({
        result: {
          simulation_id: '789',
        },
      });

      // Then
      expect(simulationsActions.clearSimulationAtPosition).not.toHaveBeenCalled();
    });
  });
});
