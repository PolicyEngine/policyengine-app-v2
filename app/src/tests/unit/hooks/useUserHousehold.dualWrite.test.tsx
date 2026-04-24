import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createHousehold } from '@/api/household';
import { createHouseholdV2 } from '@/api/v2';
import {
  createUserHouseholdAssociationV2,
  updateUserHouseholdAssociationV2,
} from '@/api/v2/userHouseholdAssociations';
import { ENTITY_MIGRATION_MODE } from '@/config/migrationMode';
import {
  getHouseholdWriteConfig,
  useCreateHouseholdAssociation,
  useUpdateHouseholdAssociation,
} from '@/hooks/useUserHousehold';
import { getV2Id, setV2Id } from '@/libs/migration/idMapping';
import { Household as HouseholdModel } from '@/models/Household';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import { createMockHouseholdData } from '@/tests/fixtures/models/shared';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

const TEST_USER_ID = 'anonymous';
const TEST_COUNTRY_ID = 'us' as const;
const TEST_LABEL = 'Saved household';
const TEST_V1_ASSOC_ID = 'suh-abc123';
const TEST_OLD_V1_HOUSEHOLD_ID = '456';
const TEST_NEW_V1_HOUSEHOLD_ID = '789';
const TEST_V2_ASSOC_ID = 'dd0e8400-e29b-41d4-a716-446655440008';
const TEST_OLD_V2_HOUSEHOLD_ID = '770e8400-e29b-41d4-a716-446655440002';
const TEST_NEW_V2_HOUSEHOLD_ID = '770e8400-e29b-41d4-a716-446655440099';
const TEST_V2_USER_ID = 'c93a763d-8d9f-4ab8-b04f-2fbba0183f35';
const DEFAULT_HOUSEHOLD_MIGRATION_MODE = ENTITY_MIGRATION_MODE.households;

const initialAssociation: UserHouseholdPopulation = {
  type: 'household',
  id: TEST_V1_ASSOC_ID,
  userId: TEST_USER_ID,
  householdId: TEST_OLD_V1_HOUSEHOLD_ID,
  countryId: TEST_COUNTRY_ID,
  label: TEST_LABEL,
  createdAt: '2026-04-09T12:00:00Z',
  isCreated: true,
};

const renamedAssociation: UserHouseholdPopulation = {
  ...initialAssociation,
  label: 'Renamed household',
  updatedAt: '2026-04-09T12:10:00Z',
};

const replacedAssociation: UserHouseholdPopulation = {
  ...initialAssociation,
  householdId: TEST_NEW_V1_HOUSEHOLD_ID,
  updatedAt: '2026-04-09T12:20:00Z',
};

const nextHousehold: AppHouseholdInputEnvelope = {
  countryId: TEST_COUNTRY_ID,
  householdData: createMockHouseholdData({
    id: 'draft-replacement',
    countryId: TEST_COUNTRY_ID,
    label: TEST_LABEL,
  }).data,
};

const { mockStoreCreate, mockStoreUpdate, mockStoreFindByUser, mockStoreFindById } = vi.hoisted(
  () => ({
    mockStoreCreate: vi.fn(),
    mockStoreUpdate: vi.fn(),
    mockStoreFindByUser: vi.fn().mockResolvedValue([]),
    mockStoreFindById: vi.fn().mockResolvedValue(null),
  })
);

vi.mock('@/api/householdAssociation', () => ({
  ApiHouseholdStore: vi.fn().mockImplementation(() => ({
    create: mockStoreCreate,
    update: mockStoreUpdate,
    findByUser: mockStoreFindByUser,
    findById: mockStoreFindById,
  })),
  LocalStorageHouseholdStore: vi.fn().mockImplementation(() => ({
    create: mockStoreCreate,
    update: mockStoreUpdate,
    findByUser: mockStoreFindByUser,
    findById: mockStoreFindById,
  })),
}));

vi.mock('@/api/household', () => ({
  fetchHouseholdById: vi.fn(),
  createHousehold: vi.fn(),
}));

vi.mock('@/api/v2', () => ({
  createHouseholdV2: vi.fn(),
}));

vi.mock('@/api/v2/userHouseholdAssociations', () => ({
  createUserHouseholdAssociationV2: vi.fn(),
  updateUserHouseholdAssociationV2: vi.fn(),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

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

describe('getHouseholdWriteConfig', () => {
  beforeEach(() => {
    ENTITY_MIGRATION_MODE.households = DEFAULT_HOUSEHOLD_MIGRATION_MODE;
  });

  test('given v1-only mode then it disables v2 shadowing', () => {
    ENTITY_MIGRATION_MODE.households = 'v1_only';

    expect(getHouseholdWriteConfig('test').shouldShadowV2).toBe(false);
  });

  test('given v1-primary-v2-shadow mode then it enables v2 shadowing', () => {
    ENTITY_MIGRATION_MODE.households = 'v1_primary_v2_shadow';

    expect(getHouseholdWriteConfig('test').shouldShadowV2).toBe(true);
  });

  test('given duplicate-shadow skip option then it disables only the association shadow', () => {
    ENTITY_MIGRATION_MODE.households = 'v1_primary_v2_shadow';

    expect(getHouseholdWriteConfig('test', { skipDuplicateV2AssociationShadow: true })).toEqual({
      shouldShadowV2: false,
    });
  });

  test('given unsupported household mode then it fails fast clearly', () => {
    ENTITY_MIGRATION_MODE.households = 'v2_only';

    expect(() => getHouseholdWriteConfig('test')).toThrow(
      '[MigrationMode] Unsupported mode "v2_only" for households in test. Supported modes: v1_only, v1_primary_v2_shadow'
    );
  });
});

describe('useCreateHouseholdAssociation dual-write', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    ENTITY_MIGRATION_MODE.households = DEFAULT_HOUSEHOLD_MIGRATION_MODE;
    queryClient = createQueryClient();

    setV2Id('User', TEST_USER_ID, TEST_V2_USER_ID);
    setV2Id('Household', TEST_OLD_V1_HOUSEHOLD_ID, TEST_OLD_V2_HOUSEHOLD_ID);

    mockStoreCreate.mockResolvedValue(initialAssociation);
    vi.mocked(createUserHouseholdAssociationV2).mockResolvedValue({
      ...initialAssociation,
      userId: TEST_V2_USER_ID,
      householdId: TEST_OLD_V2_HOUSEHOLD_ID,
      id: TEST_V2_ASSOC_ID,
    });
  });

  test('given v1-primary-v2-shadow mode then direct create shadows the v2 association', async () => {
    const { result } = renderHook(() => useCreateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: TEST_USER_ID,
        householdId: TEST_OLD_V1_HOUSEHOLD_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    await waitFor(() => {
      expect(createUserHouseholdAssociationV2).toHaveBeenCalledWith({
        userId: TEST_V2_USER_ID,
        householdId: TEST_OLD_V2_HOUSEHOLD_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });
  });

  test('given v1-only mode then direct create skips the v2 association shadow', async () => {
    ENTITY_MIGRATION_MODE.households = 'v1_only';

    const { result } = renderHook(() => useCreateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: TEST_USER_ID,
        householdId: TEST_OLD_V1_HOUSEHOLD_ID,
        countryId: TEST_COUNTRY_ID,
        label: TEST_LABEL,
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(createUserHouseholdAssociationV2).not.toHaveBeenCalled();
  });

  test('given unsupported household mode then create hook fails fast', () => {
    ENTITY_MIGRATION_MODE.households = 'v2_only';

    expect(() =>
      renderHook(() => useCreateHouseholdAssociation(), {
        wrapper: createWrapper(queryClient),
      })
    ).toThrow(
      '[MigrationMode] Unsupported mode "v2_only" for households in useCreateHouseholdAssociation. Supported modes: v1_only, v1_primary_v2_shadow'
    );
  });
});

describe('useUpdateHouseholdAssociation dual-write', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    ENTITY_MIGRATION_MODE.households = DEFAULT_HOUSEHOLD_MIGRATION_MODE;
    queryClient = createQueryClient();

    setV2Id('User', TEST_USER_ID, TEST_V2_USER_ID);
    setV2Id('UserHousehold', TEST_V1_ASSOC_ID, TEST_V2_ASSOC_ID);
    setV2Id('Household', TEST_OLD_V1_HOUSEHOLD_ID, TEST_OLD_V2_HOUSEHOLD_ID);

    vi.mocked(updateUserHouseholdAssociationV2).mockResolvedValue({
      ...renamedAssociation,
      userId: TEST_V2_USER_ID,
      householdId: TEST_OLD_V2_HOUSEHOLD_ID,
      id: TEST_V2_ASSOC_ID,
    });
    vi.mocked(createUserHouseholdAssociationV2).mockResolvedValue({
      ...initialAssociation,
      userId: TEST_V2_USER_ID,
      householdId: TEST_OLD_V2_HOUSEHOLD_ID,
      id: TEST_V2_ASSOC_ID,
    });
  });

  test('given label-only edit then it updates the existing v2 association without creating a new household', async () => {
    mockStoreUpdate.mockResolvedValue(renamedAssociation);

    const { result } = renderHook(() => useUpdateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userHouseholdId: TEST_V1_ASSOC_ID,
        updates: { label: 'Renamed household' },
      });
    });

    expect(createHousehold).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(
        TEST_V2_ASSOC_ID,
        TEST_V2_USER_ID,
        {
          label: 'Renamed household',
          householdId: TEST_OLD_V2_HOUSEHOLD_ID,
        }
      );
    });
  });

  test('given v1-only mode then label-only edit skips the v2 shadow update', async () => {
    ENTITY_MIGRATION_MODE.households = 'v1_only';
    mockStoreUpdate.mockResolvedValue(renamedAssociation);

    const { result } = renderHook(() => useUpdateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userHouseholdId: TEST_V1_ASSOC_ID,
        updates: { label: 'Renamed household' },
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(updateUserHouseholdAssociationV2).not.toHaveBeenCalled();
  });

  test('given content edit then it creates a new base household and preserves the association id', async () => {
    mockStoreUpdate.mockResolvedValue(replacedAssociation);
    vi.mocked(createHousehold).mockResolvedValue({
      result: { household_id: TEST_NEW_V1_HOUSEHOLD_ID },
    });
    vi.mocked(createHouseholdV2).mockResolvedValue({
      ...HouseholdModel.fromDraft({
        countryId: TEST_COUNTRY_ID,
        householdData: nextHousehold.householdData,
        label: TEST_LABEL,
      }).toV2CreateEnvelope(),
      id: TEST_NEW_V2_HOUSEHOLD_ID,
      created_at: '2026-04-09T12:20:00Z',
      updated_at: '2026-04-09T12:20:00Z',
    });
    vi.mocked(updateUserHouseholdAssociationV2).mockResolvedValue({
      ...replacedAssociation,
      userId: TEST_V2_USER_ID,
      householdId: TEST_NEW_V2_HOUSEHOLD_ID,
      id: TEST_V2_ASSOC_ID,
    });

    const { result } = renderHook(() => useUpdateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    let updatedAssociation: UserHouseholdPopulation | undefined;
    await act(async () => {
      updatedAssociation = await result.current.mutateAsync({
        userHouseholdId: TEST_V1_ASSOC_ID,
        association: initialAssociation,
        updates: {},
        nextHousehold,
      });
    });

    expect(createHousehold).toHaveBeenCalledWith(
      expect.objectContaining({
        country_id: TEST_COUNTRY_ID,
      })
    );
    expect(mockStoreUpdate).toHaveBeenCalledWith(TEST_V1_ASSOC_ID, {
      householdId: TEST_NEW_V1_HOUSEHOLD_ID,
    });
    expect(updatedAssociation).toEqual(
      expect.objectContaining({
        id: TEST_V1_ASSOC_ID,
        householdId: TEST_NEW_V1_HOUSEHOLD_ID,
      })
    );

    await waitFor(() => {
      expect(createHouseholdV2).toHaveBeenCalledTimes(1);
    });
    expect(createUserHouseholdAssociationV2).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(
        TEST_V2_ASSOC_ID,
        TEST_V2_USER_ID,
        {
          label: TEST_LABEL,
          householdId: TEST_NEW_V2_HOUSEHOLD_ID,
        }
      );
    });

    expect(getV2Id('Household', TEST_NEW_V1_HOUSEHOLD_ID)).toBe(TEST_NEW_V2_HOUSEHOLD_ID);
    expect(getV2Id('UserHousehold', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
  });

  test('given v1-only mode then content edit skips the v2 replacement shadow', async () => {
    ENTITY_MIGRATION_MODE.households = 'v1_only';
    mockStoreUpdate.mockResolvedValue(replacedAssociation);
    vi.mocked(createHousehold).mockResolvedValue({
      result: { household_id: TEST_NEW_V1_HOUSEHOLD_ID },
    });

    const { result } = renderHook(() => useUpdateHouseholdAssociation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userHouseholdId: TEST_V1_ASSOC_ID,
        association: initialAssociation,
        updates: {},
        nextHousehold,
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(createHouseholdV2).not.toHaveBeenCalled();
    expect(createUserHouseholdAssociationV2).not.toHaveBeenCalled();
    expect(updateUserHouseholdAssociationV2).not.toHaveBeenCalled();
  });

  test('given unsupported household mode then update hook fails fast', () => {
    ENTITY_MIGRATION_MODE.households = 'v2_only';

    expect(() =>
      renderHook(() => useUpdateHouseholdAssociation(), {
        wrapper: createWrapper(queryClient),
      })
    ).toThrow(
      '[MigrationMode] Unsupported mode "v2_only" for households in useUpdateHouseholdAssociation. Supported modes: v1_only, v1_primary_v2_shadow'
    );
  });
});
