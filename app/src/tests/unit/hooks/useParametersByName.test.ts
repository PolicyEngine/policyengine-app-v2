import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParametersByName } from '@/api/v2/parameterTree';
import { useParametersByName } from '@/hooks/useParametersByName';
import {
  ANCESTOR_TEST_CASES,
  MOCK_V2_PARAM_CTC,
  MOCK_V2_PARAM_EITC,
  MOCK_V2_PARAM_NO_LABEL,
  MOCK_V2_PARAMS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/hooks/parameterTreeHooksMocks';

// Mock API and cache modules
vi.mock('@/api/v2/parameterTree', () => ({
  fetchParametersByName: vi.fn(),
}));

vi.mock('@/libs/metadataCache', () => ({
  getCachedParameters: vi.fn().mockReturnValue(null),
  setCachedParameters: vi.fn(),
}));

describe('useParametersByName', () => {
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
  // Ancestor expansion (tested via the API call args)
  // -----------------------------------------------------------------------
  describe('ancestor expansion', () => {
    it('given single deep path then fetches with all ancestor segments', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue(MOCK_V2_PARAMS);

      // When
      renderHook(
        () => useParametersByName(
          [...ANCESTOR_TEST_CASES.SIMPLE.input],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(fetchParametersByName).toHaveBeenCalled();
      });

      // Then — expanded names include ancestors
      const calledNames = vi.mocked(fetchParametersByName).mock.calls[0][0];
      for (const expected of ANCESTOR_TEST_CASES.SIMPLE.expected) {
        expect(calledNames).toContain(expected);
      }
      // Should NOT include bare "gov"
      expect(calledNames).not.toContain('gov');
    });

    it('given overlapping paths then deduplicates common ancestors', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue(MOCK_V2_PARAMS);

      // When
      renderHook(
        () => useParametersByName(
          [...ANCESTOR_TEST_CASES.MULTIPLE_OVERLAPPING.input],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(fetchParametersByName).toHaveBeenCalled();
      });

      // Then — deduplicated: gov.irs and gov.irs.credits appear once each
      const calledNames = vi.mocked(fetchParametersByName).mock.calls[0][0];
      const govIrsCount = calledNames.filter((n: string) => n === 'gov.irs').length;
      expect(govIrsCount).toBe(1);
    });

    it('given short path then expands correctly', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue([]);

      // When
      renderHook(
        () => useParametersByName(
          [...ANCESTOR_TEST_CASES.SHORT_PATH.input],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(fetchParametersByName).toHaveBeenCalled();
      });

      // Then
      const calledNames = vi.mocked(fetchParametersByName).mock.calls[0][0];
      expect(calledNames).toContain('gov.irs');
    });
  });

  // -----------------------------------------------------------------------
  // Data conversion (V2ParameterData → ParameterMetadata)
  // -----------------------------------------------------------------------
  describe('data conversion', () => {
    it('given V2 response then converts to ParameterMetadata record', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue([MOCK_V2_PARAM_EITC]);

      // When
      const { result } = renderHook(
        () => useParametersByName(
          [MOCK_V2_PARAM_EITC.name],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(Object.keys(result.current.parameters).length).toBeGreaterThan(0);
      });

      // Then
      const param = result.current.parameters[MOCK_V2_PARAM_EITC.name];
      expect(param).toBeDefined();
      expect(param.id).toBe(MOCK_V2_PARAM_EITC.id);
      expect(param.name).toBe(MOCK_V2_PARAM_EITC.name);
      expect(param.label).toBe(MOCK_V2_PARAM_EITC.label);
      expect(param.parameter).toBe(MOCK_V2_PARAM_EITC.name);
      expect(param.type).toBe('parameter');
      expect(param.values).toEqual({});
    });

    it('given null label then falls back to name', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue([MOCK_V2_PARAM_NO_LABEL]);

      // When
      const { result } = renderHook(
        () => useParametersByName(
          [MOCK_V2_PARAM_NO_LABEL.name],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(Object.keys(result.current.parameters).length).toBeGreaterThan(0);
      });

      // Then
      const param = result.current.parameters[MOCK_V2_PARAM_NO_LABEL.name];
      expect(param.label).toBe(MOCK_V2_PARAM_NO_LABEL.name);
    });

    it('given multiple parameters then returns keyed record', async () => {
      // Given
      vi.mocked(fetchParametersByName).mockResolvedValue(MOCK_V2_PARAMS);

      // When
      const { result } = renderHook(
        () => useParametersByName(
          [MOCK_V2_PARAM_EITC.name, MOCK_V2_PARAM_CTC.name],
          TEST_COUNTRIES.US,
        ),
        { wrapper },
      );

      await waitFor(() => {
        expect(Object.keys(result.current.parameters).length).toBe(2);
      });

      // Then
      expect(result.current.parameters[MOCK_V2_PARAM_EITC.name]).toBeDefined();
      expect(result.current.parameters[MOCK_V2_PARAM_CTC.name]).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Disabled states
  // -----------------------------------------------------------------------
  describe('disabled states', () => {
    it('given empty names then does not fetch', () => {
      // When
      const { result } = renderHook(
        () => useParametersByName([], TEST_COUNTRIES.US),
        { wrapper },
      );

      // Then
      expect(fetchParametersByName).not.toHaveBeenCalled();
      expect(result.current.parameters).toEqual({});
    });

    it('given empty countryId then does not fetch', () => {
      // When
      renderHook(
        () => useParametersByName(['gov.irs.credits.eitc.max'], ''),
        { wrapper },
      );

      // Then
      expect(fetchParametersByName).not.toHaveBeenCalled();
    });

    it('given enabled false then does not fetch', () => {
      // When
      renderHook(
        () => useParametersByName(['gov.irs.credits.eitc.max'], TEST_COUNTRIES.US, false),
        { wrapper },
      );

      // Then
      expect(fetchParametersByName).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('given fetch fails then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch parameters by name');
      vi.mocked(fetchParametersByName).mockRejectedValue(error);

      // When
      const { result } = renderHook(
        () => useParametersByName(['gov.irs.credits.eitc.max'], TEST_COUNTRIES.US),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Then
      expect(result.current.error).toEqual(error);
      expect(result.current.parameters).toEqual({});
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
      vi.mocked(fetchParametersByName).mockReturnValue(pendingPromise as any);

      // When
      const { result } = renderHook(
        () => useParametersByName(['gov.irs.credits.eitc.max'], TEST_COUNTRIES.US),
        { wrapper },
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
});
