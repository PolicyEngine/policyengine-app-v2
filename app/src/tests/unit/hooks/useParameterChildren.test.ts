import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParameterChildren } from '@/api/v2/parameterTree';
import { useParameterChildren } from '@/hooks/useParameterChildren';
import {
  MOCK_CHILDREN_RESPONSE,
  MOCK_EMPTY_CHILDREN_RESPONSE,
  PARENT_PATHS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/v2/parameterTreeMocks';

// Mock API and cache modules
vi.mock('@/api/v2/parameterTree', () => ({
  fetchParameterChildren: vi.fn(),
}));

vi.mock('@/libs/metadataCache', () => ({
  getCachedParameterChildren: vi.fn().mockReturnValue(null),
  setCachedParameterChildren: vi.fn(),
}));

describe('useParameterChildren', () => {
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
    it('given parent path then fetches and returns children', async () => {
      // Given
      vi.mocked(fetchParameterChildren).mockResolvedValue(MOCK_CHILDREN_RESPONSE);

      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.children.length).toBeGreaterThan(0);
      });

      // Then
      expect(result.current.children).toEqual(MOCK_CHILDREN_RESPONSE.children);
      expect(fetchParameterChildren).toHaveBeenCalledWith(PARENT_PATHS.GOV, TEST_COUNTRIES.US);
    });

    it('given empty children then returns empty array', async () => {
      // Given
      vi.mocked(fetchParameterChildren).mockResolvedValue(MOCK_EMPTY_CHILDREN_RESPONSE);

      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV_IRS_CREDITS, TEST_COUNTRIES.US),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Then
      expect(result.current.children).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Disabled states
  // -----------------------------------------------------------------------
  describe('disabled states', () => {
    it('given empty countryId then does not fetch', () => {
      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, ''),
        { wrapper },
      );

      // Then
      expect(fetchParameterChildren).not.toHaveBeenCalled();
      expect(result.current.children).toEqual([]);
    });

    it('given enabled false then does not fetch', () => {
      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US, false),
        { wrapper },
      );

      // Then
      expect(fetchParameterChildren).not.toHaveBeenCalled();
      expect(result.current.children).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('given fetch fails then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch parameter children');
      vi.mocked(fetchParameterChildren).mockRejectedValue(error);

      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Then
      expect(result.current.error).toEqual(error);
      expect(result.current.children).toEqual([]);
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
      vi.mocked(fetchParameterChildren).mockReturnValue(pendingPromise as any);

      // When
      const { result } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
        { wrapper },
      );

      // Then
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      resolvePromise!(MOCK_CHILDREN_RESPONSE);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // -----------------------------------------------------------------------
  // Caching
  // -----------------------------------------------------------------------
  describe('caching', () => {
    it('given same params then uses cached result', async () => {
      // Given
      vi.mocked(fetchParameterChildren).mockResolvedValue(MOCK_CHILDREN_RESPONSE);

      // When — first call
      const { result: result1 } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
        { wrapper },
      );

      await waitFor(() => {
        expect(result1.current.children.length).toBeGreaterThan(0);
      });

      // When — second call with same params
      const { result: result2 } = renderHook(
        () => useParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
        { wrapper },
      );

      // Then — only one fetch
      expect(fetchParameterChildren).toHaveBeenCalledTimes(1);
      expect(result2.current.children).toEqual(result1.current.children);
    });
  });
});
