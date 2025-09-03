import { describe, test, expect, beforeEach } from 'vitest';
import simulationsReducer, {
  setSimulationsMode,
  createSimulation,
  updateSimulationPopulationId,
  updateSimulationPolicyId,
  updateSimulationLabel,
  updateSimulationId,
  markSimulationAsCreated,
  updateSimulationField,
  setActiveSimulation,
  removeSimulation,
  clearSimulation,
  clearAllSimulations,
  replaceSimulationId,
  selectSimulationById,
  selectActiveSimulationId,
  selectActiveSimulation,
  selectAllSimulations,
  selectSimulationsMode,
  selectSimulationCompat,
} from '@/reducers/simulationsReducer';
import {
  TEST_TEMP_ID_1,
  TEST_TEMP_ID_2,
  TEST_PERMANENT_ID_1,
  TEST_HOUSEHOLD_ID,
  TEST_GEOGRAPHY_ID,
  TEST_POLICY_ID_1,
  TEST_POLICY_ID_2,
  TEST_LABEL_1,
  TEST_LABEL_2,
  TEST_LABEL_UPDATED,
  mockSimulation1,
  mockSimulation2,
  mockEmptySimulation,
  emptyInitialState,
  singleSimulationState,
  multipleSimulationsState,
  compatibilityTestState,
} from '@/tests/fixtures/reducers/simulationsReducer';

describe('simulationsReducer', () => {
  describe('Mode Management', () => {
    test('given initial state then mode is single', () => {
      // Given
      const state = simulationsReducer(undefined, { type: 'init' });
      
      // Then
      expect(state.mode).toBe('single');
    });

    test('given mode change to multi then mode updates', () => {
      // Given
      const state = emptyInitialState;
      
      // When
      const newState = simulationsReducer(state, setSimulationsMode('multi'));
      
      // Then
      expect(newState.mode).toBe('multi');
    });
  });

  describe('Creating Simulations', () => {
    test('given createSimulation action then new simulation is added and set as active', () => {
      // Given
      const state = emptyInitialState;
      
      // When
      const newState = simulationsReducer(state, createSimulation());
      
      // Then
      expect(Object.keys(newState.entities)).toHaveLength(1);
      expect(newState.ids).toHaveLength(1);
      expect(newState.activeId).toBe(newState.ids[0]);
      expect(newState.entities[newState.ids[0]]).toMatchObject(mockEmptySimulation);
    });

    test('given createSimulation with initial data then simulation contains that data', () => {
      // Given
      const state = emptyInitialState;
      const initialData = {
        label: TEST_LABEL_1,
        policyId: TEST_POLICY_ID_1,
      };
      
      // When
      const newState = simulationsReducer(state, createSimulation(initialData));
      
      // Then
      const createdSimulation = newState.entities[newState.ids[0]];
      expect(createdSimulation.label).toBe(TEST_LABEL_1);
      expect(createdSimulation.policyId).toBe(TEST_POLICY_ID_1);
    });
  });

  describe('Updating Active Simulation', () => {
    let initialState: any;

    beforeEach(() => {
      // Create a state with one simulation
      initialState = simulationsReducer(emptyInitialState, createSimulation());
    });

    test('given updateSimulationPopulationId then active simulation population is updated', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        updateSimulationPopulationId({
          populationId: TEST_HOUSEHOLD_ID,
          populationType: 'household',
        })
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.populationId).toBe(TEST_HOUSEHOLD_ID);
      expect(activeSimulation.populationType).toBe('household');
    });

    test('given updateSimulationPolicyId then active simulation policy is updated', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        updateSimulationPolicyId({ policyId: TEST_POLICY_ID_1 })
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.policyId).toBe(TEST_POLICY_ID_1);
    });

    test('given updateSimulationLabel then active simulation label is updated', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        updateSimulationLabel({ label: TEST_LABEL_1 })
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.label).toBe(TEST_LABEL_1);
    });

    test('given updateSimulationId then active simulation id is updated', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        updateSimulationId({ id: TEST_PERMANENT_ID_1 })
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.id).toBe(TEST_PERMANENT_ID_1);
    });

    test('given markSimulationAsCreated then active simulation isCreated is true', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        markSimulationAsCreated({})
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.isCreated).toBe(true);
    });

    test('given updateSimulationField with arbitrary field then field is updated', () => {
      // When
      const newState = simulationsReducer(
        initialState,
        updateSimulationField({
          field: 'label',
          value: TEST_LABEL_UPDATED,
        })
      );
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation.label).toBe(TEST_LABEL_UPDATED);
    });
  });

  describe('Updating Specific Simulation', () => {
    test('given update action with simulationId then specific simulation is updated', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        updateSimulationLabel({
          simulationId: TEST_TEMP_ID_2,
          label: TEST_LABEL_UPDATED,
        })
      );
      
      // Then
      expect(newState.entities[TEST_TEMP_ID_2].label).toBe(TEST_LABEL_UPDATED);
      expect(newState.entities[TEST_TEMP_ID_1].label).toBe(TEST_LABEL_1); // Unchanged
    });
  });

  describe('Managing Multiple Simulations', () => {
    test('given setActiveSimulation then active simulation changes', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        setActiveSimulation(TEST_TEMP_ID_2)
      );
      
      // Then
      expect(newState.activeId).toBe(TEST_TEMP_ID_2);
    });

    test('given setActiveSimulation with invalid id then active simulation does not change', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        setActiveSimulation('invalid-id')
      );
      
      // Then
      expect(newState.activeId).toBe(TEST_TEMP_ID_1); // Unchanged
    });

    test('given removeSimulation then simulation is removed from state', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        removeSimulation(TEST_TEMP_ID_2)
      );
      
      // Then
      expect(newState.entities[TEST_TEMP_ID_2]).toBeUndefined();
      expect(newState.ids).not.toContain(TEST_TEMP_ID_2);
      expect(newState.ids).toHaveLength(1);
    });

    test('given removeSimulation of active simulation then new active is set', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        removeSimulation(TEST_TEMP_ID_1) // Remove the active one
      );
      
      // Then
      expect(newState.activeId).toBe(TEST_TEMP_ID_2); // Should switch to remaining
    });

    test('given removeSimulation of last simulation then activeId is null', () => {
      // Given
      const state = singleSimulationState;
      
      // When
      const newState = simulationsReducer(
        state,
        removeSimulation(TEST_TEMP_ID_1)
      );
      
      // Then
      expect(newState.activeId).toBeNull();
      expect(newState.ids).toHaveLength(0);
    });
  });

  describe('Clearing Simulations', () => {
    test('given clearSimulation then active simulation is reset', () => {
      // Given
      const state = singleSimulationState;
      
      // When
      const newState = simulationsReducer(state, clearSimulation({}));
      
      // Then
      const activeSimulation = newState.entities[newState.activeId!];
      expect(activeSimulation).toMatchObject(mockEmptySimulation);
    });

    test('given clearSimulation with simulationId then specific simulation is reset', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(
        state,
        clearSimulation({ simulationId: TEST_TEMP_ID_2 })
      );
      
      // Then
      expect(newState.entities[TEST_TEMP_ID_2]).toMatchObject(mockEmptySimulation);
      expect(newState.entities[TEST_TEMP_ID_1]).toMatchObject(mockSimulation1); // Unchanged
    });

    test('given clearAllSimulations then all simulations are removed', () => {
      // Given
      const state = multipleSimulationsState;
      
      // When
      const newState = simulationsReducer(state, clearAllSimulations());
      
      // Then
      expect(newState.entities).toEqual({});
      expect(newState.ids).toEqual([]);
      expect(newState.activeId).toBeNull();
    });
  });

  describe('ID Replacement', () => {
    test('given replaceSimulationId then temp ID is replaced with permanent ID', () => {
      // Given
      const state = singleSimulationState;
      
      // When
      const newState = simulationsReducer(
        state,
        replaceSimulationId({
          tempId: TEST_TEMP_ID_1,
          permanentId: TEST_PERMANENT_ID_1,
        })
      );
      
      // Then
      expect(newState.entities[TEST_PERMANENT_ID_1]).toBeDefined();
      expect(newState.entities[TEST_TEMP_ID_1]).toBeUndefined();
      expect(newState.ids).toContain(TEST_PERMANENT_ID_1);
      expect(newState.ids).not.toContain(TEST_TEMP_ID_1);
    });

    test('given replaceSimulationId for active simulation then activeId is updated', () => {
      // Given
      const state = singleSimulationState;
      
      // When
      const newState = simulationsReducer(
        state,
        replaceSimulationId({
          tempId: TEST_TEMP_ID_1,
          permanentId: TEST_PERMANENT_ID_1,
        })
      );
      
      // Then
      expect(newState.activeId).toBe(TEST_PERMANENT_ID_1);
    });

    test('given replaceSimulationId with non-existent tempId then state is unchanged', () => {
      // Given
      const state = singleSimulationState;
      
      // When
      const newState = simulationsReducer(
        state,
        replaceSimulationId({
          tempId: 'non-existent',
          permanentId: TEST_PERMANENT_ID_1,
        })
      );
      
      // Then
      expect(newState).toEqual(state);
    });
  });

  describe('Selectors', () => {
    test('given selectSimulationById then returns correct simulation', () => {
      // Given
      const state = { simulations: multipleSimulationsState };
      
      // When
      const simulation = selectSimulationById(state, TEST_TEMP_ID_2);
      
      // Then
      expect(simulation).toEqual(mockSimulation2);
    });

    test('given selectSimulationById with invalid id then returns undefined', () => {
      // Given
      const state = { simulations: multipleSimulationsState };
      
      // When
      const simulation = selectSimulationById(state, 'invalid-id');
      
      // Then
      expect(simulation).toBeUndefined();
    });

    test('given selectActiveSimulationId then returns active simulation ID', () => {
      // Given
      const state = { simulations: singleSimulationState };
      
      // When
      const activeId = selectActiveSimulationId(state);
      
      // Then
      expect(activeId).toBe(TEST_TEMP_ID_1);
    });

    test('given selectActiveSimulationId with no active simulation then returns null', () => {
      // Given
      const state = { simulations: emptyInitialState };
      
      // When
      const activeId = selectActiveSimulationId(state);
      
      // Then
      expect(activeId).toBeNull();
    });

    test('given selectActiveSimulationId with missing simulations state then returns null', () => {
      // Given - state without simulations (edge case during initialization)
      const state = {} as { simulations: any };
      
      // When
      const activeId = selectActiveSimulationId(state);
      
      // Then
      expect(activeId).toBeNull();
    });

    test('given selectActiveSimulation then returns active simulation', () => {
      // Given
      const state = { simulations: singleSimulationState };
      
      // When
      const simulation = selectActiveSimulation(state);
      
      // Then
      expect(simulation).toEqual(mockSimulation1);
    });

    test('given selectActiveSimulation with no active then returns undefined', () => {
      // Given
      const state = { simulations: emptyInitialState };
      
      // When
      const simulation = selectActiveSimulation(state);
      
      // Then
      expect(simulation).toBeUndefined();
    });

    test('given selectAllSimulations then returns all simulations as array', () => {
      // Given
      const state = { simulations: multipleSimulationsState };
      
      // When
      const simulations = selectAllSimulations(state);
      
      // Then
      expect(simulations).toHaveLength(2);
      expect(simulations).toContain(mockSimulation1);
      expect(simulations).toContain(mockSimulation2);
    });

    test('given selectSimulationsMode then returns current mode', () => {
      // Given
      const state = { simulations: multipleSimulationsState };
      
      // When
      const mode = selectSimulationsMode(state);
      
      // Then
      expect(mode).toBe('multi');
    });

    test('given selectSimulationCompat with new state only then returns active simulation', () => {
      // Given
      const state = { simulations: singleSimulationState };
      
      // When
      const simulation = selectSimulationCompat(state);
      
      // Then
      expect(simulation).toEqual(mockSimulation1);
    });

    test('given selectSimulationCompat with old state only then returns old simulation', () => {
      // Given
      const state = { simulation: mockSimulation2 };
      
      // When
      const simulation = selectSimulationCompat(state);
      
      // Then
      expect(simulation).toEqual(mockSimulation2);
    });

    test('given selectSimulationCompat with both states then prefers new state in single mode', () => {
      // Given - both old and new state present
      const state = compatibilityTestState;
      
      // When
      const simulation = selectSimulationCompat(state);
      
      // Then - should prefer new state
      expect(simulation).toEqual(mockSimulation1);
    });
  });
});