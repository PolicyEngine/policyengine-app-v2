import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SimulationCreationFrame from '@/frames/SimulationCreationFrame';
import simulationsReducer, * as simulationsActions from '@/reducers/simulationsReducer';
import flowReducer from '@/reducers/flowReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import metadataReducer from '@/reducers/metadataReducer';
import {
  TEST_SIMULATION_LABEL,
  SIMULATION_NAME_INPUT_LABEL,
  CREATE_SIMULATION_BUTTON_LABEL,
} from '@/tests/fixtures/frames/SimulationCreationFrame';

describe('SimulationCreationFrame', () => {
  let store: any;
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
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
        component: 'SimulationCreationFrame',
        on: {
          next: 'SimulationSetupFrame',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };
    
    // Spy on the action creators
    vi.spyOn(simulationsActions, 'updateSimulationLabel');
    vi.spyOn(simulationsActions, 'createSimulation');
  });

  test('given component mounts then creates simulation in new reducer', () => {
    // Given/When
    render(
      <Provider store={store}>
        <SimulationCreationFrame {...defaultFlowProps} />
      </Provider>
    );
    
    // Then - should have created a simulation in the new reducer
    expect(simulationsActions.createSimulation).toHaveBeenCalled();
    const state = store.getState();
    expect(state.simulations.activeId).toBeTruthy();
    expect(Object.keys(state.simulations.entities)).toHaveLength(1);
  });

  test('given user submits label then dispatches to simulations reducer', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <SimulationCreationFrame {...defaultFlowProps} />
      </Provider>
    );
    
    const input = screen.getByLabelText(SIMULATION_NAME_INPUT_LABEL);
    const submitButton = screen.getByRole('button', { name: CREATE_SIMULATION_BUTTON_LABEL });
    
    // When
    await user.type(input, TEST_SIMULATION_LABEL);
    await user.click(submitButton);
    
    // Then - should dispatch to simulations reducer
    expect(simulationsActions.updateSimulationLabel).toHaveBeenCalledWith({ label: TEST_SIMULATION_LABEL });
    
    
    // And - should navigate to next
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given user submits label then reducer state is updated', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <SimulationCreationFrame {...defaultFlowProps} />
      </Provider>
    );
    
    const input = screen.getByLabelText(SIMULATION_NAME_INPUT_LABEL);
    const submitButton = screen.getByRole('button', { name: CREATE_SIMULATION_BUTTON_LABEL });
    
    // When
    await user.type(input, TEST_SIMULATION_LABEL);
    await user.click(submitButton);
    
    // Then - check reducer state
    const state = store.getState();
    const activeId = state.simulations.activeId;
    expect(state.simulations.entities[activeId].label).toBe(TEST_SIMULATION_LABEL);
  });

  test('given component already has active simulation then does not create new one', () => {
    // Given - pre-populate the store with a simulation
    store.dispatch(simulationsActions.createSimulation());
    const initialActiveId = store.getState().simulations.activeId;
    
    // Reset the spy after initial creation
    vi.clearAllMocks();
    
    // When
    render(
      <Provider store={store}>
        <SimulationCreationFrame {...defaultFlowProps} />
      </Provider>
    );
    
    // Then - should NOT create another simulation
    expect(simulationsActions.createSimulation).not.toHaveBeenCalled();
    const finalActiveId = store.getState().simulations.activeId;
    expect(finalActiveId).toBe(initialActiveId);
  });

  test('given empty label then still dispatches to reducer', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <SimulationCreationFrame {...defaultFlowProps} />
      </Provider>
    );
    
    const submitButton = screen.getByRole('button', { name: CREATE_SIMULATION_BUTTON_LABEL });
    
    // When - submit without entering a label
    await user.click(submitButton);
    
    // Then - should dispatch empty string to reducer
    expect(simulationsActions.updateSimulationLabel).toHaveBeenCalledWith({
      label: '',
    });
  });
});