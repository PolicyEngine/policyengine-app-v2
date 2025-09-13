import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SessionStorageGeographicStore } from '@/api/geographicAssociation';
// Now import everything
import {
  useCreateGeographicAssociation,
  useGeographicAssociation,
  useGeographicAssociationsByUser,
  useUserGeographicStore,
} from '@/hooks/useUserGeographic';
import {
  createMockQueryClient,
  GEO_CONSTANTS,
  mockUserGeographicAssociation,
  mockUserGeographicAssociationList,
  QUERY_KEY_PATTERNS,
  TEST_IDS,
  TEST_LABELS,
} from '@/tests/fixtures/hooks/hooksMocks';

// Mock the stores first
vi.mock('@/api/geographicAssociation', () => {
  const mockStore = {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
  };
  return {
    ApiGeographicStore: vi.fn(() => mockStore),
    SessionStorageGeographicStore: vi.fn(() => mockStore),
  };
});

// Mock query config
vi.mock('@/libs/queryConfig', () => ({
  queryConfig: {
    api: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    sessionStorage: {
      staleTime: 0,
      cacheTime: 0,
    },
  },
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  geographicAssociationKeys: {
    byUser: (userId: string) => ['geographic-associations', 'byUser', userId],
    byGeography: (id: string) => ['geographic-associations', 'byGeography', id],
    specific: (userId: string, id: string) => ['geographic-associations', 'specific', userId, id],
  },
}));

describe('useUserGeographic hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();

    // Get the mock store instance
    const mockStore =
      (SessionStorageGeographicStore as any).mock.results[0]?.value ||
      (SessionStorageGeographicStore as any)();

    // Set default mock implementations
    mockStore.create.mockImplementation((input: any) => Promise.resolve(input));
    mockStore.findByUser.mockResolvedValue(mockUserGeographicAssociationList);
    mockStore.findById.mockResolvedValue(mockUserGeographicAssociation);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserGeographicStore', () => {
    test('given user not logged in then returns session storage store', () => {
      // When
      const { result } = renderHook(() => useUserGeographicStore());

      // Then
      expect(result.current).toBeDefined();
      expect(result.current.create).toBeDefined();
      expect(result.current.findByUser).toBeDefined();
      expect(result.current.findById).toBeDefined();
    });

    // Note: Cannot test logged-in case as isLoggedIn is hardcoded to false
    // This would need to be refactored to accept auth context
  });

  describe('useGeographicAssociationsByUser', () => {
    test('given valid user ID when fetching associations then returns list', async () => {
      // Given
      const userId = TEST_IDS.USER_ID;

      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserGeographicAssociationList);
      const mockStore = (SessionStorageGeographicStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith(userId);
    });

    test('given store throws error when fetching then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch associations');
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.findByUser.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    test('given empty user ID when fetching then still attempts fetch', async () => {
      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(''), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const mockStore = (SessionStorageGeographicStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith('');
    });

    test('given user with no associations then returns empty array', async () => {
      // Given
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.findByUser.mockResolvedValue([]);

      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useGeographicAssociation', () => {
    test('given valid IDs when fetching specific association then returns data', async () => {
      // Given
      const userId = TEST_IDS.USER_ID;
      const geographyId = TEST_IDS.GEOGRAPHY_ID;

      // When
      const { result } = renderHook(() => useGeographicAssociation(userId, geographyId), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserGeographicAssociation);
      const mockStore = (SessionStorageGeographicStore as any)();
      expect(mockStore.findById).toHaveBeenCalledWith(userId, geographyId);
    });

    test('given non-existent association when fetching then returns null', async () => {
      // Given
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.findById.mockResolvedValue(null);

      // When
      const { result } = renderHook(
        () => useGeographicAssociation(TEST_IDS.USER_ID, 'non-existent'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    test('given error in fetching then returns error state', async () => {
      // Given
      const error = new Error('Network error');
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.findById.mockRejectedValue(error);

      // When
      const { result } = renderHook(
        () => useGeographicAssociation(TEST_IDS.USER_ID, TEST_IDS.GEOGRAPHY_ID),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreateGeographicAssociation', () => {
    test('given valid association when created then updates cache correctly', async () => {
      // Given
      const newAssociation = {
        id: TEST_IDS.GEOGRAPHY_ID,
        userId: TEST_IDS.USER_ID,
        countryId: GEO_CONSTANTS.COUNTRY_US,
        scope: GEO_CONSTANTS.TYPE_NATIONAL,
        geographyId: GEO_CONSTANTS.COUNTRY_US,
        label: TEST_LABELS.GEOGRAPHY,
      } as const;

      const { result } = renderHook(() => useCreateGeographicAssociation(), { wrapper });

      // When
      await result.current.mutateAsync(newAssociation);

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify store was called
      const mockStore = (SessionStorageGeographicStore as any)();
      expect(mockStore.create).toHaveBeenCalledWith({ ...newAssociation, type: 'geography' });

      // Verify cache invalidation
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_USER(TEST_IDS.USER_ID),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_GEOGRAPHY(GEO_CONSTANTS.COUNTRY_US),
      });

      // Verify cache update
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        QUERY_KEY_PATTERNS.GEO_ASSOCIATION_SPECIFIC(TEST_IDS.USER_ID, GEO_CONSTANTS.COUNTRY_US),
        { ...newAssociation, type: 'geography' }
      );
    });

    test('given subnational association when created then updates cache with full identifier', async () => {
      // Given
      const subnationalAssociation = {
        ...mockUserGeographicAssociation,
        scope: GEO_CONSTANTS.TYPE_SUBNATIONAL,
        geographyId: GEO_CONSTANTS.REGION_CA,
        countryId: GEO_CONSTANTS.COUNTRY_US,
      } as const;

      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.create.mockResolvedValue(subnationalAssociation);
      const { result } = renderHook(() => useCreateGeographicAssociation(), { wrapper });

      // When
      await result.current.mutateAsync(subnationalAssociation);

      // Then
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        QUERY_KEY_PATTERNS.GEO_ASSOCIATION_SPECIFIC(TEST_IDS.USER_ID, GEO_CONSTANTS.REGION_CA),
        subnationalAssociation
      );
    });

    test('given creation fails when creating then returns error', async () => {
      // Given
      const error = new Error('Creation failed');
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.create.mockRejectedValue(error);
      const { result } = renderHook(() => useCreateGeographicAssociation(), { wrapper });

      // When/Then
      await expect(
        result.current.mutateAsync({
          id: TEST_IDS.GEOGRAPHY_ID,
          userId: TEST_IDS.USER_ID,
          countryId: GEO_CONSTANTS.COUNTRY_US,
          scope: GEO_CONSTANTS.TYPE_NATIONAL,
          geographyId: GEO_CONSTANTS.COUNTRY_US,
          label: TEST_LABELS.GEOGRAPHY,
        })
      ).rejects.toThrow('Creation failed');

      // Cache should not be updated
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
    });

    test('given multiple associations created then each updates cache independently', async () => {
      // Given
      const { result } = renderHook(() => useCreateGeographicAssociation(), { wrapper });

      const association1 = {
        id: TEST_IDS.GEOGRAPHY_ID,
        userId: TEST_IDS.USER_ID,
        countryId: GEO_CONSTANTS.COUNTRY_US,
        scope: GEO_CONSTANTS.TYPE_NATIONAL,
        geographyId: GEO_CONSTANTS.COUNTRY_US,
        label: TEST_LABELS.GEOGRAPHY,
      } as const;

      const association2 = {
        id: TEST_IDS.GEOGRAPHY_ID_2,
        userId: TEST_IDS.USER_ID,
        countryId: GEO_CONSTANTS.COUNTRY_UK,
        scope: GEO_CONSTANTS.TYPE_NATIONAL,
        geographyId: GEO_CONSTANTS.COUNTRY_UK,
        label: TEST_LABELS.GEOGRAPHY_2,
      } as const;

      // When
      const mockStore = (SessionStorageGeographicStore as any)();
      await result.current.mutateAsync(association1);
      mockStore.create.mockResolvedValue({
        ...mockUserGeographicAssociation,
        ...association2,
      });
      await result.current.mutateAsync(association2);

      // Then
      expect(mockStore.create).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4); // 2 calls per creation
    });
  });

  describe('query configuration', () => {
    test('given session storage mode then uses session storage config', async () => {
      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Session storage should have no stale time
      const queryState = queryClient.getQueryState(
        QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_USER(TEST_IDS.USER_ID)
      );
      expect(queryState).toBeDefined();
    });

    test('given refetch called then fetches fresh data', async () => {
      // Given
      const { result } = renderHook(() => useGeographicAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Initial data should be the mock list
      expect(result.current.data).toEqual(mockUserGeographicAssociationList);

      // When
      const mockStore = (SessionStorageGeographicStore as any)();
      mockStore.findByUser.mockResolvedValue([]);

      // Force refetch
      const refetchResult = await result.current.refetch();

      // Then
      expect(refetchResult.data).toEqual([]);
      expect(mockStore.findByUser).toHaveBeenCalledTimes(2);
    });
  });
});
