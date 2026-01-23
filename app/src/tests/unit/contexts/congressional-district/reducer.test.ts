/**
 * Tests for congressional district fetch reducer
 */

import { describe, test, expect } from 'vitest';
import { fetchReducer, initialFetchState } from '@/contexts/congressional-district/reducer';
import {
  MOCK_INITIAL_FETCH_STATE,
  MOCK_LOADING_FETCH_STATE,
  MOCK_ALABAMA_DISTRICT_DATA,
  MOCK_ACTIONS,
  TEST_STATE_CODES,
} from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';

describe('fetchReducer', () => {
  describe('initialFetchState', () => {
    test('given initial state then hasStarted is false', () => {
      expect(initialFetchState.hasStarted).toBe(false);
    });

    test('given initial state then all sets and maps are empty', () => {
      expect(initialFetchState.stateResponses.size).toBe(0);
      expect(initialFetchState.completedStates.size).toBe(0);
      expect(initialFetchState.loadingStates.size).toBe(0);
      expect(initialFetchState.erroredStates.size).toBe(0);
    });
  });

  describe('START_FETCH action', () => {
    test('given START_FETCH action then hasStarted becomes true', () => {
      // Given
      const state = MOCK_INITIAL_FETCH_STATE;
      const action = MOCK_ACTIONS.START_FETCH;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.hasStarted).toBe(true);
    });

    test('given START_FETCH action then all state codes are in loadingStates', () => {
      // Given
      const state = MOCK_INITIAL_FETCH_STATE;
      const action = MOCK_ACTIONS.START_FETCH;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.loadingStates.size).toBe(2);
      expect(result.loadingStates.has(TEST_STATE_CODES.ALABAMA)).toBe(true);
      expect(result.loadingStates.has(TEST_STATE_CODES.CALIFORNIA)).toBe(true);
    });

    test('given START_FETCH action then stateResponses is cleared', () => {
      // Given - state with existing responses
      const state = MOCK_LOADING_FETCH_STATE;
      const action = MOCK_ACTIONS.START_FETCH;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.stateResponses.size).toBe(0);
    });

    test('given START_FETCH action then completedStates is cleared', () => {
      // Given - state with completed states
      const state = MOCK_LOADING_FETCH_STATE;
      const action = MOCK_ACTIONS.START_FETCH;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.completedStates.size).toBe(0);
    });
  });

  describe('STATE_COMPLETED action', () => {
    test('given STATE_COMPLETED with data then adds data to stateResponses', () => {
      // Given
      const state: typeof MOCK_LOADING_FETCH_STATE = {
        ...MOCK_LOADING_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.ALABAMA]),
      };
      const action = MOCK_ACTIONS.STATE_COMPLETED_WITH_DATA;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.stateResponses.has(TEST_STATE_CODES.ALABAMA)).toBe(true);
      expect(result.stateResponses.get(TEST_STATE_CODES.ALABAMA)).toEqual(
        MOCK_ALABAMA_DISTRICT_DATA
      );
    });

    test('given STATE_COMPLETED with data then moves state from loading to completed', () => {
      // Given
      const state: typeof MOCK_INITIAL_FETCH_STATE = {
        ...MOCK_INITIAL_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.ALABAMA]),
        hasStarted: true,
      };
      const action = MOCK_ACTIONS.STATE_COMPLETED_WITH_DATA;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.loadingStates.has(TEST_STATE_CODES.ALABAMA)).toBe(false);
      expect(result.completedStates.has(TEST_STATE_CODES.ALABAMA)).toBe(true);
    });

    test('given STATE_COMPLETED with null data then still marks as completed', () => {
      // Given
      const state: typeof MOCK_INITIAL_FETCH_STATE = {
        ...MOCK_INITIAL_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.TEXAS]),
        hasStarted: true,
      };
      const action = MOCK_ACTIONS.STATE_COMPLETED_NO_DATA;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.completedStates.has(TEST_STATE_CODES.TEXAS)).toBe(true);
      expect(result.stateResponses.has(TEST_STATE_CODES.TEXAS)).toBe(false);
    });

    test('given STATE_COMPLETED then preserves other loading states', () => {
      // Given
      const state: typeof MOCK_INITIAL_FETCH_STATE = {
        ...MOCK_INITIAL_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.ALABAMA, TEST_STATE_CODES.CALIFORNIA]),
        hasStarted: true,
      };
      const action = MOCK_ACTIONS.STATE_COMPLETED_WITH_DATA;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.loadingStates.has(TEST_STATE_CODES.CALIFORNIA)).toBe(true);
      expect(result.loadingStates.size).toBe(1);
    });
  });

  describe('STATE_ERRORED action', () => {
    test('given STATE_ERRORED then moves state from loading to errored', () => {
      // Given
      const state: typeof MOCK_INITIAL_FETCH_STATE = {
        ...MOCK_INITIAL_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.TEXAS]),
        hasStarted: true,
      };
      const action = MOCK_ACTIONS.STATE_ERRORED;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.loadingStates.has(TEST_STATE_CODES.TEXAS)).toBe(false);
      expect(result.erroredStates.has(TEST_STATE_CODES.TEXAS)).toBe(true);
    });

    test('given STATE_ERRORED then preserves completed states', () => {
      // Given
      const state: typeof MOCK_LOADING_FETCH_STATE = {
        ...MOCK_LOADING_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.TEXAS]),
      };
      const action = MOCK_ACTIONS.STATE_ERRORED;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.completedStates.has(TEST_STATE_CODES.ALABAMA)).toBe(true);
    });

    test('given STATE_ERRORED then preserves stateResponses', () => {
      // Given
      const state: typeof MOCK_LOADING_FETCH_STATE = {
        ...MOCK_LOADING_FETCH_STATE,
        loadingStates: new Set([TEST_STATE_CODES.TEXAS]),
      };
      const action = MOCK_ACTIONS.STATE_ERRORED;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.stateResponses.size).toBe(1);
      expect(result.stateResponses.has(TEST_STATE_CODES.ALABAMA)).toBe(true);
    });
  });

  describe('RESET action', () => {
    test('given RESET then returns initial state', () => {
      // Given
      const state = MOCK_LOADING_FETCH_STATE;
      const action = MOCK_ACTIONS.RESET;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result.hasStarted).toBe(false);
      expect(result.stateResponses.size).toBe(0);
      expect(result.completedStates.size).toBe(0);
      expect(result.loadingStates.size).toBe(0);
      expect(result.erroredStates.size).toBe(0);
    });
  });

  describe('unknown action', () => {
    test('given unknown action then returns current state', () => {
      // Given
      const state = MOCK_LOADING_FETCH_STATE;
      const action = { type: 'UNKNOWN_ACTION' } as unknown as typeof MOCK_ACTIONS.RESET;

      // When
      const result = fetchReducer(state, action);

      // Then
      expect(result).toBe(state);
    });
  });
});
