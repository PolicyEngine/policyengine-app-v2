import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageGeographicStore } from '@/api/geographicAssociation';
import type { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

describe('LocalStorageGeographicStore', () => {
  let store: LocalStorageGeographicStore;
  let mockLocalStorage: { [key: string]: string };

  const mockPopulation1: UserGeographyPopulation = {
    userId: 'user-123',
    geographyId: 'geo-456',
    countryId: 'us',
    label: 'Test Geography 1',
    type: 'geography',
    scope: 'subnational',
    id: 'geo-456',
    createdAt: '2025-01-01T00:00:00Z',
    isCreated: true,
  };

  const mockPopulation2: UserGeographyPopulation = {
    userId: 'user-123',
    geographyId: 'geo-789',
    countryId: 'uk',
    label: 'Test Geography 2',
    type: 'geography',
    scope: 'subnational',
    id: 'geo-789',
    createdAt: '2025-01-02T00:00:00Z',
    isCreated: true,
  };

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

    store = new LocalStorageGeographicStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given new population then stores in localStorage', async () => {
      // When
      const result = await store.create(mockPopulation1);

      // Then
      expect(result).toMatchObject({
        userId: 'user-123',
        geographyId: 'geo-456',
        countryId: 'us',
        label: 'Test Geography 1',
      });
      expect(result.createdAt).toBeDefined();
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('given population without createdAt then adds timestamp', async () => {
      // Given
      const populationWithoutDate = { ...mockPopulation1, createdAt: undefined };

      // When
      const result = await store.create(populationWithoutDate as any);

      // Then
      expect(result.createdAt).toBeDefined();
    });

    it('given duplicate population then allows creation', async () => {
      // Given
      await store.create(mockPopulation1);

      // When
      const result = await store.create(mockPopulation1);

      // Then - Implementation allows duplicates for multiple entries of same geography
      expect(result).toEqual(mockPopulation1);
      const allPopulations = await store.findByUser('user-123');
      expect(allPopulations).toHaveLength(2);
    });
  });

  describe('findByUser', () => {
    it('given user with populations then returns all user populations', async () => {
      // Given
      await store.create(mockPopulation1);
      await store.create(mockPopulation2);

      // When
      const result = await store.findByUser('user-123');

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].geographyId).toBe('geo-456');
      expect(result[1].geographyId).toBe('geo-789');
    });

    it('given user with no populations then returns empty array', async () => {
      // When
      const result = await store.findByUser('nonexistent-user');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('given existing population then returns it', async () => {
      // Given
      await store.create(mockPopulation1);

      // When
      const result = await store.findById('user-123', 'geo-456');

      // Then
      expect(result).toMatchObject({
        userId: 'user-123',
        geographyId: 'geo-456',
        countryId: 'us',
      });
    });

    it('given nonexistent population then returns null', async () => {
      // When
      const result = await store.findById('user-123', 'nonexistent');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('given existing geography then update succeeds and returns updated geography', async () => {
      // Given
      await store.create(mockPopulation1);

      // When
      const result = await store.update('user-123', 'geo-456', { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.userId).toBe('user-123');
      expect(result.geographyId).toBe('geo-456');
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent geography then update throws error', async () => {
      // Given - no geography created

      // When & Then
      await expect(
        store.update('user-123', 'nonexistent', { label: 'Updated Label' })
      ).rejects.toThrow('UserGeography with userId user-123 and geographyId nonexistent not found');
    });

    it('given existing geography then updatedAt timestamp is set', async () => {
      // Given
      await store.create(mockPopulation1);
      const beforeUpdate = new Date().toISOString();

      // When
      const result = await store.update('user-123', 'geo-456', { label: 'Updated Label' });

      // Then
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt! >= beforeUpdate).toBe(true);
    });

    it('given existing geography then update persists to localStorage', async () => {
      // Given
      await store.create(mockPopulation1);

      // When
      await store.update('user-123', 'geo-456', { label: 'Updated Label' });

      // Then
      const persisted = await store.findById('user-123', 'geo-456');
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple geographies then updates correct one by composite key', async () => {
      // Given
      await store.create(mockPopulation1);
      await store.create(mockPopulation2);

      // When
      await store.update('user-123', 'geo-456', { label: 'Updated Label' });

      // Then
      const updated = await store.findById('user-123', 'geo-456');
      const unchanged = await store.findById('user-123', 'geo-789');
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe('Test Geography 2');
    });

    it('given update with partial data then only specified fields are updated', async () => {
      // Given
      await store.create(mockPopulation1);

      // When
      const result = await store.update('user-123', 'geo-456', { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.scope).toBe('subnational'); // unchanged
    });
  });

  describe('utility methods', () => {
    it('given getAllPopulations then returns all stored populations', () => {
      // Given
      mockLocalStorage['user-geographic-associations'] = JSON.stringify([
        mockPopulation1,
        mockPopulation2,
      ]);

      // When
      const result = store.getAllPopulations();

      // Then
      expect(result).toHaveLength(2);
    });

    it('given clearAllPopulations then removes all data', () => {
      // Given
      mockLocalStorage['user-geographic-associations'] = JSON.stringify([mockPopulation1]);

      // When
      store.clearAllPopulations();

      // Then
      expect(localStorage.removeItem).toHaveBeenCalledWith('user-geographic-associations');
    });
  });

  describe('error handling', () => {
    it('given localStorage error on get then returns empty array', () => {
      // Given
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // When
      const result = store.getAllPopulations();

      // Then
      expect(result).toEqual([]);
    });

    it('given localStorage error on set then throws error', async () => {
      // Given
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage full');
      });

      // When/Then
      await expect(store.create(mockPopulation1)).rejects.toThrow(
        'Failed to store geographic populations in local storage'
      );
    });
  });
});
