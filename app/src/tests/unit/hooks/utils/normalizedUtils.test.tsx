import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useParallelQueries,
  combineLoadingStates,
  extractUniqueIds,
  createLookupMap,
} from '@/hooks/utils/normalizedUtils';
import {
  TEST_IDS,
  TEST_ENTITIES,
  TEST_ERRORS,
  mockLoadingStates,
  createMockQueryClient,
  createWrapper,
  createMockQueryConfig,
  createErrorQueryConfig,
  createDisabledQueryConfig,
} from '@/tests/fixtures/hooks/utils/normalizedUtilsMocks';
import { QueryClient } from '@tanstack/react-query';

describe('normalizedUtils', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    wrapper = createWrapper(queryClient);
  });

  describe('useParallelQueries', () => {
    it('given array of IDs then fetches all in parallel', async () => {
      // Given
      const ids = [TEST_IDS.POLICY_1, TEST_IDS.POLICY_2];
      const config = createMockQueryConfig();

      // When
      const { result } = renderHook(() => useParallelQueries(ids, config), { wrapper });

      // Then
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toHaveLength(2);
      expect(config.queryFn).toHaveBeenCalledTimes(2);
    });

    it('given duplicate IDs then deduplicates queries', async () => {
      // Given
      const ids = [TEST_IDS.POLICY_1, TEST_IDS.POLICY_1, TEST_IDS.POLICY_2];
      const config = createMockQueryConfig();

      // When
      const { result } = renderHook(() => useParallelQueries(ids, config), { wrapper });

      // Then
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queries).toHaveLength(3);
      expect(config.queryFn).toHaveBeenCalledTimes(2);
    });

    it('given enabled false then does not fetch', () => {
      // Given
      const ids = [TEST_IDS.POLICY_1];
      const config = createDisabledQueryConfig();

      // When
      renderHook(() => useParallelQueries(ids, config), { wrapper });

      // Then
      expect(config.queryFn).not.toHaveBeenCalled();
    });

    it('given query error then returns error', async () => {
      // Given
      const ids = [TEST_IDS.POLICY_1];
      const config = createErrorQueryConfig(TEST_ERRORS.FETCH_FAILED);

      // When
      const { result } = renderHook(() => useParallelQueries(ids, config), { wrapper });

      // Then
      await vi.waitFor(() => {
        expect(result.current.error).toEqual(TEST_ERRORS.FETCH_FAILED);
      });
    });

    it('given empty array then returns empty results', () => {
      // Given
      const ids: string[] = [];
      const config = createMockQueryConfig();

      // When
      const { result } = renderHook(() => useParallelQueries(ids, config), { wrapper });

      // Then
      expect(result.current.queries).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('combineLoadingStates', () => {
    it('given all idle then returns not loading', () => {
      // Given
      const states = mockLoadingStates.allIdle;

      // When
      const result = combineLoadingStates(...states);

      // Then
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('given any loading then returns loading', () => {
      // Given
      const states = mockLoadingStates.oneLoading;

      // When
      const result = combineLoadingStates(...states);

      // Then
      expect(result.isLoading).toBe(true);
    });

    it('given any error then returns first error', () => {
      // Given
      const states = mockLoadingStates.oneError;

      // When
      const result = combineLoadingStates(...states);

      // Then
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Test error');
    });

    it('given empty array then returns idle state', () => {
      // When
      const result = combineLoadingStates();

      // Then
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('extractUniqueIds', () => {
    it('given array of objects then extracts unique IDs', () => {
      // Given
      const items = [...TEST_ENTITIES.policiesWithDuplicates];

      // When
      const result = extractUniqueIds(items, 'id');

      // Then
      expect(result).toEqual([TEST_IDS.POLICY_1, TEST_IDS.POLICY_2]);
    });

    it('given nested field then extracts IDs', () => {
      // Given
      const items = [...TEST_ENTITIES.simulationsWithPolicies];

      // When
      const result = extractUniqueIds(items, 'policyId');

      // Then
      expect(result).toEqual([TEST_IDS.POLICY_1, TEST_IDS.POLICY_2]);
    });

    it('given null/undefined values then filters them out', () => {
      // Given
      const items = [...TEST_ENTITIES.itemsWithNulls];

      // When
      const result = extractUniqueIds(items, 'id');

      // Then
      expect(result).toEqual([TEST_IDS.POLICY_1]);
    });

    it('given empty array then returns empty array', () => {
      // When
      const result = extractUniqueIds([], 'id');

      // Then
      expect(result).toEqual([]);
    });

    it('given numeric IDs then converts to strings', () => {
      // Given
      const items = [...TEST_ENTITIES.numericIds];

      // When
      const result = extractUniqueIds(items, 'id');

      // Then
      expect(result).toEqual(['1', '2', '3']);
      expect(typeof result[0]).toBe('string');
    });
  });

  describe('createLookupMap', () => {
    it('given array of items then creates ID-keyed map', () => {
      // Given
      const items = [...TEST_ENTITIES.policies];

      // When
      const result = createLookupMap(items);

      // Then
      expect(result[TEST_IDS.POLICY_1]).toEqual(items[0]);
      expect(result[TEST_IDS.POLICY_2]).toEqual(items[1]);
    });

    it('given numeric IDs then uses string keys', () => {
      // Given
      const items = [...TEST_ENTITIES.numericIds];

      // When
      const result = createLookupMap(items);

      // Then
      expect(result['1']).toEqual(items[0]);
      expect(result['2']).toEqual(items[1]);
    });

    it('given empty array then returns empty map', () => {
      // When
      const result = createLookupMap([]);

      // Then
      expect(result).toEqual({});
    });

    it('given items with null ID then skips them', () => {
      // Given
      const items = [...TEST_ENTITIES.withNullId];

      // When
      const result = createLookupMap(items);

      // Then
      expect(result[TEST_IDS.POLICY_1]).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });
  });
});
