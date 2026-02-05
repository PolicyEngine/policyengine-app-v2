import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiHouseholdStore, LocalStorageHouseholdStore } from '@/api/householdAssociation';
import * as v2Api from '@/api/v2/userHouseholdAssociations';
import {
  mockUserHouseholdPopulation,
  mockUserHouseholdPopulationList,
} from '@/tests/fixtures/api/householdAssociationMocks';

// Mock the v2 API module
vi.mock('@/api/v2/userHouseholdAssociations');

describe('ApiHouseholdStore', () => {
  let store: ApiHouseholdStore;

  beforeEach(() => {
    store = new ApiHouseholdStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    test('given valid household association then creates via v2 API', async () => {
      // Given
      vi.mocked(v2Api.createUserHouseholdAssociationV2).mockResolvedValue(mockUserHouseholdPopulation);

      // When
      const result = await store.create(mockUserHouseholdPopulation);

      // Then
      expect(v2Api.createUserHouseholdAssociationV2).toHaveBeenCalledWith(mockUserHouseholdPopulation);
      expect(result).toEqual(mockUserHouseholdPopulation);
    });

    test('given API returns error then throws error', async () => {
      // Given
      vi.mocked(v2Api.createUserHouseholdAssociationV2).mockRejectedValue(
        new Error('Failed to create household association')
      );

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow(
        'Failed to create household association'
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      vi.mocked(v2Api.createUserHouseholdAssociationV2).mockRejectedValue(
        new Error('Network failure')
      );

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow('Network failure');
    });
  });

  describe('findByUser', () => {
    test('given valid user ID then fetches via v2 API', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationsV2).mockResolvedValue(mockUserHouseholdPopulationList);

      // When
      const result = await store.findByUser('user-456');

      // Then
      expect(v2Api.fetchUserHouseholdAssociationsV2).toHaveBeenCalledWith('user-456', undefined);
      expect(result).toEqual(mockUserHouseholdPopulationList);
    });

    test('given user with no households then returns empty array', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationsV2).mockResolvedValue([]);

      // When
      const result = await store.findByUser('user-with-no-households');

      // Then
      expect(result).toEqual([]);
    });

    test('given API returns error then throws error', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationsV2).mockRejectedValue(
        new Error('Failed to fetch user households')
      );

      // When/Then
      await expect(store.findByUser('user-456')).rejects.toThrow('Failed to fetch user households');
    });

    test('given countryId filter then passes to v2 API', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationsV2).mockResolvedValue(mockUserHouseholdPopulationList);

      // When
      await store.findByUser('user-456', 'us');

      // Then
      expect(v2Api.fetchUserHouseholdAssociationsV2).toHaveBeenCalledWith('user-456', 'us');
    });
  });

  describe('findById', () => {
    test('given valid IDs then fetches via v2 API', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationByIdV2).mockResolvedValue(mockUserHouseholdPopulation);

      // When
      const result = await store.findById('user-456', 'household-123');

      // Then
      expect(v2Api.fetchUserHouseholdAssociationByIdV2).toHaveBeenCalledWith('user-456', 'household-123');
      expect(result).toEqual(mockUserHouseholdPopulation);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationByIdV2).mockResolvedValue(null);

      // When
      const result = await store.findById('user-456', 'non-existent');

      // Then
      expect(result).toBeNull();
    });

    test('given server error then throws error', async () => {
      // Given
      vi.mocked(v2Api.fetchUserHouseholdAssociationByIdV2).mockRejectedValue(
        new Error('Failed to fetch association')
      );

      // When/Then
      await expect(store.findById('user-456', 'household-123')).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });

  describe('update', () => {
    test('given valid association ID then updates via v2 API', async () => {
      // Given
      const updatedHousehold = { ...mockUserHouseholdPopulation, label: 'Updated Label' };
      vi.mocked(v2Api.updateUserHouseholdAssociationV2).mockResolvedValue(updatedHousehold);

      // When
      const result = await store.update('suh-abc123', { label: 'Updated Label' });

      // Then
      expect(v2Api.updateUserHouseholdAssociationV2).toHaveBeenCalledWith('suh-abc123', {
        label: 'Updated Label',
      });
      expect(result.label).toBe('Updated Label');
    });

    test('given API error then throws error', async () => {
      // Given
      vi.mocked(v2Api.updateUserHouseholdAssociationV2).mockRejectedValue(
        new Error('Failed to update household association')
      );

      // When/Then
      await expect(store.update('suh-abc123', { label: 'Updated Label' })).rejects.toThrow(
        'Failed to update household association'
      );
    });
  });

  describe('delete', () => {
    test('given valid association ID then deletes via v2 API', async () => {
      // Given
      vi.mocked(v2Api.deleteUserHouseholdAssociationV2).mockResolvedValue(undefined);

      // When
      await store.delete('suh-abc123');

      // Then
      expect(v2Api.deleteUserHouseholdAssociationV2).toHaveBeenCalledWith('suh-abc123');
    });

    test('given API error then throws error', async () => {
      // Given
      vi.mocked(v2Api.deleteUserHouseholdAssociationV2).mockRejectedValue(
        new Error('Failed to delete household association')
      );

      // When/Then
      await expect(store.delete('suh-abc123')).rejects.toThrow(
        'Failed to delete household association'
      );
    });
  });
});

describe('LocalStorageHouseholdStore', () => {
  let store: LocalStorageHouseholdStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
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
      },
      writable: true,
    });

    store = new LocalStorageHouseholdStore();
  });

  describe('create', () => {
    test('given new household association then stores in local storage', async () => {
      // Given
      const household = { ...mockUserHouseholdPopulation };
      delete (household as any).createdAt; // Test that createdAt is generated
      delete (household as any).id; // ID will be generated

      // When
      const result = await store.create(household);

      // Then
      expect(result).toMatchObject({
        ...household,
        type: 'household',
        isCreated: true,
      });
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^suh-/);
      expect(result.createdAt).toBeDefined();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user-population-households',
        expect.any(String)
      );
    });

    test('given duplicate association then creates new association with unique ID', async () => {
      // Given
      const first = await store.create(mockUserHouseholdPopulation);

      // When
      const second = await store.create(mockUserHouseholdPopulation);

      // Then
      expect(second).toMatchObject({
        type: 'household',
        userId: mockUserHouseholdPopulation.userId,
        householdId: mockUserHouseholdPopulation.householdId,
        isCreated: true,
      });
      expect(second.id).toBeDefined();
      expect(second.id).not.toBe(first.id);
      expect(second.id).toMatch(/^suh-/);
    });

    test('given existing households then appends new household', async () => {
      // Given
      const existingHousehold = mockUserHouseholdPopulationList[0];
      mockLocalStorage['user-population-households'] = JSON.stringify([existingHousehold]);
      const newHousehold = {
        ...mockUserHouseholdPopulation,
        householdId: 'new-household',
      };

      // When
      const result = await store.create(newHousehold);

      // Then
      const stored = JSON.parse(mockLocalStorage['user-population-households']);
      expect(stored).toHaveLength(2);
      expect(stored[1].householdId).toBe('new-household');
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^suh-/);
    });

    test('given storage failure then throws error', async () => {
      // Given
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow(
        'Failed to store households in local storage'
      );
    });
  });

  describe('findByUser', () => {
    test('given user with households then returns filtered list', async () => {
      // Given
      const userId = 'user-456';
      const otherUserHousehold = {
        ...mockUserHouseholdPopulation,
        userId: 'other-user',
        householdId: 'other-household',
      };
      mockLocalStorage['user-population-households'] = JSON.stringify([
        ...mockUserHouseholdPopulationList,
        otherUserHousehold,
      ]);

      // When
      const result = await store.findByUser(userId);

      // Then
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUserHouseholdPopulationList);
    });

    test('given user with no households then returns empty array', async () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findByUser('user-with-no-households');

      // Then
      expect(result).toEqual([]);
    });

    test('given empty storage then returns empty array', async () => {
      // When
      const result = await store.findByUser('any-user');

      // Then
      expect(result).toEqual([]);
    });

    test('given corrupted storage data then returns empty array', async () => {
      // Given
      mockLocalStorage['user-population-households'] = 'invalid-json';

      // When
      const result = await store.findByUser('user-456');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    test('given existing association then returns household', async () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('user-456', '1');

      // Then
      expect(result).toEqual(mockUserHouseholdPopulationList[0]);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('user-456', 'non-existent');

      // Then
      expect(result).toBeNull();
    });

    test('given wrong user ID then returns null', async () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('wrong-user', 'household-1');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('given existing household then update succeeds and returns updated household', async () => {
      // Given
      const household = mockUserHouseholdPopulationList[0];
      const created = await store.create(household);

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.householdId).toBe(household.householdId);
      expect(result.updatedAt).toBeDefined();
    });

    test('given nonexistent household then update throws error', async () => {
      // Given - no household created

      // When & Then
      await expect(store.update('suh-nonexistent', { label: 'Updated Label' })).rejects.toThrow(
        'UserHousehold with id suh-nonexistent not found'
      );
    });

    test('given existing household then updatedAt timestamp is set', async () => {
      // Given
      const household = mockUserHouseholdPopulationList[0];
      const created = await store.create(household);
      const beforeUpdate = new Date().toISOString();

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt! >= beforeUpdate).toBe(true);
    });

    test('given existing household then update persists to localStorage', async () => {
      // Given
      const household = mockUserHouseholdPopulationList[0];
      const created = await store.create(household);

      // When
      await store.update(created.id!, { label: 'Updated Label' });

      // Then
      const persisted = await store.findById(household.userId, household.householdId);
      expect(persisted?.label).toBe('Updated Label');
    });

    test('given multiple households then updates correct one by ID', async () => {
      // Given
      const created1 = await store.create(mockUserHouseholdPopulationList[0]);
      await store.create(mockUserHouseholdPopulationList[1]);

      // When
      await store.update(created1.id!, { label: 'Updated Label' });

      // Then
      const updated = await store.findById(
        mockUserHouseholdPopulationList[0].userId,
        mockUserHouseholdPopulationList[0].householdId
      );
      const unchanged = await store.findById(
        mockUserHouseholdPopulationList[1].userId,
        mockUserHouseholdPopulationList[1].householdId
      );
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(mockUserHouseholdPopulationList[1].label);
    });

    test('given update with partial data then only specified fields are updated', async () => {
      // Given
      const household = mockUserHouseholdPopulationList[0];
      const created = await store.create(household);

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.countryId).toBe(household.countryId); // unchanged
    });
  });

  describe('utility methods', () => {
    test('given households in storage then getAllAssociations returns all', () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = store.getAllAssociations();

      // Then
      expect(result).toEqual(mockUserHouseholdPopulationList);
    });

    test('given households in storage then clearAllAssociations removes them', () => {
      // Given
      mockLocalStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      store.clearAllAssociations();

      // Then
      expect(localStorage.removeItem).toHaveBeenCalledWith('user-population-households');
      expect(mockLocalStorage['user-population-households']).toBeUndefined();
    });
  });
});
