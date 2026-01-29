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
    label: 'Test Policy',
    isCreated: true,
  };

  const mockApiResponse = {
    id: 'user-policy-abc123',
    user_id: 'user-123',
    policy_id: 'policy-456',
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
        '/user-policies/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        label: 'Test Policy',
      });
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
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
        '/user-policies/?user_id=user-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
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
    it('given valid userPolicyId then fetches specific association', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      });

      // When
      const result = await store.findById('user-policy-abc123');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/user-policies/user-policy-abc123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
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
      const result = await store.findById('nonexistent-id');

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
      await expect(store.findById('user-policy-abc123')).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });

  describe('update', () => {
    it('given valid update then sends PATCH request', async () => {
      // Given
      const updatedResponse = {
        ...mockApiResponse,
        label: 'Updated Label',
        updated_at: '2025-01-02T00:00:00Z',
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => updatedResponse,
      });

      // When
      const result = await store.update('user-policy-abc123', { label: 'Updated Label' });

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/user-policies/user-policy-abc123',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.label).toBe('Updated Label');
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.update('user-policy-abc123', { label: 'Updated Label' })).rejects.toThrow(
        'Failed to update policy association'
      );
    });
  });

  describe('delete', () => {
    it('given valid userPolicyId then sends DELETE request', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 204,
      });

      // When
      await store.delete('user-policy-abc123');

      // Then
      expect(fetch).toHaveBeenCalledWith(
        '/user-policies/user-policy-abc123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('given API error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // When/Then
      await expect(store.delete('user-policy-abc123')).rejects.toThrow(
        'Failed to delete association'
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
    label: 'Test Policy 1',
    isCreated: true,
  };

  const mockPolicyInput2: Omit<UserPolicy, 'id' | 'createdAt'> = {
    userId: 'user-123',
    policyId: 'policy-789',
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
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^sup-/);
      expect(result.createdAt).toBeDefined();
      expect(result.isCreated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('given duplicate policy then creates new association with unique ID', async () => {
      // Given
      const first = await store.create(mockPolicyInput1);

      // When
      const second = await store.create(mockPolicyInput1);

      // Then
      expect(second).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
        label: 'Test Policy 1',
      });
      expect(second.id).toBeDefined();
      expect(second.id).not.toBe(first.id);
      expect(second.id).toMatch(/^sup-/);
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
    it('given existing policy then returns it by userPolicyId', async () => {
      // Given
      const created = await store.create(mockPolicyInput1);

      // When
      const result = await store.findById(created.id!);

      // Then
      expect(result).toMatchObject({
        userId: 'user-123',
        policyId: 'policy-456',
      });
    });

    it('given nonexistent userPolicyId then returns null', async () => {
      // When
      const result = await store.findById('sup-nonexistent');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('given existing policy then update succeeds and returns updated policy', async () => {
      // Given
      const created = await store.create(mockPolicyInput1);

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.policyId).toBe(mockPolicyInput1.policyId);
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent policy then update throws error', async () => {
      // Given - no policy created

      // When & Then
      await expect(store.update('sup-nonexistent', { label: 'Updated Label' })).rejects.toThrow(
        'UserPolicy with id sup-nonexistent not found'
      );
    });

    it('given existing policy then updatedAt timestamp is set', async () => {
      // Given
      const created = await store.create(mockPolicyInput1);
      const beforeUpdate = new Date().toISOString();

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt! >= beforeUpdate).toBe(true);
    });

    it('given existing policy then update persists to localStorage', async () => {
      // Given
      const created = await store.create(mockPolicyInput1);

      // When
      await store.update(created.id!, { label: 'Updated Label' });

      // Then
      const persisted = await store.findById(created.id!);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple policies then updates correct one by ID', async () => {
      // Given
      const created1 = await store.create(mockPolicyInput1);
      const created2 = await store.create(mockPolicyInput2);

      // When
      await store.update(created1.id!, { label: 'Updated Label' });

      // Then
      const updated = await store.findById(created1.id!);
      const unchanged = await store.findById(created2.id!);
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(mockPolicyInput2.label);
    });

    it('given update with partial data then only specified fields are updated', async () => {
      // Given
      const created = await store.create(mockPolicyInput1);

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.policyId).toBe(mockPolicyInput1.policyId); // unchanged
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

    it('given localStorage parse error then logs error with context', async () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (localStorage.getItem as any).mockReturnValue('invalid json {{{');

      // When
      const result = await store.findByUser('user-123');

      // Then
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LocalStoragePolicyStore.getStoredPolicies]'),
        expect.any(Error)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse stored policies'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('given localStorage parse error then error message mentions data corruption', async () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (localStorage.getItem as any).mockReturnValue('not valid json');

      // When
      await store.findByUser('user-123');

      // Then
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data may be corrupted'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
