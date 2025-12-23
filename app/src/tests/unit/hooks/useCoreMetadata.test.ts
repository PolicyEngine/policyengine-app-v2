import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@test-utils';
import {
  TEST_COUNTRIES,
  MOCK_METADATA_STATE_INITIAL,
  MOCK_METADATA_STATE_LOADING,
  MOCK_METADATA_STATE_LOADED,
  MOCK_METADATA_STATE_ERROR,
} from '@/tests/fixtures/hooks/metadataHooksMocks';

// Mock dispatch function
const mockDispatch = vi.fn();

// Mock state values - type to allow reassignment
let mockState: { metadata: typeof MOCK_METADATA_STATE_INITIAL } = { metadata: MOCK_METADATA_STATE_INITIAL };

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
    fetchCoreMetadataThunk: vi.fn((countryId: string) => ({ type: 'FETCH_CORE', payload: countryId })),
  };
});

// Import after mocks are set up
import { selectCoreMetadataState, useFetchCoreMetadata } from '@/hooks/useCoreMetadata';
import { fetchCoreMetadataThunk } from '@/reducers/metadataReducer';

describe('useCoreMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { metadata: MOCK_METADATA_STATE_INITIAL };
  });

  describe('selectCoreMetadataState', () => {
    it('given initial state then returns loading as false', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      const result = selectCoreMetadataState(state);

      // Then
      expect(result.loading).toBe(false);
      expect(result.loaded).toBe(false);
      expect(result.error).toBeNull();
    });

    it('given loading state then returns loading as true', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_LOADING };

      // When
      const result = selectCoreMetadataState(state);

      // Then
      expect(result.loading).toBe(true);
    });

    it('given loaded state then returns loaded as true with country', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      const result = selectCoreMetadataState(state);

      // Then
      expect(result.loaded).toBe(true);
      expect(result.currentCountry).toBe(TEST_COUNTRIES.US);
    });

    it('given error state then returns error message', () => {
      // Given
      const state = { metadata: MOCK_METADATA_STATE_ERROR };

      // When
      const result = selectCoreMetadataState(state);

      // Then
      expect(result.error).toBe('Failed to load metadata');
    });
  });

  describe('useFetchCoreMetadata', () => {
    it('given initial state and country then dispatches fetch action', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      renderHook(() => useFetchCoreMetadata(TEST_COUNTRIES.US));

      // Then
      expect(mockDispatch).toHaveBeenCalled();
      expect(fetchCoreMetadataThunk).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given loading state then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADING };

      // When
      renderHook(() => useFetchCoreMetadata(TEST_COUNTRIES.US));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('given loaded state for same country then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      renderHook(() => useFetchCoreMetadata(TEST_COUNTRIES.US));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('given loaded state for different country then dispatches fetch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_LOADED };

      // When
      renderHook(() => useFetchCoreMetadata(TEST_COUNTRIES.UK));

      // Then
      expect(mockDispatch).toHaveBeenCalled();
      expect(fetchCoreMetadataThunk).toHaveBeenCalledWith(TEST_COUNTRIES.UK);
    });

    it('given empty country then does not dispatch', () => {
      // Given
      mockState = { metadata: MOCK_METADATA_STATE_INITIAL };

      // When
      renderHook(() => useFetchCoreMetadata(''));

      // Then
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
