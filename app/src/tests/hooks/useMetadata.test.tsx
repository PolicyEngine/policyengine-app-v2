import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock must be before imports that use it
vi.mock('@/reducers/metadataReducer', () => ({
  fetchMetadataThunk: vi.fn((country: string) => {
    const thunk = () => ({ type: 'metadata/fetch/pending', meta: { arg: country } });
    thunk.country = country; // Add country as property for testing
    return thunk;
  }),
  default: (state = {}) => state,
}));

import { useFetchMetadata } from '@/hooks/useMetadata';
import {
  TEST_COUNTRY_US,
  TEST_COUNTRY_UK,
  TEST_COUNTRY_CA,
  mockInitialMetadataState,
  mockLoadedMetadataState,
  mockLoadingMetadataState,
  mockStateWithCurrentCountry,
  mockStateWithoutVersion,
  mockErrorState,
} from '@/tests/fixtures/hooks/useMetadataMocks';

// Track dispatched thunks
let dispatchedThunks: any[] = [];

// Helper to create test store and wrapper
const createTestSetup = (metadataState: any) => {
  dispatchedThunks = [];
  
  const store = configureStore({
    reducer: {
      metadata: () => metadataState,
      policy: () => ({}),
      simulation: () => ({}),
      population: () => ({}),
    },
  });

  // Intercept dispatch to track thunks
  const originalDispatch = store.dispatch;
  store.dispatch = ((action: any) => {
    if (typeof action === 'function' && action.country) {
      dispatchedThunks.push(action.country);
    }
    return originalDispatch(action);
  }) as any;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, wrapper };
};

describe('useFetchMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchedThunks = [];
  });

  test('given no metadata exists then fetches metadata with default country', () => {
    // Given
    const { wrapper } = createTestSetup(mockInitialMetadataState);

    // When
    renderHook(() => useFetchMetadata(), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given country parameter provided then fetches metadata for that country', () => {
    // Given
    const { wrapper } = createTestSetup(mockInitialMetadataState);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_UK), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_UK);
  });

  test('given metadata already exists for current country then does not fetch again', () => {
    // Given
    const { wrapper } = createTestSetup(mockLoadedMetadataState);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_US), { wrapper });

    // Then
    expect(dispatchedThunks).toHaveLength(0);
  });

  test('given metadata exists but country changes then fetches new metadata', () => {
    // Given
    const { wrapper } = createTestSetup(mockLoadedMetadataState);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_UK), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_UK);
  });

  test('given no country provided and metadata has current country then uses current country', () => {
    // Given
    const { wrapper } = createTestSetup(mockStateWithCurrentCountry);

    // When
    renderHook(() => useFetchMetadata(), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_CA);
  });

  test('given metadata version is null then fetches metadata', () => {
    // Given
    const { wrapper } = createTestSetup(mockStateWithoutVersion);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_US), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given undefined country and no current country then defaults to us', () => {
    // Given
    const { wrapper } = createTestSetup(mockInitialMetadataState);

    // When
    renderHook(() => useFetchMetadata(undefined), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given empty string country then uses default fallback', () => {
    // Given
    const { wrapper } = createTestSetup(mockInitialMetadataState);

    // When
    renderHook(() => useFetchMetadata(''), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given metadata fetch in progress then still fetches when version is null', () => {
    // Given
    const { wrapper } = createTestSetup(mockLoadingMetadataState);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_US), { wrapper });

    // Then - should still fetch because version is null even though loading
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given error in metadata state then attempts to fetch again', () => {
    // Given
    const { wrapper } = createTestSetup(mockErrorState);

    // When
    renderHook(() => useFetchMetadata(TEST_COUNTRY_US), { wrapper });

    // Then
    expect(dispatchedThunks).toContain(TEST_COUNTRY_US);
  });

  test('given country changes in props then handles re-render correctly', () => {
    // Given - metadata already loaded for US
    const { wrapper } = createTestSetup(mockLoadedMetadataState);
    const { rerender } = renderHook(
      ({ country }) => useFetchMetadata(country),
      { 
        wrapper,
        initialProps: { country: TEST_COUNTRY_US }
      }
    );
    
    // When - change to UK which needs fetching
    dispatchedThunks = [];
    rerender({ country: TEST_COUNTRY_UK });

    // Then - should fetch UK metadata
    expect(dispatchedThunks).toContain(TEST_COUNTRY_UK);
  });

  test('given hook unmounts then cleanup occurs without errors', () => {
    // Given
    const { wrapper } = createTestSetup(mockInitialMetadataState);

    // When
    const { unmount } = renderHook(() => useFetchMetadata(TEST_COUNTRY_UK), { wrapper });
    
    // Verify dispatch was called before unmount
    expect(dispatchedThunks).toContain(TEST_COUNTRY_UK);
    
    // Then - unmount should not throw
    expect(() => unmount()).not.toThrow();
  });
});