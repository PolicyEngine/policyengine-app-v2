import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { useCountryMetadata } from '@/hooks/useCountryMetadata';
import * as metadataReducerModule from '@/reducers/metadataReducer';

// Mock the metadata thunk
vi.mock('@/reducers/metadataReducer', async () => {
  const actual = await vi.importActual('@/reducers/metadataReducer');
  return {
    ...actual,
    fetchMetadataThunk: vi.fn((country: string) => ({
      type: 'metadata/fetch/pending',
      meta: { arg: country },
    })),
  };
});

// Helper to create test wrapper with router and redux
function createWrapper(initialPath: string, metadataState: any) {
  const store = configureStore({
    reducer: {
      metadata: () => metadataState,
      // Add other required reducers with empty state
      policy: () => ({}),
      household: () => ({}),
      flow: () => ({ currentFrame: null }),
      simulations: () => ({}),
      population: () => ({}),
      report: () => ({}),
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };
}

describe('useCountryMetadata', () => {
  test('given metadata matches current country then returns ready state', () => {
    // Given
    const metadataState = {
      loading: false,
      error: null,
      currentCountry: 'uk',
      version: '1.0.0',
      variables: { test: 'data' },
      parameters: {},
    };
    const wrapper = createWrapper('/uk/policies', metadataState);

    // When
    const { result } = renderHook(() => useCountryMetadata(), { wrapper });

    // Then
    expect(result.current.country).toBe('uk');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metadata).toEqual(metadataState);
    expect(result.current.error).toBeNull();
  });

  test('given metadata for different country then shows loading', () => {
    // Given
    const metadataState = {
      loading: false,
      error: null,
      currentCountry: 'us',
      version: '1.0.0',
      variables: {},
      parameters: {},
    };
    const wrapper = createWrapper('/uk/policies', metadataState);

    // When
    const { result } = renderHook(() => useCountryMetadata(), { wrapper });

    // Then
    expect(result.current.country).toBe('uk');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.metadata).toBeNull();
  });

  test('given metadata is loading then shows loading state', () => {
    // Given
    const metadataState = {
      loading: true,
      error: null,
      currentCountry: 'uk',
      version: null,
    };
    const wrapper = createWrapper('/uk/policies', metadataState);

    // When
    const { result } = renderHook(() => useCountryMetadata(), { wrapper });

    // Then
    expect(result.current.country).toBe('uk');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.metadata).toBeNull();
  });

  test('given country changes then triggers new fetch', async () => {
    // Given
    const metadataState = {
      loading: false,
      error: null,
      currentCountry: 'us',
      version: '1.0.0',
    };
    const wrapper = createWrapper('/uk/policies', metadataState);
    const fetchSpy = vi.spyOn(metadataReducerModule, 'fetchMetadataThunk');

    // When
    renderHook(() => useCountryMetadata(), { wrapper });

    // Then
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('uk');
    });
  });

  test('given error in metadata then returns error', () => {
    // Given
    const metadataState = {
      loading: false,
      error: 'Failed to fetch',
      currentCountry: 'uk',
      version: null,
    };
    const wrapper = createWrapper('/uk/policies', metadataState);

    // When
    const { result } = renderHook(() => useCountryMetadata(), { wrapper });

    // Then
    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.isLoading).toBe(true); // Still loading because version is null
    expect(result.current.metadata).toBeNull();
  });
});
