import { describe, expect, test, vi } from 'vitest';
import { createHousehold } from '@/api/household';
import { replaceHouseholdBaseForAssociation } from '@/hooks/household/replaceHouseholdBaseForAssociation';
import {
  shadowCreateHousehold,
  shadowUpdateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { createMockHouseholdData } from '@/tests/fixtures/models/shared';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

vi.mock('@/api/household', () => ({
  createHousehold: vi.fn(),
}));

vi.mock('@/libs/migration/householdShadow', () => ({
  shadowCreateHousehold: vi.fn(),
  shadowUpdateUserHouseholdAssociation: vi.fn(),
}));

const TEST_COUNTRY_ID = 'us' as const;
const TEST_ASSOCIATION_ID = 'suh-abc123';
const TEST_CREATED_HOUSEHOLD_ID = '789';

const association: UserHouseholdPopulation = {
  type: 'household',
  id: TEST_ASSOCIATION_ID,
  userId: 'anonymous',
  householdId: '456',
  countryId: TEST_COUNTRY_ID,
  label: 'Saved household',
  createdAt: '2026-04-16T10:00:00Z',
  isCreated: true,
};

const nextHousehold = {
  countryId: TEST_COUNTRY_ID,
  householdData: createMockHouseholdData({
    id: 'draft-replacement',
    countryId: TEST_COUNTRY_ID,
    label: association.label,
  }).data,
};

describe('replaceHouseholdBaseForAssociation', () => {
  test('given v1 association update fails after create then it surfaces the orphaned household id and skips shadow writes', async () => {
    vi.mocked(createHousehold).mockResolvedValue({
      result: { household_id: TEST_CREATED_HOUSEHOLD_ID },
    });
    const store = {
      update: vi.fn().mockRejectedValue(new Error('local store unavailable')),
    };

    await expect(
      replaceHouseholdBaseForAssociation({
        association,
        nextHousehold,
        store,
      })
    ).rejects.toThrow(
      `Failed to update household association ${TEST_ASSOCIATION_ID} after creating replacement household ${TEST_CREATED_HOUSEHOLD_ID}. The replacement household may now be orphaned. Original error: local store unavailable`
    );

    expect(createHousehold).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenCalledWith(TEST_ASSOCIATION_ID, {
      householdId: TEST_CREATED_HOUSEHOLD_ID,
    });
    expect(shadowCreateHousehold).not.toHaveBeenCalled();
    expect(shadowUpdateUserHouseholdAssociation).not.toHaveBeenCalled();
  });
});
