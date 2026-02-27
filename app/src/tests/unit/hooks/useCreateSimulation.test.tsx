import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createSimulation } from '@/api/simulation';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useCreateSimulationAssociation } from '@/hooks/useUserSimulationAssociations';
import {
  mockSimulationPayload,
  mockSimulationPayloadGeography,
  SIMULATION_IDS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/simulationMocks';
import {
  CONSOLE_MESSAGES,
  createMockStoreWithCountry,
  ERROR_MESSAGES,
  mockCreateSimulation,
  mockCreateSimulationAssociationMutateAsync,
  mockResponseWithoutId,
  QUERY_KEY_PATTERNS,
  setupConsoleSpies,
  setupDefaultMocks,
  TEST_LABELS,
} from '@/tests/fixtures/hooks/useCreateSimulationMocks';

// Mock the modules
vi.mock('@/api/simulation', () => ({
  createSimulation: vi.fn(),
}));

vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useCreateSimulationAssociation: vi.fn(),
}));

const TEST_USER_ID = 'test-user-uuid-123';
vi.mock('@/hooks/useUserId', () => ({
  useUserId: () => TEST_USER_ID,
}));

vi.mock('@/libs/queryKeys', () => ({
  simulationKeys: {
    all: ['simulations'],
    byId: (id: string) => ['simulations', 'byId', id],
  },
}));

describe('useCreateSimulation', () => {
  let queryClient: QueryClient;
  let mockStore: any;
  let consoleSpies: ReturnType<typeof setupConsoleSpies>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create query client with spy
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.spyOn(queryClient, 'invalidateQueries');

    // Create mock store with US country
    mockStore = createMockStoreWithCountry(TEST_COUNTRIES.US);

    // Setup console spies
    consoleSpies = setupConsoleSpies();

    // Setup mocks with default implementations
    setupDefaultMocks();

    // Wire up the mocked functions
    (createSimulation as any).mockImplementation(mockCreateSimulation);
    (useCreateSimulationAssociation as any).mockImplementation(() => ({
      mutateAsync: mockCreateSimulationAssociationMutateAsync,
    }));
  });

  afterEach(() => {
    consoleSpies.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={mockStore}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/us/simulations']}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  describe('successful simulation creation', () => {
    test('given valid household payload when createSimulation called then creates simulation and association', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      const promise = result.current.createSimulation(mockSimulationPayload);
      const response = await promise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      // Then
      expect(createSimulation).toHaveBeenCalledWith(TEST_COUNTRIES.US, mockSimulationPayload);
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        simulationId: SIMULATION_IDS.NEW,
        label: TEST_LABELS.SIMULATION,
        isCreated: true,
        countryId: 'us',
      });
      expect(response).toEqual({
        result: {
          simulation_id: SIMULATION_IDS.NEW,
        },
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.SIMULATION_ALL,
      });
    });

    test('given geography payload when createSimulation called then creates geography simulation', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayloadGeography);

      // Then
      expect(createSimulation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        mockSimulationPayloadGeography
      );
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalled();
    });

    test('given no label when createSimulation called then passes undefined label to association', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        simulationId: SIMULATION_IDS.NEW,
        label: undefined,
        isCreated: true,
        countryId: 'us',
      });
    });

    test('given custom label when createSimulation called then uses provided label', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.CUSTOM), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        simulationId: SIMULATION_IDS.NEW,
        label: TEST_LABELS.CUSTOM,
        isCreated: true,
        countryId: 'us',
      });
    });
  });

  describe('country selection', () => {
    test('given different country in state when createSimulation called then uses that country', async () => {
      // Given
      const ukStore = createMockStoreWithCountry(TEST_COUNTRIES.UK);

      const ukWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={ukStore}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/uk/simulations']}>
              <Routes>
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), {
        wrapper: ukWrapper,
      });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(createSimulation).toHaveBeenCalledWith(TEST_COUNTRIES.UK, mockSimulationPayload);
    });

    test('given UK country when createSimulation called then uses UK endpoint', async () => {
      // Given
      const ukStore = createMockStoreWithCountry(TEST_COUNTRIES.UK);

      const ukWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={ukStore}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/uk/simulations']}>
              <Routes>
                <Route path="/:countryId/*" element={children} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), {
        wrapper: ukWrapper,
      });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(createSimulation).toHaveBeenCalledWith('uk', mockSimulationPayload);
    });
  });

  describe('error handling', () => {
    test('given simulation creation fails when createSimulation called then propagates error', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.CREATE_FAILED);
      mockCreateSimulation.mockRejectedValue(error);
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When/Then
      await expect(result.current.createSimulation(mockSimulationPayload)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_FAILED
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      // Association should not be created
      expect(mockCreateSimulationAssociationMutateAsync).not.toHaveBeenCalled();
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    test('given association creation fails when simulation created then logs error but completes', async () => {
      // Given
      const associationError = new Error(ERROR_MESSAGES.ASSOCIATION_FAILED);
      mockCreateSimulationAssociationMutateAsync.mockRejectedValue(associationError);
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      const response = await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(response).toEqual({
        result: {
          simulation_id: SIMULATION_IDS.NEW,
        },
      });
      expect(consoleSpies.errorSpy).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.ASSOCIATION_ERROR,
        associationError
      );

      // Simulation creation should succeed
      expect(createSimulation).toHaveBeenCalledWith(TEST_COUNTRIES.US, mockSimulationPayload);
      // Queries should still be invalidated
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEY_PATTERNS.SIMULATION_ALL,
      });
    });
  });

  describe('state management', () => {
    test('given hook initialized then isPending is false', () => {
      // When
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // Then
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('given mutation in progress then isPending is true', async () => {
      // Given
      let resolveMutation: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolveMutation = resolve;
      });
      mockCreateSimulation.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      result.current.createSimulation(mockSimulationPayload);

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Cleanup
      resolveMutation!({
        result: {
          simulation_id: SIMULATION_IDS.NEW,
        },
      });
      await pendingPromise;
    });

    test('given mutation completes then isPending returns to false', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('query invalidation', () => {
    test('given successful creation then invalidates simulation queries', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      await waitFor(() => {
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['simulations'],
        });
      });
    });

    test('given failed creation then does not invalidate queries', async () => {
      // Given
      mockCreateSimulation.mockRejectedValue(new Error(ERROR_MESSAGES.CREATE_FAILED));
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      try {
        await result.current.createSimulation(mockSimulationPayload);
      } catch {
        // Expected error
      }

      // Then
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('given multiple concurrent calls then handles correctly', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When - Create multiple simulations concurrently
      const promises = [
        result.current.createSimulation(mockSimulationPayload),
        result.current.createSimulation(mockSimulationPayload),
      ];

      // Then
      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(createSimulation).toHaveBeenCalledTimes(2);
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalledTimes(2);
    });

    test('given simulation ID missing in response then still attempts association', async () => {
      // Given
      mockCreateSimulation.mockResolvedValue(mockResponseWithoutId);
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });

      // When
      await result.current.createSimulation(mockSimulationPayload);

      // Then
      expect(mockCreateSimulationAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        simulationId: undefined,
        label: TEST_LABELS.SIMULATION,
        isCreated: true,
        countryId: 'us',
      });
    });

    test('given options parameter when createSimulation called then passes options to mutation', async () => {
      // Given
      const { result } = renderHook(() => useCreateSimulation(TEST_LABELS.SIMULATION), { wrapper });
      const onSuccessMock = vi.fn();
      const options = {
        onSuccess: onSuccessMock,
      };

      // When
      await result.current.createSimulation(mockSimulationPayload, options);

      // Then
      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalled();
      });
    });
  });
});
