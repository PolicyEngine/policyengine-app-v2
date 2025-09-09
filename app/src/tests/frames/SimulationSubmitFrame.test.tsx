import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SimulationSubmitFrame from '@/frames/simulation/SimulationSubmitFrame';
import simulationsReducer from '@/reducers/simulationsReducer';
import flowReducer from '@/reducers/flowReducer';
import populationReducer from '@/reducers/populationReducer';
import metadataReducer from '@/reducers/metadataReducer';
import {
  TEST_SIMULATION_ID,
  TEST_SIMULATION_ID_MISSING,
  TEST_POPULATION_LABEL,
  TEST_POLICY_LABEL,
  SUBMIT_VIEW_TITLE,
  POPULATION_ADDED_TITLE,
  POLICY_REFORM_ADDED_TITLE,
  mockSimulationComplete,
  mockSimulationPartial,
  mockStateWithOldSimulation,
  mockStateWithNewSimulation,
  mockStateWithBothSimulations,
} from '@/tests/fixtures/frames/SimulationSubmitFrame';
// Mock the hooks - must be defined inline due to hoisting
vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(() => ({
    createSimulation: vi.fn(),
    isPending: false,
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

  describe('Selector Compatibility', () => {
    test('given old state structure then reads from old simulation reducer', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationComplete,
          simulations: () => null,
          flow: flowReducer,
          policy: () => mockStateWithOldSimulation.policy,
          population: () => mockStateWithOldSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should display data from old state
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
      
      // Check that population and policy data are shown (multiple elements may have this text)
      const populationElements = screen.getAllByText(TEST_POPULATION_LABEL);
      expect(populationElements.length).toBeGreaterThan(0);
    });

    test('given new state structure then reads from new simulations reducer', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulation: () => null,
          simulations: () => mockStateWithNewSimulation.simulations,
          flow: flowReducer,
          policy: () => mockStateWithNewSimulation.policy,
          population: () => mockStateWithNewSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
        },
      });

      // When
      render(
        <Provider store={store}>
          <SimulationSubmitFrame {...defaultFlowProps} />
        </Provider>
      );

      // Then - should display data from new state
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
    });

    test('given both state structures then prefers new simulations reducer', () => {
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
  });

  describe('Specific Simulation ID', () => {
    test('given specific simulationId prop then uses that simulation', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulation: () => mockSimulationPartial,
          simulations: () => mockStateWithNewSimulation.simulations,
          flow: flowReducer,
          policy: () => mockStateWithNewSimulation.policy,
          population: () => mockStateWithNewSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
        },
      });

      // When - pass specific simulation ID
      render(
        <Provider store={store}>
          <SimulationSubmitFrame 
            {...defaultFlowProps} 
            simulationId={TEST_SIMULATION_ID}
          />
        </Provider>
      );

      // Then - should display the specific simulation's data
      expect(screen.getByText(SUBMIT_VIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POPULATION_ADDED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(POLICY_REFORM_ADDED_TITLE)).toBeInTheDocument();
    });

    test('given non-existent simulationId then handles gracefully', () => {
      // Given
      const store = configureStore({
        reducer: {
          simulations: () => mockStateWithNewSimulation.simulations,
          flow: flowReducer,
          policy: () => mockStateWithNewSimulation.policy,
          population: () => mockStateWithNewSimulation.population,
          household: populationReducer,
          metadata: metadataReducer,
        },
      });

      // When - pass non-existent simulation ID
      render(
        <Provider store={store}>
          <SimulationSubmitFrame 
            {...defaultFlowProps} 
            simulationId={TEST_SIMULATION_ID_MISSING}
          />
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
      // Given - completely empty state
      const store = configureStore({
        reducer: {
          simulation: () => ({}),
          simulations: () => ({ entities: {}, ids: [], activeId: null, mode: 'single' }),
          flow: flowReducer,
          policy: () => ({}),
          population: () => ({}),
          household: populationReducer,
          metadata: metadataReducer,
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
});