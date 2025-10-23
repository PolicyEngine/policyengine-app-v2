import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateSimulationAssociation,
  useSimulationAssociation,
  useSimulationAssociationsByUser,
  useUserSimulationStore,
} from '@/hooks/useUserSimulationAssociations';
import {
  createMockQueryClient,
  createWrapper,
  mockUserSimulation,
  mockUserSimulationList,
  setupMockStore,
  TEST_SIMULATION_IDS,
  TEST_USER_ID,
} from '@/tests/fixtures/hooks/useUserSimulationAssociationsMocks';

// Mock the stores
vi.mock('@/api/simulationAssociation', () => {
  const mockStore = {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
  };
  return {
    ApiSimulationStore: vi.fn(() => mockStore),
    LocalStorageSimulationStore: vi.fn(() => mockStore),
  };
});

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock query config
vi.mock('@/libs/queryConfig', () => ({
  queryConfig: {
    api: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    localStorage: {
      staleTime: 0,
      gcTime: 0,
    },
  },
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  simulationAssociationKeys: {
    byUser: (userId: string) => ['simulation-associations', 'byUser', userId],
    bySimulation: (id: string) => ['simulation-associations', 'bySimulation', id],
    specific: (userId: string, id: string) => ['simulation-associations', 'specific', userId, id],
  },
}));

// Get mock store for type safety
const { LocalStorageSimulationStore } = await import('@/api/simulationAssociation');

describe('useUserSimulationAssociations', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    wrapper = createWrapper(queryClient);

    const mockStore = (LocalStorageSimulationStore as any)();
    setupMockStore(mockStore);
  });

  describe('useUserSimulationStore', () => {
    it('given user not logged in then returns local storage store', () => {
      // When
      const { result } = renderHook(() => useUserSimulationStore());

      // Then
      expect(result.current).toBeDefined();
      expect(result.current.create).toBeDefined();
      expect(result.current.findByUser).toBeDefined();
      expect(result.current.findById).toBeDefined();
    });
  });

  describe('useSimulationAssociationsByUser', () => {
    it('given valid user ID then returns simulation list', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useSimulationAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserSimulationList);
      expect(result.current.data).toHaveLength(2);
    });

    it('given store error then returns error state', async () => {
      // Given
      const mockStore = (LocalStorageSimulationStore as any)();
      mockStore.findByUser.mockRejectedValue(new Error('Fetch failed'));

      // When
      const { result } = renderHook(() => useSimulationAssociationsByUser(TEST_USER_ID), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('given query then uses correct query key', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useSimulationAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().getAll();
      const queryKeys = queries.map((q) => q.queryKey);
      expect(queryKeys).toContainEqual(['simulation-associations', 'byUser', userId]);
    });
  });

  describe('useSimulationAssociation', () => {
    it('given valid IDs then returns specific association', async () => {
      // Given
      const userId = TEST_USER_ID;
      const simulationId = TEST_SIMULATION_IDS.SIM_1;

      // When
      const { result } = renderHook(() => useSimulationAssociation(userId, simulationId), {
        wrapper,
      });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserSimulation);
    });

    it('given store error then returns error state', async () => {
      // Given
      const mockStore = (LocalStorageSimulationStore as any)();
      mockStore.findById.mockRejectedValue(new Error('Not found'));

      // When
      const { result } = renderHook(
        () => useSimulationAssociation(TEST_USER_ID, TEST_SIMULATION_IDS.SIM_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateSimulationAssociation', () => {
    it('given valid input then creates association', async () => {
      // Given
      const mockStore = (LocalStorageSimulationStore as any)();
      const newAssociation = {
        userId: '1',
        simulationId: '100',
        label: 'New Simulation',
      };

      // When
      const { result } = renderHook(() => useCreateSimulationAssociation(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.mutateAsync(newAssociation);

      expect(mockStore.create).toHaveBeenCalledWith(newAssociation);
    });

    it('given successful creation then invalidates queries', async () => {
      // Given
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const newAssociation = {
        userId: '1',
        simulationId: '100',
        label: 'New Simulation',
      };

      // When
      const { result } = renderHook(() => useCreateSimulationAssociation(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.mutateAsync(newAssociation);

      // Then
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it('given successful creation then updates cache', async () => {
      // Given
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      const newAssociation = {
        userId: '1',
        simulationId: '100',
        label: 'New Simulation',
      };

      // When
      const { result } = renderHook(() => useCreateSimulationAssociation(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.mutateAsync(newAssociation);

      // Then
      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalled();
      });
    });

    it('given store error then returns error', async () => {
      // Given
      const mockStore = (LocalStorageSimulationStore as any)();
      mockStore.create.mockRejectedValue(new Error('Creation failed'));
      const newAssociation = {
        userId: '1',
        simulationId: '100',
        label: 'New Simulation',
      };

      // When
      const { result } = renderHook(() => useCreateSimulationAssociation(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(result.current.mutateAsync(newAssociation)).rejects.toThrow('Creation failed');
    });
  });
});
