import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSimulationStore, LocalStorageSimulationStore } from '@/api/simulationAssociation';
import {
  mockSimulation,
  mockSimulationInput,
  TEST_LABELS,
  TEST_SIM_IDS,
  TEST_USER_IDS,
} from '@/tests/fixtures/api/simulationAssociationMocks';

// Mock the v2 API module
vi.mock('@/api/v2/userSimulationAssociations', () => ({
  createUserSimulationAssociationV2: vi.fn(),
  fetchUserSimulationAssociationsV2: vi.fn(),
  updateUserSimulationAssociationV2: vi.fn(),
  deleteUserSimulationAssociationV2: vi.fn(),
}));

import {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationsV2,
  updateUserSimulationAssociationV2,
  deleteUserSimulationAssociationV2,
} from '@/api/v2/userSimulationAssociations';

describe('ApiSimulationStore', () => {
  let store: ApiSimulationStore;

  beforeEach(() => {
    store = new ApiSimulationStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given valid simulation then delegates to v2 module', async () => {
      const input = mockSimulationInput();
      const expected = mockSimulation();
      (createUserSimulationAssociationV2 as any).mockResolvedValue(expected);

      const result = await store.create(input);

      expect(createUserSimulationAssociationV2).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });

    it('given v2 module throws then propagates error', async () => {
      (createUserSimulationAssociationV2 as any).mockRejectedValue(
        new Error('Failed to create simulation association: 500')
      );

      await expect(store.create(mockSimulationInput())).rejects.toThrow('500');
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then delegates to v2 module', async () => {
      const expected = [mockSimulation()];
      (fetchUserSimulationAssociationsV2 as any).mockResolvedValue(expected);

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(fetchUserSimulationAssociationsV2).toHaveBeenCalledWith(
        TEST_USER_IDS.USER_123,
        undefined
      );
      expect(result).toEqual(expected);
    });

    it('given countryId then passes it to v2 module', async () => {
      (fetchUserSimulationAssociationsV2 as any).mockResolvedValue([]);

      await store.findByUser(TEST_USER_IDS.USER_123, 'us');

      expect(fetchUserSimulationAssociationsV2).toHaveBeenCalledWith(TEST_USER_IDS.USER_123, 'us');
    });
  });

  describe('findById', () => {
    it('given existing association then returns it from list', async () => {
      const sim = mockSimulation({ simulationId: TEST_SIM_IDS.SIM_456 });
      (fetchUserSimulationAssociationsV2 as any).mockResolvedValue([sim]);

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456);

      expect(fetchUserSimulationAssociationsV2).toHaveBeenCalledWith(TEST_USER_IDS.USER_123);
      expect(result).toEqual(sim);
    });

    it('given no matching simulation then returns null', async () => {
      (fetchUserSimulationAssociationsV2 as any).mockResolvedValue([]);

      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('given valid params then delegates to v2 module', async () => {
      const expected = mockSimulation({ label: 'Updated' });
      (updateUserSimulationAssociationV2 as any).mockResolvedValue(expected);

      const result = await store.update('sus-abc123', TEST_USER_IDS.USER_123, {
        label: 'Updated',
      });

      expect(updateUserSimulationAssociationV2).toHaveBeenCalledWith(
        'sus-abc123',
        TEST_USER_IDS.USER_123,
        { label: 'Updated' }
      );
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('given valid params then delegates to v2 module', async () => {
      (deleteUserSimulationAssociationV2 as any).mockResolvedValue(undefined);

      await store.delete('sus-abc123', TEST_USER_IDS.USER_123);

      expect(deleteUserSimulationAssociationV2).toHaveBeenCalledWith(
        'sus-abc123',
        TEST_USER_IDS.USER_123
      );
    });
  });
});

describe('LocalStorageSimulationStore', () => {
  let store: LocalStorageSimulationStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
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
      const result = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

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
      const result1 = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );
      const result2 = await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      expect(result1.id).toMatch(/^sus-/);
      expect(result2.id).toMatch(/^sus-/);
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('findByUser', () => {
    it('given user with simulations then returns all user simulations', async () => {
      await store.create(mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 }));
      await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(result).toHaveLength(2);
      expect(result[0].simulationId).toBe(TEST_SIM_IDS.SIM_456);
      expect(result[1].simulationId).toBe(TEST_SIM_IDS.SIM_999);
    });

    it('given user with no simulations then returns empty array', async () => {
      const result = await store.findByUser('nonexistent-user');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('given existing simulation then returns it', async () => {
      await store.create(mockSimulationInput());

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456);

      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIM_IDS.SIM_456,
      });
    });

    it('given nonexistent simulation then returns null', async () => {
      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('given existing simulation then update succeeds', async () => {
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      const result = await store.update(created.id!, TEST_USER_IDS.USER_123, {
        label: 'Updated Label',
      });

      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent simulation then update throws error', async () => {
      await expect(
        store.update('sus-nonexistent', TEST_USER_IDS.USER_123, { label: 'Updated Label' })
      ).rejects.toThrow('UserSimulation with id sus-nonexistent not found');
    });

    it('given existing simulation then update persists to localStorage', async () => {
      const created = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );

      await store.update(created.id!, TEST_USER_IDS.USER_123, { label: 'Updated Label' });

      const persisted = await store.findById(created.userId, created.simulationId);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple simulations then updates correct one by ID', async () => {
      const created1 = await store.create(
        mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
      );
      const created2 = await store.create(
        mockSimulationInput({
          simulationId: TEST_SIM_IDS.SIM_999,
          label: TEST_LABELS.TEST_SIMULATION_2,
        })
      );

      await store.update(created1.id!, TEST_USER_IDS.USER_123, { label: 'Updated Label' });

      const updated = await store.findById(created1.userId, created1.simulationId);
      const unchanged = await store.findById(created2.userId, created2.simulationId);
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(TEST_LABELS.TEST_SIMULATION_2);
    });
  });

  describe('delete', () => {
    it('given existing simulation then deletes it', async () => {
      const created = await store.create(mockSimulationInput());

      await store.delete(created.id!, TEST_USER_IDS.USER_123);

      const result = await store.findByUser(TEST_USER_IDS.USER_123);
      expect(result).toHaveLength(0);
    });

    it('given nonexistent simulation then throws error', async () => {
      await expect(
        store.delete('sus-nonexistent', TEST_USER_IDS.USER_123)
      ).rejects.toThrow('Association with id sus-nonexistent not found');
    });
  });

  describe('error handling', () => {
    it('given localStorage error on get then returns empty array', async () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(result).toEqual([]);
    });
  });
});
