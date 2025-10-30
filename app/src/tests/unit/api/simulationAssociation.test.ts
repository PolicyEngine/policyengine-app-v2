import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import { ApiSimulationStore, LocalStorageSimulationStore } from '@/api/simulationAssociation';
import {
  mockErrorFetchResponse,
  mockSimulation,
  mockSimulationApiResponse,
  mockSimulationInput,
  mockSuccessFetchResponse,
  TEST_LABELS,
  TEST_SIM_IDS,
  TEST_USER_IDS,
} from '@/tests/fixtures/api/simulationAssociationMocks';

// Mock the adapter
vi.mock('@/adapters/UserSimulationAdapter');

// Mock fetch
global.fetch = vi.fn();

describe('ApiSimulationStore', () => {
  let store: ApiSimulationStore;

  beforeEach(() => {
    store = new ApiSimulationStore();
    vi.clearAllMocks();
    (UserSimulationAdapter.toCreationPayload as any).mockReturnValue(mockSimulationApiResponse());
    (UserSimulationAdapter.fromApiResponse as any).mockReturnValue(mockSimulation());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('given valid simulation then creates simulation association', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(
        mockSuccessFetchResponse(mockSimulationApiResponse())
      );

      // When
      const result = await store.create(mockSimulationInput());

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-simulation-associations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockSimulationApiResponse()),
        })
      );
      expect(result).toEqual(mockSimulation());
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      // When/Then
      await expect(store.create(mockSimulationInput())).rejects.toThrow(
        'Failed to create simulation association'
      );
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then fetches user simulation associations', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockSimulationApiResponse()],
      });

      // When
      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-simulation-associations/user/user-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual([mockSimulation()]);
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.findByUser(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch user associations'
      );
    });
  });

  describe('findById', () => {
    it('given valid IDs then fetches specific association', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSimulationApiResponse(),
      });

      // When
      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-simulation-associations/user-123/sim-456',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockSimulation());
    });

    it('given 404 response then returns null', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // When
      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      // Then
      expect(result).toBeNull();
    });

    it('given other error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456)).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });
});

describe('LocalStorageSimulationStore', () => {
  let store: LocalStorageSimulationStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    store = new LocalStorageSimulationStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given new simulation then stores in localStorage', async () => {
      // When
      const result = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      // Then
      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIM_IDS.SIM_456,
        label: TEST_LABELS.TEST_SIMULATION_1,
      });
      expect(result.id).toMatch(/^sus-/);
      expect(result.createdAt).toBeDefined();
      expect(result.isCreated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('given simulation then generates unique ID', async () => {
      // When
      const result1 = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );
      const result2 = await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      // Then
      expect(result1.id).toMatch(/^sus-/);
      expect(result2.id).toMatch(/^sus-/);
      expect(result1.id).not.toBe(result2.id);
    });

    it('given duplicate simulation then creates new association with unique ID', async () => {
      // Given
      const first = await store.create(mockSimulationInput());

      // When
      const second = await store.create(mockSimulationInput());

      // Then
      expect(second).toMatchObject({
        userId: first.userId,
        simulationId: first.simulationId,
        countryId: first.countryId,
      });
      expect(second.id).toBeDefined();
      expect(second.id).not.toBe(first.id);
      expect(second.id).toMatch(/^sus-/);
    });
  });

  describe('findByUser', () => {
    it('given user with simulations then returns all user simulations', async () => {
      // Given
      await store.create(mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 }));
      await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      // When
      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].simulationId).toBe(TEST_SIM_IDS.SIM_456);
      expect(result[1].simulationId).toBe(TEST_SIM_IDS.SIM_999);
    });

    it('given user with no simulations then returns empty array', async () => {
      // When
      const result = await store.findByUser('nonexistent-user');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('given existing simulation then returns it', async () => {
      // Given
      await store.create(mockSimulationInput());

      // When
      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456);

      // Then
      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIM_IDS.SIM_456,
      });
    });

    it('given nonexistent simulation then returns null', async () => {
      // When
      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('given localStorage error on get then returns empty array', async () => {
      // Given
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // When
      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      // Then
      expect(result).toEqual([]);
    });
  });
});
