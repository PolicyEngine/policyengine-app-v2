import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as buildParameterTreeModule from '@/libs/buildParameterTree';
import metadataReducer, {
  clearMetadata,
  fetchCoreMetadataThunk,
  fetchParametersThunk,
  setCurrentCountry,
} from '@/reducers/metadataReducer';
import {
  createMockClearedState,
  createMockStateWithData,
  expectCurrentCountry,
  EXPECTED_INITIAL_STATE,
  expectEmptyMetadata,
  expectCoreErrorState,
  expectCoreLoadingState,
  expectParameterTree,
  expectStateToEqual,
  MOCK_PARAMETER_TREE,
  TEST_COUNTRY_CA,
  TEST_COUNTRY_UK,
  TEST_COUNTRY_US,
  TEST_ERROR_MESSAGE,
  TEST_VERSION,
} from '@/tests/fixtures/reducers/metadataReducerMocks';

// Mock the storage loaders
vi.mock('@/storage', () => ({
  loadCoreMetadata: vi.fn(),
  loadParameters: vi.fn(),
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

    test('given setCurrentCountry when coreLoaded is true then clears metadata', () => {
      const initialState = createMockStateWithData({ coreLoaded: true });
      const action = setCurrentCountry(TEST_COUNTRY_UK);
      const state = metadataReducer(initialState, action);
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expectEmptyMetadata(state);
    });

    test('given setCurrentCountry when coreLoaded is true then resets loading and error states', () => {
      // When switching countries with data already loaded, states should reset
      // so the new country's data can be fetched fresh
      const initialState = createMockStateWithData({
        coreLoading: true,
        coreError: TEST_ERROR_MESSAGE,
        coreLoaded: true,
      });
      const action = setCurrentCountry(TEST_COUNTRY_CA);
      const state = metadataReducer(initialState, action);
      expectCoreLoadingState(state, false);
      expectCoreErrorState(state, null);
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

  describe('fetchCoreMetadataThunk', () => {
    test('given pending action then sets coreLoading state', () => {
      const initialState = EXPECTED_INITIAL_STATE;
      const action = { type: fetchCoreMetadataThunk.pending.type };
      const state = metadataReducer(initialState, action);
      expect(state.coreLoading).toBe(true);
      expect(state.coreError).toBeNull();
    });

    test('given fulfilled action then updates core metadata fields', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, coreLoading: true };
      const mockVariables = [
        { id: '1', name: 'income', entity: 'person', description: 'Income' },
      ];
      const mockDatasets = [
        { id: '1', name: 'cps_2024', description: 'CPS 2024' },
      ];
      const action = {
        type: fetchCoreMetadataThunk.fulfilled.type,
        payload: {
          data: {
            variables: mockVariables,
            datasets: mockDatasets,
            version: TEST_VERSION,
            versionId: 'version-123',
          },
          countryId: TEST_COUNTRY_US,
        },
      };

      const state = metadataReducer(initialState, action);

      expect(state.coreLoading).toBe(false);
      expect(state.coreLoaded).toBe(true);
      expect(state.coreError).toBeNull();
      expect(state.currentCountry).toBe(TEST_COUNTRY_US);
      expect(state.version).toBe(TEST_VERSION);
      expect(state.variables).toEqual({ income: mockVariables[0] });
      expect(state.datasets).toHaveLength(1);
      expect(state.datasets[0].name).toBe('cps_2024');
    });

    test('given rejected action then sets coreError state', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, coreLoading: true };
      const action = {
        type: fetchCoreMetadataThunk.rejected.type,
        payload: TEST_ERROR_MESSAGE,
      };
      const state = metadataReducer(initialState, action);
      expect(state.coreLoading).toBe(false);
      expect(state.coreError).toBe(TEST_ERROR_MESSAGE);
    });
  });

  describe('fetchParametersThunk', () => {
    test('given pending action then sets parametersLoading state', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, coreLoaded: true };
      const action = { type: fetchParametersThunk.pending.type };
      const state = metadataReducer(initialState, action);
      expect(state.parametersLoading).toBe(true);
      expect(state.parametersError).toBeNull();
    });

    test('given fulfilled action then updates parameters fields', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, coreLoaded: true, parametersLoading: true };
      const mockParameters = [
        { id: 'p1', name: 'tax.rate', label: 'Tax Rate' },
      ];
      const mockParameterValues = [
        { id: 'pv1', parameter_id: 'p1', start_date: '2024-01-01', value_json: 0.25 },
      ];
      const action = {
        type: fetchParametersThunk.fulfilled.type,
        payload: {
          data: {
            parameters: mockParameters,
            parameterValues: mockParameterValues,
          },
        },
      };

      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(MOCK_PARAMETER_TREE);

      const state = metadataReducer(initialState, action);

      expect(state.parametersLoading).toBe(false);
      expect(state.parametersLoaded).toBe(true);
      expect(state.parametersError).toBeNull();
      expect(state.parameters['tax.rate']).toBeDefined();
      expect(state.parameters['tax.rate'].values['2024-01-01']).toBe(0.25);
      expectParameterTree(state, true);
    });

    test('given rejected action then sets parametersError state', () => {
      const initialState = { ...EXPECTED_INITIAL_STATE, coreLoaded: true, parametersLoading: true };
      const action = {
        type: fetchParametersThunk.rejected.type,
        payload: TEST_ERROR_MESSAGE,
      };
      const state = metadataReducer(initialState, action);
      expect(state.parametersLoading).toBe(false);
      expect(state.parametersError).toBe(TEST_ERROR_MESSAGE);
    });
  });

  describe('state transitions', () => {
    test('given sequence of actions then maintains correct state', () => {
      let state = EXPECTED_INITIAL_STATE;

      // Set country
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_US));
      expectCurrentCountry(state, TEST_COUNTRY_US);

      // Start core loading
      state = metadataReducer(state, { type: fetchCoreMetadataThunk.pending.type });
      expect(state.coreLoading).toBe(true);

      // Receive core data
      state = metadataReducer(state, {
        type: fetchCoreMetadataThunk.fulfilled.type,
        payload: {
          data: {
            variables: [{ id: '1', name: 'test', entity: 'person' }],
            datasets: [],
            version: TEST_VERSION,
            versionId: 'v1',
          },
          countryId: TEST_COUNTRY_US,
        },
      });
      expect(state.coreLoading).toBe(false);
      expect(state.coreLoaded).toBe(true);

      // Start parameters loading
      state = metadataReducer(state, { type: fetchParametersThunk.pending.type });
      expect(state.parametersLoading).toBe(true);

      // Change country (should clear data and reset loading states)
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_UK));
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expect(state.coreLoaded).toBe(false);
      expect(state.parametersLoaded).toBe(false);
    });
  });
});
