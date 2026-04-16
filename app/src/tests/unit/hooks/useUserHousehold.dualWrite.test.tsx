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
import { useUpdateHouseholdAssociation } from '@/hooks/useUserHousehold';
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

describe('useUpdateHouseholdAssociation dual-write', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
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
      expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(TEST_V2_ASSOC_ID, {
        label: 'Renamed household',
        householdId: TEST_OLD_V2_HOUSEHOLD_ID,
      });
    });
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
      expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(TEST_V2_ASSOC_ID, {
        label: TEST_LABEL,
        householdId: TEST_NEW_V2_HOUSEHOLD_ID,
      });
    });

    expect(getV2Id('Household', TEST_NEW_V1_HOUSEHOLD_ID)).toBe(TEST_NEW_V2_HOUSEHOLD_ID);
    expect(getV2Id('UserHousehold', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
  });
});
