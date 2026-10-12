import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStoragePolicyStore } from '@/api/policyAssociation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

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
      const persisted = await store.findById(mockPolicyInput1.userId, mockPolicyInput1.policyId);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple policies then updates correct one by ID', async () => {
      // Given
      const created1 = await store.create(mockPolicyInput1);
      await store.create(mockPolicyInput2);

      // When
      await store.update(created1.id!, { label: 'Updated Label' });

      // Then
      const updated = await store.findById(mockPolicyInput1.userId, mockPolicyInput1.policyId);
      const unchanged = await store.findById(mockPolicyInput2.userId, mockPolicyInput2.policyId);
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
      expect(result.countryId).toBe(mockPolicyInput1.countryId); // unchanged
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
