import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdById } from '@/api/household';
import { LocalStorageHouseholdStore } from '@/api/householdAssociation';
import {
  useCreateHouseholdAssociation,
  useHouseholdAssociation,
  useHouseholdAssociationsByUser,
  useUserHouseholds,
  useUserHouseholdStore,
} from '@/hooks/useUserHousehold';
import {
  CONSOLE_MESSAGES,
  createMockQueryClient,
  GEO_CONSTANTS,
  mockHouseholdMetadata,
  mockReduxState,
  mockUserHouseholdPopulation,
  mockUserHouseholdPopulationList,
  QUERY_KEY_PATTERNS,
  setupMockConsole,
  TEST_IDS,
  TEST_LABELS,
} from '@/tests/fixtures/hooks/hooksMocks';

// Mock the stores first
vi.mock('@/api/householdAssociation', () => {
  const mockStore = {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
  };
  return {
    ApiHouseholdStore: vi.fn(() => mockStore),
    LocalStorageHouseholdStore: vi.fn(() => mockStore),
  };
});

// Mock the household API
vi.mock('@/api/household', () => ({
  fetchHouseholdById: vi.fn(),
}));

// Mock query config and keys
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

vi.mock('@/libs/queryKeys', () => ({
  householdAssociationKeys: {
    byUser: (userId: string) => ['household-associations', 'byUser', userId],
    byHousehold: (id: string) => ['household-associations', 'byHousehold', id],
    specific: (userId: string, id: string) => ['household-associations', 'specific', userId, id],
  },
  householdKeys: {
    all: ['households'],
    byId: (id: string) => ['households', 'byId', id],
  },
}));

describe('useUserHousehold hooks', () => {
  let queryClient: QueryClient;
  let consoleMocks: ReturnType<typeof setupMockConsole>;
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupMockConsole();

    // Create Redux store for useUserHouseholds
    store = configureStore({
      reducer: {
        metadata: () => mockReduxState.metadata,
      },
    });

    // Get the mock store instance
    const mockStore =
      (LocalStorageHouseholdStore as any).mock.results[0]?.value ||
      (LocalStorageHouseholdStore as any)();

    // Set default mock implementations
    mockStore.create.mockResolvedValue(mockUserHouseholdPopulation);
    mockStore.findByUser.mockResolvedValue(mockUserHouseholdPopulationList);
    mockStore.findById.mockResolvedValue(mockUserHouseholdPopulation);
    (fetchHouseholdById as any).mockResolvedValue(mockHouseholdMetadata);
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/us/populations']}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  describe('useUserHouseholdStore', () => {
    test('given user not logged in then returns local storage store', () => {
      // When
      const { result } = renderHook(() => useUserHouseholdStore());

      // Then
      expect(result.current).toBeDefined();
      expect(result.current.create).toBeDefined();
      expect(result.current.findByUser).toBeDefined();
      expect(result.current.findById).toBeDefined();
    });
  });

  describe('useHouseholdAssociationsByUser', () => {
    test('given valid user ID when fetching then returns household list', async () => {
      // Given
      const userId = TEST_IDS.USER_ID;

      // When
      const { result } = renderHook(() => useHouseholdAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserHouseholdPopulationList);
      const mockStore = (LocalStorageHouseholdStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith(userId);

      // Verify console logs
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.USER_ID_LOG,
        userId
      );
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.STORE_LOG,
        expect.any(Object)
      );
    });

    test('given empty user ID when fetching then still attempts fetch', async () => {
      // When
      const { result } = renderHook(() => useHouseholdAssociationsByUser(''), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const mockStore = (LocalStorageHouseholdStore as any)();
      expect(mockStore.findByUser).toHaveBeenCalledWith('');
    });

    test('given store error when fetching then returns error state', async () => {
      // Given
      const error = new Error('Failed to fetch');
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.findByUser.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useHouseholdAssociationsByUser(TEST_IDS.USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useHouseholdAssociation', () => {
    test('given valid IDs when fetching specific association then returns data', async () => {
      // Given
      const userId = TEST_IDS.USER_ID;
      const householdId = TEST_IDS.HOUSEHOLD_ID;

      // When
      const { result } = renderHook(() => useHouseholdAssociation(userId, householdId), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserHouseholdPopulation);
      const mockStore = (LocalStorageHouseholdStore as any)();
      expect(mockStore.findById).toHaveBeenCalledWith(userId, householdId);
    });

    test('given non-existent association when fetching then returns null', async () => {
      // Given
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.findById.mockResolvedValue(null);

      // When
      const { result } = renderHook(
        () => useHouseholdAssociation(TEST_IDS.USER_ID, 'non-existent'),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateHouseholdAssociation', () => {
    test('given valid household when created then adds type and updates cache', async () => {
      // Given
      const newHousehold = {
        id: TEST_IDS.HOUSEHOLD_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
        userId: TEST_IDS.USER_ID,
        label: TEST_LABELS.HOUSEHOLD,
      };

      const { result } = renderHook(() => useCreateHouseholdAssociation(), { wrapper });

      // When
      await result.current.mutateAsync(newHousehold);

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify type was added
      const mockStore = (LocalStorageHouseholdStore as any)();
      expect(mockStore.create).toHaveBeenCalledWith({
        ...newHousehold,
        type: 'household',
      });

      // Verify console logs
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(CONSOLE_MESSAGES.HOUSEHOLD_LOG);
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(newHousehold);
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.NEW_ASSOCIATION_LOG
      );

      // Verify cache invalidation
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.ASSOCIATION_BY_USER(TEST_IDS.USER_ID),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.ASSOCIATION_BY_HOUSEHOLD(TEST_IDS.HOUSEHOLD_ID),
      });

      // Verify cache update
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        QUERY_KEY_PATTERNS.ASSOCIATION_SPECIFIC(TEST_IDS.USER_ID, TEST_IDS.HOUSEHOLD_ID),
        mockUserHouseholdPopulation
      );
    });

    test('given creation fails when creating then returns error', async () => {
      // Given
      const error = new Error('Creation failed');
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.create.mockRejectedValue(error);
      const { result } = renderHook(() => useCreateHouseholdAssociation(), { wrapper });

      // When/Then
      await expect(
        result.current.mutateAsync({
          id: TEST_IDS.HOUSEHOLD_ID,
          householdId: TEST_IDS.HOUSEHOLD_ID,
          userId: TEST_IDS.USER_ID,
          label: TEST_LABELS.HOUSEHOLD,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('useUserHouseholds', () => {
    test('given user with households when fetching then returns combined data', async () => {
      // Given
      const userId = TEST_IDS.USER_ID;

      // When
      const { result } = renderHook(() => useUserHouseholds(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveLength(2); // Two households in mock list

      // Verify console logs
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.ASSOCIATIONS_LOG,
        mockUserHouseholdPopulationList
      );
      expect(consoleMocks.consoleSpy.log).toHaveBeenCalledWith(CONSOLE_MESSAGES.HOUSEHOLD_IDS_LOG, [
        TEST_IDS.HOUSEHOLD_ID,
        TEST_IDS.HOUSEHOLD_ID_2,
      ]);

      // Verify each household has association and metadata
      const firstHousehold = result.current.data![0];
      expect(firstHousehold.association).toEqual(mockUserHouseholdPopulationList[0]);
      expect(firstHousehold.household).toEqual(mockHouseholdMetadata);
      expect(firstHousehold.isLoading).toBe(false);
      expect(firstHousehold.error).toBeNull();
    });

    test('given user with no households when fetching then returns empty array', async () => {
      // Given
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.findByUser.mockResolvedValue([]);

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(fetchHouseholdById).not.toHaveBeenCalled();
    });

    test('given association fetch fails when fetching then returns error', async () => {
      // Given
      const error = new Error('Association fetch failed');
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.findByUser.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    test('given household fetch fails when fetching then returns partial error', async () => {
      // Given
      (fetchHouseholdById as any)
        .mockResolvedValueOnce(mockHouseholdMetadata) // First succeeds
        .mockRejectedValueOnce(new Error('Household fetch failed')); // Second fails

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeDefined();

      // First household should have data
      expect(result.current.data![0].household).toEqual(mockHouseholdMetadata);

      // Second household should have error
      expect(result.current.data![1].error).toBeDefined();
      expect(result.current.data![1].isError).toBe(true);
    });

    test('given different country in metadata then uses correct country for fetch', async () => {
      // Given
      store = configureStore({
        reducer: {
          metadata: () => ({ currentCountry: GEO_CONSTANTS.COUNTRY_UK }),
        },
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/uk/populations']}>
              <Routes>
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), {
        wrapper: customWrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchHouseholdById).toHaveBeenCalledWith(GEO_CONSTANTS.COUNTRY_UK, expect.any(String));
    });

    test('given no country in metadata then defaults to us', async () => {
      // Given
      store = configureStore({
        reducer: {
          metadata: () => ({ currentCountry: null }),
        },
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/us/populations']}>
              <Routes>
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), {
        wrapper: customWrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchHouseholdById).toHaveBeenCalledWith(GEO_CONSTANTS.COUNTRY_US, expect.any(String));
    });

    test('given associations without household IDs then filters them out', async () => {
      // Given
      const associationsWithNullId = [
        mockUserHouseholdPopulation,
        { ...mockUserHouseholdPopulation, householdId: null },
      ];
      const mockStore = (LocalStorageHouseholdStore as any)();
      mockStore.findByUser.mockResolvedValue(associationsWithNullId);

      // When
      const { result } = renderHook(() => useUserHouseholds(TEST_IDS.USER_ID), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have one household in result (the one with ID)
      expect(result.current.data).toHaveLength(1);
      // But fetchHouseholdById is called for both (including null)
      expect(fetchHouseholdById).toHaveBeenCalledTimes(2);
      expect(fetchHouseholdById).toHaveBeenCalledWith(
        GEO_CONSTANTS.COUNTRY_US,
        TEST_IDS.HOUSEHOLD_ID
      );
      expect(fetchHouseholdById).toHaveBeenCalledWith(GEO_CONSTANTS.COUNTRY_US, null);
    });
  });
});
