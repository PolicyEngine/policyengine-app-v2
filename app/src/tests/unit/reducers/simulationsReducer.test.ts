import { describe, expect, test } from 'vitest';
import simulationsReducer, {
  createSimulationAtPosition,
  updateSimulationAtPosition,
  clearSimulationAtPosition,
  swapSimulations,
  clearAllSimulations,
  selectSimulationAtPosition,
  selectBothSimulations,
  selectHasEmptySlot,
  selectIsSlotEmpty,
  selectSimulationById,
} from '@/reducers/simulationsReducer';
import {
  emptyInitialState,
  singleSimulationState,
  multipleSimulationsState,
  bothSimulationsWithoutIdState,
  mockSimulation1,
  mockSimulation2,
  mockSimulationWithoutId1,
  mockSimulationWithoutId2,
  TEST_HOUSEHOLD_ID,
  TEST_LABEL_1,
  TEST_LABEL_2,
  TEST_LABEL_UPDATED,
  TEST_PERMANENT_ID_1,
  TEST_PERMANENT_ID_2,
  TEST_POLICY_ID_1,
  TEST_POLICY_ID_2,
} from '@/tests/fixtures/reducers/simulationsReducer';
import { Simulation } from '@/types/ingredients/Simulation';

describe('simulationsReducer', () => {
  describe('Creating Simulations at Position', () => {
    test('given createSimulationAtPosition with position 0 then simulation created at first slot', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = simulationsReducer(state, createSimulationAtPosition({
        position: 0
      }));

      // Then
      expect(newState.simulations[0]).toEqual({
        id: undefined,
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: null,
        isCreated: false,
      });
      expect(newState.simulations[1]).toBeNull();
      // activePosition removed - now in report reducer.toBe(0);
    });

    test('given createSimulationAtPosition with position 1 on empty state then only second slot filled', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = simulationsReducer(state, createSimulationAtPosition({
        position: 1,
        simulation: { label: TEST_LABEL_2 }
      }));

      // Then
      expect(newState.simulations[0]).toBeNull();
      expect(newState.simulations[1]).toEqual({
        id: undefined,
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: TEST_LABEL_2,
        isCreated: false,
      });
      // activePosition removed - now in report reducer.toBe(1);
    });

    test('given createSimulationAtPosition with initial data then simulation contains that data', () => {
      // Given
      const state = emptyInitialState;
      const initialData = {
        label: TEST_LABEL_1,
        policyId: TEST_POLICY_ID_1,
        populationId: TEST_HOUSEHOLD_ID,
        populationType: 'household' as const,
      };

      // When
      const newState = simulationsReducer(state, createSimulationAtPosition({
        position: 1,
        simulation: initialData,
      }));

      // Then
      expect(newState.simulations[1]).toEqual({
        id: undefined,
        populationId: TEST_HOUSEHOLD_ID,
        policyId: TEST_POLICY_ID_1,
        populationType: 'household',
        label: TEST_LABEL_1,
        isCreated: false,
      });
      // activePosition removed - now in report reducer.toBe(1);
    });

    test('given createSimulationAtPosition when slot occupied then preserves existing simulation', () => {
      // Given
      const state = multipleSimulationsState;
      const newSimulation = {
        label: TEST_LABEL_UPDATED,
      };

      // When
      const newState = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: newSimulation,
      }));

      // Then - existing simulation should be preserved, not replaced
      expect(newState.simulations[0]).toEqual(mockSimulation1);
      expect(newState.simulations[0]?.label).toBe(TEST_LABEL_1); // Original label preserved
      expect(newState.simulations[0]?.policyId).toBe(TEST_POLICY_ID_1); // Original policy preserved
      expect(newState.simulations[1]).toEqual(mockSimulation2);
    });

    test('given createSimulationAtPosition with null value then creates new simulation', () => {
      // Given
      const state = {
        simulations: [null, mockSimulation2] as [Simulation | null, Simulation | null],
      };

      // When
      const newState = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: { label: TEST_LABEL_UPDATED },
      }));

      // Then - new simulation should be created since position was null
      expect(newState.simulations[0]).toEqual({
        id: undefined,
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: TEST_LABEL_UPDATED,
        isCreated: false,
      });
      expect(newState.simulations[1]).toEqual(mockSimulation2); // Other position unchanged
    });

    test('given createSimulationAtPosition at both positions then both slots filled', () => {
      // Given
      let state = emptyInitialState;

      // When
      state = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: { label: TEST_LABEL_1 },
      }));
      state = simulationsReducer(state, createSimulationAtPosition({
        position: 1,
        simulation: { label: TEST_LABEL_2 },
      }));

      // Then
      expect(state.simulations[0]?.label).toBe(TEST_LABEL_1);
      expect(state.simulations[1]?.label).toBe(TEST_LABEL_2);
      // activePosition removed - now in report reducer.toBe(1);
    });
  });

  describe('Updating Simulations at Position', () => {
    test('given updateSimulationAtPosition then updates specific fields', () => {
      // Given
      const state = bothSimulationsWithoutIdState;

      // When
      const newState = simulationsReducer(state, updateSimulationAtPosition({
        position: 0,
        updates: {
          id: TEST_PERMANENT_ID_1,
          isCreated: true,
        },
      }));

      // Then
      expect(newState.simulations[0]).toEqual({
        ...mockSimulationWithoutId1,
        id: TEST_PERMANENT_ID_1,
        isCreated: true,
      });
      expect(newState.simulations[1]).toEqual(mockSimulationWithoutId2);
    });

    test('given updateSimulationAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() =>
        simulationsReducer(state, updateSimulationAtPosition({
          position: 0,
          updates: { label: TEST_LABEL_1 },
        }))
      ).toThrow('Cannot update simulation at position 0: no simulation exists at that position');
    });

    test('given updateSimulationAtPosition on empty position 1 then throws error', () => {
      // Given
      const state = singleSimulationState; // Has sim at position 0, but not 1

      // When/Then
      expect(() =>
        simulationsReducer(state, updateSimulationAtPosition({
          position: 1,
          updates: { label: TEST_LABEL_2 },
        }))
      ).toThrow('Cannot update simulation at position 1: no simulation exists at that position');
    });

    test('given updateSimulationAtPosition with partial updates then merges with existing', () => {
      // Given
      const state = multipleSimulationsState;

      // When
      const newState = simulationsReducer(state, updateSimulationAtPosition({
        position: 1,
        updates: {
          label: TEST_LABEL_UPDATED,
          policyId: TEST_POLICY_ID_1,
        },
      }));

      // Then
      expect(newState.simulations[1]).toEqual({
        ...mockSimulation2,
        label: TEST_LABEL_UPDATED,
        policyId: TEST_POLICY_ID_1,
      });
    });
  });

  describe('Clearing Simulations at Position', () => {
    test('given clearSimulationAtPosition then slot becomes null', () => {
      // Given
      const state = multipleSimulationsState;

      // When
      const newState = simulationsReducer(state, clearSimulationAtPosition(0));

      // Then
      expect(newState.simulations[0]).toBeNull();
      expect(newState.simulations[1]).toEqual(mockSimulation2);
    });

    test('given clearSimulationAtPosition of active then active position cleared', () => {
      // Given
      const state = {
        ...multipleSimulationsState,
      };

      // When
      const newState = simulationsReducer(state, clearSimulationAtPosition(1));

      // Then
      expect(newState.simulations[1]).toBeNull();
      // activePosition removed - now in report reducer.toBeNull();
    });

    test('given clearSimulationAtPosition of non-active then active unchanged', () => {
      // Given
      const state = {
        ...multipleSimulationsState,
      };

      // When
      const newState = simulationsReducer(state, clearSimulationAtPosition(1));

      // Then
      expect(newState.simulations[1]).toBeNull();
      // activePosition removed - now in report reducer.toBe(0);
    });
  });

  // setActivePosition tests removed - activePosition now managed by report reducer

  describe('Swapping Simulations', () => {
    test('given swapSimulations then positions are swapped', () => {
      // Given
      const state = multipleSimulationsState;

      // When
      const newState = simulationsReducer(state, swapSimulations());

      // Then
      expect(newState.simulations[0]).toEqual(mockSimulation2);
      expect(newState.simulations[1]).toEqual(mockSimulation1);
    });

    test('given swapSimulations with active position then active follows swap', () => {
      // Given
      const state = {
        ...multipleSimulationsState,
      };

      // When
      const newState = simulationsReducer(state, swapSimulations());

      // Then
      // activePosition removed - now in report reducer.toBe(1);
      expect(newState.simulations[1]).toEqual(mockSimulation1);
    });

    test('given swapSimulations with one empty slot then swaps with null', () => {
      // Given
      const state = singleSimulationState;

      // When
      const newState = simulationsReducer(state, swapSimulations());

      // Then
      expect(newState.simulations[0]).toBeNull();
      expect(newState.simulations[1]).toEqual(mockSimulationWithoutId1);
      // activePosition removed - now in report reducer.toBe(1);
    });

    test('given swapSimulations with both empty then no change', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = simulationsReducer(state, swapSimulations());

      // Then
      expect(newState.simulations).toEqual([null, null]);
      // activePosition removed - now in report reducer.toBeNull();
    });
  });

  describe('Clearing All Simulations', () => {
    test('given clearAllSimulations then resets to initial state', () => {
      // Given
      const state = multipleSimulationsState;

      // When
      const newState = simulationsReducer(state, clearAllSimulations());

      // Then
      expect(newState).toEqual(emptyInitialState);
    });

    test('given clearAllSimulations from partial state then clears all', () => {
      // Given
      const state = singleSimulationState;

      // When
      const newState = simulationsReducer(state, clearAllSimulations());

      // Then
      expect(newState.simulations).toEqual([null, null]);
      // activePosition removed - now in report reducer.toBeNull();
    });
  });

  describe('Selectors', () => {
    describe('selectSimulationAtPosition', () => {
      test('given simulation at position 0 then returns simulation', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result = selectSimulationAtPosition(state, 0);

        // Then
        expect(result).toEqual(mockSimulation1);
      });

      test('given simulation at position 1 then returns simulation', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result = selectSimulationAtPosition(state, 1);

        // Then
        expect(result).toEqual(mockSimulation2);
      });

      test('given empty position then returns null', () => {
        // Given
        const state = { simulations: singleSimulationState };

        // When
        const result = selectSimulationAtPosition(state, 1);

        // Then
        expect(result).toBeNull();
      });
    });

    describe('selectBothSimulations', () => {
      test('given both simulations then returns tuple', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectBothSimulations(state);

        // Then
        expect(result).toEqual([mockSimulation1, mockSimulation2]);
      });

      test('given one simulation then returns tuple with null', () => {
        // Given
        const state = { simulations: singleSimulationState };

        // When
        const result =selectBothSimulations(state);

        // Then
        expect(result).toEqual([mockSimulationWithoutId1, null]);
      });

      test('given no simulations then returns tuple of nulls', () => {
        // Given
        const state = { simulations: emptyInitialState };

        // When
        const result =selectBothSimulations(state);

        // Then
        expect(result).toEqual([null, null]);
      });
    });

    // selectActivePosition and selectActiveSimulation tests removed - activePosition now managed by report reducer

    describe('selectHasEmptySlot', () => {
      test('given both slots filled then returns false', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectHasEmptySlot(state);

        // Then
        expect(result).toBe(false);
      });

      test('given one slot empty then returns true', () => {
        // Given
        const state = { simulations: singleSimulationState };

        // When
        const result =selectHasEmptySlot(state);

        // Then
        expect(result).toBe(true);
      });

      test('given both slots empty then returns true', () => {
        // Given
        const state = { simulations: emptyInitialState };

        // When
        const result =selectHasEmptySlot(state);

        // Then
        expect(result).toBe(true);
      });
    });

    describe('selectIsSlotEmpty', () => {
      test('given filled position 0 then returns false', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectIsSlotEmpty(state, 0);

        // Then
        expect(result).toBe(false);
      });

      test('given empty position 1 then returns true', () => {
        // Given
        const state = { simulations: singleSimulationState };

        // When
        const result =selectIsSlotEmpty(state, 1);

        // Then
        expect(result).toBe(true);
      });

      test('given both empty then returns true for both', () => {
        // Given
        const state = { simulations: emptyInitialState };

        // When
        const result0 =selectIsSlotEmpty(state, 0);
        const result1 =selectIsSlotEmpty(state, 1);

        // Then
        expect(result0).toBe(true);
        expect(result1).toBe(true);
      });
    });

    describe('selectSimulationById', () => {
      test('given ID matching first simulation then returns first', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectSimulationById(state, TEST_PERMANENT_ID_1);

        // Then
        expect(result).toEqual(mockSimulation1);
      });

      test('given ID matching second simulation then returns second', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectSimulationById(state, TEST_PERMANENT_ID_2);

        // Then
        expect(result).toEqual(mockSimulation2);
      });

      test('given non-existent ID then returns null', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectSimulationById(state, 'non-existent');

        // Then
        expect(result).toBeNull();
      });

      test('given undefined ID then returns null', () => {
        // Given
        const state = { simulations: multipleSimulationsState };

        // When
        const result =selectSimulationById(state, undefined);

        // Then
        expect(result).toBeNull();
      });

      test('given simulations without IDs then returns null', () => {
        // Given
        const state = { simulations: bothSimulationsWithoutIdState };

        // When
        const result =selectSimulationById(state, TEST_PERMANENT_ID_1);

        // Then
        expect(result).toBeNull();
      });
    });
  });

  describe('Complex Scenarios', () => {
    test('given series of position operations then maintains consistency', () => {
      // Given
      let state = emptyInitialState;

      // When - Create, update, swap, clear sequence
      state = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: { label: 'First' },
      }));

      state = simulationsReducer(state, createSimulationAtPosition({
        position: 1,
        simulation: { label: 'Second' },
      }));

      state = simulationsReducer(state, updateSimulationAtPosition({
        position: 0,
        updates: { id: 'id-1', isCreated: true },
      }));

      state = simulationsReducer(state, swapSimulations());
      // After swap: position 0 has 'Second', position 1 has 'First' with id
      // Active position was 1, now becomes 0 after swap

      state = simulationsReducer(state, clearSimulationAtPosition(1));
      // Clear position 1, active stays at 0

      // Then
      expect(state.simulations[0]).toMatchObject({
        label: 'Second',
      });
      expect(state.simulations[1]).toBeNull();
      // activePosition removed - now in report reducer.toBe(0); // Active is still at position 0
    });

    test('given API workflow then properly updates simulation', () => {
      // Given - Start with draft simulation
      let state = emptyInitialState;
      state = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: {
          populationId: TEST_HOUSEHOLD_ID,
          populationType: 'household',
          policyId: TEST_POLICY_ID_1,
          label: TEST_LABEL_1,
        },
      }));

      // When - API returns with ID
      state = simulationsReducer(state, updateSimulationAtPosition({
        position: 0,
        updates: {
          id: TEST_PERMANENT_ID_1,
          isCreated: true,
        },
      }));

      // Then
      expect(state.simulations[0]).toEqual({
        id: TEST_PERMANENT_ID_1,
        populationId: TEST_HOUSEHOLD_ID,
        populationType: 'household',
        policyId: TEST_POLICY_ID_1,
        label: TEST_LABEL_1,
        isCreated: true,
      });
    });

    test('given two simulations for report then maintains both independently', () => {
      // Given
      let state = emptyInitialState;

      // When - Set up two simulations for a report
      state = simulationsReducer(state, createSimulationAtPosition({
        position: 0,
        simulation: {
          populationId: TEST_HOUSEHOLD_ID,
          populationType: 'household',
          policyId: TEST_POLICY_ID_1,
          label: 'Baseline',
        },
      }));

      state = simulationsReducer(state, createSimulationAtPosition({
        position: 1,
        simulation: {
          populationId: TEST_HOUSEHOLD_ID,
          populationType: 'household',
          policyId: TEST_POLICY_ID_2,
          label: 'Reform',
        },
      }));

      // Update first to be created
      state = simulationsReducer(state, updateSimulationAtPosition({
        position: 0,
        updates: { id: TEST_PERMANENT_ID_1, isCreated: true },
      }));

      // Update second to be created
      state = simulationsReducer(state, updateSimulationAtPosition({
        position: 1,
        updates: { id: TEST_PERMANENT_ID_2, isCreated: true },
      }));

      // Then
      expect(state.simulations[0]?.id).toBe(TEST_PERMANENT_ID_1);
      expect(state.simulations[0]?.label).toBe('Baseline');
      expect(state.simulations[1]?.id).toBe(TEST_PERMANENT_ID_2);
      expect(state.simulations[1]?.label).toBe('Reform');
    });
  });
});