import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import the mocked function
import { fetchParameterValues } from '@/api/v2/parameterValues';
import { useParameterValues } from '@/hooks/useParameterValues';
import { createMockParameterValues, TEST_POLICY_IDS } from '@/tests/fixtures/api/v2/apiV2Mocks';

// Mock the API module
vi.mock('@/api/v2/parameterValues', () => ({
  fetchParameterValues: vi.fn(),
}));

describe('useParameterValues', () => {
  let queryClient: QueryClient;

  const TEST_PARAMETER_ID = 'param-123';

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('successful fetching', () => {
    it('given parameter and policy IDs then fetches and converts to ValuesList', async () => {
      // Given
      const mockValues = createMockParameterValues(3, TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE);
      vi.mocked(fetchParameterValues).mockResolvedValue(mockValues);

      // When
      const { result } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        '2020-01-01': 100,
        '2021-01-01': 110,
        '2022-01-01': 120,
      });
      expect(fetchParameterValues).toHaveBeenCalledWith(
        TEST_PARAMETER_ID,
        TEST_POLICY_IDS.BASELINE
      );
    });

    it('given empty response then returns empty object', async () => {
      // Given
      vi.mocked(fetchParameterValues).mockResolvedValue([]);

      // When
      const { result } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({});
    });
  });

  describe('disabled states', () => {
    it('given undefined parameterId then does not fetch', async () => {
      // When
      const { result } = renderHook(() => useParameterValues(undefined, TEST_POLICY_IDS.BASELINE), {
        wrapper,
      });

      // Then
      // Query should be disabled and return empty object
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchParameterValues).not.toHaveBeenCalled();
    });

    it('given undefined policyId then does not fetch', async () => {
      // When
      const { result } = renderHook(() => useParameterValues(TEST_PARAMETER_ID, undefined), {
        wrapper,
      });

      // Then
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchParameterValues).not.toHaveBeenCalled();
    });

    it('given both IDs undefined then does not fetch', async () => {
      // When
      const { result } = renderHook(() => useParameterValues(undefined, undefined), { wrapper });

      // Then
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchParameterValues).not.toHaveBeenCalled();
    });

    it('given enabled option false then does not fetch', async () => {
      // When
      const { result } = renderHook(
        () =>
          useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE, {
            enabled: false,
          }),
        { wrapper }
      );

      // Then
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchParameterValues).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('given fetch fails then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch parameter values');
      vi.mocked(fetchParameterValues).mockRejectedValue(error);

      // When
      const { result } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('loading states', () => {
    it('given query in progress then isLoading is true', async () => {
      // Given
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetchParameterValues).mockReturnValue(pendingPromise as any);

      // When
      const { result } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      // Then
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      resolvePromise!([]);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('caching', () => {
    it('given same parameters then returns cached result', async () => {
      // Given
      const mockValues = createMockParameterValues(2, TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE);
      vi.mocked(fetchParameterValues).mockResolvedValue(mockValues);

      // When - First call
      const { result: result1 } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // When - Second call with same params
      const { result: result2 } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      // Then - Should use cached value, only one fetch
      expect(fetchParameterValues).toHaveBeenCalledTimes(1);
      expect(result2.current.data).toEqual(result1.current.data);
    });

    it('given different policy ID then fetches again', async () => {
      // Given
      const mockValues1 = createMockParameterValues(2, TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE);
      const mockValues2 = createMockParameterValues(2, TEST_PARAMETER_ID, TEST_POLICY_IDS.REFORM);
      vi.mocked(fetchParameterValues)
        .mockResolvedValueOnce(mockValues1)
        .mockResolvedValueOnce(mockValues2);

      // When - First call with baseline
      const { result: result1 } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // When - Second call with reform
      const { result: result2 } = renderHook(
        () => useParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.REFORM),
        { wrapper }
      );

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Then - Should have fetched twice with different params
      expect(fetchParameterValues).toHaveBeenCalledTimes(2);
      expect(fetchParameterValues).toHaveBeenNthCalledWith(
        1,
        TEST_PARAMETER_ID,
        TEST_POLICY_IDS.BASELINE
      );
      expect(fetchParameterValues).toHaveBeenNthCalledWith(
        2,
        TEST_PARAMETER_ID,
        TEST_POLICY_IDS.REFORM
      );
    });
  });
});
