import { describe, test, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import metadataReducer, {
  setCurrentCountry,
  clearMetadata,
  fetchMetadataThunk,
} from '@/reducers/metadataReducer';
import * as metadataApi from '@/api/metadata';
import * as buildParameterTreeModule from '@/libs/buildParameterTree';
import {
  EXPECTED_INITIAL_STATE,
  TEST_COUNTRY_US,
  TEST_COUNTRY_UK,
  TEST_COUNTRY_CA,
  TEST_ERROR_MESSAGE,
  TEST_VERSION,
  TEST_CURRENT_LAW_ID,
  TEST_PARAMETER_KEY,
  MOCK_VARIABLES,
  MOCK_PARAMETERS,
  MOCK_ENTITIES,
  MOCK_VARIABLE_MODULES,
  MOCK_ECONOMY_OPTIONS,
  MOCK_BASIC_INPUTS,
  MOCK_MODELLED_POLICIES,
  MOCK_PARAMETER_TREE,
  MOCK_LOADING_STATE,
  MOCK_ERROR_STATE,
  createMockApiPayload,
  createMockStateWithData,
  createMockClearedState,
  createExpectedFulfilledState,
  expectStateToEqual,
  expectLoadingState,
  expectErrorState,
  expectCurrentCountry,
  expectVersion,
  expectParameterTree,
  expectEmptyMetadata,
} from '@/tests/fixtures/reducers/metadataReducerMocks';

// Mock the API and buildParameterTree modules
vi.mock('@/api/metadata');
vi.mock('@/libs/buildParameterTree');

describe('metadataReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initial state', () => {
    test('given no action then returns initial state', () => {
      // Given
      const action = { type: 'unknown/action' };

      // When
      const state = metadataReducer(undefined, action);

      // Then
      expectStateToEqual(state, EXPECTED_INITIAL_STATE);
    });
  });

  describe('setCurrentCountry action', () => {
    test('given setCurrentCountry with new country then updates country', () => {
      // Given
      const initialState = EXPECTED_INITIAL_STATE;
      const action = setCurrentCountry(TEST_COUNTRY_US);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectCurrentCountry(state, TEST_COUNTRY_US);
    });

    test('given setCurrentCountry when version is null then does not clear metadata', () => {
      // Given
      const initialState = EXPECTED_INITIAL_STATE;
      const action = setCurrentCountry(TEST_COUNTRY_US);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectCurrentCountry(state, TEST_COUNTRY_US);
      expect(state.variables).toEqual({});
      expect(state.parameters).toEqual({});
    });

    test('given setCurrentCountry when version exists then clears metadata', () => {
      // Given
      const initialState = createMockStateWithData({ version: TEST_VERSION });
      const action = setCurrentCountry(TEST_COUNTRY_UK);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expectEmptyMetadata(state);
    });

    test('given setCurrentCountry then preserves loading and error states', () => {
      // Given
      const initialState = createMockStateWithData({
        loading: true,
        error: TEST_ERROR_MESSAGE,
        version: TEST_VERSION,
      });
      const action = setCurrentCountry(TEST_COUNTRY_CA);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectLoadingState(state, true);
      expectErrorState(state, TEST_ERROR_MESSAGE);
    });
  });

  describe('clearMetadata action', () => {
    test('given clearMetadata then resets to initial state but keeps country', () => {
      // Given
      const initialState = createMockStateWithData({ currentCountry: TEST_COUNTRY_US });
      const action = clearMetadata();

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectStateToEqual(state, createMockClearedState(TEST_COUNTRY_US));
    });

    test('given clearMetadata with no country then keeps null country', () => {
      // Given
      const initialState = createMockStateWithData({ currentCountry: null });
      const action = clearMetadata();

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectStateToEqual(state, createMockClearedState(null));
    });
  });

  describe('fetchMetadataThunk', () => {
    test('given pending action then sets loading state', () => {
      // Given
      const initialState = EXPECTED_INITIAL_STATE;
      const action = { type: fetchMetadataThunk.pending.type };

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectLoadingState(state, true);
      expectErrorState(state, null);
    });

    test('given fulfilled action then updates all metadata fields', () => {
      // Given
      const initialState = MOCK_LOADING_STATE;
      const apiPayload = createMockApiPayload();
      const action = {
        type: fetchMetadataThunk.fulfilled.type,
        payload: { data: apiPayload, country: TEST_COUNTRY_US },
      };

      // Mock buildParameterTree to return our mock tree
      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(MOCK_PARAMETER_TREE);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectLoadingState(state, false);
      expectErrorState(state, null);
      expectCurrentCountry(state, TEST_COUNTRY_US);
      expect(state.variables).toEqual(MOCK_VARIABLES);
      expect(state.parameters).toEqual(MOCK_PARAMETERS);
      expect(state.entities).toEqual(MOCK_ENTITIES);
      expect(state.variableModules).toEqual(MOCK_VARIABLE_MODULES);
      expect(state.economyOptions).toEqual(MOCK_ECONOMY_OPTIONS);
      expect(state.currentLawId).toBe(TEST_CURRENT_LAW_ID);
      expect(state.basicInputs).toEqual(MOCK_BASIC_INPUTS);
      expect(state.modelledPolicies).toEqual(MOCK_MODELLED_POLICIES);
      expectVersion(state, TEST_VERSION);
      expectParameterTree(state, true);
    });

    test('given fulfilled action when buildParameterTree returns undefined then sets null tree', () => {
      // Given
      const initialState = MOCK_LOADING_STATE;
      const apiPayload = createMockApiPayload();
      const action = {
        type: fetchMetadataThunk.fulfilled.type,
        payload: { data: apiPayload, country: TEST_COUNTRY_US },
      };

      // Mock buildParameterTree to return undefined
      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(undefined);

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectParameterTree(state, false);
    });

    test('given fulfilled action when buildParameterTree throws error then sets null tree', () => {
      // Given
      const initialState = MOCK_LOADING_STATE;
      const apiPayload = createMockApiPayload();
      const action = {
        type: fetchMetadataThunk.fulfilled.type,
        payload: { data: apiPayload, country: TEST_COUNTRY_US },
      };

      // Mock buildParameterTree to throw error
      vi.mocked(buildParameterTreeModule.buildParameterTree).mockImplementation(() => {
        throw new Error('Failed to build tree');
      });

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectParameterTree(state, false);
      expect(console.error).toHaveBeenCalledWith('Failed to build parameter tree:', expect.any(Error));
    });

    test('given rejected action then sets error state', () => {
      // Given
      const initialState = MOCK_LOADING_STATE;
      const action = {
        type: fetchMetadataThunk.rejected.type,
        payload: TEST_ERROR_MESSAGE,
      };

      // When
      const state = metadataReducer(initialState, action);

      // Then
      expectLoadingState(state, false);
      expectErrorState(state, TEST_ERROR_MESSAGE);
    });
  });

  describe('fetchMetadataThunk async behavior', () => {
    test('given successful API call then returns data and country', async () => {
      // Given
      const apiPayload = createMockApiPayload();
      vi.mocked(metadataApi.fetchMetadata).mockResolvedValue(apiPayload);

      const store = configureStore({
        reducer: { metadata: metadataReducer },
      });

      // When
      const result = await store.dispatch(fetchMetadataThunk(TEST_COUNTRY_US));

      // Then
      expect(result.type).toBe(fetchMetadataThunk.fulfilled.type);
      expect(result.payload).toEqual({ data: apiPayload, country: TEST_COUNTRY_US });
    });

    test('given API error then rejects with error message', async () => {
      // Given
      const error = new Error(TEST_ERROR_MESSAGE);
      vi.mocked(metadataApi.fetchMetadata).mockRejectedValue(error);

      const store = configureStore({
        reducer: { metadata: metadataReducer },
      });

      // When
      const result = await store.dispatch(fetchMetadataThunk(TEST_COUNTRY_US));

      // Then
      expect(result.type).toBe(fetchMetadataThunk.rejected.type);
      expect(result.payload).toBe(TEST_ERROR_MESSAGE);
    });

    test('given non-Error rejection then rejects with unknown error', async () => {
      // Given
      vi.mocked(metadataApi.fetchMetadata).mockRejectedValue('String error');

      const store = configureStore({
        reducer: { metadata: metadataReducer },
      });

      // When
      const result = await store.dispatch(fetchMetadataThunk(TEST_COUNTRY_US));

      // Then
      expect(result.type).toBe(fetchMetadataThunk.rejected.type);
      expect(result.payload).toBe('Unknown error');
    });
  });

  describe('state transitions', () => {
    test('given sequence of actions then maintains correct state', () => {
      // Given
      let state = EXPECTED_INITIAL_STATE;

      // When & Then - Set country
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_US));
      expectCurrentCountry(state, TEST_COUNTRY_US);

      // When & Then - Start loading
      state = metadataReducer(state, { type: fetchMetadataThunk.pending.type });
      expectLoadingState(state, true);

      // When & Then - Receive data
      const apiPayload = createMockApiPayload();
      vi.mocked(buildParameterTreeModule.buildParameterTree).mockReturnValue(MOCK_PARAMETER_TREE);
      state = metadataReducer(state, {
        type: fetchMetadataThunk.fulfilled.type,
        payload: { data: apiPayload, country: TEST_COUNTRY_US },
      });
      expectLoadingState(state, false);
      expectVersion(state, TEST_VERSION);

      // When & Then - Change country (should clear data)
      state = metadataReducer(state, setCurrentCountry(TEST_COUNTRY_UK));
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expectEmptyMetadata(state);

      // When & Then - Clear metadata
      state = metadataReducer(state, clearMetadata());
      expectCurrentCountry(state, TEST_COUNTRY_UK);
      expectEmptyMetadata(state);
    });
  });
});