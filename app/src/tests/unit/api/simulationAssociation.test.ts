import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import {
  mockSimulationInput,
  TEST_LABELS,
  TEST_SIM_IDS,
  TEST_USER_IDS,
} from '@/tests/fixtures/api/simulationAssociationMocks';

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

  describe('update', () => {
    it('given existing simulation then update succeeds and returns updated simulation', async () => {
      // Given
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.simulationId).toBe(created.simulationId);
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent simulation then update throws error', async () => {
      // Given - no simulation created

      // When & Then
      await expect(store.update('sus-nonexistent', { label: 'Updated Label' })).rejects.toThrow(
        'UserSimulation with id sus-nonexistent not found'
      );
    });

    it('given existing simulation then updatedAt timestamp is set', async () => {
      // Given
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );
      const beforeUpdate = new Date().toISOString();

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt! >= beforeUpdate).toBe(true);
    });

    it('given existing simulation then update persists to localStorage', async () => {
      // Given
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      // When
      await store.update(created.id!, { label: 'Updated Label' });

      // Then
      const persisted = await store.findById(created.userId, created.simulationId);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple simulations then updates correct one by ID', async () => {
      // Given
      const created1 = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );
      const created2 = await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      // When
      await store.update(created1.id!, { label: 'Updated Label' });

      // Then
      const updated = await store.findById(created1.userId, created1.simulationId);
      const unchanged = await store.findById(created2.userId, created2.simulationId);
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(TEST_LABELS.TEST_SIMULATION_2);
    });

    it('given update with partial data then only specified fields are updated', async () => {
      // Given
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.countryId).toBe(created.countryId); // unchanged
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
