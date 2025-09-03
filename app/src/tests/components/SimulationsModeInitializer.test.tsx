import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SimulationsModeInitializer from '@/components/SimulationsModeInitializer';
import simulationsReducer, { setSimulationsMode } from '@/reducers/simulationsReducer';

describe('SimulationsModeInitializer', () => {
  let store: any;
  let dispatchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        simulations: simulationsReducer,
      },
    });
    
    // Spy on dispatch to verify the action is called
    dispatchSpy = vi.spyOn(store, 'dispatch');
  });

  test('given component mounts then sets simulations mode to single', () => {
    // Given/When
    render(
      <Provider store={store}>
        <SimulationsModeInitializer>
          <div>Test Child</div>
        </SimulationsModeInitializer>
      </Provider>
    );
    
    // Then - should have dispatched setSimulationsMode with 'single'
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: setSimulationsMode.type,
        payload: 'single',
      })
    );
  });

  test('given component mounts then store state is updated to single mode', () => {
    // Given/When
    render(
      <Provider store={store}>
        <SimulationsModeInitializer>
          <div>Test Child</div>
        </SimulationsModeInitializer>
      </Provider>
    );
    
    // Then - store state should reflect single mode
    const state = store.getState();
    expect(state.simulations.mode).toBe('single');
  });

  test('given children prop then renders children', () => {
    // Given/When
    const { getByText } = render(
      <Provider store={store}>
        <SimulationsModeInitializer>
          <div>Test Child Content</div>
        </SimulationsModeInitializer>
      </Provider>
    );
    
    // Then - children should be rendered
    expect(getByText('Test Child Content')).toBeInTheDocument();
  });
});