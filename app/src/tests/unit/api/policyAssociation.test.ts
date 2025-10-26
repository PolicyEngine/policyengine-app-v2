import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiPolicyStore, LocalStoragePolicyStore } from '@/api/policyAssociation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

// Mock fetch
global.fetch = vi.fn();

describe('ApiPolicyStore', () => {
  let store: ApiPolicyStore;

  const mockPolicyInput: Omit<UserPolicy, 'id' | 'createdAt'> = {
    userId: 'user-123',
    policyId: 'policy-456',
    countryId: 'us',
    label: 'Test Policy',
    isCreated: true,
  };

  const mockApiResponse = {
    id: 'policy-456',
    user_id: 'user-123',
    policy_id: 'policy-456',
    country_id: 'us',
    label: 'Test Policy',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    store = new ApiPolicyStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('given valid policy then creates policy association', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      // When
      const result = await store.create(mockPolicyInput);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-policy-associations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        countryId: 'us',
        label: 'Test Policy',
      });
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.create(mockPolicyInput)).rejects.toThrow(
        'Failed to create policy association'
      );
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then fetches user policy associations', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockApiResponse],
      });

      // When
      const result = await store.findByUser('user-123');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-policy-associations/user/user-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        countryId: 'us',
        label: 'Test Policy',
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
      const result = await store.findById('user-123', 'policy-456');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/api/user-policy-associations/user-123/policy-456',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        countryId: 'us',
        label: 'Test Policy',
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
      await expect(store.findById('user-123', 'policy-456')).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });
});

describe('LocalStoragePolicyStore', () => {
  let store: LocalStoragePolicyStore;
  let mockLocalStorage: { [key: string]: string };

  const mockPolicyInput1: Omit<UserPolicy, 'id' | 'createdAt'> = {
    userId: 'user-123',
    policyId: 'policy-456',
    countryId: 'us',
    label: 'Test Policy 1',
    isCreated: true,
  };

  const mockPolicyInput2: Omit<UserPolicy, 'id' | 'createdAt'> = {
    userId: 'user-123',
    policyId: 'policy-789',
    countryId: 'us',
    label: 'Test Policy 2',
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

    store = new LocalStoragePolicyStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given new policy then stores in localStorage', async () => {
      // When
      const result = await store.create(mockPolicyInput1);

      // Then
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        label: 'Test Policy 1',
      });
      expect(result.id).toBe('policy-456');
      expect(result.createdAt).toBeDefined();
      expect(result.isCreated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('given duplicate policy then throws error', async () => {
      // Given
      await store.create(mockPolicyInput1);

      // When/Then
      await expect(store.create(mockPolicyInput1)).rejects.toThrow('Association already exists');
    });
  });

  describe('findByUser', () => {
    it('given user with policies then returns all user policies', async () => {
      // Given
      await store.create(mockPolicyInput1);
      await store.create(mockPolicyInput2);

      // When
      const result = await store.findByUser('user-123');

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].policyId).toBe('policy-456');
      expect(result[1].policyId).toBe('policy-789');
    });

    it('given user with no policies then returns empty array', async () => {
      // When
      const result = await store.findByUser('nonexistent-user');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('given existing policy then returns it', async () => {
      // Given
      await store.create(mockPolicyInput1);

      // When
      const result = await store.findById('user-123', 'policy-456');

      // Then
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
      });
    });

    it('given nonexistent policy then returns null', async () => {
      // When
      const result = await store.findById('user-123', 'nonexistent');

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
      const result = await store.findByUser('user-123');

      // Then
      expect(result).toEqual([]);
    });
  });
});
