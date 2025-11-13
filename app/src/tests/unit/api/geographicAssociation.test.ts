import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiGeographicStore, LocalStorageGeographicStore } from '@/api/geographicAssociation';
import type { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

// Mock fetch
global.fetch = vi.fn();

describe('ApiGeographicStore', () => {
  let store: ApiGeographicStore;

  const mockPopulation: UserGeographyPopulation = {
    userId: 'user-123',
    geographyId: 'geo-456',
    countryId: 'us',
    label: 'Test Geography',
    type: 'geography',
    scope: 'subnational',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockApiResponse = {
    user_id: 'user-123',
    geography_id: 'geo-456',
    country_id: 'us',
    label: 'Test Geography',
    scope: 'subnational',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    store = new ApiGeographicStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('given valid population then creates geographic association', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      // When
      const result = await store.create(mockPopulation);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-geographic-associations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        geographyId: 'geo-456',
        countryId: 'us',
        label: 'Test Geography',
        scope: 'subnational',
      });
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.create(mockPopulation)).rejects.toThrow(
        'Failed to create geographic association'
      );
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then fetches user associations', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockApiResponse],
      });

      // When
      const result = await store.findByUser('user-123');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-geographic-associations/user/user-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'user-123',
        geographyId: 'geo-456',
        countryId: 'us',
        label: 'Test Geography',
        scope: 'subnational',
      });
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.findByUser('user-123')).rejects.toThrow(
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
        json: async () => mockApiResponse,
      });

      // When
      const result = await store.findById('user-123', 'geo-456');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-geographic-associations/user-123/geo-456',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        geographyId: 'geo-456',
        countryId: 'us',
        label: 'Test Geography',
        scope: 'subnational',
      });
    });

    it('given 404 response then returns null', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // When
      const result = await store.findById('user-123', 'nonexistent');

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
      await expect(store.findById('user-123', 'geo-456')).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });

  describe('update', () => {
    it('given update called then throws not supported error', async () => {
      // Given & When & Then
      await expect(
        store.update('user-123', 'geo-456', { label: 'Updated Label' })
      ).rejects.toThrow('Please ensure you are using localStorage mode');
    });

    it('given update called then logs warning', async () => {
      // Given
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // When
      try {
        await store.update('user-123', 'geo-456', { label: 'Updated Label' });
      } catch {
        // Expected to throw
      }

      // Then
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('API endpoint not yet implemented')
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

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

    it('given duplicate population then throws error', async () => {
      // Given
      await store.create(mockPopulation1);

      // When/Then
      await expect(store.create(mockPopulation1)).rejects.toThrow(
        'Geographic population already exists'
      );
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
