import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchCountries } from '@/api/countries';
import { FALLBACK_COUNTRIES, useCountries, useCountryCapability } from '@/hooks/useCountries';

vi.mock('@/api/countries', () => ({
  fetchCountries: vi.fn(),
}));

const mockFetchCountries = vi.mocked(fetchCountries);

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCountries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the Public API lists countries then returns those the app supports, US first', async () => {
    // Given
    mockFetchCountries.mockResolvedValue([
      { id: 'be', name: 'Belgium', householdEnabled: true, societyWideEnabled: false },
      { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: true },
      {
        id: 'us',
        name: 'United States of America',
        householdEnabled: true,
        societyWideEnabled: true,
      },
    ]);

    // When
    const { result } = renderHook(() => useCountries(), { wrapper: createWrapper() });

    // Then
    await waitFor(() => expect(result.current.isFallback).toBe(false));
    expect(result.current.countries).toEqual([
      {
        id: 'us',
        name: 'United States of America',
        householdEnabled: true,
        societyWideEnabled: true,
      },
      { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: true },
    ]);
  });

  test('given the request fails then returns the built-in US and UK list', async () => {
    // Given
    mockFetchCountries.mockRejectedValue(new Error('Failed to fetch countries: HTTP 503'));

    // When
    const { result } = renderHook(() => useCountries(), { wrapper: createWrapper() });

    // Then
    await waitFor(() => expect(mockFetchCountries).toHaveBeenCalled());
    expect(result.current.isFallback).toBe(true);
    expect(result.current.countries).toEqual(FALLBACK_COUNTRIES);
  });

  test('given the request is still loading then returns the built-in list', () => {
    // Given
    mockFetchCountries.mockReturnValue(new Promise(() => {}));

    // When
    const { result } = renderHook(() => useCountries(), { wrapper: createWrapper() });

    // Then
    expect(result.current.isFallback).toBe(true);
    expect(result.current.countries.map((country) => country.id)).toEqual(['us', 'uk']);
  });

  test('given the API lists none of the app countries then returns the built-in list', async () => {
    // Given
    mockFetchCountries.mockResolvedValue([
      { id: 'be', name: 'Belgium', householdEnabled: true, societyWideEnabled: false },
    ]);

    // When
    const { result } = renderHook(() => useCountries(), { wrapper: createWrapper() });

    // Then
    await waitFor(() => expect(mockFetchCountries).toHaveBeenCalled());
    await waitFor(() => expect(result.current.countries).toEqual(FALLBACK_COUNTRIES));
    expect(result.current.isFallback).toBe(true);
  });
});

describe('useCountryCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the API lists the UK as household-only then reports society-wide as unavailable', async () => {
    // Given
    mockFetchCountries.mockResolvedValue([
      { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: false },
      { id: 'us', name: 'United States', householdEnabled: true, societyWideEnabled: true },
    ]);

    // When
    const { result } = renderHook(() => useCountryCapability('uk'), {
      wrapper: createWrapper(),
    });

    // Then
    await waitFor(() => expect(result.current.societyWideEnabled).toBe(false));
    expect(result.current.householdEnabled).toBe(true);
  });

  test('given the request fails then the US keeps every calculation', async () => {
    // Given
    mockFetchCountries.mockRejectedValue(new Error('network'));

    // When
    const { result } = renderHook(() => useCountryCapability('us'), {
      wrapper: createWrapper(),
    });

    // Then
    await waitFor(() => expect(mockFetchCountries).toHaveBeenCalled());
    expect(result.current).toMatchObject({ householdEnabled: true, societyWideEnabled: true });
  });
});
