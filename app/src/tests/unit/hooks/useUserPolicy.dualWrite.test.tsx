import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as v2PolicyApi from '@/api/v2/userPolicyAssociations';
import { useCreatePolicyAssociation, useUpdatePolicyAssociation } from '@/hooks/useUserPolicy';
import * as comparisonLogger from '@/libs/migration/comparisonLogger';
import * as idMapping from '@/libs/migration/idMapping';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

// ============================================================================
// Constants
// ============================================================================

const TEST_USER_ID = 'anonymous';
const TEST_POLICY_ID = 'policy-42';
const TEST_COUNTRY_ID = 'us' as const;
const TEST_LABEL = 'My reform';
const TEST_V1_ASSOC_ID = 'sup-abc123';
const TEST_V2_ASSOC_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_V2_POLICY_ID = '6f52cd3e-3f6f-4d13-9b0f-f2a7ad460d9d';
const TEST_V2_USER_ID = 'c93a763d-8d9f-4ab8-b04f-2fbba0183f35';

// ============================================================================
// Mock data
// ============================================================================

const mockV1CreateResult: UserPolicy = {
  id: TEST_V1_ASSOC_ID,
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_ID,
  countryId: TEST_COUNTRY_ID,
  label: TEST_LABEL,
  createdAt: '2026-04-02T12:00:00Z',
  isCreated: true,
};

const mockV2CreateResult: UserPolicy = {
  id: TEST_V2_ASSOC_ID,
  userId: TEST_V2_USER_ID,
  policyId: TEST_V2_POLICY_ID,
  countryId: TEST_COUNTRY_ID,
  label: TEST_LABEL,
  createdAt: '2026-04-02T12:00:01Z',
  isCreated: true,
};

const mockV1UpdateResult: UserPolicy = {
  id: TEST_V1_ASSOC_ID,
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_ID,
  countryId: TEST_COUNTRY_ID,
  label: 'Renamed policy',
  createdAt: '2026-04-02T12:00:00Z',
  updatedAt: '2026-04-02T13:00:00Z',
  isCreated: true,
};

const mockV2UpdateResult: UserPolicy = {
  id: TEST_V2_ASSOC_ID,
  userId: TEST_V2_USER_ID,
  policyId: TEST_V2_POLICY_ID,
  countryId: TEST_COUNTRY_ID,
  label: 'Renamed policy',
  createdAt: '2026-04-02T12:00:01Z',
  updatedAt: '2026-04-02T13:00:01Z',
  isCreated: true,
};

// ============================================================================
// Mocks
// ============================================================================

// vi.hoisted ensures these are available when vi.mock factories run (hoisted above imports)
const { mockStoreCreate, mockStoreUpdate, mockStoreFindByUser, mockStoreFindById } = vi.hoisted(
  () => ({
    mockStoreCreate: vi.fn(),
    mockStoreUpdate: vi.fn(),
    mockStoreFindByUser: vi.fn().mockResolvedValue([]),
    mockStoreFindById: vi.fn().mockResolvedValue(null),
  })
);

// Mock the localStorage store (primary v1 path).
// useUserPolicy.ts creates singletons at module scope, so the mock
// constructor must return the same shared method references.
vi.mock('@/api/policyAssociation', () => ({
  ApiPolicyStore: vi.fn().mockImplementation(() => ({
    create: mockStoreCreate,
    update: mockStoreUpdate,
    findByUser: mockStoreFindByUser,
    findById: mockStoreFindById,
  })),
  LocalStoragePolicyStore: vi.fn().mockImplementation(() => ({
    create: mockStoreCreate,
    update: mockStoreUpdate,
    findByUser: mockStoreFindByUser,
    findById: mockStoreFindById,
  })),
}));

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

// ============================================================================
// Helpers
// ============================================================================

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('useCreatePolicyAssociation dual-write', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    localStorage.clear();
    idMapping.setV2Id('Policy', TEST_POLICY_ID, TEST_V2_POLICY_ID);
    idMapping.setV2Id('User', TEST_USER_ID, TEST_V2_USER_ID);
    queryClient = createQueryClient();
  });

  test('given successful create then shadow writes to v2 API', async () => {
    // Given
    mockStoreCreate.mockResolvedValue(mockV1CreateResult);

    const v2CreateSpy = vi
      .spyOn(v2PolicyApi, 'createUserPolicyAssociationV2')
      .mockResolvedValue(mockV2CreateResult);

    const { result } = renderHook(() => useCreatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    await act(async () => {
      await result.current.mutateAsync({
        userId: TEST_USER_ID,
        policyId: TEST_POLICY_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    // Then — v2 API was called
    await waitFor(() => {
      expect(v2CreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_V2_USER_ID,
          policyId: TEST_V2_POLICY_ID,
          countryId: TEST_COUNTRY_ID,
          label: TEST_LABEL,
        })
      );
    });
  });

  test('given successful shadow write then stores ID mapping', async () => {
    // Given
    mockStoreCreate.mockResolvedValue(mockV1CreateResult);

    vi.spyOn(v2PolicyApi, 'createUserPolicyAssociationV2').mockResolvedValue(mockV2CreateResult);
    const { result } = renderHook(() => useCreatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    await act(async () => {
      await result.current.mutateAsync({
        userId: TEST_USER_ID,
        policyId: TEST_POLICY_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    // Then
    await waitFor(() => {
      expect(idMapping.getV2Id('UserPolicy', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
    });
  });

  test('given successful shadow write then logs comparison', async () => {
    // Given
    mockStoreCreate.mockResolvedValue(mockV1CreateResult);

    vi.spyOn(v2PolicyApi, 'createUserPolicyAssociationV2').mockResolvedValue(mockV2CreateResult);
    const logSpy = vi.spyOn(comparisonLogger, 'logMigrationComparison');

    const { result } = renderHook(() => useCreatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    await act(async () => {
      await result.current.mutateAsync({
        userId: TEST_USER_ID,
        policyId: TEST_POLICY_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    // Then
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        'UserPolicyMigration',
        'CREATE',
        expect.any(Object),
        expect.any(Object),
        { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
      );
    });
  });

  test('given v2 API failure then primary create still succeeds', async () => {
    // Given
    mockStoreCreate.mockResolvedValue(mockV1CreateResult);

    vi.spyOn(v2PolicyApi, 'createUserPolicyAssociationV2').mockRejectedValue(
      new Error('v2 API unreachable')
    );
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const { result } = renderHook(() => useCreatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    let v1Result: UserPolicy | undefined;
    await act(async () => {
      v1Result = await result.current.mutateAsync({
        userId: TEST_USER_ID,
        policyId: TEST_POLICY_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    // Then — primary path succeeded
    expect(v1Result).toEqual(mockV1CreateResult);

    // And — failure was logged, not thrown
    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UserPolicyMigration] Shadow v2 create failed'),
        expect.any(Error)
      );
    });
  });
});

describe('useUpdatePolicyAssociation dual-write', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    localStorage.clear();
    queryClient = createQueryClient();
  });

  test('given mapped v2 ID then shadow updates v2 API', async () => {
    // Given — pre-seed the ID mapping
    idMapping.setV2Id('UserPolicy', TEST_V1_ASSOC_ID, TEST_V2_ASSOC_ID);
    idMapping.setV2Id('User', TEST_USER_ID, TEST_V2_USER_ID);
    mockStoreUpdate.mockResolvedValue(mockV1UpdateResult);

    const v2UpdateSpy = vi
      .spyOn(v2PolicyApi, 'updateUserPolicyAssociationV2')
      .mockResolvedValue(mockV2UpdateResult);

    const { result } = renderHook(() => useUpdatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    await act(async () => {
      await result.current.mutateAsync({
        userPolicyId: TEST_V1_ASSOC_ID,
        updates: { label: 'Renamed policy' },
      });
    });

    // Then
    await waitFor(() => {
      expect(v2UpdateSpy).toHaveBeenCalledWith(TEST_V2_ASSOC_ID, TEST_V2_USER_ID, {
        label: 'Renamed policy',
      });
    });
  });

  test('given no mapped v2 ID then skips shadow update', async () => {
    // Given — NO ID mapping
    mockStoreUpdate.mockResolvedValue(mockV1UpdateResult);

    const v2UpdateSpy = vi.spyOn(v2PolicyApi, 'updateUserPolicyAssociationV2');

    const { result } = renderHook(() => useUpdatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    await act(async () => {
      await result.current.mutateAsync({
        userPolicyId: TEST_V1_ASSOC_ID,
        updates: { label: 'Renamed policy' },
      });
    });

    // Then — v2 API was NOT called
    // Wait a tick to ensure the onSuccess had time to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(v2UpdateSpy).not.toHaveBeenCalled();
  });

  test('given v2 update failure then primary update still succeeds', async () => {
    // Given
    idMapping.setV2Id('UserPolicy', TEST_V1_ASSOC_ID, TEST_V2_ASSOC_ID);
    idMapping.setV2Id('User', TEST_USER_ID, TEST_V2_USER_ID);
    mockStoreUpdate.mockResolvedValue(mockV1UpdateResult);

    vi.spyOn(v2PolicyApi, 'updateUserPolicyAssociationV2').mockRejectedValue(
      new Error('v2 update failed')
    );
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdatePolicyAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    // When
    let v1Result: UserPolicy | undefined;
    await act(async () => {
      v1Result = await result.current.mutateAsync({
        userPolicyId: TEST_V1_ASSOC_ID,
        updates: { label: 'Renamed policy' },
      });
    });

    // Then — primary path succeeded
    expect(v1Result).toEqual(mockV1UpdateResult);

    // And — failure was logged
    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UserPolicyMigration] Shadow v2 update failed'),
        expect.any(Error)
      );
    });
  });
});
