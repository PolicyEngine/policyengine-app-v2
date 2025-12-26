import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as buildParameterTreeModule from '@/libs/buildParameterTree';
import metadataReducer, {
  clearMetadata,
  fetchMetadataThunk,
  setCurrentCountry,
} from '@/reducers/metadataReducer';
import {
  createMockClearedState,
  createMockStateWithData,
  expectCurrentCountry,
  EXPECTED_INITIAL_STATE,
  expectEmptyMetadata,
  expectErrorState,
  expectLoadingState,
  expectParameterTree,
  expectStateToEqual,
  MOCK_PARAMETER_TREE,
  TEST_COUNTRY_CA,
  TEST_COUNTRY_UK,
  TEST_COUNTRY_US,
  TEST_ERROR_MESSAGE,
  TEST_VERSION,
} from '@/tests/fixtures/reducers/metadataReducerMocks';

// Mock the API calls (not used in reducer tests, but prevents actual network calls)
vi.mock('@/api/v2', () => ({
  fetchVariables: vi.fn(),
  fetchDatasets: vi.fn(),
  fetchParameters: vi.fn(),
  fetchModelVersion: vi.fn(),
}));

vi.mock('@/libs/buildParameterTree');

describe('metadataReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initial state', () => {
    test('given no action then returns initial state', () => {
      const action = { type: 'unknown/action' };
      const state = metadataReducer(undefined, action);
      expectStateToEqual(state, EXPECTED_INITIAL_STATE);
    });
  });

  describe('setCurrentCountry action', () => {
    test('given setCurrentCountry with new country then updates country', () => {
      const initialState = EXPECTED_INITIAL_STATE;
      const action = setCurrentCountry(TEST_COUNTRY_US);
      const state = metadataReducer(initialState, action);
      expectCurrentCountry(state, TEST_COUNTRY_US);
    });

    test('given setCurrentCountry when version is null then does not clear metadata', () => {
      const initialState = EXPECTED_INITIAL_STATE;
      const action = setCurrentCountry(TEST_COUNTRY_US);
      const state = metadataReducer(initialState, action);
      expectCurrentCountry(state, TEST_COUNTRY_US);
      expect(state.variables).toEqual({});
      expect(state.parameters).toEqual({});
    });

    test('given setCurrentCountry when loaded is true then clears metadata', () => {
      const initialState = createMockStateWithData({ loaded: true });
      const action = setCurrentCountry(TEST_COUNTRY_UK);
      const state = metadataReducer(initialState, action);
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expectEmptyMetadata(state);
    });

    test('given setCurrentCountry when loaded is true then resets loading and error states', () => {
      // When switching countries with data already loaded, states should reset
      // so the new country's data can be fetched fresh
      const initialState = createMockStateWithData({
        loading: true,
        error: TEST_ERROR_MESSAGE,
        loaded: true,
      });
      const action = setCurrentCountry(TEST_COUNTRY_CA);
      const state = metadataReducer(initialState, action);
      expectLoadingState(state, false);
      expectErrorState(state, null);
    });
  });

  describe('clearMetadata action', () => {
    test('given clearMetadata then resets to initial state but keeps country', () => {
      const initialState = createMockStateWithData({ currentCountry: TEST_COUNTRY_US });
      const action = clearMetadata();
      const state = metadataReducer(initialState, action);
      expectStateToEqual(state, createMockClearedState(TEST_COUNTRY_US));
    });

    test('given clearMetadata with no country then keeps null country', () => {
      const initialState = createMockStateWithData({ currentCountry: null });
      const action = clearMetadata();
      const state = metadataReducer(initialState, action);
      expectStateToEqual(state, createMockClearedState(null));
    });
  });

  describe('fetchMetadataThunk', () => {
    test('given pending action then sets loading state', () => {
      const initialState = EXPECTED_INITIAL_STATE;
      const action = { type: fetchMetadataThunk.pending.type };
      const state = metadataReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('given fulfilled action then updates all metadata fields', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, loading: true };
      const mockVariables = [
        { id: '1', name: 'income', entity: 'person', description: 'Income' },
      ];
      const mockDatasets = [
        { id: '1', name: 'cps_2024', description: 'CPS 2024' },
      ];
      const mockParameters = [
        { id: 'p1', name: 'tax.rate', label: 'Tax Rate' },
      ];
      const action = {
        type: fetchMetadataThunk.fulfilled.type,
        payload: {
          data: {
            variables: mockVariables,
            datasets: mockDatasets,
            parameters: mockParameters,
            version: TEST_VERSION,
            versionId: 'version-123',
          },
          countryId: TEST_COUNTRY_US,
        },
      };

      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(MOCK_PARAMETER_TREE);

      const state = metadataReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(true);
      expect(state.error).toBeNull();
      expect(state.currentCountry).toBe(TEST_COUNTRY_US);
      expect(state.version).toBe(TEST_VERSION);
      // Reducer transforms variables by adding label and other fields
      expect(state.variables.income).toBeDefined();
      expect(state.variables.income.name).toBe('income');
      expect(state.variables.income.entity).toBe('person');
      expect(state.variables.income.label).toBe('Income'); // Generated from name
      expect(state.datasets).toHaveLength(1);
      expect(state.datasets[0].name).toBe('cps_2024');
      expect(state.parameters['tax.rate']).toBeDefined();
      // Parameter values are fetched on-demand, not prefetched
      expect(state.parameters['tax.rate']?.values).toEqual({});
      expectParameterTree(state, true);
    });

    test('given rejected action then sets error state', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, loading: true };
      const action = {
        type: fetchMetadataThunk.rejected.type,
        payload: TEST_ERROR_MESSAGE,
      };
      const state = metadataReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(TEST_ERROR_MESSAGE);
    });
  });

  describe('state transitions', () => {
    test('given sequence of actions then maintains correct state', () => {
      let state = EXPECTED_INITIAL_STATE;

      // Set country
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_US));
      expectCurrentCountry(state, TEST_COUNTRY_US);

      // Start loading
      state = metadataReducer(state, { type: fetchMetadataThunk.pending.type });
      expect(state.loading).toBe(true);

      // Receive data
      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(MOCK_PARAMETER_TREE);
      state = metadataReducer(state, {
        type: fetchMetadataThunk.fulfilled.type,
        payload: {
          data: {
            variables: [{ id: '1', name: 'test', entity: 'person' }],
            datasets: [],
            parameters: [],
            version: TEST_VERSION,
            versionId: 'v1',
          },
          countryId: TEST_COUNTRY_US,
        },
      });
      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(true);

      // Change country (should clear data and reset loading states)
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_UK));
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expect(state.loaded).toBe(false);
    });
  });
});
