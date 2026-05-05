import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageGeographicStore } from '@/api/geographicAssociation';
import { ENTITY_MIGRATION_MODE } from '@/config/migrationMode';
import { useRegions } from '@/hooks/useRegions';
import {
  useCreateGeographicAssociation,
  useGeographicAssociation,
  useGeographicAssociationsByUser,
  useSavedGeographyAssociationStoreForMode,
  useUpdateGeographicAssociation,
  useUserGeographics,
  useUserGeographicStore,
} from '@/hooks/useUserGeographic';
import { queryConfig } from '@/libs/queryConfig';
import {
  createMockQueryClient,
  GEO_CONSTANTS,
  mockUserGeographicAssociation,
  mockUserGeographicAssociationList,
  QUERY_KEY_PATTERNS,
  TEST_IDS,
  TEST_LABELS,
} from '@/tests/fixtures/hooks/hooksMocks';

const mockShadowResolveRegionTarget = vi.fn().mockResolvedValue(null);

// Mock useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({
    data: [
      {
        id: 'region-state-ca',
        countryId: 'us',
        code: 'state/ca',
        label: 'California',
        regionType: 'state',
        parentCode: 'us',
        filterField: null,
        filterValue: null,
        requiresFilter: false,
        stateCode: 'CA',
        stateName: 'California',
      },
      {
        id: 'region-state-ny',
        countryId: 'us',
        code: 'state/ny',
        label: 'New York',
        regionType: 'state',
        parentCode: 'us',
        filterField: null,
        filterValue: null,
        requiresFilter: false,
        stateCode: 'NY',
        stateName: 'New York',
      },
    ],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/libs/migration/regionShadow', () => ({
  shadowResolveRegionTarget: (...args: unknown[]) => mockShadowResolveRegionTarget(...args),
}));

// Mock the stores first
vi.mock('@/api/geographicAssociation', () => {
  const mockStore = {
    create: vi.fn(),
    update: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
  };
  return {
    ApiGeographicStore: vi.fn(() => mockStore),
    LocalStorageGeographicStore: vi.fn(() => mockStore),
  };
});

// Mock query config
vi.mock('@/libs/queryConfig', () => ({
  queryConfig: {
    api: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    localStorage: {
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
  const defaultSavedGeographyMigrationMode = ENTITY_MIGRATION_MODE.saved_geographies;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    mockShadowResolveRegionTarget.mockResolvedValue(null);
    ENTITY_MIGRATION_MODE.saved_geographies = defaultSavedGeographyMigrationMode;
    vi.mocked(useRegions).mockReturnValue({
      data: [
        {
          id: 'region-state-ca',
          countryId: 'us',
          code: 'state/ca',
          label: 'California',
          regionType: 'state',
          parentCode: 'us',
          filterField: null,
          filterValue: null,
          filterStrategy: null,
          requiresFilter: false,
          stateCode: 'CA',
          stateName: 'California',
        },
        {
          id: 'region-state-ny',
          countryId: 'us',
          code: 'state/ny',
          label: 'New York',
          regionType: 'state',
          parentCode: 'us',
          filterField: null,
          filterValue: null,
          filterStrategy: null,
          requiresFilter: false,
          stateCode: 'NY',
          stateName: 'New York',
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useRegions>);

    // Get the mock store instance
    const mockStore =
      (LocalStorageGeographicStore as any).mock.results[0]?.value ||
      (LocalStorageGeographicStore as any)();

    // Set default mock implementations
    mockStore.create.mockImplementation((input: any) => Promise.resolve(input));
    mockStore.update.mockImplementation(
      (_userId: string, _geographyId: string, updates: Record<string, unknown>) =>
        Promise.resolve({
          ...mockUserGeographicAssociation,
          ...updates,
        })
    );
    mockStore.findByUser.mockResolvedValue(mockUserGeographicAssociationList);
    mockStore.findById.mockResolvedValue(mockUserGeographicAssociation);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserGeographicStore', () => {
    test('given user not logged in then returns local storage store', () => {
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

  describe('useSavedGeographyAssociationStoreForMode', () => {
    test('given current auth model then it returns the local store facade and local query config', () => {
      const { result } = renderHook(() => useSavedGeographyAssociationStoreForMode(), {
        wrapper,
      });

      expect(result.current.store.create).toBeDefined();
      expect(result.current.store.update).toBeDefined();
      expect(result.current.store.findByUser).toBeDefined();
      expect(result.current.store.findById).toBeDefined();
      expect(result.current.config).toEqual(queryConfig.localStorage);
    });
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
      const mockStore = (LocalStorageGeographicStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith(userId, 'us');
    });

    test('given store throws error when fetching then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch associations');
      const mockStore = (LocalStorageGeographicStore as any)();
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

      const mockStore = (LocalStorageGeographicStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith('', 'us');
    });

    test('given user with no associations then returns empty array', async () => {
      // Given
      const mockStore = (LocalStorageGeographicStore as any)();
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
      const mockStore = (LocalStorageGeographicStore as any)();
      expect(mockStore.findById).toHaveBeenCalledWith(userId, geographyId);
    });

    test('given non-existent association when fetching then returns null', async () => {
      // Given
      const mockStore = (LocalStorageGeographicStore as any)();
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
      const mockStore = (LocalStorageGeographicStore as any)();
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
      const mockStore = (LocalStorageGeographicStore as any)();
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

      const mockStore = (LocalStorageGeographicStore as any)();
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
      const mockStore = (LocalStorageGeographicStore as any)();
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

    test('given unsupported saved geography mode then create hook fails fast', () => {
      ENTITY_MIGRATION_MODE.saved_geographies = 'v1_primary_v2_shadow';

      expect(() => renderHook(() => useCreateGeographicAssociation(), { wrapper })).toThrow(
        '[MigrationMode] Unsupported mode "v1_primary_v2_shadow" for saved_geographies in useCreateGeographicAssociation. Supported modes: v1_only'
      );
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
      const mockStore = (LocalStorageGeographicStore as any)();
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

  describe('useUpdateGeographicAssociation', () => {
    test('given valid association update then it invalidates the related caches', async () => {
      const { result } = renderHook(() => useUpdateGeographicAssociation(), { wrapper });

      await result.current.mutateAsync({
        userId: TEST_IDS.USER_ID,
        geographyId: GEO_CONSTANTS.COUNTRY_US,
        updates: { label: 'Renamed Geography' },
      });

      const mockStore = (LocalStorageGeographicStore as any)();
      expect(mockStore.update).toHaveBeenCalledWith(TEST_IDS.USER_ID, GEO_CONSTANTS.COUNTRY_US, {
        label: 'Renamed Geography',
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_USER(TEST_IDS.USER_ID),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_GEOGRAPHY(
          mockUserGeographicAssociation.geographyId
        ),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_SPECIFIC(
          TEST_IDS.USER_ID,
          mockUserGeographicAssociation.geographyId
        ),
      });
    });

    test('given unsupported saved geography mode then update hook fails fast', () => {
      ENTITY_MIGRATION_MODE.saved_geographies = 'v2_only';

      expect(() => renderHook(() => useUpdateGeographicAssociation(), { wrapper })).toThrow(
        '[MigrationMode] Unsupported mode "v2_only" for saved_geographies in useUpdateGeographicAssociation. Supported modes: v1_only'
      );
    });
  });

  describe('query configuration', () => {
    test('given local storage mode then uses local storage config', async () => {
      // When
      const { result } = renderHook(() => useGeographicAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Local storage should have no stale time
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
      const mockStore = (LocalStorageGeographicStore as any)();
      mockStore.findByUser.mockResolvedValue([]);

      // Force refetch
      const refetchResult = await result.current.refetch();

      // Then
      expect(refetchResult.data).toEqual([]);
      expect(mockStore.findByUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('useUserGeographics', () => {
    test('given geography associations then it reconstructs canonical geography records', async () => {
      const { result } = renderHook(() => useUserGeographics(TEST_IDS.USER_ID), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].geography).toEqual({
        id: 'state/ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'state/ca',
        name: 'California',
      });
      expect(result.current.data?.[1].geography?.name).toBe('New York');
    });

    test('given canonical geography records then it resolves region targets in the background', async () => {
      renderHook(() => useUserGeographics(TEST_IDS.USER_ID), { wrapper });

      await waitFor(() => {
        expect(mockShadowResolveRegionTarget).toHaveBeenCalledTimes(2);
      });

      expect(mockShadowResolveRegionTarget).toHaveBeenCalledWith({
        countryId: 'us',
        regionCode: 'state/ca',
        selectedLabel: TEST_LABELS.GEOGRAPHY,
      });
      expect(mockShadowResolveRegionTarget).toHaveBeenCalledWith({
        countryId: 'us',
        regionCode: 'state/ny',
        selectedLabel: TEST_LABELS.GEOGRAPHY_2,
      });
    });

    test('given regions lookup fails then it still returns reconstructed geographies without surfacing an error', async () => {
      vi.mocked(useRegions).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('regions unavailable'),
      } as ReturnType<typeof useRegions>);

      const { result } = renderHook(() => useUserGeographics(TEST_IDS.USER_ID), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data?.[0].geography).toEqual({
        id: 'state/ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'state/ca',
        name: 'ca',
      });
    });

    test('given a national geography association then it uses the country display name', async () => {
      const mockStore = (LocalStorageGeographicStore as any)();
      mockStore.findByUser.mockResolvedValue([
        {
          ...mockUserGeographicAssociation,
          countryId: 'uk',
          scope: 'national',
          geographyId: 'uk',
          label: 'United Kingdom National',
        },
      ]);

      const { result } = renderHook(() => useUserGeographics(TEST_IDS.USER_ID), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.[0].geography).toEqual({
        id: 'uk',
        countryId: 'uk',
        scope: 'national',
        geographyId: 'uk',
        name: 'United Kingdom',
      });
    });
  });
});
