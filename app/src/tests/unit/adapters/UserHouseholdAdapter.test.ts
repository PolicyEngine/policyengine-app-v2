import { describe, expect, test } from 'vitest';
import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import {
  ASSOCIATION_IDS,
  householdItem,
  LEGACY_IDS,
  PE_USER_ID,
} from '@/tests/fixtures/api/v2UserMocks';

describe('UserHouseholdAdapter', () => {
  test('given a household association then the creation payload carries legacy_household_id', () => {
    expect(
      UserHouseholdAdapter.toCreationPayload(
        { householdId: String(LEGACY_IDS.HOUSEHOLD), label: 'Family' },
        'us'
      )
    ).toEqual({ country_id: 'us', legacy_household_id: LEGACY_IDS.HOUSEHOLD, name: 'Family' });
  });

  test('given a replacement household then the patch repoints legacy_household_id', () => {
    expect(UserHouseholdAdapter.toUpdatePayload({ householdId: '456' })).toEqual({
      legacy_household_id: 456,
    });
  });

  test('given an API item then it maps to a household population', () => {
    expect(UserHouseholdAdapter.fromApiItem(householdItem({ name: 'Family' }))).toMatchObject({
      type: 'household',
      id: ASSOCIATION_IDS.HOUSEHOLD,
      userId: PE_USER_ID,
      householdId: String(LEGACY_IDS.HOUSEHOLD),
      label: 'Family',
      isCreated: true,
    });
  });
});
