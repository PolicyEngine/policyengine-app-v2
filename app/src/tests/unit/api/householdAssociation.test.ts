import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import { ApiHouseholdStore, SessionStorageHouseholdStore } from '@/api/householdAssociation';
import {
  mockApiResponse,
  mockApiResponseList,
  mockCreationPayload,
  mockUserHouseholdPopulation,
  mockUserHouseholdPopulationList,
} from '@/tests/fixtures/api/householdAssociationMocks';

global.fetch = vi.fn();

vi.mock('@/adapters/UserHouseholdAdapter', () => ({
  UserHouseholdAdapter: {
    toCreationPayload: vi.fn(),
    fromApiResponse: vi.fn(),
  },
}));

describe('ApiHouseholdStore', () => {
  let store: ApiHouseholdStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new ApiHouseholdStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    test('given valid household association then creates successfully', async () => {
      // Given
      (UserHouseholdAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      (UserHouseholdAdapter.fromApiResponse as any).mockReturnValue(mockUserHouseholdPopulation);
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.create(mockUserHouseholdPopulation);

      // Then
      expect(UserHouseholdAdapter.toCreationPayload).toHaveBeenCalledWith(
        mockUserHouseholdPopulation
      );
      expect(global.fetch).toHaveBeenCalledWith('/api/user-household-associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockCreationPayload),
      });
      expect(UserHouseholdAdapter.fromApiResponse).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockUserHouseholdPopulation);
    });

    test('given API returns error then throws error', async () => {
      // Given
      (UserHouseholdAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      const mockResponse = {
        ok: false,
        status: 400,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow(
        'Failed to create household association'
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      (UserHouseholdAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      const networkError = new Error('Network failure');
      (global.fetch as any).mockRejectedValue(networkError);

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow('Network failure');
    });
  });

  describe('findByUser', () => {
    test('given valid user ID then returns list of households', async () => {
      // Given
      const userId = 'user-456';
      (UserHouseholdAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        const index = mockApiResponseList.indexOf(data);
        return mockUserHouseholdPopulationList[index];
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponseList),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(userId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`/api/user-household-associations/user/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(UserHouseholdAdapter.fromApiResponse).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUserHouseholdPopulationList);
    });

    test('given user with no households then returns empty array', async () => {
      // Given
      const userId = 'user-with-no-households';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(userId);

      // Then
      expect(result).toEqual([]);
      expect(UserHouseholdAdapter.fromApiResponse).not.toHaveBeenCalled();
    });

    test('given API returns error then throws error', async () => {
      // Given
      const userId = 'user-456';
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.findByUser(userId)).rejects.toThrow('Failed to fetch user households');
    });
  });

  describe('findById', () => {
    test('given valid user and household IDs then returns household', async () => {
      // Given
      const userId = 'user-456';
      const householdId = 'household-123';
      (UserHouseholdAdapter.fromApiResponse as any).mockReturnValue(mockUserHouseholdPopulation);
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findById(userId, householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user-household-associations/${userId}/${householdId}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(UserHouseholdAdapter.fromApiResponse).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockUserHouseholdPopulation);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      const userId = 'user-456';
      const householdId = 'non-existent';
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findById(userId, householdId);

      // Then
      expect(result).toBeNull();
      expect(UserHouseholdAdapter.fromApiResponse).not.toHaveBeenCalled();
    });

    test('given server error then throws error', async () => {
      // Given
      const userId = 'user-456';
      const householdId = 'household-123';
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.findById(userId, householdId)).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });
});

describe('SessionStorageHouseholdStore', () => {
  let store: SessionStorageHouseholdStore;
  let mockSessionStorage: { [key: string]: string };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage = {};

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key) => mockSessionStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });

    store = new SessionStorageHouseholdStore();
  });

  describe('create', () => {
    test('given new household association then stores in session storage', async () => {
      // Given
      const household = { ...mockUserHouseholdPopulation };
      delete (household as any).createdAt; // Test that createdAt is generated

      // When
      const result = await store.create(household);

      // Then
      expect(result).toMatchObject({
        ...household,
        type: 'household',
        id: household.householdId,
        isCreated: true,
      });
      expect(result.createdAt).toBeDefined();
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'user-population-households',
        expect.any(String)
      );
    });

    test('given duplicate association then throws error', async () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify([
        mockUserHouseholdPopulation,
      ]);

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow(
        'Association already exists'
      );
    });

    test('given existing households then appends new household', async () => {
      // Given
      const existingHousehold = mockUserHouseholdPopulationList[0];
      mockSessionStorage['user-population-households'] = JSON.stringify([existingHousehold]);
      const newHousehold = {
        ...mockUserHouseholdPopulation,
        householdId: 'new-household',
        id: 'new-household',
      };

      // When
      await store.create(newHousehold);

      // Then
      const stored = JSON.parse(mockSessionStorage['user-population-households']);
      expect(stored).toHaveLength(2);
      expect(stored[1].householdId).toBe('new-household');
    });

    test('given storage failure then throws error', async () => {
      // Given
      (sessionStorage.setItem as any).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // When/Then
      await expect(store.create(mockUserHouseholdPopulation)).rejects.toThrow(
        'Failed to store households in session storage'
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
      mockSessionStorage['user-population-households'] = JSON.stringify([
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
      mockSessionStorage['user-population-households'] = JSON.stringify(
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
      mockSessionStorage['user-population-households'] = 'invalid-json';

      // When
      const result = await store.findByUser('user-456');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    test('given existing association then returns household', async () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('user-456', '1');

      // Then
      expect(result).toEqual(mockUserHouseholdPopulationList[0]);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('user-456', 'non-existent');

      // Then
      expect(result).toBeNull();
    });

    test('given wrong user ID then returns null', async () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = await store.findById('wrong-user', 'household-1');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('utility methods', () => {
    test('given households in storage then getAllAssociations returns all', () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      const result = store.getAllAssociations();

      // Then
      expect(result).toEqual(mockUserHouseholdPopulationList);
    });

    test('given households in storage then clearAllAssociations removes them', () => {
      // Given
      mockSessionStorage['user-population-households'] = JSON.stringify(
        mockUserHouseholdPopulationList
      );

      // When
      store.clearAllAssociations();

      // Then
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user-population-households');
      expect(mockSessionStorage['user-population-households']).toBeUndefined();
    });
  });
});
