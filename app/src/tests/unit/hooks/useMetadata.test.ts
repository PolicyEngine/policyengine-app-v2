import { renderHook } from '@test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Import after mocks are set up
import { selectMetadataState, useFetchMetadata } from '@/hooks/useMetadata';
import { getCachedVariables } from '@/libs/metadataCache';
import {
  fetchMetadataThunk,
  fetchVariablesThunk,
  hydrateVariables,
} from '@/reducers/metadataReducer';
import {
  MOCK_METADATA_STATE_ERROR,
  MOCK_METADATA_STATE_INITIAL,
  MOCK_METADATA_STATE_LOADED,
  MOCK_METADATA_STATE_LOADING,
  MOCK_VARIABLES_RECORD,
  TEST_COUNTRIES,
} from '@/tests/fixtures/hooks/metadataHooksMocks';

// Mock dispatch function
const mockDispatch = vi.fn();

// Mock state values - type to allow reassignment
let mockState: { metadata: typeof MOCK_METADATA_STATE_INITIAL } = {
  metadata: MOCK_METADATA_STATE_INITIAL,
};

// Mock react-redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
  };
});

// Mock the reducer module - need to include default export for store
vi.mock('@/reducers/metadataReducer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/reducers/metadataReducer')>();
  return {
    ...actual,
    fetchMetadataThunk: vi.fn((countryId: string) => ({
      type: 'FETCH_METADATA',
      payload: countryId,
    })),
    fetchVariablesThunk: vi.fn((countryId: string) => ({
      type: 'FETCH_VARIABLES',
      payload: countryId,
    })),
    hydrateVariables: vi.fn((payload: unknown) => ({
      type: 'HYDRATE_VARIABLES',
      payload,
    })),
  };
});

// Mock metadataCache
vi.mock('@/libs/metadataCache', () => ({
  getCachedVariables: vi.fn(),
}));

// Mock useModelVersion (called inside useFetchMetadata)
vi.mock('@/hooks/useModelVersion', () => ({
  useModelVersion: vi.fn().mockReturnValue({
    model: null,
    latestVersion: null,
    isLoading: false,
    error: null,
  }),
}));

describe('useMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { metadata: MOCK_METADATA_STATE_INITIAL };
    vi.mocked(getCachedVariables).mockReturnValue(null);
  });

  describe('selectMetadataState', () => {
    it('given initial state then returns loading as false', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      const result = selectMetadataState(state);

      // Then
      expect(result.loading).toBe(false);
      expect(result.loaded).toBe(false);
      expect(result.error).toBeNull();
    });

    it('given loading state then returns loading as true', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_LOADING };

      // When
      const result = selectMetadataState(state);

      // Then
      expect(result.loading).toBe(true);
    });

    it('given loaded state then returns loaded as true with country', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      const result = selectMetadataState(state);

      // Then
      expect(result.loaded).toBe(true);
      expect(result.currentCountry).toBe(TEST_COUNTRIES.US);
    });

    it('given error state then returns error message', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_ERROR };

      // When
      const result = selectMetadataState(state);

      // Then
      expect(result.error).toBe('Failed to load metadata');
    });
  });

  describe('useFetchMetadata', () => {
    it('given initial state and country then dispatches metadata and variables thunks', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.US));

      // Then
      expect(fetchMetadataThunk).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(fetchVariablesThunk).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given cached variables then hydrates from cache before fetching', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };
      vi.mocked(getCachedVariables).mockReturnValue(MOCK_VARIABLES_RECORD);

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.US));

      // Then — hydrate dispatched
      expect(hydrateVariables).toHaveBeenCalledWith({
        variables: MOCK_VARIABLES_RECORD,
        countryId: TEST_COUNTRIES.US,
      });
    });

    it('given no cached variables then skips hydrate dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };
      vi.mocked(getCachedVariables).mockReturnValue(null);

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.US));

      // Then — hydrate NOT dispatched, but fetch still dispatched
      expect(hydrateVariables).not.toHaveBeenCalled();
      expect(fetchMetadataThunk).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given loading state then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADING };

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.US));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('given loaded state for same country then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.US));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('given loaded state for different country then dispatches fetch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      renderHook(() => useFetchMetadata(TEST_COUNTRIES.UK));

      // Then
      expect(fetchMetadataThunk).toHaveBeenCalledWith(TEST_COUNTRIES.UK);
      expect(fetchVariablesThunk).toHaveBeenCalledWith(TEST_COUNTRIES.UK);
    });

    it('given empty country then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      renderHook(() => useFetchMetadata(''));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
