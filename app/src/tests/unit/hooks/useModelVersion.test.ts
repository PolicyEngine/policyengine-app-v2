import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchModelByCountry } from '@/api/v2/taxBenefitModels';
import { useModelVersion } from '@/hooks/useModelVersion';
import {
  clearMetadataCache,
  getCachedModelVersion,
  setCachedModelVersion,
} from '@/libs/metadataCache';
import { parameterTreeKeys } from '@/libs/queryKeys';
import {
  MOCK_CACHED_VERSION_MATCHING,
  MOCK_CACHED_VERSION_STALE,
  MOCK_MODEL_BY_COUNTRY_RESPONSE,
  TEST_COUNTRIES,
  TEST_VERSIONS,
} from '@/tests/fixtures/hooks/modelVersionMocks';

// Mock API module
vi.mock('@/api/v2/taxBenefitModels', () => ({
  fetchModelByCountry: vi.fn(),
  API_V2_BASE_URL: 'https://v2.api.policyengine.org',
  getModelName: vi.fn(),
}));

// Mock cache module
vi.mock('@/libs/metadataCache', () => ({
  getCachedModelVersion: vi.fn(),
  setCachedModelVersion: vi.fn(),
  clearMetadataCache: vi.fn(),
}));

describe('useModelVersion', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // -----------------------------------------------------------------------
  // Successful fetching
  // -----------------------------------------------------------------------
  describe('successful fetching', () => {
    it('given valid countryId then fetches model by country', async () => {
      // Given
      vi.mocked(fetchModelByCountry).mockResolvedValue(MOCK_MODEL_BY_COUNTRY_RESPONSE);
      vi.mocked(getCachedModelVersion).mockReturnValue(null);

      // When
      const { result } = renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      await waitFor(() => {
        expect(result.current.model).not.toBeNull();
      });

      // Then
      expect(fetchModelByCountry).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(result.current.model).toEqual(MOCK_MODEL_BY_COUNTRY_RESPONSE.model);
      expect(result.current.latestVersion).toEqual(MOCK_MODEL_BY_COUNTRY_RESPONSE.latest_version);
    });

    it('given empty countryId then does not fetch', () => {
      // When
      const { result } = renderHook(() => useModelVersion(''), { wrapper });

      // Then
      expect(fetchModelByCountry).not.toHaveBeenCalled();
      expect(result.current.model).toBeNull();
      expect(result.current.latestVersion).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Version check — no change
  // -----------------------------------------------------------------------
  describe('version unchanged', () => {
    it('given cached version matches API then does not clear cache', async () => {
      // Given
      vi.mocked(fetchModelByCountry).mockResolvedValue(MOCK_MODEL_BY_COUNTRY_RESPONSE);
      vi.mocked(getCachedModelVersion).mockReturnValue(MOCK_CACHED_VERSION_MATCHING);

      // When
      renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      await waitFor(() => {
        expect(setCachedModelVersion).toHaveBeenCalled();
      });

      // Then — cache NOT cleared
      expect(clearMetadataCache).not.toHaveBeenCalled();
      // But version IS written to cache
      expect(setCachedModelVersion).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_VERSIONS.US_VERSION_ID,
        TEST_VERSIONS.US_VERSION
      );
    });
  });

  // -----------------------------------------------------------------------
  // Version check — changed
  // -----------------------------------------------------------------------
  describe('version changed', () => {
    it('given cached version differs from API then clears cache and invalidates queries', async () => {
      // Given
      vi.mocked(fetchModelByCountry).mockResolvedValue(MOCK_MODEL_BY_COUNTRY_RESPONSE);
      vi.mocked(getCachedModelVersion).mockReturnValue(MOCK_CACHED_VERSION_STALE);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      await waitFor(() => {
        expect(clearMetadataCache).toHaveBeenCalled();
      });

      // Then
      expect(clearMetadataCache).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: parameterTreeKeys.all });
    });
  });

  // -----------------------------------------------------------------------
  // First visit (no cache)
  // -----------------------------------------------------------------------
  describe('first visit', () => {
    it('given no cached version then writes version without clearing', async () => {
      // Given
      vi.mocked(fetchModelByCountry).mockResolvedValue(MOCK_MODEL_BY_COUNTRY_RESPONSE);
      vi.mocked(getCachedModelVersion).mockReturnValue(null);

      // When
      renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      await waitFor(() => {
        expect(setCachedModelVersion).toHaveBeenCalled();
      });

      // Then — no clear (nothing to clear), but version is written
      expect(clearMetadataCache).not.toHaveBeenCalled();
      expect(setCachedModelVersion).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_VERSIONS.US_VERSION_ID,
        TEST_VERSIONS.US_VERSION
      );
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('given fetch fails then returns error state', async () => {
      // Given
      vi.mocked(fetchModelByCountry).mockRejectedValue(new Error('Network error'));
      vi.mocked(getCachedModelVersion).mockReturnValue(null);

      // When
      const { result } = renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Then
      expect(result.current.model).toBeNull();
      expect(result.current.latestVersion).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Loading states
  // -----------------------------------------------------------------------
  describe('loading states', () => {
    it('given query in progress then isLoading is true', async () => {
      // Given
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetchModelByCountry).mockReturnValue(pendingPromise as any);
      vi.mocked(getCachedModelVersion).mockReturnValue(null);

      // When
      const { result } = renderHook(() => useModelVersion(TEST_COUNTRIES.US), { wrapper });

      // Then
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      resolvePromise!(MOCK_MODEL_BY_COUNTRY_RESPONSE);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
