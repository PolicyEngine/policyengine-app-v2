import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createHouseholdV2 } from '@/api/v2';
import {
  createUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationByIdV2,
  updateUserHouseholdAssociationV2,
} from '@/api/v2/userHouseholdAssociations';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';
import {
  shadowCreateHouseholdAndAssociation,
  shadowUpdateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { getV2Id, setV2Id } from '@/libs/migration/idMapping';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import { Household } from '@/models/Household';
import {
  createMockHouseholdData,
  createMockHouseholdV2Response,
} from '@/tests/fixtures/models/shared';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

vi.mock('@/api/v2', () => ({
  createHouseholdV2: vi.fn(),
}));

vi.mock('@/api/v2/userHouseholdAssociations', () => ({
  createUserHouseholdAssociationV2: vi.fn(),
  fetchUserHouseholdAssociationByIdV2: vi.fn(),
  updateUserHouseholdAssociationV2: vi.fn(),
}));

vi.mock('@/libs/migration/comparisonLogger', () => ({
  logMigrationComparison: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogTransport', () => ({
  sendMigrationLog: vi.fn(),
}));

const TEST_COUNTRY_ID = 'us' as const;
const TEST_V1_HOUSEHOLD_ID = '456';
const TEST_V2_HOUSEHOLD_ID = '770e8400-e29b-41d4-a716-446655440002';
const TEST_V1_USER_ID = 'anonymous';
const TEST_V2_USER_ID = 'c93a763d-8d9f-4ab8-b04f-2fbba0183f35';
const TEST_V1_ASSOC_ID = 'suh-abc123';
const TEST_V2_ASSOC_ID = 'dd0e8400-e29b-41d4-a716-446655440008';

const v1HouseholdData = createMockHouseholdData({
  id: TEST_V1_HOUSEHOLD_ID,
  countryId: TEST_COUNTRY_ID,
  label: 'My household',
});

const v1Household = Household.fromCanonicalInput({
  id: v1HouseholdData.id,
  countryId: v1HouseholdData.countryId,
  label: v1HouseholdData.label,
  year: v1HouseholdData.year,
  householdData: v1HouseholdData.data,
});

const v1Association: UserHouseholdPopulation = {
  type: 'household',
  id: TEST_V1_ASSOC_ID,
  userId: TEST_V1_USER_ID,
  householdId: TEST_V1_HOUSEHOLD_ID,
  countryId: TEST_COUNTRY_ID,
  label: 'My household',
  createdAt: '2026-04-09T12:00:00Z',
  isCreated: true,
};

describe('householdShadow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    localStorage.clear();
    setV2Id('User', TEST_V1_USER_ID, TEST_V2_USER_ID);

    vi.mocked(createHouseholdV2).mockResolvedValue(
      createMockHouseholdV2Response({
        id: TEST_V2_HOUSEHOLD_ID,
        country_id: TEST_COUNTRY_ID,
        label: 'My household',
      })
    );
    vi.mocked(createUserHouseholdAssociationV2).mockResolvedValue({
      id: TEST_V2_ASSOC_ID,
      type: 'household',
      userId: TEST_V2_USER_ID,
      householdId: TEST_V2_HOUSEHOLD_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My household',
      createdAt: '2026-04-09T12:00:01Z',
      updatedAt: '2026-04-09T12:00:01Z',
      isCreated: true,
    });
    vi.mocked(updateUserHouseholdAssociationV2).mockResolvedValue({
      id: TEST_V2_ASSOC_ID,
      type: 'household',
      userId: TEST_V2_USER_ID,
      householdId: TEST_V2_HOUSEHOLD_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My household',
      createdAt: '2026-04-09T12:00:01Z',
      updatedAt: '2026-04-09T12:00:02Z',
      isCreated: true,
    });
    vi.mocked(fetchUserHouseholdAssociationByIdV2).mockResolvedValue(null);
  });

  test('given successful v2 household create then it stores household and user-household mappings', async () => {
    await shadowCreateHouseholdAndAssociation({
      v1HouseholdId: TEST_V1_HOUSEHOLD_ID,
      v1Household,
      v1Association,
    });

    expect(createHouseholdV2).toHaveBeenCalledWith(
      expect.objectContaining({
        country_id: TEST_COUNTRY_ID,
        year: 2026,
      })
    );
    expect(createUserHouseholdAssociationV2).toHaveBeenCalledWith({
      userId: TEST_V2_USER_ID,
      householdId: TEST_V2_HOUSEHOLD_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My household',
    });
    expect(getV2Id('Household', TEST_V1_HOUSEHOLD_ID)).toBe(TEST_V2_HOUSEHOLD_ID);
    expect(getV2Id('UserHousehold', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
  });

  test('given successful shadow create then it logs household and user-household comparisons', async () => {
    await shadowCreateHouseholdAndAssociation({
      v1HouseholdId: TEST_V1_HOUSEHOLD_ID,
      v1Household,
      v1Association,
    });

    expect(logMigrationComparison).toHaveBeenCalledWith(
      'HouseholdMigration',
      'CREATE',
      expect.any(Object),
      expect.any(Object),
      { skipFields: ['id'] }
    );
    expect(logMigrationComparison).toHaveBeenCalledWith(
      'UserHouseholdMigration',
      'CREATE',
      expect.any(Object),
      expect.any(Object),
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  });

  test('given v2 household create fails then it logs and stays non-blocking', async () => {
    vi.mocked(createHouseholdV2).mockRejectedValue(new Error('v2 unavailable'));
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(
      shadowCreateHouseholdAndAssociation({
        v1HouseholdId: TEST_V1_HOUSEHOLD_ID,
        v1Household,
        v1Association,
      })
    ).resolves.toBeNull();

    expect(createUserHouseholdAssociationV2).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[HouseholdMigration] Shadow v2 household create failed'),
      expect.any(Error)
    );
    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'HouseholdMigration',
        operation: 'CREATE',
        status: 'FAILED',
      })
    );
  });

  test('given a multi-group household then it still shadow creates in v2', async () => {
    const multiGroupHousehold = Household.fromDraft({
      countryId: TEST_COUNTRY_ID,
      year: 2026,
      householdData: {
        people: {
          adult: { age: { 2026: 35 } },
          child: { age: { 2026: 8 } },
          childTwo: { age: { 2026: 6 } },
        },
        maritalUnits: {
          maritalUnit1: { members: ['adult'] },
          maritalUnit2: { members: ['child'] },
          maritalUnit3: { members: ['childTwo'] },
        },
      },
      label: 'Complex household',
      id: TEST_V1_HOUSEHOLD_ID,
    });

    await expect(
      shadowCreateHouseholdAndAssociation({
        v1HouseholdId: TEST_V1_HOUSEHOLD_ID,
        v1Household: multiGroupHousehold,
        v1Association,
      })
    ).resolves.toBe(TEST_V2_HOUSEHOLD_ID);

    expect(createHouseholdV2).toHaveBeenCalledWith(
      expect.objectContaining({
        marital_unit: [{ marital_unit_id: 0 }, { marital_unit_id: 1 }, { marital_unit_id: 2 }],
      })
    );
    expect(createUserHouseholdAssociationV2).toHaveBeenCalledTimes(1);
  });

  test('given mapped ids then it updates the existing v2 user-household association', async () => {
    setV2Id('Household', TEST_V1_HOUSEHOLD_ID, TEST_V2_HOUSEHOLD_ID);
    setV2Id('UserHousehold', TEST_V1_ASSOC_ID, TEST_V2_ASSOC_ID);

    await shadowUpdateUserHouseholdAssociation(v1Association);

    expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(TEST_V2_ASSOC_ID, {
      label: 'My household',
      householdId: TEST_V2_HOUSEHOLD_ID,
    });
    expect(logMigrationComparison).toHaveBeenCalledWith(
      'UserHouseholdMigration',
      'UPDATE',
      expect.any(Object),
      expect.any(Object),
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  });

  test('given missing association mapping but existing v2 association then it recovers the mapping and updates', async () => {
    setV2Id('Household', TEST_V1_HOUSEHOLD_ID, TEST_V2_HOUSEHOLD_ID);
    vi.mocked(fetchUserHouseholdAssociationByIdV2).mockResolvedValue({
      ...v1Association,
      id: TEST_V2_ASSOC_ID,
      userId: TEST_V2_USER_ID,
      householdId: TEST_V2_HOUSEHOLD_ID,
    });

    await shadowUpdateUserHouseholdAssociation(v1Association);

    expect(fetchUserHouseholdAssociationByIdV2).toHaveBeenCalledWith(
      TEST_V2_USER_ID,
      TEST_V2_HOUSEHOLD_ID
    );
    expect(getV2Id('UserHousehold', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
    expect(updateUserHouseholdAssociationV2).toHaveBeenCalledWith(TEST_V2_ASSOC_ID, {
      label: 'My household',
      householdId: TEST_V2_HOUSEHOLD_ID,
    });
  });

  test('given missing association mapping and no existing v2 association then it recreates the v2 association', async () => {
    setV2Id('Household', TEST_V1_HOUSEHOLD_ID, TEST_V2_HOUSEHOLD_ID);

    await shadowUpdateUserHouseholdAssociation(v1Association);

    expect(fetchUserHouseholdAssociationByIdV2).toHaveBeenCalledWith(
      TEST_V2_USER_ID,
      TEST_V2_HOUSEHOLD_ID
    );
    expect(createUserHouseholdAssociationV2).toHaveBeenCalledWith({
      userId: TEST_V2_USER_ID,
      householdId: TEST_V2_HOUSEHOLD_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My household',
    });
    expect(updateUserHouseholdAssociationV2).not.toHaveBeenCalled();
    expect(getV2Id('UserHousehold', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
  });

  test('given missing household mapping then it logs a skipped update instead of silently returning', async () => {
    await shadowUpdateUserHouseholdAssociation(v1Association);

    expect(fetchUserHouseholdAssociationByIdV2).not.toHaveBeenCalled();
    expect(updateUserHouseholdAssociationV2).not.toHaveBeenCalled();
    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'UserHouseholdMigration',
        operation: 'UPDATE',
        status: 'SKIPPED',
        message: 'Shadow v2 update skipped: missing mapped v2 household id',
      })
    );
  });
});
